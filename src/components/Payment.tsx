import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Smartphone, CheckCircle, Loader2, Lock, AlertCircle, MessageCircle, Info, Copy, Check } from 'lucide-react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

interface PaymentProps {
  onPaymentComplete: () => void;
}

const MERCHANT_NUMBERS = {
  orange: '+226 07 41 41 41',
  moov: '+226 01 21 21 21',
  telecel: '+226 05 11 11 11'
};

export function Payment({ onPaymentComplete }: PaymentProps) {
  const [method, setMethod] = useState<'orange' | 'moov' | 'telecel'>('orange');
  const [step, setStep] = useState<'selection' | 'instructions' | 'notified'>('selection');
  const [isLoading, setIsLoading] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNotifyPayment = async () => {
    if (!auth.currentUser) {
      setError("Tu dois être connecté pour notifier un paiement.");
      return;
    }

    setIsLoading(true);
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        paymentStatus: 'pending',
        paymentMethod: method,
        paymentTransactionId: transactionId,
        paymentDate: serverTimestamp(),
        hasPaid: false // Ensure it remains false until admin validation
      });
      setStep('notified');
    } catch (err) {
      console.error("Error notifying payment:", err);
      setError("Une erreur est survenue lors de la notification. Réessaie ou contacte l'administrateur.");
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'notified') {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md mx-auto bg-white p-8 rounded-3xl shadow-xl border border-emerald-100 text-center"
      >
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Paiement Notifié !</h2>
        <p className="text-slate-600 mb-6">
          Ton paiement est en cours de validation par l'administrateur. 
          Tu recevras l'accès à ton rapport complet dès que la transaction sera confirmée.
        </p>
        <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-amber-700 text-sm mb-8">
          <div className="flex gap-2 items-start text-left">
            <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p>Le délai de validation est généralement de moins de 30 minutes pendant les heures ouvrables.</p>
          </div>
        </div>
        <button
          onClick={onPaymentComplete}
          className="w-full py-4 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors"
        >
          Retour au tableau de bord
        </button>
        
        <a 
          href="https://wa.me/22663375257"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 flex items-center justify-center gap-2 text-indigo-600 font-medium hover:underline"
        >
          <MessageCircle className="w-5 h-5" />
          Contacter l'admin sur WhatsApp
        </a>
      </motion.div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Paiement Manuel</h2>
        <p className="text-slate-600">
          Accède à ton analyse complète pour seulement <span className="font-bold text-indigo-600">2000 FCFA</span>
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100"
      >
        {step === 'selection' ? (
          <div className="space-y-6">
            <p className="text-sm font-medium text-slate-700">Choisissez votre mode de paiement :</p>
            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => setMethod('orange')}
                className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                  method === 'orange' ? 'border-orange-500 bg-orange-50' : 'border-slate-100 hover:border-slate-200'
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center text-white font-black text-xl">OM</div>
                <div className="text-left">
                  <div className="font-bold text-slate-900">Orange Money</div>
                  <div className="text-xs text-slate-500">Paiement direct via code ou transfert</div>
                </div>
              </button>
              
              <button
                onClick={() => setMethod('moov')}
                className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                  method === 'moov' ? 'border-blue-500 bg-blue-50' : 'border-slate-100 hover:border-slate-200'
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-xl">MM</div>
                <div className="text-left">
                  <div className="font-bold text-slate-900">Moov Money</div>
                  <div className="text-xs text-slate-500">Paiement rapide et sécurisé</div>
                </div>
              </button>

              <button
                onClick={() => setMethod('telecel')}
                className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                  method === 'telecel' ? 'border-amber-500 bg-amber-50' : 'border-slate-100 hover:border-slate-200'
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center text-white font-black text-xl">TM</div>
                <div className="text-left">
                  <div className="font-bold text-slate-900">Telecel Money</div>
                  <div className="text-xs text-slate-500">Service Telecel Cash</div>
                </div>
              </button>
            </div>

            <button
              onClick={() => setStep('instructions')}
              className="w-full py-4 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
            >
              Continuer vers le paiement
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <button 
              onClick={() => setStep('selection')}
              className="text-indigo-600 text-sm font-medium hover:underline"
            >
              ← Retour au choix du mode
            </button>

            <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
              <h3 className="font-bold text-indigo-900 mb-4 flex items-center gap-2">
                <Info className="w-5 h-5" />
                Instructions de paiement
              </h3>
              <p className="text-sm text-indigo-800 mb-4">
                Veuillez effectuer un transfert de <span className="font-bold text-lg">2000 FCFA</span> au numéro suivant :
              </p>
              
              <div className="bg-white p-3 rounded-xl border border-indigo-200 flex items-center justify-between group">
                <span className="font-mono text-lg font-bold text-slate-900">{MERCHANT_NUMBERS[method]}</span>
                <button 
                  onClick={() => handleCopy(MERCHANT_NUMBERS[method])}
                  className="p-2 hover:bg-indigo-50 rounded-lg text-indigo-600 transition-colors"
                  title="Copier le numéro"
                >
                  {copied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-[10px] text-indigo-500 mt-2 text-center uppercase tracking-widest font-black">
                {method.toUpperCase()} MONEY BURKINA
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-xs text-slate-500 mb-3">
                  Une fois le paiement effectué, saisissez la référence de la transaction ou votre numéro de téléphone pour notification.
                </p>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="ID Transaction ou Numéro"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-xl">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <button
                onClick={handleNotifyPayment}
                disabled={isLoading}
                className="w-full py-4 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Notification...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    J'ai effectué le paiement
                  </>
                )}
              </button>
            </div>

            <div className="flex flex-col items-center gap-3 pt-4">
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <Lock className="w-3 h-3" />
                Validation manuelle sécurisée
              </p>
              <a 
                href={`https://wa.me/22663375257?text=Bonjour, je viens d'effectuer un paiement de 2000 FCFA via ${method} pour mon rapport d'orientation.`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1.5"
              >
                <MessageCircle className="w-4 h-4" />
                Un problème ? Contactez-nous sur WhatsApp
              </a>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
