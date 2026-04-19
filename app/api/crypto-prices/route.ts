export const runtime = 'edge';
export const preferredRegion = 'iad1';

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
    const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=5m&limit=2`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length < 2) {
      return null;
    }

    const previousClose = parseFloat(data[0][4]);
    const currentClose = parseFloat(data[1][4]);
    const currentTime = data[1][0];

    return {
      current: currentClose,
      previous: previousClose,
      timestamp: currentTime,
    };
  } catch (error) {
    return null;
  }
}

async function sendTelegramMessage(message: string): Promise<{ success: boolean; response?: unknown; error?: string }> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
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

    if (data.ok) {
      return { success: true, response: data };
    } else {
      return { success: false, error: data.description };
    }
  } catch (error) {
    return { success: false, error: 'Telegram send failed' };
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

    // Fetch 5-minute candles for all cryptos in PARALLEL
    const candlePromises = MAJOR_CRYPTOS.map((crypto) => fetch5MinuteCandles(crypto.binanceSymbol));
    const candleResults = await Promise.all(candlePromises);

    // Process results
    candleResults.forEach((candleData, index) => {
      if (candleData) {
        const crypto = MAJOR_CRYPTOS[index];
        const priceChange = ((candleData.current - candleData.previous) / candleData.previous) * 100;

        const coinInfo = {
          name: crypto.name,
          symbol: crypto.binanceSymbol.replace('USDT', ''),
          price: candleData.current,
          change: priceChange,
        };

        allCoins.push(coinInfo);

        if (Math.abs(priceChange) > 1 || forceAlert) {
          significantChanges.push(coinInfo);
        }
      }
    });

    if (significantChanges.length > 0) {
      const message = formatTelegramMessage(significantChanges);
      telegramResult = await sendTelegramMessage(message);
    }

    const responseData = {
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
    };

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const errorData = {
      error: 'Failed to check crypto prices',
      details: 'Internal server error',
    };

    return new Response(JSON.stringify(errorData), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function POST(request: Request) {
  return GET(request);
}
