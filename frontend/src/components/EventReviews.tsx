import React, { useState } from 'react';
import { Star, MessageSquare, Plus, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export interface ReviewItem {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  verifiedBooking?: boolean;
}

const DEFAULT_REVIEWS: ReviewItem[] = [
  {
    id: 'r1',
    userName: 'Sarah Jenkins',
    rating: 5,
    comment: 'Spectacular show! The IMAX seat mapping worked flawlessly and checkout was super smooth.',
    date: '2 hours ago',
    verifiedBooking: true,
  },
  {
    id: 'r2',
    userName: 'Marcus Vance',
    rating: 5,
    comment: 'Joined the waitlist for VIP category when it sold out and got auto-offered a seat on cancellation within 10 mins!',
    date: '1 day ago',
    verifiedBooking: true,
  },
  {
    id: 'r3',
    userName: 'David Miller',
    rating: 4,
    comment: 'Great acoustics and clear view from Row C. Digital QR ticket scanned instantly at entry.',
    date: '3 days ago',
    verifiedBooking: true,
  },
];

export const EventReviews: React.FC<{ eventTitle: string }> = ({ eventTitle }) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<ReviewItem[]>(DEFAULT_REVIEWS);
  const [showModal, setShowModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const newReview: ReviewItem = {
      id: Date.now().toString(),
      userName: user.name,
      rating,
      comment,
      date: 'Just now',
      verifiedBooking: true,
    };

    setReviews([newReview, ...reviews]);
    setShowModal(false);
    setComment('');
  };

  const avgRating = (
    reviews.reduce((sum, r) => sum + r.rating, 0) / (reviews.length || 1)
  ).toFixed(1);

  return (
    <div className="space-y-6 pt-6">
      {/* Header & Rating Summary */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-6">
        <div className="flex items-center space-x-4">
          <div className="bg-amber-500/20 border border-amber-500/30 p-4 rounded-2xl text-center">
            <span className="text-3xl font-black text-amber-400">{avgRating}</span>
            <p className="text-[10px] uppercase font-bold text-slate-400 mt-0.5">out of 5.0</p>
          </div>
          <div>
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className="h-5 w-5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <h3 className="text-lg font-extrabold text-white mt-1">Audience Reviews & Ratings</h3>
            <p className="text-xs text-slate-400">{reviews.length} verified customer reviews</p>
          </div>
        </div>

        {user && (
          <button
            onClick={() => setShowModal(true)}
            className="bg-indigo-600/30 hover:bg-indigo-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl border border-indigo-500/40 transition flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> Write a Review
          </button>
        )}
      </div>

      {/* Reviews List */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {reviews.map((r) => (
          <div key={r.id} className="glass-card p-5 rounded-2xl space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-xs text-white">{r.userName}</span>
                <div className="flex space-x-0.5">
                  {[...Array(r.rating)].map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed italic">"{r.comment}"</p>
            </div>

            <div className="flex justify-between items-center pt-2 text-[10px] text-slate-400 border-t border-white/5">
              {r.verifiedBooking && (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Verified Booking
                </span>
              )}
              <span>{r.date}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4">
          <div className="glass-panel border border-white/15 rounded-3xl w-full max-w-md p-6 shadow-2xl relative">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-slate-400">✕</button>
            <h3 className="text-xl font-bold text-white mb-4">Write Audience Review</h3>
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Your Rating</label>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRating(star)}
                      className="p-1"
                    >
                      <Star className={`h-6 w-6 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Review Comments</label>
                <textarea
                  required
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your seat view, audio quality, and overall experience..."
                  className="w-full bg-slate-950/80 border border-white/10 rounded-xl p-3 text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl shadow-lg transition text-sm"
              >
                Submit Review
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
