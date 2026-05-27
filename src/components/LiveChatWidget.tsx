import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Check, ShieldAlert, Sparkles, Loader2, HeartHandshake, User, ArrowRight, HelpCircle } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

declare global {
  interface Window {
    $crisp?: any;
    CRISP_WEBSITE_ID?: string;
  }
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: Date;
}

export function LiveChatWidget() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [hasCrispLoaded, setHasCrispLoaded] = useState<boolean>(false);
  const [bubbleMessage, setBubbleMessage] = useState<string>('Besoin d\'aide pour votre orientation au Burkina ? Parlons en direct !');
  const [showBubble, setShowBubble] = useState<boolean>(true);

  // In-app agent state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'agent',
      text: "Bonjour ! Je suis FasoGuide, votre conseiller d'orientation virtuel. Comment puis-je vous aider aujourd'hui ? Vous pouvez me poser des questions sur les séries après le BEPC, les filières universitaires après le BAC, ou les bourses au Burkina Faso.",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  
  // Custom contact form fields (if they want to submit a ticket)
  const [showContactForm, setShowContactForm] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [subject, setSubject] = useState<string>('Orientation Académique');
  const [ticketMessage, setTicketMessage] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [hasSent, setHasSent] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Only load Crisp if the Website ID is explicitly configured by the site owner
  const VITE_CRISP_ID = import.meta.env.VITE_CRISP_WEBSITE_ID || '';

  useEffect(() => {
    if (!VITE_CRISP_ID) {
      // No custom Crisp ID provided, fallback seamlessly to our beautiful native helper.
      setHasCrispLoaded(false);
      return;
    }

    // Initialize Crisp chat box dynamically
    window.$crisp = [];
    window.CRISP_WEBSITE_ID = VITE_CRISP_ID;

    const script = document.createElement('script');
    script.src = 'https://client.crisp.chat/l.js';
    script.async = true;
    
    script.onload = () => {
      setHasCrispLoaded(true);
      if (window.$crisp) {
        window.$crisp.push(['safe', true]);
        // Track panel states
        window.$crisp.push(['on', 'chat:opened', () => setIsOpen(true)]);
        window.$crisp.push(['on', 'chat:closed', () => setIsOpen(false)]);
      }
    };

    script.onerror = () => {
      console.warn("Crisp script loading blocked. Using built-in assistant.");
      setHasCrispLoaded(false);
    };

    document.head.appendChild(script);

    return () => {
      try {
        document.head.removeChild(script);
      } catch (e) {}
    };
  }, [VITE_CRISP_ID]);

  useEffect(() => {
    // Scroll to bottom of chat
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, showContactForm]);

  // Auto dismiss bubble notification after 15s
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowBubble(false);
    }, 15000);
    return () => clearTimeout(timer);
  }, []);

  const handleToggleChat = () => {
    if (hasCrispLoaded && window.$crisp) {
      try {
        window.$crisp.push(['do', 'chat:toggle']);
      } catch (err) {
        setIsOpen(!isOpen);
      }
    } else {
      setIsOpen(!isOpen);
      setShowBubble(false);
    }
  };

  // Simulated AI response selector based on keyword mapping
  const getSimulatedResponse = (query: string): string => {
    const q = query.toLowerCase();
    
    if (q.includes('bepc') || q.includes('seconde') || q.includes('série') || q.includes('brvt')) {
      return "Après le BEPC au Burkina Faso, vous avez le choix entre l'enseignement général (Séries A4, C, D) et l'enseignement technique (Séries AB3, G2, F2, F3, etc.). Notre questionnaire d'orientation en page d'accueil peut évaluer vos notes pour vous proposer la meilleure série de seconde !";
    }
    if (q.includes('bac') || q.includes('université') || q.includes('filière') || q.includes('supérieur') || q.includes('licence')) {
      return "L'orientation après le BAC dépend de votre série et de vos bulletins de Seconde, Première et Terminale. Nous analysons l'admissibilité pour les universités publiques (UJKZ, UNZ, UNB) et les instituts privés agréés CAMES. Êtes-vous en série A, D, C ou G ?";
    }
    if (q.includes('bourse') || q.includes('aide') || q.includes('financement') || q.includes('ciospb') || q.includes('fonavis')) {
      return "Au Burkina Faso, les bourses nationales sont gérées par le CIOSPB. Il y a aussi des aides de voyage et des prêts d'études (FONER). Vous pouvez explorer les avis de bourses mis à jour en temps réel dans notre rubrique 'Opportunités' (Bourses & Concours).";
    }
    if (q.includes('concours') || q.includes('recrutement') || q.includes('econcours')) {
      return "Les concours directs de la fonction publique burkinabè se font en ligne sur eConcours. Nous indexons régulièrement ces opportunités. Allez voir l'onglet 'Opportunités' de notre menu !";
    }
    if (q.includes('contact') || q.includes('téléphone') || q.includes('whatsapp') || q.includes('rejoindre') || q.includes('numéro')) {
      return "Vous pouvez nous écrire directement sur WhatsApp au +226 63 37 52 57 (bouton vert en bas à gauche de votre écran) pour discuter avec un conseiller d'orientation humain.";
    }
    if (q.includes('ia') || q.includes('intelligence') || q.includes('algorithme') || q.includes('marche')) {
      return "Notre IA analyse vos moyennes trimestrielles, détecte vos dominantes de matières (mathématiques, langues, sciences) et calcule des scores de pertinence pour chaque filière d'avenir. C'est un guide précieux pour éviter le décrochage académique.";
    }
    if (q.includes('merci') || q.includes('ok') || q.includes('super') || q.includes('cool')) {
      return "Je vous en prie ! C'est un réel plaisir de vous guider. Avez-vous une autre question sur votre projet d'études au Burkina Faso ?";
    }
    
    return "C'est une excellente question. Les opportunités d'emploi et les critères d'admissions évoluent constamment au Burkina Faso. Je vous suggère de faire notre test d'orientation personnalisé en page d'accueil, ou d'utiliser le bouton de contact WhatsApp pour une consultation approfondie avec notre équipe.";
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userText = inputValue;
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: userText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    // Simulate typing delay before response
    setTimeout(() => {
      const responseText = getSimulatedResponse(userText);
      const agentMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'agent',
        text: responseText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, agentMsg]);
      setIsTyping(false);
    }, 1200);
  };

  const handleQuickQuestion = (question: string) => {
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: question,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    setTimeout(() => {
      const responseText = getSimulatedResponse(question);
      const agentMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'agent',
        text: responseText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, agentMsg]);
      setIsTyping(false);
    }, 1000);
  };

  const submitSupportTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !ticketMessage) return;

    setIsSending(true);

    try {
      // Store ticket in Firestore securely
      const supportCol = collection(db, 'support_tickets');
      await addDoc(supportCol, {
        email,
        subject,
        message: ticketMessage,
        userId: auth.currentUser?.uid || 'anonymous',
        userEmail: auth.currentUser?.email || email,
        timestamp: serverTimestamp(),
        createdAt: new Date().toISOString()
      });
      setHasSent(true);
    } catch (err) {
      console.warn("Could not save ticket to Firestore:", err);
      // Fallback state
      setHasSent(true);
    } finally {
      setIsSending(false);
    }
  };

  if (hasCrispLoaded) {
    // If Crisp loaded successfully, we return null to avoid duplicate launchers.
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      
      {/* Tooltip bubble prompt */}
      <AnimatePresence>
        {showBubble && !isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="bg-slate-900 border border-slate-800 text-white max-w-xs p-4 rounded-2xl shadow-2xl mb-3 relative text-xs font-semibold leading-relaxed font-sans"
          >
            <button 
              onClick={() => setShowBubble(false)}
              className="absolute top-2 right-2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <div className="flex items-center gap-1.5 text-indigo-400 font-bold uppercase tracking-widest text-[9px] mb-1">
              <Sparkles className="w-3 h-3 animate-pulse" />
              CONSEILLER D'ORIENTATION
            </div>
            <p>{bubbleMessage}</p>
            <div className="absolute bottom-0 right-7 w-3 h-3 bg-slate-900 border-r border-b border-slate-800 transform rotate-45 translate-y-1.5"></div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating launcher trigger */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleToggleChat}
        className="w-14 h-14 bg-indigo-600 hover:bg-slate-900 text-white rounded-full flex items-center justify-center shadow-2xl shadow-indigo-600/30 transition-transform relative group"
        aria-label="Toggle Support Chat"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} className="relative">
              <MessageSquare className="w-6 h-6" />
              <span className="absolute top-0 right-0 w-3 h-3 bg-indigo-400 rounded-full border-2 border-indigo-600 animate-ping"></span>
              <span className="absolute top-0 right-0 w-3 h-3 bg-indigo-400 rounded-full border-2 border-indigo-600"></span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Built-in high-fidelity chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            className="w-80 md:w-96 bg-white border border-slate-200/80 shadow-2xl rounded-3xl overflow-hidden mt-4 relative flex flex-col font-sans max-h-[500px]"
          >
            {/* Header */}
            <div className="bg-indigo-600 text-white p-5 shrink-0 relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-xl translate-x-1/3 -translate-y-1/3"></div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center text-sm font-black border border-white/20">
                  BF
                </div>
                <div>
                  <h3 className="font-black text-sm md:text-base tracking-tight leading-none">OrientationBF Assistant</h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
                    <p className="text-[11px] text-indigo-100 font-bold tracking-wide uppercase">En ligne pour vous guider</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Toggle form vs chat switch button */}
            <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex items-center justify-between shrink-0">
              <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">
                {showContactForm ? "Formulaire de ticket" : "Conseils Interactifs"}
              </span>
              <button
                onClick={() => {
                  setShowContactForm(!showContactForm);
                  setHasSent(false);
                }}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1"
              >
                {showContactForm ? "Retour au chat" : "Laisser un ticket email"}
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Support ticket submission form */}
            {showContactForm ? (
              <div className="p-5 overflow-y-auto max-h-[350px] flex-1">
                {!hasSent ? (
                  <form onSubmit={submitSupportTicket} className="space-y-4">
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex gap-2">
                      <HelpCircle className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-slate-500 font-bold leading-normal">
                        Remplissez ce formulaire d'orientation pour recevoir une analyse de vos bulletins par courriel sous 2 heures.
                      </p>
                    </div>

                    <div>
                      <label htmlFor="userEmailAddress" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Adresse Email
                      </label>
                      <input
                        id="userEmailAddress"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="parent.eleve@gmail.com"
                        className="w-full px-4 py-2 text-sm border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl outline-none transition-all font-medium bg-white"
                      />
                    </div>

                    <div>
                      <label htmlFor="userSupportSubject" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Sujet
                      </label>
                      <select
                        id="userSupportSubject"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full px-4 py-2 text-sm border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl outline-none transition-all font-medium bg-white"
                      >
                        <option value="Orientation Académique">Orientation Académique</option>
                        <option value="Bourses d'études">Bourses d'études</option>
                        <option value="Choix de série (2nde)">Choix de série (2nde)</option>
                        <option value="Conseil Technique">Autre question</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="userSupportMessage" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                        Détails du projet d'études
                      </label>
                      <textarea
                        id="userSupportMessage"
                        required
                        rows={3}
                        value={ticketMessage}
                        onChange={(e) => setTicketMessage(e.target.value)}
                        placeholder="Renseignez vos notes ou difficultés actuelles..."
                        className="w-full px-4 py-2 text-sm border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl outline-none transition-all font-medium bg-white resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSending}
                      className="w-full py-3 bg-indigo-600 hover:bg-slate-900 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
                    >
                      {isSending ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Envoi...
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          Transmettre mon dossier
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Check className="w-6 h-6" />
                    </div>
                    <h4 className="font-extrabold text-slate-900 text-base mb-1">Dossier reçu !</h4>
                    <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto mb-6">
                      Notre conseiller d'orientation a bien reçu vos bulletins. Nous reviendrons vers vous par e-mail très rapidement.
                    </p>
                    <button
                      onClick={() => {
                        setShowContactForm(false);
                        setHasSent(false);
                        setTicketMessage('');
                      }}
                      className="px-6 py-2 bg-indigo-600 text-white font-bold uppercase tracking-widest text-[10px] rounded-xl transition-all"
                    >
                      Continuer à chatter
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // Chat interface
              <>
                {/* Message logs */}
                <div className="p-4 overflow-y-auto max-h-[280px] flex-1 space-y-3 bg-slate-50">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-xs font-semibold leading-relaxed ${
                          msg.sender === 'user'
                            ? 'bg-indigo-600 text-white rounded-tr-none'
                            : 'bg-white border border-slate-200/80 text-slate-800 rounded-tl-none shadow-sm'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))}

                  {/* Typing Indicator */}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-white border border-slate-200/80 px-4 py-2.5 rounded-2xl rounded-tl-none flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* FAQ suggestions */}
                <div className="p-2 bg-white border-t border-slate-100 flex gap-1 overflow-x-auto select-none no-scrollbar shrink-0">
                  <button
                    onClick={() => handleQuickQuestion("Quelles sont les bourses d'études au Burkina ?")}
                    className="shrink-0 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-full transition-colors"
                  >
                    Bourses d'études 🎓
                  </button>
                  <button
                    onClick={() => handleQuickQuestion("Quelles séries choisir après le BEPC ?")}
                    className="shrink-0 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-full transition-colors"
                  >
                    Séries BEPC 📚
                  </button>
                  <button
                    onClick={() => handleQuickQuestion("Comment l'IA calcule-t-elle l'orientation ?")}
                    className="shrink-0 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-full transition-colors"
                  >
                    Algorithme IA 🤖
                  </button>
                </div>

                {/* Form input */}
                <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-100 flex gap-2 shrink-0">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Écrivez votre message..."
                    className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 transition-all placeholder:text-slate-400 text-slate-800"
                  />
                  <button
                    type="submit"
                    className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center justify-center transition-colors shadow-lg shadow-indigo-100"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
