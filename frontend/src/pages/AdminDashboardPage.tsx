import React, { useState, useEffect } from 'react';
import { ShieldCheck, MapPin, Grid, Plus, Users, DollarSign, Building } from 'lucide-react';
import { apiRequest } from '../api';

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [venues, setVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showVenueModal, setShowVenueModal] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [rowCount, setRowCount] = useState(8);
  const [colCount, setColCount] = useState(10);

  const loadData = async () => {
    setLoading(true);
    try {
      const [adminStats, venueList] = await Promise.all([
        apiRequest('/analytics/admin'),
        apiRequest('/venues'),
      ]);
      setStats(adminStats);
      setVenues(venueList);
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateVenue = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/venues', 'POST', {
        name,
        address,
        city,
        rowCount: Number(rowCount),
        colCount: Number(colCount),
      });
      setShowVenueModal(false);
      setName('');
      setAddress('');
      setCity('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create venue');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen ambient-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen ambient-bg pb-24 pt-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center space-x-2 text-purple-400 text-xs font-extrabold uppercase mb-1">
            <ShieldCheck className="h-4 w-4" /> System Administration
          </div>
          <h1 className="text-3xl font-black text-white">Admin Control Console</h1>
          <p className="text-xs text-slate-400 mt-0.5">Manage venue seat layout grids and view system platform analytics</p>
        </div>

        <button
          onClick={() => setShowVenueModal(true)}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs px-5 py-3 rounded-2xl transition flex items-center gap-2 shadow-lg glow-indigo"
        >
          <Plus className="h-4 w-4" /> Add New Venue Layout
        </button>
      </div>

      {/* Platform Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <div className="glass-panel rounded-3xl p-5 space-y-2 border border-white/10">
          <div className="flex justify-between items-center text-purple-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Platform Revenue</span>
            <DollarSign className="h-5 w-5" />
          </div>
          <p className="text-2xl font-black text-white">${stats?.totalPlatformRevenue?.toFixed(2) || '0.00'}</p>
        </div>

        <div className="glass-panel rounded-3xl p-5 space-y-2 border border-white/10">
          <div className="flex justify-between items-center text-indigo-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Users</span>
            <Users className="h-5 w-5" />
          </div>
          <p className="text-2xl font-black text-white">{stats?.totalUsers || 0}</p>
        </div>

        <div className="glass-panel rounded-3xl p-5 space-y-2 border border-white/10">
          <div className="flex justify-between items-center text-amber-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Venues</span>
            <Building className="h-5 w-5" />
          </div>
          <p className="text-2xl font-black text-white">{stats?.totalVenues || 0}</p>
        </div>

        <div className="glass-panel rounded-3xl p-5 space-y-2 border border-white/10">
          <div className="flex justify-between items-center text-emerald-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Shows</span>
            <Grid className="h-5 w-5" />
          </div>
          <p className="text-2xl font-black text-white">{stats?.totalShows || 0}</p>
        </div>
      </div>

      {/* Venues Grid */}
      <div className="space-y-6">
        <h2 className="text-xl font-black text-white">Configured Venues & Seat Layout Grids</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {venues.map((venue) => (
            <div key={venue.id} className="glass-card rounded-3xl p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-extrabold text-lg text-white">{venue.name}</h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <MapPin className="h-4 w-4 text-indigo-400" /> {venue.address}, {venue.city}
                  </p>
                </div>
                <span className="text-[10px] font-extrabold px-3 py-1 rounded-lg bg-purple-950/80 text-purple-300 border border-purple-500/40">
                  {venue.rowCount} Rows × {venue.colCount} Cols
                </span>
              </div>

              <div className="glass-panel p-4 rounded-2xl border border-white/10 flex justify-between text-xs text-slate-300">
                <span>Seat Grid Capacity: <strong className="text-white font-black">{venue._count?.seats || (venue.rowCount * venue.colCount)}</strong></span>
                <span>Shows Hosted: <strong className="text-indigo-400 font-extrabold">{venue._count?.shows || 0}</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Venue Modal */}
      {showVenueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4">
          <div className="glass-panel border border-white/15 rounded-3xl w-full max-w-md p-6 shadow-2xl relative">
            <button onClick={() => setShowVenueModal(false)} className="absolute top-4 right-4 text-slate-400">✕</button>
            <h3 className="text-xl font-bold text-white mb-4">Add New Venue Layout</h3>
            <form onSubmit={handleCreateVenue} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Venue Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Metropolitan Opera Arena"
                  className="w-full bg-slate-950/80 border border-white/10 rounded-xl p-3 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Street Address</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="30 Lincoln Center Plaza"
                  className="w-full bg-slate-950/80 border border-white/10 rounded-xl p-3 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">City</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="New York"
                  className="w-full bg-slate-950/80 border border-white/10 rounded-xl p-3 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Row Count (A-Z)</label>
                  <input
                    type="number"
                    min={1}
                    max={26}
                    value={rowCount}
                    onChange={(e) => setRowCount(Number(e.target.value))}
                    className="w-full bg-slate-950/80 border border-white/10 rounded-xl p-3 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Column Count</label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={colCount}
                    onChange={(e) => setColCount(Number(e.target.value))}
                    className="w-full bg-slate-950/80 border border-white/10 rounded-xl p-3 text-white"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-3.5 rounded-xl shadow-lg glow-indigo transition mt-2 text-sm"
              >
                Save Venue & Instantiate Grid
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
