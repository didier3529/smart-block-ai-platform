const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const componentsToCheck = [
  {
    name: 'HeroSection',
    files: [
      'src/components/landing/hero-section.tsx',
      'src/components/landing/hero-section-alternative.tsx',
      'src/app/landing/components/hero-section.tsx'
    ]
  },
  {
    name: 'HowItWorks',
    files: [
      'src/components/landing/how-it-works-alt.tsx',
      'src/components/landing/how-it-works-section.tsx',
      'src/app/landing/components/how-it-works.tsx'
    ]
  },
  {
    name: 'FeatureShowcase',
    files: [
      'src/components/landing/feature-showcase.tsx',
      'src/app/landing/components/feature-showcase.tsx'
    ]
  },
  {
    name: 'CallToAction',
    files: [
      'src/components/landing/call-to-action.tsx',
      'src/app/landing/components/call-to-action.tsx'
    ]
  }
];

// Function to find imports of a component
const findImports = (componentName) => {
  try {
    // Use grep command based on platform
    const command = process.platform === 'win32'
      ? `findstr /s /i /m "import.*${componentName}" src\\*.tsx src\\*.ts src\\*.jsx src\\*.js`
      : `grep -r "import.*${componentName}" --include="*.tsx" --include="*.ts" --include="*.jsx" --include="*.js" src/`;
    
    const result = execSync(command, { encoding: 'utf8' });
    return result.split('\n').filter(line => line.trim() !== '');
  } catch (error) {
    // grep returns non-zero exit code if no matches found
    return [];
  }
};

console.log('Checking component usage in the codebase...\n');

for (const component of componentsToCheck) {
  console.log(`\n=== Checking usage of ${component.name} ===`);
  
  // Find files importing this component
  const importingFiles = findImports(component.name);
  
  if (importingFiles.length === 0) {
    console.log('  No imports found.');
  } else {
    console.log(`  Imported in ${importingFiles.length} file(s):`);
    importingFiles.forEach(file => {
      console.log(`  - ${file}`);
    });
  }
  
  // Check if each implementation file exists
  console.log('\n  Implementation files:');
  component.files.forEach(file => {
    if (fs.existsSync(file)) {
      const stats = fs.statSync(file);
      const sizeKB = (stats.size / 1024).toFixed(1);
      console.log(`  - ${file} (${sizeKB} KB)`);
    } else {
      console.log(`  - ${file} (Not found)`);
    }
  });
}

console.log('\nComponent usage check completed!'); 