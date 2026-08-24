import React, { useState } from 'react';
import { Globe, ChevronDown } from 'lucide-react';
import { useCurrency, Currency } from '../context/CurrencyContext';

export const CurrencySelector: React.FC = () => {
  const { currency, setCurrency } = useCurrency();
  const [open, setOpen] = useState(false);

  const currencies: Array<{ id: Currency; label: string; symbol: string }> = [
    { id: 'USD', label: 'USD ($)', symbol: '$' },
    { id: 'EUR', label: 'EUR (€)', symbol: '€' },
    { id: 'GBP', label: 'GBP (£)', symbol: '£' },
    { id: 'INR', label: 'INR (₹)', symbol: '₹' },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center space-x-1.5 glass-panel px-3 py-1.5 rounded-xl border border-white/10 text-xs font-extrabold text-indigo-300 hover:border-indigo-400 transition"
      >
        <Globe className="h-3.5 w-3.5 text-indigo-400" />
        <span>{currency}</span>
        <ChevronDown className="h-3 w-3 text-slate-400" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-32 glass-panel border border-white/15 rounded-xl shadow-2xl py-1 z-50 animate-in fade-in">
          {currencies.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setCurrency(c.id);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-1.5 text-xs font-semibold flex items-center justify-between transition ${
                currency === c.id
                  ? 'bg-indigo-600/30 text-indigo-300 font-extrabold'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span>{c.label}</span>
              <span className="font-mono">{c.symbol}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
