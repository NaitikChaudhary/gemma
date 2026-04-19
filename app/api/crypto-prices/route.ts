import { NextResponse } from 'next/server';

interface CoinData {
  name: string;
  symbol: string;
  current_price: number;
}

const MAJOR_CRYPTOS = [
  { id: 'bitcoin', binanceSymbol: 'BTCUSDT', name: 'Bitcoin' },
  { id: 'ethereum', binanceSymbol: 'ETHUSDT', name: 'Ethereum' },
  { id: 'solana', binanceSymbol: 'SOLUSDT', name: 'Solana' },
  { id: 'cardano', binanceSymbol: 'ADAUSDT', name: 'Cardano' },
  { id: 'polkadot', binanceSymbol: 'DOTUSDT', name: 'Polkadot' },
  { id: 'dogecoin', binanceSymbol: 'DOGEUSDT', name: 'Dogecoin' },
  { id: 'ripple', binanceSymbol: 'XRPUSDT', name: 'Ripple' },
  { id: 'litecoin', binanceSymbol: 'LTCUSDT', name: 'Litecoin' },
  { id: 'binancecoin', binanceSymbol: 'BNBUSDT', name: 'Binance Coin' },
  { id: 'avalanche-2', binanceSymbol: 'AVAXUSDT', name: 'Avalanche' },
];

async function fetch5MinuteCandles(
  symbol: string
): Promise<{ current: number; previous: number; timestamp: number } | null> {
  try {
    // Fetch last 2 candles (5 minutes each)
    const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=5m&limit=2`;
    const response = await fetch(url);
    const data = await response.json();

    if (!Array.isArray(data) || data.length < 2) {
      console.warn(`Not enough candle data for ${symbol}`);
      return null;
    }

    // [0] = previous 5m candle, [1] = current 5m candle
    // Each candle: [time, open, high, low, close, volume, ...]
    const previousClose = parseFloat(data[0][4]); // Close price of previous candle
    const currentClose = parseFloat(data[1][4]); // Close price of current candle
    const currentTime = data[1][0];

    return {
      current: currentClose,
      previous: previousClose,
      timestamp: currentTime,
    };
  } catch (error) {
    console.error(`Error fetching candles for ${symbol}:`, error);
    return null;
  }
}

async function sendTelegramMessage(message: string): Promise<{ success: boolean; response?: unknown; error?: string }> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.warn('Telegram credentials not configured');
    return { success: false, error: 'Telegram credentials not configured' };
  }

  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    const data = await response.json();
    console.log('Telegram API response:', data);

    if (data.ok) {
      return { success: true, response: data };
    } else {
      return { success: false, error: data.description, response: data };
    }
  } catch (error) {
    console.error('Error sending Telegram message:', error);
    return { success: false, error: String(error) };
  }
}

function formatTelegramMessage(
  coins: Array<{ name: string; symbol: string; price: number; change: number }>
): string {
  const timestamp = new Date().toLocaleString();
  const coinsList = coins
    .map(
      (coin) =>
        `💰 <b>${coin.name}</b> (${coin.symbol})\n` +
        `   Price: $${coin.price.toFixed(2)}\n` +
        `   Change (5min): ${coin.change > 0 ? '📈' : '📉'} ${Math.abs(coin.change).toFixed(2)}%`
    )
    .join('\n\n');

  return (
    `🚨 <b>Crypto Alert - Price Surge Detected!</b> 🚨\n\n` +
    `${coinsList}\n\n` +
    `<i>Report Time: ${timestamp}</i>`
  );
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const forceAlert = url.searchParams.get('force') === 'true';

    const significantChanges: Array<{
      name: string;
      symbol: string;
      price: number;
      change: number;
    }> = [];

    const allCoins: Array<{
      name: string;
      symbol: string;
      price: number;
      change: number;
    }> = [];

    let telegramResult: { success: boolean; response?: unknown; error?: string } | null = null;

    // Fetch 5-minute candles for each crypto
    for (const crypto of MAJOR_CRYPTOS) {
      const candleData = await fetch5MinuteCandles(crypto.binanceSymbol);

      if (candleData) {
        const priceChange = ((candleData.current - candleData.previous) / candleData.previous) * 100;

        const coinInfo = {
          name: crypto.name,
          symbol: crypto.binanceSymbol.replace('USDT', ''),
          price: candleData.current,
          change: priceChange,
        };

        allCoins.push(coinInfo);

        // Track significant changes (>1%)
        if (Math.abs(priceChange) > 1 || forceAlert) {
          significantChanges.push(coinInfo);
        }
      }
    }

    // Send Telegram notification if there are significant changes
    if (significantChanges.length > 0) {
      const message = formatTelegramMessage(significantChanges);
      telegramResult = await sendTelegramMessage(message);
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      pricesChecked: allCoins.length,
      significantChanges: significantChanges.length,
      coins: allCoins.map((c) => ({
        symbol: c.symbol,
        name: c.name,
        price: c.price,
        change: c.change,
      })),
      changedCoins: significantChanges,
      message:
        significantChanges.length > 0
          ? `🚨 Found ${significantChanges.length} coin(s) with >1% price change in last 5 minutes!`
          : '✅ No significant price changes detected in last 5 minutes',
      telegram: telegramResult || undefined,
      forceAlert,
    });
  } catch (error) {
    console.error('Crypto price check error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch and check crypto prices', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  // Allow manual trigger of the check
  return GET(request);
}
