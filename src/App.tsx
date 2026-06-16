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

type Timeframe = '5s' | '10s' | '30s' | '1m' | '5m';

const TIMEFRAME_CONFIG: Record<Timeframe, { ms: number; label: string }> = {
    '5s': { ms: 5000, label: '5 сек' },
    '10s': { ms: 10000, label: '10 сек' },
    '30s': { ms: 30000, label: '30 сек' },
    '1m': { ms: 60000, label: '1 мин' },
    '5m': { ms: 300000, label: '5 мин' }
};

const CandlestickChart = React.memo(({ data }: { data: CandleData[] }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    useEffect(() => {
        if (!containerRef.current) return;
        
        const resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                const { width, height } = entry.contentRect;
                setDimensions({ width: width - 20, height: 350 });
            }
        });
        
        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    useEffect(() => {
        if (!canvasRef.current || dimensions.width === 0 || dimensions.height === 0 || data.length === 0) return;
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        canvas.width = dimensions.width;
        canvas.height = dimensions.height;
        
        ctx.clearRect(0, 0, dimensions.width, dimensions.height);
        
        const padding = { top: 20, right: 40, bottom: 40, left: 45 };
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
        
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 0.5;
        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px Inter, system-ui';
        
        const gridLines = 5;
        for (let i = 0; i <= gridLines; i++) {
            const y = padding.top + (chartHeight / gridLines) * i;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(dimensions.width - padding.right, y);
            ctx.stroke();
            
            const price = maxPrice - (priceRange / gridLines) * i;
            ctx.fillText(`$${price.toFixed(0)}`, 5, y + 3);
        }
        
        const candleWidth = Math.max(chartWidth / data.length - 2, 3);
        const candleSpacing = Math.max((chartWidth / data.length - candleWidth) / 2, 1);
        
        for (let i = 0; i < data.length; i++) {
            const candle = data[i];
            const x = padding.left + (i * (candleWidth + candleSpacing * 2)) + candleSpacing;
            const centerX = x + candleWidth / 2;
            const isGreen = candle.close >= candle.open;
            
            const openY = priceToY(candle.open);
            const closeY = priceToY(candle.close);
            const highY = priceToY(candle.high);
            const lowY = priceToY(candle.low);
            
            const bodyTop = Math.min(openY, closeY);
            const bodyBottom = Math.max(openY, closeY);
            const bodyHeight = Math.max(Math.abs(closeY - openY), 1);
            
            const bodyColor = isGreen ? '#22c55e' : '#ef4444';
            const wickColor = '#64748b';
            
            ctx.beginPath();
            ctx.moveTo(centerX, highY);
            ctx.lineTo(centerX, bodyTop);
            ctx.strokeStyle = wickColor;
            ctx.lineWidth = 1;
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(centerX, bodyBottom);
            ctx.lineTo(centerX, lowY);
            ctx.stroke();
            
            const bodyWidth = Math.max(candleWidth * 0.7, 2);
            ctx.fillStyle = bodyColor;
            ctx.fillRect(centerX - bodyWidth / 2, bodyTop, bodyWidth, bodyHeight);
            
            if (bodyHeight < 2) {
                ctx.strokeStyle = bodyColor;
                ctx.strokeRect(centerX - bodyWidth / 2, bodyTop, bodyWidth, bodyHeight);
            }
        }
        
        for (let i = 0; i < data.length; i += Math.max(1, Math.floor(data.length / 8))) {
            const x = padding.left + (i * (candleWidth + candleSpacing * 2)) + candleSpacing + candleWidth / 2;
            ctx.fillStyle = '#94a3b8';
            ctx.font = '8px Inter, system-ui';
            ctx.save();
            ctx.translate(x, dimensions.height - padding.bottom + 12);
            ctx.rotate(-0.3);
            ctx.fillText(data[i].time, 0, 0);
            ctx.restore();
        }
        
    }, [data, dimensions]);

    if (!data || data.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '140px 20px', color: '#94a3b8', background: '#f8fafc', borderRadius: '12px' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>📊</div>
                <div>Ожидание свечных данных...</div>
                <div style={{ fontSize: '12px', marginTop: '8px' }}>Свечи формируются каждые несколько секунд</div>
            </div>
        );
    }

    return (
        <div ref={containerRef} style={{ width: '100%', height: '370px', background: '#f8fafc', borderRadius: '12px', padding: '10px' }}>
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
        </div>
    );
});


const CryptoCard = React.memo(({ 
    symbol, price, change, history, candles, onRemove, timeframe, onTimeframeChange, isConnected 
}: { 
    symbol: string; 
    price: number;
    change: number;
    history: ChartData[];
    candles: CandleData[];
    onRemove: () => void;
    timeframe: Timeframe;
    onTimeframeChange: (tf: Timeframe) => void;
    isConnected: boolean;
}) => {
    const [showChart, setShowChart] = useState(false);
    const [chartType, setChartType] = useState<'line' | 'candle'>('candle');

    return (
        <div className="crypto-card">
            <div className="card-header">
                <div className="crypto-info">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h3>{symbol}</h3>
                        <span className={`status-dot ${isConnected ? 'connected' : 'connecting'}`} />
                    </div>
                    <p className={`price ${change >= 0 ? 'positive' : 'negative'}`}>
                        ${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className={`change ${change >= 0 ? 'positive' : 'negative'}`}>
                        {change >= 0 ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%
                    </p>
                </div>
                <button className="remove-btn" onClick={onRemove}>✕</button>
            </div>
            
            <div className="timeframe-bar">
                {(Object.entries(TIMEFRAME_CONFIG) as [Timeframe, { ms: number; label: string }][]).map(([key, config]) => (
                    <button
                        key={key}
                        className={`tf-badge ${timeframe === key ? 'active' : ''}`}
                        onClick={() => onTimeframeChange(key)}
                    >
                        {config.label}
                    </button>
                ))}
            </div>
            
            <button className="chart-toggle" onClick={() => setShowChart(!showChart)}>
                {showChart ? '📉 Скрыть график' : '📈 Показать график'}
            </button>
            
            {showChart && (
                <div className="chart-area">
                    <div className="chart-type-buttons">
                        <button className={`type-btn ${chartType === 'line' ? 'active' : ''}`} onClick={() => setChartType('line')}>
                            📈 Линейный
                        </button>
                        <button className={`type-btn ${chartType === 'candle' ? 'active' : ''}`} onClick={() => setChartType('candle')}>
                            📊 Свечной
                        </button>
                    </div>
                    
                    {chartType === 'line' && history.length > 0 && (
                        <ResponsiveContainer width="100%" height={350}>
                            <LineChart data={history}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748b' }} interval="preserveStartEnd" />
                                <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fill: '#64748b' }} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Line type="monotone" dataKey="price" stroke="#6366f1" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                    
                    {chartType === 'candle' && <CandlestickChart data={candles} />}
                </div>
            )}
        </div>
    );
});

const HistoryLog = React.memo(({ history }: { history: HistoryItem[] }) => {
    const logRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        if (logRef.current) {
            logRef.current.scrollTop = 0;
        }
    }, [history]);

    return (
        <div className="history-log">
            <h3>📋 История цен</h3>
            <div className="history-list" ref={logRef}>
                {history.length === 0 ? (
                    <div className="history-empty">⏳ Ожидание данных...</div>
                ) : (
                    history.map((item, i) => (
                        <div key={`${item.symbol}-${item.timestamp}-${i}`} className="history-item">
                            <span className="history-time">{item.time}</span>
                            <span className={`history-symbol ${item.symbol.toLowerCase()}`}>{item.symbol}</span>
                            <span className="history-price">${item.price.toLocaleString()}</span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
});


const HistoryChart = React.memo(({ history }: { history: HistoryItem[] }) => {
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
            {history.length === 0 ? (
                <div className="chart-placeholder">⏳ Ожидание данных...</div>
            ) : (
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748b' }} interval="preserveStartEnd" />
                        <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fill: '#64748b' }} />
                        <Tooltip 
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        />
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
            )}
        </div>
    );
});

function useCryptoData(symbol: string, initialTimeframe: Timeframe) {
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
                    console.error('Ошибка:', err);
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

    return { price, change, history, candles, isConnected, timeframe, changeTimeframe };
}

function App() {
    const [selected, setSelected] = useState<string[]>(['BTC', 'ETH', 'BNB']);
    
    const btc = useCryptoData('BTC', '10s');
    const eth = useCryptoData('ETH', '10s');
    const bnb = useCryptoData('BNB', '10s');
    const sol = useCryptoData('SOL', '10s');
    const doge = useCryptoData('DOGE', '10s');
    
    const allData = { BTC: btc, ETH: eth, BNB: bnb, SOL: sol, DOGE: doge };
    
    const [globalHistory, setGlobalHistory] = useState<HistoryItem[]>([]);
    
    useEffect(() => {
        const interval = setInterval(() => {
            const items: HistoryItem[] = [];
            (Object.entries(allData) as [string, typeof btc][]).forEach(([sym, data]) => {
                if (data.history.length > 0) {
                    const lastItem = data.history[data.history.length - 1];
                    items.push({
                        symbol: sym,
                        price: lastItem.price,
                        time: lastItem.time,
                        timestamp: lastItem.timestamp
                    });
                }
            });
            setGlobalHistory(items.sort((a, b) => b.timestamp - a.timestamp).slice(0, 50));
        }, 500);
        return () => clearInterval(interval);
    }, [allData]);

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
        } else {
            toast.error(`${symbol} уже в списке`);
        }
    };

    const removeCrypto = (symbol: string) => {
        setSelected(selected.filter(s => s !== symbol));
        toast.success(`${symbol} удален`);
    };

    return (
        <div className="app">
            <Toaster position="top-right" toastOptions={{ duration: 2000 }} />
            <div className="container">
                <header>
                    <h1>🚀 Crypto Live Tracker</h1>
                </header>
                
                <div className="add-crypto">
                    <select onChange={(e) => { if (e.target.value) addCrypto(e.target.value); e.target.value = ''; }} defaultValue="">
                        <option value="" disabled>➕ Добавить криптовалюту</option>
                        {cryptos.filter(c => !selected.includes(c.symbol)).map(c => (
                            <option key={c.symbol} value={c.symbol}>{c.name} ({c.symbol})</option>
                        ))}
                    </select>
                </div>
                
                <div className="crypto-grid">
                    {selected.map(symbol => {
                        const data = allData[symbol as keyof typeof allData];
                        if (!data) return null;
                        return (
                            <CryptoCard
                                key={symbol}
                                symbol={symbol}
                                price={data.price}
                                change={data.change}
                                history={data.history}
                                candles={data.candles}
                                onRemove={() => removeCrypto(symbol)}
                                timeframe={data.timeframe}
                                onTimeframeChange={data.changeTimeframe}
                                isConnected={data.isConnected}
                            />
                        );
                    })}
                </div>
                
                {selected.length === 0 && (
                    <div className="empty-state">
                        <div className="empty-icon">📭</div>
                        <p>Нет отслеживаемых криптовалют</p>
                        <p className="empty-hint">Добавьте первую монету из списка выше</p>
                    </div>
                )}
                
                <div className="sidebar">
                    <HistoryLog history={globalHistory} />
                    <HistoryChart history={globalHistory} />
                </div>
            </div>
        </div>
    );
}

export default App;