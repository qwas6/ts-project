import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Rocket, TrendingUp, TrendingDown } from 'lucide-react';
import './FuturesPanel.css';

interface FuturesPanelProps {
    symbol: string;
    currentPrice: number;
    walletBalance: number;
    leverage: number;
    onOpen: (symbol: string, side: 'long' | 'short', margin: number, entryPrice: number) => void;
}

export const FuturesPanel: React.FC<FuturesPanelProps> = ({
    symbol,
    currentPrice,
    walletBalance,
    leverage,
    onOpen
}) => {
    const [side, setSide] = useState<'long' | 'short'>('long');
    const [margin, setMargin] = useState('');

    const numericMargin = parseFloat(margin) || 0;
    const positionValue = numericMargin * leverage;
    const quantity = currentPrice > 0 ? positionValue / currentPrice : 0;
    const insufficient = numericMargin > walletBalance;

    const handleOpen = () => {
        if (numericMargin <= 0) {
            toast.error('Введите сумму маржи');
            return;
        }
        if (insufficient) {
            toast.error(`Недостаточно средств. Доступно: $${walletBalance.toFixed(2)}`);
            return;
        }
        onOpen(symbol, side, numericMargin, currentPrice);
        setMargin('');
    };

    return (
        <div className="futures-panel">
            <div className="futures-header">
                <Rocket size={16} />
                <h3>Фьючерсы</h3>
                <span className="futures-symbol-badge">{symbol}/USDT</span>
                <span className="futures-leverage-badge">×{leverage}</span>
            </div>

            <div className="futures-side-buttons">
                <button
                    className={`futures-side-btn long ${side === 'long' ? 'active' : ''}`}
                    onClick={() => setSide('long')}
                >
                    <TrendingUp size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                    LONG
                </button>
                <button
                    className={`futures-side-btn short ${side === 'short' ? 'active' : ''}`}
                    onClick={() => setSide('short')}
                >
                    <TrendingDown size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                    SHORT
                </button>
            </div>

            <div className="futures-field">
                <label className="futures-field-label">Маржа (USDT)</label>
                <input
                    className="futures-field-input"
                    type="number"
                    placeholder="0.00"
                    value={margin}
                    onChange={(e) => setMargin(e.target.value)}
                    min="0"
                    step="any"
                />
            </div>

            <div className="futures-info">
                <div className="futures-info-row">
                    <span className="futures-info-label">Цена входа</span>
                    <span className="futures-info-value">${currentPrice.toFixed(2)}</span>
                </div>
                <div className="futures-info-row">
                    <span className="futures-info-label">Размер позиции</span>
                    <span className="futures-info-value highlight">${positionValue.toFixed(2)}</span>
                </div>
                <div className="futures-info-row">
                    <span className="futures-info-label">Количество</span>
                    <span className="futures-info-value">{quantity.toFixed(6)} {symbol}</span>
                </div>
            </div>

            <button
                className={`futures-open-btn ${side}`}
                onClick={handleOpen}
                disabled={numericMargin <= 0 || insufficient}
            >
                Открыть {side === 'long' ? 'LONG' : 'SHORT'} ×{leverage}
            </button>

            <div className="futures-balance-hint">
                Доступно: ${walletBalance.toFixed(2)}
            </div>
        </div>
    );
};