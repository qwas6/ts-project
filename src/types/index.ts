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

export type Timeframe = '5s' | '10s' | '30s' | '1m' | '5m';