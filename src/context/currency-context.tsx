
'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

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
  const [usdToInrRate, setUsdToInrRate] = useState(85); // Default fallback rate

  useEffect(() => {
    const fetchRate = async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('settings_data->>usdToInrRate')
        .eq('id', 1)
        .single();
        
      if (!error && data && data.usdToInrRate) {
        const rate = parseFloat(data.usdToInrRate as string);
        if (!isNaN(rate)) {
          setUsdToInrRate(rate);
        }
      }
    };
    fetchRate();
  }, []);

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
