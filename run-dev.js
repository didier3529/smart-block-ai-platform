const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Color configurations for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Log message with color and prefix
function log(message, color = colors.reset, prefix = '') {
  console.log(`${color}${prefix ? `[${prefix}] ` : ''}${message}${colors.reset}`);
}

// Function to check if a port is in use
function isPortInUse(port) {
  try {
    const net = require('net');
    const server = net.createServer();
    
    return new Promise((resolve) => {
      server.once('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          resolve(true);
        } else {
          resolve(false);
        }
      });
      
      server.once('listening', () => {
        server.close();
        resolve(false);
      });
      
      server.listen(port);
    });
  } catch (err) {
    console.error('Error checking port:', err);
    return Promise.resolve(false);
  }
}

// Find an available port starting from the given one
async function findAvailablePort(startPort) {
  let port = startPort;
  while (await isPortInUse(port)) {
    log(`Port ${port} is in use, trying ${port + 1}...`, colors.yellow, 'PORT');
    port++;
  }
  return port;
}

// Environment setup
async function setupEnvironment() {
  log('Starting ChainOracle2 development environment...', colors.bright + colors.green, 'SETUP');
  
  // Configuration options with defaults
  const config = {
    port: 3005,
    mockAi: true,
    autoOpenBrowser: false
  };
  
  // Check if .env.local exists
  log('Checking for environment configuration...', colors.cyan, 'ENV');
  const envLocalPath = path.join(__dirname, '.env.local');
  const envVariablesPath = path.join(__dirname, 'env-variables.txt');

  // Handle env file scenarios
  if (fs.existsSync(envLocalPath)) {
    log('.env.local file found!', colors.green, 'ENV');
  } else if (fs.existsSync(envVariablesPath)) {
    log('No .env.local file found, but env-variables.txt exists.', colors.yellow, 'ENV');
    log('Creating temporary environment configuration from template...', colors.yellow, 'ENV');
    
    // Read the template
    const envTemplate = fs.readFileSync(envVariablesPath, 'utf8');
    
    // Extract variables
    const envVars = {};
    envTemplate.split('\n').forEach(line => {
      if (line.trim() && !line.startsWith('#')) {
        const [key, value] = line.split('=');
        if (key && value) {
          envVars[key.trim()] = value.trim();
        }
      }
    });
    
    log('Extracted environment variables successfully.', colors.green, 'ENV');
    
    // Set environment variables for this process
    Object.entries(envVars).forEach(([key, value]) => {
      process.env[key] = value;
    });
  } else {
    log('No environment configuration found. Using development defaults.', colors.red, 'ENV');
    log('API features may not work correctly without proper configuration.', colors.red, 'ENV');
  }

  // Always set these for development
  process.env.NODE_ENV = 'development';
  process.env.NEXT_PUBLIC_USE_MOCK_AI = process.env.NEXT_PUBLIC_USE_MOCK_AI || String(config.mockAi);
  
  // Key environment variables with fallbacks
  const envFallbacks = {
    'NEXT_PUBLIC_AI_API_KEY': process.env.NEXT_PUBLIC_AI_API_KEY || '',
    'NEXT_PUBLIC_AI_API_ENDPOINT': process.env.NEXT_PUBLIC_AI_API_ENDPOINT || 'https://api.openai.com/v1',
    'NEXT_PUBLIC_AI_MODEL': process.env.NEXT_PUBLIC_AI_MODEL || 'gpt-4',
    'NEXT_PUBLIC_API_URL': process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002',
    'JWT_SECRET': process.env.JWT_SECRET || 'dev_jwt_secret_chainoracle2_2024'
  };
  
  // Apply fallbacks
  Object.entries(envFallbacks).forEach(([key, value]) => {
    if (!process.env[key]) {
      process.env[key] = value;
      if (key === 'NEXT_PUBLIC_AI_API_KEY' && !value) {
        log(`${key} not set - mock mode will be used for AI features`, colors.yellow, 'ENV');
      } else {
        log(`${key} not set - using fallback: ${value}`, colors.yellow, 'ENV');
      }
    }
  });
  
  // Find available port
  const port = await findAvailablePort(config.port);
  if (port !== config.port) {
    log(`Using port ${port} instead of ${config.port}`, colors.yellow, 'PORT');
  } else {
    log(`Using port ${port}`, colors.green, 'PORT');
  }
  
  return { port };
}

// Start the Next.js dev server
function startDevServer(port) {
  log('Starting Next.js development server...', colors.bright + colors.blue, 'SERVER');
  
  const devProcess = spawn('npx', ['next', 'dev', '--port', port], {
    stdio: 'inherit',
    env: process.env
  });

  devProcess.on('error', (err) => {
    log(`Failed to start development server: ${err.message}`, colors.red, 'ERROR');
    process.exit(1);
  });

  // Handle process termination
  process.on('SIGINT', () => {
    log('Stopping development server...', colors.bright, 'SERVER');
    devProcess.kill('SIGINT');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    log('Stopping development server...', colors.bright, 'SERVER');
    devProcess.kill('SIGTERM');
    process.exit(0);
  });
}

// Main execution
async function main() {
  try {
    const { port } = await setupEnvironment();
    startDevServer(port);
  } catch (error) {
    log(`Setup failed: ${error.message}`, colors.red, 'ERROR');
    process.exit(1);
  }
}

main(); 