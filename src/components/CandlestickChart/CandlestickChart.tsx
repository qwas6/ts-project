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
            for (let entry of entries) {
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
        
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        canvas.width = dimensions.width;
        canvas.height = dimensions.height;
        
        ctx.fillStyle = '#0a0e17';
        ctx.fillRect(0, 0, dimensions.width, dimensions.height);
        
        const padding = { top: 15, right: 15, bottom: 40, left: 50 };
        const chartWidth = dimensions.width - padding.left - padding.right;
        const chartHeight = dimensions.height - padding.top - padding.bottom;
        
        if (chartWidth <= 0 || chartHeight <= 0) return;
        
        let minPrice = Infinity;
        let maxPrice = -Infinity;
        data.forEach((candle) => {
            if (candle.low < minPrice) minPrice = candle.low;
            if (candle.high > maxPrice) maxPrice = candle.high;
        });
        
        const pricePadding = (maxPrice - minPrice) * 0.05;
        minPrice -= pricePadding;
        maxPrice += pricePadding;
        
        const priceRange = maxPrice - minPrice;
        const priceToY = (price: number) => {
            return padding.top + chartHeight - ((price - minPrice) / priceRange) * chartHeight;
        };
        
        const gridLines = 7;
        

        const getDecimals = (price: number) => {
            const str = price.toString();
            if (str.includes('.')) {
                const decimals = str.split('.')[1].length;
                return Math.min(decimals, 4);
            }
            return 0;
        };
        
  
        let maxDecimals = 0;
        data.forEach((candle) => {
            maxDecimals = Math.max(maxDecimals, getDecimals(candle.close));
            maxDecimals = Math.max(maxDecimals, getDecimals(candle.high));
            maxDecimals = Math.max(maxDecimals, getDecimals(candle.low));
        });
        
        for (let i = 0; i <= gridLines; i++) {
            const y = padding.top + (chartHeight / gridLines) * i;
            
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(dimensions.width - padding.right, y);
            ctx.strokeStyle = 'rgba(255,255,255,0.05)';
            ctx.lineWidth = 0.5;
            ctx.stroke();
            
            const price = maxPrice - (priceRange / gridLines) * i;
            const formattedPrice = price.toFixed(maxDecimals);
            ctx.fillStyle = 'rgba(255,255,255,0.25)';
            ctx.font = '10px Inter, system-ui, sans-serif';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.fillText(formattedPrice, padding.left - 8, y);
        }
        
        const visibleData = data.slice(-100);
        const totalCandles = visibleData.length;
        const candleWidth = Math.max(Math.min((chartWidth / totalCandles) * 0.85, 10), 3);
        const spacing = Math.max((chartWidth / totalCandles) - candleWidth, 1.5);
        
        for (let i = 0; i < visibleData.length; i++) {
            const candle = visibleData[i];
            const x = padding.left + i * (candleWidth + spacing) + spacing / 2;
            const centerX = x + candleWidth / 2;
            const isGreen = candle.close >= candle.open;
            
            const openY = priceToY(candle.open);
            const closeY = priceToY(candle.close);
            const highY = priceToY(candle.high);
            const lowY = priceToY(candle.low);
            
            const bodyTop = Math.min(openY, closeY);
            const bodyBottom = Math.max(openY, closeY);
            const bodyHeight = Math.max(Math.abs(closeY - openY), 1);
            
            const greenColor = '#00c853';
            const redColor = '#ff1744';
            const bodyColor = isGreen ? greenColor : redColor;
            const wickColor = isGreen ? 'rgba(0, 200, 83, 0.4)' : 'rgba(255, 23, 68, 0.4)';
            
            ctx.beginPath();
            ctx.moveTo(centerX, highY);
            ctx.lineTo(centerX, bodyTop);
            ctx.strokeStyle = wickColor;
            ctx.lineWidth = 0.8;
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(centerX, bodyBottom);
            ctx.lineTo(centerX, lowY);
            ctx.strokeStyle = wickColor;
            ctx.lineWidth = 0.8;
            ctx.stroke();
            
            const bodyWidth = Math.max(candleWidth * 0.7, 2);
            ctx.fillStyle = bodyColor;
            ctx.fillRect(centerX - bodyWidth / 2, bodyTop, bodyWidth, bodyHeight);
            
            if (bodyHeight > 2) {
                const grad = ctx.createLinearGradient(0, bodyTop, 0, bodyBottom);
                if (isGreen) {
                    grad.addColorStop(0, 'rgba(255,255,255,0.08)');
                    grad.addColorStop(0.5, 'rgba(255,255,255,0)');
                    grad.addColorStop(1, 'rgba(0,0,0,0.05)');
                } else {
                    grad.addColorStop(0, 'rgba(255,255,255,0.08)');
                    grad.addColorStop(0.5, 'rgba(255,255,255,0)');
                    grad.addColorStop(1, 'rgba(0,0,0,0.05)');
                }
                ctx.fillStyle = grad;
                ctx.fillRect(centerX - bodyWidth / 2 + 1, bodyTop + 1, bodyWidth - 2, bodyHeight - 2);
            }
        }
        
        const step = Math.max(1, Math.floor(visibleData.length / 8));
        for (let i = 0; i < visibleData.length; i += step) {
            const x = padding.left + i * (candleWidth + spacing) + spacing / 2 + candleWidth / 2;
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.font = '9px Inter, system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            
            ctx.save();
            ctx.translate(x, dimensions.height - padding.bottom + 4);
            ctx.rotate(-0.3);
            ctx.fillText(visibleData[i].time, 0, 0);
            ctx.restore();
        }
        
        if (visibleData.length > 0) {
            const lastCandle = visibleData[visibleData.length - 1];
            const lastPrice = lastCandle.close;
            const lastY = priceToY(lastPrice);
            const isGreen = lastCandle.close >= lastCandle.open;
            
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(padding.left, lastY);
            ctx.lineTo(dimensions.width - padding.right, lastY);
            ctx.strokeStyle = isGreen ? 'rgba(0, 200, 83, 0.15)' : 'rgba(255, 23, 68, 0.15)';
            ctx.lineWidth = 0.5;
            ctx.stroke();
            ctx.setLineDash([]);
            
            const priceLabel = lastPrice.toFixed(maxDecimals);
            ctx.fillStyle = isGreen ? '#00c853' : '#ff1744';
            ctx.font = '11px Inter, system-ui, sans-serif';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'bottom';
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.shadowBlur = 8;
            ctx.fillText(priceLabel, dimensions.width - padding.right - 4, lastY - 6);
            ctx.shadowBlur = 0;
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