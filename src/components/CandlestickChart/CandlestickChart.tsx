import React, { useRef, useState, useEffect } from 'react';
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
}

export const CandlestickChart = React.memo(({ data }: CandlestickChartProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

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

        const padding = { top: 15, right: 60, bottom: 40, left: 10 };
        const chartWidth = dimensions.width - padding.left - padding.right;
        const chartHeight = dimensions.height - padding.top - padding.bottom;

        if (chartWidth <= 0 || chartHeight <= 0) return;

        let minPrice = Infinity;
        let maxPrice = -Infinity;
        data.forEach((candle) => {
            if (candle.low < minPrice) minPrice = candle.low;
            if (candle.high > maxPrice) maxPrice = candle.high;
        });

        const pricePadding = (maxPrice - minPrice) * 0.08 || 1;
        minPrice -= pricePadding;
        maxPrice += pricePadding;

        const priceRange = maxPrice - minPrice;
        const priceToY = (price: number) => {
            return padding.top + chartHeight - ((price - minPrice) / priceRange) * chartHeight;
        };

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

        const visibleData = data.slice(-80);
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

 
        ctx.font = '11px Inter, system-ui, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
 
        const approxLabels = 6;
        const step = Math.max(1, Math.floor((totalCandles - 1) / (approxLabels - 1)));

        for (let i = 0; i < totalCandles; i += step) {
            const candle = visibleData[i];
            const x = padding.left + i * slotWidth + slotWidth / 2;
            ctx.fillText(candle.time, x, dimensions.height - padding.bottom + 12);
        }

        if (visibleData.length > 0) {
            const lastCandle = visibleData[visibleData.length - 1];
            const lastY = priceToY(lastCandle.close);
            const isGreen = lastCandle.close >= lastCandle.open;

            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(padding.left, lastY);
            ctx.lineTo(dimensions.width - padding.right, lastY);
            ctx.strokeStyle = isGreen ? 'rgba(0, 200, 83, 0.4)' : 'rgba(255, 23, 68, 0.4)';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.setLineDash([]);

            const label = lastCandle.close.toFixed(maxDecimals);
            ctx.font = 'bold 11px Inter, system-ui, sans-serif';
            const labelWidth = ctx.measureText(label).width + 12;
            const labelHeight = 18;
            const labelX = dimensions.width - padding.right + 2;
            const labelY = lastY - labelHeight / 2;

            ctx.fillStyle = isGreen ? '#00c853' : '#ff1744';
            ctx.beginPath();
            ctx.roundRect(labelX, labelY, labelWidth, labelHeight, 4);
            ctx.fill();

            ctx.fillStyle = '#0a0e17';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(label, labelX + labelWidth / 2, lastY);
        }

    }, [data, dimensions]);

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