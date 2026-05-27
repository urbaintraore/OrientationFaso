import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Quote, Star } from 'lucide-react';

const STORIES = [
  {
    id: 1,
    name: "Amina Tiemtoré",
    role: "Étudiante en Médecine, Université Joseph Ki-Zerbo",
    image: "https://images.unsplash.com/photo-1531123897727-8f129e1bf98c?w=400&q=80",
    quote: "Grâce à l'analyse de mes notes en SVT et Physique, OrientationBF m'a confirmé que la série D était mon meilleur atout. L'estimation de réussite était juste, et aujourd'hui je suis en 2ème année de médecine !",
    rating: 5
  },
  {
    id: 2,
    name: "Karim Ouedraogo",
    role: "Ingénieur Logiciel, Diplômé de l'IBAM",
    image: "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=400&q=80",
    quote: "J'hésitais entre économie et informatique. Les résultats d'OrientationBF ont mis en évidence mes points forts en logique et en mathématiques. Leurs recommandations de filières ont changé ma vie.",
    rating: 5
  },
  {
    id: 3,
    name: "Fatoumata Diallo",
    role: "Élève en Terminale G2",
    image: "https://images.unsplash.com/photo-1589156280159-27698a70f29e?w=400&q=80",
    quote: "Mes parents voulaient que je fasse la série C, mais le rapport a montré que j'excellais dans les matières littéraires et de gestion. J'ai pu leur prouver que la série G2 était mon chemin idéal.",
    rating: 5
  },
  {
    id: 4,
    name: "Ousmane Sawadogo",
    role: "Étudiant en Droit, Université Thomas Sankara",
    image: "https://images.unsplash.com/photo-1522529599102-1322a5f44e20?w=400&q=80",
    quote: "L'application m'a permis de comprendre que ma passion pour l'histoire et l'expression orale faisait de moi un excellent candidat pour le droit. Je ne regrette pas ce choix.",
    rating: 5
  },
  {
    id: 5,
    name: "Aïcha Kaboré",
    role: "Élève Ingénieur, 2iE",
    image: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=400&q=80",
    quote: "Mon profil scientifique a été parfaitement analysé. OrientationBF m'a suggéré de viser une école d'ingénieur en eau et assainissement, une filière très porteuse au Burkina.",
    rating: 5
  },
  {
    id: 6,
    name: "Boubacar Zongo",
    role: "Étudiant en Marketing, ISIG International",
    image: "https://images.unsplash.com/photo-1530268729831-4b0b9e170218?w=400&q=80",
    quote: "Avec un bac A4, j'étais perdu. La plateforme m'a orienté vers le marketing en tenant compte de ma créativité et de mon aisance relationnelle.",
    rating: 4
  },
  {
    id: 7,
    name: "Mariam Compaoré",
    role: "Étudiante en Agronomie, Université Nazi Boni",
    image: "https://images.unsplash.com/photo-1489424702705-961e680addca?w=400&q=80",
    quote: "L'option Agronomie m'a été proposée au vu de mes fortes notes en SVT et mon intérêt pour l'environnement. C'est exactement le domaine où je m'épanouis aujourd'hui.",
    rating: 5
  },
  {
    id: 8,
    name: "Salifou Ilboudo",
    role: "Développeur Web Junior",
    image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80",
    quote: "Grâce aux MOOCs recommandés pour combler mes faiblesses en maths, j'ai pu me réorienter vers le développement web. Le suivi est fantastique.",
    rating: 5
  },
  {
    id: 9,
    name: "Bintou Traoré",
    role: "Étudiante en Finance, U-AUBEN",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80",
    quote: "Le rapport d'OrientationBF a été un véritable guide pour mes choix post-BAC. La clarté des statistiques m'a rassurée dans mon choix d'études en finance.",
    rating: 5
  },
  {
    id: 10,
    name: "Issa Sanou",
    role: "Étudiant en Télécoms, ESTA",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80",
    quote: "L'outil gratuit m'a ouvert les yeux sur les opportunités du marché burkinabè en matière de télécoms. Je recommande à tous les lycéens d'essayer !",
    rating: 4
  }
];

export function SuccessStories() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((current) => (current + 1) % STORIES.length);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrentIndex((current) => (current + 1) % STORIES.length);
  };

  const prevSlide = () => {
    setCurrentIndex((current) => (current - 1 + STORIES.length) % STORIES.length);
  };

  return (
    <section className="py-24 bg-white relative">
      <div className="absolute inset-0 bg-slate-50/50 [mask-image:linear-gradient(to_bottom,white,transparent)]" />
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <div className="mb-4 inline-flex items-center rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-sm text-indigo-600 font-medium">
            Témoignages
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-4 sm:text-4xl">Ils ont trouvé leur voie avec nous</h2>
          <p className="text-slate-600 max-w-2xl mx-auto text-lg">
            Découvrez les expériences d'élèves et d'étudiants qui ont utilisé notre plateforme pour réussir leur orientation.
          </p>
        </div>

        <div className="max-w-5xl mx-auto relative group">
          <div className="absolute top-1/2 -left-4 md:-left-12 -translate-y-1/2 z-20 hidden md:block">
            <button 
              onClick={prevSlide}
              className="p-4 rounded-full bg-white border border-slate-100 text-slate-400 hover:text-indigo-600 hover:border-indigo-100 hover:shadow-md transition-all opacity-0 group-hover:opacity-100"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          </div>
          
          <div className="absolute top-1/2 -right-4 md:-right-12 -translate-y-1/2 z-20 hidden md:block">
            <button 
              onClick={nextSlide}
              className="p-4 rounded-full bg-white border border-slate-100 text-slate-400 hover:text-indigo-600 hover:border-indigo-100 hover:shadow-md transition-all opacity-0 group-hover:opacity-100"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          <div className="overflow-hidden relative px-4 py-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="bg-white rounded-[2rem] p-8 md:p-14 shadow-xl border border-slate-100 relative"
              >
                <div className="absolute -top-6 -left-2 text-indigo-100 rotate-180 z-0">
                  <Quote className="w-24 h-24 fill-current opacity-50" />
                </div>
                
                <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-center relative z-10">
                  <div className="w-40 h-40 shrink-0 relative">
                    <img 
                      src={STORIES[currentIndex].image} 
                      alt={STORIES[currentIndex].name}
                      className="w-full h-full object-cover rounded-full ring-8 ring-indigo-50 shadow-md"
                    />
                    <div className="absolute bottom-0 right-0 bg-white p-1 rounded-full shadow-lg">
                      <div className="bg-indigo-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm">
                        {STORIES[currentIndex].rating} <Star className="w-3 h-3 ml-0.5 fill-current" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-1 text-center md:text-left">
                    <div className="flex justify-center md:justify-start gap-1 mb-6 text-amber-400">
                      {[...Array(STORIES[currentIndex].rating)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-current" />
                      ))}
                    </div>
                    <blockquote className="text-xl md:text-2xl text-slate-800 font-medium leading-relaxed mb-8">
                       "{STORIES[currentIndex].quote}"
                    </blockquote>
                    <div>
                      <div className="font-bold text-slate-900 text-xl">{STORIES[currentIndex].name}</div>
                      <div className="text-indigo-600 font-medium">{STORIES[currentIndex].role}</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex justify-center gap-3 mt-4">
            {STORIES.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  index === currentIndex ? 'w-8 bg-indigo-600' : 'w-2.5 bg-slate-200 hover:bg-slate-300'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
