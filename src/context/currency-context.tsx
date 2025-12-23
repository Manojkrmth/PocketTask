'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

export type Currency = 'INR' | 'USD';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatCurrency: (value: number) => string;
  usdToInrRate: number;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const [currency, setCurrency] = useState<Currency>('INR');
  
  // In a real app, this would be fetched from a backend
  const usdToInrRate = 85; 

  const formatCurrency = useCallback((value: number) => {
    let displayValue = value;
    let currencyCode = 'INR';

    if (currency === 'USD') {
      displayValue = value / usdToInrRate;
      currencyCode = 'USD';
    }
    
    return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
    }).format(displayValue);

  }, [currency, usdToInrRate]);

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatCurrency, usdToInrRate }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
