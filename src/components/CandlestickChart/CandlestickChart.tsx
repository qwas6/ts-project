import React, { useRef, useState, useEffect } from 'react';
import type { FuturesPosition } from '../../types';
import './CandlestickChart.css';

interface CandleData {
    time: string;
    open: number;
    high: number;
    low: number;
    close: number;
    timestamp: number;
    isClosed: boolean;
}

interface CandlestickChartProps {
    data: CandleData[];
    positions?: FuturesPosition[];
}

export const CandlestickChart = React.memo(({ data, positions = [] }: CandlestickChartProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const animationRef = useRef<number | null>(null);
    const startTimeRef = useRef<number>(0);
    const [tick, setTick] = useState(0);

    useEffect(() => {
        startTimeRef.current = performance.now();
        let lastTick = 0;
        const animate = () => {
            const elapsed = performance.now() - startTimeRef.current;
            if (elapsed < 800 && elapsed - lastTick > 30) {
                lastTick = elapsed;
                setTick(t => t + 1);
            }
            if (elapsed < 800) {
                animationRef.current = requestAnimationFrame(animate);
            }
        };
        animationRef.current = requestAnimationFrame(animate);
        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [positions.length]);

    useEffect(() => {
        if (!containerRef.current) return;
        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width } = entry.contentRect;
                setDimensions({ width: width - 20, height: 400 });
            }
        });
        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    useEffect(() => {
        if (!canvasRef.current || dimensions.width === 0 || dimensions.height === 0 || data.length === 0) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        canvas.width = dimensions.width * dpr;
        canvas.height = dimensions.height * dpr;
        canvas.style.width = `${dimensions.width}px`;
        canvas.style.height = `${dimensions.height}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        ctx.fillStyle = '#0a0e17';
        ctx.fillRect(0, 0, dimensions.width, dimensions.height);

        const padding = { top: 30, right: 70, bottom: 40, left: 10 };
        const chartWidth = dimensions.width - padding.left - padding.right;
        const chartHeight = dimensions.height - padding.top - padding.bottom;
        if (chartWidth <= 0 || chartHeight <= 0) return;

        let minPrice = Infinity;
        let maxPrice = -Infinity;
        data.forEach(c => {
            if (c.low < minPrice) minPrice = c.low;
            if (c.high > maxPrice) maxPrice = c.high;
        });

        const pricePadding = (maxPrice - minPrice) * 0.1 || 1;
        minPrice -= pricePadding;
        maxPrice += pricePadding;
        const priceRange = maxPrice - minPrice;
        const priceToY = (price: number) =>
            padding.top + chartHeight - ((price - minPrice) / priceRange) * chartHeight;

        let maxDecimals = 2;
        if (data.length > 0) {
            const samplePrice = data[data.length - 1].close;
            if (samplePrice < 1) maxDecimals = 4;
            else if (samplePrice < 10) maxDecimals = 3;
            else if (samplePrice < 1000) maxDecimals = 2;
            else maxDecimals = 0;
        }

        const gridLines = 6;
        ctx.font = '11px Inter, system-ui, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';

        for (let i = 0; i <= gridLines; i++) {
            const y = padding.top + (chartHeight / gridLines) * i;
            const price = maxPrice - (priceRange / gridLines) * i;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(dimensions.width - padding.right, y);
            ctx.strokeStyle = 'rgba(255,255,255,0.05)';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.fillText(price.toFixed(maxDecimals), dimensions.width - padding.right + 8, y);
        }

        const visibleStart = Math.max(0, data.length - 80);
        const visibleData = data.slice(visibleStart);
        const totalCandles = visibleData.length;
        const slotWidth = chartWidth / Math.max(totalCandles, 40);
        const candleWidth = Math.max(Math.min(slotWidth * 0.7, 12), 2);
        const spacing = slotWidth - candleWidth;

        for (let i = 0; i < visibleData.length; i++) {
            const candle = visibleData[i];
            const x = padding.left + i * slotWidth + spacing / 2;
            const centerX = x + candleWidth / 2;
            const isGreen = candle.close >= candle.open;
            const openY = priceToY(candle.open);
            const closeY = priceToY(candle.close);
            const highY = priceToY(candle.high);
            const lowY = priceToY(candle.low);
            const bodyTop = Math.min(openY, closeY);
            const bodyHeight = Math.max(Math.abs(closeY - openY), 1);
            const bodyColor = isGreen ? '#00c853' : '#ff1744';
            const wickColor = isGreen ? 'rgba(0, 200, 83, 0.5)' : 'rgba(255, 23, 68, 0.5)';

            ctx.beginPath();
            ctx.moveTo(centerX, highY);
            ctx.lineTo(centerX, lowY);
            ctx.strokeStyle = wickColor;
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.fillStyle = bodyColor;
            ctx.fillRect(centerX - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
        }

        const findCandleIndexByTime = (timestamp: number): number | null => {
            for (let i = visibleData.length - 1; i >= 0; i--) {
                if (visibleData[i].timestamp <= timestamp) {
                    return i;
                }
            }
            return null;
        };

        const getCandleX = (idx: number) => {
            return padding.left + idx * slotWidth + slotWidth / 2;
        };

        const drawnMarkers: { x: number; y: number }[] = [];

        const isOverlapping = (x: number, y: number) => {
            return drawnMarkers.some(m => Math.abs(m.x - x) < 14 && Math.abs(m.y - y) < 14);
        };

        const animElapsed = performance.now() - startTimeRef.current;
        const animProgress = Math.min(animElapsed / 500, 1);
        const animScale = animProgress < 1
            ? 0.4 + 0.85 * animProgress - 0.25 * Math.sin(animProgress * Math.PI)
            : 1;

        positions.forEach((position, index) => {
            const openIdx = findCandleIndexByTime(position.openedAt);
            if (openIdx !== null) {
                const candle = visibleData[openIdx];
                const x = getCandleX(openIdx);
                const baseSize = 8;

                let y: number;
                let color: string;
                let isUp: boolean;

                if (position.side === 'long') {
                    y = priceToY(candle.low) + baseSize + 6;
                    color = '#22c55e';
                    isUp = true;
                } else {
                    y = priceToY(candle.high) - baseSize - 6;
                    color = '#ef4444';
                    isUp = false;
                }

                if (!isOverlapping(x, y)) {
                    drawnMarkers.push({ x, y });

                    const size = baseSize * animScale;

                    ctx.beginPath();
                    if (isUp) {
                        ctx.moveTo(x, y - size);
                        ctx.lineTo(x - size, y + size);
                        ctx.lineTo(x + size, y + size);
                    } else {
                        ctx.moveTo(x, y + size);
                        ctx.lineTo(x - size, y - size);
                        ctx.lineTo(x + size, y - size);
                    }
                    ctx.closePath();
                    ctx.fillStyle = color;
                    ctx.fill();
                    ctx.strokeStyle = 'white';
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                }
            }

            if (position.status === 'closed' && position.closedAt) {
                const closeIdx = findCandleIndexByTime(position.closedAt);
                if (closeIdx !== null) {
                    const candle = visibleData[closeIdx];
                    const x = getCandleX(closeIdx);
                    const baseSize = 7;
                    const color = '#64748b';

                    let y: number;
                    if (position.side === 'long') {
                        y = priceToY(candle.high) - baseSize - 6;
                    } else {
                        y = priceToY(candle.low) + baseSize + 6;
                    }

                    if (!isOverlapping(x, y)) {
                        drawnMarkers.push({ x, y });

                        const size = baseSize * animScale;
                        const isUp = position.side === 'long';

                        ctx.beginPath();
                        if (isUp) {
                            ctx.moveTo(x, y + size);
                            ctx.lineTo(x - size, y - size);
                            ctx.lineTo(x + size, y - size);
                        } else {
                            ctx.moveTo(x, y - size);
                            ctx.lineTo(x - size, y + size);
                            ctx.lineTo(x + size, y + size);
                        }
                        ctx.closePath();
                        ctx.fillStyle = color;
                        ctx.fill();
                        ctx.strokeStyle = 'white';
                        ctx.lineWidth = 1.5;
                        ctx.stroke();

                        ctx.strokeStyle = 'white';
                        ctx.lineWidth = 1.5;
                        const cs = size * 0.45;
                        const crossCenterY = isUp ? y - cs * 0.8 : y + cs * 0.8;
                        ctx.beginPath();
                        ctx.moveTo(x - cs, crossCenterY - cs);
                        ctx.lineTo(x + cs, crossCenterY + cs);
                        ctx.stroke();
                        ctx.beginPath();
                        ctx.moveTo(x + cs, crossCenterY - cs);
                        ctx.lineTo(x - cs, crossCenterY + cs);
                        ctx.stroke();
                    }
                }
            }

            void index;
        });

        ctx.font = '10px Inter, system-ui, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        const labelStep = Math.max(1, Math.floor(totalCandles / 6));
        for (let i = 0; i < totalCandles; i += labelStep) {
            const x = padding.left + i * slotWidth + slotWidth / 2;
            ctx.fillText(visibleData[i].time, x, dimensions.height - padding.bottom + 12);
        }
        if (totalCandles > 0) {
            const lastIdx = totalCandles - 1;
            if (lastIdx % labelStep !== 0) {
                const x = padding.left + lastIdx * slotWidth + slotWidth / 2;
                ctx.fillText(visibleData[lastIdx].time, x, dimensions.height - padding.bottom + 12);
            }
        }

        if (visibleData.length > 0) {
            const lastCandle = visibleData[visibleData.length - 1];
            const y = priceToY(lastCandle.close);
            const isGreen = lastCandle.close >= lastCandle.open;

            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(dimensions.width - padding.right, y);
            ctx.strokeStyle = isGreen ? 'rgba(0, 200, 83, 0.3)' : 'rgba(255, 23, 68, 0.3)';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.setLineDash([]);

            const priceLabel = lastCandle.close.toFixed(maxDecimals);
            ctx.font = 'bold 11px Inter, system-ui, sans-serif';
            const labelWidth = ctx.measureText(priceLabel).width + 14;
            const labelHeight = 18;
            const labelX = dimensions.width - padding.right + 4;
            const labelY = y - labelHeight / 2;

            ctx.fillStyle = isGreen ? '#00c853' : '#ff1744';
            ctx.beginPath();
            ctx.roundRect(labelX, labelY, labelWidth, labelHeight, 4);
            ctx.fill();

            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(priceLabel, labelX + labelWidth / 2, y);
        }

    }, [data, dimensions, positions, tick]);

    if (!data || data.length === 0) {
        return (
            <div className="candlestick-empty">
                <div className="candlestick-empty-icon">📊</div>
                <div>Ожидание свечных данных...</div>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="candlestick-container">
            <canvas ref={canvasRef} className="candlestick-canvas" />
        </div>
    );
});