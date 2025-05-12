const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Function to delete a directory recursively
function deleteFolderRecursive(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.readdirSync(dirPath).forEach((file) => {
      const curPath = path.join(dirPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        // Recursive call for directories
        deleteFolderRecursive(curPath);
      } else {
        // Delete file
        try {
          fs.unlinkSync(curPath);
        } catch (err) {
          console.log(`Failed to delete file: ${curPath}`, err);
        }
      }
    });
    
    try {
      fs.rmdirSync(dirPath);
      console.log(`Deleted directory: ${dirPath}`);
    } catch (err) {
      console.log(`Failed to delete directory: ${dirPath}`, err);
    }
  }
}

// Function to find an available port
function findAvailablePort(startPort, maxPort = startPort + 10) {
  let port = startPort;
  
  while (port <= maxPort) {
    try {
      // Check if port is in use
      execSync(`npx -y is-port-free ${port}`, { stdio: 'ignore' });
      console.log(`Found available port: ${port}`);
      return port;
    } catch (error) {
      console.log(`Port ${port} is in use, trying next port...`);
      port++;
    }
  }
  
  console.log(`No available ports found in range ${startPort}-${maxPort}, using default port 3005`);
  return 3005;
}

// Clean the .next directory
console.log('Cleaning .next directory...');
const nextDir = path.join(__dirname, '.next');
deleteFolderRecursive(nextDir);

// Find an available port starting from 3005
const port = findAvailablePort(3005);

// Start the development server
console.log(`Starting Next.js development server on port ${port}...`);
try {
  execSync(`next dev --port ${port}`, { stdio: 'inherit' });
} catch (error) {
  console.error('Failed to start development server:', error.message);
  process.exit(1);
} 