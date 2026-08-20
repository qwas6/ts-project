import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { toast } from 'react-hot-toast';
import { X, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import './OpenOrders.css';

interface OpenOrder {
    id: string;
    symbol: string;
    side: 'buy' | 'sell';
    type: 'limit';
    price: number;
    quantity: number;
    filled: number;
    total: number;
    timestamp: number;
    status: 'open' | 'partially_filled' | 'cancelled' | 'filled';
}

interface OpenOrdersProps {
    symbol: string;
    currentPrice: number;
    onOrderFilled?: (order: OpenOrder) => void;
}

export const OpenOrders = forwardRef<any, OpenOrdersProps>(({ 
    symbol, 
    currentPrice,
    onOrderFilled 
}, ref) => {
    const [orders, setOrders] = useState<OpenOrder[]>([]);

    const loadOrders = () => {
        const saved = localStorage.getItem('openOrders');
        if (saved) {
            try {
                setOrders(JSON.parse(saved));
            } catch (e) {
                console.error('Ошибка загрузки ордеров:', e);
            }
        }
    };

    useEffect(() => {
        loadOrders();
    }, []);

    const saveOrders = (newOrders: OpenOrder[]) => {
        localStorage.setItem('openOrders', JSON.stringify(newOrders));
        setOrders(newOrders);
    };

    const addLimitOrderInternal = (side: 'buy' | 'sell', price: number, quantity: number) => {
        const canExecute = side === 'buy' ? price >= currentPrice : price <= currentPrice;
        
        if (canExecute) {
            toast.success(`✅ Ордер исполнен моментально по цене $${currentPrice.toFixed(2)}`);
            if (onOrderFilled) {
                onOrderFilled({
                    id: Date.now().toString(),
                    symbol,
                    side,
                    type: 'limit',
                    price,
                    quantity,
                    filled: quantity,
                    total: quantity * currentPrice,
                    timestamp: Date.now(),
                    status: 'filled'
                });
            }
            loadOrders();
            return;
        }

        const newOrder: OpenOrder = {
            id: Date.now().toString(),
            symbol,
            side,
            type: 'limit',
            price,
            quantity,
            filled: 0,
            total: 0,
            timestamp: Date.now(),
            status: 'open'
        };

        const updatedOrders = [newOrder, ...orders];
        saveOrders(updatedOrders);
        toast.success(`📋 Лимитный ордер на ${side === 'buy' ? 'покупку' : 'продажу'} размещен по цене $${price.toFixed(2)}`);
    };

    useImperativeHandle(ref, () => ({
        addLimitOrder: (side: 'buy' | 'sell', price: number, quantity: number) => {
            addLimitOrderInternal(side, price, quantity);
        }
    }));

    const cancelOrder = (orderId: string) => {
        if (window.confirm('Отменить ордер?')) {
            const updatedOrders = orders.map(order => 
                order.id === orderId 
                    ? { ...order, status: 'cancelled' as const }
                    : order
            );
            saveOrders(updatedOrders);
            toast.success('❌ Ордер отменен');
        }
    };

    useEffect(() => {
        let hasChanges = false;
        const updatedOrders = orders.map(order => {
            if (order.status !== 'open' && order.status !== 'partially_filled') return order;
            
            const canExecute = order.side === 'buy' 
                ? currentPrice <= order.price 
                : currentPrice >= order.price;
            
            if (canExecute) {
                hasChanges = true;
                const filledOrder = {
                    ...order,
                    filled: order.quantity,
                    total: order.quantity * currentPrice,
                    status: 'filled' as const
                };
                toast.success(`✅ Ордер исполнен! ${order.side === 'buy' ? 'Покупка' : 'Продажа'} ${order.quantity} ${order.symbol} по $${currentPrice.toFixed(2)}`);
                if (onOrderFilled) onOrderFilled(filledOrder);
                return filledOrder;
            }
            return order;
        });

        if (hasChanges) {
            saveOrders(updatedOrders);
        }
    }, [currentPrice]);

    const formatPrice = (value: number): string => {
        return value.toFixed(2);
    };

    const formatDate = (timestamp: number): string => {
        return new Date(timestamp).toLocaleString();
    };

    const activeOrders = orders.filter(o => o.status === 'open' || o.status === 'partially_filled');
    const historyOrders = orders.filter(o => o.status === 'filled' || o.status === 'cancelled');

    return (
        <div className="open-orders">
            <div className="open-orders-header">
                <h3>📋 Открытые ордера</h3>
                <span className="orders-count">{activeOrders.length}</span>
            </div>

            {activeOrders.length === 0 ? (
                <div className="orders-empty">
                    <p>Нет открытых ордеров</p>
                    <p className="orders-hint">Лимитные ордера будут появляться здесь</p>
                </div>
            ) : (
                <div className="orders-list">
                    {activeOrders.map((order) => (
                        <div key={order.id} className={`order-item ${order.side}`}>
                            <div className="order-info">
                                <div className="order-header">
                                    <span className={`order-side ${order.side}`}>
                                        {order.side === 'buy' ? '🟢 Покупка' : '🔴 Продажа'}
                                    </span>
                                    <span className="order-status">
                                        <Clock size={12} /> Ожидает
                                    </span>
                                </div>
                                <div className="order-details">
                                    <span className="order-price">${formatPrice(order.price)}</span>
                                    <span className="order-qty">{order.quantity} {order.symbol}</span>
                                    <span className="order-total">${formatPrice(order.quantity * order.price)}</span>
                                </div>
                                <div className="order-time">{formatDate(order.timestamp)}</div>
                            </div>
                            <button 
                                className="cancel-order-btn"
                                onClick={() => cancelOrder(order.id)}
                            >
                                <X size={14} /> Отменить
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {historyOrders.length > 0 && (
                <div className="orders-history">
                    <div className="history-header">
                        <span>📜 История исполненных</span>
                        <button 
                            className="clear-history-btn"
                            onClick={() => {
                                if (window.confirm('Очистить историю ордеров?')) {
                                    const active = orders.filter(o => o.status === 'open' || o.status === 'partially_filled');
                                    saveOrders(active);
                                    toast.success('История очищена');
                                }
                            }}
                        >
                            Очистить
                        </button>
                    </div>
                    <div className="history-list">
                        {historyOrders.slice(0, 5).map((order) => (
                            <div key={order.id} className={`history-item ${order.status}`}>
                                <span className={`history-side ${order.side}`}>
                                    {order.side === 'buy' ? '🟢' : '🔴'}
                                </span>
                                <span className="history-price">${formatPrice(order.price)}</span>
                                <span className="history-qty">{order.quantity}</span>
                                <span className="history-status">
                                    {order.status === 'filled' ? 
                                        <CheckCircle size={12} color="#22c55e" /> : 
                                        <AlertCircle size={12} color="#ef4444" />
                                    }
                                </span>
                                <span className="history-time">{formatDate(order.timestamp)}</span>
                            </div>
                        ))}
                        {historyOrders.length > 5 && (
                            <div className="history-more">+ еще {historyOrders.length - 5}</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
});

OpenOrders.displayName = 'OpenOrders';