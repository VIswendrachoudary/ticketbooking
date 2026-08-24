import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Clock, Ticket, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { apiRequest } from '../api';
import { useAuth } from '../context/AuthContext';

export const ClaimOfferPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [offer, setOffer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [claiming, setClaiming] = useState(false);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(0);

  useEffect(() => {
    async function loadOffer() {
      try {
        const data = await apiRequest(`/waitlist/offer/${token}`);
        setOffer(data);
      } catch (err: any) {
        setError(err.message || 'Invalid or expired offer token');
      } finally {
        setLoading(false);
      }
    }
    if (token) loadOffer();
  }, [token]);

  useEffect(() => {
    if (!offer?.offerExpiresAt) return;

    const interval = setInterval(() => {
      const diffMs = new Date(offer.offerExpiresAt).getTime() - new Date().getTime();
      const secs = Math.max(0, Math.floor(diffMs / 1000));
      setTimeLeftSeconds(secs);

      if (secs <= 0) {
        setError('This seat offer has expired and has been offered to the next candidate on the waitlist.');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [offer]);

  const handleClaim = async () => {
    if (!user) {
      alert('Please sign in to claim your seat offer');
      return;
    }
    setError('');
    setClaiming(true);
    try {
      const res = await apiRequest(`/waitlist/offer/${token}/claim`, 'POST');
      navigate(`/seats/${res.showId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to claim offer');
    } finally {
      setClaiming(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500" />
      </div>
    );
  }

  if (error || !offer) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl">
          <AlertCircle className="h-12 w-12 text-rose-400 mx-auto" />
          <h2 className="text-xl font-bold text-white">Seat Offer Unavailable</h2>
          <p className="text-xs text-slate-400">{error || 'This offer link is invalid or expired.'}</p>
          <Link to="/" className="bg-indigo-600 text-white font-bold text-xs px-6 py-2.5 rounded-xl inline-block">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  const mins = Math.floor(timeLeftSeconds / 60);
  const secs = timeLeftSeconds % 60;

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 py-12">
      <div className="bg-slate-900 border border-amber-500/50 rounded-3xl p-8 max-w-lg w-full shadow-2xl space-y-6 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl" />

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-amber-500/20 border border-amber-500/30 rounded-2xl text-amber-400 mb-1">
            <Ticket className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">Waitlist Seat Offered!</h1>
          <p className="text-xs text-slate-400">Exclusive time-limited booking offer</p>
        </div>

        {/* Timer */}
        <div className="bg-amber-950/50 border border-amber-500/40 p-4 rounded-2xl text-center space-y-1">
          <p className="text-[10px] uppercase font-bold tracking-widest text-amber-300">Time Remaining to Claim</p>
          <p className="text-3xl font-black font-mono text-amber-400">
            {mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}
          </p>
        </div>

        {/* Offer Details */}
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3 text-xs">
          <div className="flex justify-between border-b border-slate-800 pb-2">
            <span className="text-slate-400">Event</span>
            <span className="font-bold text-white">{offer.eventTitle}</span>
          </div>
          <div className="flex justify-between border-b border-slate-800 pb-2">
            <span className="text-slate-400">Venue</span>
            <span className="font-bold text-white">{offer.venueName}</span>
          </div>
          <div className="flex justify-between border-b border-slate-800 pb-2">
            <span className="text-slate-400">Offered Seat</span>
            <span className="font-bold text-indigo-400">{offer.seatNumber} ({offer.category})</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Seat Price</span>
            <span className="font-extrabold text-emerald-400">${offer.price}</span>
          </div>
        </div>

        <button
          onClick={handleClaim}
          disabled={claiming || timeLeftSeconds <= 0}
          className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-extrabold py-3.5 rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2 text-sm"
        >
          {claiming ? 'Claiming Seat...' : 'Claim Seat & Hold for Checkout'}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
