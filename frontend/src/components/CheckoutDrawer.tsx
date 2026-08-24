import React, { useState, useEffect } from 'react';
import { Clock, CreditCard, AlertCircle, ArrowRight, ChevronUp, ChevronDown, Sparkles } from 'lucide-react';
import { SeatItem } from './SeatMap';
import { AddonSelector, AVAILABLE_ADDONS } from './AddonSelector';
import { PromoCodeInput } from './PromoCodeInput';
import { useCurrency } from '../context/CurrencyContext';

interface CheckoutDrawerProps {
  heldSeats: SeatItem[];
  holdExpiresAt: string | null;
  onConfirmCheckout: (addons: string[], promoCode: string) => Promise<void>;
  onReleaseHold: () => Promise<void>;
  eventTitle: string;
  venueName: string;
  startTime: string;
}

export const CheckoutDrawer: React.FC<CheckoutDrawerProps> = ({
  heldSeats,
  holdExpiresAt,
  onConfirmCheckout,
  onReleaseHold,
  eventTitle,
  venueName,
}) => {
  const { formatPrice } = useCurrency();
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(0);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [expanded, setExpanded] = useState<boolean>(false);

  // Addons & Promo States
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [appliedPromo, setAppliedPromo] = useState<string>('');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [discountFlat, setDiscountFlat] = useState<number>(0);

  useEffect(() => {
    if (!holdExpiresAt) return;

    const calculateTimeLeft = () => {
      const diffMs = new Date(holdExpiresAt).getTime() - new Date().getTime();
      const seconds = Math.max(0, Math.floor(diffMs / 1000));
      setTimeLeftSeconds(seconds);

      if (seconds <= 0) {
        onReleaseHold();
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [holdExpiresAt, onReleaseHold]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggleAddon = (id: string) => {
    if (selectedAddons.includes(id)) {
      setSelectedAddons(selectedAddons.filter((item) => item !== id));
    } else {
      setSelectedAddons([...selectedAddons, id]);
    }
  };

  const handleApplyPromo = (pct: number, flat: number, code: string) => {
    setDiscountPercent(pct);
    setDiscountFlat(flat);
    setAppliedPromo(code);
  };

  const handleRemovePromo = () => {
    setDiscountPercent(0);
    setDiscountFlat(0);
    setAppliedPromo('');
  };

  // Price Calculations
  const seatsPrice = heldSeats.reduce((sum, s) => sum + s.price, 0);

  const addonsPrice = selectedAddons.reduce((sum, id) => {
    const addon = AVAILABLE_ADDONS.find((a) => a.id === id);
    return sum + (addon ? addon.price : 0);
  }, 0);

  const rawTotal = seatsPrice + addonsPrice;
  let finalTotal = rawTotal;
  if (discountPercent > 0) {
    finalTotal = rawTotal * (1 - discountPercent / 100);
  } else if (discountFlat > 0) {
    finalTotal = Math.max(0, rawTotal - discountFlat);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await onConfirmCheckout(selectedAddons, appliedPromo);
    } catch (err: any) {
      setError(err.message || 'Checkout failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (heldSeats.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-7xl mx-auto holy-glass border border-white/20 rounded-3xl p-5 shadow-2xl transition-all duration-300">
      <div className="space-y-4">
        {/* Compact Single-Line Bar */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          {/* Left: Countdown Timer & Held Seats Info */}
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
            {/* TTL Badge */}
            <div className="holy-glass border border-indigo-500/40 rounded-2xl px-4 py-2 flex items-center space-x-3 shadow-lg holy-glow-indigo justify-center">
              <Clock className="h-5 w-5 text-indigo-400 animate-spin-slow" />
              <div>
                <p className="text-[9px] uppercase font-black tracking-widest text-indigo-300">
                  Hold TTL
                </p>
                <p className="text-xl font-black font-mono text-white">
                  {formatTime(timeLeftSeconds)}
                </p>
              </div>
            </div>

            {/* Event & Seat Summary */}
            <div className="text-center sm:text-left">
              <h3 className="text-sm font-black text-white flex items-center gap-1.5 justify-center sm:justify-start">
                <span>{eventTitle}</span>
                <span className="text-xs font-semibold text-slate-400">({venueName})</span>
              </h3>
              <p className="text-xs text-slate-300 mt-0.5 font-medium">
                Seats:{' '}
                <span className="font-black text-indigo-400">
                  {heldSeats.map((s) => `${s.seatNumber} (${formatPrice(s.price)})`).join(', ')}
                </span>
              </p>
            </div>
          </div>

          {/* Right: Expandable Merch Toggle, Price & Confirm Button */}
          <div className="flex items-center gap-3 w-full lg:w-auto justify-end flex-wrap">
            {/* Expand Merch & Promo Toggle */}
            <button
              onClick={() => setExpanded(!expanded)}
              className="holy-glass text-xs font-bold text-indigo-300 hover:text-white px-3.5 py-2.5 rounded-2xl border border-indigo-500/40 transition flex items-center gap-1.5"
            >
              <Sparkles className="h-4 w-4 text-amber-400" />
              <span>Merch & Coupons</span>
              {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </button>

            {/* Total Price */}
            <div className="text-right px-2">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total</p>
              <p className="text-xl font-black text-emerald-400">{formatPrice(finalTotal)}</p>
            </div>

            {/* Abandon Hold */}
            <button
              onClick={onReleaseHold}
              className="text-xs font-bold text-slate-400 hover:text-rose-400 px-3.5 py-2.5 rounded-2xl border border-white/15 hover:bg-rose-500/15 hover:border-rose-500/30 transition"
            >
              Abandon
            </button>

            {/* Confirm & Pay */}
            <button
              onClick={handleSubmit}
              disabled={submitting || timeLeftSeconds <= 0}
              className="bg-gradient-to-r from-indigo-600 via-purple-600 to-amber-500 hover:brightness-110 disabled:opacity-50 text-white font-black px-6 py-2.5 rounded-2xl shadow-xl holy-glow-indigo transition flex items-center gap-2 text-xs border border-white/30"
            >
              {submitting ? (
                <span>Processing...</span>
              ) : (
                <>
                  <CreditCard className="h-4 w-4" />
                  <span>Confirm & Pay {formatPrice(finalTotal)}</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Collapsible Section for Merch & Coupons */}
        {expanded && (
          <div className="pt-4 border-t border-white/15 space-y-4 animate-in slide-in-from-bottom duration-200">
            <AddonSelector
              selectedAddonIds={selectedAddons}
              onToggleAddon={handleToggleAddon}
            />

            <PromoCodeInput
              onApplyPromo={handleApplyPromo}
              onRemovePromo={handleRemovePromo}
              appliedCode={appliedPromo}
            />
          </div>
        )}
      </div>

      {error && (
        <div className="mt-3 bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs p-3 rounded-2xl flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
