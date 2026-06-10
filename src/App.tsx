import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import './App.css';

interface CandleData {
    time: string;
    open: number;
    high: number;
    low: number;
    close: number;
    timestamp: number;
    isClosed: boolean;
}

interface ChartData {
    time: string;
    price: number;
    timestamp: number;
}

interface HistoryItem {
    symbol: string;
    price: number;
    time: string;
    timestamp: number;
}

interface PriceData {
    price: number;
    change: number;
}

function CandlestickChart({ data }: { data: CandleData[] }) {
    const chartRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    useEffect(() => {
        if (!chartRef.current) return;
        
        const resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                const { width, height } = entry.contentRect;
                setDimensions({ width, height });
            }
        });
        
        resizeObserver.observe(chartRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    useEffect(() => {
        if (!chartRef.current || dimensions.width === 0 || dimensions.height === 0 || data.length === 0) return;
        
        const canvas = document.getElementById('candle-canvas') as HTMLCanvasElement;
        if (!canvas) return;
        
        canvas.width = dimensions.width;
        canvas.height = dimensions.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        
        ctx.clearRect(0, 0, dimensions.width, dimensions.height);
        
        
        const padding = { top: 20, right: 50, bottom: 30, left: 50 };
        const chartWidth = dimensions.width - padding.left - padding.right;
        const chartHeight = dimensions.height - padding.top - padding.bottom;
        
        if (chartWidth <= 0 || chartHeight <= 0) return;
        

        let minPrice = Infinity;
        let maxPrice = -Infinity;
        data.forEach(candle => {
            minPrice = Math.min(minPrice, candle.low);
            maxPrice = Math.max(maxPrice, candle.high);
        });
        
        const priceRange = maxPrice - minPrice;
        const priceToY = (price: number) => {
            return padding.top + chartHeight - ((price - minPrice) / priceRange) * chartHeight;
        };
        
        
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 0.5;
        
        
        const gridLines = 5;
        for (let i = 0; i <= gridLines; i++) {
            const y = padding.top + (chartHeight / gridLines) * i;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(dimensions.width - padding.right, y);
            ctx.stroke();
            
    
            const price = maxPrice - (priceRange / gridLines) * i;
            ctx.fillStyle = '#999';
            ctx.font = '10px Arial';
            ctx.fillText(`$${price.toFixed(0)}`, 5, y + 3);
        }
        

        const candleWidth = chartWidth / data.length;
        for (let i = 0; i <= data.length; i++) {
            const x = padding.left + (chartWidth / data.length) * i;
            ctx.beginPath();
            ctx.moveTo(x, padding.top);
            ctx.lineTo(x, dimensions.height - padding.bottom);
            ctx.stroke();
            
            
            if (i < data.length) {
                ctx.fillStyle = '#999';
                ctx.font = '8px Arial';
                const timeText = data[i].time;
                ctx.save();
                ctx.translate(x + candleWidth / 2, dimensions.height - padding.bottom + 10);
                ctx.rotate(-0.5);
                ctx.fillText(timeText, 0, 0);
                ctx.restore();
            }
        }
        
        
        for (let i = 0; i < data.length; i++) {
            const candle = data[i];
            const x = padding.left + (i * candleWidth);
            const centerX = x + candleWidth / 2;
            const isGreen = candle.close >= candle.open;
            
            const openY = priceToY(candle.open);
            const closeY = priceToY(candle.close);
            const highY = priceToY(candle.high);
            const lowY = priceToY(candle.low);
            
            const bodyTop = Math.min(openY, closeY);
            const bodyBottom = Math.max(openY, closeY);
            const bodyHeight = Math.max(Math.abs(closeY - openY), 1);
            
    
            const bodyColor = isGreen ? '#26a69a' : '#ef5350';
            const wickColor = '#666';
    
            ctx.beginPath();
            ctx.moveTo(centerX, highY);
            ctx.lineTo(centerX, bodyTop);
            ctx.strokeStyle = wickColor;
            ctx.lineWidth = 1.5;
            ctx.stroke();
            
            
            ctx.beginPath();
            ctx.moveTo(centerX, bodyBottom);
            ctx.lineTo(centerX, lowY);
            ctx.stroke();
            
            
            const bodyWidth = Math.max(candleWidth * 0.6, 3);
            ctx.fillStyle = bodyColor;
            ctx.fillRect(centerX - bodyWidth / 2, bodyTop, bodyWidth, bodyHeight);
            
    
            ctx.strokeStyle = bodyColor;
            ctx.strokeRect(centerX - bodyWidth / 2, bodyTop, bodyWidth, bodyHeight);
        }
        
    }, [data, dimensions]);

    if (!data || data.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '100px', color: '#999' }}>
                ⏳ Ожидание свечных данных...
            </div>
        );
    }

    return (
        <div ref={chartRef} style={{ width: '100%', height: '350px', position: 'relative' }}>
            <canvas
                id="candle-canvas"
                style={{ width: '100%', height: '100%', backgroundColor: '#fafafa', borderRadius: '8px' }}
            />
        </div>
    );
}

function CryptoCard({ symbol, price, change, history, candles, onRemove }: { 
    symbol: string; 
    price: number;
    change: number;
    history: ChartData[];
    candles: CandleData[];
    onRemove: () => void;
}) {
    const [showChart, setShowChart] = useState(false);
    const [chartType, setChartType] = useState<'line' | 'candle'>('candle');

    return (
        <div className="crypto-card">
            <div className="card-header">
                <div className="crypto-info">
                    <h3>{symbol}</h3>
                    <p className={`price ${change >= 0 ? 'positive' : 'negative'}`}>
                        ${price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                    <p className={`change ${change >= 0 ? 'positive' : 'negative'}`}>
                        {change >= 0 ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%
                    </p>
                </div>
                <button className="remove-btn" onClick={onRemove}>✕</button>
            </div>
            
            <button className="chart-toggle" onClick={() => setShowChart(!showChart)}>
                {showChart ? '📉 Скрыть график' : '📈 Показать график'}
            </button>
            
            {showChart && (
                <>
                    <div className="chart-type-buttons">
                        <button className={`type-btn ${chartType === 'line' ? 'active' : ''}`} onClick={() => setChartType('line')}>
                            📈 Линейный
                        </button>
                        <button className={`type-btn ${chartType === 'candle' ? 'active' : ''}`} onClick={() => setChartType('candle')}>
                            📊 Свечной
                        </button>
                    </div>
                    
                    <div className="chart-container">
                        {chartType === 'line' && history.length > 0 && (
                            <ResponsiveContainer width="100%" height={350}>
                                <LineChart data={history}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                                    <YAxis domain={['auto', 'auto']} />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="price" stroke="#667eea" strokeWidth={2} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                        
                        {chartType === 'candle' && (
                            <CandlestickChart data={candles} />
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

function HistoryLog({ history }: { history: HistoryItem[] }) {
    const logRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        if (logRef.current) {
            logRef.current.scrollTop = logRef.current.scrollHeight;
        }
    }, [history]);

    return (
        <div className="history-log">
            <h3>📋 История цен</h3>
            <div className="history-list" ref={logRef}>
                {history.length === 0 ? (
                    <p>Ожидание данных...</p>
                ) : (
                    history.slice(0, 50).map((item, i) => (
                        <div key={i} className="history-item">
                            <span className="history-time">{item.time}</span>
                            <span className="history-symbol">{item.symbol}</span>
                            <span className="history-price">${item.price.toLocaleString()}</span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

function HistoryChart({ history }: { history: HistoryItem[] }) {
    const [selected, setSelected] = useState<Set<string>>(new Set(['BTC', 'ETH']));
    const allSymbols = ['BTC', 'ETH', 'BNB', 'SOL', 'DOGE'];

    const chartData = useMemo(() => {
        const map = new Map<string, any>();
        history.forEach(item => {
            if (!selected.has(item.symbol)) return;
            if (!map.has(item.time)) {
                map.set(item.time, { time: item.time });
            }
            const entry = map.get(item.time);
            entry[item.symbol] = item.price;
        });
        return Array.from(map.values()).slice(-50);
    }, [history, selected]);

    const colors: Record<string, string> = {
        BTC: '#f7931a', 
        ETH: '#627eea', 
        BNB: '#f3ba2f', 
        SOL: '#00ffbd', 
        DOGE: '#c3a634'
    };

    return (
        <div className="history-chart">
            <h3>📊 Общий график</h3>
            <div className="symbol-buttons">
                {allSymbols.map(s => (
                    <button 
                        key={s} 
                        className={`sym-btn ${selected.has(s) ? 'active' : ''}`} 
                        onClick={() => {
                            const newSet = new Set(selected);
                            if (newSet.has(s)) {
                                newSet.delete(s);
                            } else {
                                newSet.add(s);
                            }
                            setSelected(newSet);
                        }}
                    >
                        {s}
                    </button>
                ))}
            </div>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    {allSymbols.map(s => selected.has(s) && (
                        <Line 
                            key={s} 
                            type="monotone" 
                            dataKey={s} 
                            stroke={colors[s]} 
                            strokeWidth={2} 
                            dot={false} 
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}


function useBinanceWebSocket() {
    const [prices, setPrices] = useState<Map<string, PriceData>>(new Map());
    const [history, setHistory] = useState<Map<string, ChartData[]>>(new Map());
    const [candles, setCandles] = useState<Map<string, CandleData[]>>(new Map());
    const [priceLog, setPriceLog] = useState<HistoryItem[]>([]);
    const wsRef = useRef<WebSocket | null>(null);
    const prevPrices = useRef<Map<string, number>>(new Map());
    
    const activeCandleRef = useRef<Map<string, CandleData>>(new Map());
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const closeAndCreateNewCandle = useCallback((symbol: string, currentPrice: number) => {
        const activeCandle = activeCandleRef.current.get(symbol);
        
        if (activeCandle) {
            const closedCandle: CandleData = {
                ...activeCandle,
                close: currentPrice,
                isClosed: true
            };
            
            setCandles(prev => {
                const newMap = new Map(prev);
                const arr = newMap.get(symbol) || [];
                const updatedArr = [...arr];
                if (updatedArr.length > 0) {
                    updatedArr[updatedArr.length - 1] = closedCandle;
                }
                newMap.set(symbol, updatedArr);
                return newMap;
            });
        }
        
        const now = Date.now();
        const newCandle: CandleData = {
            time: new Date(now).toLocaleTimeString(),
            open: currentPrice,
            high: currentPrice,
            low: currentPrice,
            close: currentPrice,
            timestamp: now,
            isClosed: false
        };
        
        activeCandleRef.current.set(symbol, newCandle);
        
        setCandles(prev => {
            const newMap = new Map(prev);
            const arr = newMap.get(symbol) || [];
            newMap.set(symbol, [...arr, newCandle]);
            return newMap;
        });
    }, []);

    const updateActiveCandle = useCallback((symbol: string, price: number) => {
        const activeCandle = activeCandleRef.current.get(symbol);
        if (activeCandle && !activeCandle.isClosed) {
            activeCandle.high = Math.max(activeCandle.high, price);
            activeCandle.low = Math.min(activeCandle.low, price);
            activeCandle.close = price;
            
            setCandles(prev => {
                const newMap = new Map(prev);
                const arr = newMap.get(symbol) || [];
                if (arr.length > 0) {
                    const updatedArr = [...arr];
                    updatedArr[updatedArr.length - 1] = { ...activeCandle };
                    newMap.set(symbol, updatedArr);
                }
                return newMap;
            });
        }
    }, []);

    const initCandles = useCallback((symbol: string, price: number) => {
        closeAndCreateNewCandle(symbol, price);
    }, [closeAndCreateNewCandle]);

    useEffect(() => {
        intervalRef.current = setInterval(() => {
            const currentPrices = new Map<string, number>();
            prevPrices.current.forEach((price, symbol) => {
                currentPrices.set(symbol, price);
            });
            
            ['BTC', 'ETH', 'BNB', 'SOL', 'DOGE'].forEach(symbol => {
                const currentPrice = currentPrices.get(symbol);
                if (currentPrice && currentPrice > 0) {
                    closeAndCreateNewCandle(symbol, currentPrice);
                }
            });
        }, 10000);
        
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [closeAndCreateNewCandle]);

    useEffect(() => {
        const ws = new WebSocket(
            'wss://stream.binance.com:9443/stream?streams=btcusdt@trade/ethusdt@trade/bnbusdt@trade/solusdt@trade/dogeusdt@trade'
        );
        wsRef.current = ws;
        let isFirstMessage = true;

        ws.onopen = () => {
            console.log('✅ WebSocket Connected');
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                const trade = data.data;
                if (!trade || trade.e !== 'trade') return;
                
                let symbol = '';
                if (trade.s === 'BTCUSDT') symbol = 'BTC';
                else if (trade.s === 'ETHUSDT') symbol = 'ETH';
                else if (trade.s === 'BNBUSDT') symbol = 'BNB';
                else if (trade.s === 'SOLUSDT') symbol = 'SOL';
                else if (trade.s === 'DOGEUSDT') symbol = 'DOGE';
                else return;
                
                const price = parseFloat(trade.p);
                const timestamp = trade.T;
                const timeStr = new Date(timestamp).toLocaleTimeString();
                
                setPriceLog(prev => [{ symbol, price, time: timeStr, timestamp }, ...prev].slice(0, 100));
                
                const oldPrice = prevPrices.current.get(symbol) || price;
                const change = ((price - oldPrice) / oldPrice) * 100;
                setPrices(prev => new Map(prev).set(symbol, { price, change }));
                prevPrices.current.set(symbol, price);
                
                setHistory(prev => {
                    const newMap = new Map(prev);
                    const arr = newMap.get(symbol) || [];
                    newMap.set(symbol, [...arr, { time: timeStr, price, timestamp }].slice(-50));
                    return newMap;
                });
                
                if (isFirstMessage) {
                    isFirstMessage = false;
                    initCandles(symbol, price);
                } else {
                    updateActiveCandle(symbol, price);
                }
            } catch (err) {
                console.error('Ошибка:', err);
            }
        };
        
        ws.onerror = () => {
            toast.error('Ошибка подключения');
        };
        
        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [initCandles, updateActiveCandle]);

    return { prices, history, candles, priceLog };
}

function App() {
    const [selected, setSelected] = useState<string[]>(['BTC', 'ETH', 'BNB']);
    const { prices, history, candles, priceLog } = useBinanceWebSocket();
    const cryptos = [
        { symbol: 'BTC', name: 'Bitcoin' },
        { symbol: 'ETH', name: 'Ethereum' },
        { symbol: 'BNB', name: 'Binance Coin' },
        { symbol: 'SOL', name: 'Solana' },
        { symbol: 'DOGE', name: 'Dogecoin' }
    ];

    const addCrypto = (symbol: string) => {
        if (!selected.includes(symbol)) {
            setSelected([...selected, symbol]);
            toast.success(`${symbol} добавлен`);
        }
    };

    const removeCrypto = (symbol: string) => {
        setSelected(selected.filter(s => s !== symbol));
        toast.success(`${symbol} удален`);
    };

    return (
        <div className="app">
            <Toaster position="top-right" />
            <div className="container">
                <header>
                    <h1>🚀 Crypto Live Tracker</h1>
                </header>
                
                <div className="add-crypto">
                    <select 
                        onChange={(e) => { 
                            if (e.target.value) {
                                addCrypto(e.target.value);
                                e.target.value = '';
                            }
                        }}
                        defaultValue="">
                    
                        <option value="" disabled>➕ Добавить криптовалюту</option>
                        {cryptos.filter(c => !selected.includes(c.symbol)).map(c => (
                            <option key={c.symbol} value={c.symbol}>
                                {c.name} ({c.symbol})
                            </option>
                        ))}
                    </select>
                </div>
                
                <div className="crypto-grid">
                    {selected.map(symbol => {
                        const data = prices.get(symbol);
                        return (
                            <CryptoCard
                                key={symbol}
                                symbol={symbol}
                                price={data?.price || 0}
                                change={data?.change || 0}
                                history={history.get(symbol) || []}
                                candles={candles.get(symbol) || []}
                                onRemove={() => removeCrypto(symbol)}
                            />
                        );
                    })}
                </div>
                
                <div className="sidebar">
                    <HistoryLog history={priceLog} />
                    <HistoryChart history={priceLog} />
                </div>
            </div>
        </div>
    );
}

export default App;