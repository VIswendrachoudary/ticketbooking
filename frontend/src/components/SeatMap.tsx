import React from 'react';
import { Lock, Check, Sparkles, Wifi } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';

export interface SeatItem {
  id: string;
  seatId: string;
  seatNumber: string;
  rowLabel: string;
  colNumber: number;
  category: 'VIP' | 'PREMIUM' | 'STANDARD' | string;
  price: number;
  status: 'AVAILABLE' | 'HELD' | 'BOOKED' | 'OFFERED' | string;
  heldByUserId?: string | null;
  holdExpiresAt?: string | null;
  isMyHold?: boolean;
}

interface SeatMapProps {
  seats: SeatItem[];
  selectedSeatIds: string[];
  onToggleSeat: (seatId: string) => void;
  rowCount?: number;
  colCount?: number;
  liveSyncConnected?: boolean;
}

export const SeatMap: React.FC<SeatMapProps> = ({
  seats,
  selectedSeatIds,
  onToggleSeat,
  liveSyncConnected = true,
}) => {
  const { formatPrice } = useCurrency();

  // Group seats by row
  const rowsMap = new Map<string, SeatItem[]>();
  seats.forEach((seat) => {
    if (!rowsMap.has(seat.rowLabel)) {
      rowsMap.set(seat.rowLabel, []);
    }
    rowsMap.get(seat.rowLabel)!.push(seat);
  });

  const sortedRows = Array.from(rowsMap.keys()).sort();

  const getSeatStyle = (seat: SeatItem) => {
    const isSelected = selectedSeatIds.includes(seat.id);

    if (seat.status === 'BOOKED') {
      return 'bg-slate-950/90 border-slate-800/80 text-slate-700 cursor-not-allowed opacity-30 shadow-inner';
    }
    if (seat.isMyHold || isSelected) {
      return 'bg-gradient-to-t from-indigo-600 via-purple-600 to-amber-500 border-white text-white font-black ring-4 ring-indigo-400/60 shadow-2xl holy-glow-indigo scale-110 z-20 animate-pulse';
    }
    if (seat.status === 'HELD' || seat.status === 'OFFERED') {
      return 'bg-amber-950/70 border-amber-400 text-amber-300 cursor-not-allowed opacity-80 animate-pulse holy-glow-amber';
    }

    // Available Category Crystal Styles
    switch (seat.category.toUpperCase()) {
      case 'VIP':
        return 'bg-gradient-to-t from-amber-950/80 via-amber-900/40 to-slate-900/60 border-amber-400/80 text-amber-300 hover:border-amber-300 hover:holy-glow-amber';
      case 'PREMIUM':
        return 'bg-gradient-to-t from-indigo-950/80 via-indigo-900/40 to-slate-900/60 border-indigo-400/80 text-indigo-300 hover:border-indigo-300 hover:holy-glow-indigo';
      default:
        return 'bg-gradient-to-t from-slate-900/80 via-slate-850/60 to-slate-800/40 border-slate-600/80 text-slate-200 hover:border-emerald-400 hover:text-white hover:holy-glow-emerald';
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Live WebSockets Status Badge */}
      <div className="flex items-center space-x-2.5 holy-glass px-5 py-2.5 rounded-full border border-white/20 text-xs shadow-2xl mb-10">
        <Wifi className={`h-4 w-4 ${liveSyncConnected ? 'text-emerald-400 animate-pulse' : 'text-rose-400'}`} />
        <span className="font-extrabold text-slate-200">
          {liveSyncConnected ? 'Real-Time Crystal WebSockets Sync Active' : 'Connecting to Seat Engine...'}
        </span>
      </div>

      {/* 3D IMAX Curved Screen Header */}
      <div className="w-full max-w-3xl mb-14 flex flex-col items-center relative">
        <div className="w-full h-5 bg-gradient-to-r from-transparent via-indigo-400 to-transparent rounded-t-full border-t-2 border-indigo-300 shadow-2xl holy-glow-indigo mb-3" />
        <div className="flex items-center space-x-2 text-[11px] uppercase font-black tracking-widest text-indigo-300">
          <Sparkles className="h-4 w-4 text-amber-400 animate-pulse" />
          <span>IMAX 3D CRYSTAL SCREEN / STAGE THIS WAY</span>
          <Sparkles className="h-4 w-4 text-amber-400 animate-pulse" />
        </div>
      </div>

      {/* 3D Seat Tiles Grid */}
      <div className="overflow-x-auto max-w-full pb-10 px-6">
        <div className="flex flex-col space-y-4 min-w-max items-center">
          {sortedRows.map((rowLabel) => {
            const rowSeats = (rowsMap.get(rowLabel) || []).sort((a, b) => a.colNumber - b.colNumber);
            return (
              <div key={rowLabel} className="flex items-center space-x-3.5">
                {/* Left Row Label */}
                <div className="w-8 text-center font-black text-xs text-indigo-400">
                  {rowLabel}
                </div>

                {/* Seat Tiles */}
                <div className="flex space-x-3">
                  {rowSeats.map((seat) => {
                    const isSelected = selectedSeatIds.includes(seat.id);
                    const isDisabled = seat.status === 'BOOKED' || ((seat.status === 'HELD' || seat.status === 'OFFERED') && !seat.isMyHold);

                    return (
                      <button
                        key={seat.id}
                        disabled={isDisabled}
                        onClick={() => onToggleSeat(seat.id)}
                        className={`w-10 h-10 rounded-2xl crystal-tile flex flex-col items-center justify-center transition-all duration-200 relative text-xs font-black shadow-lg cursor-pointer ${getSeatStyle(seat)}`}
                        title={`Seat ${seat.seatNumber} (${seat.category}) - ${formatPrice(seat.price)}`}
                      >
                        {seat.status === 'BOOKED' ? (
                          <Lock className="h-3.5 w-3.5 text-slate-700" />
                        ) : isSelected || seat.isMyHold ? (
                          <Check className="h-4 w-4 text-white stroke-[3]" />
                        ) : (
                          <span>{seat.colNumber}</span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Right Row Label */}
                <div className="w-8 text-center font-black text-xs text-indigo-400">
                  {rowLabel}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Category & Status Legend */}
      <div className="mt-10 p-6 holy-glass rounded-3xl border border-white/20 w-full max-w-2xl flex flex-wrap justify-center items-center gap-6 text-xs shadow-2xl">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded-lg bg-gradient-to-t from-slate-900 to-slate-800 border border-emerald-400" />
          <span className="text-slate-200 font-extrabold">Available</span>
        </div>

        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 border border-white holy-glow-indigo" />
          <span className="text-slate-200 font-extrabold">Your Hold</span>
        </div>

        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded-lg bg-amber-950 border border-amber-400 animate-pulse" />
          <span className="text-slate-200 font-extrabold">Held by Others</span>
        </div>

        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded-lg bg-slate-950 border border-slate-800 opacity-40 flex items-center justify-center">
            <Lock className="h-2.5 w-2.5 text-slate-700" />
          </div>
          <span className="text-slate-400 font-extrabold">Booked</span>
        </div>

        <div className="w-full border-t border-white/15 pt-4 flex justify-center space-x-4">
          <span className="px-3.5 py-1 rounded-xl border border-amber-400/60 holy-glass text-amber-300 font-black text-[10px]">
            VIP ({formatPrice(100)}+)
          </span>
          <span className="px-3.5 py-1 rounded-xl border border-indigo-400/60 holy-glass text-indigo-300 font-black text-[10px]">
            Premium ({formatPrice(60)})
          </span>
          <span className="px-3.5 py-1 rounded-xl border border-slate-600 holy-glass text-slate-200 font-black text-[10px]">
            Standard ({formatPrice(30)})
          </span>
        </div>
      </div>
    </div>
  );
};
