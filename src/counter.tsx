import React, { useState } from 'react';
import Button from './button';

const Counter: React.FC = () => {
  const [count, setCount] = useState<number>(0);

  return (
    <div className="counter-section">
      <h2>Счетчик</h2>
      <div className="counter-value">{count}</div>
      <div className="counter-buttons">
        <Button onClick={() => setCount(count + 1)} variant="primary">+</Button>
        <Button onClick={() => setCount(count - 1)} variant="primary">-</Button>
        <Button onClick={() => setCount(0)} variant="reset">Сброс</Button>
      </div>
    </div>
  );
};

export default Counter;