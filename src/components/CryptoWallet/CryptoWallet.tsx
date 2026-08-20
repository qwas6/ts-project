import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Wallet, Plus, TrendingUp, TrendingDown } from 'lucide-react';
import './CryptoWallet.css';

interface CryptoAsset {
    symbol: string;
    quantity: number;
    averagePrice: number;
}

interface CryptoWalletProps {
    walletBalance: number;
    onBuy: (symbol: string, quantity: number, price: number) => boolean;
    prices: Map<string, { price: number; change: number }>;
}

export const CryptoWallet: React.FC<CryptoWalletProps> = ({ 
    walletBalance, 
    onBuy,
    prices 
}) => {
    const [assets, setAssets] = useState<CryptoAsset[]>([]);
    const [selectedSymbol, setSelectedSymbol] = useState<string>('');
    const [buyQuantity, setBuyQuantity] = useState<string>('');
    const [showBuyModal, setShowBuyModal] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('cryptoAssets');
        if (saved) {
            try {
                setAssets(JSON.parse(saved));
            } catch (e) {
                console.error('Ошибка загрузки активов:', e);
            }
        }
    }, []);

    const saveAssets = (newAssets: CryptoAsset[]) => {
        localStorage.setItem('cryptoAssets', JSON.stringify(newAssets));
        setAssets(newAssets);
    };

    const handleBuy = () => {
        const qty = parseFloat(buyQuantity);
        if (!qty || qty <= 0) {
            toast.error('Введите корректное количество');
            return;
        }

        const priceData = prices.get(selectedSymbol);
        if (!priceData) {
            toast.error('Цена не найдена');
            return;
        }

        const totalCost = qty * priceData.price;
        if (totalCost > walletBalance) {
            toast.error(`Недостаточно средств! Нужно: $${totalCost.toFixed(2)}, Доступно: $${walletBalance.toFixed(2)}`);
            return;
        }

        const success = onBuy(selectedSymbol, qty, priceData.price);
        if (!success) return;

        const existingAsset = assets.find(a => a.symbol === selectedSymbol);
        let newAssets: CryptoAsset[];
        
        if (existingAsset) {
            const totalQuantity = existingAsset.quantity + qty;
            const totalCostNew = (existingAsset.quantity * existingAsset.averagePrice) + (qty * priceData.price);
            const newAveragePrice = totalCostNew / totalQuantity;
            
            newAssets = assets.map(a => 
                a.symbol === selectedSymbol 
                    ? { ...a, quantity: totalQuantity, averagePrice: newAveragePrice }
                    : a
            );
        } else {
            newAssets = [...assets, { 
                symbol: selectedSymbol, 
                quantity: qty, 
                averagePrice: priceData.price 
            }];
        }

        saveAssets(newAssets);
        setBuyQuantity('');
        setShowBuyModal(false);
        toast.success(`Куплено ${qty} ${selectedSymbol} за $${totalCost.toFixed(2)}!`);
    };

    const getCurrentPrice = (symbol: string): number => {
        return prices.get(symbol)?.price || 0;
    };

    const getChange = (symbol: string): number => {
        return prices.get(symbol)?.change || 0;
    };

    const getTotalValue = (): number => {
        return assets.reduce((total, asset) => {
            const price = getCurrentPrice(asset.symbol);
            return total + (asset.quantity * price);
        }, 0);
    };

    const getProfitLoss = (asset: CryptoAsset): number => {
        const currentPrice = getCurrentPrice(asset.symbol);
        return (currentPrice - asset.averagePrice) * asset.quantity;
    };

    const formatPrice = (value: number): string => {
        return value.toFixed(2);
    };

    return (
        <div className="crypto-wallet">
            <div className="crypto-wallet-header">
                <div className="crypto-wallet-title">
                    <Wallet size={18} />
                    <h3>Крипто-кошелек</h3>
                </div>
                <button 
                    className="add-crypto-btn"
                    onClick={() => setShowBuyModal(true)}
                >
                    <Plus size={16} /> Купить
                </button>
            </div>

            <div className="crypto-wallet-total">
                <span className="total-label">Общая стоимость</span>
                <span className="total-value">${formatPrice(getTotalValue())}</span>
            </div>

            <div className="crypto-wallet-list">
                {assets.length === 0 ? (
                    <div className="crypto-wallet-empty">
                        <p>Нет активов</p>
                        <p className="empty-hint">Купите криптовалюту для пополнения кошелька</p>
                    </div>
                ) : (
                    assets.map((asset) => {
                        const price = getCurrentPrice(asset.symbol);
                        const change = getChange(asset.symbol);
                        const profitLoss = getProfitLoss(asset);
                        const isPositive = profitLoss >= 0;

                        return (
                            <div key={asset.symbol} className="crypto-asset-item">
                                <div className="asset-info">
                                    <span className="asset-symbol">{asset.symbol}</span>
                                    <span className="asset-quantity">{asset.quantity.toFixed(3)}</span>
                                </div>
                                <div className="asset-price">
                                    <span className="asset-current-price">${formatPrice(price)}</span>
                                    <span className={`asset-change ${change >= 0 ? 'positive' : 'negative'}`}>
                                        {change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                        {Math.abs(change).toFixed(2)}%
                                    </span>
                                </div>
                                <div className="asset-profit">
                                    <span className={`profit ${isPositive ? 'positive' : 'negative'}`}>
                                        {isPositive ? '+' : ''}{formatPrice(profitLoss)}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {showBuyModal && (
                <div className="buy-modal-overlay" onClick={() => setShowBuyModal(false)}>
                    <div className="buy-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="buy-modal-header">
                            <h4>💰 Покупка криптовалюты</h4>
                            <button 
                                className="modal-close-btn"
                                onClick={() => setShowBuyModal(false)}
                            >
                                ✕
                            </button>
                        </div>
                        <div className="buy-modal-body">
                            <div className="buy-field">
                                <label>Выберите криптовалюту</label>
                                <select
                                    value={selectedSymbol}
                                    onChange={(e) => setSelectedSymbol(e.target.value)}
                                >
                                    <option value="">Выберите...</option>
                                    {Array.from(prices.keys()).map(symbol => (
                                        <option key={symbol} value={symbol}>
                                            {symbol} - ${formatPrice(prices.get(symbol)?.price || 0)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {selectedSymbol && (
                                <div className="buy-field">
                                    <label>Количество ({selectedSymbol})</label>
                                    <input
                                        type="number"
                                        value={buyQuantity}
                                        onChange={(e) => setBuyQuantity(e.target.value)}
                                        placeholder="0.00"
                                        min="0.001"
                                        step="0.001"
                                    />
                                    <div className="buy-price-info">
                                        <span>Цена: ${formatPrice(prices.get(selectedSymbol)?.price || 0)}</span>
                                        <span>Итого: ${formatPrice((parseFloat(buyQuantity) || 0) * (prices.get(selectedSymbol)?.price || 0))}</span>
                                    </div>
                                    <div className="buy-balance-info">
                                        Доступно: ${formatPrice(walletBalance)}
                                    </div>
                                </div>
                            )}

                            <button 
                                className="buy-confirm-btn"
                                onClick={handleBuy}
                                disabled={!selectedSymbol || !buyQuantity}
                            >
                                Купить {selectedSymbol || ''}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};