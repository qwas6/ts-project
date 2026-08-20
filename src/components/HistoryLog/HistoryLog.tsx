import React, { useRef, useEffect } from 'react';
import type { HistoryItem } from '../../types';
import { formatPrice } from '../../utils/helpers';
import './HistoryLog.css';

export const HistoryLog = React.memo(({ history }: { history: HistoryItem[] }) => {
    const logRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        if (logRef.current) {
            logRef.current.scrollTop = 0;
        }
    }, [history]);

    return (
        <div className="history-log">
            <h3>📋 История цен</h3>
            <div className="history-list" ref={logRef}>
                {history.length === 0 ? (
                    <div className="history-empty">⏳ Ожидание данных...</div>
                ) : (
                    history.map((item, i) => (
                        <div key={`${item.symbol}-${item.timestamp}-${i}`} className="history-item">
                            <span className="history-time">{item.time}</span>
                            <span className={`history-symbol ${item.symbol.toLowerCase()}`}>{item.symbol}</span>
                            <span className="history-price">{formatPrice(item.price)}</span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}); 