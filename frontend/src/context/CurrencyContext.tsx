import React, { createContext, useContext, useState } from 'react';

export type Currency = 'USD' | 'EUR' | 'GBP' | 'INR';

interface CurrencyContextType {
  currency: Currency;
  symbol: string;
  setCurrency: (c: Currency) => void;
  formatPrice: (amountInUSD: number) => string;
}

const RATES: Record<Currency, { rate: number; symbol: string }> = {
  USD: { rate: 1.0, symbol: '$' },
  EUR: { rate: 0.92, symbol: '€' },
  GBP: { rate: 0.78, symbol: '£' },
  INR: { rate: 86.5, symbol: '₹' },
};

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<Currency>(
    (localStorage.getItem('ticket_app_currency') as Currency) || 'USD'
  );

  const setCurrency = (c: Currency) => {
    localStorage.setItem('ticket_app_currency', c);
    setCurrencyState(c);
  };

  const formatPrice = (amountInUSD: number) => {
    const config = RATES[currency] || RATES.USD;
    const converted = amountInUSD * config.rate;
    if (currency === 'INR') {
      return `${config.symbol}${Math.round(converted).toLocaleString()}`;
    }
    return `${config.symbol}${converted.toFixed(2)}`;
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        symbol: RATES[currency].symbol,
        setCurrency,
        formatPrice,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
