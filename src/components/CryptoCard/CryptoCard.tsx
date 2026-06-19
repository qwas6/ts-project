import React, { useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { CandlestickChart } from '../CandlestickChart/CandlestickChart';
import { TIMEFRAME_CONFIG } from '../../constants';
import type  { ChartData, CandleData, Timeframe } from '../../types';
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
}

export const CryptoCard = React.memo(({
    symbol,
    price,
    change,
    history,
    candles,
    onRemove,
    timeframe,
    onTimeframeChange,
    isConnected
}: CryptoCardProps) => {
    const [showChart, setShowChart] = useState(false);
    const [chartType, setChartType] = useState<'line' | 'candle'>('candle');

    return (
        <div className="crypto-card">
            <div className="card-header">
                <div className="crypto-info">
                    <div className="crypto-title">
                        <h3>{symbol}</h3>
                        <span className={`status-dot ${isConnected ? 'connected' : 'connecting'}`} />
                    </div>
                    <p className={`price ${change >= 0 ? 'positive' : 'negative'}`}>
                        {formatPrice(price)}
                    </p>
                    <p className={`change ${change >= 0 ? 'positive' : 'negative'}`}>
                        {formatChange(change)}
                    </p>
                </div>
                <button className="remove-btn" onClick={onRemove}>✕</button>
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
                {showChart ? '📉 Скрыть график' : '📈 Показать график'}
            </button>
            
            {showChart && (
                <div className="chart-area">
                    <div className="chart-type-buttons">
                        <button 
                            className={`type-btn ${chartType === 'line' ? 'active' : ''}`} 
                            onClick={() => setChartType('line')}
                        >
                            📈 Линейный
                        </button>
                        <button 
                            className={`type-btn ${chartType === 'candle' ? 'active' : ''}`} 
                            onClick={() => setChartType('candle')}
                        >
                            📊 Свечной
                        </button>
                    </div>
                    
                    {chartType === 'line' && history.length > 0 && (
                        <ResponsiveContainer width="100%" height={350}>
                            <LineChart data={history}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis 
                                    dataKey="time" 
                                    tick={{ fontSize: 10, fill: '#64748b' }} 
                                    interval="preserveStartEnd" 
                                />
                                <YAxis 
                                    domain={['auto', 'auto']} 
                                    tick={{ fontSize: 10, fill: '#64748b' }} 
                                />
                                <Tooltip 
                                    contentStyle={{ 
                                        borderRadius: '8px', 
                                        border: 'none', 
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
                                    }}
                                   formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Цена']}
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
                    )}
                    
                    {chartType === 'candle' && <CandlestickChart data={candles} />}
                </div>
            )}
        </div>
    );
});