# Cryptocurrency Logos Update from MCP Repository

This document explains how to update the cryptocurrency logos in the ChainOracle application using the MCP repository (mohammadaminmg10/crypto-asset-logos).

## Overview

The MCP repository contains up-to-date SVG logos for various cryptocurrencies, including:
- Native tokens (e.g., BTC, ETH)
- Non-native tokens with chain indicators (e.g., ETH.USDT, BNB.ETH)
- Custom Solana logo with black circular background

This update adds a new directory structure and enhances the CryptoIcon component to use these improved logos while maintaining backwards compatibility.

## Changes Made

### 1. Updated CryptoIcon Component

The `CryptoIcon` component now attempts to load logos from three sources in this order:
1. The new MCP logos directory `/crypto-logos/mcp/`
2. The existing crypto-icons directory `/crypto-icons/`
3. A fallback SVG with the first letter of the symbol if both sources fail

This approach ensures backward compatibility while preferring the newer, higher-quality logos.

### 2. Download Script

Created `scripts/download-mcp-logos.js` to fetch logos from the MCP repository:
- Downloads both native and non-native token logos
- Handles HTTP redirects
- Includes error handling
- Implements rate limiting to avoid overloading servers
- Includes a custom Solana logo with black circular background

### 3. Directory Structure

```
public/
  ├── crypto-icons/      (existing directory - maintained for backward compatibility)
  └── crypto-logos/
      └── mcp/           (new directory with updated logos)
          ├── btc.svg
          ├── eth.svg
          ├── sol.svg    (custom Solana logo with black background)
          └── ... other crypto logos
```

## How to Update Logos

Follow these steps to update the cryptocurrency logos:

1. Run the download script:
   ```bash
   node scripts/download-mcp-logos.js
   ```

2. The script will:
   - Create the `/public/crypto-logos/mcp/` directory if it doesn't exist
   - Download all logos defined in the script
   - Generate the custom Solana logo from embedded SVG data
   - Log the progress and any errors

3. After running the script, the CryptoIcon component will automatically use the new logos.

## Adding More Logos

To add more cryptocurrency logos:

1. Open `scripts/download-mcp-logos.js`
2. Add new entries to the `logoMap` object, following the pattern:
   ```javascript
   'symbol': 'URL_to_logo',
   ```
3. For non-native tokens, use the format:
   ```javascript
   'chain.token': 'URL_to_logo',
   ```
4. Run the download script again

## Implementation Benefits

1. **Better Visual Quality**: SVG logos maintain quality at any size
2. **Chain Indicators**: Non-native tokens show which chain they belong to
3. **Fallback System**: Multi-tier fallback ensures logos always display
4. **Consistency**: Standardized appearance across the application
5. **Future Updates**: Easy to add or update logos as cryptocurrencies evolve
6. **Custom Solana Logo**: Special Solana logo with black background for better visibility

## Components Updated

The following components have been updated to use the improved CryptoIcon:
- PortfolioAssets - Updated to use CryptoIcon instead of direct img reference
- PortfolioOverview - Updated to use CryptoIcon instead of direct img reference
- DirectPortfolioOverview - Was already using CryptoIcon (automatically benefits)
- Any other components using CryptoIcon will automatically benefit from the upgrade

## Usage Example

To use the crypto logos in components:

```jsx
import { CryptoIcon } from "@/components/ui/crypto-icon"

// In your component:
<CryptoIcon symbol="BTC" size="md" />

// For non-native tokens, include the chain:
<CryptoIcon symbol="eth.usdt" size="md" />
```

## Available Sizes

- `sm`: 20x20px
- `md`: 24x24px
- `lg`: 40x40px 