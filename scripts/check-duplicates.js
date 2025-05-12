const fs = require('fs');
const path = require('path');

const componentsLandingDir = path.join(process.cwd(), 'src', 'components', 'landing');
const appLandingDir = path.join(process.cwd(), 'src', 'app', 'landing', 'components');

// List of component prefixes to check for duplicates
const componentPrefixes = [
  'hero-section',
  'how-it-works',
  'feature-showcase',
  'call-to-action'
];

console.log('Checking for duplicate landing components...');

// Check if directories exist
if (!fs.existsSync(componentsLandingDir)) {
  console.error(`Components landing directory not found: ${componentsLandingDir}`);
}

if (!fs.existsSync(appLandingDir)) {
  console.error(`App landing directory not found: ${appLandingDir}`);
}

// Get all files in both directories
const componentsLandingFiles = fs.existsSync(componentsLandingDir) 
  ? fs.readdirSync(componentsLandingDir) 
  : [];

const appLandingFiles = fs.existsSync(appLandingDir) 
  ? fs.readdirSync(appLandingDir) 
  : [];

// Function to check if a file starts with a given prefix
const startsWithPrefix = (file, prefix) => {
  return file.startsWith(prefix) && (file.endsWith('.tsx') || file.endsWith('.ts'));
};

// Check for duplicates and suggest consolidation
for (const prefix of componentPrefixes) {
  const componentsMatches = componentsLandingFiles.filter(file => startsWithPrefix(file, prefix));
  const appMatches = appLandingFiles.filter(file => startsWithPrefix(file, prefix));
  
  console.log(`\nChecking for '${prefix}' components:`);
  
  if (componentsMatches.length > 0) {
    console.log(`  Found in src/components/landing/:`);
    componentsMatches.forEach(file => {
      const filePath = path.join(componentsLandingDir, file);
      const stats = fs.statSync(filePath);
      const sizeKB = (stats.size / 1024).toFixed(1);
      console.log(`    - ${file} (${sizeKB} KB)`);
    });
  }
  
  if (appMatches.length > 0) {
    console.log(`  Found in src/app/landing/components/:`);
    appMatches.forEach(file => {
      const filePath = path.join(appLandingDir, file);
      const stats = fs.statSync(filePath);
      const sizeKB = (stats.size / 1024).toFixed(1);
      console.log(`    - ${file} (${sizeKB} KB)`);
    });
  }
  
  // Suggest consolidation if duplicates exist
  if (componentsMatches.length > 1 || (componentsMatches.length > 0 && appMatches.length > 0)) {
    console.log('  Recommendation: Consolidate these components');
    
    // Check for empty or near-empty files
    const allMatches = [...componentsMatches.map(f => path.join(componentsLandingDir, f)), 
                         ...appMatches.map(f => path.join(appLandingDir, f))];
    
    for (const filePath of allMatches) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.trim().length < 10) {
        console.log(`    - File ${path.basename(filePath)} appears to be empty or nearly empty and can be deleted`);
      }
    }
    
    // Suggest which one to keep based on file size (prefer the larger file)
    if (allMatches.length > 1) {
      const fileSizes = allMatches.map(filePath => ({
        path: filePath,
        size: fs.statSync(filePath).size
      }));
      
      const largestFile = fileSizes.reduce((prev, current) => 
        (prev.size > current.size) ? prev : current
      );
      
      console.log(`    - Consider keeping ${path.basename(largestFile.path)} as the primary component`);
    }
  }
}

console.log('\nDuplicate component check completed!');
console.log('Consider consolidating duplicate components to maintain consistency and reduce code duplication.'); 