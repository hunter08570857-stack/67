import { CandleData, DataMode, TimeRange, StockData } from '../types';
import { getAppMode, getEnv } from './configService';

// --- MOCK GENERATORS ---
const generateMockCandles = (symbol: string, days: number): CandleData[] => {
  const data: CandleData[] = [];
  let price = symbol === 'AAPL' ? 150 : 100;
  if (symbol === 'TSLA') price = 200;
  if (symbol === 'NVDA') price = 400;

  const now = new Date();
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    const volatility = price * 0.02;
    const change = (Math.random() - 0.5) * volatility;
    
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + Math.random() * volatility * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * 0.5;
    const volume = Math.floor(Math.random() * 1000000) + 500000;

    data.push({
      time: date.toISOString().split('T')[0],
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume
    });
    price = close;
  }
  return data;
};

// --- API FETCHERS ---

// Get Candle Data
export const fetchCandles = async (symbol: string, range: TimeRange): Promise<CandleData[]> => {
  const mode = getAppMode();
  const { FINNHUB_KEY } = getEnv();
  
  // Logic: Use Mock if mode is MOCK OR if the specific API key is missing (even in REAL mode)
  if (mode === DataMode.MOCK || !FINNHUB_KEY) {
    if (mode === DataMode.REAL && !FINNHUB_KEY) {
      console.warn("Finnhub Key missing. Falling back to Mock data for Candles.");
    }
    
    // 模擬資料：根據時間範圍產生對應數量的 K 線
    const days = range === '1D' ? 1 : range === '1M' ? 30 : 365;
    return new Promise((resolve) => {
      setTimeout(() => resolve(generateMockCandles(symbol, days)), 600);
    });
  }

  // 真實資料：Finnhub API
  try {
    // Calculate timestamps
    const to = Math.floor(Date.now() / 1000);
    let from = to;
    let resolution = 'D';

    if (range === '1D') { from = to - 86400 * 2; resolution = '60'; } // Intraday mock via 60min for simplicity in free tier
    else if (range === '1M') { from = to - 86400 * 30; resolution = 'D'; }
    else if (range === '1Y') { from = to - 86400 * 365; resolution = 'W'; }

    const response = await fetch(`https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${to}&token=${FINNHUB_KEY}`);
    const data = await response.json();

    if (data.s === 'ok') {
      return data.t.map((timestamp: number, index: number) => ({
        time: new Date(timestamp * 1000).toISOString().split('T')[0],
        open: data.o[index],
        high: data.h[index],
        low: data.l[index],
        close: data.c[index],
        volume: data.v[index]
      }));
    } else {
      // API returned success=no data, fallback to mock
      console.warn("Finnhub returned no data, falling back to mock.");
      return generateMockCandles(symbol, 30);
    }
  } catch (e) {
    console.error("Fetch candles failed (Network/API Error), falling back to mock", e);
    // Fallback mechanism to prevent white screen
    return generateMockCandles(symbol, 30);
  }
};

// Get Current Quote
export const fetchQuote = async (symbol: string): Promise<StockData | null> => {
  const mode = getAppMode();
  const { FINNHUB_KEY } = getEnv();

  // Logic: Use Mock if mode is MOCK OR if the specific API key is missing
  if (mode === DataMode.MOCK || !FINNHUB_KEY) {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          c: Math.random() * 100 + 100,
          h: 210,
          l: 190,
          o: 195,
          pc: 198,
          t: Date.now(),
          v: 1000000
        });
      }, 500);
    });
  } 

  try {
    const response = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_KEY}`);
    const data = await response.json();
    if (!data.c) throw new Error("Invalid quote data");
    return data as StockData;
  } catch (e) {
    console.error("Quote fetch failed", e);
    // If real fetch fails, return null or fallback? 
    // For a smoother user experience, let's return a Mock quote but log the error
    return {
      c: Math.random() * 100 + 100,
      h: 200,
      l: 100,
      o: 150,
      pc: 150,
      t: Date.now(),
      v: 0
    };
  }
};