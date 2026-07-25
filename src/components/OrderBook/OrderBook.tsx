import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, TrendingUp, TrendingDown } from 'lucide-react';
import './OrderBook.css';

interface OrderBookLevel {
    price: number;
    quantity: number;
    total: number;
}

interface OrderBookData {
    bids: OrderBookLevel[];
    asks: OrderBookLevel[];
    lastUpdateId: number;
}

interface OrderBookProps {
    symbol: string;
}

export const OrderBook: React.FC<OrderBookProps> = ({ symbol }) => {
    const [orderBook, setOrderBook] = useState<OrderBookData>({ bids: [], asks: [], lastUpdateId: 0 });
    const [maxQuantity, setMaxQuantity] = useState(0);
    const [isConnected, setIsConnected] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);

    const getPriceDecimals = (symbol: string): number => {
        const decimals: Record<string, number> = {
            'BTC': 0,
            'ETH': 1,
            'BNB': 2,
            'SOL': 2,
            'DOGE': 4,
        };
        return decimals[symbol] || 2;
    };

    const formatPrice = (price: number, symbol: string): string => {
        const decimals = getPriceDecimals(symbol);
        return price.toFixed(decimals);
    };

    const formatWithK = (num: number): string => {
        if (num === 0) return '0';
        if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(2) + 'K';
        return num.toFixed(2);
    };

    const fetchOrderBook = async () => {
        try {
            const response = await fetch(
                `https://api.binance.com/api/v3/depth?symbol=${symbol}USDT&limit=10`
            );
            const data = await response.json();
            
            const bids = data.bids.map((item: string[]) => ({
                price: parseFloat(item[0]),
                quantity: parseFloat(item[1]),
                total: parseFloat(item[0]) * parseFloat(item[1])
            }));
            
            const asks = data.asks.map((item: string[]) => ({
                price: parseFloat(item[0]),
                quantity: parseFloat(item[1]),
                total: parseFloat(item[0]) * parseFloat(item[1])
            }));

            const allQuantities: number[] = [];
            if (Array.isArray(bids) && bids.length > 0) {
                bids.forEach((l: OrderBookLevel) => allQuantities.push(l.quantity || 0));
            }
            if (Array.isArray(asks) && asks.length > 0) {
                asks.forEach((l: OrderBookLevel) => allQuantities.push(l.quantity || 0));
            }
            allQuantities.push(0);
            const maxQty = Math.max(...allQuantities);
            setMaxQuantity(maxQty);
            
            const bidsSlice = bids.slice(0, 8);
            const asksSlice = asks.slice(0, 8);
            
            while (bidsSlice.length < 8) {
                bidsSlice.push({ price: 0, quantity: 0, total: 0 });
            }
            while (asksSlice.length < 8) {
                asksSlice.push({ price: 0, quantity: 0, total: 0 });
            }

            setOrderBook({
                bids: bidsSlice,
                asks: asksSlice,
                lastUpdateId: data.lastUpdateId
            });
        } catch (error) {
            console.error('Ошибка загрузки стакана:', error);
        }
    };

    useEffect(() => {
        if (!symbol) return;

        fetchOrderBook();

        const ws = new WebSocket(
            `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}usdt@depth10@100ms`
        );
        wsRef.current = ws;

        ws.onopen = () => {
            setIsConnected(true);
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.e === 'depthUpdate') {
                    setOrderBook(prev => {
                        const newBids = [...prev.bids];
                        const newAsks = [...prev.asks];

                        if (data.b) {
                            data.b.forEach((item: string[]) => {
                                const price = parseFloat(item[0]);
                                const quantity = parseFloat(item[1]);
                                const index = newBids.findIndex(b => b.price === price);
                                
                                if (quantity === 0) {
                                    if (index !== -1) newBids.splice(index, 1);
                                } else {
                                    const total = price * quantity;
                                    if (index !== -1) {
                                        newBids[index] = { price, quantity, total };
                                    } else {
                                        newBids.push({ price, quantity, total });
                                    }
                                }
                            });
                        }

                        if (data.a) {
                            data.a.forEach((item: string[]) => {
                                const price = parseFloat(item[0]);
                                const quantity = parseFloat(item[1]);
                                const index = newAsks.findIndex(a => a.price === price);
                                
                                if (quantity === 0) {
                                    if (index !== -1) newAsks.splice(index, 1);
                                } else {
                                    const total = price * quantity;
                                    if (index !== -1) {
                                        newAsks[index] = { price, quantity, total };
                                    } else {
                                        newAsks.push({ price, quantity, total });
                                    }
                                }
                            });
                        }

                        newBids.sort((a, b) => b.price - a.price);
                        newAsks.sort((a, b) => a.price - b.price);

                        const allQuantities: number[] = [];
                        if (Array.isArray(newBids) && newBids.length > 0) {
                            newBids.forEach((l: OrderBookLevel) => allQuantities.push(l.quantity || 0));
                        }
                        if (Array.isArray(newAsks) && newAsks.length > 0) {
                            newAsks.forEach((l: OrderBookLevel) => allQuantities.push(l.quantity || 0));
                        }
                        allQuantities.push(0);
                        const maxQty = Math.max(...allQuantities);
                        setMaxQuantity(maxQty);

                        let bidsSlice = newBids.slice(0, 8);
                        let asksSlice = newAsks.slice(0, 8);
                        
                        while (bidsSlice.length < 8) {
                            bidsSlice.push({ price: 0, quantity: 0, total: 0 });
                        }
                        while (asksSlice.length < 8) {
                            asksSlice.push({ price: 0, quantity: 0, total: 0 });
                        }

                        return {
                            bids: bidsSlice,
                            asks: asksSlice,
                            lastUpdateId: data.u
                        };
                    });
                }
            } catch (error) {
                console.error('Ошибка:', error);
            }
        };

        ws.onerror = () => setIsConnected(false);
        ws.onclose = () => setIsConnected(false);

        return () => {
            if (wsRef.current) wsRef.current.close();
        };
    }, [symbol]);

    return (
        <div className="order-book">
            <div className="order-book-header">
                <div className="header-left">
                    <BookOpen size={14} />
                    <span className="header-title">Стакан ордеров</span>
                </div>
                <div className="header-right">
                    <span className={`status-dot ${isConnected ? 'connected' : 'connecting'}`} />
                    <span className="symbol-title">{symbol}/USDT</span>
                </div>
            </div>
            
            <div className="order-book-table">
                <div className="order-book-header-row">
                    <span>Цена</span>
                    <span>Объем</span>
                    <span>Сумма</span>
                </div>
                
                <div className="order-book-section">
                    <div className="section-label">
                        <TrendingDown size={10} /> ПРОДАЖИ
                    </div>
                    <div className="order-book-asks">
                        {orderBook.asks.slice().reverse().map((level, index) => {
                            const depthPercent = maxQuantity > 0 && level.quantity > 0 ? (level.quantity / maxQuantity) * 100 : 0;
                            return (
                                <div key={`ask-${index}`} className="order-book-row ask">
                                    <div className="depth-bar ask-bar" style={{ width: `${depthPercent}%` }} />
                                    {level.price > 0 ? (
                                        <>
                                            <span className="price negative">{formatPrice(level.price, symbol)}</span>
                                            <span className="quantity">{formatWithK(level.quantity)}</span>
                                            <span className="total">{formatWithK(level.total)}</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="price empty">—</span>
                                            <span className="quantity empty">—</span>
                                            <span className="total empty">—</span>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
                
                <div className="order-book-section">
                    <div className="section-label">
                        <TrendingUp size={10} /> ПОКУПКИ
                    </div>
                    <div className="order-book-bids">
                        {orderBook.bids.map((level, index) => {
                            const depthPercent = maxQuantity > 0 && level.quantity > 0 ? (level.quantity / maxQuantity) * 100 : 0;
                            return (
                                <div key={`bid-${index}`} className="order-book-row bid">
                                    <div className="depth-bar bid-bar" style={{ width: `${depthPercent}%` }} />
                                    {level.price > 0 ? (
                                        <>
                                            <span className="price positive">{formatPrice(level.price, symbol)}</span>
                                            <span className="quantity">{formatWithK(level.quantity)}</span>
                                            <span className="total">{formatWithK(level.total)}</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="price empty">—</span>
                                            <span className="quantity empty">—</span>
                                            <span className="total empty">—</span>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};