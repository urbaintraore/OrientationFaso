import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HelpCircle, ChevronDown, ChevronUp, Sparkles, Send, Globe, ArrowRight, BookOpen, Clock } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
  category: string;
}

const PRESET_FAQS: FaqItem[] = [
  {
    question: "Qu'est-ce que la plateforme Campus Faso et comment s'y inscrire ?",
    answer: "Campus Faso est la plateforme nationale d'orientation et d'inscription en ligne des bacheliers dans les institutions d'enseignement supérieur publiques et privées du Burkina Faso. La procédure comprend la création d'un identifiant national unique (INE), le paiement en ligne des frais d'orientation via Mobile Money (Orange Money, Moov Money ou Wave), et la formulation de 10 choix de filières par ordre de préférence.",
    category: "Orientation Process"
  },
  {
    question: "Comment s'inscrire en ligne sur eConcours ?",
    answer: "La Direction Générale du Recrutement de l'État (DGRE) organise les concours directs d'entrée dans la fonction publique burkinabè. Les inscriptions se font exclusivement sur le site 'econcours.gov.bf'. Vous devez créer un compte candidat avec votre numéro de téléphone fonctionnel, renseigner votre profil civil, téléverser une copie lisible de votre CNIB, et choisir le concours adapté à votre diplôme (BEPC, BAC, Licence, Master etc.).",
    category: "Concours"
  },
  {
    question: "Quels sont les critères d'attribution d'une bourse d'études au CIOSPB ?",
    answer: "Le Centre National de l'Information, de l'Orientation Scolaire et Professionnelle et des Bourses (CIOSPB) gère les bourses nationales et de coopération. Pour la bourse de premier cycle (BAC), les critères de sélection incluent le fait d'avoir moins de 22 ans, d'être de nationalité burkinabè, et d'avoir obtenu au moins une mention Bien ou Très Bien au baccalauréat. Les aides financières de rentrée FOPRES ou FONER sont ouvertes sous condition sociale.",
    category: "Scholarships"
  },
  {
    question: "Quelle est la différence entre les séries Seconde C, Seconde A et Seconde T ?",
    answer: "Après l'obtention du BEPC, l'orientation au lycée s'articule ainsi : la Seconde A est axée sur les disciplines littéraires, philosophiques et les langues. La Seconde C cible intensément les mathématiques et la physique-chimie, idéale pour les filières d'ingénierie et de sciences dures. Les Secondes Techniques et Professionnelles (AB, G1, F, T) forment aux professions spécialisées (comptabilité, électronique, bâtiment, informatique) assurant une employabilité précoce.",
    category: "Orientation Process"
  },
  {
    question: "Existe-t-il des bourses spécialisées de recherche scientifique au Burkina ?",
    answer: "Oui, le Fonds de Soutien à l'Orientation et à la Recherche (FOSER) attribue des aides d'études ciblées et des subventions d'excellence de cycle doctoral pour soutenir des projets novateurs reliés à l'autosuffisance alimentaire, la transition écologique ou les applications solaires sahéliennes.",
    category: "Scholarships"
  },
  {
    question: "Quels documents officiels faut-il fournir pour le dossier de candidature universitaire ?",
    answer: "Le dossier de candidature requiert les pièces suivantes : une copie certifiée de l'attestation de succès au BAC, des relevés ou bulletins de notes (Seconde, Première, Terminale), une copie d'acte de naissance, un Curriculum Vitae (CV) scolaire, et une lettre de motivation rédigée pour la filière demandée.",
    category: "Documents"
  },
  {
    question: "Quelles sont les dates limites pour déposer un dossier d'orientation sur Campus Faso ?",
    answer: "Les campagnes de candidatures et de formulation de choix ont généralement lieu de fin juillet à mi-septembre après les résultats officiels des sessions normales et de remplacement du baccalauréat au Burkina Faso.",
    category: "Orientation Process"
  },
  {
    question: "Comment certifier ou téléverser les bulletins de notes sur la plateforme ?",
    answer: "Vous devez numériser proprement vos originaux en un fichier unique par document. Si vous utilisez un smartphone, vous pouvez activer notre outil de prise de photo-caméras qui redressera de façon autonome le cliché afin de le convertir en format PDF standardisé prêt à être téléversé.",
    category: "Documents"
  }
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [customQuestion, setCustomQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [relatedLinks, setRelatedLinks] = useState<{ text: string; url: string }[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const categoriesMap: Record<string, string> = {
    all: "Toutes les questions",
    "Orientation Process": "Orientation Process",
    Scholarships: "Scholarships",
    Documents: "Documents",
    Concours: "Concours"
  };

  const togglePreset = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const askPresetToAi = async (question: string) => {
    setCustomQuestion(question);
    await handleAskAi(question);
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuestion.trim()) return;
    await handleAskAi(customQuestion);
  };

  const handleAskAi = async (questionText: string) => {
    setIsAiLoading(true);
    setAiAnswer(null);
    setRelatedLinks([]);
    setAiError(null);

    try {
      const res = await fetch('/api/gemini/faq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: questionText })
      });

      if (!res.ok) {
        throw new Error("Impossible de joindre le conseiller d'orientation IA.");
      }

      const data = await res.json();
      setAiAnswer(data.answer);
      if (data.relatedLinks) {
        setRelatedLinks(data.relatedLinks);
      }
    } catch (err: any) {
      console.error(err);
      setAiError(
        "Une erreur s'est produite lors de l'appel au conseiller d'orientation IA. Veuillez réessayer plus tard ou consulter nos FAQs prédéfinies."
      );
    } finally {
      setIsAiLoading(false);
    }
  };

  function parseSimpleMarkdown(text: string): string {
    let html = text;
    // Replace markdown headers
    html = html.replace(/^### (.*$)/gim, '<h4 class="text-lg font-bold text-slate-900 mt-4 mb-2">$1</h4>');
    html = html.replace(/^## (.*$)/gim, '<h3 class="text-xl font-bold text-indigo-700 mt-5 mb-3">$1</h3>');
    // Replace bold text
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-indigo-950">$1</strong>');
    // Replace list items
    html = html.replace(/^\s*[\*\-]\s+(.*$)/gim, '<li class="ml-4 list-disc text-slate-600 my-1">$1</li>');
    
    const lines = html.split('\n');
    let openList = false;
    const processedLines = lines.map(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('<li')) {
        if (!openList) {
          openList = true;
          return '<ul class="space-y-1 my-2">' + trimmed;
        }
        return trimmed;
      } else {
        if (openList) {
          openList = false;
          return '</ul>' + (trimmed ? `<p class="my-2 text-slate-600 leading-relaxed text-sm md:text-base">${trimmed}</p>` : '');
        }
        if (trimmed && !trimmed.startsWith('<h') && !trimmed.startsWith('<u') && !trimmed.startsWith('</u')) {
          return `<p class="my-2 text-slate-600 leading-relaxed text-sm md:text-base">${trimmed}</p>`;
        }
        return trimmed;
      }
    });
    if (openList) {
      processedLines.push('</ul>');
    }
    return processedLines.join('\n');
  }

  const filteredFaqs = PRESET_FAQS.filter((faq) => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <section id="faq-section" className="py-20 bg-slate-50 border-t border-slate-100">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="text-center mb-12">
          <span className="bg-indigo-50 text-indigo-600 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider mb-3 inline-block">
            Assistance d'Orientation
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 tracking-tight">
            Foire Aux Questions & Conseiller IA
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Trouvez des réponses immédiates sur les bourses du CIOSPB, les inscriptions Campus Faso, la fonction publique burkinabè et les séries d'études.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-start">
          {/* Preset FAQs Accordion */}
          <div className="space-y-4">
            <div className="flex flex-col gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                  <HelpCircle className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Questions Courantes</h3>
              </div>

              {/* SEARCH BAR */}
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher une réponse (ex: CIOSPB, Campus Faso...)"
                  className="w-full text-xs px-3.5 py-2.5 pl-9 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-705"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </span>
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600">Effacer</button>
                )}
              </div>

              {/* THEMATIC CATEGORY PILLS */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {Object.entries(categoriesMap).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setActiveCategory(key);
                      setOpenIndex(null);
                    }}
                    className={`px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider rounded-lg border transition-all cursor-pointer ${
                      activeCategory === key
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {label === 'all' ? 'Toutes' : label}
                  </button>
                ))}
              </div>
            </div>

            {filteredFaqs.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-150 text-slate-400 text-xs italic">
                Aucune question ne correspond à vos critères de recherche.
              </div>
            ) : (
              filteredFaqs.map((faq, idx) => {
                // Find original index matching this faq if toggle needs original mapping,
                // but since open is indexed inside list, using idx specifically for this subset or caching state cleanly:
                const isOpen = openIndex === idx;
                return (
                  <div 
                    key={idx} 
                    className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden transition-all hover:shadow-md"
                  >
                    <button
                      onClick={() => togglePreset(isOpen ? null : idx)}
                      className="w-full text-left p-5 flex items-center justify-between gap-4 font-medium text-slate-900 hover:text-indigo-600 transition-colors focus:outline-none"
                    >
                      <span className="text-sm md:text-base">{faq.question}</span>
                      {isOpen ? (
                        <ChevronUp className="h-5 w-5 text-indigo-600 shrink-0" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-slate-400 shrink-0" />
                      )}
                    </button>

                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="px-5 pb-5 border-t border-slate-50 pt-3">
                            <p className="text-slate-600 text-sm leading-relaxed mb-4">
                              {faq.answer}
                            </p>
                            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                              <span className="bg-slate-100 text-slate-600 text-xs px-2.5 py-1 rounded-md font-medium">
                                {categoriesMap[faq.category] || faq.category}
                              </span>
                              <button
                                onClick={() => askPresetToAi(faq.question)}
                                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 cursor-pointer"
                              >
                                Approfondir avec l'IA <Sparkles className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })
            )}
          </div>

          {/* Interactive AI Chat Counselor */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-lg p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Conseiller Orientation IA</h3>
                  <p className="text-xs text-emerald-600 flex items-center gap-1 font-medium mt-0.5">
                    <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                    Burkina Faso Orientation Expert
                  </p>
                </div>
              </div>
            </div>

            <p className="text-sm text-slate-600 mb-6">
              Saisissez n'importe quelle question sur vos projets d'études, les conditions scolaires, bourses ou débouchés. L'IA consultera les procédures de l'État pour vous éclairer.
            </p>

            <form onSubmit={handleCustomSubmit} className="relative mb-6">
              <input
                type="text"
                value={customQuestion}
                onChange={(e) => setCustomQuestion(e.target.value)}
                placeholder="Ex: Quelle moyenne faut-il pour la bourse du CIOSPB ?"
                className="w-full pl-4 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm md:text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-sans"
              />
              <button
                type="submit"
                disabled={isAiLoading || !customQuestion.trim()}
                className="absolute right-2 top-2 h-10 w-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center transition-all hover:bg-indigo-700 active:scale-95 disabled:bg-slate-100 disabled:text-slate-400 disabled:scale-100 cursor-pointer"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>

            {/* AI Response Display Area */}
            <div className="min-h-[160px] bg-slate-50/50 border border-dashed border-slate-100 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between">
              {isAiLoading && (
                <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex flex-col items-center justify-center p-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent mb-3"></div>
                  <p className="text-xs font-medium text-slate-700 animate-pulse">
                    Mise en relation avec le conseiller d'orientation virtuel...
                  </p>
                </div>
              )}

              {!aiAnswer && !aiError && !isAiLoading && (
                <div className="text-center py-6 flex flex-col items-center justify-center h-full">
                  <Sparkles className="h-10 w-10 text-slate-300 mb-2" />
                  <p className="text-sm text-slate-500 italic">
                    Posez votre question ci-dessus ou cliquez sur "Approfondir avec l'IA" à gauche pour démarrer.
                  </p>
                </div>
              )}

              {aiError && (
                <div className="text-red-600 text-sm py-2">
                  <p className="font-semibold mb-1">Erreur de connexion</p>
                  <p className="text-slate-600 text-xs leading-loose">{aiError}</p>
                </div>
              )}

              {aiAnswer && !isAiLoading && (
                <div className="flex-grow flex flex-col justify-between">
                  <div 
                    className="prose prose-slate max-w-none text-slate-700 text-sm md:text-base leading-relaxed mb-6"
                    dangerouslySetInnerHTML={{ __html: parseSimpleMarkdown(aiAnswer) }}
                  />

                  {relatedLinks.length > 0 && (
                    <div className="border-t border-slate-100 pt-4 mt-4">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Globe className="h-3.5 w-3.5" /> Liens Officiels recommandés :
                      </p>
                      <div className="space-y-1.5">
                        {relatedLinks.map((link, idx) => (
                          <a
                            key={idx}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                          >
                            {link.text} <ArrowRight className="h-3 w-3 translate-y-0.5" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
