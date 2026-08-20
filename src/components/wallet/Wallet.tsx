import React, { useState, useEffect } from 'react';
import { Plus, RotateCcw, Eye, EyeOff, DollarSign, History } from 'lucide-react';
import './Wallet.css';

interface WalletData {
    balance: number;
    totalDeposited: number;
    transactions: Transaction[];
}

interface Transaction {
    id: string;
    type: 'deposit' | 'buy' | 'sell';
    amount: number;
    price?: number;
    symbol?: string;
    timestamp: number;
    description: string;
}

interface WalletProps {
    onBalanceChange?: (balance: number) => void;
}

export const Wallet: React.FC<WalletProps> = ({ onBalanceChange }) => {
    const [walletData, setWalletData] = useState<WalletData>({
        balance: 1000,
        totalDeposited: 1000,
        transactions: []
    });
    const [showBalance, setShowBalance] = useState(true);
    const [showDepositModal, setShowDepositModal] = useState(false);
    const [depositAmount, setDepositAmount] = useState<string>('');
    const [showHistory, setShowHistory] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('walletData');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setWalletData(parsed);
                if (onBalanceChange) onBalanceChange(parsed.balance);
            } catch (e) {
                console.error('Ошибка загрузки кошелька:', e);
            }
        }
    }, []);

   
    const saveWalletData = (data: WalletData) => {
        localStorage.setItem('walletData', JSON.stringify(data));
        setWalletData(data);
        if (onBalanceChange) onBalanceChange(data.balance);
    };

   
    const handleDeposit = () => {
        const amount = parseFloat(depositAmount);
        if (!amount || amount <= 0) {
            alert('Введите корректную сумму');
            return;
        }

        const newTransaction: Transaction = {
            id: Date.now().toString(),
            type: 'deposit',
            amount: amount,
            timestamp: Date.now(),
            description: `Пополнение баланса на $${amount.toFixed(2)}`
        };

        const newData = {
            ...walletData,
            balance: walletData.balance + amount,
            totalDeposited: walletData.totalDeposited + amount,
            transactions: [newTransaction, ...walletData.transactions]
        };

        saveWalletData(newData);
        setDepositAmount('');
        setShowDepositModal(false);
        alert(`Баланс пополнен на $${amount.toFixed(2)}!`);
    };

    
    const resetWallet = () => {
        if (confirm('Вы уверены, что хотите сбросить все данные кошелька?')) {
            const resetData: WalletData = {
                balance: 1000,
                totalDeposited: 1000,
                transactions: []
            };
            saveWalletData(resetData);
            alert('Данные кошелька сброшены!');
        }
    };

  
    const formatPrice = (value: number): string => {
        return value.toFixed(2);
    };


    const formatDate = (timestamp: number): string => {
        return new Date(timestamp).toLocaleString();
    };

  
    const hasSufficientFunds = (amount: number): boolean => {
        return walletData.balance >= amount;
    };

    
    const buyCrypto = (symbol: string, quantity: number, price: number) => {
        const total = quantity * price;
        if (!hasSufficientFunds(total)) {
            alert(`Недостаточно средств! Баланс: $${formatPrice(walletData.balance)}`);
            return false;
        }

        const transaction: Transaction = {
            id: Date.now().toString(),
            type: 'buy',
            amount: total,
            price: price,
            symbol: symbol,
            timestamp: Date.now(),
            description: `Покупка ${quantity} ${symbol} по $${price.toFixed(2)}`
        };

        const newData = {
            ...walletData,
            balance: walletData.balance - total,
            transactions: [transaction, ...walletData.transactions]
        };

        saveWalletData(newData);
        return true;
    };


    const sellCrypto = (symbol: string, quantity: number, price: number) => {
        const total = quantity * price;
        const transaction: Transaction = {
            id: Date.now().toString(),
            type: 'sell',
            amount: total,
            price: price,
            symbol: symbol,
            timestamp: Date.now(),
            description: `Продажа ${quantity} ${symbol} по $${price.toFixed(2)}`
        };

        const newData = {
            ...walletData,
            balance: walletData.balance + total,
            transactions: [transaction, ...walletData.transactions]
        };

        saveWalletData(newData);
        return true;
    };

    return (
        <div className="wallet-container">
            <div className="wallet-header">
                <div className="wallet-title">
                    <h3>Кошелек</h3>
                </div>
                <div className="wallet-actions">
                    <button 
                        className="wallet-btn-icon"
                        onClick={() => setShowBalance(!showBalance)}
                        title={showBalance ? 'Скрыть баланс' : 'Показать баланс'}
                    >
                        {showBalance ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button 
                        className="wallet-btn-icon"
                        onClick={() => setShowHistory(!showHistory)}
                        title="История операций"
                    >
                        <History size={16} />
                    </button>
                </div>
            </div>

            <div className="wallet-balance">
                <span className="wallet-label">Баланс</span>
                <div className="wallet-amount">
                    <DollarSign size={18} />
                    <span className="balance-value">
                        {showBalance ? formatPrice(walletData.balance) : '••••••'}
                    </span>
                </div>
            </div>

            <div className="wallet-buttons">
                <button 
                    className="wallet-btn deposit-btn"
                    onClick={() => setShowDepositModal(true)}
                >
                    <Plus size={16} /> Пополнить
                </button>
                <button 
                    className="wallet-btn reset-btn"
                    onClick={resetWallet}
                >
                    <RotateCcw size={16} /> Сбросить
                </button>
            </div>

            {showHistory && (
                <div className="wallet-history">
                    <div className="history-header">
                        <span>История операций</span>
                        <span className="history-count">{walletData.transactions.length}</span>
                    </div>
                    <div className="history-list">
                        {walletData.transactions.length === 0 ? (
                            <div className="history-empty">Операций пока нет</div>
                        ) : (
                            walletData.transactions.slice(0, 10).map((tx) => (
                                <div key={tx.id} className={`history-item ${tx.type}`}>
                                    <div className="history-info">
                                        <span className="history-type-label">
                                            {tx.type === 'deposit' ? '🟢 Пополнение' :
                                             tx.type === 'buy' ? '🔵 Покупка' : '🔴 Продажа'}
                                        </span>
                                        <span className="history-desc">{tx.description}</span>
                                    </div>
                                    <div className="history-amount">
                                        <span className={`amount ${tx.type === 'deposit' ? 'positive' : tx.type === 'buy' ? 'negative' : 'positive'}`}>
                                            {tx.type === 'deposit' ? '+' : tx.type === 'buy' ? '-' : '+'}${formatPrice(tx.amount)}
                                        </span>
                                        <span className="history-time">{formatDate(tx.timestamp)}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {showDepositModal && (
                <div className="deposit-modal-overlay" onClick={() => setShowDepositModal(false)}>
                    <div className="deposit-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="deposit-modal-header">
                            <h4>Пополнение баланса</h4>
                            <button 
                                className="modal-close-btn"
                                onClick={() => setShowDepositModal(false)}
                            >
                                ✕
                            </button>
                        </div>
                        <div className="deposit-modal-body">
                            <div className="deposit-presets">
                                <button onClick={() => setDepositAmount('100')}>$100</button>
                                <button onClick={() => setDepositAmount('500')}>$500</button>
                                <button onClick={() => setDepositAmount('1000')}>$1000</button>
                                <button onClick={() => setDepositAmount('5000')}>$5000</button>
                            </div>
                            <div className="deposit-input-group">
                                <label>Сумма пополнения (USDT)</label>
                                <input
                                    type="number"
                                    value={depositAmount}
                                    onChange={(e) => setDepositAmount(e.target.value)}
                                    placeholder="Введите сумму"
                                    min="1"
                                    step="1"
                                />
                            </div>
                            <div className="deposit-current-balance">
                                Текущий баланс: <strong>${formatPrice(walletData.balance)}</strong>
                            </div>
                            <button 
                                className="deposit-confirm-btn"
                                onClick={handleDeposit}
                            >
                                Пополнить на ${depositAmount || '0'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export const useWallet = () => {
    const [balance, setBalance] = useState(0);

    const updateBalance = (newBalance: number) => {
        setBalance(newBalance);
    };

    return { balance, updateBalance };
};