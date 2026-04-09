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

type PickedUser = Pick<User, 'name' | 'email'>; 

type OmittedUser = Omit<User, 'id'>;  

type RecordedUsers = Record<'user1' | 'user2', PickedUser>; 

const App: React.FC = () => {
  const [output, setOutput] = useState<string>('');

  const partialExample: PartialUser = { name: 'Иван' };
  const pickExample: PickedUser = { name: 'Анна', email: 'anna@mail.ru' };
  const omitExample: OmittedUser = { name: 'Петр', email: 'petr@mail.ru', age: 25 };
  const recordExample: RecordedUsers = {
    user1: { name: 'Мария', email: 'maria@mail.ru' },
    user2: { name: 'Сергей', email: 'sergey@mail.ru' }
  };

  return (
    <div className="app">
      <Counter />
      
      <div className="counter-section">
        <div className="counter-value" style={{ minHeight: '60px' }}>
          {output || 'Нажми на кнопку, чтобы увидеть результат'}
        </div>
        <div className="counter-buttons">
          <Button onClick={() => setOutput(`имя - ${partialExample.name}`)}>
              Кнопка 1
          </Button>
          <Button onClick={() => setOutput(`${pickExample.name}, ${pickExample.email}`)}>
            Кнопка 2
          </Button>
          <Button onClick={() => setOutput(`${omitExample.name}, ${omitExample.age} лет, ${omitExample.email}`)}>
            Кнопка 3
          </Button>
          <Button onClick={() => setOutput(`${recordExample.user1.name} и ${recordExample.user2.name}`)}>
            Кнопка 4
          </Button>
        </div>
      </div>
    </div>
  );
};

export default App;