import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { 
    Rocket, Plus, BarChart3, Clock, BadgeDollarSign, Eye, EyeOff, 
    TrendingUp, TrendingDown, CandlestickChart as CandleIcon, 
    LineChart as LineIcon, Wallet, History, X 
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CandlestickChart } from './components/CandlestickChart/CandlestickChart';
import { OrderBook } from './components/OrderBook/OrderBook';
import { TradePanel } from './components/TradePanel/TradePanel';
import { CryptoWallet } from './components/CryptoWallet/CryptoWallet';
import { OpenOrders } from './components/OpenOrders/OpenOrders';
import { HistoryLog } from './components/HistoryLog/HistoryLog';
import { HistoryChart } from './components/HistoryChart/HistoryChart';
import { useCryptoData } from './hooks/useCryptoData';
import { useGlobalHistory } from './hooks/useGlobalHistory';
import { TIMEFRAME_CONFIG, CRYPTOS } from './constants';
import { formatPrice, formatChange } from './utils/helpers';
import './App.css';

interface CryptoAsset {
    symbol: string;
    quantity: number;
    averagePrice: number;
}

type TabType = 'wallet' | 'orders' | 'history';
type ChartTabType = 'line' | 'candle';
type TimeframeType = '5s' | '10s' | '30s' | '1m' | '5m';

function App() {
    const [selectedSymbol, setSelectedSymbol] = useState<string>('BTC');
    const [walletBalance, setWalletBalance] = useState(1000);
    const [showBalance, setShowBalance] = useState(true);
    const [showDepositModal, setShowDepositModal] = useState(false);
    const [depositAmount, setDepositAmount] = useState<string>('');
    const [cryptoAssets, setCryptoAssets] = useState<CryptoAsset[]>([]);
    const [showChart, setShowChart] = useState(true);
    const [chartTab, setChartTab] = useState<ChartTabType>('line');
    const [activeTab, setActiveTab] = useState<TabType>('wallet');
    const [timeframe, setTimeframe] = useState<TimeframeType>('10s');
    const openOrdersRef = useRef<any>(null);
   
    const btc = useCryptoData('BTC', timeframe);
    const eth = useCryptoData('ETH', timeframe);
    const bnb = useCryptoData('BNB', timeframe);
    const sol = useCryptoData('SOL', timeframe);
    const doge = useCryptoData('DOGE', timeframe);
    
    const allData = { BTC: btc, ETH: eth, BNB: bnb, SOL: sol, DOGE: doge };
    const currentData = allData[selectedSymbol as keyof typeof allData];
    const globalHistory = useGlobalHistory(allData);

  
    useEffect(() => {
        console.log(`Таймфрейм изменен на: ${timeframe}`);
    }, [timeframe]);

    
    useEffect(() => {
        const savedBalance = localStorage.getItem('walletBalance');
        if (savedBalance) {
            try {
                setWalletBalance(parseFloat(savedBalance));
            } catch (e) {
                console.error('Ошибка загрузки баланса:', e);
            }
        }
        
        const savedAssets = localStorage.getItem('cryptoAssets');
        if (savedAssets) {
            try {
                setCryptoAssets(JSON.parse(savedAssets));
            } catch (e) {
                console.error('Ошибка загрузки активов:', e);
            }
        }
    }, []);

    const saveBalance = (newBalance: number) => {
        setWalletBalance(newBalance);
        localStorage.setItem('walletBalance', String(newBalance));
    };

    const saveAssets = (assets: CryptoAsset[]) => {
        setCryptoAssets(assets);
        localStorage.setItem('cryptoAssets', JSON.stringify(assets));
    };

    const handleDeposit = (amount: number) => {
        const newBalance = walletBalance + amount;
        saveBalance(newBalance);
        toast.success(`Баланс пополнен на $${amount.toFixed(2)}!`);
        setShowDepositModal(false);
    };

    const handleBuy = (symbol: string, quantity: number, price: number) => {
        const total = quantity * price;
        if (total > walletBalance) {
            toast.error(`Недостаточно средств! Нужно: $${total.toFixed(2)}, Доступно: $${walletBalance.toFixed(2)}`);
            return false;
        }
        
        saveBalance(walletBalance - total);
        
        const existingAsset = cryptoAssets.find(a => a.symbol === symbol);
        let newAssets: CryptoAsset[];
        
        if (existingAsset) {
            const totalQuantity = existingAsset.quantity + quantity;
            const totalCost = (existingAsset.quantity * existingAsset.averagePrice) + (quantity * price);
            const newAveragePrice = totalCost / totalQuantity;
            
            newAssets = cryptoAssets.map(a => 
                a.symbol === symbol 
                    ? { ...a, quantity: totalQuantity, averagePrice: newAveragePrice }
                    : a
            );
        } else {
            newAssets = [...cryptoAssets, { 
                symbol, 
                quantity, 
                averagePrice: price 
            }];
        }
        
        saveAssets(newAssets);
        toast.success(`Куплено ${quantity} ${symbol} за $${total.toFixed(2)}!`);
        return true;
    };

    const handleSell = (symbol: string, quantity: number, price: number) => {
        const asset = cryptoAssets.find(a => a.symbol === symbol);
        if (!asset) {
            toast.error(`У вас нет ${symbol}`);
            return false;
        }
        
        if (asset.quantity < quantity) {
            toast.error(`Недостаточно ${symbol}! Доступно: ${asset.quantity.toFixed(4)}`);
            return false;
        }
        
        const total = quantity * price;
        saveBalance(walletBalance + total);
        
        const newQuantity = asset.quantity - quantity;
        let newAssets: CryptoAsset[];
        
        if (newQuantity <= 0.0001) {
            newAssets = cryptoAssets.filter(a => a.symbol !== symbol);
        } else {
            newAssets = cryptoAssets.map(a => 
                a.symbol === symbol 
                    ? { ...a, quantity: newQuantity }
                    : a
            );
        }
        
        saveAssets(newAssets);
        toast.success(`Продано ${quantity} ${symbol} за $${total.toFixed(2)}!`);
        return true;
    };

    const getAssetBalance = (symbol: string): number => {
        const asset = cryptoAssets.find(a => a.symbol === symbol);
        return asset?.quantity || 0;
    };

    const handleLimitOrder = (side: 'buy' | 'sell', price: number, quantity: number) => {
        if (openOrdersRef.current) {
            openOrdersRef.current.addLimitOrder(side, price, quantity);
        }
    };

    const priceMap = new Map();
    Object.entries(allData).forEach(([symbol, data]) => {
        priceMap.set(symbol, { price: data.price, change: data.change });
    });

    const isPositive = currentData?.change >= 0;
    const currentPrice = currentData?.price || 0;
    const currentChange = currentData?.change || 0;

   
    const handleTimeframeChange = (newTimeframe: TimeframeType) => {
        setTimeframe(newTimeframe);

    };

    return (
        <div className="app">
            <Toaster position="top-right" toastOptions={{ duration: 2000 }} />
            <div className="container">
                <header>
                    <div className="header-content">
                        <div className="header-left">
                            <h1>
                                <Rocket size={28} />
                                Crypto Live Tracker
                            </h1>
                            
                        </div>
                        <div className="header-right">
                            <div className="wallet-header">
                                <BadgeDollarSign size={18} color="white" />
                                <span className="wallet-label">Баланс:</span>
                                <span className="wallet-amount">
                                    {showBalance ? `${formatPrice(walletBalance)}` : '••••••'}
                                </span>
                                <div className="wallet-actions-header">
                                    <button 
                                        className="wallet-btn-small"
                                        onClick={() => setShowBalance(!showBalance)}
                                        title={showBalance ? 'Скрыть баланс' : 'Показать баланс'}
                                    >
                                        {showBalance ? <EyeOff size={14} color="white" /> : <Eye size={14} color="white" />}
                                    </button>
                                    <button 
                                        className="wallet-btn-small deposit-btn-header"
                                        onClick={() => setShowDepositModal(true)}
                                        title="Пополнить баланс"
                                    >
                                        <Plus size={14} color="white" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                
                <div className="symbol-tabs">
                    {CRYPTOS.map((crypto) => {
                        const data = allData[crypto.symbol as keyof typeof allData];
                        const isActive = selectedSymbol === crypto.symbol;
                        return (
                            <button
                                key={crypto.symbol}
                                className={`symbol-tab ${isActive ? 'active' : ''}`}
                                onClick={() => setSelectedSymbol(crypto.symbol)}
                            >
                                <span className="symbol-main">{crypto.symbol}</span>
                                <span className="symbol-price">
                                    {formatPrice(data?.price || 0)}
                                </span>
                                <span className={`symbol-change ${data?.change >= 0 ? 'positive' : 'negative'}`}>
                                    {data?.change >= 0 ? '+' : ''}{data?.change?.toFixed(2) || '0.00'}%
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* ИНФО О МОНЕТЕ */}
                <div className="crypto-info-header">
                    <div className="crypto-title">
                        <h2>{selectedSymbol}</h2>
                        <span className={`status-dot ${currentData?.isConnected ? 'connected' : 'connecting'}`} />
                        <span className="crypto-name">
                            {CRYPTOS.find(c => c.symbol === selectedSymbol)?.name}
                        </span>
                    </div>
                    <div className="price-info">
                        <p className={`price ${isPositive ? 'positive' : 'negative'}`}>
                            {formatPrice(currentPrice)}
                        </p>
                        <p className={`change ${isPositive ? 'positive' : 'negative'}`}>
                            {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                            {Math.abs(currentChange).toFixed(2)}%
                        </p>
                    </div>
                    <button 
                        className="chart-toggle-btn"
                        onClick={() => setShowChart(!showChart)}
                    >
                        {showChart ? <EyeOff size={16} /> : <Eye size={16} />}
                        {showChart ? ' Скрыть график' : ' Показать график'}
                    </button>
                </div>

             
                <div className="main-content">
                    <div className="chart-order-wrapper">
                        <div className="chart-order-row">
                            <div className="chart-wrapper">
                                {showChart && (
                                    <>
                                        <div className="chart-tabs">
                                            <button 
                                                className={`chart-tab-btn ${chartTab === 'line' ? 'active' : ''}`}
                                                onClick={() => setChartTab('line')}
                                            >
                                                <LineIcon size={14} /> Линейный
                                            </button>
                                            <button 
                                                className={`chart-tab-btn ${chartTab === 'candle' ? 'active' : ''}`}
                                                onClick={() => setChartTab('candle')}
                                            >
                                                <CandleIcon size={14} /> Свечной
                                            </button>
                                        </div>
                                        
                                        {chartTab === 'line' && currentData?.history.length > 0 && (
                                            <div className="chart-area-full">
                                                <ResponsiveContainer width="100%" height={400}>
                                                    <LineChart data={currentData.history} key={`line-${timeframe}`}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                                        <XAxis 
                                                            dataKey="time" 
                                                            tick={{ fontSize: 10, fill: '#64748b' }} 
                                                            interval="preserveStartEnd" 
                                                            tickMargin={8}
                                                            axisLine={true}
                                                            tickLine={true}
                                                        />
                                                        <YAxis 
                                                            domain={['auto', 'auto']} 
                                                            tick={{ fontSize: 10, fill: '#64748b' }} 
                                                            tickMargin={2}
                                                            axisLine={false}
                                                            tickLine={false}
                                                            width={40}
                                                        />
                                                        <Tooltip 
                                                            contentStyle={{ 
                                                                borderRadius: '8px', 
                                                                border: 'none', 
                                                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
                                                            }}
                                                            formatter={(value) => {
                                                                const num = typeof value === 'number' ? value : parseFloat(String(value));
                                                                return [`${num.toFixed(2)}`, 'Цена'];
                                                            }}
                                                        />
                                                        <Line 
                                                            type="monotone" 
                                                            dataKey="price" 
                                                            stroke="#6366f1" 
                                                            strokeWidth={2} 
                                                            dot={false} 
                                                        />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            </div>
                                        )}
                                        
                                        {chartTab === 'candle' && <CandlestickChart data={currentData?.candles || []} key={`candle-${timeframe}`} />}
                                    </>
                                )}
                                
                               
                                <div className="timeframe-bar-under">
                                    {(Object.entries(TIMEFRAME_CONFIG) as [TimeframeType, { ms: number; label: string }][]).map(([key, config]) => (
                                        <button
                                            key={key}
                                            className={`tf-badge-under ${timeframe === key ? 'active' : ''}`}
                                            onClick={() => handleTimeframeChange(key)}
                                        >
                                            {config.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="right-panel-new">
                                <div className="orderbook-wrapper-new">
                                    <OrderBook symbol={selectedSymbol} />
                                </div>
                                <div className="trade-wrapper-new">
                                    <TradePanel 
                                        symbol={selectedSymbol} 
                                        currentPrice={currentPrice} 
                                        walletBalance={walletBalance}
                                        onBuy={handleBuy}
                                        onSell={handleSell}
                                        onLimitOrder={handleLimitOrder}
                                        assetBalance={getAssetBalance(selectedSymbol)}
                                    />
                                </div>
                            </div>
                        </div>

                       
                        <div className="bottom-tabs">
                            <div className="tabs-header">
                                <button 
                                    className={`tab-btn ${activeTab === 'wallet' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('wallet')}
                                >
                                    <Wallet size={16} /> Кошелек
                                </button>
                                <button 
                                    className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('orders')}
                                >
                                    <Clock size={16} /> Ордера
                                </button>
                                <button 
                                    className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('history')}
                                >
                                    <History size={16} /> История
                                </button>
                            </div>

                            <div className="tabs-content">
                                {activeTab === 'wallet' && (
                                    <div className="tab-panel">
                                        <CryptoWallet 
                                            walletBalance={walletBalance}
                                            onBuy={handleBuy}
                                            prices={priceMap}
                                        />
                                    </div>
                                )}
                                {activeTab === 'orders' && (
                                    <div className="tab-panel">
                                        <OpenOrders 
                                            ref={openOrdersRef}
                                            symbol={selectedSymbol}
                                            currentPrice={currentPrice}
                                            onOrderFilled={(order) => {
                                                if (order.side === 'buy') {
                                                    handleBuy(order.symbol, order.quantity, order.price);
                                                } else {
                                                    handleSell(order.symbol, order.quantity, order.price);
                                                }
                                            }}
                                        />
                                    </div>
                                )}
                                {activeTab === 'history' && (
                                    <div className="tab-panel history-panel">
                                        <div className="history-full">
                                            <div className="history-full-header">
                                                <span>📋 Полная история ордеров</span>
                                                <button 
                                                    className="clear-history-btn"
                                                    onClick={() => {
                                                        if (window.confirm('Очистить всю историю?')) {
                                                            localStorage.removeItem('tradeHistory');
                                                            window.location.reload();
                                                        }
                                                    }}
                                                >
                                                    Очистить всё
                                                </button>
                                            </div>
                                            <div className="history-full-list">
                                                {(() => {
                                                    const saved = localStorage.getItem('tradeHistory');
                                                    if (!saved) return <div className="history-empty">Нет ордеров</div>;
                                                    try {
                                                        const orders = JSON.parse(saved);
                                                        if (orders.length === 0) return <div className="history-empty">Нет ордеров</div>;
                                                        return orders.map((order: any) => (
                                                            <div key={order.id} className={`history-item ${order.side}`}>
                                                                <div className="history-info">
                                                                    <span className="history-side">
                                                                        {order.side === 'buy' ? '🟢 Покупка' : '🔴 Продажа'}
                                                                    </span>
                                                                    <span className="history-type">{order.type}</span>
                                                                    <span className="history-qty">{order.quantity} {order.symbol}</span>
                                                                </div>
                                                                <div className="history-details">
                                                                    <span className="history-price">{formatPrice(order.price)}</span>
                                                                    <span className="history-total">{formatPrice(order.total)}</span>
                                                                    <span className="history-time">{new Date(order.timestamp).toLocaleString()}</span>
                                                                </div>
                                                            </div>
                                                        ));
                                                    } catch (e) {
                                                        return <div className="history-empty">Ошибка загрузки истории</div>;
                                                    }
                                                })()}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                
                <div className="sidebar">
                    <HistoryLog history={globalHistory} />
                    <HistoryChart history={globalHistory} />
                </div>
            </div>

           
            {showDepositModal && (
                <div className="deposit-modal-overlay" onClick={() => setShowDepositModal(false)}>
                    <div className="deposit-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="deposit-modal-header">
                            <h4>
                                <BadgeDollarSign size={20} style={{ display: 'inline-block', marginRight: '8px' }} />
                                Пополнение баланса
                            </h4>
                            <button 
                                className="modal-close-btn"
                                onClick={() => setShowDepositModal(false)}
                            >
                                ✕
                            </button>
                        </div>
                        <div className="deposit-modal-body">
                            <div className="deposit-presets">
                                <button onClick={() => handleDeposit(100)}>+$100</button>
                                <button onClick={() => handleDeposit(500)}>+$500</button>
                                <button onClick={() => handleDeposit(1000)}>+$1000</button>
                                <button onClick={() => handleDeposit(5000)}>+$5000</button>
                                <button onClick={() => handleDeposit(10000)}>+$10000</button>
                            </div>
                            <div className="deposit-custom">
                                <label>Своя сумма</label>
                                <div className="deposit-custom-input">
                                    <input
                                        type="number"
                                        value={depositAmount}
                                        onChange={(e) => setDepositAmount(e.target.value)}
                                        placeholder="Введите сумму"
                                        min="1"
                                        step="1"
                                    />
                                    <button 
                                        className="deposit-custom-btn"
                                        onClick={() => {
                                            const amount = parseFloat(depositAmount);
                                            if (amount && amount > 0) {
                                                handleDeposit(amount);
                                            } else {
                                                toast.error('Введите корректную сумму');
                                            }
                                        }}
                                    >
                                        Пополнить
                                    </button>
                                </div>
                            </div>
                            <div className="deposit-current-balance">
                                Текущий баланс: <strong>{formatPrice(walletBalance)}</strong>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;