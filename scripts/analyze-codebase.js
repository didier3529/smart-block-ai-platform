const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const rootDir = process.cwd();
const srcDir = path.join(rootDir, 'src');

// Color codes for terminal output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

// Helper function to recursively get all files
const getFilesRecursively = (dir, fileList = []) => {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      getFilesRecursively(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  });
  
  return fileList;
};

// Get all TypeScript files
const getAllTypeScriptFiles = () => {
  return getFilesRecursively(srcDir).filter(file => 
    file.endsWith('.ts') || file.endsWith('.tsx')
  );
};

// Check for inconsistent naming conventions
const checkNamingConventions = () => {
  console.log(`${colors.cyan}Checking naming conventions...${colors.reset}\n`);
  
  const issues = {
    hooks: [],
    components: []
  };
  
  // Check hook files
  const hooksDir = path.join(srcDir, 'hooks');
  if (fs.existsSync(hooksDir)) {
    const hookFiles = fs.readdirSync(hooksDir);
    
    hookFiles.forEach(file => {
      // Hooks should be kebab-case with .ts extension
      if (!file.startsWith('use-') && file.startsWith('use')) {
        issues.hooks.push({
          file: `src/hooks/${file}`,
          issue: 'Hook uses camelCase instead of kebab-case',
          suggestion: `Rename to ${file.replace(/([A-Z])/g, '-$1').toLowerCase()}`
        });
      }
    });
  }
  
  // Check component files in the root components directory
  const componentsDir = path.join(srcDir, 'components');
  if (fs.existsSync(componentsDir)) {
    const componentFiles = fs.readdirSync(componentsDir)
      .filter(file => file.endsWith('.tsx') || file.endsWith('.ts'));
    
    componentFiles.forEach(file => {
      // Root components should be kebab-case
      if (/^[A-Z]/.test(file)) {
        issues.components.push({
          file: `src/components/${file}`,
          issue: 'Component uses PascalCase instead of kebab-case',
          suggestion: `Rename to ${file.charAt(0).toLowerCase() + file.slice(1).replace(/([A-Z])/g, '-$1').toLowerCase()}`
        });
      }
    });
  }
  
  // Print issues
  if (issues.hooks.length > 0) {
    console.log(`${colors.yellow}Found ${issues.hooks.length} hook naming issues:${colors.reset}`);
    issues.hooks.forEach(issue => {
      console.log(`  ${colors.red}✗${colors.reset} ${issue.file}`);
      console.log(`    ${colors.yellow}Issue:${colors.reset} ${issue.issue}`);
      console.log(`    ${colors.green}Suggestion:${colors.reset} ${issue.suggestion}`);
    });
    console.log('');
  } else {
    console.log(`${colors.green}No hook naming issues found.${colors.reset}\n`);
  }
  
  if (issues.components.length > 0) {
    console.log(`${colors.yellow}Found ${issues.components.length} component naming issues:${colors.reset}`);
    issues.components.forEach(issue => {
      console.log(`  ${colors.red}✗${colors.reset} ${issue.file}`);
      console.log(`    ${colors.yellow}Issue:${colors.reset} ${issue.issue}`);
      console.log(`    ${colors.green}Suggestion:${colors.reset} ${issue.suggestion}`);
    });
    console.log('');
  } else {
    console.log(`${colors.green}No component naming issues found.${colors.reset}\n`);
  }
  
  return issues.hooks.length + issues.components.length;
};

// Check for duplicate files with similar names
const checkDuplicates = () => {
  console.log(`${colors.cyan}Checking for duplicate components...${colors.reset}\n`);
  
  const landingComponents = {
    'hero-section': [],
    'how-it-works': [],
    'feature-showcase': [],
    'call-to-action': []
  };
  
  // Check in src/components/landing
  const componentsLandingDir = path.join(srcDir, 'components', 'landing');
  if (fs.existsSync(componentsLandingDir)) {
    const files = fs.readdirSync(componentsLandingDir);
    
    Object.keys(landingComponents).forEach(prefix => {
      const matches = files.filter(file => 
        file.startsWith(prefix) && (file.endsWith('.tsx') || file.endsWith('.ts'))
      );
      
      landingComponents[prefix].push(
        ...matches.map(file => path.join('src/components/landing', file))
      );
    });
  }
  
  // Check in src/app/landing/components
  const appLandingDir = path.join(srcDir, 'app', 'landing', 'components');
  if (fs.existsSync(appLandingDir)) {
    const files = fs.readdirSync(appLandingDir);
    
    Object.keys(landingComponents).forEach(prefix => {
      const matches = files.filter(file => 
        file.startsWith(prefix) && (file.endsWith('.tsx') || file.endsWith('.ts'))
      );
      
      landingComponents[prefix].push(
        ...matches.map(file => path.join('src/app/landing/components', file))
      );
    });
  }
  
  // Print duplicates
  let totalDuplicates = 0;
  
  Object.entries(landingComponents).forEach(([component, files]) => {
    if (files.length > 1) {
      console.log(`${colors.yellow}Found ${files.length} files for ${component}:${colors.reset}`);
      files.forEach(file => {
        console.log(`  ${colors.red}✗${colors.reset} ${file}`);
      });
      console.log(`  ${colors.green}Suggestion:${colors.reset} Run 'npm run maintenance:consolidate-duplicates' to analyze and consolidate`);
      console.log('');
      totalDuplicates++;
    }
  });
  
  if (totalDuplicates === 0) {
    console.log(`${colors.green}No duplicate components found.${colors.reset}\n`);
  }
  
  return totalDuplicates;
};

// Check for consistent import conventions
const checkImportConsistency = () => {
  console.log(`${colors.cyan}Checking import statement consistency...${colors.reset}\n`);
  
  const files = getAllTypeScriptFiles();
  const issues = [];
  
  files.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const relativeFile = path.relative(rootDir, file);
      
      // Check for different import styles mixed in the same file
      const hasDefaultImports = /import\s+[A-Za-z0-9_]+\s+from/.test(content);
      const hasNamedImports = /import\s+{\s*[A-Za-z0-9_]+/.test(content);
      const hasStarImports = /import\s+\*\s+as/.test(content);
      
      if (hasDefaultImports && hasStarImports) {
        issues.push({
          file: relativeFile,
          issue: 'Mixes default imports and namespace (*) imports',
          suggestion: 'Standardize on one import style where possible'
        });
      }
      
      // Check for redundant path segments (e.g., "../components/Button" vs "@/components/Button")
      const hasRelativeImports = /from\s+['"]\.\.\//.test(content);
      const hasAliasImports = /from\s+['"]@\//.test(content);
      
      if (hasRelativeImports && hasAliasImports) {
        issues.push({
          file: relativeFile,
          issue: 'Mixes relative (../) and alias (@/) imports',
          suggestion: 'Standardize on one import style, preferably alias imports'
        });
      }
    } catch (error) {
      console.error(`Error reading file ${file}: ${error.message}`);
    }
  });
  
  // Print issues
  if (issues.length > 0) {
    console.log(`${colors.yellow}Found ${issues.length} import consistency issues:${colors.reset}`);
    issues.forEach(issue => {
      console.log(`  ${colors.red}✗${colors.reset} ${issue.file}`);
      console.log(`    ${colors.yellow}Issue:${colors.reset} ${issue.issue}`);
      console.log(`    ${colors.green}Suggestion:${colors.reset} ${issue.suggestion}`);
    });
    console.log('');
  } else {
    console.log(`${colors.green}No import consistency issues found.${colors.reset}\n`);
  }
  
  return issues.length;
};

// Main function
const main = () => {
  console.log(`${colors.magenta}=== ChainOracle2 Codebase Analysis ====${colors.reset}\n`);
  
  const namingIssues = checkNamingConventions();
  const duplicateIssues = checkDuplicates();
  const importIssues = checkImportConsistency();
  
  const totalIssues = namingIssues + duplicateIssues + importIssues;
  
  console.log(`${colors.magenta}=== Analysis Summary ====${colors.reset}`);
  console.log(`${colors.cyan}Found a total of ${totalIssues} issues:${colors.reset}`);
  console.log(`  - ${namingIssues} naming convention issues`);
  console.log(`  - ${duplicateIssues} duplicate component issues`);
  console.log(`  - ${importIssues} import consistency issues`);
  
  if (totalIssues === 0) {
    console.log(`\n${colors.green}✓ Codebase appears well-structured and consistent!${colors.reset}`);
  } else {
    console.log(`\n${colors.yellow}Recommended actions:${colors.reset}`);
    
    if (namingIssues > 0) {
      console.log(`  ${colors.green}▶${colors.reset} Run 'npm run maintenance:rename-hooks' and 'npm run maintenance:rename-components'`);
    }
    
    if (duplicateIssues > 0) {
      console.log(`  ${colors.green}▶${colors.reset} Run 'npm run maintenance:consolidate-duplicates' to analyze duplicates`);
    }
    
    if (importIssues > 0) {
      console.log(`  ${colors.green}▶${colors.reset} Review import styles and standardize on a consistent approach`);
    }
  }
};

// Run the analysis
main(); 