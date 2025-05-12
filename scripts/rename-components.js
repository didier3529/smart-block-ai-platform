const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const componentsDir = path.join(process.cwd(), 'src', 'components');

// Map of files to rename
const filesToRename = {
  'OnboardingSystem.tsx': 'onboarding-system.tsx',
  'ErrorMonitoringDashboard.tsx': 'error-monitoring-dashboard.tsx',
  'TutorialProgress.tsx': 'tutorial-progress.tsx',
  'DiagnosticErrorBoundary.tsx': 'diagnostic-error-boundary.tsx',
  'WalletConnection.tsx': 'wallet-connection.tsx'
};

console.log('Starting component file renaming process...');

// Check if components directory exists
if (!fs.existsSync(componentsDir)) {
  console.error(`Components directory not found: ${componentsDir}`);
  process.exit(1);
}

// Get all files that need updating
const filesToUpdate = [];

// Find files that import the components we're renaming
const findImportingFiles = (componentName) => {
  try {
    // Use grep to find files that import the component
    const grepCommand = process.platform === 'win32'
      ? `findstr /s /i /m "import.*${componentName}" src\\*.ts src\\*.tsx`
      : `grep -r "import.*${componentName}" --include="*.ts" --include="*.tsx" src/`;
    
    const result = execSync(grepCommand, { encoding: 'utf8' });
    return result.split('\n').filter(line => line.trim() !== '');
  } catch (error) {
    // grep returns non-zero exit code if no matches found
    return [];
  }
};

// Process each file to rename
for (const [oldName, newName] of Object.entries(filesToRename)) {
  const oldPath = path.join(componentsDir, oldName);
  const newPath = path.join(componentsDir, newName);
  
  if (fs.existsSync(oldPath)) {
    console.log(`Renaming ${oldName} to ${newName}...`);
    
    // Find files that import this component
    console.log(`Finding files that import ${oldName.replace('.tsx', '')}...`);
    const importingFiles = findImportingFiles(oldName.replace('.tsx', ''));
    
    if (importingFiles.length > 0) {
      console.log(`Found ${importingFiles.length} files that need import updates:`);
      importingFiles.forEach(file => console.log(`  - ${file}`));
      filesToUpdate.push(...importingFiles);
    } else {
      console.log(`No files found importing ${oldName.replace('.tsx', '')}`);
    }
    
    // Rename the file
    fs.renameSync(oldPath, newPath);
  } else {
    console.log(`File ${oldName} not found, skipping...`);
  }
}

if (filesToUpdate.length > 0) {
  console.log('\nThe following files need their imports updated:');
  filesToUpdate.forEach(file => console.log(`  - ${file}`));
  console.log('\nPlease update the imports in these files to use the new kebab-case component names.');
}

console.log('\nComponent renaming completed!');
console.log('Remember to update all import statements to use the new kebab-case names.'); 