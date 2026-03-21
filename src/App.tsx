import React, { useState } from 'react';
import './App.css';


interface TodoItemProps {
  todo: string;
  onDelete: (index: number) => void;
  index: number;
}

const TodoItem: React.FC<TodoItemProps> = ({ todo, onDelete, index }) => {
  return (
    <div className="todo-item">
      <span>{todo}</span>
      <button 
        onClick={() => onDelete(index)}
        className="btn-delete"
      >
        ✕
      </button>
    </div>
  );
};


const App: React.FC = () => {
  const [count, setCount] = useState<number>(0);
  const [todos, setTodos] = useState<string[]>([]);
  const [input, setInput] = useState<string>('');

  const addTodo = (): void => {
    if (input.trim()) {
      setTodos([...todos, input]);
      setInput('');
    }
  };

  const deleteTodo = (index: number): void => {
    setTodos(todos.filter((_, i) => i !== index));
  };

  return (
    <div className="app">
      <h1>TSX</h1>

      <div className="section">
        <h2>Счетчик</h2>
        <div className="counter">{count}</div>
        <div className="buttons">
          <button onClick={() => setCount(count + 1)} className="btn-primary">+</button>
          <button onClick={() => setCount(count - 1)} className="btn-primary">-</button>
          <button onClick={() => setCount(0)} className="btn-reset">Сброс</button>
        </div>
      </div>

      <div className="section">
        <h2>Список дел</h2>
        
        <div className="input-group">
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addTodo()}
            placeholder="Введите новую задачу..."
          />
          <button onClick={addTodo} className="btn-add">
            Добавить
          </button>
        </div>

        {todos.length > 0 ? (
          <div className="todo-list">
  
            {todos.map((todo, index) => (
              <TodoItem 
                key={index}
                todo={todo}
                index={index}
                onDelete={deleteTodo}
              />
            ))}
          </div>
        ) : (
          <p className="empty-message">Список дел пуст</p>
        )}
      </div>
    </div>
  );
};

export default App;