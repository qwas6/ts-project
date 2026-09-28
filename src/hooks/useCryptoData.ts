import { useState, useEffect, useRef, useCallback } from 'react';
import type { CandleData, ChartData, Timeframe } from '../types';
import { TIMEFRAME_CONFIG } from '../constants';

const BINANCE_API = '/api/binance/api/v3/klines';

 
const getTfConfig = (tf: Timeframe) => {
    return TIMEFRAME_CONFIG[tf] || TIMEFRAME_CONFIG['1m'] || {
        ms: 60000,
        label: '1 мин',
        binance: '1m'
    };
};

export function useCryptoData(symbol: string, initialTimeframe: Timeframe) {
    const [price, setPrice] = useState(0);
    const [change, setChange] = useState(0);
    const [history, setHistory] = useState<ChartData[]>([]);
    const [candles, setCandles] = useState<CandleData[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [timeframe, setTimeframe] = useState<Timeframe>(initialTimeframe);
    const [isLoading, setIsLoading] = useState(true);

    const wsRef = useRef<WebSocket | null>(null);
    const activeCandleRef = useRef<CandleData | null>(null);
    const lastPriceRef = useRef(0);
    const timeframeRef = useRef<Timeframe>(timeframe);

    useEffect(() => {
        if (initialTimeframe !== timeframe) {
            setTimeframe(initialTimeframe);
        }
    }, [initialTimeframe]);

    const formatCandleTime = (timestamp: number): string => {
        const d = new Date(timestamp);
        const hh = d.getHours().toString().padStart(2, '0');
        const mm = d.getMinutes().toString().padStart(2, '0');
        return `${hh}:${mm}`;
    };

    const formatTickTime = (timestamp: number): string => {
        const d = new Date(timestamp);
        const hh = d.getHours().toString().padStart(2, '0');
        const mm = d.getMinutes().toString().padStart(2, '0');
        const ss = d.getSeconds().toString().padStart(2, '0');
        return `${hh}:${mm}:${ss}`;
    };

    const fetchHistory = useCallback(async (tf: Timeframe) => {
        try {
            setIsLoading(true);
            const config = getTfConfig(tf);
            const url = `${BINANCE_API}?symbol=${symbol}USDT&interval=${config.binance}&limit=100`;

            const response = await fetch(url);
            if (!response.ok) {
                setIsLoading(false);
                return;
            }

            const data = await response.json();
            if (!Array.isArray(data)) {
                setIsLoading(false);
                return;
            }

            const candleData: CandleData[] = data.map((item: any[]) => ({
                time: formatCandleTime(item[0]),
                open: parseFloat(item[1]),
                high: parseFloat(item[2]),
                low: parseFloat(item[3]),
                close: parseFloat(item[4]),
                timestamp: item[0],
                isClosed: true
            }));

            const historyData: ChartData[] = candleData.map(c => ({
                time: c.time,
                price: c.close,
                timestamp: c.timestamp
            }));

            setCandles(candleData);
            setHistory(historyData);

            if (candleData.length > 0) {
                const lastCandle = candleData[candleData.length - 1];
                setPrice(lastCandle.close);
                lastPriceRef.current = lastCandle.close;

                activeCandleRef.current = {
                    ...lastCandle,
                    isClosed: false
                };
            }

            setIsLoading(false);
        } catch (e) {
            console.error('Ошибка загрузки истории:', e);
            setIsLoading(false);
        }
    }, [symbol]);

    useEffect(() => {
        timeframeRef.current = timeframe;
        setCandles([]);
        setHistory([]);
        activeCandleRef.current = null;
        fetchHistory(timeframe);
    }, [timeframe, fetchHistory]);

    const createNewCandle = useCallback((currentPrice: number, timestamp: number, tf: Timeframe) => {
        const config = getTfConfig(tf);
        const bucket = Math.floor(timestamp / config.ms) * config.ms;

        const newCandle: CandleData = {
            time: formatCandleTime(timestamp),
            open: currentPrice,
            high: currentPrice,
            low: currentPrice,
            close: currentPrice,
            timestamp: bucket,
            isClosed: false
        };

        activeCandleRef.current = newCandle;
        setCandles(prev => [...prev, newCandle].slice(-100));
    }, []);

    const updateActiveCandle = useCallback((price: number) => {
        if (activeCandleRef.current && !activeCandleRef.current.isClosed) {
            activeCandleRef.current.high = Math.max(activeCandleRef.current.high, price);
            activeCandleRef.current.low = Math.min(activeCandleRef.current.low, price);
            activeCandleRef.current.close = price;

            setCandles(prev => {
                const next = [...prev];
                if (next.length > 0) next[next.length - 1] = { ...activeCandleRef.current! };
                return next;
            });
        }
    }, []);

    useEffect(() => {
        const config = getTfConfig(timeframe);

        const id = setInterval(() => {
            const active = activeCandleRef.current;
            const now = Date.now();
            const bucket = Math.floor(now / config.ms) * config.ms;

            if (!active) {
                const p = lastPriceRef.current;
                if (p > 0) createNewCandle(p, now, timeframe);
                return;
            }

            if (bucket > active.timestamp) {
                const closed: CandleData = { ...active, isClosed: true };
                const p = lastPriceRef.current || active.close;

                const newCandle: CandleData = {
                    time: formatCandleTime(now),
                    open: p,
                    high: p,
                    low: p,
                    close: p,
                    timestamp: bucket,
                    isClosed: false
                };

                activeCandleRef.current = newCandle;

                setCandles(prev => {
                    const next = [...prev];
                    if (next.length > 0) next[next.length - 1] = closed;
                    next.push(newCandle);
                    return next.slice(-100);
                });
            }
        }, 1000);

        return () => clearInterval(id);
    }, [timeframe, createNewCandle]);

    useEffect(() => {
        let mounted = true;
        let reconnectTimeout: ReturnType<typeof setTimeout>;

        const connect = () => {
            const ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${symbol.toLowerCase()}usdt@trade`);
            wsRef.current = ws;

            ws.onopen = () => { if (mounted) setIsConnected(true); };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    const trade = data.data;
                    if (!trade || trade.e !== 'trade') return;

                    const newPrice = parseFloat(trade.p);
                    const ts = trade.T;
                    const tf = timeframeRef.current;

                    lastPriceRef.current = newPrice;

                    setPrice(prev => {
                        const oldPrice = prev || newPrice;
                        const newChange = ((newPrice - oldPrice) / oldPrice) * 100;
                        setChange(newChange);
                        return newPrice;
                    });

                    setHistory(prev => [...prev, {
                        time: formatTickTime(ts),
                        price: newPrice,
                        timestamp: ts
                    }].slice(-100));

                    if (!activeCandleRef.current) {
                        createNewCandle(newPrice, ts, tf);
                    } else {
                        updateActiveCandle(newPrice);
                    }
                } catch (err) {
                    console.error(`Ошибка ${symbol}:`, err);
                }
            };

            ws.onerror = () => { if (mounted) setIsConnected(false); };
            ws.onclose = () => {
                if (mounted) {
                    setIsConnected(false);
                    reconnectTimeout = setTimeout(connect, 3000);
                }
            };
        };

        connect();

        return () => {
            mounted = false;
            if (reconnectTimeout) clearTimeout(reconnectTimeout);
            if (wsRef.current) wsRef.current.close();
        };
    }, [symbol, createNewCandle, updateActiveCandle]);

    const changeTimeframe = useCallback((newTimeframe: Timeframe) => {
        setTimeframe(newTimeframe);
    }, []);

    return {
        price,
        change,
        history,
        candles,
        isConnected,
        timeframe,
        changeTimeframe,
        isLoading
    };
}