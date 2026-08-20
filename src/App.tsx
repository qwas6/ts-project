import React, { useState, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { Rocket, Plus, BarChart3, Clock, BadgeDollarSign, Eye, EyeOff } from 'lucide-react';
import { CryptoCard } from './components/CryptoCard/CryptoCard';
import { HistoryLog } from './components/HistoryLog/HistoryLog';
import { HistoryChart } from './components/HistoryChart/HistoryChart';
import { useCryptoData } from './hooks/useCryptoData';
import { useGlobalHistory } from './hooks/useGlobalHistory';
import { CRYPTOS } from './constants';
import './App.css';

function App() {
    const [selected, setSelected] = useState<string[]>(['BTC', 'ETH', 'BNB']);
    const [walletBalance, setWalletBalance] = useState(1000);
    const [showBalance, setShowBalance] = useState(true);
    const [showDepositModal, setShowDepositModal] = useState(false);
    const [depositAmount, setDepositAmount] = useState<string>('');
    
    const btc = useCryptoData('BTC', '10s');
    const eth = useCryptoData('ETH', '10s');
    const bnb = useCryptoData('BNB', '10s');
    const sol = useCryptoData('SOL', '10s');
    const doge = useCryptoData('DOGE', '10s');
    
    const allData = { BTC: btc, ETH: eth, BNB: bnb, SOL: sol, DOGE: doge };
    const globalHistory = useGlobalHistory(allData);


    useEffect(() => {
        const saved = localStorage.getItem('walletBalance');
        if (saved) {
            try {
                setWalletBalance(parseFloat(saved));
            } catch (e) {
                console.error('Ошибка загрузки баланса:', e);
            }
        }
    }, []);

    const saveBalance = (newBalance: number) => {
        setWalletBalance(newBalance);
        localStorage.setItem('walletBalance', String(newBalance));
    };

    const handleDeposit = (amount: number) => {
        const newBalance = walletBalance + amount;
        saveBalance(newBalance);
        toast.success(`Баланс пополнен на $${amount.toFixed(2)}!`);
        setShowDepositModal(false);
    };

    const handleBuy = (symbol: string, quantity: number, price: number) => {
        const total = quantity * price;
        if (total > walletBalance) {
            toast.error(`Недостаточно средств! Нужно: $${total.toFixed(2)}, Доступно: $${walletBalance.toFixed(2)}`);
            return false;
        }
        saveBalance(walletBalance - total);
        return true;
    };

  
    const handleSell = (symbol: string, quantity: number, price: number) => {
        const total = quantity * price;
        saveBalance(walletBalance + total);
        return true;
    };

    const addCrypto = (symbol: string) => {
        if (!selected.includes(symbol)) {
            setSelected([...selected, symbol]);
            toast.success(`${symbol} добавлен`);
        } else {
            toast.error(`${symbol} уже в списке`);
        }
    };

    const removeCrypto = (symbol: string) => {
        setSelected(selected.filter(s => s !== symbol));
        toast.success(`${symbol} удален`);
    };

    const formatPrice = (value: number): string => {
        return value.toFixed(2);
    };

  
    const priceMap = new Map();
    Object.entries(allData).forEach(([symbol, data]) => {
        priceMap.set(symbol, { price: data.price, change: data.change });
    });

    return (
        <div className="app">
            <Toaster position="top-right" toastOptions={{ duration: 2000 }} />
            <div className="container">
                <header>
                    <div className="header-content">
                        <div className="header-left">
                            <h1>
                                <Rocket size={28} />
                                Crypto Live Tracker
                            </h1>
                        </div>
                        <div className="header-right">
                            <div className="wallet-header">
                                <BadgeDollarSign size={18} color="white" />
                                <span className="wallet-label">Баланс:</span>
                                <span className="wallet-amount">
                                    {showBalance ? `$${formatPrice(walletBalance)}` : '••••••'}
                                </span>
                                <div className="wallet-actions-header">
                                    <button 
                                        className="wallet-btn-small"
                                        onClick={() => setShowBalance(!showBalance)}
                                        title={showBalance ? 'Скрыть баланс' : 'Показать баланс'}
                                    >
                                        {showBalance ? <EyeOff size={14} color="white" /> : <Eye size={14} color="white" />}
                                    </button>
                                    <button 
                                        className="wallet-btn-small deposit-btn-header"
                                        onClick={() => setShowDepositModal(true)}
                                        title="Пополнить баланс"
                                    >
                                        <Plus size={14} color="white" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>
                
                <div className="add-crypto">
                    <select 
                        onChange={(e) => { 
                            if (e.target.value) {
                                addCrypto(e.target.value);
                                e.target.value = '';
                            }
                        }} 
                        defaultValue=""
                    >
                        <option value="" disabled>
                            <Plus size={14} /> Добавить криптовалюту
                        </option>
                        {CRYPTOS.filter(c => !selected.includes(c.symbol)).map(c => (
                            <option key={c.symbol} value={c.symbol}>
                                {c.name} ({c.symbol})
                            </option>
                        ))}
                    </select>
                </div>
                
                <div className="crypto-grid">
                    {selected.map(symbol => {
                        const data = allData[symbol as keyof typeof allData];
                        if (!data) return null;
                        return (
                            <CryptoCard
                                key={symbol}
                                symbol={symbol}
                                price={data.price}
                                change={data.change}
                                history={data.history}
                                candles={data.candles}
                                onRemove={() => removeCrypto(symbol)}
                                timeframe={data.timeframe}
                                onTimeframeChange={data.changeTimeframe}
                                isConnected={data.isConnected}
                                walletBalance={walletBalance}
                                onBuy={handleBuy}
                                onSell={handleSell}
                                prices={priceMap}
                            />
                        );
                    })}
                </div>
                
                {selected.length === 0 && (
                    <div className="empty-state">
                        <div className="empty-icon">📭</div>
                        <p>Нет отслеживаемых криптовалют</p>
                        <p className="empty-hint">Добавьте первую монету из списка выше</p>
                    </div>
                )}
                
                <div className="sidebar">
                    <HistoryLog history={globalHistory} />
                    <HistoryChart history={globalHistory} />
                </div>
            </div>

      
            {showDepositModal && (
                <div className="deposit-modal-overlay" onClick={() => setShowDepositModal(false)}>
                    <div className="deposit-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="deposit-modal-header">
                            <h4>
                                <BadgeDollarSign size={20} style={{ display: 'inline-block', marginRight: '8px' }} />
                                Пополнение баланса
                            </h4>
                            <button 
                                className="modal-close-btn"
                                onClick={() => setShowDepositModal(false)}
                            >
                                ✕
                            </button>
                        </div>
                        <div className="deposit-modal-body">
                            <div className="deposit-presets">
                                <button onClick={() => handleDeposit(100)}>+$100</button>
                                <button onClick={() => handleDeposit(500)}>+$500</button>
                                <button onClick={() => handleDeposit(1000)}>+$1000</button>
                                <button onClick={() => handleDeposit(5000)}>+$5000</button>
                                <button onClick={() => handleDeposit(10000)}>+$10000</button>
                            </div>
                            <div className="deposit-custom">
                                <label>Своя сумма</label>
                                <div className="deposit-custom-input">
                                    <input
                                        type="number"
                                        value={depositAmount}
                                        onChange={(e) => setDepositAmount(e.target.value)}
                                        placeholder="Введите сумму"
                                        min="1"
                                        step="1"
                                    />
                                    <button 
                                        className="deposit-custom-btn"
                                        onClick={() => {
                                            const amount = parseFloat(depositAmount);
                                            if (amount && amount > 0) {
                                                handleDeposit(amount);
                                            } else {
                                                toast.error('Введите корректную сумму');
                                            }
                                        }}
                                    >
                                        Пополнить
                                    </button>
                                </div>
                            </div>
                            <div className="deposit-current-balance">
                                Текущий баланс: <strong>${formatPrice(walletBalance)}</strong>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;