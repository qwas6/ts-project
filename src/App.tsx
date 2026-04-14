class User {
    name: string;
    age: number;

    constructor(name: string, age: number) {
        this.name = name;
        this.age = age;
    }

    Hello() {
        console.log(`Привет, меня зовут ${this.name}`);
    }

    Age() {
        return this.age;
    }
}

const user = new User("Алексей", 25);
user.Hello();     
console.log(user.Age());   
console.log(user.name);