#!/usr/bin/env node
const https = require('https');

const TOKEN_MAP = {
  'BTC': 'bitcoin', 'ETH': 'ethereum', 'GHST': 'aavegotchi',
  'MATIC': 'matic-network', 'USDC': 'usd-coin', 'USDT': 'tether',
  'DAI': 'dai', 'WETH': 'weth', 'UNI': 'uniswap', 'AAVE': 'aave',
  'LINK': 'chainlink', 'SOL': 'solana', 'AAI': 'aaigotchi'
};

function parseTimestamp(input) {
  // Try DD-MM-YYYY format first (e.g., "2026-02-12")
  const ddmmyyyyMatch = input.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (ddmmyyyyMatch) {
    const [, day, month, year] = ddmmyyyyMatch;
    const date = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)));
    return date;
  }
  
  // Try Unix timestamp fallback
  if (!isNaN(input)) {
    return new Date(parseInt(input) * 1000);
  }
  
  // Try standard ISO format
  try {
    return new Date(input);
  } catch (e) {
    // Invalid date, return null to trigger fallback
    return null;
  }
}

function formatDate(date) {
  if (!date || date.getTime() !== date.getTime()) {
    return 'Invalid Date';
  }
  
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const year = date.getUTCFullYear();
  
  return day + '-' + month + '-' + year;
}

async function fetchPrice(tokenId, date) {
  const dateStr = formatDate(date);
  const tokenUpper = tokenId.toUpperCase();
  const token = tokenId === 'AAI' ? 'aaigotchi' : tokenId;
  
  const url = 'https://api.coingecko.com/api/v3/coins/' + token + '/history?date=' + dateStr;
  
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          
          // Check for DD-MM-YYYY format support (future enhancement)
          if (json.market_data && json.market_data.current_price) {
            resolve({
              name: json.name,
              symbol: json.symbol.toUpperCase(),
              price: json.market_data.current_price.usd,
              timestamp: date.toISOString()
            });
          } else {
            // Historical data may not be available
            reject(new Error('No price data for ' + token + ' on ' + dateStr));
          }
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: node get-price.js <TOKEN> <TIMESTAMP>');
    console.error('Example: node get-price.js ETH 1704067200');
    console.error('Example: node get-price.js GHST 2026-02-12 (DD-MM-YYYY format)');
    process.exit(1);
  }
  
  const tokenInput = args[0].toUpperCase();
  const timestampInput = args.slice(1).join(' ');
  
  try {
    console.log('Fetching ' + tokenInput + ' price at ' + timestampInput + '...');
    
    const date = parseTimestamp(timestampInput);
    
    if (!date) {
      console.error('Error: Invalid timestamp format: ' + timestampInput);
      console.error('Supported formats: DD-MM-YYYY, Unix timestamp, ISO format');
      process.exit(1);
    }
    
    const result = await fetchPrice(tokenInput, date);
    console.log('');
    console.log(result.name + ' (' + result.symbol + ')');
    console.log('Date: ' + result.timestamp);
    console.log('Price: $' + result.price.toFixed(6) + ' USD');
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
