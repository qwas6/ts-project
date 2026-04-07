import React, { useState } from 'react';
import Counter from './counter';
import Button, { ButtonVariant } from './button';
import './App.css';

interface User {
  id: number;
  name: string;
  email: string;
  age: number;
}

type PartialUser = Partial<User>;

const App: React.FC = () => {
  const [output, setOutput] = useState<string>('');

  const user1: PartialUser = { name: 'Иван' };
  const user2: PartialUser = { email: 'ivan@mail.ru' };
  const user3: PartialUser = { name: 'Петр', age: 25 };

  return (
    <div className="app">
      <h1>Мое приложение</h1>
      <Counter />
      
      <div className="counter-section">
        <div style={{ background: '#2c3e50', color: 'white', padding: '15px', borderRadius: '8px', marginBottom: '15px', textAlign: 'center' }}>
          {output || 'Нажми кнопку'}
        </div>
        <div className="counter-buttons">
          <Button onClick={() => setOutput(`Имя: ${user1.name}`)} variant={ButtonVariant.Primary}>
            Имя
          </Button>
          <Button onClick={() => setOutput(`Email: ${user2.email}`)} variant={ButtonVariant.Primary}>
            Email
          </Button>
          <Button onClick={() => setOutput(`Имя: ${user3.name}, Возраст: ${user3.age}`)} variant={ButtonVariant.Primary}>
            Имя + Возраст
          </Button>
        </div>
      </div>
    </div>
  );
};

export default App;