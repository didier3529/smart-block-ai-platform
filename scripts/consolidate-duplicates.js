const fs = require('fs');
const path = require('path');
const readline = require('readline');

const componentsLandingDir = path.join(process.cwd(), 'src', 'components', 'landing');
const appLandingDir = path.join(process.cwd(), 'src', 'app', 'landing', 'components');

// Potential duplicate component groups
const duplicateGroups = [
  {
    name: 'Hero Section',
    files: [
      'src/components/landing/hero-section.tsx',
      'src/components/landing/hero-section-alternative.tsx',
      'src/components/landing/hero-section-alt.tsx',
    ]
  },
  {
    name: 'How It Works',
    files: [
      'src/components/landing/how-it-works-alt.tsx',
      'src/components/landing/how-it-works-section.tsx',
      'src/app/landing/components/how-it-works.tsx',
    ]
  },
  {
    name: 'Feature Showcase',
    files: [
      'src/components/landing/feature-showcase.tsx',
      'src/app/landing/components/feature-showcase.tsx',
    ]
  },
  {
    name: 'Call to Action',
    files: [
      'src/components/landing/call-to-action.tsx',
      'src/app/landing/components/call-to-action.tsx',
    ]
  },
];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Utility to read file contents or return null if file doesn't exist
const readFileOrNull = (filePath) => {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    return null;
  }
};

// Checks if file exists and has actual content
const fileHasContent = (filePath) => {
  const content = readFileOrNull(filePath);
  return content !== null && content.trim().length > 10;
};

// Compare files and suggest a consolidation strategy
const analyzeGroup = (group) => {
  console.log(`\nAnalyzing "${group.name}" components:`);
  
  const existingFiles = group.files.filter(file => {
    const exists = fs.existsSync(file);
    const hasContent = exists && fileHasContent(file);
    
    if (exists) {
      const stats = fs.statSync(file);
      const sizeKB = (stats.size / 1024).toFixed(1);
      console.log(`  - ${file} (${sizeKB} KB) ${hasContent ? '' : '- Empty or minimal content'}`);
    } else {
      console.log(`  - ${file} (Not found)`);
    }
    
    return exists && hasContent;
  });
  
  if (existingFiles.length === 0) {
    console.log('  No files found in this group.');
    return;
  }
  
  if (existingFiles.length === 1) {
    console.log('  Only one valid file found, no consolidation needed.');
    return;
  }
  
  // Find the largest file as potential primary
  const fileSizes = existingFiles.map(file => ({
    path: file,
    size: fs.statSync(file).size
  }));
  
  const largestFile = fileSizes.reduce((prev, current) => 
    (prev.size > current.size) ? prev : current
  );
  
  console.log(`\n  Recommendation: Use "${largestFile.path}" as the primary component.`);
  console.log('  Review the other files to merge any unique functionality.');
  
  // Empty files can just be deleted
  const emptyFiles = group.files.filter(file => {
    return fs.existsSync(file) && !fileHasContent(file);
  });
  
  if (emptyFiles.length > 0) {
    console.log('\n  The following files appear to be empty or nearly empty and can be deleted:');
    emptyFiles.forEach(file => console.log(`    - ${file}`));
  }
};

// Main process
console.log('Analyzing potential duplicate components...');
console.log('===========================================');

// Process each group sequentially
const processGroups = (index = 0) => {
  if (index >= duplicateGroups.length) {
    console.log('\nAnalysis complete!');
    console.log('\nRecommendations for consolidation:');
    console.log('1. Choose one primary component for each group');
    console.log('2. Merge any unique functionality from duplicates into the primary');
    console.log('3. Update imports in affected files to use the primary component');
    console.log('4. Delete redundant components after successful testing');
    rl.close();
    return;
  }
  
  const group = duplicateGroups[index];
  analyzeGroup(group);
  
  // Process next group
  processGroups(index + 1);
};

// Start processing
processGroups(); 