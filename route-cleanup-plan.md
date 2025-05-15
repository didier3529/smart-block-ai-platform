# Route Cleanup Plan

## Overview of the Issue
Based on our findings with the portfolio page, there appears to be systematic route duplication throughout the application. The main issue is having both standalone routes (e.g., `/portfolio`) and dashboard-nested routes (e.g., `/dashboard/portfolio`) that serve similar functionality but with different implementations.

This duplication causes:
- Confusion during development
- Inconsistent UI/UX
- Excessive API calls
- Maintenance burden

## Cleanup Approach
We'll take a methodical approach focusing on one route at a time, ensuring we don't break functionality. The key is to understand which route is actually being used before making changes.

## General Process for Each Route
1. **Analysis Phase**
   - Identify duplicate routes
   - Check server logs to determine which route is actively used
   - Review components in each implementation
   
2. **Decision Phase**
   - Decide which route to keep (usually the dashboard-nested route)
   - Plan component replacement strategy
   
3. **Implementation Phase**
   - Make backup copies of files before modifying
   - Replace components in the active route
   - Test thoroughly before removing the unused route
   
4. **Cleanup Phase**
   - Remove unused route files
   - Document changes

## Specific Tasks

### Task 1: Audit All Routes
- ⬜ Generate a complete list of all routes in the application
- ⬜ Check for potential duplication by comparing:
  - `/src/app/[route]/page.tsx` files
  - `/src/app/dashboard/[route]/page.tsx` files
- ⬜ Create a spreadsheet documenting:
  - Route path
  - Component used
  - Whether it's actively accessed (from logs)
  - API endpoints called

### Task 2: Fix NFT Routes
- ⬜ Confirm if `/dashboard/nfts` is the active route
- ⬜ Identify if a standalone `/nft` route exists
- ⬜ Analyze component differences
- ⬜ Update the active route with consistent components
- ⬜ Test functionality thoroughly
- ⬜ Remove inactive route if appropriate

### Task 3: Fix Market Routes
- ⬜ Confirm if `/dashboard/market` is the active route
- ⬜ Identify if a standalone `/market` route exists
- ⬜ Analyze component differences
- ⬜ Update the active route with consistent components
- ⬜ Test functionality thoroughly
- ⬜ Remove inactive route if appropriate

### Task 4: Fix Settings Routes
- ⬜ Check for potential duplication between settings routes
- ⬜ Fix the API key management module issue (`Can't resolve '@/config/ai-config'`)
- ⬜ Ensure settings are accessible and working correctly
- ⬜ Consolidate routes if needed

### Task 5: Optimize API Calls
- ⬜ Identify components making duplicate API calls
- ⬜ Implement caching or context providers to reduce API calls
- ⬜ Fix the excessive calls to `/api/portfolio/summary` and `/api/portfolio/tokens`
- ⬜ Monitor server logs to confirm reduction in API calls

### Task 6: Update Navigation
- ⬜ Ensure sidebar and navigation links point to the correct routes
- ⬜ Update any hardcoded links in components
- ⬜ Test navigation flow throughout the application

### Task 7: Documentation Update
- ⬜ Document the final route structure
- ⬜ Create a routing guide for future development
- ⬜ Update README with information about the application structure

## Implementation Order and Timeline
1. **Week 1: Analysis and Planning (Tasks 1)**
   - Complete full audit
   - Prioritize routes based on usage and complexity
   
2. **Week 2: High-Priority Fixes (Tasks 2-3)**
   - Fix NFT routes
   - Fix Market routes
   
3. **Week 3: Secondary Fixes (Tasks 4-5)**
   - Fix Settings routes
   - Optimize API calls
   
4. **Week 4: Cleanup and Documentation (Tasks 6-7)**
   - Update navigation
   - Complete documentation
   - Final testing

## Risk Mitigation
- Always work on a feature branch
- Create backup copies of files before modification
- Test each change thoroughly before proceeding to the next task
- Keep detailed notes of all changes
- Monitor server logs for errors after each change
- Have a rollback plan for each modification

## Success Criteria
- No duplicate routes in the application
- Consistent component usage throughout
- Reduced API calls
- Clear navigation paths
- Updated documentation
- No regressions in functionality 