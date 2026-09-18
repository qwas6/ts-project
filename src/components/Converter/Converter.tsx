import React, { useState, useMemo, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { ArrowUpDown, Repeat, X } from 'lucide-react';
import { Slider } from '../Slider/Slider';
import './Converter.css';

interface Asset {
    symbol: string;
    quantity: number;
}

interface ConverterProps {
    isOpen: boolean;
    onClose: () => void;
    prices: Map<string, { price: number; change: number }>;
    walletBalance: number;
    assets: Asset[];
    onConvert: (
        fromSymbol: string,
        toSymbol: string,
        fromAmount: number,
        toAmount: number
    ) => boolean;
}

const ALL_CURRENCIES = ['USDT', 'BTC', 'ETH', 'BNB', 'SOL', 'DOGE'];

export const Converter: React.FC<ConverterProps> = ({
    isOpen,
    onClose,
    prices,
    walletBalance,
    assets,
    onConvert
}) => {
    const [fromSymbol, setFromSymbol] = useState('USDT');
    const [toSymbol, setToSymbol] = useState('BTC');
    const [fromAmount, setFromAmount] = useState('');

    useEffect(() => {
        if (!isOpen) {
            setFromAmount('');
        }
    }, [isOpen]);

    const getPriceInUsdt = (symbol: string): number => {
        if (symbol === 'USDT') return 1;
        return prices.get(symbol)?.price || 0;
    };

    const getAvailableBalance = (symbol: string): number => {
        if (symbol === 'USDT') return walletBalance;
        const asset = assets.find(a => a.symbol === symbol);
        return asset?.quantity || 0;
    };

    const availableFrom = getAvailableBalance(fromSymbol);
    const numericFrom = parseFloat(fromAmount) || 0;

    const percentFromBalance = useMemo(() => {
        if (availableFrom <= 0) return 0;
        const p = (numericFrom / availableFrom) * 100;
        return Math.min(Math.max(p, 0), 100);
    }, [numericFrom, availableFrom]);

    const toAmount = useMemo(() => {
        const amount = parseFloat(fromAmount) || 0;
        if (amount <= 0) return 0;
        const fromPrice = getPriceInUsdt(fromSymbol);
        const toPrice = getPriceInUsdt(toSymbol);
        if (fromPrice <= 0 || toPrice <= 0) return 0;
        return (amount * fromPrice) / toPrice;
    }, [fromAmount, fromSymbol, toSymbol, prices]);

    const rate = useMemo(() => {
        const fromPrice = getPriceInUsdt(fromSymbol);
        const toPrice = getPriceInUsdt(toSymbol);
        if (fromPrice <= 0 || toPrice <= 0) return 0;
        return fromPrice / toPrice;
    }, [fromSymbol, toSymbol, prices]);

    const insufficient = numericFrom > availableFrom;

    const handleSliderChange = (percent: number) => {
        if (availableFrom <= 0) {
            toast.error(`Нет доступного баланса ${fromSymbol}`);
            return;
        }
        const amount = (percent / 100) * availableFrom;
        const decimals = fromSymbol === 'USDT' ? 2 : 6;
        setFromAmount(amount.toFixed(decimals));
    };

    const handleSwap = () => {
        setFromSymbol(toSymbol);
        setToSymbol(fromSymbol);
    };

    const handleSubmit = () => {
        if (numericFrom <= 0) {
            toast.error('Введите сумму');
            return;
        }
        if (fromSymbol === toSymbol) {
            toast.error('Выберите разные валюты');
            return;
        }
        if (insufficient) {
            toast.error(`Недостаточно ${fromSymbol}. Доступно: ${availableFrom}`);
            return;
        }

        const success = onConvert(fromSymbol, toSymbol, numericFrom, toAmount);
        if (success) {
            setFromAmount('');
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="converter-overlay" onClick={onClose}>
            <div className="converter-modal" onClick={(e) => e.stopPropagation()}>
                <div className="converter-header">
                    <h3>
                        <Repeat size={20} />
                        Конвертация валют
                    </h3>
                    <button
                        className="converter-close"
                        onClick={onClose}
                        title="Закрыть"
                    >
                        <X size={18} color="white" />
                    </button>
                </div>

                <div className="converter-field">
                    <label className="converter-field-label">Отдаю</label>
                    <div className="converter-field-row">
                        <input
                            className="converter-amount"
                            type="number"
                            placeholder="0.00"
                            value={fromAmount}
                            onChange={(e) => setFromAmount(e.target.value)}
                            min="0"
                            step="any"
                        />
                        <select
                            className="converter-select"
                            value={fromSymbol}
                            onChange={(e) => setFromSymbol(e.target.value)}
                        >
                            {ALL_CURRENCIES.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>
                    <div className="converter-balance-info">
                        <span>Доступно</span>
                        <strong>{availableFrom.toFixed(fromSymbol === 'USDT' ? 2 : 6)} {fromSymbol}</strong>
                    </div>
                </div>

                <Slider
                    value={percentFromBalance}
                    onChange={handleSliderChange}
                    presets={[1, 10, 20, 50, 100]}
                />

                <div className="converter-swap">
                    <button
                        className="converter-swap-btn"
                        onClick={handleSwap}
                        title="Поменять валюты местами"
                    >
                        <ArrowUpDown size={22} color="white" />
                    </button>
                </div>

                <div className="converter-field">
                    <label className="converter-field-label">Получаю</label>
                    <div className="converter-field-row">
                        <input
                            className="converter-amount"
                            type="text"
                            value={toAmount > 0 ? toAmount.toFixed(toSymbol === 'USDT' ? 2 : 6) : ''}
                            placeholder="0.00"
                            readOnly
                        />
                        <select
                            className="converter-select"
                            value={toSymbol}
                            onChange={(e) => setToSymbol(e.target.value)}
                        >
                            {ALL_CURRENCIES.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="converter-rate">
                    1 {fromSymbol} = {rate > 0 ? rate.toFixed(6) : '—'} {toSymbol}
                </div>

                {insufficient && (
                    <div className="converter-error">
                        Недостаточно средств. Доступно: {availableFrom.toFixed(6)} {fromSymbol}
                    </div>
                )}

                <button
                    className="converter-submit"
                    onClick={handleSubmit}
                    disabled={numericFrom <= 0 || insufficient || fromSymbol === toSymbol}
                >
                    Конвертировать
                </button>
            </div>
        </div>
    );
};