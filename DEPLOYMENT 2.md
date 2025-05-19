# Deployment Fixes

This document summarizes all the fixes made to resolve deployment issues with the ChainOracle2 project on Vercel.

## 1. Fixed Hook Duplication Issues

- Removed duplicate hook files with inconsistent interfaces:
  - Deleted `src/hooks/use-in-view.tsx` and kept `src/hooks/use-in-view.ts`
  - Deleted `src/hooks/use-media-query.tsx` and kept `src/hooks/use-media-query.ts`
  - Deleted `src/hooks/use-mobile.tsx` and created `src/hooks/use-mobile.ts`

## 2. Standardized File Naming Conventions

- Converted PascalCase component files to kebab-case for consistency:
  - Renamed `src/components/landing/CallToAction.tsx` to `src/components/landing/call-to-action.tsx`
  - Renamed `src/components/landing/HeroSection.tsx` to `src/components/landing/hero-section-alternative.tsx`
  - Renamed `src/components/landing/HowItWorks.tsx` to `src/components/landing/how-it-works-alt.tsx`
  - Renamed `src/components/landing/FeatureShowcase.tsx` to `src/components/landing/feature-showcase.tsx`
  - Renamed `src/app/landing/components/CallToAction.tsx` to `src/app/landing/components/call-to-action.tsx`
  - Renamed `src/app/landing/components/HeroSection.tsx` to `src/app/landing/components/hero-section.tsx`
  - Renamed `src/app/landing/components/HowItWorks.tsx` to `src/app/landing/components/how-it-works.tsx`
  - Renamed `src/app/landing/components/FeatureShowcase.tsx` to `src/app/landing/components/feature-showcase.tsx`

- Updated imports in affected files:
  - Updated imports in `src/app/landing/page.tsx`

- Established consistent naming conventions:
  - React components with JSX: Use `.tsx` extension with kebab-case naming
  - Hooks and utility functions: Use `.ts` extension with kebab-case naming

> **Note:** There are still inconsistencies in hook naming conventions throughout the codebase. Some hooks use kebab-case (`use-in-view.ts`) while others use camelCase (`useAuthGuard.ts`). A future task should standardize all hook names to follow the kebab-case convention for better consistency.

## 3. Resolved Node.js Version Compatibility

- Added Node.js version specification in multiple places:
  - Added `"engines": { "node": ">=20.0.0" }` to `package.json`
  - Created `.node-version` file with `20`
  - Created `.nvmrc` file with `20`
  - Created `vercel.json` with deployment configuration

## 4. Removed Windows-Specific Dependencies

- Added a `postinstall` script to `package.json` to remove Windows-specific SWC binary
- Created cross-platform build script `build.js` using Node.js instead of bash
- Added `build:clean` script to package.json that runs build.js
- Updated `vercel.json` to use `npm run build:clean` as the build command

## 5. Fixed Next.js Configuration

- Ensured `next.config.js` uses the correct configuration options:
  - Using `serverExternalPackages` instead of deprecated `serverComponentsExternalPackages`
  - Removed deprecated `swcMinify` option

## 6. Added Deployment Configuration

- Created `vercel.json` with deployment settings
- Created `build.js` for cross-platform build process
- Updated `README.md` with deployment instructions

## 7. Added CSS Gradient Classes

- Ensured all required gradient classes are defined in `src/styles/globals.css`

## 8. Fixed Next.js Dependency Mismatches

- Enhanced `build.js` to detect and fix mismatched Next.js dependencies
- Added cache cleaning to ensure clean builds
- Added automatic reinstallation of dependencies when version mismatches are detected

## Testing

To test these fixes locally before deploying:

1. Delete `node_modules` and `.next` folders
2. Run `npm install`
3. Run `npm run build:clean`

If the build completes successfully, the fixes should resolve the deployment issues.

## Remaining Tasks

The following tasks should be addressed to further improve codebase consistency:

1. **Standardize Hook Naming Conventions**:
   - Convert all camelCase hook files to kebab-case (e.g., `useAuthGuard.ts` → `use-auth-guard.ts`)
   - Affected files:
     - `useTheme.ts` → `use-theme.ts`
     - `useErrorHandler.ts` → `use-error-handler.ts`
     - `useAuthGuard.ts` → `use-auth-guard.ts`
     - `useSelectedAgents.ts` → `use-selected-agents.ts`
     - `useLocalStorage.ts` → `use-local-storage.ts`
     - `useTutorialProgress.ts` → `use-tutorial-progress.ts`
     - `useForm.ts` → `use-form.ts`

2. **Standardize Component Naming Conventions**:
   - Convert all PascalCase component files in the root components directory to kebab-case
   - Affected files:
     - `OnboardingSystem.tsx` → `onboarding-system.tsx`
     - `ErrorMonitoringDashboard.tsx` → `error-monitoring-dashboard.tsx`
     - `TutorialProgress.tsx` → `tutorial-progress.tsx`
     - `DiagnosticErrorBoundary.tsx` → `diagnostic-error-boundary.tsx`
     - `WalletConnection.tsx` → `wallet-connection.tsx`

3. **Resolve Duplicate Hero Section Files**:
   - Review and consolidate the following files:
     - `src/components/landing/hero-section.tsx`
     - `src/components/landing/hero-section-alternative.tsx`
     - `src/components/landing/hero-section-alt.tsx` (appears to be empty)

4. **Resolve Duplicate How-It-Works Files**:
   - Review and consolidate the following files:
     - `src/components/landing/how-it-works-alt.tsx`
     - `src/components/landing/how-it-works-section.tsx`

## Maintenance Tools

To assist with the codebase maintenance tasks, the following scripts have been created:

### Analysis Tools

- **analyze-codebase.js** - Comprehensive codebase analysis tool that identifies:
  - Naming convention issues (hooks, components)
  - Duplicate component files
  - Import statement inconsistencies
  - Run with `npm run maintenance:analyze`

- **check-duplicates.js** - Identifies duplicate landing page components
  - Run with `npm run maintenance:check-duplicates`

- **consolidate-duplicates.js** - Analyzes duplicate components and provides recommendations for consolidation
  - Run with `npm run maintenance:consolidate-duplicates`

### Rename Tools

- **rename-hooks.js** - Renames camelCase hook files to kebab-case and identifies affected imports
  - Run with `npm run maintenance:rename-hooks`

- **rename-components.js** - Renames PascalCase component files to kebab-case and identifies affected imports
  - Run with `npm run maintenance:rename-components`

## Roadmap for Next Steps

To improve code quality and maintainability, follow this roadmap:

1. **Analyze** - Run the analysis script to get a comprehensive view of issues
   ```bash
   npm run maintenance:analyze
   ```

2. **Fix Naming Conventions** - Standardize hook and component names
   ```bash
   npm run maintenance:rename-hooks
   npm run maintenance:rename-components
   ```
   Then manually update imports in the affected files highlighted by the scripts

3. **Consolidate Duplicates** - Remove redundant components
   ```bash
   npm run maintenance:consolidate-duplicates
   ```
   Follow the recommendations to merge functionality and update imports

4. **Standardize Import Styles** - Based on the analysis, choose one consistent import style:
   - Prefer absolute imports with aliases (`@/components/...`) over relative imports
   - Standardize on named exports vs. default exports where possible

5. **Final Verification** - Run the analysis again to confirm fixes
   ```bash
   npm run maintenance:analyze
   ```

6. **Add Linting Rules** - Consider adding ESLint rules to enforce the established conventions 