import React, { useEffect, useRef, useState } from 'react';

interface AnimatedPriceProps {
    value: number;
    formatFn: (v: number) => string;
    className?: string;
}

export const AnimatedPrice: React.FC<AnimatedPriceProps> = ({
    value,
    formatFn,
    className = ''
}) => {
    const [pulseClass, setPulseClass] = useState('');
    const prevRef = useRef(value);

    useEffect(() => {
        if (value > prevRef.current) {
            setPulseClass('anim-pulse-green');
        } else if (value < prevRef.current) {
            setPulseClass('anim-pulse-red');
        }
        prevRef.current = value;

        const timeout = setTimeout(() => setPulseClass(''), 500);
        return () => clearTimeout(timeout);
    }, [value]);

    return (
        <span className={`${pulseClass} ${className}`}>
            {formatFn(value)}
        </span>
    );
};