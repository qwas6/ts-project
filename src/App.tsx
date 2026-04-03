import React from 'react';
import Counter from './counter';
import './App.css';

const App: React.FC = () => {
  return (
    <div className="app">
      <h1>Мое приложение</h1>
      <Counter />
    </div>
  );
};

export default App; 