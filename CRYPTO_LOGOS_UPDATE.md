# Crypto Logos Update Documentation

## Overview
This document details the process of updating cryptocurrency logos in the ChainOracle application using the cryptologos.cc source.

## Changes Made

### 1. Logo Download Script
Created `scripts/download-logos.js` to fetch logos from cryptologos.cc:
```javascript
const logos = {
  bitcoin: 'https://cryptologos.cc/logos/bitcoin-btc-logo.svg',
  ethereum: 'https://cryptologos.cc/logos/ethereum-eth-logo.svg',
  solana: 'https://cryptologos.cc/logos/solana-sol-logo.svg',
  polygon: 'https://cryptologos.cc/logos/polygon-matic-logo.svg',
  cardano: 'https://cryptologos.cc/logos/cardano-ada-logo.svg',
  avalanche: 'https://cryptologos.cc/logos/avalanche-avax-logo.svg',
  chainlink: 'https://cryptologos.cc/logos/chainlink-link-logo.svg',
  polkadot: 'https://cryptologos.cc/logos/polkadot-new-dot-logo.svg',
  near: 'https://cryptologos.cc/logos/near-protocol-near-logo.svg',
  arbitrum: 'https://cryptologos.cc/logos/arbitrum-arb-logo.svg',
  optimism: 'https://cryptologos.cc/logos/optimism-op-logo.svg'
}
```

The script includes:
- Automatic directory creation
- Error handling
- Rate limiting (1 second delay between downloads)
- User-Agent headers to prevent blocking
- Redirect handling for logo downloads

### 2. Component Updates
Updated the CryptoIcon component in `src/components/ui/crypto-icon.tsx`:
```typescript
export function CryptoIcon({ symbol, size = "md", className }: CryptoIconProps) {
  const sizeClasses = {
    sm: "h-5 w-5",
    md: "h-6 w-6",
    lg: "h-10 w-10"
  }

  return (
    <img 
      src={`/crypto-logos/${symbol.toLowerCase()}-logo.svg`} 
      alt={symbol}
      className={cn(
        sizeClasses[size],
        "rounded-full",
        className
      )}
      onError={(e) => {
        // Fallback with symbol's first letter
        e.currentTarget.src = `data:image/svg+xml,...`;
      }}
    />
  )
}
```

### 3. Directory Structure
Created new directory structure for logos:
```
public/
  └── crypto-logos/
      ├── bitcoin-logo.svg
      ├── ethereum-logo.svg
      ├── solana-logo.svg
      └── ... (other crypto logos)
```

### 4. Components Using Crypto Logos
The following components were updated to use the new logo system:
- `DirectPortfolioOverview`
- `PortfolioAssets`
- `PortfolioOverview`

### 5. Issues Encountered & Solutions

#### Issue 1: Missing Embedded Icon Component
- Error encountered with missing `embedded-crypto-icon.tsx`
- Initially created a bridge component
- Later determined it was unnecessary and removed

#### Issue 2: Image Loading
- Added proper error handling in CryptoIcon component
- Implemented SVG-based fallback for missing logos
- Ensured consistent sizing across different contexts

## Usage
To use the crypto logos in components:

```typescript
import { CryptoIcon } from "@/components/ui/crypto-icon"

// In your component:
<CryptoIcon symbol="BTC" size="md" />
```

## Available Sizes
- `sm`: 20x20px
- `md`: 24x24px
- `lg`: 40x40px

## Maintenance
To add new crypto logos:
1. Add the URL to the `logos` object in `scripts/download-logos.js`
2. Run `node scripts/download-logos.js` to download new logos
3. Commit the new SVG files to the repository

## Future Improvements
1. Add more cryptocurrencies to the logo collection
2. Implement lazy loading for better performance
3. Add color variants for logos
4. Consider implementing a CDN for logo delivery 