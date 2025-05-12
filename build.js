const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Print Node.js version
console.log('Using Node.js version:');
console.log(process.version);

try {
  // Clean build artifacts
  console.log('Cleaning build artifacts...');
  const directories = ['.next', 'node_modules/.cache'];
  
  directories.forEach(dir => {
    const dirPath = path.join(process.cwd(), dir);
    if (fs.existsSync(dirPath)) {
      console.log(`Removing ${dir}...`);
      fs.rmSync(dirPath, { recursive: true, force: true });
    }
  });

  // Remove Windows-specific SWC binary
  const swcWinPath = path.join(process.cwd(), 'node_modules', '@next', 'swc-win32-x64-msvc');
  if (fs.existsSync(swcWinPath)) {
    console.log('Removing Windows-specific SWC binary...');
    fs.rmSync(swcWinPath, { recursive: true, force: true });
  }

  // Since we've had dependency issues, fix package-lock.json
  console.log('Rebuilding package-lock.json file...');
  fs.rmSync(path.join(process.cwd(), 'package-lock.json'), { force: true });
  
  // Run a clean install to regenerate package-lock.json with correct dependencies
  console.log('Installing dependencies...');
  execSync('npm install --no-audit', { stdio: 'inherit' });
  
  // Remove platform-specific SWC binaries that aren't needed
  console.log('Cleaning up platform-specific dependencies...');
  const nextDir = path.join(process.cwd(), 'node_modules', '@next');
  if (fs.existsSync(nextDir)) {
    fs.readdirSync(nextDir)
      .filter(dir => dir.startsWith('swc-') && !dir.includes(process.platform))
      .forEach(dir => {
        console.log(`Removing @next/${dir}...`);
        fs.rmSync(path.join(nextDir, dir), { recursive: true, force: true });
      });
  }
  
  // Run a production build
  console.log('Building for production...');
  execSync('next build', { stdio: 'inherit' });
  
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
} 