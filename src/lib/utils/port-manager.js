const { execSync } = require('child_process');
const net = require('net');
const fs = require('fs');
const path = require('path');

class PortManager {
  constructor(preferredPort = 3005, maxRetries = 10) {
    this.preferredPort = preferredPort;
    this.maxRetries = maxRetries;
    this.fallbackPorts = [3006, 3007, 3008, 3009, 3010];
    this.portLockFile = path.join(process.cwd(), '.port-lock');
  }

  isPortAvailable(port) {
    return new Promise((resolve) => {
      const server = net.createServer()
        .once('error', () => resolve(false))
        .once('listening', () => {
          server.close();
          resolve(true);
        })
        .listen(port);
    });
  }

  async findAvailablePort() {
    // Check if there's a locked port
    if (fs.existsSync(this.portLockFile)) {
      try {
        const lockedPort = parseInt(fs.readFileSync(this.portLockFile, 'utf8'));
        if (await this.isPortAvailable(lockedPort)) {
          return lockedPort;
        }
      } catch (e) {
        // Invalid or corrupted lock file
        fs.unlinkSync(this.portLockFile);
      }
    }

    // First try preferred port
    if (await this.isPortAvailable(this.preferredPort)) {
      this.lockPort(this.preferredPort);
      return this.preferredPort;
    }

    // Try fallback ports
    for (const port of this.fallbackPorts) {
      if (await this.isPortAvailable(port)) {
        this.lockPort(port);
        return port;
      }
    }

    // If no predefined ports are available, find a random available port
    return new Promise((resolve, reject) => {
      const server = net.createServer();
      server.listen(0, () => {
        const port = server.address().port;
        server.close(() => {
          this.lockPort(port);
          resolve(port);
        });
      });
      server.on('error', reject);
    });
  }

  lockPort(port) {
    try {
      fs.writeFileSync(this.portLockFile, port.toString());
    } catch (e) {
      console.warn('Failed to create port lock file:', e.message);
    }
  }

  killProcessOnPort(port) {
    if (process.platform === 'win32') {
      try {
        const result = execSync(`netstat -ano | findstr :${port}`).toString();
        const lines = result.split('\n').filter(Boolean);
        
        for (const line of lines) {
          const pid = line.match(/\s+(\d+)\s*$/)?.[1];
          if (pid) {
            try {
              execSync(`taskkill /F /PID ${pid} 2>nul`);
              console.log(`✓ Terminated process ${pid} on port ${port}`);
              // Double-check process is terminated
              setTimeout(() => {
                try {
                  process.kill(parseInt(pid), 0);
                  execSync(`taskkill /F /PID ${pid} /T 2>nul`); // Force terminate with tree
                } catch (e) {
                  // Process is gone
                }
              }, 500);
            } catch (e) {
              if (!e.message.includes('not found')) {
                console.error(`Failed to terminate process ${pid}:`, e.message);
              }
            }
          }
        }
      } catch (e) {
        if (!e.message.includes('no tasks')) {
          console.log(`No active process found on port ${port}`);
        }
      }
    } else {
      try {
        execSync(`lsof -i :${port} | grep LISTEN | awk '{print $2}' | xargs kill -9`);
        console.log(`✓ Terminated process on port ${port}`);
      } catch (e) {
        // Process might not exist
      }
    }
  }

  async ensurePortAvailable(port) {
    if (!(await this.isPortAvailable(port))) {
      console.log(`Port ${port} is in use. Attempting to free it...`);
      this.killProcessOnPort(port);
      
      // Wait for the port to become available with exponential backoff
      let retries = 5;
      let delay = 1000;
      while (retries > 0 && !(await this.isPortAvailable(port))) {
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
        retries--;
      }
      
      if (retries === 0) {
        throw new Error(`Failed to free port ${port} after multiple attempts`);
      }
    }
    return port;
  }

  async getPort() {
    try {
      // Try to ensure preferred port is available
      await this.ensurePortAvailable(this.preferredPort);
      this.lockPort(this.preferredPort);
      return this.preferredPort;
    } catch (error) {
      console.log(`Could not use preferred port ${this.preferredPort}. Finding alternative...`);
      return this.findAvailablePort();
    }
  }

  releasePort() {
    try {
      if (fs.existsSync(this.portLockFile)) {
        fs.unlinkSync(this.portLockFile);
      }
    } catch (e) {
      console.warn('Failed to release port lock:', e.message);
    }
  }
}

module.exports = PortManager; 