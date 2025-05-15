# Component Cleanup Process Guide

## Overview
This document outlines the step-by-step process for identifying and cleaning up duplicate components, providers, and related code in a React/Next.js project.

## Prerequisites
- Access to the codebase
- Understanding of the project structure
- Knowledge of which components are currently in active use

## Step 1: Identify Duplicates

### Search for Similar Components
```bash
# Look for components with similar names
grep -r "export function Component" ./src
# Look for similar imports
grep -r "import.*Component" ./src
```

### Common Places to Check
- `/components/` directory
- `/src/components/`
- Feature-specific directories
- Module directories

## Step 2: Analysis

### For Each Component:
1. Check Import Usage
```bash
# Find where the component is imported
grep -r "import.*ComponentName" ./src
```

2. Check Active Usage
- Look in page files
- Check component references
- Review recent git history

3. Compare Implementations
- Check functionality
- Review props and interfaces
- Look for newer/better patterns

## Step 3: Decision Making

### Criteria for Keeping Components
- ✅ Currently in use in active pages
- ✅ Has the most recent updates
- ✅ Uses current project patterns
- ✅ Located in the correct directory structure

### Criteria for Removal
- ❌ No active imports
- ❌ Older implementation
- ❌ Duplicate functionality
- ❌ Located in legacy directories

## Step 4: Cleanup Process

### 1. Document Current State
```markdown
# Cleanup Task: [Feature Name]

## Components to Remove
- path/to/component1.tsx
- path/to/component2.tsx

## Components to Keep
- path/to/current/component.tsx

## Affected Files
- List of files that need updates
```

### 2. Execute Cleanup
1. Remove Duplicate Files
```bash
# Remove each duplicate file
rm path/to/duplicate/component.tsx
```

2. Update Imports
- Search for old imports
- Replace with new component paths
- Update any dependent code

3. Clean Related Code
- Remove unused types
- Clean up unused hooks
- Remove unused utilities

### 3. Verification Steps
- [ ] All imports are updated
- [ ] No broken references
- [ ] Application builds successfully
- [ ] Features still work as expected
- [ ] No console errors
- [ ] Tests pass (if applicable)

## Step 5: Documentation

### Update Documentation
1. Update component documentation
2. Update README if needed
3. Add migration notes if necessary

### Create Cleanup Report
```markdown
# Cleanup Report

## Removed Components
- List of removed files

## Retained Components
- List of kept files

## Benefits
- Describe improvements

## Next Steps
- Any follow-up tasks
```

## Common Pitfalls to Avoid
1. **Don't Remove Without Checking**
   - Always verify usage
   - Check git history
   - Look for indirect dependencies

2. **Keep Backup**
   - Create a branch before cleanup
   - Document changes
   - Keep removed code accessible

3. **Test Thoroughly**
   - Test all affected features
   - Check edge cases
   - Verify in different environments

## Example Cleanup Task

### Initial State
```
src/
  components/
    feature/
      old-component.tsx
    modules/
      new-component.tsx
```

### Process
1. Identify duplicates
2. Check usage
3. Remove old component
4. Update imports
5. Test functionality
6. Document changes

### Final State
```
src/
  components/
    modules/
      new-component.tsx
```

## Conclusion
Following this process ensures a systematic approach to cleaning up duplicate code while maintaining project stability and documenting changes for future reference. 