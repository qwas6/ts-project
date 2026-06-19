import { useState, useEffect } from 'react';
import type { HistoryItem } from '../types';

export function useGlobalHistory(dataSources: Record<string, any>) {
    const [globalHistory, setGlobalHistory] = useState<HistoryItem[]>([]);

    useEffect(() => {
        const interval = setInterval(() => {
            const items: HistoryItem[] = [];
            
            Object.entries(dataSources).forEach(([symbol, data]) => {
                if (data.history && data.history.length > 0) {
                    const lastItem = data.history[data.history.length - 1];
                    items.push({
                        symbol,
                        price: lastItem.price,
                        time: lastItem.time,
                        timestamp: lastItem.timestamp
                    });
                }
            });
            
            setGlobalHistory(
                items
                    .sort((a, b) => b.timestamp - a.timestamp)
                    .slice(0, 50)
            );
        }, 500);
        
        return () => clearInterval(interval);
    }, [dataSources]);

    return globalHistory;
}