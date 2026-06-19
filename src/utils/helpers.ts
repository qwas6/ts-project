export const formatPrice = (price: number): string => {
    return `$${price.toLocaleString(undefined, { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
    })}`;
};

export const formatChange = (change: number): string => {
    return `${change >= 0 ? '▲' : '▼'} ${Math.abs(change).toFixed(2)}%`;
};