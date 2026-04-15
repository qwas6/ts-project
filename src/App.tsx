import React, { useState } from 'react';
import './App.css';

class User {
    private name: string;
    private age: number;

    constructor(name: string, age: number) {
        this.name = name;
        this.age = age;
    }

    public getName(): string {
        return this.name;
    }

    public getAge(): number {
        return this.age;
    }

    public setName(name: string): void {
        this.name = name;
    }

    public setAge(age: number): void {
        this.age = age;
    }
}

const user = new User("Алексей", 25);

function App() {
    const [name, setName] = useState(user.getName());
    const [age, setAge] = useState(user.getAge());

    const handleChangeName = () => {
        const newName = prompt("Введите новое имя:");
        if (newName) {
            user.setName(newName);
            setName(user.getName());
        }
    };

    const handleChangeAge = () => {
        const newAge = prompt("Введите новый возраст:");
        if (newAge) {
            user.setAge(Number(newAge));
            setAge(user.getAge());
        }
    };

    return (
           <div className="app">
            <h2>Пользователь</h2>
            <p>Имя: {name}</p>
            <p>Возраст: {age}</p>
            <button onClick={handleChangeName}>Сменить имя</button>
            <button onClick={handleChangeAge}>Сменить возраст</button>
        </div>
    );
}

export default App;