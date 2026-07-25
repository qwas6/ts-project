import React, { useState, useEffect } from 'react';
import { NumericFormat } from 'react-number-format';
import { 
    TrendingUp, TrendingDown, 
    Wallet, History, Trash2,
    ShoppingBag, ShoppingCart,
    Target, Sparkles
} from 'lucide-react';
import './TradePanel.css';

interface Order {
    id: string;
    symbol: string;
    type: 'market' | 'limit';
    side: 'buy' | 'sell';
    price: number;
    quantity: number;
    total: number;
    timestamp: number;
    status: 'filled' | 'partial' | 'cancelled';
}

interface TradePanelProps {
    symbol: string;
    currentPrice: number;
}

export const TradePanel: React.FC<TradePanelProps> = ({ symbol, currentPrice }) => {
    const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
    const [side, setSide] = useState<'buy' | 'sell'>('buy');
    const [quantity, setQuantity] = useState<string>('');
    const [price, setPrice] = useState<string>('');
    const [total, setTotal] = useState<number>(0);
    const [orders, setOrders] = useState<Order[]>([]);
    const [showHistory, setShowHistory] = useState(false);

    useEffect(() => {
        const savedOrders = localStorage.getItem('tradeHistory');
        if (savedOrders) {
            try {
                setOrders(JSON.parse(savedOrders));
            } catch (e) {
                console.error('Ошибка загрузки истории:', e);
            }
        }
    }, []);

    useEffect(() => {
        const qty = parseFloat(quantity) || 0;
        if (orderType === 'market') {
            setTotal(qty * currentPrice);
        } else {
            const p = parseFloat(price) || 0;
            setTotal(qty * p);
        }
    }, [quantity, price, orderType, currentPrice]);

    const formatPrice = (value: number): string => {
        return value.toFixed(2);
    };

    const formatDate = (timestamp: number): string => {
        return new Date(timestamp).toLocaleString();
    };

    const createOrder = () => {
        const qty = parseFloat(quantity);
        if (!qty || qty <= 0) {
            alert('Введите корректное количество');
            return;
        }

        if (orderType === 'limit') {
            const p = parseFloat(price);
            if (!p || p <= 0) {
                alert('Введите корректную цену');
                return;
            }
        }

        const orderPrice = orderType === 'market' ? currentPrice : parseFloat(price);
        const newOrder: Order = {
            id: Date.now().toString(),
            symbol,
            type: orderType,
            side,
            price: orderPrice,
            quantity: qty,
            total: qty * orderPrice,
            timestamp: Date.now(),
            status: 'filled'
        };

        const updatedOrders = [newOrder, ...orders];
        setOrders(updatedOrders);
        localStorage.setItem('tradeHistory', JSON.stringify(updatedOrders));

        setQuantity('');
        setPrice('');
        setTotal(0);

        alert(`${side === 'buy' ? 'Покупка' : 'Продажа'} ${qty} ${symbol} выполнена!`);
    };

    const clearHistory = () => {
        if (confirm('Очистить историю ордеров?')) {
            setOrders([]);
            localStorage.removeItem('tradeHistory');
        }
    };

    return (
        <div className="trade-panel">
            <div className="trade-header">
                <Wallet size={16} />
                <h3>Торговля</h3>
                <span className="trade-symbol">{symbol}/USDT</span>
                <span className={`trade-price ${currentPrice >= 0 ? 'positive' : 'negative'}`}>
                    ${formatPrice(currentPrice)}
                </span>
            </div>

            <div className="trade-side-buttons">
                <button
                    className={`side-btn buy ${side === 'buy' ? 'active' : ''}`}
                    onClick={() => setSide('buy')}
                >
                    <TrendingUp size={14} /> Покупка
                </button>
                <button
                    className={`side-btn sell ${side === 'sell' ? 'active' : ''}`}
                    onClick={() => setSide('sell')}
                >
                    <TrendingDown size={14} /> Продажа
                </button>
            </div>

            <div className="trade-type-buttons">
                <button
                    className={`type-btn ${orderType === 'market' ? 'active' : ''}`}
                    onClick={() => setOrderType('market')}
                >
                    <Target size={12} /> Рыночный
                </button>
                <button
                    className={`type-btn ${orderType === 'limit' ? 'active' : ''}`}
                    onClick={() => setOrderType('limit')}
                >
                    <Sparkles size={12} /> Лимитный
                </button>
            </div>

            <div className="trade-fields">
                {orderType === 'limit' && (
                    <div className="trade-field">
                        <label>Цена (USDT)</label>
                        <NumericFormat
                            value={price}
                            onValueChange={(values) => {
                                const { value } = values;
                                setPrice(value);
                            }}
                            placeholder={currentPrice.toFixed(2)}
                            thousandSeparator=" "
                            decimalScale={2}
                            fixedDecimalScale={false}
                            allowNegative={false}
                            className="trade-input"
                        />
                    </div>
                )}

                <div className="trade-field">
                    <label>Количество ({symbol})</label>
                    <NumericFormat
                        value={quantity}
                        onValueChange={(values) => {
                            const { value } = values;
                            setQuantity(value);
                        }}
                        placeholder="0.00"
                        thousandSeparator=" "
                        decimalScale={3}
                        fixedDecimalScale={false}
                        allowNegative={false}
                        className="trade-input"
                    />
                </div>

                <div className="trade-field total-field">
                    <label>Итого (USDT)</label>
                    <NumericFormat
                        value={total}
                        displayType="text"
                        thousandSeparator=" "
                        decimalScale={2}
                        fixedDecimalScale={true}
                        prefix="$ "
                        className="total-value"
                    />
                </div>
            </div>

            <button
                className={`trade-action-btn ${side}`}
                onClick={createOrder}
            >
                {side === 'buy' ? (
                    <><ShoppingCart size={16} /> Купить {symbol}</>
                ) : (
                    <><ShoppingBag size={16} /> Продать {symbol}</>
                )}
            </button>

            <button
                className="history-toggle-btn"
                onClick={() => setShowHistory(!showHistory)}
            >
                <History size={14} />
                {showHistory ? ' Скрыть историю' : ' Показать историю'} ({orders.length})
            </button>

            {showHistory && (
                <div className="trade-history">
                    <div className="history-header">
                        <span>История ордеров</span>
                        {orders.length > 0 && (
                            <button className="clear-history-btn" onClick={clearHistory}>
                                <Trash2 size={12} /> Очистить
                            </button>
                        )}
                    </div>
                    <div className="history-list">
                        {orders.length === 0 ? (
                            <div className="history-empty">Нет ордеров</div>
                        ) : (
                            orders.map((order) => (
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
                                        <span className="history-time">{formatDate(order.timestamp)}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};