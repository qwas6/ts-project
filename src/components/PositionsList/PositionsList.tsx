import React from 'react';
import { X } from 'lucide-react';
import type { FuturesPosition } from '../../types';
import './PositionsList.css';

interface PositionsListProps {
    positions: FuturesPosition[];
    prices: Map<string, number>;
    onClose: (positionId: string, closePrice: number) => void;
}

export const PositionsList: React.FC<PositionsListProps> = ({
    positions,
    prices,
    onClose
}) => {
    const openPositions = positions.filter(p => p.status === 'open');

    return (
        <div className="positions-list">
            <div className="positions-header">
                <h3>📈 Открытые позиции</h3>
                <span className="positions-count">{openPositions.length}</span>
            </div>

            {openPositions.length === 0 ? (
                <div className="positions-empty">
                    Нет открытых позиций
                </div>
            ) : (
                <div className="positions-list-body">
                    {openPositions.map(position => {
                        const currentPrice = prices.get(position.symbol) || position.entryPrice;
                        const pnl = position.side === 'long'
                            ? (currentPrice - position.entryPrice) * position.quantity
                            : (position.entryPrice - currentPrice) * position.quantity;
                        const pnlPercent = (pnl / position.margin) * 100;
                        const isProfit = pnl >= 0;

                        return (
                            <div key={position.id} className={`position-card ${position.side}`}>
                                <div className="position-card-header">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <span className="position-symbol">{position.symbol}</span>
                                        <span className={`position-side-badge ${position.side}`}>
                                            {position.side}
                                        </span>
                                        <span className="position-leverage">×{position.leverage}</span>
                                    </div>
                                    <span className={`position-pnl ${isProfit ? 'positive' : 'negative'}`}>
                                        {isProfit ? '+' : ''}${pnl.toFixed(2)}
                                    </span>
                                </div>

                                <div className="position-row">
                                    <span className="position-label">Вход</span>
                                    <span className="position-value">${position.entryPrice.toFixed(2)}</span>
                                </div>
                                <div className="position-row">
                                    <span className="position-label">Сейчас</span>
                                    <span className="position-value">${currentPrice.toFixed(2)}</span>
                                </div>
                                <div className="position-row">
                                    <span className="position-label">Маржа</span>
                                    <span className="position-value">${position.margin.toFixed(2)}</span>
                                </div>
                                <div className="position-row">
                                    <span className="position-label">PnL %</span>
                                    <span className={`position-pnl ${isProfit ? 'positive' : 'negative'}`}>
                                        {isProfit ? '+' : ''}{pnlPercent.toFixed(2)}%
                                    </span>
                                </div>

                                <button
                                    className="position-close-btn"
                                    onClick={() => onClose(position.id, currentPrice)}
                                >
                                    <X size={11} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                                    Закрыть по ${currentPrice.toFixed(2)}
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};