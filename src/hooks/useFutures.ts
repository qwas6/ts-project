import { useState, useEffect, useCallback } from 'react';
import type { FuturesPosition } from '../types';

const STORAGE_KEY = 'futuresPositions';
const LEVERAGE = 10;

export function useFutures() {
    const [positions, setPositions] = useState<FuturesPosition[]>(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return [];
        try {
            return JSON.parse(saved);
        } catch {
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
    }, [positions]);

    const openPosition = useCallback((
        symbol: string,
        side: 'long' | 'short',
        margin: number,
        entryPrice: number
    ): FuturesPosition | null => {
        if (margin <= 0 || entryPrice <= 0) return null;

        const positionValue = margin * LEVERAGE;
        const quantity = positionValue / entryPrice;

        const position: FuturesPosition = {
            id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
            symbol,
            side,
            entryPrice,
            quantity,
            leverage: LEVERAGE,
            margin,
            openedAt: Date.now(),
            status: 'open',
            closedAt: null,
            closePrice: null,
            realizedPnl: null
        };

        setPositions(prev => [position, ...prev]);
        return position;
    }, []);

    const closePosition = useCallback((
        positionId: string,
        closePrice: number
    ): FuturesPosition | null => {
        let closed: FuturesPosition | null = null;

        setPositions(prev => prev.map(p => {
            if (p.id !== positionId || p.status !== 'open') return p;

            const pnl = p.side === 'long'
                ? (closePrice - p.entryPrice) * p.quantity
                : (p.entryPrice - closePrice) * p.quantity;

            closed = {
                ...p,
                status: 'closed',
                closedAt: Date.now(),
                closePrice,
                realizedPnl: pnl
            };
            return closed;
        }));

        return closed;
    }, []);

    const openPositions = positions.filter(p => p.status === 'open');
    const closedPositions = positions.filter(p => p.status === 'closed');

    const calculatePnl = useCallback((position: FuturesPosition, currentPrice: number): number => {
        if (position.status === 'closed' && position.realizedPnl !== null) {
            return position.realizedPnl;
        }
        return position.side === 'long'
            ? (currentPrice - position.entryPrice) * position.quantity
            : (position.entryPrice - currentPrice) * position.quantity;
    }, []);

    const clearClosed = useCallback(() => {
        setPositions(prev => prev.filter(p => p.status === 'open'));
    }, []);

    return {
        positions,
        openPositions,
        closedPositions,
        openPosition,
        closePosition,
        calculatePnl,
        clearClosed,
        leverage: LEVERAGE
    };
}