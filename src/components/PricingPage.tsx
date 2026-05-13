import React from 'react';
import { motion } from 'motion/react';
import { Check, X, Download, ShieldCheck, Zap, Sparkles, Globe, ChartBar, BookOpen, Users, Rocket, GraduationCap, Building2 } from 'lucide-react';
import { Partners } from './Partners';
import { jsPDF } from 'jspdf';

interface PricingPageProps {
  onStart: () => void;
}

export function PricingPage({ onStart }: PricingPageProps) {
  const downloadTechnicalSheet = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(30, 41, 59); // slate-900
    doc.text('OrientationBF - Fiche Technique & Guide', 20, 20);
    
    doc.setFontSize(12);
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text('La plateforme d\'orientation intelligente n°1 au Burkina Faso', 20, 30);
    
    // Section: Fonctionnalités
    doc.setFontSize(16);
    doc.setTextColor(79, 70, 229); // indigo-600
    doc.text('Fonctionnalités Clés', 20, 50);
    
    const featuresList = [
      'Analyse IA : Algorithmes prédictifs basés sur les notes du collège ou du Lycée.',
      'Rapports Personnalisés : PDF de 15+ pages avec conseils stratégiques.',
      'Annuaire Global : Plus de 500 établissements répertoriés.',
      'Intelligence des Bourses : Détecteur automatique d\'opportunités.',
      'Portail Établissement : Gestion directe pour les écoles partenaires.',
      'Espace Parent : Suivi du projet d\'orientation de l\'élève.'
    ];
    
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    featuresList.forEach((feature, index) => {
      doc.text(`• ${feature}`, 25, 65 + (index * 10));
    });

    // Section: Guide d'Utilisation
    doc.addPage();
    doc.setFontSize(16);
    doc.setTextColor(79, 70, 229);
    doc.text('Guide d\'Utilisation par Profil', 20, 20);

    const guides = [
      {
        profile: 'Élève',
        steps: [
          'Créer un compte et renseigner ses notes du collège ou du Lycée.',
          'Lancer l\'analyse IA pour découvrir ses séries idéales.',
          'Consulter l\'annuaire pour trouver les meilleurs lycées.',
          'Générer son rapport PDF d\'orientation complet.'
        ]
      },
      {
        profile: 'Parent',
        steps: [
          'Associer son compte à celui de l\'enfant.',
          'Consulter les rapports d\'analyse Premium.',
          'Accéder aux conseils d\'experts pour l\'accompagnement.',
          'Payer les frais de service via Mobile Money en toute sécurité.'
        ]
      },
      {
        profile: 'Établissement',
        steps: [
          'Créer son profil institutionnel certifié.',
          'Publier et mettre à jour ses filières et tarifs.',
          'Interagir avec les futurs élèves via le Hub.',
          'Suivre ses statistiques de visibilité sur la plateforme.'
        ]
      }
    ];

    let yOffset = 40;
    guides.forEach(g => {
      doc.setFontSize(14);
      doc.setTextColor(30, 41, 59);
      doc.text(g.profile, 20, yOffset);
      yOffset += 10;
      doc.setFontSize(11);
      g.steps.forEach(step => {
        doc.text(`- ${step}`, 25, yOffset);
        yOffset += 8;
      });
      yOffset += 10;
    });
    
    // Footer
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184);
    doc.text('Document généré le ' + new Date().toLocaleDateString('fr-FR'), 20, 280);
    doc.text('Email : urbain.traore@ujkz.bf', 20, 285);
    doc.text('WhatsApp : 0022663375257', 130, 285);
    
    doc.save('OrientationBF_Fiche_Technique_Guide.pdf');
  };

  const features = [
    {
      icon: <Sparkles className="w-5 h-5" />,
      title: "Analyse IA Avancée",
      desc: "Notre moteur d'IA analyse vos notes pour prédire vos chances de succès dans chaque série."
    },
    {
      icon: <Globe className="w-5 h-5" />,
      title: "Annuaire Exhaustif",
      desc: "Accédez aux fiches détaillées de tous les lycées, collèges et centres de formation."
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: "Rapports Instantanés",
      desc: "Générez et téléchargez votre dossier d'orientation complet en moins de 2 minutes."
    },
    {
      icon: <ChartBar className="w-5 h-5" />,
      title: "Suivi de Progression",
      desc: "Visualisez l'évolution de votre profil académique au fil des trimestres."
    },
    {
      icon: <BookOpen className="w-5 h-5" />,
      title: "Intelligence des Bourses",
      desc: "Soyez alerté des bourses nationales et internationales correspondant à votre profil."
    },
    {
      icon: <Users className="w-5 h-5" />,
      title: "Espace Collaboratif",
      desc: "Parents et élèves travaillent ensemble sur un projet d'avenir cohérent."
    }
  ];

  const guideCards = [
    {
      profile: "Élève",
      icon: <GraduationCap className="w-10 h-10 text-indigo-600" />,
      steps: ["Saisie des notes", "Analyse IA", "Choix d'écoles", "Rapport PDF"]
    },
    {
      profile: "Parent",
      icon: <Users className="w-10 h-10 text-emerald-600" />,
      steps: ["Suivi enfant", "Conseils experts", "Paiement sécurisé", "Planification"]
    },
    {
      profile: "Établissement",
      icon: <Building2 className="w-10 h-10 text-amber-600" />,
      steps: ["Profil certifié", "Publication filières", "Marketing digital", "Stats"]
    },
    {
      profile: "Administrateur",
      icon: <ShieldCheck className="w-10 h-10 text-rose-600" />,
      steps: ["Gestion utilisateurs", "Validation écoles", "Support technique", "Audits"]
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-32">
      <div className="container mx-auto max-w-6xl px-4">
        {/* Hero Section */}
        <div className="text-center mb-16 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-8">
            <motion.span 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="px-4 py-1.5 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-xl shadow-indigo-200"
            >
              Édition 2026
            </motion.span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">Nos Offres & Fonctionnalités</h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto font-medium">
            Propulse ton avenir avec nos outils d'analyse basés sur l'intelligence artificielle.
          </p>
          
          <button 
            onClick={downloadTechnicalSheet}
            className="mt-8 inline-flex items-center gap-2 bg-white text-indigo-600 border border-indigo-100 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-50 transition-all shadow-xl shadow-indigo-100 hover:scale-105"
          >
            <Download className="w-4 h-4" />
            Télécharger le Guide Complet (PDF)
          </button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-24">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white p-8 rounded-3xl border border-slate-100 hover:border-indigo-200 transition-all group"
            >
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all mb-6">
                {feature.icon}
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed font-medium">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </div>

        {/* New Multi-Profile Guide Section */}
        <div className="mb-24">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Guide d'Utilisation</h3>
            <p className="text-slate-500 font-medium">Comment profiter au maximum de la plateforme selon votre profil.</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {guideCards.map((guide, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -5 }}
                className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-slate-200 transition-all"
              >
                <div className="mb-6">{guide.icon}</div>
                <h4 className="text-xl font-black text-slate-900 mb-4">{guide.profile}</h4>
                <div className="space-y-3">
                  {guide.steps.map((step, sIdx) => (
                    <div key={sIdx} className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-slate-50 flex items-center justify-center text-[10px] font-black text-slate-400 border border-slate-100">
                        {sIdx + 1}
                      </div>
                      <span className="text-[11px] font-bold text-slate-600">{step}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Offre Gratuite */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-[40px] p-10 shadow-lg border border-slate-100 flex flex-col relative overflow-hidden"
          >
            <div className="mb-8 relative z-10">
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Découverte</h3>
              <div className="mt-4 flex items-baseline text-slate-900">
                <span className="text-6xl font-black tracking-tighter">0</span>
                <span className="ml-1 text-xl font-bold text-slate-400 tracking-widest">FCFA</span>
              </div>
              <p className="mt-4 text-slate-500 font-medium italic">Idéal pour tester l'IA.</p>
            </div>
            
            <ul className="space-y-4 mb-10 flex-1 relative z-10">
              {[
                { label: "Analyse de base du profil", check: true },
                { label: "Recommandation de série", check: true },
                { label: "Score de confiance IA", check: false },
                { label: "Rapport PDF détaillé", check: false },
                { label: "Liste complète des écoles", check: false },
              ].map((item, i) => (
                <li key={i} className={`flex items-center gap-3 ${!item.check ? 'opacity-30' : ''}`}>
                  {item.check ? <Check className="w-5 h-5 text-emerald-500" /> : <X className="w-5 h-5 text-slate-400" />}
                  <span className="text-sm font-bold text-slate-700">{item.label}</span>
                </li>
              ))}
            </ul>

            <button 
              onClick={onStart}
              className="w-full bg-slate-100 border border-slate-200 rounded-2xl py-4 font-black text-xs uppercase tracking-widest text-slate-900 hover:bg-slate-950 hover:text-white transition-all transform hover:-translate-y-1"
            >
              C'est parti
            </button>
          </motion.div>

          {/* Offre Premium */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-indigo-900 rounded-[40px] p-10 shadow-2xl shadow-indigo-200 border-4 border-indigo-400 relative flex flex-col text-white"
          >
            <div className="absolute top-6 right-6">
              <Rocket className="w-12 h-12 text-indigo-400 opacity-20 rotate-12" />
            </div>
            
            <div className="mb-8 relative z-10">
              <div className="inline-block bg-indigo-500 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest mb-4">
                Le choix des parents
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tight">Premium</h3>
              <div className="mt-4 flex items-baseline">
                <span className="text-6xl font-black tracking-tighter">2 000</span>
                <span className="ml-1 text-xl font-bold text-indigo-400 tracking-widest">FCFA</span>
              </div>
              <p className="mt-4 text-indigo-200 font-medium">Validité illimitée.</p>
            </div>
            
            <ul className="space-y-4 mb-10 flex-1 relative z-10">
              {[
                { label: "Analyse IA Complète & Précise" },
                { label: "Rapport PDF (15+ pages)" },
                { label: "Liste personnalisée des écoles" },
                { label: "Débouchés métiers détaillés" },
                { label: "Conseils stratégiques parentaux" },
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-sm font-bold">{item.label}</span>
                </li>
              ))}
            </ul>

            <button 
              onClick={onStart}
              className="w-full bg-white text-indigo-900 rounded-2xl py-4 font-black text-xs uppercase tracking-widest hover:bg-amber-400 hover:text-white transition-all transform hover:-translate-y-1 shadow-xl"
            >
              Obtenir mon rapport
            </button>
            
            <div className="mt-8 flex justify-center gap-6 items-center opacity-70">
               <span className="text-[10px] font-black uppercase tracking-widest">Orange Money OK</span>
               <span className="text-[10px] font-black uppercase tracking-widest">Moov Money OK</span>
            </div>
          </motion.div>
        </div>
      </div>
      
      <div className="mt-32">
        <Partners />
      </div>
    </div>
  );
}
