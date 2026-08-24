import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { SeatMap, SeatItem } from '../components/SeatMap';
import { CheckoutDrawer } from '../components/CheckoutDrawer';
import { WaitlistModal } from '../components/WaitlistModal';
import { apiRequest, API_BASE_URL } from '../api';
import { useAuth } from '../context/AuthContext';
import { Users, AlertCircle } from 'lucide-react';
import { useToast } from '../components/Toast';

export const SeatSelectionPage: React.FC = () => {
  const { showId } = useParams<{ showId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();

  const [seatMapData, setSeatMapData] = useState<any>(null);
  const [seats, setSeats] = useState<SeatItem[]>([]);
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [heldSeats, setHeldSeats] = useState<SeatItem[]>([]);
  const [holdExpiresAt, setHoldExpiresAt] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [socketConnected, setSocketConnected] = useState<boolean>(false);
  const [showWaitlistModal, setShowWaitlistModal] = useState<boolean>(false);

  // Fetch seat map data
  const fetchSeatMap = useCallback(async () => {
    if (!showId) return;
    try {
      const data = await apiRequest(`/seats/map/${showId}`);
      setSeatMapData(data);
      setSeats(data.seats);

      // Check if user already has an active hold
      const myHolds = data.seats.filter((s: SeatItem) => s.isMyHold);
      if (myHolds.length > 0) {
        setHeldSeats(myHolds);
        setHoldExpiresAt(myHolds[0].holdExpiresAt);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load seat map');
    } finally {
      setLoading(false);
    }
  }, [showId]);

  useEffect(() => {
    fetchSeatMap();
  }, [fetchSeatMap]);

  // WebSockets Real-Time Sync
  useEffect(() => {
    if (!showId) return;

    const socket: Socket = io(API_BASE_URL);

    socket.on('connect', () => {
      setSocketConnected(true);
      socket.emit('join_show', showId);
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
    });

    socket.on('seat_status_updated', (data: any) => {
      if (data.showId === showId) {
        setSeats((prevSeats) =>
          prevSeats.map((seat) => {
            if (data.seatIds.includes(seat.id)) {
              const isMyHold = user ? data.heldByUserId === user.id : false;
              return {
                ...seat,
                status: data.status,
                heldByUserId: data.heldByUserId,
                holdExpiresAt: data.holdExpiresAt,
                isMyHold,
              };
            }
            return seat;
          })
        );
      }
    });

    return () => {
      socket.emit('leave_show', showId);
      socket.disconnect();
    };
  }, [showId, user]);

  // Toggle seat selection
  const handleToggleSeat = async (seatId: string) => {
    if (!user) {
      alert('Please sign in to select and hold seats');
      return;
    }

    if (selectedSeatIds.includes(seatId)) {
      setSelectedSeatIds(selectedSeatIds.filter((id) => id !== seatId));
    } else {
      setSelectedSeatIds([...selectedSeatIds, seatId]);
    }
  };

  // Place 10-Minute Hold
  const handlePlaceHold = async () => {
    if (selectedSeatIds.length === 0) return;
    setError('');
    try {
      const res = await apiRequest('/seats/hold', 'POST', {
        showId,
        showSeatIds: selectedSeatIds,
        seatIds: selectedSeatIds,
      });

      setHeldSeats(res.heldSeats);
      setHoldExpiresAt(res.expiresAt);
      setSelectedSeatIds([]);
      addToast('success', 'Seats Held Successfully!', '10-minute hold reservation activated.');
      await fetchSeatMap();
    } catch (err: any) {
      setError(err.message || 'Seat conflict detected');
      addToast('error', 'Seat Reservation Conflict', err.message);
      await fetchSeatMap();
    }
  };

  // Release Active Hold
  const handleReleaseHold = async () => {
    if (heldSeats.length === 0) return;
    try {
      const seatIds = heldSeats.map((s) => s.id);
      await apiRequest('/seats/release', 'POST', {
        showId,
        showSeatIds: seatIds,
        seatIds,
      });
      setHeldSeats([]);
      setHoldExpiresAt(null);
      addToast('info', 'Hold Reservation Released');
      await fetchSeatMap();
    } catch (err: any) {
      console.error('Error releasing hold:', err);
    }
  };

  // Confirm Checkout & Create Booking
  const handleConfirmCheckout = async (addons: string[], promoCode: string) => {
    if (heldSeats.length === 0) return;
    try {
      const seatIds = heldSeats.map((s) => s.id);
      const res = await apiRequest('/bookings/checkout', 'POST', {
        showId,
        showSeatIds: seatIds,
        seatIds,
        addons,
        promoCode,
      });

      addToast('success', 'Booking Confirmed!', 'E-Ticket QR Code dispatched.');
      navigate(`/booking-success/${res.booking.id}`, { state: { booking: res.booking } });
    } catch (err: any) {
      throw err;
    }
  };

  // Join Category Waitlist
  const handleJoinWaitlist = async (category: string) => {
    try {
      await apiRequest('/waitlist/join', 'POST', { showId, category });
      addToast('success', 'Waitlist Joined!', `You will receive auto-assignment offers for ${category} seats.`);
      setShowWaitlistModal(false);
    } catch (err: any) {
      alert(err.message || 'Failed to join waitlist');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen ambient-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500" />
      </div>
    );
  }

  if (!seatMapData) {
    return (
      <div className="min-h-screen ambient-bg text-center py-24">
        <h2 className="text-2xl font-bold text-white">Show Data Unavailable</h2>
      </div>
    );
  }

  // Category seat statistics for Waitlist modal
  const categoryStats: Record<string, { total: number; available: number }> = {};
  seats.forEach((seat) => {
    if (!categoryStats[seat.category]) {
      categoryStats[seat.category] = { total: 0, available: 0 };
    }
    categoryStats[seat.category].total += 1;
    if (seat.status === 'AVAILABLE') {
      categoryStats[seat.category].available += 1;
    }
  });

  const categoryStatsList = Object.keys(categoryStats).map((cat) => ({
    category: cat,
    availableCount: categoryStats[cat].available,
    totalCount: categoryStats[cat].total,
  }));

  const isSoldOut = seats.every((s) => s.status !== 'AVAILABLE');

  return (
    <div className={`min-h-screen ambient-bg pt-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 ${heldSeats.length > 0 || selectedSeatIds.length > 0 ? 'pb-80' : 'pb-32'}`}>
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/15 pb-6">
        <div>
          <span className="text-[10px] font-black uppercase text-indigo-300 bg-indigo-950/80 px-3 py-1 rounded-xl border border-indigo-500/40">
            {seatMapData.event?.category} • Visual Seat Selection
          </span>
          <h1 className="text-2xl sm:text-4xl font-black text-white mt-1.5">
            {seatMapData.event?.title}
          </h1>
          <p className="text-xs text-slate-300 mt-1 font-semibold">
            {seatMapData.venue?.name} • {new Date(seatMapData.startTime).toLocaleString()}
          </p>
        </div>

        {/* Waitlist Trigger Button */}
        <button
          onClick={() => setShowWaitlistModal(true)}
          className="holy-glass text-amber-300 border border-amber-500/40 text-xs font-black px-4 py-2.5 rounded-2xl transition flex items-center gap-2 hover:border-amber-300"
        >
          <Users className="h-4 w-4 text-amber-400" />
          <span>Join Category Waitlist</span>
        </button>
      </div>

      {error && (
        <div className="max-w-4xl mx-auto mb-6 bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs p-4 rounded-2xl flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {isSoldOut && (
        <div className="max-w-4xl mx-auto mb-8 bg-amber-950/50 border border-amber-500/50 p-6 rounded-3xl text-center space-y-3 holy-glow-amber">
          <h3 className="text-lg font-black text-amber-300">⚡ This Show is Fully Sold Out</h3>
          <p className="text-xs text-amber-200 font-medium">
            Join the automated waitlist! If a booking is cancelled or hold expires, seats are immediately offered to waitlist members.
          </p>
          <button
            onClick={() => setShowWaitlistModal(true)}
            className="bg-amber-500 hover:bg-amber-400 text-black font-black text-xs px-6 py-2.5 rounded-2xl transition shadow-lg"
          >
            Join Waitlist Queue
          </button>
        </div>
      )}

      {/* Seat Map Visual Component */}
      <SeatMap
        seats={seats}
        selectedSeatIds={selectedSeatIds}
        onToggleSeat={handleToggleSeat}
        liveSyncConnected={socketConnected}
      />

      {/* Action Floating Bar for Selected Seats before placing Hold */}
      {selectedSeatIds.length > 0 && heldSeats.length === 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 holy-glass border border-indigo-400/60 px-6 py-4 rounded-3xl shadow-2xl flex items-center space-x-6 holy-glow-indigo">
          <div className="text-xs">
            <span className="text-slate-300 font-medium">Selected: </span>
            <span className="font-black text-indigo-300">{selectedSeatIds.length} Seat(s)</span>
          </div>
          <button
            onClick={handlePlaceHold}
            className="bg-gradient-to-r from-indigo-600 via-purple-600 to-amber-500 text-white font-black text-xs px-6 py-3 rounded-2xl shadow-xl transition border border-white/20"
          >
            Place 10-Min Hold & Checkout
          </button>
        </div>
      )}

      {/* Active Hold Checkout Drawer */}
      {heldSeats.length > 0 && (
        <CheckoutDrawer
          heldSeats={heldSeats}
          holdExpiresAt={holdExpiresAt}
          onConfirmCheckout={handleConfirmCheckout}
          onReleaseHold={handleReleaseHold}
          eventTitle={seatMapData.event?.title}
          venueName={seatMapData.venue?.name}
          startTime={seatMapData.startTime}
        />
      )}

      {/* Waitlist Modal */}
      {showWaitlistModal && (
        <WaitlistModal
          showId={showId!}
          categories={categoryStatsList}
          onClose={() => setShowWaitlistModal(false)}
          onJoinWaitlist={handleJoinWaitlist}
        />
      )}
    </div>
  );
};
