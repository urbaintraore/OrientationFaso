import React, { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Building2, GraduationCap, Award, Star, ShieldCheck, Globe, Mail, Phone, Users, CheckCircle, ExternalLink, PlayCircle, Loader2, Zap, LayoutGrid, List, Calendar, Facebook, Linkedin, Twitter, Instagram, Youtube } from 'lucide-react';
import { mockInstitutions } from '../../data/mockInstitutions';
import { institutionService } from '../../services/institutionService';
import { ufrService } from '../../services/ufrService';
import { programService } from '../../services/programService';
import { postService } from '../../services/postService';
import { Institution, UFR, Program, EstablishmentPost } from '../../types';
import { motion, AnimatePresence } from 'motion/react';

interface InstitutionDetailsProps {
  institutionId: string;
  onBack: () => void;
}

export function InstitutionDetails({ institutionId, onBack }: InstitutionDetailsProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'ufrs' | 'programs' | 'news' | 'reviews'>('overview');
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [ufrs, setUfrs] = useState<UFR[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [posts, setPosts] = useState<EstablishmentPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const instData = await institutionService.getInstitutionById(institutionId);
        let currentInst = instData;
        
        if (!currentInst) {
          currentInst = mockInstitutions.find(i => i.id === institutionId) as Institution;
        }

        if (currentInst) {
          setInstitution(currentInst);
          const [ufrData, programData, postData] = await Promise.all([
            ufrService.getUFRsByInstitution(institutionId),
            programService.getProgramsByInstitution(institutionId),
            postService.getPostsByEstablishment(institutionId)
          ]);
          setUfrs(ufrData);
          
          // Merge Firestore programs with local programs if available
          const mergedPrograms = [...programData];
          if (currentInst.programs && currentInst.programs.length > 0) {
            currentInst.programs.forEach(localProg => {
              if (!mergedPrograms.find(p => p.name === localProg.name)) {
                mergedPrograms.push(localProg);
              }
            });
          }
          setPrograms(mergedPrograms);
          setPosts(postData);
        }
      } catch (error) {
        console.error("Error fetching institution data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [institutionId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium lowercase tracking-widest">Chargement de l'établissement...</p>
        </div>
      </div>
    );
  }

  if (!institution) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md text-center border border-slate-100">
          <Building2 className="w-16 h-16 text-slate-200 mx-auto mb-6" />
          <h2 className="text-2xl font-black text-slate-900 mb-2">Établissement non trouvé</h2>
          <p className="text-slate-500 mb-8 font-medium">
            Désolé, nous n'avons pas pu charger les détails de cet établissement. Il se peut qu'il ait été déplacé ou supprimé.
          </p>
          <button 
            onClick={onBack}
            className="w-full bg-indigo-600 text-white rounded-xl py-3 font-black text-sm uppercase tracking-widest hover:bg-slate-900 transition-colors shadow-lg shadow-indigo-600/20"
          >
            Retour au Marketplace
          </button>
        </div>
      </div>
    );
  }

  const reviewsCount = institution.reviews?.length || 0;
  const programsCount = institution.programs?.length || 0;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Navbar for details */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Retour au Hub
          </button>
          <div className="flex items-center gap-3">
            <button className="hidden md:flex bg-white border border-slate-200 text-slate-700 px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-colors shadow-sm">
              Enregistrer
            </button>
            <button className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-indigo-600/20">
              Poser une question
            </button>
          </div>
        </div>
      </div>

      {/* Hero Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="h-48 md:h-64 relative overflow-hidden">
          <img src={institution.coverImage} alt="Cover" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent" />
          
          <div className="absolute bottom-0 left-0 right-0">
            <div className="container mx-auto px-4 pb-4 flex flex-col md:flex-row items-end gap-5">
              <div className="w-20 h-20 md:w-28 md:h-28 bg-white p-1.5 rounded-xl shadow-2xl flex-shrink-0 relative -mb-6 border-2 border-white overflow-hidden">
                <img src={institution.logo} alt="Logo" className="w-full h-full object-contain" />
                {institution.isVerified && (
                  <div className="absolute -top-1 -right-1 bg-blue-500 text-white p-1 rounded-full ring-2 ring-white shadow-lg" title="Compte vérifié">
                    <ShieldCheck className="w-3 h-3 md:w-4 md:h-4" />
                  </div>
                )}
              </div>
              <div className="flex-1 text-white pb-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest border border-white/10">
                    {institution.type}
                  </span>
                  {institution.tier === 'Sponsored' && (
                    <span className="bg-amber-500/90 backdrop-blur-md text-white px-2 py-0.5 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest border border-white/20">
                      Premium
                    </span>
                  )}
                </div>
                <h1 className="text-xl md:text-3xl lg:text-4xl font-black leading-tight mb-1 tracking-tight drop-shadow-md">{institution.name}</h1>
                <div className="flex flex-wrap items-center gap-3 text-[10px] md:text-xs font-bold text-slate-200">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-indigo-400" /> {institution.city}, {institution.country}</span>
                  <span className="flex items-center gap-1"><Users className="w-3 h-3 text-indigo-400" /> {institution.studentCount?.toLocaleString() || 'N/A'}</span>
                  <span className="flex items-center gap-1 text-amber-400">
                    <Star className="w-3 h-3 fill-current" /> {institution.overallRating}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 mt-10 mb-2">
          <div className="flex border-b border-slate-200 overflow-x-auto no-scrollbar scroll-smooth">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-3 font-black text-[10px] uppercase tracking-widest whitespace-nowrap border-b-2 transition-all ${activeTab === 'overview' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
            >
              Aperçu
            </button>
            {ufrs.length > 0 && (
              <button 
                onClick={() => setActiveTab('ufrs')}
                className={`px-4 py-3 font-black text-[10px] uppercase tracking-widest whitespace-nowrap border-b-2 transition-all ${activeTab === 'ufrs' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
              >
                UFR ({ufrs.length})
              </button>
            )}
            <button 
              onClick={() => setActiveTab('programs')}
              className={`px-4 py-3 font-black text-[10px] uppercase tracking-widest whitespace-nowrap border-b-2 transition-all ${activeTab === 'programs' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
            >
              {(institution.type === 'Collège' || institution.type === 'Lycée' || institution.type === 'Lycée Technique' || institution.type === 'Collège et Lycée') ? 'Séries & Formations' : 'Filières'} ({Math.max(programs.length, institution.programsCount || 0)})
            </button>
            {posts.length > 0 && (
              <button 
                onClick={() => setActiveTab('news')}
                className={`px-4 py-3 font-black text-[10px] uppercase tracking-widest whitespace-nowrap border-b-2 transition-all ${activeTab === 'news' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
              >
                Actualités ({posts.length})
              </button>
            )}
            <button 
              onClick={() => setActiveTab('reviews')}
              className={`px-4 py-3 font-black text-[10px] uppercase tracking-widest whitespace-nowrap border-b-2 transition-all ${activeTab === 'reviews' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
            >
              Avis ({reviewsCount})
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div 
              key="overview"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              <div className="lg:col-span-2 space-y-8">
                {/* Stats Header */}
                <div className="bg-white p-8 rounded-3xl border border-slate-200/60 shadow-sm flex flex-col md:flex-row gap-8 items-center">
                  <div className="w-32 h-32 rounded-full border-8 border-slate-50 flex items-center justify-center bg-indigo-600 text-white shadow-xl">
                    <div className="text-center">
                      <span className="block text-3xl font-black">{institution.reputationScore || 90}%</span>
                      <span className="text-[8px] font-black uppercase tracking-widest opacity-80">Reputation</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">Intelligence d'Insertion</h3>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed">
                      Cet établissement présente un taux d'employabilité de <span className="text-emerald-600 font-black">{institution.employabilityRate}%</span>. 
                      Les diplômés trouvent généralement un emploi stable dans les 6 mois suivant la graduation.
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-8 border border-slate-200/60 shadow-sm">
                  <h3 className="text-xl font-black text-slate-900 mb-6 tracking-tight">À Propos</h3>
                  <p className="text-base text-slate-600 leading-loose font-medium whitespace-pre-wrap">{institution.description}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-white p-8 rounded-3xl border border-slate-200/60 shadow-sm">
                  <h4 className="text-sm font-black text-slate-900 mb-6 uppercase tracking-widest">Coordonnées</h4>
                  <div className="space-y-4">
                    {[
                      { icon: MapPin, label: 'Adresse', value: institution.address || `${institution.city}, ${institution.country}` },
                      { icon: Globe, label: 'Site Web', value: institution.website, isLink: true },
                      { icon: Mail, label: 'Email', value: institution.contactEmail || institution.email },
                      { icon: Phone, label: 'Téléphone', value: institution.contactPhone },
                    ].map((info, idx) => (
                      <div key={idx} className="flex gap-4">
                        <info.icon className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                        <div>
                          <span className="block text-[8px] font-black uppercase text-slate-400 tracking-widest">{info.label}</span>
                          {info.isLink ? (
                            <a href={info.value} target="_blank" rel="noreferrer" className="text-sm font-black text-slate-900 hover:text-indigo-600 transition-colors break-all">
                              {info.value?.replace('https://', '')}
                            </a>
                          ) : (
                            <span className="text-sm font-black text-slate-900">{info.value}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {institution.socialLinks && (
                  <div className="bg-slate-900 p-8 rounded-3xl text-white shadow-xl shadow-slate-900/20">
                    <div className="flex flex-col gap-2 mb-6">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">Réseaux Sociaux</h4>
                      <p className="text-[10px] text-white/40 font-medium">Suivez l'établissement pour les dernières actus</p>
                    </div>
                    <div className="flex flex-wrap gap-4">
                      {institution.socialLinks.facebook && (
                        <a href={institution.socialLinks.facebook} target="_blank" rel="noreferrer" className="p-4 bg-white/5 rounded-2xl hover:bg-indigo-600 transition-all hover:scale-110" title="Facebook">
                          <Facebook className="w-5 h-5" />
                        </a>
                      )}
                      {institution.socialLinks.linkedin && (
                        <a href={institution.socialLinks.linkedin} target="_blank" rel="noreferrer" className="p-4 bg-white/5 rounded-2xl hover:bg-indigo-600 transition-all hover:scale-110" title="LinkedIn">
                          <Linkedin className="w-5 h-5" />
                        </a>
                      )}
                      {institution.socialLinks.twitter && (
                        <a href={institution.socialLinks.twitter} target="_blank" rel="noreferrer" className="p-4 bg-white/5 rounded-2xl hover:bg-indigo-600 transition-all hover:scale-110" title="Twitter">
                          <Twitter className="w-5 h-5" />
                        </a>
                      )}
                      {institution.socialLinks.instagram && (
                        <a href={institution.socialLinks.instagram} target="_blank" rel="noreferrer" className="p-4 bg-white/5 rounded-2xl hover:bg-indigo-600 transition-all hover:scale-110" title="Instagram">
                          <Instagram className="w-5 h-5" />
                        </a>
                      )}
                      {institution.socialLinks.youtube && (
                        <a href={institution.socialLinks.youtube} target="_blank" rel="noreferrer" className="p-4 bg-white/5 rounded-2xl hover:bg-indigo-600 transition-all hover:scale-110" title="YouTube">
                          <Youtube className="w-5 h-5" />
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'ufrs' && (
            <motion.div 
              key="ufrs"
              initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {ufrs.map((ufr, index) => (
                <div key={ufr.id || `ufr-${index}`} className="bg-white p-8 rounded-3xl border border-slate-200/60 shadow-sm">
                   <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6">
                      <GraduationCap className="w-6 h-6" />
                   </div>
                   <h3 className="text-xl font-black text-slate-900 mb-2 leading-tight">{ufr.name}</h3>
                   <p className="text-xs text-slate-500 font-medium leading-relaxed mb-6">{ufr.description}</p>
                   <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
                     <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Programmes</span>
                     <span className="text-sm font-black text-slate-900">
                        {programs.filter(p => p.ufrId === ufr.id).length} Filières
                     </span>
                   </div>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'programs' && (
            <motion.div 
              key="programs"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
            >
              {programs.map((prog, index) => (
                <div key={prog.id || `prog-${index}`} className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col group hover:border-indigo-600 transition-all">
                   <div className="p-8 pb-4">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest font-mono">
                          {prog.employmentTrend}
                        </span>
                        <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest font-mono">
                          {prog.degreeLevel || prog.level}
                        </span>
                      </div>
                      <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight group-hover:text-indigo-600 transition-colors">{prog.name}</h3>
                      <p className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-3 mb-6">{prog.description}</p>
                   </div>
                   
                   <div className="px-8 space-y-4 mb-8">
                     <div className="flex justify-between items-end border-b border-slate-50 pb-4">
                        <div>
                          <span className="block text-[8px] font-black uppercase text-slate-400 tracking-widest mb-1">Durée</span>
                          <span className="text-sm font-black text-slate-900">{prog.duration}</span>
                        </div>
                        <div className="text-right">
                          <span className="block text-[8px] font-black uppercase text-slate-400 tracking-widest mb-1">Scolarité / an</span>
                          <span className="text-sm font-black text-slate-900">{prog.tuitionFee?.toLocaleString()} FCFA</span>
                        </div>
                     </div>
                     <div className="flex justify-between items-end">
                        <div>
                          <span className="block text-[8px] font-black uppercase text-slate-400 tracking-widest mb-1">Salaire Moyen</span>
                          <span className="text-xs font-black text-emerald-600">{prog.averageSalary || 'Non défini'}</span>
                        </div>
                        <div className="text-right">
                          <span className="block text-[8px] font-black uppercase text-slate-400 tracking-widest mb-1">Insertion</span>
                          <span className="text-xs font-black text-indigo-600">{prog.employmentScore || 80}/100</span>
                        </div>
                     </div>
                   </div>

                   <div className="mt-auto p-4 bg-slate-50 border-t border-slate-100 flex flex-col gap-3">
                     <div className="flex gap-2">
                       <button className="flex-1 bg-white border border-slate-200 text-slate-900 rounded-xl py-3 font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all">
                          Brochure
                       </button>
                       <button className="flex-2 bg-slate-900 text-white rounded-xl py-3 font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all">
                          Candidater
                       </button>
                     </div>
                     <div className="pt-2 border-t border-slate-200/50">
                        <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-2">Compétences clés</p>
                        <div className="flex flex-wrap gap-1">
                           {(prog.skills || []).slice(0, 3).map(skill => (
                             <span key={skill} className="bg-white px-2 py-0.5 rounded text-[7px] font-black uppercase text-slate-600 border border-slate-200">
                               {skill}
                             </span>
                           ))}
                           {(!prog.skills || prog.skills.length === 0) && (
                             <span className="text-[7px] font-bold text-slate-300 uppercase">Non renseignées</span>
                           )}
                        </div>
                     </div>
                   </div>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'news' && (
            <motion.div 
              key="news"
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }}
              className="columns-1 md:columns-2 gap-8 space-y-8"
            >
              {posts.map((post, index) => (
                <div key={post.id || `post-${index}`} className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden break-inside-avoid">
                   {post.mediaUrl && (
                     <div className="aspect-video relative overflow-hidden">
                       <img src={post.mediaUrl} className="w-full h-full object-cover" alt="" />
                       {post.isImportant && (
                         <div className="absolute top-4 left-4 bg-rose-600 text-white px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-xl">
                            Important
                         </div>
                       )}
                     </div>
                   )}
                   <div className="p-8">
                       <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                             <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                             <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">
                               {new Date(post.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                             </span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                             post.category === 'Concours' ? 'bg-rose-100 text-rose-700' :
                             post.category === 'Événement' ? 'bg-indigo-100 text-indigo-700' :
                             'bg-slate-100 text-slate-600'
                          }`}>
                             {post.category || 'Actualité'}
                          </span>
                       </div>
                      <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight leading-tight">{post.title}</h3>
                      <p className="text-sm text-slate-600 font-medium leading-relaxed whitespace-pre-wrap">{post.content}</p>
                   </div>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'reviews' && (
            <motion.div 
              key="reviews"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="max-w-2xl mx-auto space-y-6"
            >
              {/* Similar reviews logic as before but more polished */}
              {institution.reviews?.map((review, index) => (
                 <div key={review.id || `review-${index}`} className="bg-white p-8 rounded-3xl border border-slate-200/60 shadow-sm shadow-sm">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-black text-xl">
                        {review.author[0]}
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900">{review.author}</h4>
                        <div className="flex text-amber-400 mt-0.5">
                          {[1,2,3,4,5].map(s => <Star key={s} className={`w-3 h-3 ${s <= review.rating ? 'fill-current' : 'text-slate-100'}`} />)}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 font-medium italic leading-loose block border-l-4 border-indigo-50 pl-6">
                      "{review.comment}"
                    </p>
                 </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
