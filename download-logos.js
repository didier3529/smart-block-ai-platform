const https = require('https');
const fs = require('fs');
const path = require('path');

const logos = {
  ethereum: 'https://raw.githubusercontent.com/ethereum/ethereum-org-website/master/src/assets/eth-logo.svg',
  polygon: 'https://raw.githubusercontent.com/maticnetwork/matic-docs/master/static/img/polygon-logo.svg',
  optimism: 'https://raw.githubusercontent.com/ethereum-optimism/brand-kit/main/assets/svg/optimism-logo.svg',
  solana: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png'
};

function downloadFile(url, filename) {
  const file = fs.createWriteStream(path.join('public', filename));
  https.get(url, response => response.pipe(file));
}

for (const [name, url] of Object.entries(logos)) {
  const ext = path.extname(url);
  const filename = `${name}-logo${ext}`;
  console.log(`Downloading ${filename}...`);
  downloadFile(url, filename);
} 