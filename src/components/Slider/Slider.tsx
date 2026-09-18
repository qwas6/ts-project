import React, { useRef, useState, useEffect, useCallback } from 'react';
import './Slider.css';

interface SliderProps {
    value: number;
    onChange: (value: number) => void;
    presets?: number[];
    min?: number;
    max?: number;
    step?: number;
}

export const Slider: React.FC<SliderProps> = ({
    value,
    onChange,
    presets = [1, 10, 20, 50, 100],
    min = 0,
    max = 100,
    step = 1
}) => {
    const trackRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const clamped = Math.min(Math.max(value, min), max);
    const percent = ((clamped - min) / (max - min)) * 100;

    const updateFromClientX = useCallback((clientX: number) => {
        const track = trackRef.current;
        if (!track) return;
        const rect = track.getBoundingClientRect();
        const ratio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
        const raw = min + ratio * (max - min);
        const stepped = Math.round(raw / step) * step;
        const final = Math.min(Math.max(stepped, min), max);
        onChange(final);
    }, [min, max, step, onChange]);

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
        updateFromClientX(e.clientX);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        setIsDragging(true);
        updateFromClientX(e.touches[0].clientX);
    };

    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            updateFromClientX(e.clientX);
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (e.touches[0]) updateFromClientX(e.touches[0].clientX);
        };

        const handleUp = () => {
            setIsDragging(false);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleUp);
        window.addEventListener('touchmove', handleTouchMove);
        window.addEventListener('touchend', handleUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleUp);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleUp);
        };
    }, [isDragging, updateFromClientX]);

    return (
        <div className="slider-wrapper">
            <div
                className="slider-track-container"
                ref={trackRef}
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
            >
                <div
                    className="slider-progress"
                    style={{ width: `${percent}%` }}
                />
                <div
                    className={`slider-thumb ${isDragging ? 'dragging' : ''}`}
                    style={{ left: `${percent}%` }}
                />
            </div>

            <div className="slider-percent-label">
                <span>0%</span>
                <span className="slider-percent-value">{Math.round(percent)}%</span>
                <span>100%</span>
            </div>

            <div className="slider-presets">
                {presets.map((p) => (
                    <button
                        key={p}
                        className={`slider-preset-btn ${Math.abs(clamped - p) < 0.5 ? 'active' : ''}`}
                        onClick={() => onChange(p)}
                        type="button"
                    >
                        {p}%
                    </button>
                ))}
            </div>
        </div>
    );
};