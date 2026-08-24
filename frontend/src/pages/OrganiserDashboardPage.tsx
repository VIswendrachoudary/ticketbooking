import React, { useState, useEffect } from 'react';
import { DollarSign, Ticket, Users, Calendar, Plus, BarChart3, MapPin, Sparkles } from 'lucide-react';
import { apiRequest } from '../api';

export const OrganiserDashboardPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [venues, setVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showShowModal, setShowShowModal] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string>('');

  // Form states
  const [eventTitle, setEventTitle] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [eventCat, setEventCat] = useState('MOVIE');
  const [eventDuration, setEventDuration] = useState(120);

  const [venueId, setVenueId] = useState('');
  const [startTime, setStartTime] = useState('');
  const [vipPrice, setVipPrice] = useState(100);
  const [premiumPrice, setPremiumPrice] = useState(60);
  const [standardPrice, setStandardPrice] = useState(30);

  const loadData = async () => {
    setLoading(true);
    try {
      const [analyticsData, venuesData] = await Promise.all([
        apiRequest('/analytics/organiser'),
        apiRequest('/venues'),
      ]);
      setAnalytics(analyticsData);
      setVenues(venuesData);
      if (venuesData.length > 0) setVenueId(venuesData[0].id);
    } catch (err) {
      console.error('Error loading analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/events', 'POST', {
        title: eventTitle,
        description: eventDesc,
        category: eventCat,
        durationMinutes: eventDuration,
      });
      setShowEventModal(false);
      setEventTitle('');
      setEventDesc('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create event');
    }
  };

  const handleCreateShow = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/events/shows', 'POST', {
        eventId: selectedEventId,
        venueId,
        startTime,
        vipPrice: Number(vipPrice),
        premiumPrice: Number(premiumPrice),
        standardPrice: Number(standardPrice),
      });
      setShowShowModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create show');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen ambient-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen ambient-bg pb-24 pt-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-black text-white">Organiser Control Hub</h1>
          <p className="text-xs text-slate-400 mt-1">Track event revenue analytics, showtimes & seat category sales</p>
        </div>

        <button
          onClick={() => setShowEventModal(true)}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs px-5 py-3 rounded-2xl transition flex items-center gap-2 shadow-lg glow-indigo"
        >
          <Plus className="h-4 w-4" /> Create New Event
        </button>
      </div>

      {/* Glass Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="glass-panel rounded-3xl p-6 space-y-2 border border-white/10">
          <div className="flex justify-between items-center text-emerald-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Event Revenue</span>
            <DollarSign className="h-6 w-6" />
          </div>
          <p className="text-3xl font-black text-white">${analytics?.totalRevenue?.toFixed(2) || '0.00'}</p>
        </div>

        <div className="glass-panel rounded-3xl p-6 space-y-2 border border-white/10">
          <div className="flex justify-between items-center text-indigo-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Confirmed Tickets Sold</span>
            <Ticket className="h-6 w-6" />
          </div>
          <p className="text-3xl font-black text-white">{analytics?.totalTicketsSold || 0}</p>
        </div>

        <div className="glass-panel rounded-3xl p-6 space-y-2 border border-white/10">
          <div className="flex justify-between items-center text-amber-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Listed Events</span>
            <BarChart3 className="h-6 w-6" />
          </div>
          <p className="text-3xl font-black text-white">{analytics?.totalEvents || 0}</p>
        </div>
      </div>

      {/* Event Breakdown */}
      <div className="space-y-6">
        <h2 className="text-xl font-black text-white">Event Performance Breakdown</h2>

        {analytics?.events?.map((event: any) => (
          <div key={event.eventId} className="glass-panel rounded-3xl p-6 space-y-6 border border-white/10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-indigo-300 bg-indigo-950/80 px-2.5 py-1 rounded-lg border border-indigo-500/30">
                  {event.category}
                </span>
                <h3 className="text-2xl font-black text-white mt-1.5">{event.title}</h3>
              </div>

              <div className="flex items-center space-x-6 text-xs">
                <div>
                  <span className="text-slate-400 font-semibold">Revenue: </span>
                  <span className="font-black text-emerald-400">${event.eventRevenue?.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold">Tickets Sold: </span>
                  <span className="font-extrabold text-white">{event.eventTicketsSold}</span>
                </div>
                <button
                  onClick={() => {
                    setSelectedEventId(event.eventId);
                    setShowShowModal(true);
                  }}
                  className="bg-slate-800/80 hover:bg-slate-700 text-indigo-300 font-extrabold text-[11px] px-3.5 py-2 rounded-xl border border-white/10 transition flex items-center gap-1.5"
                >
                  <Plus className="h-4 w-4" /> Add Showtime
                </button>
              </div>
            </div>

            {/* Shows Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {event.shows?.map((show: any) => (
                <div key={show.showId} className="glass-card p-5 rounded-2xl space-y-3">
                  <div className="flex justify-between items-start text-xs">
                    <div>
                      <p className="font-extrabold text-white flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 text-indigo-400" /> {show.venueName}
                      </p>
                      <p className="text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <Calendar className="h-4 w-4 text-amber-400" /> {new Date(show.startTime).toLocaleString()}
                      </p>
                    </div>
                    <span className="font-black text-emerald-400 text-base">${show.revenue?.toFixed(2)}</span>
                  </div>

                  {/* Occupancy Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400 font-semibold">
                      <span>Occupancy: {show.ticketsSold} / {show.totalSeats} seats</span>
                      <span className="font-bold text-indigo-400">{show.occupancyRate}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-white/10">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                        style={{ width: `${Math.min(100, show.occupancyRate)}%` }}
                      />
                    </div>
                  </div>

                  {show.waitlistLength > 0 && (
                    <div className="text-[11px] text-amber-300 bg-amber-950/60 p-2.5 rounded-xl border border-amber-500/40 flex items-center justify-between font-semibold">
                      <span>Waitlist Queue:</span>
                      <span className="font-black text-amber-400">{show.waitlistLength} candidate(s)</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Modal Forms */}
      {showEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4">
          <div className="glass-panel border border-white/15 rounded-3xl w-full max-w-md p-6 shadow-2xl relative">
            <button onClick={() => setShowEventModal(false)} className="absolute top-4 right-4 text-slate-400">✕</button>
            <h3 className="text-xl font-bold text-white mb-4">Create New Event Listing</h3>
            <form onSubmit={handleCreateEvent} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Event Title</label>
                <input
                  type="text"
                  required
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="Interstellar IMAX Re-Release"
                  className="w-full bg-slate-950/80 border border-white/10 rounded-xl p-3 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Description</label>
                <textarea
                  required
                  rows={3}
                  value={eventDesc}
                  onChange={(e) => setEventDesc(e.target.value)}
                  placeholder="Synopsis & event details..."
                  className="w-full bg-slate-950/80 border border-white/10 rounded-xl p-3 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Category</label>
                  <select
                    value={eventCat}
                    onChange={(e) => setEventCat(e.target.value)}
                    className="w-full bg-slate-950/80 border border-white/10 rounded-xl p-3 text-white"
                  >
                    <option value="MOVIE">Movie</option>
                    <option value="CONCERT">Concert</option>
                    <option value="THEATRE">Theatre</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Duration (Mins)</label>
                  <input
                    type="number"
                    value={eventDuration}
                    onChange={(e) => setEventDuration(Number(e.target.value))}
                    className="w-full bg-slate-950/80 border border-white/10 rounded-xl p-3 text-white"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-3.5 rounded-xl shadow-lg glow-indigo transition mt-2 text-sm"
              >
                Create Event Listing
              </button>
            </form>
          </div>
        </div>
      )}

      {showShowModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4">
          <div className="glass-panel border border-white/15 rounded-3xl w-full max-w-md p-6 shadow-2xl relative">
            <button onClick={() => setShowShowModal(false)} className="absolute top-4 right-4 text-slate-400">✕</button>
            <h3 className="text-xl font-bold text-white mb-4">Add Showtime Schedule</h3>
            <form onSubmit={handleCreateShow} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Venue</label>
                <select
                  value={venueId}
                  onChange={(e) => setVenueId(e.target.value)}
                  className="w-full bg-slate-950/80 border border-white/10 rounded-xl p-3 text-white"
                >
                  {venues.map((v) => (
                    <option key={v.id} value={v.id}>{v.name} ({v.city})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Start Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-slate-950/80 border border-white/10 rounded-xl p-3 text-white"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">VIP Price</label>
                  <input
                    type="number"
                    value={vipPrice}
                    onChange={(e) => setVipPrice(Number(e.target.value))}
                    className="w-full bg-slate-950/80 border border-white/10 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Prem Price</label>
                  <input
                    type="number"
                    value={premiumPrice}
                    onChange={(e) => setPremiumPrice(Number(e.target.value))}
                    className="w-full bg-slate-950/80 border border-white/10 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Std Price</label>
                  <input
                    type="number"
                    value={standardPrice}
                    onChange={(e) => setStandardPrice(Number(e.target.value))}
                    className="w-full bg-slate-950/80 border border-white/10 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-3.5 rounded-xl shadow-lg glow-indigo transition mt-2 text-sm"
              >
                Create Showtime & Seats
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
