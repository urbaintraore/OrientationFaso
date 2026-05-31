import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BrainCircuit, 
  GraduationCap, 
  BookOpen, 
  Award, 
  ChevronRight, 
  Play, 
  ArrowLeft,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  TrendingUp,
  History,
  Target
} from 'lucide-react';
import { generateQuiz, QuizGenerationRequest, AIQuizResponse, QuizQuestion } from '../../services/quizGenerator';

interface QuizHubProps {
  onBack: () => void;
  userEmail?: string;
}

const LEVELS = [
  { id: 'college', name: 'Collège', classes: ['6e', '5e', '4e', '3e'] },
  { id: 'lycee', name: 'Lycée', classes: ['2nde', '1ère', 'Terminale'] },
];

const SERIES = ['A4', 'C', 'D', 'F1', 'F2', 'F3', 'F4', 'G1', 'G2', 'G3', 'H', 'Toutes Séries'];

const SUBJECTS_COLLEGE = ['Mathématiques', 'Français', 'Anglais', 'Histoire', 'Géographie', 'SVT', 'Physique-Chimie', 'Éducation Civique', 'Allemand', 'Espagnol', 'Informatique'];
const SUBJECTS_LYCEE = ['Mathématiques', 'Physique', 'Chimie', 'SVT', 'Français', 'Philosophie', 'Anglais', 'Histoire', 'Géographie', 'Informatique', 'Comptabilité', 'Économie', 'Mécanique', 'Génie Civil', 'Réseaux Informatiques'];

type QuizState = 'setup' | 'loading' | 'playing' | 'results';

export function QuizHub({ onBack, userEmail }: QuizHubProps) {
  const [state, setState] = useState<QuizState>('setup');
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [level, setLevel] = useState<string>('Lycée');
  const [schoolClass, setSchoolClass] = useState<string>('Terminale');
  const [series, setSeries] = useState<string>('D');
  const [subject, setSubject] = useState<string>('Mathématiques');
  const [chapter, setChapter] = useState<string>('');
  const [difficulty, setDifficulty] = useState<string>('Moyen');
  const [numQuestions, setNumQuestions] = useState<number>(10);
  const [mode, setMode] = useState<"Normal" | "BEPC" | "BAC" | "Remédiation" | "Examen">('Normal');

  // Quiz State
  const [quizData, setQuizData] = useState<AIQuizResponse | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [score, setScore] = useState(0);

  const availableClasses = LEVELS.find(l => l.name === level)?.classes || [];
  const availableSubjects = level === 'Collège' ? SUBJECTS_COLLEGE : SUBJECTS_LYCEE;

  const handleGenerate = async () => {
    setState('loading');
    setError(null);
    try {
      const request: QuizGenerationRequest = {
        level,
        schoolClass,
        series: level === 'Lycée' ? series : 'Toutes Séries',
        subject,
        chapter: chapter || 'Général',
        difficulty,
        numberOfQuestions: numQuestions,
        mode
      };

      const response = await generateQuiz(request);
      setQuizData(response);
      setCurrentQuestionIndex(0);
      setUserAnswers({});
      setScore(0);
      setState('playing');
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue lors de la génération.');
      setState('setup');
    }
  };

  const handleAnswer = (answer: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: answer
    }));
  };

  const handleNext = () => {
    if (quizData && currentQuestionIndex < quizData.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      calculateScore();
      setState('results');
    }
  };

  const calculateScore = () => {
    if (!quizData) return;
    let newScore = 0;
    quizData.questions.forEach((q, idx) => {
      if (userAnswers[idx] === q.correct_answer) {
        newScore++;
      }
    });
    setScore(newScore);
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return "text-emerald-600 bg-emerald-50 border-emerald-200";
    if (percentage >= 50) return "text-amber-600 bg-amber-50 border-amber-200";
    return "text-rose-600 bg-rose-50 border-rose-200";
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => state === 'setup' ? onBack() : setState('setup')}
          className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <BrainCircuit className="w-8 h-8 text-indigo-600" />
            Générateur Intelligent de Quiz
          </h1>
          <p className="text-slate-500 text-sm mt-1">Préparation IA aux devoirs, examens, BEPC et BAC</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {state === 'setup' && (
          <motion.div 
            key="setup"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid lg:grid-cols-3 gap-8"
          >
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <Target className="w-5 h-5 text-indigo-600" />
                  Paramètres de l'Évaluation
                </h3>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Niveau */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600 uppercase">Niveau d'étude</label>
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                      {LEVELS.map(l => (
                        <button
                          key={l.name}
                          onClick={() => {
                            setLevel(l.name);
                            setSchoolClass(l.classes[0]);
                          }}
                          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                            level === l.name 
                              ? 'bg-white text-indigo-600 shadow-sm' 
                              : 'text-slate-500 hover:text-slate-900'
                          }`}
                        >
                          {l.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Classe */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600 uppercase">Classe</label>
                    <select 
                      value={schoolClass}
                      onChange={(e) => setSchoolClass(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none font-medium"
                    >
                      {availableClasses.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  {/* Série (Uniquement Lycée) */}
                  {level === 'Lycée' && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-600 uppercase">Série</label>
                      <select 
                        value={series}
                        onChange={(e) => setSeries(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none font-medium"
                      >
                        {SERIES.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Mode */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600 uppercase">Mode de Préparation</label>
                    <select 
                      value={mode}
                      onChange={(e) => setMode(e.target.value as any)}
                      className="w-full bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none font-bold"
                    >
                      <option value="Normal">Entraînement Classique</option>
                      {schoolClass === '3e' && <option value="BEPC">Préparation BEPC Examen</option>}
                      {schoolClass === 'Terminale' && <option value="BAC">Préparation BAC Examen</option>}
                      <option value="Examen">Examen Blanc (Chronométré)</option>
                    </select>
                  </div>

                  {/* Matière */}
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-bold text-slate-600 uppercase">Matière</label>
                    <select 
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none font-medium"
                    >
                      {availableSubjects.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  {/* Chapitre (Optionnel) */}
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-bold text-slate-600 uppercase">Chapitre Spécifique (Optionnel)</label>
                    <input 
                      type="text" 
                      value={chapter}
                      onChange={(e) => setChapter(e.target.value)}
                      placeholder="Ex: Les équations différentielles, La seconde guerre mondiale..."
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none font-medium"
                    />
                  </div>

                  {/* Difficulté */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600 uppercase">Difficulté</label>
                    <div className="flex gap-2">
                      {['Facile', 'Moyen', 'Difficile'].map(d => (
                        <button
                          key={d}
                          onClick={() => setDifficulty(d)}
                          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all border ${
                            difficulty === d 
                              ? 'bg-slate-900 text-white border-slate-900' 
                              : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Nombre de questions */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600 uppercase">Nombre de questions</label>
                    <input 
                      type="range" 
                      min="5" 
                      max="30" 
                      step="5"
                      value={numQuestions}
                      onChange={(e) => setNumQuestions(Number(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                    <div className="text-right text-xs font-bold text-indigo-600">{numQuestions} Questions</div>
                  </div>
                </div>

                {error && (
                  <div className="mt-6 p-4 bg-rose-50 text-rose-700 text-sm rounded-xl font-medium border border-rose-100 flex items-start gap-2">
                    <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="mt-8 pt-6 border-t border-slate-100">
                  <button 
                    onClick={handleGenerate}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg py-4 rounded-xl transition-colors shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
                  >
                    <BrainCircuit className="w-5 h-5" />
                    Générer mon Quiz avec l'IA
                  </button>
                </div>
              </div>
            </div>

            {/* Sidebar info */}
            <div className="space-y-6">
              <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
                <div className="absolute -right-10 -top-10 w-32 h-32 bg-indigo-500/30 blur-3xl rounded-full pointer-events-none"></div>
                <h3 className="text-lg font-black flex items-center gap-2">
                  <Award className="w-5 h-5 text-indigo-400" />
                  Mode Préparation Examen
                </h3>
                <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                  Notre intelligence artificielle génère des séries de questions adaptées au programme du Burkina Faso pour reproduire les conditions du BEPC et du BAC.
                </p>
                <div className="mt-6 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-indigo-300">1</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold">Sélectionnez vos critères</h4>
                      <p className="text-xs text-slate-400">Classe, Série et Matière ciblées.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-emerald-300">2</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold">Génération IA</h4>
                      <p className="text-xs text-slate-400">Création instantanée sur mesure par chapitre ou mode BAC/BEPC.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-amber-300">3</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold">Correction et Explications</h4>
                      <p className="text-xs text-slate-400">Corrections détaillées pour une compréhension profonde de vos erreurs.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {state === 'loading' && (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <div className="relative mb-8">
              <div className="w-24 h-24 rounded-full border-4 border-slate-100 border-t-indigo-600 animate-spin"></div>
              <BrainCircuit className="w-10 h-10 text-indigo-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Génération IA en cours...</h2>
            <p className="text-slate-500">L'IA prépare des questions adaptées au programme {schoolClass} - {subject}</p>
          </motion.div>
        )}

        {state === 'playing' && quizData && (
          <motion.div 
            key="playing"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-6 md:p-10 border border-slate-200 shadow-xl max-w-3xl mx-auto relative overflow-hidden"
          >
            {/* Top progress bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-100">
              <div 
                className="h-full bg-indigo-600 transition-all duration-300 ease-out"
                style={{ width: `${((currentQuestionIndex) / quizData.questions.length) * 100}%` }}
              ></div>
            </div>

            <div className="flex justify-between items-center mb-8 pt-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Question {currentQuestionIndex + 1} / {quizData.questions.length}
              </span>
              <span className="text-xs font-bold bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full border border-indigo-100">
                {quizData.questions[currentQuestionIndex].difficulty}
              </span>
            </div>

            <h2 className="text-2xl font-black text-slate-900 mb-8 leading-snug">
              {quizData.questions[currentQuestionIndex].question}
            </h2>

            <div className="space-y-3 mb-10">
              {quizData.questions[currentQuestionIndex].options.map((opt, idx) => {
                const isSelected = userAnswers[currentQuestionIndex] === opt;
                return (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(opt)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between ${
                      isSelected 
                        ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900' 
                        : 'border-slate-100 hover:border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    <span className="font-medium text-[15px]">{opt}</span>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      isSelected ? 'border-indigo-600' : 'border-slate-200'
                    }`}>
                      {isSelected && <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full"></div>}
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleNext}
                disabled={!userAnswers[currentQuestionIndex]}
                className={`px-8 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${
                  userAnswers[currentQuestionIndex]
                    ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-md transform hover:-translate-y-0.5'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                {currentQuestionIndex === quizData.questions.length - 1 ? 'Terminer & Voir les résultats' : 'Valider & Suivant'}
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}

        {state === 'results' && quizData && (
          <motion.div 
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Score Banner */}
            <div className={`bg-white rounded-3xl p-8 border text-center shadow-sm relative overflow-hidden ${getScoreColor((score / quizData.questions.length) * 100)}`}>
              <h2 className="text-xl font-black mb-2 opacity-80 uppercase tracking-widest">Score Final</h2>
              <div className="text-7xl font-black mb-4">
                {score}<span className="text-4xl opacity-50">/{quizData.questions.length}</span>
              </div>
              <p className="font-bold opacity-80">
                {score / quizData.questions.length >= 0.8 ? "Excellent travail ! Vous maîtrisez bien ce chapitre." : 
                 score / quizData.questions.length >= 0.5 ? "Bien, mais vous pouvez encore vous améliorer." : 
                 "Ne vous découragez pas, revoyez les corrections pour progresser."}
              </p>
              
              {quizData.estimatedSuccessProbability && (
                <div className="mt-6 pt-6 border-t border-current/10 flex items-center justify-center gap-2">
                  <TrendingUp className="w-5 h-5 opacity-70" />
                  <span className="font-bold">Estimation IA de réussite globale : {quizData.estimatedSuccessProbability}%</span>
                </div>
              )}
            </div>

            {/* AI Recommendation */}
            {quizData.recommendation && (
              <div className="bg-indigo-50 border border-indigo-100 rounded-3xl p-6 flex gap-4">
                <BrainCircuit className="w-8 h-8 text-indigo-600 flex-shrink-0" />
                <div>
                  <h4 className="font-black text-indigo-900 mb-1">Recommandation Pédagogique IA</h4>
                  <p className="text-sm text-indigo-800 leading-relaxed">{quizData.recommendation}</p>
                </div>
              </div>
            )}

            {/* Corrections */}
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6">
              <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-indigo-600" />
                Correction Détaillée
              </h3>

              <div className="space-y-6">
                {quizData.questions.map((q, idx) => {
                  const userAnswer = userAnswers[idx];
                  const isCorrect = userAnswer === q.correct_answer;

                  return (
                    <div key={idx} className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
                      <div className="flex items-start gap-3 mb-4">
                        <div className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${isCorrect ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                          {isCorrect ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 leading-snug">{idx + 1}. {q.question}</p>
                        </div>
                      </div>

                      <div className="pl-9 space-y-3 text-[13px]">
                        {/* Selected Answer */}
                        <div className="flex gap-2 text-slate-700">
                          <span className="font-bold text-slate-400 w-24">Votre réponse:</span>
                          <span className={`${isCorrect ? 'text-emerald-700 font-bold' : 'text-rose-700 line-through'}`}>{userAnswer || "Aucune réponse"}</span>
                        </div>
                        
                        {/* Correct Answer (if wrong) */}
                        {!isCorrect && (
                          <div className="flex gap-2">
                            <span className="font-bold text-slate-400 w-24">Bonne réponse:</span>
                            <span className="text-emerald-700 font-bold">{q.correct_answer}</span>
                          </div>
                        )}

                        {/* Explanation */}
                        <div className="mt-4 pt-4 border-t border-slate-200 text-slate-600 bg-white p-4 rounded-xl shadow-sm border">
                          <div className="flex items-center gap-1.5 mb-2 text-indigo-600 font-bold text-[11px] uppercase tracking-wider">
                            <HelpCircle className="w-3.5 h-3.5" /> Explication IA
                          </div>
                          <p className="leading-relaxed">{q.explanation}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-8 text-center flex justify-center gap-4">
                <button 
                  onClick={() => setState('setup')}
                  className="px-6 py-3 border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Nouveau Quiz
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
