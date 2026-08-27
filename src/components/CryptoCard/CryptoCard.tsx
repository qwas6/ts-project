import React, { useState, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { X, Eye, EyeOff, TrendingUp, TrendingDown, CandlestickChart as CandleIcon, LineChart as LineIcon, Wallet, History, Clock } from 'lucide-react';
import { CandlestickChart } from '../CandlestickChart/CandlestickChart';
import { OrderBook } from '../OrderBook/OrderBook';
import { TradePanel } from '../TradePanel/TradePanel';
import { CryptoWallet } from '../CryptoWallet/CryptoWallet';
import { OpenOrders } from '../OpenOrders/OpenOrders';
import { TIMEFRAME_CONFIG } from '../../constants';
import type { ChartData, CandleData, Timeframe } from '../../types';
import { formatPrice, formatChange } from '../../utils/helpers';
import './CryptoCard.css';

interface CryptoCardProps {
    symbol: string;
    price: number;
    change: number;
    history: ChartData[];
    candles: CandleData[];
    onRemove: () => void;
    timeframe: Timeframe;
    onTimeframeChange: (tf: Timeframe) => void;
    isConnected: boolean;
    walletBalance: number;
    onBuy: (symbol: string, quantity: number, price: number) => boolean;
    onSell: (symbol: string, quantity: number, price: number) => boolean;
    prices: Map<string, { price: number; change: number }>;
    assetBalance?: number;
}

type TabType = 'wallet' | 'orders' | 'history';
type ChartTabType = 'line' | 'candle';

export const CryptoCard = React.memo(({
    symbol,
    price,
    change,
    history,
    candles,
    onRemove,
    timeframe,
    onTimeframeChange,
    isConnected,
    walletBalance,
    onBuy,
    onSell,
    prices,
    assetBalance = 0
}: CryptoCardProps) => {
    const [showChart, setShowChart] = useState(false);
    const [chartTab, setChartTab] = useState<ChartTabType>('line');
    const [activeTab, setActiveTab] = useState<TabType>('wallet');
    const openOrdersRef = useRef<any>(null);

    const isPositive = change >= 0;

    const handleLimitOrder = (side: 'buy' | 'sell', price: number, quantity: number) => {
        if (openOrdersRef.current) {
            openOrdersRef.current.addLimitOrder(side, price, quantity);
        }
    };

    return (
        <div className="crypto-card">
            <div className="card-header">
                <div className="crypto-info">
                    <div className="crypto-title">
                        <h3>{symbol}</h3>
                        <span className={`status-dot ${isConnected ? 'connected' : 'connecting'}`} />
                    </div>
                    <p className={`price ${isPositive ? 'positive' : 'negative'}`}>
                        {formatPrice(price)}
                    </p>
                    <p className={`change ${isPositive ? 'positive' : 'negative'}`}>
                        {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        {Math.abs(change).toFixed(2)}%
                    </p>
                </div>
                <button className="remove-btn" onClick={onRemove}>
                    <X size={18} />
                </button>
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
                {showChart ? (
                    <><EyeOff size={16} /> Скрыть график</>
                ) : (
                    <><Eye size={16} /> Показать график</>
                )}
            </button>
            
            {showChart && (
                <div className="chart-order-wrapper">
                    <div className="chart-order-row">
                        <div className="chart-wrapper">
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
                            
                            
                            {chartTab === 'line' && history.length > 0 && (
                                <div className="chart-area-full">
                                    <LineChart
                                        width={700}
                                        height={400}
                                        data={history}
                                        margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                        <XAxis 
                                            dataKey="time" 
                                            tick={{ fontSize: 10, fill: '#64748b' }} 
                                            interval="preserveStartEnd" 
                                            tickMargin={2}
                                            axisLine={false}
                                            tickLine={false}
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
                                                return [`$${num.toFixed(2)}`, 'Цена'];
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
                                </div>
                            )}
                            
                            {chartTab === 'candle' && <CandlestickChart data={candles} />}
                        </div>
                        
                        <div className="right-panel-new">
                            <div className="orderbook-wrapper-new">
                                <OrderBook symbol={symbol} />
                            </div>
                            <div className="trade-wrapper-new">
                                <TradePanel 
                                    symbol={symbol} 
                                    currentPrice={price} 
                                    walletBalance={walletBalance}
                                    onBuy={onBuy}
                                    onSell={onSell}
                                    onLimitOrder={handleLimitOrder}
                                    assetBalance={assetBalance}
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
                                        onBuy={onBuy}
                                        prices={prices}
                                    />
                                </div>
                            )}
                            {activeTab === 'orders' && (
                                <div className="tab-panel">
                                    <OpenOrders 
                                        ref={openOrdersRef}
                                        symbol={symbol}
                                        currentPrice={price}
                                        onOrderFilled={(order) => {
                                            if (order.side === 'buy') {
                                                onBuy(order.symbol, order.quantity, order.price);
                                            } else {
                                                onSell(order.symbol, order.quantity, order.price);
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
                                                                <span className="history-price">${formatPrice(order.price)}</span>
                                                                <span className="history-total">${formatPrice(order.total)}</span>
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
            )}
        </div>
    );
});