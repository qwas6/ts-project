import React, { useState } from 'react';
import './App.css';

interface Address {
    city: string;
    street: string;
}

class User {
    private name: string;
    private age: number;
    private email: string;
    private address: Address;

    constructor(name: string, age: number, email: string, address: Address) {
        this.name = name;
        this.age = age;
        this.email = email;
        this.address = address;
    }

    public getName(): string {
        return this.name;
    }

    public getAge(): number {
        return this.age;
    }

    public getEmail(): string {
        return this.email;
    }

    public getAddress(): Address {
        return this.address;
    }

    public setName(name: string): void {
        if (name.length > 32) {
            this.name = name.slice(0, 32);
        } else {
            this.name = name;
        }
    }

    public setAge(age: number): void {
        if (age > 0 && age < 150) {
            this.age = age;
        }
    }

    public setEmail(email: string): void {
        if (email.includes('@') && email.includes('.')) {
            this.email = email;
        }
    }

    public setAddress(address: Address): void {
        if (address.city && address.street) {
            this.address = address;
        }
    }
}

const user = new User("Алексей", 25, "alex@mail.com", { city: "Москва", street: "Тверская" });

function App() {
    const [name, setName] = useState(user.getName());
    const [age, setAge] = useState(user.getAge());
    const [email, setEmail] = useState(user.getEmail());
    const [address, setAddress] = useState(user.getAddress());

    const handleChangeName = () => {
        const newName = prompt("Введите имя (max 32 символа):");
        if (newName) {
            user.setName(newName);
            setName(user.getName());
            if (newName.length > 32) {
                alert("Имя было обрезано до 32 символов");
            }
        }
    };

    const handleChangeAge = () => {
        const newAge = prompt("Введите возраст (1-100):");
        if (newAge) {
            const ageNum = Number(newAge);
            if (ageNum > 0 && ageNum < 101) {
                user.setAge(ageNum);
                setAge(user.getAge());
            } else {
                alert("Некорректный возраст");
            }
        }
    };

    const handleChangeEmail = () => {
        const newEmail = prompt("Введите email:");
        if (newEmail) {
            user.setEmail(newEmail);
            setEmail(user.getEmail());
            if (!newEmail.includes('@') || !newEmail.includes('.')) {
                alert("Email не обновлен - неверный формат");
            }
        }
    };

    const handleChangeAddress = () => {
        const newCity = prompt("Введите город:");
        const newStreet = prompt("Введите улицу:");
        if (newCity && newStreet) {
            user.setAddress({ city: newCity, street: newStreet });
            setAddress(user.getAddress());
        }
    };

    return (
        <div className="app">
            <h2>Пользователь</h2>
            <p>Имя: {name}</p>
            <p>Возраст: {age}</p>
            <p>Email: {email}</p>
            <p>Адрес: {address.city}, {address.street}</p>
            <button onClick={handleChangeName}>Сменить имя</button>
            <button onClick={handleChangeAge}>Сменить возраст</button>
            <button onClick={handleChangeEmail}>Сменить email</button>
            <button onClick={handleChangeAddress}>Сменить адрес</button>
        </div>
    );
}

export default App;