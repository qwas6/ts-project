import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import  type { HistoryItem } from '../../types';
import { COLORS, ALL_SYMBOLS } from '../../constants';
import './HistoryChart.css';

export const HistoryChart = React.memo(({ history }: { history: HistoryItem[] }) => {
    const [selected, setSelected] = useState<Set<string>>(new Set(['BTC', 'ETH']));

    const chartData = useMemo(() => {
        const map = new Map<string, any>();
        history.forEach(item => {
            if (!selected.has(item.symbol)) return;
            if (!map.has(item.time)) { 
                map.set(item.time, { time: item.time });
            }
            const entry = map.get(item.time);
            entry[item.symbol] = item.price;
        });
        return Array.from(map.values()).slice(-50);
    }, [history, selected]);

    return (
        <div className="history-chart">
            <h3>📊 Общий график </h3>
            <div className="symbol-buttons">
                {ALL_SYMBOLS.map(s => (
                    <button 
                        key={s} 
                        className={`sym-btn ${selected.has(s) ? 'active' : ''}`} 
                        onClick={() => {
                            const newSet = new Set(selected);
                            if (newSet.has(s)) {
                                newSet.delete(s);
                            } else {
                                newSet.add(s);
                            }
                            setSelected(newSet);
                        }}
                    >
                        {s}
                    </button>
                ))}
            </div>
            {history.length === 0 ? (
                <div className="chart-placeholder">⏳ Ожидание данных...</div>
            ) : (
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748b' }} interval="preserveStartEnd" />
                        <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fill: '#64748b' }} />
                        <Tooltip 
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        />
                        {ALL_SYMBOLS.map(s => selected.has(s) && (
                            <Line 
                                key={s} 
                                type="monotone" 
                                dataKey={s} 
                                stroke={COLORS[s]} 
                                strokeWidth={2} 
                                dot={false} 
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            )}
        </div>
    );
});