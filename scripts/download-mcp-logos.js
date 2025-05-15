const https = require('https');
const fs = require('fs');
const path = require('path');

/**
 * Script to download cryptocurrency logos from the MCP repository
 * to update the local logos collection
 */

// Create the directory if it doesn't exist
const outputDir = path.join(__dirname, '..', 'public', 'crypto-logos', 'mcp');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
  console.log(`Created directory: ${outputDir}`);
}

// Map of cryptocurrency symbols to their SVG URLs in the MCP repository
// These are based on the search results from the MCP repository
const logoMap = {
  // Native tokens
  'eth': 'https://raw.githubusercontent.com/mohammadaminmg10/crypto-asset-logos/main/svg/ETH.svg',
  'btc': 'https://raw.githubusercontent.com/mohammadaminmg10/crypto-asset-logos/main/svg/BTC.BTC.svg',
  'bnb': 'https://raw.githubusercontent.com/mohammadaminmg10/crypto-asset-logos/main/svg/BNB.svg',
  // Custom Solana logo with black circular background
  'sol': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPGNpcmNsZSBjeD0iNTAiIGN5PSI1MCIgcj0iNTAiIGZpbGw9IiMwMDAwMDAiLz4KICA8ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgyMCwgMjUpIj4KICAgIDxwYXRoIGQ9Ik0wIDEwIEw0NSAwIEw2MCA1IEwxNSAxNSBMMCAxMFoiIGZpbGw9InVybCgjZ3JhZGllbnQxKSIvPgogICAgPHBhdGggZD0iTTAgMjUgTDQ1IDE1IEw2MCAyMCBMMTUgMzAgTDAgMjVaIiBmaWxsPSJ1cmwoI2dyYWRpZW50MikiLz4KICAgIDxwYXRoIGQ9Ik0wIDQwIEw0NSAzMCBMNjAgMzUgTDE1IDQ1IEwwIDQwWiIgZmlsbD0idXJsKCNncmFkaWVudDMpIi8+CiAgPC9nPgogIDxkZWZzPgogICAgPGxpbmVhckdyYWRpZW50IGlkPSJncmFkaWVudDEiIHgxPSIwIiB5MT0iMTAiIHgyPSI2MCIgeTI9IjUiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KICAgICAgPHN0b3Agb2Zmc2V0PSIwIiBzdG9wLWNvbG9yPSIjOTc0NkZGIi8+CiAgICAgIDxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzA3RjVEQiIvPgogICAgPC9saW5lYXJHcmFkaWVudD4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0iZ3JhZGllbnQyIiB4MT0iMCIgeTE9IjI1IiB4Mj0iNjAiIHkyPSIyMCIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPgogICAgICA8c3RvcCBvZmZzZXQ9IjAiIHN0b3AtY29sb3I9IiM5NzQ2RkYiLz4KICAgICAgPHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjMDdGNURCIi8+CiAgICA8L2xpbmVhckdyYWRpZW50PgogICAgPGxpbmVhckdyYWRpZW50IGlkPSJncmFkaWVudDMiIHgxPSIwIiB5MT0iNDAiIHgyPSI2MCIgeTI9IjM1IiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+CiAgICAgIDxzdG9wIG9mZnNldD0iMCIgc3RvcC1jb2xvcj0iI0M5MzVGRiIvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiM1Njc1RkYiLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgPC9kZWZzPgo8L3N2Zz4=',
  'ada': 'https://raw.githubusercontent.com/mohammadaminmg10/crypto-asset-logos/main/svg/ADA.svg',
  'xrp': 'https://raw.githubusercontent.com/mohammadaminmg10/crypto-asset-logos/main/svg/XRP.svg',
  'dot': 'https://raw.githubusercontent.com/mohammadaminmg10/crypto-asset-logos/main/svg/DOT.svg',
  'link': 'https://raw.githubusercontent.com/mohammadaminmg10/crypto-asset-logos/main/svg/LINK.svg',
  'doge': 'https://raw.githubusercontent.com/mohammadaminmg10/crypto-asset-logos/main/svg/DOGE.DOGE.svg',
  'avax': 'https://raw.githubusercontent.com/mohammadaminmg10/crypto-asset-logos/main/svg/AVAX.svg',
  'matic': 'https://raw.githubusercontent.com/mohammadaminmg10/crypto-asset-logos/main/svg/MATIC.svg',
  'ltc': 'https://raw.githubusercontent.com/mohammadaminmg10/crypto-asset-logos/main/svg/LTC.LTC.svg',
  'uni': 'https://raw.githubusercontent.com/mohammadaminmg10/crypto-asset-logos/main/svg/UNI.svg',
  'dai': 'https://raw.githubusercontent.com/mohammadaminmg10/crypto-asset-logos/main/svg/DAI.svg',
  'usdt': 'https://raw.githubusercontent.com/mohammadaminmg10/crypto-asset-logos/main/svg/USDT.svg',
  'usdc': 'https://raw.githubusercontent.com/mohammadaminmg10/crypto-asset-logos/main/svg/USDC.svg',
  'busd': 'https://raw.githubusercontent.com/mohammadaminmg10/crypto-asset-logos/main/svg/BUSD.svg',
  'wbtc': 'https://raw.githubusercontent.com/mohammadaminmg10/crypto-asset-logos/main/svg/WBTC.svg',
  'sushi': 'https://raw.githubusercontent.com/mohammadaminmg10/crypto-asset-logos/main/svg/SUSHI.svg',
  'aave': 'https://raw.githubusercontent.com/mohammadaminmg10/crypto-asset-logos/main/svg/AAVE.svg',
  'cake': 'https://raw.githubusercontent.com/mohammadaminmg10/crypto-asset-logos/main/svg/CAKE.svg',
  'ftm': 'https://raw.githubusercontent.com/mohammadaminmg10/crypto-asset-logos/main/svg/FTM.svg',
  
  // Non-native tokens (with chain emblem)
  'eth.usdt': 'https://raw.githubusercontent.com/mohammadaminmg10/crypto-asset-logos/main/svg/ETH.USDT.svg',
  'eth.usdc': 'https://raw.githubusercontent.com/mohammadaminmg10/crypto-asset-logos/main/svg/ETH.USDC.svg',
  'bnb.usdt': 'https://raw.githubusercontent.com/mohammadaminmg10/crypto-asset-logos/main/svg/BNB.USDT.svg',
  'bnb.usdc': 'https://raw.githubusercontent.com/mohammadaminmg10/crypto-asset-logos/main/svg/BSC.USDC.svg',
  'eth.link': 'https://raw.githubusercontent.com/mohammadaminmg10/crypto-asset-logos/main/svg/ETH.LINK.svg',
  'eth.wbtc': 'https://raw.githubusercontent.com/mohammadaminmg10/crypto-asset-logos/main/svg/ETH.WBTC.svg',
  'bnb.eth': 'https://raw.githubusercontent.com/mohammadaminmg10/crypto-asset-logos/main/svg/BNB.ETH.svg',
  'bnb.ada': 'https://raw.githubusercontent.com/mohammadaminmg10/crypto-asset-logos/main/svg/BNB.ADA.svg',
  'bnb.dot': 'https://raw.githubusercontent.com/mohammadaminmg10/crypto-asset-logos/main/svg/BNB.DOT.svg',
  'bnb.cake': 'https://raw.githubusercontent.com/mohammadaminmg10/crypto-asset-logos/main/svg/BNB.CAKE.svg'
};

/**
 * Downloads a file from a URL to a local path
 */
async function downloadFile(url, filename) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(path.join(outputDir, filename));
    
    https.get(url, response => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        console.log(`Redirecting to: ${redirectUrl}`);
        
        https.get(redirectUrl, redirectResponse => {
          redirectResponse.pipe(file);
          file.on('finish', () => {
            file.close();
            resolve();
          });
        }).on('error', err => {
          fs.unlink(path.join(outputDir, filename));
          reject(err);
        });
        
        return;
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: HTTP status ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', err => {
      fs.unlink(path.join(outputDir, filename));
      reject(err);
    });
  });
}

/**
 * Download all logos with a delay between each to avoid rate limiting
 */
async function downloadLogos() {
  let count = 0;
  
  for (const [symbol, url] of Object.entries(logoMap)) {
    try {
      const filename = `${symbol}.svg`;
      
      // Handle data URI (for Solana) differently than URL downloads
      if (url.startsWith('data:image/svg+xml;base64,')) {
        console.log(`Processing data URI for ${filename}...`);
        // Extract base64 data
        const base64Data = url.replace('data:image/svg+xml;base64,', '');
        // Convert base64 to buffer and write to file
        fs.writeFileSync(path.join(outputDir, filename), Buffer.from(base64Data, 'base64'));
        console.log(`Successfully saved ${filename} from data URI`);
        count++;
      } else {
        // Regular URL download
        console.log(`Downloading ${filename} from ${url}...`);
        await downloadFile(url, filename);
        console.log(`Successfully downloaded ${filename}`);
        count++;
        
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error(`Error processing ${symbol}: ${error.message}`);
    }
  }
  
  console.log(`\nDownload complete. Successfully downloaded ${count} of ${Object.keys(logoMap).length} logos.`);
}

// Run the download function
downloadLogos(); 