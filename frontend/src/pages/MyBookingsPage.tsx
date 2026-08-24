import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Ticket, Calendar, MapPin, Clock, Users, ArrowRight, Sparkles } from 'lucide-react';
import { apiRequest } from '../api';

export const MyBookingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'BOOKINGS' | 'WAITLIST'>('BOOKINGS');
  const [bookings, setBookings] = useState<any[]>([]);
  const [waitlists, setWaitlists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [selectedQrBooking, setSelectedQrBooking] = useState<any | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bookingsData, waitlistsData] = await Promise.all([
        apiRequest('/bookings/my-bookings'),
        apiRequest('/waitlist/my-waitlists'),
      ]);
      setBookings(bookingsData);
      setWaitlists(waitlistsData);
    } catch (err) {
      console.error('Error loading user data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCancelBooking = async (bookingId: string) => {
    if (!window.confirm('Are you sure you want to cancel this booking? The seat will be automatically offered to waitlisted customers.')) {
      return;
    }

    setCancellingId(bookingId);
    try {
      await apiRequest(`/bookings/cancel/${bookingId}`, 'POST');
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel booking');
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="min-h-screen ambient-bg pb-24 pt-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Header & Tab Switcher */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-black text-white">Customer Dashboard</h1>
          <p className="text-xs text-slate-400 mt-1">Manage active tickets, digital QR passes & waitlist seat offers</p>
        </div>

        <div className="flex glass-panel p-1.5 rounded-2xl border border-white/10">
          <button
            onClick={() => setActiveTab('BOOKINGS')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'BOOKINGS'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg glow-indigo'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Ticket className="h-4 w-4" /> Bookings ({bookings.length})
          </button>

          <button
            onClick={() => setActiveTab('WAITLIST')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 relative ${
              activeTab === 'WAITLIST'
                ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-black shadow-lg glow-amber'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="h-4 w-4" /> Waitlists ({waitlists.length})
            {waitlists.some((w) => w.status === 'OFFERED') && (
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping absolute top-1 right-1" />
            )}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-24">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500 mx-auto" />
        </div>
      ) : activeTab === 'BOOKINGS' ? (
        bookings.length === 0 ? (
          <div className="text-center py-24 glass-panel rounded-3xl border border-white/10">
            <Ticket className="h-12 w-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white">No Active Bookings</h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">Browse catalog to reserve your first tickets!</p>
            <Link to="/" className="bg-indigo-600 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-lg">
              Browse Events
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {bookings.map((b) => (
              <div
                key={b.id}
                className="glass-card rounded-3xl p-6 space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg bg-indigo-950/80 text-indigo-300 border border-indigo-500/30">
                      {b.bookingRef}
                    </span>
                    <span
                      className={`text-[10px] font-extrabold px-3 py-1 rounded-full ${
                        b.status === 'CONFIRMED'
                          ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 glow-emerald'
                          : 'bg-rose-950/80 text-rose-400 border border-rose-500/40'
                      }`}
                    >
                      {b.status}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-xl text-white">{b.eventTitle}</h3>

                  <div className="space-y-1.5 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-indigo-400 shrink-0" />
                      <span>{b.venueName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-amber-400 shrink-0" />
                      <span>{new Date(b.startTime).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="glass-panel p-3.5 rounded-2xl border border-white/10 flex justify-between items-center text-xs">
                    <div>
                      <span className="text-slate-400 font-semibold">Reserved Seats: </span>
                      <span className="font-bold text-white">{b.seats.map((s: any) => s.seatNumber).join(', ')}</span>
                    </div>
                    <span className="font-black text-emerald-400 text-sm">${b.totalPrice.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  {b.status === 'CONFIRMED' && (
                    <>
                      <button
                        onClick={() => setSelectedQrBooking(b)}
                        className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-2.5 rounded-xl text-xs shadow-md transition"
                      >
                        View Digital QR Ticket
                      </button>
                      <button
                        onClick={() => handleCancelBooking(b.id)}
                        disabled={cancellingId === b.id}
                        className="bg-rose-950/60 hover:bg-rose-900 text-rose-300 font-bold px-4 py-2.5 rounded-xl text-xs border border-rose-800 transition"
                      >
                        {cancellingId === b.id ? 'Cancelling...' : 'Cancel Booking'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      ) : waitlists.length === 0 ? (
        <div className="text-center py-24 glass-panel rounded-3xl border border-white/10">
          <Users className="h-12 w-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">No Waitlist Entries</h3>
          <p className="text-xs text-slate-400 mt-1">Join waitlists for sold-out events to get auto-assigned seats on cancellation.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {waitlists.map((w) => (
            <div
              key={w.id}
              className={`p-6 rounded-3xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 transition ${
                w.status === 'OFFERED'
                  ? 'glass-panel border-amber-500 glow-amber'
                  : 'glass-card'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <h3 className="font-extrabold text-lg text-white">{w.eventTitle}</h3>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-indigo-950/80 text-indigo-300 border border-indigo-500/30">
                    Category: {w.category}
                  </span>
                </div>

                <div className="flex items-center space-x-4 text-xs text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-indigo-400" /> {w.venueName}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-amber-400" /> {new Date(w.startTime).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Status & Action */}
              <div className="flex items-center space-x-4">
                {w.status === 'OFFERED' ? (
                  <div className="text-right space-y-2">
                    <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold">
                      <Clock className="h-4 w-4 animate-spin-slow" />
                      <span>OFFER EXPIRES: {new Date(w.offerExpiresAt).toLocaleTimeString()}</span>
                    </div>
                    <Link
                      to={`/claim-offer/${w.offerToken}`}
                      className="bg-gradient-to-r from-amber-500 to-amber-400 text-black font-black text-xs px-6 py-3 rounded-2xl transition inline-flex items-center gap-2 shadow-lg glow-amber"
                    >
                      <span>Claim Seat Offer Now</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                ) : (
                  <span
                    className={`text-xs font-extrabold px-3.5 py-1.5 rounded-full ${
                      w.status === 'FULFILLED'
                        ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/40'
                        : w.status === 'EXPIRED'
                        ? 'bg-rose-950/80 text-rose-400 border border-rose-500/40'
                        : 'bg-indigo-950/80 text-indigo-300 border border-indigo-500/40'
                    }`}
                  >
                    Status: {w.status}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Digital QR Modal */}
      {selectedQrBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4">
          <div className="glass-panel border border-white/15 rounded-3xl w-full max-w-md p-8 shadow-2xl relative text-center space-y-5">
            <button
              onClick={() => setSelectedQrBooking(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white text-lg font-bold"
            >
              ✕
            </button>
            <h3 className="text-xl font-extrabold text-white">Digital QR Ticket Pass</h3>
            <p className="text-xs text-slate-300">{selectedQrBooking.eventTitle}</p>

            <div className="p-6 bg-white rounded-3xl inline-block border-2 border-indigo-500/40 shadow-2xl relative overflow-hidden">
              <QRCodeSVG
                value={JSON.stringify({
                  ref: selectedQrBooking.bookingRef,
                  event: selectedQrBooking.eventTitle,
                  seats: selectedQrBooking.seats.map((s: any) => s.seatNumber),
                })}
                size={190}
              />
            </div>
            <p className="font-mono text-xs text-indigo-400 font-extrabold tracking-wider">{selectedQrBooking.bookingRef}</p>
          </div>
        </div>
      )}
    </div>
  );
};
