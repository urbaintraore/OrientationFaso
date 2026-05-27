import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, Check, MessageSquare, Loader2, Award } from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface RecommendationRatingProps {
  recommendationType: 'bepc' | 'bac';
  recommendationTitle: string;
  userId?: string | null;
}

export function RecommendationRating({ recommendationType, recommendationTitle, userId }: RecommendationRatingProps) {
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Read existing rating from localStorage to prevent duplicates
  const storageKey = `rating_${recommendationType}_${recommendationTitle.replace(/[^a-zA-Z0-9]/g, '_')}`;

  useEffect(() => {
    const existing = localStorage.getItem(storageKey);
    if (existing) {
      try {
        const parsed = JSON.parse(existing);
        setRating(parsed.rating || 0);
        setComment(parsed.comment || '');
        setIsSubmitted(true);
      } catch (e) {
        // Safe fallback
      }
    }
  }, [storageKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    const feedbackData = {
      recommendationType,
      recommendationTitle,
      rating,
      comment,
      userId: userId || auth.currentUser?.uid || 'anonymous',
      userEmail: auth.currentUser?.email || 'anonymous@orientationbf.com',
      createdAt: new Date().toISOString()
    };

    try {
      // 1. Try persisting in Firestore
      // Using direct addDoc to an un-validated collection or embedding as a general rating
      // Under a safe generic feedback collection
      const feedbackCol = collection(db, 'recommendation_feedback');
      await addDoc(feedbackCol, {
        ...feedbackData,
        timestamp: serverTimestamp()
      });
    } catch (err: any) {
      console.warn("Could not save evaluation in Firestore. Backing up to localStorage:", err.message);
      // We don't crash the app since the user gave valuable feedback, we save it locally!
    }

    // 2. Always persist in localStorage to remember submitted state
    localStorage.setItem(storageKey, JSON.stringify({ rating, comment, date: new Date().toISOString() }));
    setIsSubmitted(true);
    setIsSubmitting(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/50 p-6 md:p-8 rounded-3xl border border-indigo-100 shadow-sm max-w-2xl mx-auto my-8 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-600/5 blur-2xl rounded-full"></div>
      
      <div className="flex items-start gap-4 mb-4">
        <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-2xl">
          <Award className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-black text-lg text-slate-900 tracking-tight">Votre avis compte beaucoup pour nous !</h4>
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mt-0.5">Évaluation de la pertinence de l'IA</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!isSubmitted ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <p className="text-sm text-slate-600 font-medium mb-3">
                Quelle est la pertinence de notre recommandation pour <span className="text-indigo-600 font-black">"{recommendationTitle}"</span> ?
              </p>
              
              <div className="flex items-center gap-2 py-1">
                {[1, 2, 3, 4, 5].map((star) => {
                  const isActive = star <= (hoverRating || rating);
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 transition-transform active:scale-90"
                    >
                      <Star 
                        className={`w-8 h-8 transition-colors duration-200 stroke-[1.5] ${
                          isActive 
                            ? 'fill-amber-400 text-amber-500 scale-105 filter drop-shadow-[0_2px_4px_rgba(245,158,11,0.2)]' 
                            : 'text-slate-300 hover:text-slate-400'
                        }`} 
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {rating > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-4"
              >
                <div>
                  <label htmlFor="comment" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Commentaire ou suggestion (Optionnel)
                  </label>
                  <textarea
                    id="comment"
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Pourquoi cette note ? Comment pourrions-nous améliorer nos prédictions ?"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all text-sm outline-none placeholder:text-slate-400 font-medium bg-white"
                  />
                </div>

                <div className="flex gap-3 justify-end items-center">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-slate-900 text-white rounded-xl font-bold uppercase tracking-widest text-xs transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Envoi...
                      </>
                    ) : (
                      <>
                        <MessageSquare className="w-4 h-4" />
                        Soumettre mon avis
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </form>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center text-center py-6"
          >
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
              <Check className="w-6 h-6" />
            </div>
            <h5 className="font-bold text-slate-900 text-lg mb-1">Merci beaucoup pour votre retour !</h5>
            <p className="text-slate-500 text-sm font-medium max-w-md">
              Vos réponses aident nos ingénieurs IA à affiner l'algorithme d'orientation au Burkina Faso.
            </p>
            <div className="flex items-center gap-1.5 mt-4 bg-amber-50 text-amber-800 px-3 py-1.5 rounded-full border border-amber-100 text-xs font-bold font-mono">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`w-3.5 h-3.5 ${i < rating ? 'fill-amber-400 text-amber-500' : 'text-slate-200'}`} />
              ))}
              <span className="ml-1 pr-1">{rating}/5</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
