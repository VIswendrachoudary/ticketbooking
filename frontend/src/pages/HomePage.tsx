import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Film, Music, Compass, Calendar, MapPin, ArrowRight, Zap } from 'lucide-react';
import { apiRequest } from '../api';

export const HomePage: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadEvents() {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (categoryFilter !== 'ALL') queryParams.append('category', categoryFilter);
        if (searchQuery) queryParams.append('search', searchQuery);

        const data = await apiRequest(`/events?${queryParams.toString()}`);
        setEvents(data);
      } catch (err) {
        console.error('Error fetching events:', err);
      } finally {
        setLoading(false);
      }
    }
    loadEvents();
  }, [categoryFilter, searchQuery]);

  return (
    <div className="min-h-screen ambient-bg pb-24">
      {/* Hero Section */}
      <div className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-5xl mx-auto text-center space-y-8 relative z-10">
          {/* Badge Tag */}
          <div className="inline-flex items-center space-x-2.5 bg-indigo-950/80 border border-indigo-500/40 px-4 py-2 rounded-full text-indigo-300 text-xs font-extrabold shadow-xl backdrop-blur-xl">
            <Zap className="h-4 w-4 text-amber-400 animate-pulse" />
            <span>Real-Time Concurrency Engine • Instant QR Tickets • Automated Waitlist</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-7xl font-black tracking-tight leading-none text-white">
            Book Movies & Concerts <br />
            <span className="bg-gradient-to-r from-indigo-300 via-purple-300 to-amber-300 bg-clip-text text-transparent">
              In 3D Visual Map
            </span>
          </h1>

          <p className="text-slate-300 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed font-medium">
            Reserve exact seats from interactive 3D venue grids, lock tickets with 10-minute hold protection, and receive instant QR code tickets delivered to your inbox.
          </p>

          {/* Clean Glass Flex Search Bar */}
          <div className="max-w-xl mx-auto pt-2">
            <div className="flex items-center space-x-3.5 holy-glass border border-white/20 rounded-2xl px-5 py-3.5 shadow-2xl focus-within:border-indigo-400 focus-within:holy-glow-indigo transition-all">
              <Search className="h-5 w-5 text-indigo-400 shrink-0" />
              <input
                type="text"
                placeholder="Search movies, concerts, artists, venues..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-white placeholder-slate-400 text-sm font-semibold focus:outline-none border-none ring-0 p-0"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Catalog */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Category Filters */}
        <div className="flex items-center space-x-3 overflow-x-auto pb-4 mb-10">
          {[
            { id: 'ALL', label: 'All Listings', icon: Compass },
            { id: 'MOVIE', label: 'Movies & IMAX', icon: Film },
            { id: 'CONCERT', label: 'Live Concerts', icon: Music },
          ].map((cat) => {
            const Icon = cat.icon;
            const active = categoryFilter === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`flex items-center space-x-2 px-5 py-2.5 rounded-2xl text-xs font-black transition border whitespace-nowrap ${
                  active
                    ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-amber-500 border-white text-white shadow-xl holy-glow-indigo'
                    : 'holy-glass border-white/15 text-slate-300 hover:border-white/30 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Event Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-96 holy-glass rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-24 holy-glass rounded-3xl border border-white/15">
            <Film className="h-12 w-12 text-slate-500 mx-auto mb-3" />
            <h3 className="text-lg font-black text-white">No Matching Events Found</h3>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your search criteria or filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.map((event) => (
              <div
                key={event.id}
                className="holy-card rounded-3xl overflow-hidden group flex flex-col justify-between"
              >
                {/* Event Poster Header */}
                <div>
                  <div className="relative h-60 overflow-hidden bg-slate-950">
                    <img
                      src={event.posterUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&q=80'}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-4 left-4 holy-glass px-3 py-1 rounded-xl border border-white/20 text-[10px] font-black text-indigo-300 uppercase tracking-widest">
                      {event.category}
                    </div>
                  </div>

                  {/* Body Info */}
                  <div className="p-6 space-y-3">
                    <h3 className="font-black text-xl text-white group-hover:text-indigo-400 transition line-clamp-1">
                      {event.title}
                    </h3>
                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                      {event.description}
                    </p>

                    <div className="space-y-2 pt-2 text-xs font-semibold">
                      {event.shows && event.shows.length > 0 ? (
                        <>
                          <div className="flex items-center space-x-2 text-slate-300">
                            <MapPin className="h-4 w-4 text-indigo-400 shrink-0" />
                            <span>{event.shows[0]?.venue?.name} ({event.shows[0]?.venue?.city})</span>
                          </div>
                          <div className="flex items-center space-x-2 text-amber-400 font-extrabold">
                            <Calendar className="h-4 w-4 shrink-0" />
                            <span>{new Date(event.shows[0]?.startTime).toLocaleString()}</span>
                          </div>
                        </>
                      ) : (
                        <p className="text-slate-500 italic">No showtimes scheduled yet</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Link */}
                <div className="p-6 pt-0">
                  <Link
                    to={`/events/${event.id}`}
                    className="w-full bg-indigo-600/30 hover:bg-gradient-to-r hover:from-indigo-600 hover:to-purple-600 text-white text-xs font-black py-3.5 rounded-2xl border border-indigo-500/40 hover:border-white/30 transition-all duration-300 flex items-center justify-center gap-2 group-hover:holy-glow-indigo shadow-lg"
                  >
                    <span>View Showtimes & Book Seats</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
