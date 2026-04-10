import React, { useState } from 'react';
import Button, { ButtonVariant } from './button';
import './App.css';

interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  stock: number;
  category: string;
}

type ProductCard = Pick<Product, 'id' | 'name' | 'price'>;

type OrderStatus = Record<'pending' | 'shipped' | 'delivered', string>;

const ShopPage: React.FC = () => {
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  
  const products: ProductCard[] = [
    { id: 1, name: 'Ноутбук', price: 50000 },
    { id: 2, name: 'Мышь', price: 1500 },
    { id: 3, name: 'Клавиатура', price: 3000 }
  ];

  const statuses: OrderStatus = {
    pending: ' Ожидает',
    shipped: ' В пути',
    delivered: ' Доставлен'
  };

  return (
    <div className="app">
      <h1> Интернет-магазин</h1>
      
      <div className="counter-section">
        <h2>Товары</h2>
        {products.map(product => (
          <div key={product.id} style={{ padding: '10px', borderBottom: '1px solid #ccc' }}>
            <strong>{product.name}</strong> - {product.price} ₽
            <Button onClick={() => setSelectedProduct(product.name)}>
              Выбрать
            </Button>
          </div>
        ))}
        {selectedProduct && <p>Выбран: {selectedProduct}</p>}
      </div>

      <div className="counter-section">
        <h2>Статусы заказа</h2>
        <p>Ожидает: {statuses.pending}</p>
        <p> В пути: {statuses.shipped}</p>
        <p> Доставлен: {statuses.delivered}</p>
      </div>
    </div>
  );
};

export default ShopPage;