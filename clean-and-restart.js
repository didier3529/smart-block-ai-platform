const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const PortManager = require('./src/lib/utils/port-manager');

function cleanNextCache() {
  console.log('🧹 Cleaning Next.js cache...');
  const directories = ['.next', 'node_modules/.cache'];
  
  directories.forEach(dir => {
    const dirPath = path.join(process.cwd(), dir);
    if (fs.existsSync(dirPath)) {
      console.log(`Removing ${dir}...`);
      fs.rmSync(dirPath, { recursive: true, force: true });
    }
  });
}

function cleanPortLock() {
  const portLockFile = path.join(process.cwd(), '.port-lock');
  if (fs.existsSync(portLockFile)) {
    console.log('🔓 Removing stale port lock...');
    fs.unlinkSync(portLockFile);
  }
}

function killPortProcess(port) {
  try {
    if (process.platform === 'win32') {
      const result = execSync(`netstat -ano | findstr :${port}`).toString();
      const lines = result.split('\n').filter(Boolean);
      
      lines.forEach(line => {
        const pid = line.match(/\s+(\d+)\s*$/)?.[1];
        if (pid) {
          try {
            execSync(`taskkill /F /PID ${pid} /T 2>nul`);
            console.log(`🔪 Killed process tree on port ${port} (PID: ${pid})`);
            // Double verify process is gone
            setTimeout(() => {
              try {
                process.kill(parseInt(pid), 0);
                execSync(`taskkill /F /PID ${pid} /T 2>nul`);
              } catch (e) {
                // Process is gone
              }
            }, 500);
          } catch (e) {
            console.log(`Process ${pid} already terminated`);
          }
        }
      });
    } else {
      execSync(`lsof -i :${port} | grep LISTEN | awk '{print $2}' | xargs kill -9`);
      console.log(`🔪 Killed process on port ${port}`);
    }
  } catch (e) {
    if (!e.message.includes('no tasks')) {
      console.log(`No active process found on port ${port}`);
    }
  }
}

function reinstallDependencies() {
  console.log('📦 Reinstalling dependencies...');
  try {
    // Remove node_modules
    const nodeModulesPath = path.join(process.cwd(), 'node_modules');
    if (fs.existsSync(nodeModulesPath)) {
      fs.rmSync(nodeModulesPath, { recursive: true, force: true });
    }
    
    // Remove package-lock.json
    const lockFilePath = path.join(process.cwd(), 'package-lock.json');
    if (fs.existsSync(lockFilePath)) {
      fs.unlinkSync(lockFilePath);
    }
    
    // Install dependencies
    execSync('npm install', { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Error reinstalling dependencies:', error.message);
    process.exit(1);
  }
}

async function main() {
  try {
    // Clean port lock first
    cleanPortLock();

    // Initialize port manager
    const portManager = new PortManager();
    
    // Clean Next.js cache
    cleanNextCache();

    // Kill any existing Next.js processes
    [3005, 3006, 3007, 3008, 3009, 3010].forEach(port => {
      killPortProcess(port);
    });

    // Reinstall dependencies to fix module resolution
    reinstallDependencies();

    // Get available port
    const port = await portManager.getPort();
    
    // Update package.json with the new port
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    packageJson.scripts.dev = `next dev --port ${port}`;
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

    // Run development server
    console.log(`🚀 Starting development server on port ${port}...`);
    
    // Handle cleanup on exit
    process.on('SIGINT', () => {
      portManager.releasePort();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      portManager.releasePort();
      process.exit(0);
    });

    execSync('npm run dev', { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Error during restart:', error.message);
    process.exit(1);
  }
}

main(); 