import React, { useState, useEffect } from 'react';
import './App.css';
import { Toaster, toast } from 'react-hot-toast';

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
            throw new Error('Имя не должно превышать 32 символа');
        }
        this.name = name;
    }

    public setAge(age: number): void {
        if (age <= 0 || age >= 150) {
            throw new Error('Возраст должен быть от 1 до 150 лет');
        }
        this.age = age;
    }

    public setEmail(email: string): void {
        if (!email.includes('@') || !email.includes('.')) {
            throw new Error('Email должен содержать @ и .');
        }
        this.email = email;
    }

    public setAddress(address: Address): void {
        if (!address.city || !address.street) {
            throw new Error('Адрес должен содержать город и улицу');
        }
        this.address = address;
    }
}

const user = new User("", 0, "", { city: "", street: "" });

function useToastOnChange(value: any, message: string) {
    const [isFirstLoad, setIsFirstLoad] = useState(true);

    useEffect(() => {
        if (isFirstLoad) {
            setIsFirstLoad(false);
            return;
        }
        if (value) {
            toast.success(message);
        }
    }, [value]);
}

function App() {
    const [name, setName] = useState(user.getName());
    const [age, setAge] = useState(user.getAge());
    const [email, setEmail] = useState(user.getEmail());
    const [address, setAddress] = useState(user.getAddress());

    useToastOnChange(name, `Имя изменено на: ${name}`);
    useToastOnChange(age, `Возраст изменен на: ${age}`);
    useToastOnChange(email, `Email изменен на: ${email}`);
    useToastOnChange(address.city && address.street, `Адрес изменен на: ${address.city}, ${address.street}`);

    const handleChangeName = () => {
        const newName = prompt("Введите имя (max 32 символа):");
        if (newName) {
            try {
                user.setName(newName);
                setName(user.getName());
            } catch (err) {
                const error = err as Error;
                toast.error(error.message);
            }
        }
    };

    const handleChangeAge = () => {
        const newAge = prompt("Введите возраст (1-100):");
        if (newAge) {
            const ageNum = Number(newAge);
            try {
                user.setAge(ageNum);
                setAge(user.getAge());
            } catch (err) {
                const error = err as Error;
                toast.error(error.message);
            }
        }
    };

    const handleChangeEmail = () => {
        const newEmail = prompt("Введите email:");
        if (newEmail) {
            try {
                user.setEmail(newEmail);
                setEmail(user.getEmail());
            } catch (err) {
                const error = err as Error;
                toast.error(error.message);
            }
        }
    };

    const handleChangeAddress = () => {
        const newCity = prompt("Введите город:");
        const newStreet = prompt("Введите улицу:");
        if (newCity && newStreet) {
            try {
                user.setAddress({ city: newCity, street: newStreet });
                setAddress(user.getAddress());
            } catch (err) {
                const error = err as Error;
                toast.error(error.message);
            }
        }
    };

    return ( 
        <div className="app">
            <Toaster position="top-right" />
            <h2>Пользователь</h2>
            <p>Имя: {name || ""}</p>
            <p>Возраст: {age || ""}</p>
            <p>Email: {email || ""}</p>
            <p>Адрес: {address.city && address.street ? `${address.city}, ${address.street}` : ""}</p>
            <button onClick={handleChangeName}>Сменить имя</button>
            <button onClick={handleChangeAge}>Сменить возраст</button>
            <button onClick={handleChangeEmail}>Сменить email</button>
            <button onClick={handleChangeAddress}>Сменить адрес</button>
        </div>
    );
}

export default App;