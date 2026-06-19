import React, { useState } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { CryptoCard } from './components/CryptoCard/CryptoCard';
import { HistoryLog } from './components/HistoryLog/HistoryLog';
import { HistoryChart } from './components/HistoryChart/HistoryChart';
import { useCryptoData } from './hooks/useCryptoData';
import { useGlobalHistory } from './hooks/useGlobalHistory';
import { CRYPTOS } from './constants';
import './App.css';

function App() {
    const [selected, setSelected] = useState<string[]>(['BTC', 'ETH', 'BNB']);
    
    const btc = useCryptoData('BTC', '10s');
    const eth = useCryptoData('ETH', '10s');
    const bnb = useCryptoData('BNB', '10s');
    const sol = useCryptoData('SOL', '10s');
    const doge = useCryptoData('DOGE', '10s');
    
    const allData = { BTC: btc, ETH: eth, BNB: bnb, SOL: sol, DOGE: doge };
    const globalHistory = useGlobalHistory(allData);

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

    return (
        <div className="app">
            <Toaster position="top-right" toastOptions={{ duration: 2000 }} />
            <div className="container">
                <header>
                    <h1>🚀 Crypto Live Tracker</h1>
                </header>
                
                <div className="add-crypto">
                    <select onChange={(e) => { if (e.target.value) addCrypto(e.target.value); e.target.value = ''; }} defaultValue="">
                        <option value="" disabled>➕ Добавить криптовалюту</option>
                        {CRYPTOS.filter(c => !selected.includes(c.symbol)).map(c => (
                            <option key={c.symbol} value={c.symbol}>{c.name} ({c.symbol})</option>
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
        </div>
    );
}

export default App;