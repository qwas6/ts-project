import type { Timeframe } from '../types';

export const TIMEFRAME_CONFIG: Record<Timeframe, { ms: number; label: string }> = {
    '5s': { ms: 5000, label: '5 сек' },
    '10s': { ms: 10000, label: '10 сек' },
    '30s': { ms: 30000, label: '30 сек' },
    '1m': { ms: 60000, label: '1 мин' },
    '5m': { ms: 300000, label: '5 мин' }
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