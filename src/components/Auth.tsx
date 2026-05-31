import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, Mail, Lock, ArrowRight, Loader2, GraduationCap, Building2, Users, KeyRound } from 'lucide-react';
import { auth, db, handleFirestoreError, OperationType, isFirebaseConfigured } from '../lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { FileUploader } from './FileUploader';
import { INSTITUTION_TYPES } from '../constants';
import { InstitutionType } from '../types';

interface AuthProps {
  onLogin: (email?: string, password?: string) => void;
}

type UserProfileType = 'student' | 'etablissement' | 'parent';
type EleveLevel = '3eme' | 'terminale' | 'autre';

export function Auth({ onLogin }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [errorDetails, setErrorDetails] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Nouveaux champs pour l'inscription
  const [profileType, setProfileType] = useState<UserProfileType>('student');
  const [eleveLevel, setEleveLevel] = useState<EleveLevel>('terminale');
  
  // Champs Établissement
  const [instName, setInstName] = useState('');
  const [instType, setInstType] = useState<InstitutionType>('Université Publique');
  const [instDescription, setInstDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  // Champs Parent
  const [childName, setChildName] = useState('');
  const [childLevel, setChildLevel] = useState<EleveLevel>('terminale');

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorDetails("Veuillez entrer votre adresse e-mail pour réinitialiser le mot de passe.");
      return;
    }
    setErrorDetails('');
    setSuccessMessage('');
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMessage("Lien envoyé ! Si l'adresse est enregistrée, vous recevrez un e-mail d'ici quelques minutes. Pensez à vérifier vos courriers indésirables (Spam).");
      // On ne ferme pas tout de suite pour que l'utilisateur lise le message
      setTimeout(() => {
        setIsResettingPassword(false);
        setSuccessMessage('');
      }, 5000);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-email') {
        setErrorDetails("Aucun compte ne correspond à cette adresse e-mail.");
      } else if (err.code === 'auth/network-request-failed') {
        setErrorDetails("Erreur de connexion. Veuillez vérifier votre réseau ou désactiver temporairement votre antivirus (ex: Kaspersky) ou bloqueur de publicités qui pourrait bloquer la requête.");
      } else {
        setErrorDetails(err.message || "Une erreur est survenue lors de la réinitialisation.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorDetails('');
    setSuccessMessage('');

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (isResettingPassword) {
      return handleResetPassword(e);
    }

    if (!isLogin && profileType === 'student' && !eleveLevel) {
      setErrorDetails("Veuillez préciser si vous êtes en 3ème ou en Terminale.");
      return;
    }
    setIsLoading(true);

    try {
      if (isLogin) {
        // Bypass checks for testing & when Firebase is not configured
        if (cleanEmail === 'admin@orientationbf.com' && cleanPassword === 'admin123') {
          onLogin(cleanEmail, cleanPassword);
          return;
        }
        if (!isFirebaseConfigured) {
          onLogin(cleanEmail, cleanPassword);
          return;
        }

        await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
        onLogin(cleanEmail, cleanPassword);
      } else {
        if (!isFirebaseConfigured) {
          const userProfile: any = {
            uid: "demo-local-user",
            email: cleanEmail,
            displayName: fullName || 'Utilisateur Démo',
            photoUrl: photoUrl || '',
            profileType,
            createdAt: new Date().toISOString(),
            hasPaid: true
          };

          if (profileType === 'student') {
            userProfile.level = eleveLevel;
          } else if (profileType === 'etablissement') {
            userProfile.institutionName = instName;
            userProfile.institutionType = instType;
            userProfile.description = instDescription;
          } else if (profileType === 'parent') {
            userProfile.childName = childName;
            userProfile.childLevel = childLevel;
          }

          localStorage.setItem('orientationbf_demo_user_profile', JSON.stringify(userProfile));
          onLogin(cleanEmail, cleanPassword);
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPassword);
        const user = userCredential.user;

        // Mettre à jour le profil
        await updateProfile(user, { displayName: fullName });

        // Enregistrer dans Firestore
        const userProfile: any = {
          uid: user.uid,
          email: user.email,
          displayName: fullName,
          photoUrl: photoUrl || '',
          profileType,
          createdAt: new Date().toISOString()
        };

        if (profileType === 'student') {
          userProfile.level = eleveLevel;
        } else if (profileType === 'etablissement') {
          userProfile.institutionName = instName;
          userProfile.institutionType = instType;
          userProfile.description = instDescription;
        } else if (profileType === 'parent') {
          userProfile.childName = childName;
          userProfile.childLevel = childLevel;
        }

        try {
          await setDoc(doc(db, 'users', user.uid), userProfile);
        } catch (dbError) {
          handleFirestoreError(dbError, OperationType.CREATE, 'users');
        }

        onLogin(cleanEmail, cleanPassword);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setErrorDetails("Cette adresse e-mail est déjà associée à un compte. Veuillez basculer vers l'onglet 'Connexion' pour vous connecter.");
      } else if (err.code === 'auth/invalid-credential') {
        setErrorDetails("Identifiants incorrects. Veuillez vérifier votre e-mail et votre mot de passe.");
      } else if (err.code === 'auth/network-request-failed') {
        setErrorDetails("Erreur de connexion. Veuillez vérifier votre réseau ou désactiver temporairement votre antivirus (ex: Kaspersky) ou bloqueur de publicités qui pourrait bloquer la requête Firebase.");
      } else {
        setErrorDetails(err.message || "Une erreur est survenue lors de l'authentification.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formTitle = isResettingPassword 
    ? 'Réinitialiser le mot de passe'
    : isLogin ? 'Connexion' : 'Créer un compte';

  const formSubtitle = isResettingPassword
    ? "Entrez votre adresse e-mail pour recevoir un lien de réinitialisation."
    : "Connecte-toi pour accéder à ton espace OrientationBF";

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">
          {formTitle}
        </h2>
        <p className="text-slate-600">
          {formSubtitle}
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100"
      >
        {!isFirebaseConfigured && (
          <div className="mb-6 text-xs text-amber-800 bg-amber-50 p-3.5 rounded-xl border border-amber-200 leading-relaxed">
            <span className="font-semibold block mb-1">⚠️ Mode Démo active (Sans Firebase)</span>
            Puisque la base de données Firebase n'est pas encore configurée, l'application fonctionne entièrement en <strong>mode local autonome</strong>.
            Vous pouvez vous connecter librement avec n'importe quelle adresse e-mail ou le compte de test : 
            <div className="mt-1 bg-white bg-opacity-60 p-1.5 rounded font-mono text-[10px] text-slate-700">
              Email : admin@orientationbf.com <br/>
              M.P. : admin123
            </div>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && !isResettingPassword && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">Je suis un(e) :</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setProfileType('student')}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                      profileType === 'student' 
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                        : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-indigo-200'
                    }`}
                  >
                    <GraduationCap className={`w-6 h-6 mb-1 ${profileType === 'student' ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span className="text-xs font-semibold">Élève</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setProfileType('parent')}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                      profileType === 'parent' 
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                        : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-indigo-200'
                    }`}
                  >
                    <Users className={`w-6 h-6 mb-1 ${profileType === 'parent' ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span className="text-xs font-semibold">Parent</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setProfileType('etablissement')}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                      profileType === 'etablissement' 
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                        : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-indigo-200'
                    }`}
                  >
                    <Building2 className={`w-6 h-6 mb-1 ${profileType === 'etablissement' ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span className="text-xs font-semibold tracking-tight">Établissement</span>
                  </button>
                </div>
              </div>

              {profileType === 'student' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Mon niveau actuel :</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="niveau" 
                        value="3eme" 
                        checked={eleveLevel === '3eme'}
                        onChange={() => setEleveLevel('3eme')}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm font-medium text-slate-700">Classe de 3ème</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="niveau" 
                        value="terminale" 
                        checked={eleveLevel === 'terminale'}
                        onChange={() => setEleveLevel('terminale')}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm font-medium text-slate-700">Classe de Terminale</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="niveau" 
                        value="autre" 
                        checked={eleveLevel === 'autre'}
                        onChange={() => setEleveLevel('autre')}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm font-medium text-slate-700">Autre</span>
                    </label>
                  </div>
                </div>
              )}

              {profileType === 'student' && (
                <div className="flex flex-col items-center mb-4">
                  <FileUploader 
                    label="Photo de profil"
                    folder="profiles"
                    onUploadComplete={setPhotoUrl}
                  />
                  {photoUrl && (
                    <img src={photoUrl} className="w-16 h-16 rounded-full object-cover mt-2 border-2 border-indigo-200" alt="Preview" />
                  )}
                </div>
              )}

              {profileType === 'student' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nom complet</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                      placeholder="John Doe"
                    />
                  </div>
                </div>
              )}

              {profileType === 'parent' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nom complet du Parent</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                        placeholder="Jean Dupont"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nom complet de l'enfant</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={childName}
                        onChange={(e) => setChildName(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                        placeholder="Marc Dupont"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Niveau scolaire de l'enfant :</label>
                    <div className="flex flex-wrap gap-4">
                      {['3eme', 'terminale', 'autre'].map((lvl) => (
                        <label key={lvl} className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="radio" 
                            name="childLevel" 
                            value={lvl} 
                            checked={childLevel === lvl}
                            onChange={() => setChildLevel(lvl as any)}
                            className="text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-sm font-medium text-slate-700 capitalize">
                            {lvl === 'terminale' ? 'Terminale' : lvl === '3eme' ? '3ème' : 'Autre'}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {profileType === 'etablissement' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nom de l'institution</label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={instName}
                        onChange={(e) => setInstName(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                        placeholder="Université Joseph Ki-Zerbo"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Type d'institution</label>
                    <select
                      value={instType}
                      onChange={(e) => setInstType(e.target.value as any)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-white"
                    >
                      {INSTITUTION_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Description brève</label>
                    <textarea
                      required
                      value={instDescription}
                      onChange={(e) => setInstDescription(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all min-h-[100px]"
                      placeholder="Présentez brièvement votre établissement..."
                    />
                  </div>
                </>
              )}
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                placeholder="exemple@email.com"
              />
            </div>
          </div>

          {!isResettingPassword && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-slate-700">Mot de passe</label>
                {isLogin && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsResettingPassword(true);
                      setErrorDetails('');
                      setSuccessMessage('');
                    }}
                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    Mot de passe oublié ?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>
          )}

          {errorDetails && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">
              {errorDetails}
            </div>
          )}

          {successMessage && (
            <div className="text-sm text-green-600 bg-green-50 p-3 rounded-xl border border-green-100">
              {successMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isResettingPassword ? (
              <>
                <KeyRound className="w-5 h-5" />
                Envoyer le lien
              </>
            ) : (
              <>
                {isLogin ? 'Se connecter' : "S'inscrire"}
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          {isResettingPassword ? (
             <button
               onClick={() => {
                 setIsResettingPassword(false);
                 setErrorDetails('');
                 setSuccessMessage('');
               }}
               className="text-indigo-600 hover:text-indigo-700 font-medium text-sm"
             >
               Retourner à la connexion
             </button>
          ) : (
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setErrorDetails('');
                setSuccessMessage('');
              }}
              className="text-indigo-600 hover:text-indigo-700 font-medium text-sm"
            >
              {isLogin
                ? "Pas encore de compte ? S'inscrire"
                : 'Déjà un compte ? Se connecter'}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
