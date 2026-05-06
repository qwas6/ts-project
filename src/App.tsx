import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import './App.css';


interface University {
    'state-province': string | null;
    country: string;
    domains: string[];
    web_pages: string[];
    name: string;
}


function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(timer);
        };
    }, [value, delay]);

    return debouncedValue;
}

function useFetchUniversities(searchTerm: string) {
    const [data, setData] = useState<University[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        if (!searchTerm) {
            setData([]);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(
                `http://universities.hipolabs.com/search?name=${searchTerm}&country=United+States`
            );
            
            if (!response.ok) {
                throw new Error('Ошибка загрузки данных');
            }
            
            const result: University[] = await response.json();
            setData(result);
            toast.success(`Найдено ${result.length} университетов`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Произошла ошибка');
            toast.error('Не удалось загрузить данные');
        } finally {
            setIsLoading(false);
        }
    }, [searchTerm]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { data, isLoading, error, refetch: fetchData };
}

function App() {
    const [searchInput, setSearchInput] = useState('');
    const debouncedSearch = useDebounce(searchInput, 500);
    
    const { data: universities, isLoading, error } = useFetchUniversities(debouncedSearch);

    const filteredUniversities = useMemo(() => {
        if (!debouncedSearch) return universities;
        return universities.filter((uni: University) =>
            uni.name.toLowerCase().includes(debouncedSearch.toLowerCase())
        );
    }, [universities, debouncedSearch]);

    return (
        <div className="app">
            <Toaster position="top-right" />
            
            <div className="container">
                <h1>🎓 Университеты США</h1>

                
                <div className="search-box">
                    <input
                        type="text"
                        placeholder="Введите название университета..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        className="search-input"
                    />
                    {searchInput && (
                        <span className="search-hint">
                            Ищем: {debouncedSearch}
                        </span>
                    )}
                </div>

                {isLoading && (
                    <div className="loading">
                        <div className="spinner"></div>
                        <p>Загрузка...</p>
                    </div>
                )}

                {error && (
                    <div className="error">
                        <p>❌ {error}</p>
                        <button onClick={() => window.location.reload()}>
                            Попробовать снова
                        </button>
                    </div>
                )}

                {!isLoading && !error && filteredUniversities.length === 0 && debouncedSearch && (
                    <div className="no-results">
                        <p>😔 Ничего не найдено</p>
                        <p>Попробуйте другое название</p>
                    </div>
                )}

                {!isLoading && !error && filteredUniversities.length > 0 && (
                    <div className="universities-grid">
                        {filteredUniversities.map((uni: University, index: number) => (
                            <div key={`${uni.name}-${index}`} className="university-card">
                                <h3>{uni.name}</h3>
                                <div className="card-details">
                                    {uni['state-province'] && (
                                        <p className="state">📍 {uni['state-province']}</p>
                                    )}
                                    {uni.domains && uni.domains[0] && (
                                        <p className="domain">🌐 {uni.domains[0]}</p>
                                    )}
                                </div>
                                {uni.web_pages && uni.web_pages[0] && (
                                    <a 
                                        href={uni.web_pages[0]} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="card-link"
                                    >
                                        Перейти на сайт →
                                    </a>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {!isLoading && !error && !debouncedSearch && (
                    <div className="placeholder">
                        <p>🔍 Начните вводить название университета</p>
                        <p className="example">Пример: Harvard, MIT, Stanford...</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default App;