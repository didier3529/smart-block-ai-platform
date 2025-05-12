# App Restart Instructions

## When to Restart the App
The app should be restarted after making any of these changes:

1. Configuration Changes:
   - Changes to next.config.js
   - Updates to package.json
   - Environment variable changes
   - TailwindCSS config changes

2. Core Component Changes:
   - Updates to providers (SettingsProvider, etc.)
   - Changes to global state management
   - Layout modifications
   - Route changes

3. Data Layer Changes:
   - Prisma schema updates
   - API route modifications
   - Database configuration changes

4. Major Feature Changes:
   - New page additions
   - Component restructuring
   - Authentication changes
   - Global styling updates

## Restart Commands
For PowerShell:
```powershell
npx kill-port 3005; npm run dev
```

Note: Always use this sequence to ensure clean restart:
1. Kill existing process on port 3005
2. Start new development server 