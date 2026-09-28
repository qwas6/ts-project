import React, { useState, useEffect, useRef } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import {
    Rocket, Plus, Clock, BadgeDollarSign, Eye, EyeOff,
    TrendingUp, TrendingDown, CandlestickChart as CandleIcon,
    LineChart as LineIcon, Wallet, History, Repeat, Calculator
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
import { ProfitCalculator } from './components/ProfitCalculator/ProfitCalculator';
import { FuturesPanel } from './components/FuturesPanel/FuturesPanel';
import { PositionsList } from './components/PositionsList/PositionsList';
import { useCryptoData } from './hooks/useCryptoData';
import { useGlobalHistory } from './hooks/useGlobalHistory';
import { useFutures } from './hooks/useFutures';
import { TIMEFRAME_CONFIG, CRYPTOS } from './constants';
import { formatPrice } from './utils/helpers';
import './App.css';

interface CryptoAsset {
    symbol: string;
    quantity: number;
    averagePrice: number;
}

type TabType = 'wallet' | 'orders' | 'history' | 'positions';
type ChartTabType = 'line' | 'candle';
type TimeframeType = '1m' | '5m' | '15m' | '1h' | '4h';

function App() {
    const [selectedSymbol, setSelectedSymbol] = useState<string>('BTC');
    const [walletBalance, setWalletBalance] = useState(1000);
    const [showBalance, setShowBalance] = useState(true);
    const [showDepositModal, setShowDepositModal] = useState(false);
    const [showConverter, setShowConverter] = useState(false);
    const [showProfitCalc, setShowProfitCalc] = useState(false);
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
    const futures = useFutures();

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
                setWalletBalance(Number(savedBalance));
            } catch (e) {
                console.error('Ошибка загрузки баланса:', e);
            }
        }

        const savedAssets = localStorage.getItem('cryptoAssets');
        if (savedAssets) {
            try {
                const parsed = JSON.parse(savedAssets);
                const sanitized = parsed.map((a: any) => ({
                    symbol: String(a.symbol),
                    quantity: Number(a.quantity) || 0,
                    averagePrice: Number(a.averagePrice) || 0
                }));
                setCryptoAssets(sanitized);
                localStorage.setItem('cryptoAssets', JSON.stringify(sanitized));
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
        const sanitized = assets.map(a => ({
            symbol: String(a.symbol),
            quantity: Number(a.quantity) || 0,
            averagePrice: Number(a.averagePrice) || 0
        }));
        setCryptoAssets(sanitized);
        localStorage.setItem('cryptoAssets', JSON.stringify(sanitized));
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
        const qty = Number(quantity);
        const prc = Number(price);
        const total = qty * prc;

        if (total > walletBalance) {
            toast.error(`Недостаточно средств! Нужно: $${total.toFixed(2)}, Доступно: $${walletBalance.toFixed(2)}`);
            return false;
        }

        saveBalance(walletBalance - total);

        const existingAsset = cryptoAssets.find(a => a.symbol === symbol);
        let newAssets: CryptoAsset[];

        if (existingAsset) {
            const oldQty = Number(existingAsset.quantity) || 0;
            const oldAvg = Number(existingAsset.averagePrice) || 0;

            const totalQuantity = oldQty + qty;
            const totalCost = (oldQty * oldAvg) + (qty * prc);
            const newAveragePrice = totalQuantity > 0 ? totalCost / totalQuantity : prc;

            newAssets = cryptoAssets.map(a =>
                a.symbol === symbol
                    ? {
                        symbol: a.symbol,
                        quantity: totalQuantity,
                        averagePrice: newAveragePrice
                    }
                    : a
            );
        } else {
            newAssets = [...cryptoAssets, {
                symbol,
                quantity: qty,
                averagePrice: prc
            }];
        }

        saveAssets(newAssets);
        toast.success(`Куплено ${qty} ${symbol} за $${total.toFixed(2)}!`);
        return true;
    };

    const handleSell = (symbol: string, quantity: number, price: number) => {
        const qty = Number(quantity);
        const prc = Number(price);

        const asset = cryptoAssets.find(a => a.symbol === symbol);
        if (!asset) {
            toast.error(`У вас нет ${symbol}`);
            return false;
        }

        const assetQty = Number(asset.quantity) || 0;
        if (assetQty < qty) {
            toast.error(`Недостаточно ${symbol}! Доступно: ${assetQty.toFixed(4)}`);
            return false;
        }

        const total = qty * prc;
        saveBalance(walletBalance + total);

        const newQuantity = assetQty - qty;
        let newAssets: CryptoAsset[];

        if (newQuantity <= 0.0001) {
            newAssets = cryptoAssets.filter(a => a.symbol !== symbol);
        } else {
            newAssets = cryptoAssets.map(a =>
                a.symbol === symbol
                    ? {
                        symbol: a.symbol,
                        quantity: newQuantity,
                        averagePrice: Number(a.averagePrice) || 0
                    }
                    : a
            );
        }

        saveAssets(newAssets);
        toast.success(`Продано ${qty} ${symbol} за $${total.toFixed(2)}!`);
        return true;
    };

    const getAssetBalance = (symbol: string): number => {
        const asset = cryptoAssets.find(a => a.symbol === symbol);
        return Number(asset?.quantity) || 0;
    };

    const getPriceInUsdt = (symbol: string): number => {
        if (symbol === 'USDT') return 1;
        return Number(allData[symbol as keyof typeof allData]?.price) || 0;
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

        const fromAmt = Number(fromAmount);
        const toAmt = Number(toAmount);
        const fromPrice = getPriceInUsdt(fromSymbol);
        const toPrice = getPriceInUsdt(toSymbol);

        if (fromPrice <= 0 || toPrice <= 0) {
            toast.error('Цена недоступна');
            return false;
        }

        const usdtValue = fromAmt * fromPrice;

        let newBalance = walletBalance;
        let newAssets = cryptoAssets.map(a => ({
            symbol: String(a.symbol),
            quantity: Number(a.quantity) || 0,
            averagePrice: Number(a.averagePrice) || 0
        }));

        if (fromSymbol === 'USDT') {
            if (fromAmt > walletBalance) {
                toast.error('Недостаточно USDT');
                return false;
            }
            newBalance -= fromAmt;
        } else {
            const fromAsset = newAssets.find(a => a.symbol === fromSymbol);
            if (!fromAsset || fromAsset.quantity < fromAmt) {
                toast.error(`Недостаточно ${fromSymbol}`);
                return false;
            }
            const remaining = fromAsset.quantity - fromAmt;
            if (remaining <= 0.0000001) {
                newAssets = newAssets.filter(a => a.symbol !== fromSymbol);
            } else {
                newAssets = newAssets.map(a =>
                    a.symbol === fromSymbol ? { ...a, quantity: remaining } : a
                );
            }
        }

        if (toSymbol === 'USDT') {
            newBalance += toAmt;
        } else {
            const toAsset = newAssets.find(a => a.symbol === toSymbol);
            if (toAsset) {
                const oldQty = Number(toAsset.quantity) || 0;
                const oldAvg = Number(toAsset.averagePrice) || 0;

                const totalQuantity = oldQty + toAmt;
                const totalCost = (oldQty * oldAvg) + usdtValue;
                const newAvg = totalQuantity > 0 ? totalCost / totalQuantity : toPrice;

                newAssets = newAssets.map(a =>
                    a.symbol === toSymbol
                        ? {
                            symbol: a.symbol,
                            quantity: totalQuantity,
                            averagePrice: newAvg
                        }
                        : a
                );
            } else {
                newAssets = [...newAssets, {
                    symbol: toSymbol,
                    quantity: toAmt,
                    averagePrice: toPrice
                }];
            }
        }

        saveBalance(newBalance);
        saveAssets(newAssets);

        toast.success(
            `Конвертировано ${fromAmt.toFixed(6)} ${fromSymbol} → ${toAmt.toFixed(6)} ${toSymbol}`
        );
        return true;
    };

    const handleLimitOrder = (side: 'buy' | 'sell', price: number, quantity: number) => {
        if (openOrdersRef.current) {
            openOrdersRef.current.addLimitOrder(side, price, quantity);
        }
    };

    const handleOpenFutures = (
        symbol: string,
        side: 'long' | 'short',
        margin: number,
        entryPrice: number
    ) => {
        if (margin > walletBalance) {
            toast.error('Недостаточно средств');
            return;
        }
        const pos = futures.openPosition(symbol, side, margin, entryPrice);
        if (pos) {
            saveBalance(walletBalance - margin);
            toast.success(
                `${side === 'long' ? '🟢 LONG' : '🔴 SHORT'} ${symbol} ×${pos.leverage} открыта`
            );
        }
    };

    const handleCloseFutures = (positionId: string, closePrice: number) => {
        const pos = futures.positions.find(p => p.id === positionId);
        if (!pos) return;

        const pnl = pos.side === 'long'
            ? (closePrice - pos.entryPrice) * pos.quantity
            : (pos.entryPrice - closePrice) * pos.quantity;

        const returned = pos.margin + pnl;
        saveBalance(walletBalance + returned);

        futures.closePosition(positionId, closePrice);

        toast.success(
            `Позиция закрыта. ${pnl >= 0 ? 'Прибыль' : 'Убыток'}: $${Math.abs(pnl).toFixed(2)}`
        );
    };

    const priceMap = new Map();
    Object.entries(allData).forEach(([symbol, data]) => {
        priceMap.set(symbol, { price: data.price, change: data.change });
    });

    const simplePriceMap = new Map<string, number>();
    Object.entries(allData).forEach(([symbol, data]) => {
        simplePriceMap.set(symbol, data.price);
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
                                        onClick={() => setShowProfitCalc(true)}
                                        title="Калькулятор прибыли"
                                    >
                                        <Calculator size={14} color="white" />
                                    </button>
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
                                <div className="trade-wrapper-new">
                                    <FuturesPanel
                                        symbol={selectedSymbol}
                                        currentPrice={currentPrice}
                                        walletBalance={walletBalance}
                                        leverage={futures.leverage}
                                        onOpen={handleOpenFutures}
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
                                <button
                                    className={`tab-btn ${activeTab === 'positions' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('positions')}
                                >
                                    📈 Позиции ({futures.openPositions.length})
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
                                {activeTab === 'positions' && (
                                    <div className="tab-panel" style={{ minHeight: 240 }}>
                                        <PositionsList
                                            positions={futures.positions}
                                            prices={simplePriceMap}
                                            onClose={handleCloseFutures}
                                        />
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

            <ProfitCalculator
                isOpen={showProfitCalc}
                onClose={() => setShowProfitCalc(false)}
                assets={cryptoAssets}
                prices={priceMap}
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