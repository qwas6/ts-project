import React, { useState, useEffect, useRef } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './App.css';

interface ChartData {
    time: string;
    price: number;
    timestamp: number;
}

interface PriceData {
    price: number;
    change: number;
}

interface HistoryItem {
    symbol: string;
    price: number;
    time: string;
}

function CryptoCard({ symbol, price, change, history, onRemove }: { 
    symbol: string; 
    price: number;
    change: number;
    history: ChartData[];
    onRemove: () => void;
}) {
    const [showChart, setShowChart] = useState(false);

    return (
        <div className="crypto-card">
            <div className="card-header">
                <div className="crypto-info">
                    <h3>{symbol}</h3>
                    <p className={`price ${change >= 0 ? 'positive' : 'negative'}`}>
                        ${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className={`change ${change >= 0 ? 'positive' : 'negative'}`}>
                        {change >= 0 ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%
                    </p>
                </div>
                <button className="remove-btn" onClick={onRemove} title="Удалить">
                    ✕
                </button>
            </div>
            
            <button 
                className="chart-toggle"
                onClick={() => setShowChart(!showChart)}
            >
                {showChart ? '📉 Скрыть график' : '📈 Показать график'}
            </button>
            
            {showChart && history.length > 0 && (
                <div className="chart-container">
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={history}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                            <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10 }} />
                            <Tooltip />
                            <Line type="monotone" dataKey="price" stroke="#667eea" strokeWidth={2} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
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
                    <p className="history-empty">Ожидание данных...</p>
                ) : (
                    history.map((item, index) => (
                        <div key={index} className="history-item">
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

function useBinanceWebSocket() {
    const [prices, setPrices] = useState<Map<string, PriceData>>(new Map());
    const [history, setHistory] = useState<Map<string, ChartData[]>>(new Map());
    const [priceLog, setPriceLog] = useState<HistoryItem[]>([]);
    const wsRef = useRef<WebSocket | null>(null);
    const previousPricesRef = useRef<Map<string, number>>(new Map());

    useEffect(() => {
        const symbols = ['btcusdt', 'ethusdt', 'bnbusdt', 'solusdt', 'dogeusdt'];
        const streamUrl = `wss://stream.binance.com:9443/stream?streams=${symbols.map(s => `${s}@trade`).join('/')}`;
        
        const ws = new WebSocket(streamUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log('✅ Binance WebSocket подключен');
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.data && data.data.e === 'trade') {
                    const trade = data.data;
                    const symbolRaw = trade.s;
                    let symbol = '';
                    
                    if (symbolRaw === 'BTCUSDT') symbol = 'BTC';
                    else if (symbolRaw === 'ETHUSDT') symbol = 'ETH';
                    else if (symbolRaw === 'BNBUSDT') symbol = 'BNB';
                    else if (symbolRaw === 'SOLUSDT') symbol = 'SOL';
                    else if (symbolRaw === 'DOGEUSDT') symbol = 'DOGE';
                    else return;
                    
                    const price = parseFloat(trade.p);
                    const tradeTime = trade.T;
                    const timeStr = new Date(tradeTime).toLocaleTimeString();
                    
                
                    setPriceLog(prev => {
                        const newLog = [{ symbol, price, time: timeStr }, ...prev].slice(0, 100);
                        return newLog;
                    });
                    
                    const oldPrice = previousPricesRef.current.get(symbol) || price;
                    const change = ((price - oldPrice) / oldPrice) * 100;
                    
                    setPrices(prev => {
                        const newPrices = new Map(prev);
                        newPrices.set(symbol, { price, change });
                        return newPrices;
                    });
                    
                    previousPricesRef.current.set(symbol, price);
                    
                    setHistory(prevHistory => {
                        const newHistory = new Map(prevHistory);
                        const currentHistory = newHistory.get(symbol) || [];
                        const newPoint: ChartData = {
                            time: timeStr,
                            price: price,
                            timestamp: tradeTime
                        };
                        const updated = [...currentHistory, newPoint].slice(-50);
                        newHistory.set(symbol, updated);
                        return newHistory;
                    });
                }
            } catch (err) {
                console.error('Ошибка обработки данных:', err);
            }
        };

        ws.onerror = (error) => {
            console.error('❌ WebSocket ошибка:', error);
            toast.error('Ошибка подключения к Binance');
        };

        ws.onclose = () => {
            console.log('🔌 WebSocket отключен');
        };

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, []);

    return { prices, history, priceLog };
}

function App() {
    const [selectedCryptos, setSelectedCryptos] = useState<string[]>(['BTC', 'ETH', 'BNB']);
    const [availableCryptos] = useState([
        { symbol: 'BTC', name: 'Bitcoin' },
        { symbol: 'ETH', name: 'Ethereum' },
        { symbol: 'BNB', name: 'Binance Coin' },
        { symbol: 'SOL', name: 'Solana' },
        { symbol: 'DOGE', name: 'Dogecoin' }
    ]);

    const { prices, history, priceLog } = useBinanceWebSocket();

    const addCrypto = (symbol: string) => {
        if (!selectedCryptos.includes(symbol)) {
            setSelectedCryptos([...selectedCryptos, symbol]);
            toast.success(`${symbol} добавлен в отслеживание`);
        } else {
            toast.error(`${symbol} уже в списке`);
        }
    };

    const removeCrypto = (symbol: string) => {
        setSelectedCryptos(selectedCryptos.filter(s => s !== symbol));
        toast.success(`${symbol} удален из списка`);
    };

    return (
        <div className="app">
            <Toaster position="top-right" />
            
            <div className="main-layout">
                <div className="main-content">
                    <header>
                        <h1>🚀 Crypto Live Tracker</h1>
                        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>
                        </p>
                    </header>

                    <div className="add-crypto">
                        <select 
                            onChange={(e) => {
                                if (e.target.value) {
                                    addCrypto(e.target.value);
                                    e.target.value = '';
                                }
                            }}
                            className="crypto-select"
                            defaultValue=""
                        >
                            <option value="" disabled>➕ Добавить криптовалюту</option>
                            {availableCryptos
                                .filter(c => !selectedCryptos.includes(c.symbol))
                                .map(c => (
                                    <option key={c.symbol} value={c.symbol}>
                                        {c.name} ({c.symbol})
                                    </option>
                                ))}
                        </select>
                    </div>

                    <div className="crypto-grid">
                        {selectedCryptos.map(symbol => {
                            const data = prices.get(symbol);
                            const price = data?.price || 0;
                            const change = data?.change || 0;
                            const historyData = history.get(symbol) || [];
                            
                            return (
                                <CryptoCard
                                    key={symbol}
                                    symbol={symbol}
                                    price={price}
                                    change={change}
                                    history={historyData}
                                    onRemove={() => removeCrypto(symbol)}
                                />
                            );
                        })}
                    </div>

                    {selectedCryptos.length === 0 && (
                        <div className="placeholder">
                            <p>🔍 Нет отслеживаемых криптовалют</p>
                            <p>Добавьте первую монету из списка выше</p>
                        </div>
                    )}
                </div>

              
                <HistoryLog history={priceLog} />
            </div>
        </div>
    );
}

export default App;