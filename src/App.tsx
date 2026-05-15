import React, { useState, useEffect, useRef } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './App.css';


interface ChartData {
    time: string;
    price: number;
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

function useCryptoPrices() {
    const [prices, setPrices] = useState<Map<string, { price: number; change: number }>>(new Map());
    const [history, setHistory] = useState<Map<string, ChartData[]>>(new Map());
    const intervalRef = useRef<any>(null);
    const previousPricesRef = useRef<Map<string, number>>(new Map());

    const generatePrice = (symbol: string): number => {
        const basePrices: Record<string, number> = {
            BTC: 65000,
            ETH: 3200,
            BNB: 580,
            SOL: 160,
            DOGE: 0.15
        };
        
        const volatility: Record<string, number> = {
            BTC: 0.02,
            ETH: 0.025,
            BNB: 0.03,
            SOL: 0.04,
            DOGE: 0.05
        };
        
        const currentPrice = previousPricesRef.current.get(symbol) || basePrices[symbol];
        const change = (Math.random() - 0.5) * 2 * (volatility[symbol] || 0.03);
        let newPrice = currentPrice * (1 + change);
    

        newPrice = Math.max(newPrice, currentPrice * 0.95);
        newPrice = Math.min(newPrice, currentPrice * 1.05);
        
        return newPrice;
    };

    useEffect(() => {
        const symbols = ['BTC', 'ETH', 'BNB', 'SOL', 'DOGE'];
        const initialPrices: Map<string, { price: number; change: number }> = new Map();
        symbols.forEach(symbol => {
            const basePrice = symbol === 'BTC' ? 65000 :
                            symbol === 'ETH' ? 3200 :
                            symbol === 'BNB' ? 580 :
                            symbol === 'SOL' ? 160 : 0.15;
            initialPrices.set(symbol, { price: basePrice, change: 0 });
            previousPricesRef.current.set(symbol, basePrice);
        });
        setPrices(initialPrices);


        intervalRef.current = setInterval(() => {
            setPrices(prevPrices => {
                const newPrices = new Map(prevPrices);
                const symbols = ['BTC', 'ETH', 'BNB', 'SOL', 'DOGE'];
                
                symbols.forEach(symbol => {
                    const oldPrice = previousPricesRef.current.get(symbol) || 0;
                    const newPrice = generatePrice(symbol);
                    const change = ((newPrice - oldPrice) / oldPrice) * 100;
                    
                    newPrices.set(symbol, { price: newPrice, change });
                    previousPricesRef.current.set(symbol, newPrice);
                    
                    
                    setHistory(prevHistory => {
                        const newHistory = new Map(prevHistory);
                        const currentHistory = newHistory.get(symbol) || [];
                        const newPoint = {
                            time: new Date().toLocaleTimeString(),
                            price: newPrice
                        };
                        const updated = [...currentHistory, newPoint].slice(-30);
                        newHistory.set(symbol, updated);
                        return newHistory;
                    });
                });
                
                return newPrices;
            });
        }, 1000);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    return { prices, history };
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

    const { prices, history } = useCryptoPrices();

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
        </div>
    );
}

export default App;