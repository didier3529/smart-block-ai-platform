const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const hooksDir = path.join(process.cwd(), 'src', 'hooks');

// Map of files to rename
const filesToRename = {
  'useTheme.ts': 'use-theme.ts',
  'useErrorHandler.ts': 'use-error-handler.ts',
  'useAuthGuard.ts': 'use-auth-guard.ts',
  'useSelectedAgents.ts': 'use-selected-agents.ts',
  'useLocalStorage.ts': 'use-local-storage.ts',
  'useTutorialProgress.ts': 'use-tutorial-progress.ts',
  'useForm.ts': 'use-form.ts'
};

console.log('Starting hook file renaming process...');

// Check if hooks directory exists
if (!fs.existsSync(hooksDir)) {
  console.error(`Hooks directory not found: ${hooksDir}`);
  process.exit(1);
}

// Get all files that need updating
const files = fs.readdirSync(hooksDir);
const filesToUpdate = [];

// Find files that import the hooks we're renaming
const findImportingFiles = (hookName) => {
  try {
    // Use grep to find files that import the hook
    const grepCommand = process.platform === 'win32'
      ? `findstr /s /i /m "import.*${hookName}" src\\*.ts src\\*.tsx`
      : `grep -r "import.*${hookName}" --include="*.ts" --include="*.tsx" src/`;
    
    const result = execSync(grepCommand, { encoding: 'utf8' });
    return result.split('\n').filter(line => line.trim() !== '');
  } catch (error) {
    // grep returns non-zero exit code if no matches found
    return [];
  }
};

// Process each file to rename
for (const [oldName, newName] of Object.entries(filesToRename)) {
  const oldPath = path.join(hooksDir, oldName);
  const newPath = path.join(hooksDir, newName);
  
  if (fs.existsSync(oldPath)) {
    console.log(`Renaming ${oldName} to ${newName}...`);
    
    // Find files that import this hook
    console.log(`Finding files that import ${oldName.replace('.ts', '')}...`);
    const importingFiles = findImportingFiles(oldName.replace('.ts', ''));
    
    if (importingFiles.length > 0) {
      console.log(`Found ${importingFiles.length} files that need import updates:`);
      importingFiles.forEach(file => console.log(`  - ${file}`));
      filesToUpdate.push(...importingFiles);
    } else {
      console.log(`No files found importing ${oldName.replace('.ts', '')}`);
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
  console.log('\nPlease update the imports in these files to use the new kebab-case hook names.');
}

console.log('\nHook renaming completed!');
console.log('Remember to update all import statements to use the new kebab-case names.'); 