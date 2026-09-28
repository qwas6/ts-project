import type { Timeframe } from '../types';

export const TIMEFRAME_CONFIG: Record<Timeframe, { ms: number; label: string; binance: string }> = {
    '1m':  { ms: 60_000,           label: '1 мин',  binance: '1m'  },
    '5m':  { ms: 5 * 60_000,       label: '5 мин',  binance: '5m'  },
    '15m': { ms: 15 * 60_000,      label: '15 мин', binance: '15m' },
    '1h':  { ms: 60 * 60_000,      label: '1 час',  binance: '1h'  },
    '4h':  { ms: 4 * 60 * 60_000,  label: '4 часа', binance: '4h'  }
};

export const CRYPTOS = [
    { symbol: 'BTC', name: 'Bitcoin' },
    { symbol: 'ETH', name: 'Ethereum' },
    { symbol: 'BNB', name: 'Binance Coin' },
    { symbol: 'SOL', name: 'Solana' },
    { symbol: 'DOGE', name: 'Dogecoin' }
];

export const COLORS: Record<string, string> = {
    BTC: '#f7931a',
    ETH: '#627eea',
    BNB: '#f3ba2f',
    SOL: '#00ffbd',
    DOGE: '#c3a634'
};

export const ALL_SYMBOLS = ['BTC', 'ETH', 'BNB', 'SOL', 'DOGE'];