# Crypto Price Monitoring Endpoint

## Overview
This endpoint monitors major cryptocurrency prices and sends Telegram notifications when price changes exceed 1% within a 5-minute window.

## Features
- 🔄 Monitors 10 major cryptocurrencies (Bitcoin, Ethereum, Solana, Cardano, Polkadot, Dogecoin, Ripple, Litecoin, Binance Coin, Avalanche)
- 📊 Tracks 5-minute price changes
- 🚨 Sends formatted Telegram alerts for >1% changes
- 💾 In-memory price caching with timestamps
- 📈 Real-time price tracking

## Endpoint

### GET `/api/crypto-prices`
Fetches current crypto prices and checks for significant changes.

**Response:**
```json
{
  "success": true,
  "timestamp": "2024-04-20T10:30:45.123Z",
  "pricesChecked": 10,
  "significantChanges": 2,
  "coins": [
    {
      "symbol": "BIT",
      "name": "Bitcoin",
      "price": 45000.50
    }
  ],
  "changedCoins": [
    {
      "name": "Bitcoin",
      "symbol": "BIT",
      "price": 45000.50,
      "change": 1.5
    }
  ],
  "message": "Found 2 coin(s) with >1% price change in 5 minutes"
}
```

### POST `/api/crypto-prices`
Manual trigger to check prices (same as GET).

## Setup

### 1. Create a Telegram Bot
1. Open Telegram and chat with [@BotFather](https://t.me/botfather)
2. Send `/newbot` and follow the steps
3. You'll receive a bot token (save this as `TELEGRAM_BOT_TOKEN`)

### 2. Get Your Chat ID
1. Chat with your new bot to get a message in the chat
2. Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
3. Find your chat ID in the response and save it as `TELEGRAM_CHAT_ID`

### 3. Configure Environment Variables
Create a `.env.local` file in the project root:
```
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here
```

## Monitored Cryptocurrencies
1. Bitcoin (BIT)
2. Ethereum (ETH)
3. Solana (SOL)
4. Cardano (CAR)
5. Polkadot (POL)
6. Dogecoin (DOG)
7. Ripple (RIP)
8. Litecoin (LIT)
9. Binance Coin (BIN)
10. Avalanche (AVA)

## How It Works

1. **Price Fetching**: Retrieves current prices from CoinGecko API (free, no auth required)
2. **Cache Management**: Stores prices with timestamps in memory
3. **Change Detection**: Compares current prices with cached prices from 5+ minutes ago
4. **Threshold Check**: Identifies coins with >1% absolute change
5. **Telegram Alert**: Sends formatted, beautiful message with:
   - Coin names and symbols
   - Current prices
   - Percentage change (with emoji indicators)
   - Timestamp

## Example Telegram Message
```
🚨 Crypto Alert - Price Surge Detected! 🚨

💰 Bitcoin (BIT)
   Price: $45,000.50
   Change (5min): 📈 1.50%

💰 Ethereum (ETH)
   Price: $2,500.25
   Change (5min): 📉 -1.25%

Report Time: 4/20/2024, 10:30:45 AM
```

## Usage

### Development
```bash
npm run dev
# Visit http://localhost:3000/api/crypto-prices
```

### Deployment
- Deploy with your Next.js hosting provider (Vercel, Cloudflare, etc.)
- Configure environment variables in your hosting platform
- Set up a cron job or scheduled task to call the endpoint every 5 minutes

### With a Cron Service
You can use external cron services like:
- **Cron-job.org**: Configure to GET `https://your-domain.com/api/crypto-prices` every 5 minutes
- **Cloudflare Workers**: Schedule with cron trigger
- **AWS Lambda**: Schedule with CloudWatch events

## Notes
- Initial run won't show any changes (no cached prices yet)
- Subsequent runs will compare against 5-minute-old cached prices
- Uses in-memory caching (prices reset on server restart)
- For persistent tracking, consider integrating with a database
