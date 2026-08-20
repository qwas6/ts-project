import React, { useRef, useState, useEffect } from 'react';
import type { CandleData } from '../../types';
import './CandlestickChart.css';

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
        
        // Фон
        const gradient = ctx.createLinearGradient(0, 0, 0, dimensions.height);
        gradient.addColorStop(0, '#0f1a2e');
        gradient.addColorStop(0.5, '#0d1628');
        gradient.addColorStop(1, '#0a1220');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, dimensions.width, dimensions.height);
        
        const padding = { top: 10, right: 10, bottom: 30, left: 45 };
        const chartWidth = dimensions.width - padding.left - padding.right;
        const chartHeight = dimensions.height - padding.top - padding.bottom;
        
        if (chartWidth <= 0 || chartHeight <= 0) return;

        let minPrice = Infinity;
        let maxPrice = -Infinity;
        data.forEach(candle => {
            minPrice = Math.min(minPrice, candle.low);
            maxPrice = Math.max(maxPrice, candle.high);
        });
        
        const pricePadding = (maxPrice - minPrice) * 0.05;
        minPrice -= pricePadding;
        maxPrice += pricePadding;
        
        const priceRange = maxPrice - minPrice;
        const priceToY = (price: number) => {
            return padding.top + chartHeight - ((price - minPrice) / priceRange) * chartHeight;
        };

        ctx.shadowColor = 'rgba(0,0,0,0)';
        ctx.shadowBlur = 0;
        
        const gridLines = 7;
        for (let i = 0; i <= gridLines; i++) {
            const y = padding.top + (chartHeight / gridLines) * i;
            
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(dimensions.width - padding.right, y);
            ctx.strokeStyle = 'rgba(255,255,255,0.06)';
            ctx.lineWidth = 0.5;
            ctx.stroke();
            
            const price = maxPrice - (priceRange / gridLines) * i;
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.font = '11px Inter, system-ui, sans-serif';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.shadowBlur = 4;
            ctx.fillText(`$${price.toFixed(0)}`, padding.left - 10, y);
            ctx.shadowBlur = 0;
        }
        

        const candleWidth = Math.max((chartWidth / data.length) * 0.75, 4);
        const candleSpacing = (chartWidth / data.length - candleWidth) / 2;
        const maxCandles = Math.min(data.length, 80);
        const startIndex = Math.max(0, data.length - maxCandles);
        const visibleData = data.slice(startIndex);
        
        visibleData.forEach((candle, i) => {
            const x = padding.left + (i * (candleWidth + candleSpacing * 2)) + candleSpacing;
            const centerX = x + candleWidth / 2;
            const isGreen = candle.close >= candle.open;
            
            const openY = priceToY(candle.open);
            const closeY = priceToY(candle.close);
            const highY = priceToY(candle.high);
            const lowY = priceToY(candle.low);
            
            const bodyTop = Math.min(openY, closeY);
            const bodyBottom = Math.max(openY, closeY);
            const bodyHeight = Math.max(Math.abs(closeY - openY), 1);
            
            const greenColor = '#00e676';
            const redColor = '#ff1744';
            const bodyColor = isGreen ? greenColor : redColor;
            const wickColor = isGreen ? 'rgba(0, 230, 118, 0.7)' : 'rgba(255, 23, 68, 0.7)';
            const glowColor = isGreen ? 'rgba(0, 230, 118, 0.25)' : 'rgba(255, 23, 68, 0.25)';
            
            ctx.shadowBlur = 0;
            ctx.lineWidth = 1.5;
            
          
            ctx.beginPath();
            ctx.moveTo(centerX, highY);
            ctx.lineTo(centerX, bodyTop);
            ctx.strokeStyle = wickColor;
            ctx.lineWidth = 1.5;
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = 5;
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(centerX, bodyBottom);
            ctx.lineTo(centerX, lowY);
            ctx.strokeStyle = wickColor;
            ctx.lineWidth = 1.5;
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = 5;
            ctx.stroke();
            
          
            const bodyWidth = Math.max(candleWidth * 0.75, 3);
            
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = 30;
            
            ctx.fillStyle = bodyColor;
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = 35;
            ctx.fillRect(centerX - bodyWidth / 2, bodyTop, bodyWidth, bodyHeight);
            
            ctx.shadowBlur = 0;
            ctx.strokeStyle = isGreen ? '#69f0ae' : '#ff5252';
            ctx.lineWidth = 1;
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = 10;
            ctx.strokeRect(centerX - bodyWidth / 2, bodyTop, bodyWidth, bodyHeight);
            
         
            if (bodyHeight > 5) {
                ctx.shadowBlur = 0;
                const grad = ctx.createLinearGradient(0, bodyTop, 0, bodyBottom);
                if (isGreen) {
                    grad.addColorStop(0, 'rgba(255,255,255,0.15)');
                    grad.addColorStop(0.5, 'rgba(255,255,255,0)');
                    grad.addColorStop(1, 'rgba(0,0,0,0.1)');
                } else {
                    grad.addColorStop(0, 'rgba(255,255,255,0.15)');
                    grad.addColorStop(0.5, 'rgba(255,255,255,0)');
                    grad.addColorStop(1, 'rgba(0,0,0,0.1)');
                }
                ctx.fillStyle = grad;
                ctx.fillRect(centerX - bodyWidth / 2 + 1, bodyTop + 1, bodyWidth - 2, bodyHeight - 2);
            }
        });
        

        ctx.shadowBlur = 0;
        const timeStep = Math.max(1, Math.floor(visibleData.length / 8));
        for (let i = 0; i < visibleData.length; i += timeStep) {
            const x = padding.left + (i * (candleWidth + candleSpacing * 2)) + candleSpacing + candleWidth / 2;
            
            ctx.shadowColor = 'rgba(0,0,0,0.8)';
            ctx.shadowBlur = 6;
            
            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            ctx.font = 'bold 10px Inter, system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            
            ctx.save();
            ctx.translate(x, dimensions.height - padding.bottom + 4);
            ctx.rotate(-0.3);
            
    
            const timeStr = visibleData[i].time;
            ctx.fillText(timeStr, 0, 0);
            ctx.restore();
        }
        ctx.shadowBlur = 0;
        
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