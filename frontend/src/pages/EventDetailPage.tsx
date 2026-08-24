import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, MapPin, Clock, ArrowRight, Film } from 'lucide-react';
import { apiRequest } from '../api';
import { useCurrency } from '../context/CurrencyContext';
import { EventReviews } from '../components/EventReviews';

export const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { formatPrice } = useCurrency();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEvent() {
      try {
        const data = await apiRequest(`/events/${id}`);
        setEvent(data);
      } catch (err) {
        console.error('Error fetching event:', err);
      } finally {
        setLoading(false);
      }
    }
    loadEvent();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen ambient-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen ambient-bg text-center py-24">
        <h2 className="text-2xl font-bold text-white">Event Not Found</h2>
        <Link to="/" className="text-indigo-400 underline mt-4 inline-block text-xs font-semibold">Return to Catalog</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen ambient-bg pb-24">
      {/* Banner */}
      <div className="relative h-80 sm:h-96 bg-slate-950 border-b border-white/10 overflow-hidden">
        <img
          src={event.bannerUrl || event.posterUrl}
          alt={event.title}
          className="w-full h-full object-cover opacity-30 blur-xs"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />

        <div className="absolute bottom-6 left-0 right-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-end gap-6">
          <img
            src={event.posterUrl}
            alt={event.title}
            className="w-32 sm:w-44 rounded-2xl border-2 border-white/20 shadow-2xl shrink-0 bg-slate-900 glow-indigo"
          />
          <div className="space-y-2">
            <span className="bg-indigo-950/80 text-indigo-300 border border-indigo-500/40 text-[10px] font-extrabold px-3 py-1 rounded-lg uppercase tracking-widest">
              {event.category}
            </span>
            <h1 className="text-3xl sm:text-5xl font-black text-white">{event.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 font-semibold">
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-slate-400" /> {event.durationMinutes} Minutes
              </span>
              <span className="flex items-center gap-1.5">
                <Film className="h-4 w-4 text-slate-400" /> Organised by {event.organiser?.name}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Details, Showtimes & Reviews */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left Synopsis */}
          <div className="space-y-6">
            <div className="glass-panel border border-white/10 rounded-3xl p-6 space-y-3 shadow-xl">
              <h3 className="text-lg font-black text-white">About the Event</h3>
              <p className="text-xs text-slate-300 leading-relaxed">{event.description}</p>
            </div>
          </div>

          {/* Right Showtimes List */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-2xl font-black text-white mb-6">Select Showtime & Venue</h2>

            {event.shows && event.shows.length > 0 ? (
              <div className="space-y-4">
                {event.shows.map((show: any) => (
                  <div
                    key={show.id}
                    className="glass-card rounded-3xl p-6 hover:border-indigo-500/50 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-indigo-400" />
                        <span className="font-extrabold text-base text-white">{show.venue.name}</span>
                        <span className="text-xs text-slate-400">({show.venue.city})</span>
                      </div>

                      <div className="flex items-center space-x-2 text-xs text-amber-400 font-bold">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(show.startTime).toLocaleString()}</span>
                      </div>

                      <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-400">
                        <span>VIP: <strong className="text-amber-400">{formatPrice(show.vipPrice)}</strong></span>
                        <span>Premium: <strong className="text-indigo-400">{formatPrice(show.premiumPrice)}</strong></span>
                        <span>Standard: <strong className="text-slate-300">{formatPrice(show.standardPrice)}</strong></span>
                      </div>
                    </div>

                    <Link
                      to={`/seats/${show.id}`}
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-black px-6 py-3.5 rounded-2xl transition shadow-lg glow-indigo flex items-center gap-2 shrink-0"
                    >
                      <span>View Visual Seat Map</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass-panel border border-white/10 rounded-3xl p-8 text-center text-slate-400 text-sm">
                No upcoming showtimes scheduled for this event.
              </div>
            )}
          </div>
        </div>

        {/* Customer Reviews Component */}
        <EventReviews eventTitle={event.title} />
      </div>
    </div>
  );
};
