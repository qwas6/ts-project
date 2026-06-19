import { useState, useEffect, useRef, useCallback } from 'react';
import type { CandleData, ChartData, Timeframe } from '../types';
import { TIMEFRAME_CONFIG } from '../constants';

export function useCryptoData(symbol: string, initialTimeframe: Timeframe) {
    const [price, setPrice] = useState(0);
    const [change, setChange] = useState(0);
    const [history, setHistory] = useState<ChartData[]>([]);
    const [candles, setCandles] = useState<CandleData[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [timeframe, setTimeframe] = useState<Timeframe>(initialTimeframe);
    
    const wsRef = useRef<WebSocket | null>(null);
    const activeCandleRef = useRef<CandleData | null>(null);
    const lastPriceRef = useRef(0);
    const timeframeRef = useRef<Timeframe>(timeframe);

    const resetCandles = useCallback(() => {
        setCandles([]);
        activeCandleRef.current = null;
    }, []);

    const createNewCandle = useCallback((currentPrice: number, timestamp: number, currentTimeframe: Timeframe) => {
        const intervalMs = TIMEFRAME_CONFIG[currentTimeframe].ms;
        const intervalKey = Math.floor(timestamp / intervalMs) * intervalMs;
        
        const newCandle: CandleData = {
            time: new Date(intervalKey).toLocaleTimeString(),
            open: currentPrice,
            high: currentPrice,
            low: currentPrice,
            close: currentPrice,
            timestamp: intervalKey,
            isClosed: false
        };
        
        activeCandleRef.current = newCandle;
        setCandles(prev => [...prev, newCandle].slice(-100));
    }, []);

    const closeCurrentCandle = useCallback((currentPrice: number) => {
        if (activeCandleRef.current && !activeCandleRef.current.isClosed) {
            const closedCandle: CandleData = {
                ...activeCandleRef.current,
                close: currentPrice,
                isClosed: true
            };
            
            setCandles(prev => {
                const newCandles = [...prev];
                if (newCandles.length > 0) {
                    newCandles[newCandles.length - 1] = closedCandle;
                }
                return newCandles;
            });
            activeCandleRef.current = null;
        }
    }, []);

    useEffect(() => {
        timeframeRef.current = timeframe;
        
        const interval = setInterval(() => {
            if (lastPriceRef.current > 0 && activeCandleRef.current) {
                closeCurrentCandle(lastPriceRef.current);
                createNewCandle(lastPriceRef.current, Date.now(), timeframeRef.current);
            }
        }, TIMEFRAME_CONFIG[timeframe].ms);
        
        return () => clearInterval(interval);
    }, [timeframe, closeCurrentCandle, createNewCandle]);

    useEffect(() => {
        let mounted = true;
        
        const connect = () => {
            const ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${symbol.toLowerCase()}usdt@trade`);
            wsRef.current = ws;
            
            ws.onopen = () => {
                if (mounted) {
                    setIsConnected(true);
                    resetCandles();
                }
            };
            
            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    const trade = data.data;
                    if (!trade || trade.e !== 'trade') return;
                    
                    const newPrice = parseFloat(trade.p);
                    const timestamp = trade.T;
                    const timeStr = new Date(timestamp).toLocaleTimeString();
                    
                    lastPriceRef.current = newPrice;
                    
                    setPrice(prev => {
                        const oldPrice = prev || newPrice;
                        const newChange = ((newPrice - oldPrice) / oldPrice) * 100;
                        setChange(newChange);
                        return newPrice;
                    });
                    
                    setHistory(prev => [...prev, { time: timeStr, price: newPrice, timestamp }].slice(-100));
                    
                    if (!activeCandleRef.current) {
                        createNewCandle(newPrice, timestamp, timeframeRef.current);
                    } else {
                        const currentCandle = activeCandleRef.current;
                        currentCandle.high = Math.max(currentCandle.high, newPrice);
                        currentCandle.low = Math.min(currentCandle.low, newPrice);
                        currentCandle.close = newPrice;
                        
                        setCandles(prev => {
                            const newCandles = [...prev];
                            if (newCandles.length > 0) {
                                newCandles[newCandles.length - 1] = { ...currentCandle };
                            }
                            return newCandles;
                        });
                    }
                } catch (err) {
                    console.error(`Ошибка ${symbol}:`, err);
                }
            };
            
            ws.onerror = () => {
                if (mounted) setIsConnected(false);
            };
            
            ws.onclose = () => {
                if (mounted) {
                    setIsConnected(false);
                    setTimeout(connect, 3000);
                }
            };
        };
        
        connect();
        
        return () => {
            mounted = false;
            if (wsRef.current) wsRef.current.close();
        };
    }, [symbol, createNewCandle, resetCandles]);

    const changeTimeframe = useCallback((newTimeframe: Timeframe) => {
        if (lastPriceRef.current > 0) {
            closeCurrentCandle(lastPriceRef.current);
            setTimeframe(newTimeframe);
            setTimeout(() => {
                if (lastPriceRef.current > 0) {
                    createNewCandle(lastPriceRef.current, Date.now(), newTimeframe);
                }
            }, 10);
        } else {
            setTimeframe(newTimeframe);
        }
    }, [closeCurrentCandle, createNewCandle]);

    return { 
        price, 
        change, 
        history, 
        candles, 
        isConnected, 
        timeframe, 
        changeTimeframe 
    };
}