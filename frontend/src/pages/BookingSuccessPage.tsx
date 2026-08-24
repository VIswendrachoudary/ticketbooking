import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle2, Calendar, MapPin, Ticket, Mail, Printer, ArrowLeft, Sparkles } from 'lucide-react';

export const BookingSuccessPage: React.FC = () => {
  const location = useLocation();
  const booking = location.state?.booking;

  if (!booking) {
    return (
      <div className="min-h-screen ambient-bg flex items-center justify-center p-4">
        <div className="glass-panel border border-white/15 rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl">
          <h2 className="text-xl font-bold text-white">Booking Details Unavailable</h2>
          <Link to="/my-bookings" className="text-indigo-400 underline mt-4 inline-block font-semibold text-xs">
            Go to My Bookings
          </Link>
        </div>
      </div>
    );
  }

  const qrValue = JSON.stringify({
    ref: booking.bookingRef,
    event: booking.event?.title,
    venue: booking.venue?.name,
    seats: booking.seats,
    time: booking.startTime,
  });

  return (
    <div className="min-h-screen ambient-bg py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header Badge */}
        <div className="text-center space-y-3">
          <div className="inline-flex p-4 bg-emerald-500/20 border border-emerald-500/40 rounded-3xl text-emerald-400 mb-2 glow-emerald">
            <CheckCircle2 className="h-10 w-10 animate-bounce" />
          </div>
          <h1 className="text-4xl font-black text-white">Booking Confirmed!</h1>
          <p className="text-xs text-slate-300">
            Booking Reference: <span className="font-mono font-extrabold text-indigo-400">{booking.bookingRef}</span>
          </p>
        </div>

        {/* Holographic E-Ticket Container */}
        <div className="glass-panel border border-white/15 rounded-3xl overflow-hidden shadow-2xl relative glow-indigo">
          {/* Metallic Header */}
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 p-6 text-white flex justify-between items-center relative overflow-hidden">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-200 flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-amber-300" /> OFFICIAL E-TICKET PASS
              </span>
              <h2 className="text-2xl font-black">{booking.event?.title}</h2>
            </div>
            <Ticket className="h-10 w-10 text-indigo-200 opacity-80" />
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Event & Venue Metadata */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs glass-panel p-5 rounded-2xl border border-white/10">
              <div className="space-y-1">
                <span className="text-slate-400 flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-indigo-400" /> Venue Location
                </span>
                <p className="font-extrabold text-white text-sm">{booking.venue?.name}</p>
                <p className="text-slate-400">{booking.venue?.address}, {booking.venue?.city}</p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-amber-400" /> Date & Showtime
                </span>
                <p className="font-extrabold text-white text-sm">
                  {new Date(booking.startTime).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Seats & Price */}
            <div className="flex justify-between items-center p-5 glass-panel rounded-2xl border border-white/10">
              <div>
                <span className="text-xs text-slate-400 font-semibold">Reserved Seats</span>
                <p className="font-black text-xl text-indigo-400">
                  {booking.seats?.join(', ')}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 font-semibold">Total Paid</span>
                <p className="font-black text-xl text-emerald-400">${booking.totalPrice?.toFixed(2)}</p>
              </div>
            </div>

            {/* QR Code Container with Holographic Scan Line */}
            <div className="flex flex-col items-center justify-center p-6 bg-white rounded-3xl border-2 border-indigo-500/40 text-center relative overflow-hidden shadow-2xl">
              {/* Scan beam */}
              <div className="animate-scan" />

              <QRCodeSVG value={qrValue} size={190} level="H" includeMargin />
              <p className="text-slate-900 font-black text-xs mt-3 tracking-widest uppercase">
                {booking.bookingRef}
              </p>
              <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Present QR code at venue entrance gate</p>
            </div>

            {/* Email Notification Notice */}
            <div className="flex items-center space-x-3 bg-indigo-950/60 border border-indigo-500/30 p-4 rounded-2xl text-xs text-indigo-300">
              <Mail className="h-5 w-5 text-indigo-400 shrink-0" />
              <span>Confirmation email with embedded QR code ticket has been dispatched to your email inbox!</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 pt-2">
          <button
            onClick={() => window.print()}
            className="flex-1 glass-panel hover:bg-white/10 text-white font-bold py-3.5 rounded-2xl border border-white/15 transition flex items-center justify-center gap-2 text-xs"
          >
            <Printer className="h-4 w-4" /> Save / Print PDF Ticket
          </button>
          <Link
            to="/my-bookings"
            className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3.5 rounded-2xl shadow-xl shadow-indigo-600/30 transition flex items-center justify-center gap-2 text-xs"
          >
            <ArrowLeft className="h-4 w-4" /> View All My Bookings
          </Link>
        </div>
      </div>
    </div>
  );
};
