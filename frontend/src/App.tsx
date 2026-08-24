import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { ToastProvider } from './components/Toast';
import { AmbientBackground } from './components/AmbientBackground';
import { Navbar } from './components/Navbar';
import { HomePage } from './pages/HomePage';
import { EventDetailPage } from './pages/EventDetailPage';
import { SeatSelectionPage } from './pages/SeatSelectionPage';
import { BookingSuccessPage } from './pages/BookingSuccessPage';
import { MyBookingsPage } from './pages/MyBookingsPage';
import { ClaimOfferPage } from './pages/ClaimOfferPage';
import { OrganiserDashboardPage } from './pages/OrganiserDashboardPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <CurrencyProvider>
        <ToastProvider>
          <Router>
            <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col justify-between relative overflow-hidden">
              <AmbientBackground />
              <div>
                <Navbar />
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/events/:id" element={<EventDetailPage />} />
                  <Route path="/seats/:showId" element={<SeatSelectionPage />} />
                  <Route path="/booking-success/:id" element={<BookingSuccessPage />} />
                  <Route path="/my-bookings" element={<MyBookingsPage />} />
                  <Route path="/claim-offer/:token" element={<ClaimOfferPage />} />
                  <Route path="/organiser" element={<OrganiserDashboardPage />} />
                  <Route path="/admin" element={<AdminDashboardPage />} />
                </Routes>
              </div>

              <footer className="border-t border-white/10 holy-glass py-8 text-center text-xs text-slate-400">
                <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <p>© 2026 Ticket Booking System. Interactive Ambient Background & Concurrency Engine.</p>
                  <div className="flex space-x-4 text-indigo-300 font-bold">
                    <span>Firebase Auth</span>
                    <span>•</span>
                    <span>Socket.IO Sync</span>
                    <span>•</span>
                    <span>Multi-Currency ($ € £ ₹)</span>
                    <span>•</span>
                    <span>QR E-Tickets</span>
                  </div>
                </div>
              </footer>
            </div>
          </Router>
        </ToastProvider>
      </CurrencyProvider>
    </AuthProvider>
  );
};

export default App;
