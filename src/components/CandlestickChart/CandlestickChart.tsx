import React, { useRef, useState, useEffect } from 'react';
import type { CandleData } from '../../types';

export const CandlestickChart = React.memo(({ data }: { data: CandleData[] }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    useEffect(() => {
        if (!containerRef.current) return;
        
        const resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                const { width } = entry.contentRect;
                setDimensions({ width: width - 20, height: 350 });
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
        
        canvas.width = dimensions.width;
        canvas.height = dimensions.height;
        ctx.clearRect(0, 0, dimensions.width, dimensions.height);
        
        const padding = { top: 20, right: 40, bottom: 40, left: 45 };
        const chartWidth = dimensions.width - padding.left - padding.right;
        const chartHeight = dimensions.height - padding.top - padding.bottom;
        
        if (chartWidth <= 0 || chartHeight <= 0) return;
        
        let minPrice = Infinity;
        let maxPrice = -Infinity;
        data.forEach(candle => {
            minPrice = Math.min(minPrice, candle.low);
            maxPrice = Math.max(maxPrice, candle.high);
        });
        
        const priceRange = maxPrice - minPrice;
        const priceToY = (price: number) => {
            return padding.top + chartHeight - ((price - minPrice) / priceRange) * chartHeight;
        };
        
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 0.5;
        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px Inter, system-ui';
        
        const gridLines = 5;
        for (let i = 0; i <= gridLines; i++) {
            const y = padding.top + (chartHeight / gridLines) * i;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(dimensions.width - padding.right, y);
            ctx.stroke();
            
            const price = maxPrice - (priceRange / gridLines) * i;
            ctx.fillText(`$${price.toFixed(0)}`, 5, y + 3);
        }
        
        const candleWidth = Math.max(chartWidth / data.length - 2, 3);
        const candleSpacing = Math.max((chartWidth / data.length - candleWidth) / 2, 1);
        
        for (let i = 0; i < data.length; i++) {
            const candle = data[i];
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
            
            const bodyColor = isGreen ? '#22c55e' : '#ef4444';
            const wickColor = '#64748b';
            
            ctx.beginPath();
            ctx.moveTo(centerX, highY);
            ctx.lineTo(centerX, bodyTop);
            ctx.strokeStyle = wickColor;
            ctx.lineWidth = 1;
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(centerX, bodyBottom);
            ctx.lineTo(centerX, lowY);
            ctx.stroke();
            
            const bodyWidth = Math.max(candleWidth * 0.7, 2);
            ctx.fillStyle = bodyColor;
            ctx.fillRect(centerX - bodyWidth / 2, bodyTop, bodyWidth, bodyHeight);
        }
        
        for (let i = 0; i < data.length; i += Math.max(1, Math.floor(data.length / 8))) {
            const x = padding.left + (i * (candleWidth + candleSpacing * 2)) + candleSpacing + candleWidth / 2;
            ctx.fillStyle = '#94a3b8';
            ctx.font = '8px Inter, system-ui';
            ctx.save();
            ctx.translate(x, dimensions.height - padding.bottom + 12);
            ctx.rotate(-0.3);
            ctx.fillText(data[i].time, 0, 0);
            ctx.restore();
        }
    }, [data, dimensions]);

    if (!data || data.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '140px 20px', color: '#94a3b8', background: '#f8fafc', borderRadius: '12px' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>📊</div>
                <div>Ожидание свечных данных...</div>
            </div>
        );
    }

    return (
        <div ref={containerRef} style={{ width: '100%', height: '370px', background: '#f8fafc', borderRadius: '12px', padding: '10px' }}>
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
        </div>
    );
});