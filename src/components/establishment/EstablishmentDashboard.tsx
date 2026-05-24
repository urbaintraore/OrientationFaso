import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  GraduationCap, 
  Plus, 
  Settings, 
  LayoutDashboard, 
  FileText, 
  Users, 
  BarChart3, 
  Save, 
  Trash2, 
  Edit, 
  Image as ImageIcon,
  Globe,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Linkedin,
  Twitter,
  Instagram,
  CheckCircle,
  Loader2,
  Trash,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, getDoc } from 'firebase/firestore';
import { Institution, InstitutionType, UFR, Program, EstablishmentPost, PostCategory } from '../../types';
import { INSTITUTION_TYPES } from '../../constants';
import { institutionService } from '../../services/institutionService';
import { ufrService } from '../../services/ufrService';
import { programService } from '../../services/programService';
import { postService } from '../../services/postService';
import { deduplicationService } from '../../services/deduplicationService';
import { auth, db } from '../../lib/firebase';

import { MarketTrendsDashboard } from './MarketTrendsDashboard';
import { SchoolStudentsPanel } from './SchoolStudentsPanel';
import { FileUploader } from '../FileUploader';

interface EstablishmentDashboardProps {
  onBack: () => void;
}

export function EstablishmentDashboard({ onBack }: EstablishmentDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'ufrs' | 'programs' | 'posts' | 'trends' | 'settings' | 'students'>('overview');
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [ufrs, setUfrs] = useState<UFR[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [posts, setPosts] = useState<EstablishmentPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      setIsLoading(true);
      try {
        const inst = await institutionService.getByOwnerId(user.uid);
        if (inst) {
          setInstitution(inst);
          const [ufrData, programData, postData] = await Promise.all([
            ufrService.getUFRsByInstitution(inst.id),
            programService.getProgramsByInstitution(inst.id),
            postService.getPostsByEstablishment(inst.id)
          ]);
          setUfrs(ufrData);
          setPrograms(programData);
          setPosts(postData);
        } else {
          // Fetch user profile to pre-fill setupData
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setSetupData(prev => ({
              ...prev,
              name: userData.institutionName || prev.name,
              type: (userData.institutionType as InstitutionType) || prev.type,
              description: userData.description || prev.description,
              email: user.email || prev.email
            }));
          }
        }
      } catch (error) {
        console.error("Error fetching establishment data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const [isSettingUp, setIsSettingUp] = useState(false);
  const [setupData, setSetupData] = useState({
    name: '',
    type: 'Université Publique' as InstitutionType,
    city: '',
    country: 'Burkina Faso',
    description: '',
    website: '',
    email: ''
  });
  const [duplicateWarning, setDuplicateWarning] = useState<Institution[]>([]);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    if (duplicateWarning.length === 0) {
      setIsSaving(true);
      try {
        const similars = await deduplicationService.checkSimilarName(setupData.name);
        if (similars.length > 0) {
          setDuplicateWarning(similars);
          setIsSaving(false);
          return;
        }
      } catch (err) {
        console.error(err);
      }
    }

    setIsSaving(true);
    try {
      const newInst: Omit<Institution, 'id'> = {
        ...setupData,
        ownerId: user.uid,
        logoUrl: 'https://images.unsplash.com/photo-1592280733791-65825bc5d83a?auto=format&fit=crop&q=80',
        coverUrl: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&q=80',
        reputationScore: 0,
        studentCount: 0,
        isVerified: false,
        isPartner: false,
        accreditations: [],
        amenities: [],
        socialMedia: {},
        updatedAt: new Date().toISOString()
      };
      const id = await institutionService.addInstitution(newInst);
      setInstitution({ id, ...newInst } as Institution);
      setIsSettingUp(false);
    } catch (error) {
      console.error("Error setting up institution:", error);
      alert("Erreur lors de la création de l'établissement");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-widest">Initialisation du Dashboard...</h2>
        </div>
      </div>
    );
  }

  if (!institution) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-2xl w-full text-center border border-slate-100">
          {!isSettingUp ? (
            <>
              <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-indigo-600 shadow-xl shadow-indigo-100">
                <Building2 className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Bienvenue, Partenaire !</h2>
              <p className="text-slate-500 mb-8 font-medium max-w-md mx-auto">
                Votre compte établissement est prêt. Il ne vous reste plus qu'à configurer l'identité de votre institution pour commencer à publier vos filières.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button 
                  onClick={() => setIsSettingUp(true)}
                  className="bg-indigo-600 text-white rounded-xl px-10 py-4 font-black text-xs uppercase tracking-widest hover:bg-slate-900 transition-all shadow-xl shadow-indigo-600/20"
                >
                  Configurer mon Établissement
                </button>
                <button 
                  onClick={onBack}
                  className="bg-slate-50 text-slate-400 rounded-xl px-10 py-4 font-black text-xs uppercase tracking-widest hover:text-slate-900 transition-all border border-slate-100"
                >
                  Plus tard
                </button>
              </div>
            </>
          ) : (
            <div className="text-left">
              <div className="flex items-center gap-4 mb-8">
                 <button onClick={() => setIsSettingUp(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-all text-slate-400">
                   <Plus className="w-5 h-5 rotate-45" />
                 </button>
                 <h2 className="text-2xl font-black text-slate-900 tracking-tight">Configuration Initiale</h2>
              </div>

              {duplicateWarning.length > 0 && (
                <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4">
                  <div className="flex gap-3 text-amber-800">
                    <AlertCircle className="w-6 h-6 flex-shrink-0" />
                    <div>
                      <h4 className="font-bold">Attention : Cet établissement pourrait déjà exister !</h4>
                      <p className="text-sm mt-1 mb-3">Nous avons trouvé des correspondances proches dans notre base de données :</p>
                      <ul className="space-y-2 mb-3">
                        {duplicateWarning.map(dup => (
                          <li key={dup.id} className="text-sm bg-white/50 p-2 rounded-lg border border-amber-100 flex items-center justify-between">
                            <span className="font-semibold">{dup.name}</span>
                            <span className="text-xs opacity-70">{dup.city}</span>
                          </li>
                        ))}
                      </ul>
                      <p className="text-sm">Si vous êtes sûr qu'il s'agit d'un nouvel établissement, cliquez à nouveau sur Enregistrer.</p>
                      <button
                        type="button"
                        onClick={() => setDuplicateWarning([])}
                        className="mt-3 text-xs font-bold text-amber-700 bg-amber-100 px-3 py-1.5 rounded-lg hover:bg-amber-200"
                      >
                        Vérifier et corriger le nom
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSetup} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Nom de l'Institution</label>
                  <input 
                    type="text" 
                    required
                    className="w-full bg-slate-50 border-none rounded-xl px-5 py-3 text-sm font-medium"
                    value={setupData.name}
                    onChange={e => setSetupData({...setupData, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Type</label>
                  <select 
                    className="w-full bg-slate-50 border-none rounded-xl px-5 py-3 text-sm font-medium"
                    value={setupData.type}
                    onChange={e => setSetupData({...setupData, type: e.target.value as any})}
                  >
                    {INSTITUTION_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Ville</label>
                  <input 
                    type="text" 
                    required
                    className="w-full bg-slate-50 border-none rounded-xl px-5 py-3 text-sm font-medium"
                    value={setupData.city}
                    onChange={e => setSetupData({...setupData, city: e.target.value})}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Brève Description</label>
                  <textarea 
                    required
                    className="w-full bg-slate-50 border-none rounded-xl px-5 py-3 text-sm font-medium h-24"
                    value={setupData.description}
                    onChange={e => setSetupData({...setupData, description: e.target.value})}
                  />
                </div>
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="md:col-span-2 bg-indigo-600 text-white rounded-xl py-4 font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:bg-slate-900 transition-all flex items-center justify-center gap-2"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isSaving ? 'Création...' : 'Finaliser la Création'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    );
  }

  const isSchool = institution ? (institution.type === 'Collège' || institution.type === 'Lycée' || institution.type === 'Lycée Technique' || institution.type === 'Lycée Scientifique' || institution.type === 'Collège et Lycée') : false;

  const tabs = isSchool ? [
    { id: 'overview', icon: LayoutDashboard, label: 'Aperçu' },
    { id: 'students', icon: Users, label: 'Élèves Inscrits' },
    { id: 'programs', icon: FileText, label: 'Séries & Formations' },
    { id: 'posts', icon: FileText, label: 'Publications' },
    { id: 'trends', icon: BarChart3, label: 'Analyses & Tendances' },
    { id: 'settings', icon: Settings, label: 'Profil Établissement' },
  ] : [
    { id: 'overview', icon: LayoutDashboard, label: 'Aperçu' },
    { id: 'ufrs', icon: GraduationCap, label: 'UFR & Facultés' },
    { id: 'programs', icon: FileText, label: 'Filières' },
    { id: 'posts', icon: Users, label: 'Actualités' },
    { id: 'trends', icon: BarChart3, label: 'Marché & Emploi' },
    { id: 'settings', icon: Settings, label: 'Configuration' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <div className="w-full md:w-64 bg-white border-r border-slate-200 p-6 flex flex-col gap-8 md:sticky md:top-0 md:h-screen z-40 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-600/20">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-black text-slate-900 uppercase tracking-widest text-xs">E-Portail</h1>
            <p className="text-[10px] font-bold text-slate-400 capitalize">Tableau de Bord</p>
          </div>
        </div>

        <nav className="flex flex-col gap-1">
          {tabs.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest ${
                activeTab === item.id 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 translate-x-1' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-100 italic">
          <button 
            onClick={onBack}
            className="w-full text-slate-400 hover:text-slate-900 font-bold text-[10px] uppercase tracking-widest text-left"
          >
            ← Quitter le portail
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 min-w-0 p-4 md:p-8 lg:p-12 pb-24 overflow-y-auto">
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest">Établissement</span>
              {institution.isVerified && (
                <div className="flex items-center gap-1 text-blue-600 font-black text-[8px] uppercase tracking-widest">
                  <CheckCircle className="w-3 h-3" /> Vérifié
                </div>
              )}
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">{institution.name}</h2>
            <p className="text-sm text-slate-500 font-medium">{institution.city}, {institution.country}</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
              Voir la Page Publique
            </button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div 
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'UFR / Instituts', value: ufrs.length, icon: GraduationCap, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                  { label: 'Formations', value: programs.length, icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                  { label: 'Étudiants', value: institution.studentCount.toLocaleString(), icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: 'Engagement News', value: posts.reduce((acc, p) => acc + p.likesCount, 0), icon: BarChart3, color: 'text-amber-600', bg: 'bg-amber-50' },
                ].map((stat, i) => (
                  <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm">
                    <div className={`${stat.bg} ${stat.color} w-10 h-10 rounded-2xl flex items-center justify-center mb-4`}>
                      <stat.icon className="w-5 h-5" />
                    </div>
                    <span className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">{stat.label}</span>
                    <span className="text-2xl font-black text-slate-900 tracking-tight">{stat.value}</span>
                  </div>
                ))}
              </div>

              {/* Main Analytics / Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-8 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-60"></div>
                    <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                      <BarChart3 className="w-6 h-6 text-indigo-600" /> Tendances d'Intérêt IA
                    </h3>
                    <div className="h-48 flex items-end gap-2 px-2">
                       {/* Mock chart bars */}
                       {[40, 70, 45, 90, 65, 85, 30].map((h, i) => (
                         <div key={i} className="flex-1 bg-slate-100 rounded-t-lg relative group transition-all hover:bg-indigo-100">
                           <div 
                             className="absolute bottom-0 left-0 right-0 bg-indigo-600 rounded-t-lg transition-all duration-1000" 
                             style={{ height: `${h}%` }}
                           >
                             <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-2 py-1 rounded text-[8px] font-black opacity-0 group-hover:opacity-100 transition-opacity">
                               {h}%
                             </div>
                           </div>
                         </div>
                       ))}
                    </div>
                    <div className="flex justify-between mt-4 text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">
                      <span>Lun</span>
                      <span>Mar</span>
                      <span>Mer</span>
                      <span>Jeu</span>
                      <span>Ven</span>
                      <span>Sam</span>
                      <span>Dim</span>
                    </div>
                  </div>

                  <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-2xl shadow-slate-900/40">
                     <h3 className="text-xl font-black mb-4">Conseil d'Amélioration IA</h3>
                     <p className="text-indigo-200 text-sm font-medium leading-relaxed mb-6 italic">
                       "Votre filière 'Ingénierie des Systèmes' reçoit un grand intérêt des élèves du Lycée scientifique. Pensez à publier une actualité sur les nouveaux équipements de votre laboratoire pour booster les candidatures."
                     </p>
                     <button className="bg-white text-slate-900 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all active:scale-95">
                        Appliquer cette recommandation
                     </button>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-6">
                    <h3 className="text-sm font-black text-slate-900 mb-4 uppercase tracking-widest">Derniers Posts</h3>
                    <div className="space-y-4">
                      {posts.slice(0, 3).map(post => (
                        <div key={post.id} className="flex gap-3 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                           {post.mediaUrl ? (
                             <img src={post.mediaUrl} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" alt="" />
                           ) : (
                             <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                               <FileText className="w-4 h-4 text-slate-400" />
                             </div>
                           )}
                           <div className="min-w-0">
                             <p className="text-[11px] font-black text-slate-900 truncate">{post.title}</p>
                             <div className="flex items-center gap-2 text-[8px] font-bold text-slate-400 mt-1">
                               <span>{post.likesCount} J'aime</span>
                               <span>•</span>
                               <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                             </div>
                           </div>
                        </div>
                      ))}
                      {posts.length === 0 && <p className="text-[10px] font-bold text-slate-400 italic">Aucune publication récente.</p>}
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl p-6 text-white shadow-xl">
                    <h3 className="text-sm font-black mb-3 uppercase tracking-widest">Niveau de Service</h3>
                    <div className="mb-4">
                      <div className="flex justify-between items-end mb-1">
                        <span className="text-xs font-bold opacity-80">Complétion Profil</span>
                        <span className="text-lg font-black">78%</span>
                      </div>
                      <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-white h-full pr-2 transition-all duration-1000" style={{ width: '78%' }}></div>
                      </div>
                    </div>
                    <p className="text-[10px] font-medium opacity-80 leading-relaxed mb-4">
                      Un profil complet à 100% augmente de 40% votre visibilité auprès des étudiants.
                    </p>
                    <button 
                      onClick={() => setActiveTab('settings')}
                      className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl py-2 font-black text-[10px] uppercase tracking-widest transition-all"
                    >
                      Finaliser le profil
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'ufrs' && (
             <UFRManagement institutionId={institution.id} />
          )}

          {activeTab === 'programs' && (
             <ProgramManagement institutionId={institution.id} ufrs={ufrs} />
          )}

          {activeTab === 'students' && (
             <SchoolStudentsPanel institution={institution} />
          )}

          {activeTab === 'posts' && (
             <PostManagement institutionId={institution.id} />
          )}

          {activeTab === 'trends' && (
             <MarketTrendsDashboard />
          )}

          {activeTab === 'settings' && (
             <ProfileSettings institution={institution} onUpdate={setInstitution} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Sub-components (Simplified versions for brevity, but functional)

function UFRManagement({ institutionId }: { institutionId: string }) {
  const [ufrs, setUfrs] = useState<UFR[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', headOfDepartment: '' });

  useEffect(() => {
    ufrService.getUFRsByInstitution(institutionId).then(setUfrs);
  }, [institutionId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const id = await ufrService.addUFR({ institutionId, ...formData, createdAt: new Date().toISOString() });
      setUfrs([{ id, institutionId, ...formData, createdAt: new Date().toISOString() }, ...ufrs]);
      setIsAdding(false);
      setFormData({ name: '', description: '', headOfDepartment: '' });
    } catch (error) {
      alert("Erreur lors de l'ajout");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Supprimer cette UFR ?")) {
      await ufrService.deleteUFR(id);
      setUfrs(ufrs.filter(u => u.id !== id));
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm">
        <div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">Unités de Formation & Instituts</h3>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Structure académique</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-indigo-600 text-white rounded-xl px-5 py-3 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-slate-900 transition-all shadow-lg"
        >
          <Plus className="w-4 h-4" /> Ajouter une UFR
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ufrs.map(ufr => (
          <div key={ufr.id} className="bg-white p-8 rounded-3xl border border-slate-200/60 shadow-sm group hover:border-indigo-600 transition-all">
             <div className="flex justify-between items-start mb-6">
                <div className="bg-indigo-50 p-4 rounded-2xl text-indigo-600">
                   <GraduationCap className="w-6 h-6" />
                </div>
                <button onClick={() => handleDelete(ufr.id)} className="text-slate-300 hover:text-rose-500 transition-colors">
                   <Trash2 className="w-4 h-4" />
                </button>
             </div>
             <h4 className="text-xl font-black text-slate-900 mb-2 leading-tight tracking-tight">{ufr.name}</h4>
             <p className="text-sm text-slate-500 font-medium mb-4 line-clamp-2">{ufr.description}</p>
             <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest border-t border-slate-100 pt-4 flex justify-between">
                <span>Responsable:</span>
                <span className="text-slate-900">{ufr.headOfDepartment || 'Non défini'}</span>
             </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-lg rounded-3xl p-8 shadow-2xl"
            >
              <h3 className="text-2xl font-black text-slate-900 mb-6 uppercase tracking-tight">Nouvelle Entité Académique</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                 <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Nom (UFR, Faculté, Institut...)</label>
                    <input 
                      type="text" 
                      required
                      placeholder="ex: UFR Sciences Exactes et Appliquées"
                      className="w-full bg-slate-50 border-none rounded-xl px-5 py-3 text-sm focus:ring-2 focus:ring-indigo-600 font-medium"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Description</label>
                    <textarea 
                      required
                      placeholder="Petite présentation de l'unité..."
                      className="w-full bg-slate-50 border-none rounded-xl px-5 py-3 text-sm focus:ring-2 focus:ring-indigo-600 font-medium h-32"
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                    />
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Responsable / Directeur</label>
                    <input 
                      type="text" 
                      placeholder="Nom du responsable"
                      className="w-full bg-slate-50 border-none rounded-xl px-5 py-3 text-sm focus:ring-2 focus:ring-indigo-600 font-medium"
                      value={formData.headOfDepartment}
                      onChange={e => setFormData({...formData, headOfDepartment: e.target.value})}
                    />
                 </div>
                 <div className="flex gap-3 pt-4">
                    <button type="button" onClick={() => setIsAdding(false)} className="flex-1 px-6 py-4 rounded-xl font-black text-xs uppercase tracking-widest text-slate-400 hover:text-slate-900">Annuler</button>
                    <button type="submit" className="flex-1 bg-indigo-600 text-white px-6 py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-600/20">Enregistrer</button>
                 </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ProgramManagement({ institutionId, ufrs }: { institutionId: string; ufrs: UFR[] }) {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<Partial<Program>>({
    name: '',
    description: '',
    duration: '3 ans',
    degreeLevel: 'Licence',
    tuitionFee: 0,
    employmentTrend: 'Stable',
    employmentScore: 50,
    averageSalary: '',
    admissionCriteria: '',
    internationalOpportunities: '',
    ufrId: '',
    careerOpportunities: [],
    skills: [],
    marketDemand: 'Moyenne',
    growthPotential: 'Stable'
  });

  useEffect(() => {
    programService.getProgramsByInstitution(institutionId).then(setPrograms);
  }, [institutionId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const progData = { 
        ...formData, 
        institutionId, 
        createdAt: new Date().toISOString() 
      } as Program;
      const id = await programService.addProgram(progData);
      setPrograms([{ ...progData, id }, ...programs]);
      setIsAdding(false);
      setFormData({
        name: '',
        description: '',
        duration: '3 ans',
        degreeLevel: 'Licence',
        tuitionFee: 0,
        employmentTrend: 'Stable',
        employmentScore: 50,
        ufrId: '',
        marketDemand: 'Moyenne',
        growthPotential: 'Stable'
      });
    } catch (error) {
      alert("Erreur lors de l'ajout");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Supprimer cette filière ?")) {
      await programService.deleteProgram(id);
      setPrograms(programs.filter(p => p.id !== id));
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm">
        <div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">Gestion des Filières</h3>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Formations & Opportunités</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-emerald-600 text-white rounded-xl px-5 py-3 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-slate-900 transition-all shadow-lg"
        >
          <Plus className="w-4 h-4" /> Ajouter une Filière
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {programs.map(prog => (
          <div key={prog.id} className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm flex flex-col md:flex-row md:items-center gap-6 group hover:border-emerald-600 transition-all">
             <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                <FileText className="w-6 h-6" />
             </div>
             <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded">
                    {prog.degreeLevel} • {prog.duration}
                  </span>
                  <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                    prog.employmentTrend === 'Très Forte Demande' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {prog.employmentTrend}
                  </span>
                </div>
                <h4 className="text-lg font-black text-slate-900 leading-tight">{prog.name}</h4>
                <p className="text-xs text-slate-500 font-medium truncate max-w-lg">{prog.description}</p>
             </div>
             <div className="flex items-center gap-8 text-right flex-shrink-0">
                <div>
                   <span className="block text-[8px] font-black uppercase text-slate-400 tracking-widest mb-1">Scolarité</span>
                   <span className="text-sm font-black text-slate-900">{prog.tuitionFee?.toLocaleString()} FCFA</span>
                </div>
                <div className="flex gap-2">
                   <button className="p-3 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-xl transition-all"><Edit className="w-4 h-4" /></button>
                   <button onClick={() => handleDelete(prog.id)} className="p-3 bg-slate-50 text-slate-400 hover:text-rose-500 rounded-xl transition-all"><Trash className="w-4 h-4" /></button>
                </div>
             </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-4xl rounded-3xl p-8 shadow-2xl flex flex-col h-[85vh]"
            >
              <h3 className="text-2xl font-black text-slate-900 mb-8 uppercase tracking-tight">Nouvelle Filière</h3>
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-6 pr-4 custom-scrollbar">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Libellé</label>
                        <input 
                          type="text" 
                          required
                          placeholder="Nom de la filière"
                          className="w-full bg-slate-50 border-none rounded-xl px-5 py-3 text-sm font-medium"
                          value={formData.name}
                          onChange={e => setFormData({...formData, name: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">UFR de Rattachement</label>
                        <select 
                          className="w-full bg-slate-50 border-none rounded-xl px-5 py-3 text-sm font-medium"
                          value={formData.ufrId}
                          onChange={e => setFormData({...formData, ufrId: e.target.value})}
                        >
                          <option value="">Sélectionner une UFR</option>
                          {ufrs.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                    </div>
                 </div>

                 <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Description & Contenu</label>
                    <textarea 
                      required
                      placeholder="Présentation détaillée..."
                      className="w-full bg-slate-50 border-none rounded-xl px-5 py-3 text-sm font-medium h-24"
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                    />
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Diplôme</label>
                        <select 
                          className="w-full bg-slate-50 border-none rounded-xl px-5 py-3 text-sm font-medium"
                          value={formData.degreeLevel}
                          onChange={e => setFormData({...formData, degreeLevel: e.target.value})}
                        >
                          <option value="Licence">Licence / Bachelor</option>
                          <option value="Master">Master</option>
                          <option value="Doctorat">Doctorat</option>
                          <option value="BTS">BTS</option>
                          <option value="DTS">DTS</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Durée</label>
                        <input 
                          type="text" 
                          placeholder="ex: 3 ans"
                          className="w-full bg-slate-50 border-none rounded-xl px-5 py-3 text-sm font-medium"
                          value={formData.duration}
                          onChange={e => setFormData({...formData, duration: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Frais de Scolarité</label>
                        <input 
                          type="number" 
                          placeholder="Montant en FCFA"
                          className="w-full bg-slate-50 border-none rounded-xl px-5 py-3 text-sm font-medium"
                          value={formData.tuitionFee}
                          onChange={e => setFormData({...formData, tuitionFee: Number(e.target.value)})}
                        />
                    </div>
                 </div>

                 <div className="bg-slate-50 p-6 rounded-3xl space-y-6">
                    <h4 className="text-[10px] font-black uppercase text-indigo-600 tracking-widest">Employabilité & Tendances</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                       <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Tendance Marché</label>
                          <select 
                            className="w-full bg-white border-none rounded-xl px-5 py-3 text-sm font-medium"
                            value={formData.employmentTrend}
                            onChange={e => setFormData({...formData, employmentTrend: e.target.value as any})}
                          >
                            <option value="Très Forte Demande">Très Forte Demande</option>
                            <option value="Forte Demande">Forte Demande</option>
                            <option value="Stable">Stable</option>
                            <option value="Saturé">Saturé</option>
                          </select>
                       </div>
                       <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Score Employabilité (0-100)</label>
                          <input 
                            type="range" 
                            className="w-full h-8 accent-indigo-600"
                            min="0" max="100"
                            value={formData.employmentScore}
                            onChange={e => setFormData({...formData, employmentScore: Number(e.target.value)})}
                          />
                       </div>
                       <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Salaire Moyen Estimé</label>
                          <input 
                            type="text" 
                            className="w-full bg-white border-none rounded-xl px-5 py-3 text-sm font-medium"
                            value={formData.averageSalary}
                            placeholder="ex: 250 000 - 450 000 FCFA"
                            onChange={e => setFormData({...formData, averageSalary: e.target.value})}
                          />
                       </div>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Matières Principales (séparées par des virgules)</label>
                        <input 
                          type="text" 
                          placeholder="Mathématiques, Physique, Algorithmique..."
                          className="w-full bg-slate-50 border-none rounded-xl px-5 py-3 text-sm font-medium"
                          value={formData.subjects?.join(', ')}
                          onChange={e => setFormData({...formData, subjects: e.target.value.split(',').map(s => s.trim())})}
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Compétences Acquises</label>
                        <input 
                          type="text" 
                          placeholder="Développement Web, Analyse de données..."
                          className="w-full bg-slate-50 border-none rounded-xl px-5 py-3 text-sm font-medium"
                          value={formData.skills?.join(', ')}
                          onChange={e => setFormData({...formData, skills: e.target.value.split(',').map(s => s.trim())})}
                        />
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Conditions d'Admission</label>
                        <textarea 
                          className="w-full bg-slate-50 border-none rounded-xl px-5 py-3 text-sm font-medium h-24"
                          placeholder="Moyennes minimales, tests, etc."
                          value={formData.admissionCriteria}
                          onChange={e => setFormData({...formData, admissionCriteria: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Opportunités Internationales</label>
                        <textarea 
                          className="w-full bg-slate-50 border-none rounded-xl px-5 py-3 text-sm font-medium h-24"
                          placeholder="Échanges, bourses, accréditations..."
                          value={formData.internationalOpportunities}
                          onChange={e => setFormData({...formData, internationalOpportunities: e.target.value})}
                        />
                    </div>
                 </div>
              </form>
              <div className="flex gap-3 pt-8 border-t border-slate-100">
                <button type="button" onClick={() => setIsAdding(false)} className="px-6 py-4 rounded-xl font-black text-xs uppercase tracking-widest text-slate-400 hover:text-slate-900">Annuler</button>
                <button 
                  onClick={handleSubmit} 
                  className="bg-indigo-600 text-white px-10 py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:bg-slate-900 transition-all ml-auto"
                >
                  Publier la Filière
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function PostManagement({ institutionId }: { institutionId: string }) {
  const [posts, setPosts] = useState<EstablishmentPost[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<Omit<EstablishmentPost, 'id' | 'likesCount' | 'commentsCount' | 'sharesCount' | 'createdAt'>>({ 
    establishmentId: institutionId,
    establishmentName: '', // Will be set on submit
    category: 'Annonce',
    title: '', 
    content: '', 
    mediaUrl: '', 
    mediaType: 'image' as any, 
    isImportant: false,
    eventDate: '',
    location: ''
  });

  const categories: PostCategory[] = [
    'Annonce', 'Événement', 'Concours', 'Filière', 'Portes Ouvertes', 
    'Conférence', 'Recrutement', 'Résultats', 'Actualité'
  ];

  useEffect(() => {
    postService.getPostsByEstablishment(institutionId).then(setPosts);
  }, [institutionId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const id = await postService.addPost({ ...formData, createdAt: new Date().toISOString() });
      const newPost: EstablishmentPost = { 
        id, 
        likesCount: 0, 
        commentsCount: 0, 
        sharesCount: 0, 
        createdAt: new Date().toISOString(),
        ...formData 
      };
      setPosts([newPost, ...posts]);
      setIsAdding(false);
      setFormData({ 
        establishmentId: institutionId,
        establishmentName: '',
        category: 'Annonce',
        title: '', 
        content: '', 
        mediaUrl: '', 
        mediaType: 'image', 
        isImportant: false,
        eventDate: '',
        location: ''
      });
    } catch (error) {
      alert("Erreur lors de la publication");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Supprimer ce post ?")) {
      await postService.deletePost(id);
      setPosts(posts.filter(p => p.id !== id));
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm">
        <div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">Actualités & Annonces</h3>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Communiqués établissement</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-slate-900 text-white rounded-xl px-5 py-3 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-600 transition-all shadow-lg"
        >
          <Plus className="w-4 h-4" /> Créer un Post
        </button>
      </div>

      <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
        {posts.map(post => (
          <div key={post.id} className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden break-inside-avoid">
             {post.mediaUrl && (
               <img src={post.mediaUrl} className="w-full h-48 object-cover" alt="" />
             )}
             <div className="p-6">
                <div className="flex justify-between items-start mb-3">
                   {post.isImportant && (
                     <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest mb-2 inline-block">Annonce Importante</span>
                   )}
                   <button onClick={() => handleDelete(post.id)} className="text-slate-300 hover:text-rose-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                   </button>
                </div>
                <h4 className="text-lg font-black text-slate-900 mb-2 leading-tight tracking-tight">{post.title}</h4>
                <p className="text-xs text-slate-600 font-medium leading-relaxed mb-4">{post.content}</p>
                <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-[9px] font-black uppercase text-slate-400 tracking-widest">
                   <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                   <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1"><BarChart3 className="w-3 h-3" /> {post.likesCount}</span>
                   </div>
                </div>
             </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-lg rounded-3xl p-8 shadow-2xl"
            >
              <h3 className="text-2xl font-black text-slate-900 mb-6 uppercase tracking-tight">Nouvelle Publication</h3>
              <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                       <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Catégorie</label>
                       <select 
                         className="w-full bg-slate-50 border-none rounded-xl px-5 py-3 text-sm font-medium"
                         value={formData.category}
                         onChange={e => setFormData({...formData, category: e.target.value as any})}
                       >
                         {categories.map(c => <option key={c} value={c}>{c}</option>)}
                       </select>
                    </div>
                    <div>
                       <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Titre de l'annonce</label>
                       <input 
                         type="text" 
                         required
                         className="w-full bg-slate-50 border-none rounded-xl px-5 py-3 text-sm focus:ring-2 focus:ring-indigo-600 font-medium"
                         value={formData.title}
                         onChange={e => setFormData({...formData, title: e.target.value})}
                       />
                    </div>
                 </div>

                 {(formData.category === 'Événement' || formData.category === 'Conférence' || formData.category === 'Portes Ouvertes') && (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                         <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Date de l'événement</label>
                         <input 
                           type="date" 
                           className="w-full bg-slate-50 border-none rounded-xl px-5 py-3 text-sm font-medium"
                           value={formData.eventDate}
                           onChange={e => setFormData({...formData, eventDate: e.target.value})}
                         />
                      </div>
                      <div>
                         <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Lieu / Salle</label>
                         <input 
                           type="text" 
                           className="w-full bg-slate-50 border-none rounded-xl px-5 py-3 text-sm font-medium"
                           value={formData.location}
                           onChange={e => setFormData({...formData, location: e.target.value})}
                         />
                      </div>
                   </div>
                 )}

                 <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Contenu</label>
                    <textarea 
                      required
                      className="w-full bg-slate-50 border-none rounded-xl px-5 py-3 text-sm focus:ring-2 focus:ring-indigo-600 font-medium h-32"
                      value={formData.content}
                      onChange={e => setFormData({...formData, content: e.target.value})}
                    />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <FileUploader 
                       label="Média (Image/PDF)"
                       folder="posts"
                       onUploadComplete={(url) => setFormData({...formData, mediaUrl: url})}
                    />
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Type de Média</label>
                        <select 
                          className="w-full bg-slate-50 border-none rounded-xl px-5 py-3 text-sm font-medium"
                          value={formData.mediaType}
                          onChange={e => setFormData({...formData, mediaType: e.target.value as any})}
                        >
                          <option value="image">Image</option>
                          <option value="video">Vidéo</option>
                          <option value="pdf">Document PDF</option>
                          <option value="link">Lien Externe</option>
                        </select>
                    </div>
                 </div>
                 <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-slate-50 rounded-xl transition-colors">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 rounded border-slate-200 text-indigo-600 focus:ring-indigo-500"
                      checked={formData.isImportant}
                      onChange={e => setFormData({...formData, isImportant: e.target.checked})}
                    />
                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Marquer comme important</span>
                 </label>
                 <div className="flex gap-3 pt-4">
                    <button type="button" onClick={() => setIsAdding(false)} className="flex-1 px-6 py-4 rounded-xl font-black text-xs uppercase tracking-widest text-slate-400 hover:text-slate-900">Annuler</button>
                    <button type="submit" className="flex-1 bg-slate-900 text-white px-6 py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-[0.98]">Publier</button>
                 </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ProfileSettings({ institution, onUpdate }: { institution: Institution; onUpdate: (i: Institution) => void }) {
  const [formData, setFormData] = useState<Partial<Institution>>({ ...institution });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await institutionService.updateInstitution(institution.id, formData);
      onUpdate({ ...institution, ...formData });
      alert("Profil mis à jour !");
    } catch (error) {
      alert("Erreur lors de la mise à jour");
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 max-w-4xl">
      <div className="bg-white p-8 rounded-3xl border border-slate-200/60 shadow-sm">
        <h3 className="text-2xl font-black text-slate-900 mb-8 uppercase tracking-tight">Configuration de l'Établissement</h3>
        
        <form onSubmit={handleSubmit} className="space-y-8">
           {/* Basic Info */}
           <div className="space-y-6">
              <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest border-b border-slate-100 pb-2">Informations Générales</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Nom Public</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-50 border-none rounded-xl px-5 py-3 text-sm font-medium"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Slogan / Phrase d'accroche</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-50 border-none rounded-xl px-5 py-3 text-sm font-medium"
                      value={formData.specialOffer}
                      onChange={e => setFormData({...formData, specialOffer: e.target.value})}
                    />
                 </div>
                 <div className="md:col-span-2">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Description Complète</label>
                    <textarea 
                      className="w-full bg-slate-50 border-none rounded-xl px-5 py-3 text-sm font-medium h-32"
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                    />
                 </div>
              </div>
           </div>

           {/* Media */}
           <div className="space-y-6">
              <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest border-b border-slate-100 pb-2">Identité Visuelle</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <FileUploader 
                    label="Logo de l'Établissement"
                    folder="logos"
                    onUploadComplete={(url) => setFormData({...formData, logo: url})}
                 />
                 <FileUploader 
                    label="Bannière de Couverture"
                    folder="covers"
                    onUploadComplete={(url) => setFormData({...formData, coverImage: url})}
                 />
              </div>
           </div>

           {/* Contact */}
           <div className="space-y-6">
              <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest border-b border-slate-100 pb-2">Contact & Localisation</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Email Public</label>
                    <input 
                      type="email" 
                      className="w-full bg-slate-50 border-none rounded-xl px-5 py-3 text-sm font-medium"
                      value={formData.contactEmail}
                      onChange={e => setFormData({...formData, contactEmail: e.target.value})}
                    />
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Téléphone</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-50 border-none rounded-xl px-5 py-3 text-sm font-medium"
                      value={formData.contactPhone}
                      onChange={e => setFormData({...formData, contactPhone: e.target.value})}
                    />
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Ville</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-50 border-none rounded-xl px-5 py-3 text-sm font-medium"
                      value={formData.city}
                      onChange={e => setFormData({...formData, city: e.target.value})}
                    />
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Adresse</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-50 border-none rounded-xl px-5 py-3 text-sm font-medium"
                      value={formData.address}
                      onChange={e => setFormData({...formData, address: e.target.value})}
                    />
                 </div>
              </div>
           </div>

           {/* Social */}
           <div className="space-y-6">
              <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest border-b border-slate-100 pb-2">Réseaux Sociaux</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Facebook URL</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-50 border-none rounded-xl px-5 py-3 text-sm font-medium"
                      value={formData.socialLinks?.facebook}
                      onChange={e => setFormData({...formData, socialLinks: {...formData.socialLinks, facebook: e.target.value}})}
                    />
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">LinkedIn URL</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-50 border-none rounded-xl px-5 py-3 text-sm font-medium"
                      value={formData.socialLinks?.linkedin}
                      onChange={e => setFormData({...formData, socialLinks: {...formData.socialLinks, linkedin: e.target.value}})}
                    />
                 </div>
              </div>
           </div>

           <div className="pt-8 flex justify-end">
              <button 
                type="submit"
                className="bg-slate-900 text-white rounded-2xl px-12 py-4 font-black text-xs uppercase tracking-widest shadow-xl hover:bg-indigo-600 transition-all active:scale-[0.98]"
              >
                Sauvegarder les Changements
              </button>
           </div>
        </form>
      </div>
    </motion.div>
  );
}
