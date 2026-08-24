import React, { useState } from 'react';
import { Users, AlertCircle, CheckCircle2 } from 'lucide-react';

interface WaitlistModalProps {
  showId: string;
  categories: Array<{ name: string; available: number; price: number }>;
  onClose: () => void;
  onJoinWaitlist: (category: string) => Promise<{ queuePosition: number }>;
}

export const WaitlistModal: React.FC<WaitlistModalProps> = ({
  categories,
  onClose,
  onJoinWaitlist,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>(categories[0]?.name || 'STANDARD');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');

  const handleJoin = async () => {
    setError('');
    setSubmitting(true);
    try {
      const result = await onJoinWaitlist(selectedCategory);
      setSuccessMsg(`Joined waitlist! You are #${result.queuePosition} in line. We will email you as soon as a seat opens.`);
    } catch (err: any) {
      setError(err.message || 'Failed to join waitlist');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white text-lg font-bold"
        >
          ✕
        </button>

        <div className="flex items-center space-x-3 mb-4">
          <div className="p-3 bg-amber-500/20 border border-amber-500/30 rounded-xl">
            <Users className="h-6 w-6 text-amber-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Join Event Waitlist</h2>
            <p className="text-xs text-slate-400">Automatic seat reallocation on cancellation</p>
          </div>
        </div>

        {error && (
          <div className="bg-rose-950/80 border border-rose-800 text-rose-300 text-xs p-3 rounded-lg mb-4 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg ? (
          <div className="bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-sm p-4 rounded-xl text-center space-y-3">
            <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto" />
            <p>{successMsg}</p>
            <button
              onClick={onClose}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2 rounded-lg text-xs"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Select Seat Category for Waitlist
              </label>
              <div className="space-y-2">
                {categories.map((cat) => (
                  <label
                    key={cat.name}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                      selectedCategory === cat.name
                        ? 'border-indigo-500 bg-indigo-950/40 text-white'
                        : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="category"
                        value={cat.name}
                        checked={selectedCategory === cat.name}
                        onChange={() => setSelectedCategory(cat.name)}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <span className="font-semibold text-sm">{cat.name} Section</span>
                        <p className="text-[11px] text-slate-400">
                          {cat.available === 0 ? '❌ Sold Out' : `Available: ${cat.available}`}
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-sm text-indigo-400">${cat.price}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <p className="font-semibold text-slate-300">How Waitlist Reallocation Works:</p>
              <p>• If a booking is cancelled, the seat is automatically assigned to you.</p>
              <p>• You will receive an email notification with a 15-minute time-limited claim link.</p>
            </div>

            <button
              onClick={handleJoin}
              disabled={submitting}
              className="w-full bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl shadow-lg shadow-amber-600/20 transition text-sm flex items-center justify-center gap-2"
            >
              {submitting ? 'Joining Queue...' : 'Confirm & Join Waitlist'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
