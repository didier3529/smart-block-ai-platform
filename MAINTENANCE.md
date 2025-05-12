# Codebase Maintenance

This document describes the maintenance work performed on the ChainOracle2 project codebase.

## Completed Tasks

1. **Standardized Naming Conventions**
   - Renamed all hooks from camelCase to kebab-case format (e.g., `useTheme.ts` → `use-theme.ts`)
   - Renamed all components from PascalCase to kebab-case format (e.g., `DiagnosticErrorBoundary.tsx` → `diagnostic-error-boundary.tsx`)
   - Updated import statements in affected files

2. **Removed Duplicate Files**
   - Deleted empty component file: `src/components/landing/hero-section-alt.tsx`
   - Deleted duplicate UI component: `src/components/ui/LoadingSpinner.tsx`

3. **Enhanced Build Process**
   - Updated `build.js` to better handle Next.js dependency mismatches
   - Added explicit reinstallation of Next.js to ensure consistent versions

## Current Structure

The project maintains two separate landing page implementations:

1. **Main App Landing Page**
   - Located at: `src/app/page.tsx`
   - Uses components from: `src/components/landing/*`

2. **Alternative Landing Page**
   - Located at: `src/app/landing/page.tsx`
   - Uses components from: `src/app/landing/components/*`

Both implementations are kept intact to preserve different design approaches.

## Future Tasks

1. **Standardize Import Styles**
   - Consistently use either relative imports or alias imports (@/), but not mix both
   - Replace namespace (*) imports with named imports where possible

2. **Component Consolidation Strategy**
   - Consider a long-term strategy for landing page component consolidation
   - Maintain component functionality while reducing duplication

3. **Component Library Documentation**
   - Create documentation for the UI component library
   - Document available components and their usage

## Deployment Considerations

When deploying to Vercel, ensure:

1. The Windows-specific SWC dependency is properly handled by using:
   ```
   npm run build:clean
   ```

2. Node.js version is set to 20.x or higher in:
   - package.json "engines" field
   - .node-version file
   - .nvmrc file
   - vercel.json configuration 