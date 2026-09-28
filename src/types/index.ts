export interface CandleData {
    time: string;
    open: number;
    high: number;
    low: number;
    close: number;
    timestamp: number;
    isClosed: boolean;
}

export interface ChartData {
    time: string;
    price: number;
    timestamp: number;
}

export interface HistoryItem {
    symbol: string;
    price: number;
    time: string;
    timestamp: number;
}

export type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h';

export interface FuturesPosition {
    id: string;
    symbol: string;
    side: 'long' | 'short';
    entryPrice: number;
    quantity: number;
    leverage: number;
    margin: number;
    openedAt: number;
    status: 'open' | 'closed';
    closedAt: number | null;
    closePrice: number | null;
    realizedPnl: number | null;
}