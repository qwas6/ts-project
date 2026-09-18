import React, { useState, useEffect, useRef } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import {
    Rocket, Plus, Clock, BadgeDollarSign, Eye, EyeOff,
    TrendingUp, TrendingDown, CandlestickChart as CandleIcon,
    LineChart as LineIcon, Wallet, History, Repeat
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CandlestickChart } from './components/CandlestickChart/CandlestickChart';
import { OrderBook } from './components/OrderBook/OrderBook';
import { TradePanel } from './components/TradePanel/TradePanel';
import { CryptoWallet } from './components/CryptoWallet/CryptoWallet';
import { OpenOrders } from './components/OpenOrders/OpenOrders';
import { HistoryLog } from './components/HistoryLog/HistoryLog';
import { HistoryChart } from './components/HistoryChart/HistoryChart';
import { Converter } from './components/Converter/Converter';
import { useCryptoData } from './hooks/useCryptoData';
import { useGlobalHistory } from './hooks/useGlobalHistory';
import { TIMEFRAME_CONFIG, CRYPTOS } from './constants';
import { formatPrice } from './utils/helpers';
import './App.css';

interface CryptoAsset {
    symbol: string;
    quantity: number;
    averagePrice: number;
}

type TabType = 'wallet' | 'orders' | 'history';
type ChartTabType = 'line' | 'candle';
type TimeframeType = '1m' | '5m' | '15m' | '1h' | '4h';

function App() {
    const [selectedSymbol, setSelectedSymbol] = useState<string>('BTC');
    const [walletBalance, setWalletBalance] = useState(1000);
    const [showBalance, setShowBalance] = useState(true);
    const [showDepositModal, setShowDepositModal] = useState(false);
    const [showConverter, setShowConverter] = useState(false);
    const [depositAmount, setDepositAmount] = useState<string>('');
    const [cryptoAssets, setCryptoAssets] = useState<CryptoAsset[]>([]);
    const [showChart, setShowChart] = useState(true);
    const [chartTab, setChartTab] = useState<ChartTabType>('line');
    const [activeTab, setActiveTab] = useState<TabType>('wallet');

    const [timeframes, setTimeframes] = useState<Record<string, TimeframeType>>(() => {
        const saved = localStorage.getItem('timeframes');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error('Ошибка загрузки таймфреймов:', e);
            }
        }
        return {
            BTC: '1m',
            ETH: '1m',
            BNB: '1m',
            SOL: '1m',
            DOGE: '1m'
        };
    });

    const openOrdersRef = useRef<any>(null);

    const btc = useCryptoData('BTC', timeframes.BTC || '1m');
    const eth = useCryptoData('ETH', timeframes.ETH || '1m');
    const bnb = useCryptoData('BNB', timeframes.BNB || '1m');
    const sol = useCryptoData('SOL', timeframes.SOL || '1m');
    const doge = useCryptoData('DOGE', timeframes.DOGE || '1m');

    const allData = { BTC: btc, ETH: eth, BNB: bnb, SOL: sol, DOGE: doge };
    const currentData = allData[selectedSymbol as keyof typeof allData];
    const globalHistory = useGlobalHistory(allData);

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

    const updateTimeframe = (symbol: string, tf: TimeframeType) => {
        setTimeframes(prev => {
            const updated = { ...prev, [symbol]: tf };
            localStorage.setItem('timeframes', JSON.stringify(updated));
            return updated;
        });
        toast.success(`${symbol}: ${TIMEFRAME_CONFIG[tf].label}`);
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

    const getPriceInUsdt = (symbol: string): number => {
        if (symbol === 'USDT') return 1;
        return allData[symbol as keyof typeof allData]?.price || 0;
    };

    const handleConvert = (
        fromSymbol: string,
        toSymbol: string,
        fromAmount: number,
        toAmount: number
    ): boolean => {
        if (fromSymbol === toSymbol) {
            toast.error('Выберите разные валюты');
            return false;
        }

        const fromPrice = getPriceInUsdt(fromSymbol);
        const toPrice = getPriceInUsdt(toSymbol);

        if (fromPrice <= 0 || toPrice <= 0) {
            toast.error('Цена недоступна');
            return false;
        }

        const usdtValue = fromAmount * fromPrice;

        let newBalance = walletBalance;
        let newAssets = [...cryptoAssets];

        if (fromSymbol === 'USDT') {
            if (fromAmount > walletBalance) {
                toast.error('Недостаточно USDT');
                return false;
            }
            newBalance -= fromAmount;
        } else {
            const fromAsset = newAssets.find(a => a.symbol === fromSymbol);
            if (!fromAsset || fromAsset.quantity < fromAmount) {
                toast.error(`Недостаточно ${fromSymbol}`);
                return false;
            }
            const remaining = fromAsset.quantity - fromAmount;
            if (remaining <= 0.0000001) {
                newAssets = newAssets.filter(a => a.symbol !== fromSymbol);
            } else {
                newAssets = newAssets.map(a =>
                    a.symbol === fromSymbol ? { ...a, quantity: remaining } : a
                );
            }
        }

        if (toSymbol === 'USDT') {
            newBalance += toAmount;
        } else {
            const toAsset = newAssets.find(a => a.symbol === toSymbol);
            if (toAsset) {
                const totalQuantity = toAsset.quantity + toAmount;
                const totalCost = (toAsset.quantity * toAsset.averagePrice) + usdtValue;
                const newAvg = totalCost / totalQuantity;
                newAssets = newAssets.map(a =>
                    a.symbol === toSymbol
                        ? { ...a, quantity: totalQuantity, averagePrice: newAvg }
                        : a
                );
            } else {
                newAssets = [...newAssets, {
                    symbol: toSymbol,
                    quantity: toAmount,
                    averagePrice: toPrice
                }];
            }
        }

        saveBalance(newBalance);
        saveAssets(newAssets);

        toast.success(
            `Конвертировано ${fromAmount.toFixed(6)} ${fromSymbol} → ${toAmount.toFixed(6)} ${toSymbol}`
        );
        return true;
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

    const isPositive = (currentData?.change || 0) >= 0;
    const currentPrice = currentData?.price || 0;
    const currentChange = currentData?.change || 0;

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
                                        className="wallet-btn-small"
                                        onClick={() => setShowConverter(true)}
                                        title="Конвертация валют"
                                    >
                                        <Repeat size={14} color="white" />
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
                                <span className={`symbol-change ${(data?.change || 0) >= 0 ? 'positive' : 'negative'}`}>
                                    {(data?.change || 0) >= 0 ? '+' : ''}{(data?.change || 0).toFixed(2)}%
                                </span>
                            </button>
                        );
                    })}
                </div>

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

                                        {chartTab === 'line' && (currentData?.history.length || 0) > 0 && (
                                            <div className="chart-area-full">
                                                <ResponsiveContainer width="100%" height={400}>
                                                    <LineChart data={currentData.history}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                                        <XAxis
                                                            dataKey="time"
                                                            tick={{ fontSize: 10, fill: '#64748b' }}
                                                            interval="preserveStartEnd"
                                                            tickMargin={8}
                                                        />
                                                        <YAxis
                                                            domain={['auto', 'auto']}
                                                            tick={{ fontSize: 10, fill: '#64748b' }}
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

                                        {chartTab === 'candle' && (
                                            <div className="chart-area-full">
                                                <CandlestickChart data={currentData?.candles || []} />
                                            </div>
                                        )}
                                    </>
                                )}

                                <div className="timeframe-bar-under">
                                    {(Object.entries(TIMEFRAME_CONFIG) as [TimeframeType, { ms: number; label: string; binance: string }][]).map(([key, config]) => (
                                        <button
                                            key={key}
                                            className={`tf-badge-under ${timeframes[selectedSymbol] === key ? 'active' : ''}`}
                                            onClick={() => updateTimeframe(selectedSymbol, key)}
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
                                                <span>История ордеров</span>
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
                                                                        {order.side === 'buy' ? 'Покупка' : 'Продажа'}
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

            <Converter
                isOpen={showConverter}
                onClose={() => setShowConverter(false)}
                prices={priceMap}
                walletBalance={walletBalance}
                assets={cryptoAssets}
                onConvert={handleConvert}
            />

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