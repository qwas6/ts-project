import React, { useState, useMemo, useEffect } from 'react';
import { Calculator, X } from 'lucide-react';
import './ProfitCalculator.css';

interface Asset {
    symbol: string;
    quantity: number;
    averagePrice: number;
}

interface ProfitCalculatorProps {
    isOpen: boolean;
    onClose: () => void;
    assets: Asset[];
    prices: Map<string, { price: number; change: number }>;
}

const formatMoney = (n: number): string => {
    const sign = n < 0 ? '-' : '';
    const abs = Math.abs(n);
    return `${sign}$${abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const ProfitCalculator: React.FC<ProfitCalculatorProps> = ({
    isOpen,
    onClose,
    assets,
    prices
}) => {
    const [selectedSymbol, setSelectedSymbol] = useState<string>('');
    const [targetPrice, setTargetPrice] = useState<string>('');

    useEffect(() => {
        if (isOpen && assets.length > 0 && !selectedSymbol) {
            setSelectedSymbol(assets[0].symbol);
        }
    }, [isOpen, assets, selectedSymbol]);

    useEffect(() => {
        if (!isOpen) {
            setTargetPrice('');
        }
    }, [isOpen]);

    const asset = assets.find(a => a.symbol === selectedSymbol);
    const currentPrice = selectedSymbol ? (prices.get(selectedSymbol)?.price || 0) : 0;
    const currentValue = asset ? asset.quantity * currentPrice : 0;
    const costBasis = asset ? asset.quantity * asset.averagePrice : 0;

    const numericTarget = parseFloat(targetPrice) || 0;

    const result = useMemo(() => {
        if (!asset || numericTarget <= 0 || currentPrice <= 0) {
            return { value: 0, profit: 0, percent: 0, futureValue: 0 };
        }
        const futureValue = asset.quantity * numericTarget;
        const profit = futureValue - costBasis;
        const percent = costBasis > 0 ? (profit / costBasis) * 100 : 0;
        return { value: numericTarget, profit, percent, futureValue };
    }, [asset, numericTarget, currentPrice, costBasis]);

    const presets = useMemo(() => {
        if (currentPrice <= 0) return [10000, 50000, 100000, 200000];
        return [
            currentPrice * 1.1,
            currentPrice * 1.5,
            currentPrice * 2,
            currentPrice * 5
        ].map(p => Math.round(p));
    }, [currentPrice]);

    if (!isOpen) return null;

    const isProfit = result.profit >= 0;

    return (
        <div className="profit-calc-overlay" onClick={onClose}>
            <div className="profit-calc-modal" onClick={(e) => e.stopPropagation()}>
                <div className="profit-calc-header">
                    <h3>
                        <Calculator size={20} />
                        Калькулятор прибыли
                    </h3>
                    <button className="profit-calc-close" onClick={onClose}>
                        <X size={18} color="white" />
                    </button>
                </div>

                {assets.length === 0 ? (
                    <div className="profit-calc-empty">
                        У вас пока нет активов в кошельке.
                        <br />
                        Купите криптовалюту, чтобы рассчитать потенциальную прибыль.
                    </div>
                ) : (
                    <>
                        <div className="profit-calc-field">
                            <label className="profit-calc-field-label">Монета</label>
                            <div className="profit-calc-row">
                                <select
                                    className="profit-calc-select"
                                    value={selectedSymbol}
                                    onChange={(e) => setSelectedSymbol(e.target.value)}
                                    style={{ flex: 1 }}
                                >
                                    {assets.map(a => (
                                        <option key={a.symbol} value={a.symbol}>
                                            {a.symbol} — {a.quantity.toFixed(4)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="profit-calc-stats">
                            <div className="profit-calc-stat">
                                <div className="profit-calc-stat-label">Количество</div>
                                <div className="profit-calc-stat-value">
                                    {asset?.quantity.toFixed(4) || '0'}
                                </div>
                            </div>
                            <div className="profit-calc-stat">
                                <div className="profit-calc-stat-label">Средняя цена</div>
                                <div className="profit-calc-stat-value">
                                    ${asset?.averagePrice.toFixed(2) || '0'}
                                </div>
                            </div>
                            <div className="profit-calc-stat">
                                <div className="profit-calc-stat-label">Текущая цена</div>
                                <div className="profit-calc-stat-value">
                                    ${currentPrice.toFixed(2)}
                                </div>
                            </div>
                            <div className="profit-calc-stat">
                                <div className="profit-calc-stat-label">Сейчас стоит</div>
                                <div className="profit-calc-stat-value">
                                    {formatMoney(currentValue)}
                                </div>
                            </div>
                        </div>

                        <div className="profit-calc-field">
                            <label className="profit-calc-field-label">Целевая цена</label>
                            <div className="profit-calc-row">
                                <input
                                    className="profit-calc-input"
                                    type="number"
                                    placeholder={`Например, ${Math.round(currentPrice * 2)}`}
                                    value={targetPrice}
                                    onChange={(e) => setTargetPrice(e.target.value)}
                                    min="0"
                                    step="any"
                                />
                                <span style={{ fontWeight: 700, opacity: 0.5 }}>USD</span>
                            </div>
                            <div className="profit-calc-presets">
                                {presets.map(p => (
                                    <button
                                        key={p}
                                        className={`profit-calc-preset ${numericTarget === p ? 'active' : ''}`}
                                        onClick={() => setTargetPrice(String(p))}
                                    >
                                        ${p.toLocaleString()}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {numericTarget > 0 && (
                            <div className={`profit-calc-result ${isProfit ? '' : 'loss'}`}>
                                <div className="profit-calc-result-label">
                                    {isProfit ? 'Вы заработаете' : 'Вы потеряете'}
                                </div>
                                <div className="profit-calc-result-value">
                                    {isProfit ? '+' : ''}{formatMoney(result.profit)}
                                </div>
                                <div className="profit-calc-result-percent">
                                    {isProfit ? '+' : ''}{result.percent.toFixed(2)}%
                                </div>
                            </div>
                        )}

                        <div className="profit-calc-hint">
                            Если {selectedSymbol} достигнет ${numericTarget.toLocaleString()}, стоимость вашего портфеля составит {formatMoney(result.futureValue)}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};