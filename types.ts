export interface StockData {
  c: number; // Current price
  h: number; // High
  l: number; // Low
  o: number; // Open
  pc: number; // Previous close
  t: number; // Timestamp
  v: number; // Volume
}

export interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Asset {
  symbol: string;
  quantity: number;
  avgCost: number;
}

export interface Transaction {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  price: number;
  quantity: number;
  timestamp: number;
}

export interface PortfolioSummary {
  totalValue: number;
  totalCost: number;
  pnl: number;
  pnlPercent: number;
}

export enum DataMode {
  REAL = 'REAL',
  MOCK = 'MOCK'
}

export interface MarketState {
  symbol: string;
  currentPrice: number | null;
  candles: CandleData[];
  loading: boolean;
  error: string | null;
}

export type TimeRange = '1D' | '1M' | '1Y';
