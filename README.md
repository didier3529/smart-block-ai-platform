# ChainOracle

AI-powered blockchain analytics platform.

## Development Requirements

- Node.js 20.x or higher
- npm 10.x or higher

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/didier3529/chainoracle2.git
cd chainoracle2
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3006](http://localhost:3006) with your browser to see the result.

## Deployment

### Vercel Deployment

The project is configured for deployment on Vercel. It includes:

- `vercel.json` - Configuration for Vercel deployment
- `.node-version` - Specifies Node.js version 20.x
- `.nvmrc` - For Node.js version managers
- `build.js` - Cross-platform build script for deployment

To deploy to Vercel:

1. Connect your GitHub repository to Vercel
2. Configure the following settings:
   - Framework Preset: Next.js
   - Node.js Version: 20.x
   - Build Command: `npm run build:clean`

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```
NEXT_PUBLIC_APP_ENV=development
```

For production, set appropriate values through the Vercel dashboard.

## Codebase Maintenance

The project has been refactored to follow consistent naming conventions and improve code quality:

1. All hooks use kebab-case naming convention (e.g., `use-theme.ts`)
2. All components use kebab-case naming convention (e.g., `hero-section.tsx`)
3. Build process has been enhanced to handle cross-platform deployment

For detailed information about the maintenance work and future tasks, see [MAINTENANCE.md](./MAINTENANCE.md).

## Project Structure

- `/src/app` - Next.js app router
- `/src/components` - React components
- `/src/hooks` - Custom React hooks
- `/src/lib` - Utility functions and shared code
- `/src/styles` - Global styles and Tailwind configuration 