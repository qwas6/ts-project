import React, { useState, useEffect, useMemo } from 'react';
import { Toaster, toast } from 'react-hot-toast';

function App() {
    const [count, setCount] = useState(0);

    const doubleCount = useMemo(() => {
        return count * 2;
    }, [count]);

    useEffect(() => {
        if (count > 0) {
            toast(`Счетчик: ${count}`);
        }
    }, [count]);

    const handleClick = () => {
        setCount(count + 1);
    };

    return (
        <div style={{ textAlign: 'center', padding: '50px' }}>
            <Toaster />
            <h1>Счетчик: {count}</h1>
            <h2>Удвоенное значение: {doubleCount}</h2>
            <button onClick={handleClick} style={{ padding: '10px 20px' }}>
                +1
            </button>
        </div>
    );
}

export default App;