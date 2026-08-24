import React, { useState } from 'react';
import { Tag, CheckCircle2, X } from 'lucide-react';
import { useToast } from './Toast';

interface PromoCodeInputProps {
  onApplyPromo: (discountPercent: number, discountFlat: number, codeName: string) => void;
  onRemovePromo: () => void;
  appliedCode: string;
}

export const PromoCodeInput: React.FC<PromoCodeInputProps> = ({
  onApplyPromo,
  onRemovePromo,
  appliedCode,
}) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const { addToast } = useToast();

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const formatted = code.trim().toUpperCase();
    if (formatted === 'VIP20') {
      onApplyPromo(20, 0, 'VIP20');
      addToast('success', 'Promo Code Applied!', '20% discount applied to your order.');
      setCode('');
    } else if (formatted === 'FIRST10') {
      onApplyPromo(0, 10, 'FIRST10');
      addToast('success', 'Promo Code Applied!', '$10 flat discount applied to your order.');
      setCode('');
    } else {
      setError('Invalid code. Try "VIP20" or "FIRST10"');
    }
  };

  return (
    <div className="pt-2">
      {appliedCode ? (
        <div className="flex items-center justify-between bg-emerald-950/60 border border-emerald-500/40 p-2.5 rounded-xl text-xs text-emerald-300">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span className="font-extrabold">Promo "{appliedCode}" Applied</span>
          </div>
          <button onClick={onRemovePromo} className="text-emerald-400 hover:text-white font-bold text-[11px]">
            Remove
          </button>
        </div>
      ) : (
        <form onSubmit={handleApply} className="flex gap-2 text-xs">
          <div className="relative flex-1">
            <Tag className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Promo Code (e.g. VIP20)"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full bg-slate-950/80 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl transition shadow-md"
          >
            Apply
          </button>
        </form>
      )}

      {error && <p className="text-[11px] text-rose-400 mt-1 font-medium">{error}</p>}
    </div>
  );
};
