import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Smartphone, CreditCard, CheckCircle, Loader2, Lock, AlertCircle } from 'lucide-react';

interface PaymentProps {
  onPaymentComplete: () => void;
}

export function Payment({ onPaymentComplete }: PaymentProps) {
  const [method, setMethod] = useState<'orange' | 'moov'>('orange');
  const [isLoading, setIsLoading] = useState(false);
  const [phone, setPhone] = useState('');
  const [confirmPhone, setConfirmPhone] = useState('');
  const [error, setError] = useState('');

  const validatePhone = (number: string, type: 'orange' | 'moov') => {
    // Remove spaces, dashes, dots, parentheses
    let cleanNumber = number.replace(/[\s\-\.\(\)]/g, '');

    // Remove country code (+226 or 00226 or 226)
    if (cleanNumber.startsWith('+226')) {
      cleanNumber = cleanNumber.slice(4);
    } else if (cleanNumber.startsWith('00226')) {
      cleanNumber = cleanNumber.slice(5);
    } else if (cleanNumber.startsWith('226')) {
       cleanNumber = cleanNumber.slice(3);
    }
    
    if (!/^\d{8}$/.test(cleanNumber)) {
      return "Le numéro doit contenir exactement 8 chiffres.";
    }

    if (type === 'orange') {
      // Format Orange Burkina: 07 XX XX XX XX
      if (!/^07/.test(cleanNumber)) {
        return "Pour Orange, le numéro doit obligatoirement commencer par 07.";
      }
    } else {
      // Format Moov Burkina: 01 XX XX XX XX
      if (!/^01/.test(cleanNumber)) {
        return "Pour Moov, le numéro doit obligatoirement commencer par 01.";
      }
    }
    return "";
  };

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (phone !== confirmPhone) {
      setError("Les deux numéros de téléphone ne correspondent pas.");
      return;
    }

    const validationError = validatePhone(phone, method);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    // Simulate payment processing
    setTimeout(() => {
      setIsLoading(false);
      onPaymentComplete();
    }, 2000);
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Paiement Sécurisé</h2>
        <p className="text-slate-600">
          Accède à ton analyse complète pour seulement <span className="font-bold text-indigo-600">2000 FCFA</span>
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100"
      >
        <div className="flex gap-4 mb-6">
          <button
            type="button"
            onClick={() => {
              setMethod('orange');
              setError('');
            }}
            className={`flex-1 p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
              method === 'orange'
                ? 'border-orange-500 bg-orange-50 text-orange-700'
                : 'border-slate-100 hover:border-slate-200 text-slate-600'
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold">OM</div>
            <span className="font-medium text-sm">Orange Money</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMethod('moov');
              setError('');
            }}
            className={`flex-1 p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
              method === 'moov'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-slate-100 hover:border-slate-200 text-slate-600'
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">MM</div>
            <span className="font-medium text-sm">Moov Money</span>
          </button>
        </div>

        <form onSubmit={handlePayment} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Numéro de téléphone {method === 'orange' ? 'Orange' : 'Moov'}
            </label>
            <div className="relative">
              <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (error) setError('');
                }}
                className={`w-full pl-10 pr-4 py-3 rounded-xl border outline-none transition-all ${
                  error 
                    ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200' 
                    : 'border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200'
                }`}
                placeholder="XX XX XX XX"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Confirmez le numéro de téléphone
            </label>
            <div className="relative">
              <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="tel"
                required
                value={confirmPhone}
                onChange={(e) => {
                  setConfirmPhone(e.target.value);
                  if (error) setError('');
                }}
                className={`w-full pl-10 pr-4 py-3 rounded-xl border outline-none transition-all ${
                  error 
                    ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200' 
                    : 'border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200'
                }`}
                placeholder="XX XX XX XX"
              />
            </div>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 mt-2 text-sm text-red-600"
              >
                <AlertCircle className="w-4 h-4" />
                {error}
              </motion.div>
            )}
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
            <span className="text-slate-600">Total à payer</span>
            <span className="text-xl font-bold text-slate-900">2000 FCFA</span>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Traitement...
              </>
            ) : (
              <>
                <Lock className="w-5 h-5" />
                Payer 2000 FCFA
              </>
            )}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
          <CheckCircle className="w-4 h-4" />
          Paiement sécurisé et crypté
        </div>
      </motion.div>
    </div>
  );
}
