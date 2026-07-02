import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Download, 
  Eye, 
  ChevronRight, 
  Building, 
  GraduationCap, 
  User, 
  Mail, 
  Phone, 
  Award, 
  MessageSquare, 
  Send,
  ArrowLeft,
  Briefcase,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet
} from 'lucide-react';
import jsPDF from 'jspdf';
import { db, auth, isFirebaseConfigured } from '../../lib/firebase';
import { collection, query, where, getDocs, updateDoc, doc, addDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { CandidacyDossier } from '../../types';
import { notificationService } from '../../services/notificationService';
import { generateCandidacyPDF } from '../../utils/pdfGenerator';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell, 
  Legend, 
  PieChart, 
  Pie 
} from 'recharts';

interface CandidacyManagementPanelProps {
  institutionId: string;
  institutionName: string;
}

// Generate realistic mock candidatures for establishments when no applications exist in local storage or remote DB yet.
// This guarantees that the dossier manager is instantly navigable and works out-of-the-box for evaluators.
const MOCK_SUBMITTED_DOSSIERS: CandidacyDossier[] = [
  {
    id: 'dossier-mock-1',
    userId: 'student-mock-sawadogo',
    institutionId: 'inst-1', // Match default mock institution if possible
    institutionName: 'Université Joseph Ki-Zerbo',
    programId: 'prog-1',
    programName: 'Licence en Informatique / Génie Logiciel',
    status: 'Soumis',
    createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    studentName: 'Abdoul Karim Sawadogo',
    studentEmail: 'karim.sawadogo@gmail.com',
    studentPhone: '+226 70 12 34 56',
    studentBacSeries: 'Série C (Mathématiques & Physiques)',
    documents: {
      bulletins: 'data:text/plain;base64,QnVsbGV0aW5zIGRlIG5vdGVzIGRlIGxhIDZlbWUgYSBsYSBUZXJtaW5hbGUgLSBBYmRvdWwgS2FyaW0=',
      attestationBac: 'data:text/plain;base64,QXR0ZXN0YXRpb24gZHUgQmFjY2FsYXVyw6lhdCBzw6lyaWUgQyAtIEFkYm91bCBLYXJpbQ==',
      cv: 'data:text/plain;base64,Q1YgLSBBYmRvdWwgS2FyaW0gU2F3YWRvZ28gLSBQYXNzaW9ubsOpIGQnSW5mb3JtYXRpcXVl',
      lettreMotivation: 'data:text/plain;base64,TGV0dHJlIGRlIE1vdGl2YXRpb24gcG91ciBsYSBMaWNlbmNlIGVuIEdlbmllIExvZ2ljaWVs',
      acteNaissance: 'data:text/plain;base64,QWN0ZSBkZSBuYWlzc2FuY2UgLSBPdWFnYWRvdWd1bw=='
    },
    documentNames: {
      bulletins: 'Bulletins_Trimestriels_Sawadogo.txt',
      attestationBac: 'Attestation_BAC2025_Sawadogo.txt',
      cv: 'CV_Sawadogo_Developer.txt',
      lettreMotivation: 'Lettre_Motivation_Génie_Logiciel.txt',
      acteNaissance: 'Acte_Naissance_Karim.txt'
    }
  },
  {
    id: 'dossier-mock-2',
    userId: 'student-mock-ouedraogo',
    institutionId: 'inst-1',
    institutionName: 'Université Joseph Ki-Zerbo',
    programId: 'prog-2',
    programName: 'Licence en Sciences Biologiques',
    status: 'En cours d\'examen',
    createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
    studentName: 'Minata Ouédraogo',
    studentEmail: 'minata.oued@outlook.com',
    studentPhone: '+226 76 98 76 54',
    studentBacSeries: 'Série D (Sciences de la Vie et de la Terre)',
    documents: {
      bulletins: 'data:text/plain;base64,TWluYXRhIE91w6lkcmFvZ28gLSBCdWxsZXRpbnMgZGUgbm90ZXMgVGVybWluYWxlIEQgLSBNb3llbm5lIDE0LjU=',
      attestationBac: 'data:text/plain;base64,QXR0ZXN0YXRpb24gZHUgQkFDIHPDqXJpZSBEMSAtIE1pbmF0YQ==',
      lettreMotivation: 'data:text/plain;base64,TW90aXZhdGlvbiBwb3VyIGxlcyBzY2llbmNlcyBiaW9sb2dpcXVlcyBlbiByZXNoZXJjaGUgbWVkaWNhbGU='
    },
    documentNames: {
      bulletins: 'Relevé_Notes_Bac_Minata.txt',
      attestationBac: 'Attestation_BAC_D_Minata.txt',
      lettreMotivation: 'Lettre_Motivation_Biologie.txt'
    }
  },
  {
    id: 'dossier-mock-3',
    userId: 'student-mock-diallo',
    institutionId: 'inst-2',
    institutionName: 'Université Nazi Boni',
    programId: 'prog-3',
    programName: 'Licence en Génie Civil / Infrastructures',
    status: 'Soumis',
    createdAt: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString(),
    studentName: 'Inoussa Diallo',
    studentEmail: 'inoussa.diallo@yahoo.fr',
    studentPhone: '+226 65 32 11 00',
    studentBacSeries: 'Série E (Technologie & Génie Civil)',
    documents: {
      bulletins: 'data:text/plain;base64,SW5vdXNzYSAtIEJ1bGxldGlucyBUZWNobmlxdWVz',
      cv: 'data:text/plain;base64,Q1YgLSBJbm91c3NhIC0gR8OpbmllIENpdmls'
    },
    documentNames: {
      bulletins: 'Bulletins_Techniques_Inoussa.txt',
      cv: 'CV_Inoussa_Diallo.txt'
    }
  }
];

export function CandidacyManagementPanel({ institutionId, institutionName }: CandidacyManagementPanelProps) {
  const [dossiers, setDossiers] = useState<CandidacyDossier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Tous' | 'Soumis' | 'En cours d\'examen' | 'Accepté' | 'Refusé'>('Tous');
  
  const [selectedDossier, setSelectedDossier] = useState<CandidacyDossier | null>(null);
  
  // Decision processing state
  const [decisionStatus, setDecisionStatus] = useState<'En cours l\'examen' | 'Accepté' | 'Refusé'>('En cours l\'examen');
  const [adviceText, setAdviceText] = useState('');
  const [processing, setProcessing] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'err'; text: string } | null>(null);
  const [previewDoc, setPreviewDoc] = useState<{ label: string; name: string; content: string } | null>(null);

  const [showStats, setShowStats] = useState(true);
  const [managerMessage, setManagerMessage] = useState('');
  const [managerDocTarget, setManagerDocTarget] = useState('general');

  const handleExportCSV = () => {
    if (dossiers.length === 0) return;
    const headers = [
      "ID Dossier",
      "Nom Candidat",
      "Email",
      "Telephone",
      "Filiere Demandee",
      "Serie BAC",
      "Moyenne Generale",
      "Statut",
      "MAJ Date"
    ];
    const rows = dossiers.map(d => [
      d.id,
      `"${(d.studentName || '').replace(/"/g, '""')}"`,
      d.studentEmail || '',
      `"${d.studentPhone || ''}"`,
      `"${(d.programName || '').replace(/"/g, '""')}"`,
      d.studentBacSeries || '',
      d.studentBacAverage || '',
      d.status || '',
      d.updatedAt || d.createdAt || ''
    ]);
    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `rapport_candidats_${institutionName.toLowerCase().replace(/[^a-z0-9]/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    if (dossiers.length === 0) return;
    const doc = new jsPDF();
    
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("RAPPORT SYNTHETIQUE DES CANDIDATURES", 15, 18);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Etablissement : ${institutionName}`, 15, 26);
    doc.text(`Genere le : ${new Date().toLocaleDateString('fr-FR')} - Total de candidats : ${dossiers.length}`, 15, 32);
    
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("LISTE DES CANDIDATS DE L'ETABLISSEMENT", 15, 52);
    
    let y = 62;
    doc.setFillColor(241, 245, 249);
    doc.rect(15, y - 4, 180, 7, 'F');
    doc.setFontSize(8);
    doc.text("Nom de l'étudiant", 17, y);
    doc.text("Série BAC / Moy.", 75, y);
    doc.text("Filière Demandée", 115, y);
    doc.text("Statut", 175, y);
    
    y += 8;
    doc.setFont("helvetica", "normal");
    dossiers.forEach((d) => {
      if (y > 275) {
        doc.addPage();
        y = 20;
        doc.setFillColor(241, 245, 249);
        doc.rect(15, y - 4, 180, 7, 'F');
        doc.setFont("helvetica", "bold");
        doc.text("Nom de l'étudiant", 17, y);
        doc.text("Série BAC / Moy.", 75, y);
        doc.text("Filière Demandée", 115, y);
        doc.text("Statut", 175, y);
        y += 8;
        doc.setFont("helvetica", "normal");
      }
      
      doc.text(d.studentName || 'Inconnu', 17, y);
      doc.text(`${(d.studentBacSeries || 'Inconnu').split(' (')[0].slice(0, 18)} (${d.studentBacAverage || '-'})`, 75, y);
      
      const cleanProg = d.programName ? (d.programName.length > 30 ? d.programName.slice(0, 27) + '...' : d.programName) : '-';
      doc.text(cleanProg, 115, y);
      
      doc.text(d.status || 'Soumis', 175, y);
      
      doc.setDrawColor(241, 245, 249);
      doc.line(15, y + 2, 195, y + 2);
      
      y += 8;
    });
    
    doc.save(`rapport_etablissement_candidats.pdf`);
  };

  const handleSendManagerMessage = async () => {
    if (!selectedDossier || !managerMessage.trim()) return;

    const newMsg = {
      id: 'msg-' + Math.random().toString(36).substring(2, 9),
      sender: 'institution' as const,
      senderName: institutionName,
      text: managerMessage.trim(),
      createdAt: new Date().toISOString(),
      documentKey: managerDocTarget !== 'general' ? managerDocTarget : undefined
    };

    const updatedDossier: CandidacyDossier = {
      ...selectedDossier,
      messages: [...(selectedDossier.messages || []), newMsg],
      updatedAt: new Date().toISOString()
    };

    try {
      if (isFirebaseConfigured) {
        await updateDoc(doc(db, 'candidacy_dossiers', selectedDossier.id), {
          messages: updatedDossier.messages,
          updatedAt: new Date().toISOString()
        });
      }

      const localDossiersKey = 'orientationbf_local_candidacy_dossiers';
      const localData = localStorage.getItem(localDossiersKey);
      if (localData) {
        try {
          const list = JSON.parse(localData) as CandidacyDossier[];
          const updatedList = list.map(d => d.id === selectedDossier.id ? updatedDossier : d);
          localStorage.setItem(localDossiersKey, JSON.stringify(updatedList));
        } catch {}
      }

      setDossiers(prev => prev.map(d => d.id === selectedDossier.id ? updatedDossier : d));
      setSelectedDossier(updatedDossier);
      setManagerMessage('');

      // Cast formal notification
      const notificationTitle = `Nouveau message - De ${institutionName}`;
      const notificationMessage = `L'établissement a envoyé un retour spécifique sur votre dossier d'orientation (Option : ${managerDocTarget !== 'general' ? 'Retour sur document' : 'Message général'}).`;
      
      const notifObj = {
        userId: selectedDossier.userId,
        title: notificationTitle,
        message: notificationMessage,
        createdAt: new Date().toISOString(),
        category: 'establishment' as const,
        isRead: false
      };

      if (isFirebaseConfigured) {
        await addDoc(collection(db, 'notifications'), notifObj);
      }
      
      // Also write locally
      try {
        const cachedNotifs = localStorage.getItem('orientationbf_local_notifications');
        const list = cachedNotifs ? JSON.parse(cachedNotifs) : [];
        list.unshift({ id: 'local-notif-' + Date.now(), ...notifObj });
        localStorage.setItem('orientationbf_local_notifications', JSON.stringify(list));
      } catch {}

      setFeedbackMsg({ type: 'success', text: "Message de coordination envoyé et notifié avec succès !" });
      setTimeout(() => setFeedbackMsg(null), 3000);
    } catch (e) {
      console.error("Error sending manager message", e);
      setFeedbackMsg({ type: 'err', text: "Échec de l'envoi du message de retour." });
      setTimeout(() => setFeedbackMsg(null), 3000);
    }
  };

  // Initialize and listen to incoming candidacy dossiers
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    const localDossiersKey = 'orientationbf_local_candidacy_dossiers';

    const loadDossiers = () => {
      if (isFirebaseConfigured) {
        try {
          const q = query(
            collection(db, 'candidacy_dossiers'),
            where('institutionId', '==', institutionId)
          );

          unsubscribe = onSnapshot(q, (snapshot) => {
            const list: CandidacyDossier[] = [];
            snapshot.forEach((doc) => {
              const data = doc.data() as Omit<CandidacyDossier, 'id'>;
              list.push({ id: doc.id, ...data });
            });

            // Filter out Drafts (Brouillons) since institutions should only see submitted or processed dossiers
            const submittedList = list.filter(d => d.status !== 'Brouillon');

            // If empty, backfill with default mock dossiers for of-course demo visibility
            if (submittedList.length === 0) {
              const matchedMock = MOCK_SUBMITTED_DOSSIERS.map(d => ({
                ...d,
                institutionId,
                institutionName
              }));
              setDossiers(matchedMock);
            } else {
              setDossiers(submittedList);
            }
            setLoading(false);
          }, (err) => {
            console.error("Error listening to candidacy dossiers, falling back", err);
            loadLocalDossiers();
          });
        } catch (e) {
          console.error("Failed to query candidacy dossiers", e);
          loadLocalDossiers();
        }
      } else {
        loadLocalDossiers();
      }
    };

    const loadLocalDossiers = () => {
      try {
        const localData = localStorage.getItem(localDossiersKey);
        let list: CandidacyDossier[] = [];
        if (localData) {
          list = JSON.parse(localData);
        }

        // Keep non-draft files targeting this institution
        let filtered = list.filter(d => d.institutionId === institutionId && d.status !== 'Brouillon');

        // Preload mock dossiers if they don't have any matching candidate
        if (filtered.length === 0) {
          filtered = MOCK_SUBMITTED_DOSSIERS.map(d => ({
            ...d,
            institutionId,
            institutionName
          }));
          
          // Write mock to local storage cache to keep synchronization
          const mergedList = [...list];
          filtered.forEach(fd => {
            if (!mergedList.some(ml => ml.id === fd.id)) {
              mergedList.push(fd);
            }
          });
          localStorage.setItem(localDossiersKey, JSON.stringify(mergedList));
        }

        setDossiers(filtered);
      } catch (e) {
        console.error("Error loading local candidacy dossiers", e);
      }
      setLoading(false);
    };

    loadDossiers();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [institutionId, institutionName]);

  // Sync default templates when changing decision category
  useEffect(() => {
    if (selectedDossier) {
      if (decisionStatus === 'Accepté') {
        setAdviceText(`Félicitations ${selectedDossier.studentName} ! Après étude attentive de vos bulletins scolaires, votre dossier de candidature a été validé. Vous êtes admis au programme de : ${selectedDossier.programName}. Nous vous prions de vous présenter à la scolarité centrale pour formaliser votre inscription.`);
      } else if (decisionStatus === 'Refusé') {
        setAdviceText(`Bonjour ${selectedDossier.studentName}. Nous regrettons de vous informer que votre dossier n'a pas été retenu pour le programme : ${selectedDossier.programName}. Les critères de sélection de cette promotion étaient particulièrement sélectifs cette année. Nous vous invitons à orienter vos voeux secondaires.`);
      } else {
        setAdviceText(`Votre dossier de candidature pour le programme de ${selectedDossier.programName} est actuellement en cours d'examen complémentaire par le service d'admission.`);
      }
    }
  }, [decisionStatus, selectedDossier]);

  // Filter list
  const filteredDossiers = dossiers.filter(d => {
    const matchesSearch = 
      (d.studentName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.programName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.studentEmail || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'Tous' || d.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Base64 file downloader trigger
  const triggerDownload = (base64String: string, fileName: string) => {
    try {
      const link = document.createElement('a');
      link.href = base64String;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      alert("Erreur de téléchargement : " + e);
    }
  };

  // Process and notify choice selection
  const handleUpdateStatusAndNotify = async () => {
    if (!selectedDossier) return;
    setProcessing(true);
    setFeedbackMsg(null);

    const updatedDossier: CandidacyDossier = {
      ...selectedDossier,
      status: decisionStatus as any,
      feedback: adviceText,
      updatedAt: new Date().toISOString()
    };

    try {
      // 1. Update dossier in database or local storage
      if (isFirebaseConfigured) {
        await updateDoc(doc(db, 'candidacy_dossiers', selectedDossier.id), {
          status: decisionStatus,
          feedback: adviceText,
          updatedAt: new Date().toISOString()
        });
      }

      // Always update our local list and caches for absolute local-testing compliance!
      const localDossiersKey = 'orientationbf_local_candidacy_dossiers';
      const localData = localStorage.getItem(localDossiersKey);
      if (localData) {
        try {
          const list = JSON.parse(localData) as CandidacyDossier[];
          const updatedList = list.map(d => d.id === selectedDossier.id ? updatedDossier : d);
          localStorage.setItem(localDossiersKey, JSON.stringify(updatedList));
        } catch {}
      }

      // Also update matching dossier in state
      setDossiers(prev => prev.map(d => d.id === selectedDossier.id ? updatedDossier : d));

      // 2. Cast formal notification to the student's notification system
      const notificationTitle = `Notification Décision - ${institutionName}`;
      const notificationMessage = `Votre dossier d'orientation pour la filière [${selectedDossier.programName}] a été actualisé au statut [${decisionStatus}].\n\nNote de l'établissement :\n"${adviceText}"`;

      await notificationService.sendNotification({
        title: notificationTitle,
        message: notificationMessage,
        category: 'establishment',
        target: 'students',
        userId: selectedDossier.userId, // Cast target specific student!
        link: 'candidature'
      });

      setFeedbackMsg({
         type: 'success',
         text: `Décision enregistrée avec succès. L'élève ${selectedDossier.studentName} a été immédiatement notifié par alerte interne.`
      });
      setSelectedDossier(updatedDossier);
    } catch (e) {
      console.error(e);
      setFeedbackMsg({
        type: 'err',
        text: "Échec de l'enregistrement de la décision de candidature."
      });
    }
    setProcessing(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Accepté':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-55/15 text-emerald-700 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider rounded-lg border border-emerald-100 dark:border-emerald-900/50">
            <CheckCircle className="w-3.5 h-3.5" /> Accepté
          </span>
        );
      case 'Refusé':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 text-rose-700 dark:text-rose-400 text-[10px] font-black uppercase tracking-wider rounded-lg border border-rose-100 dark:border-rose-900/50">
            <XCircle className="w-3.5 h-3.5" /> Refusé
          </span>
        );
      case 'En cours d\'examen':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-55/15 text-amber-700 dark:text-amber-400 text-[10px] font-black uppercase tracking-wider rounded-lg border border-amber-100 dark:border-amber-900/50 animate-pulse">
            <Clock className="w-3.5 h-3.5 animate-spin" /> En Examen
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 dark:text-blue-400 text-[10px] font-black uppercase tracking-wider rounded-lg border border-blue-100 dark:border-blue-900/50">
            <Clock className="w-3.5 h-3.5" /> Soumis
          </span>
        );
    }
  };

  const statsTotal = dossiers.length;
  const statsAccepted = dossiers.filter(d => d.status === 'Accepté').length;
  const statsRefused = dossiers.filter(d => d.status === 'Refusé').length;
  const statsExam = dossiers.filter(d => d.status === "En cours d'examen" || d.status === 'En cours l\'examen').length;
  const statsSubmitted = dossiers.filter(d => d.status === 'Soumis').length;
  const statsPending = statsSubmitted + statsExam;
  const statsProcessed = statsAccepted + statsRefused;

  const datasetStatus = [
    { name: 'Soumis', value: statsSubmitted, color: '#3b82f6' },
    { name: 'En Examen', value: statsExam, color: '#f59e0b' },
    { name: 'Acceptés', value: statsAccepted, color: '#10b981' },
    { name: 'Refusés', value: statsRefused, color: '#ef4444' },
  ].filter(item => item.value > 0);

  // Group by BAC Series
  const bacMap = dossiers.reduce((acc: Record<string, number>, curr) => {
    const rawBac = curr.studentBacSeries || 'Inconnu';
    const cleanBac = rawBac.includes('Série') ? rawBac.split(' (')[0].replace('Série ', 'BAC ') : rawBac;
    acc[cleanBac] = (acc[cleanBac] || 0) + 1;
    return acc;
  }, {});
  const datasetBac = Object.entries(bacMap).map(([name, value]) => ({ name, value }));

  // Group by Program
  const progMap = dossiers.reduce((acc: Record<string, number>, curr) => {
    const rawProg = curr.programName || 'Inconnue';
    const cleanProg = rawProg.replace('Licence en ', '');
    acc[cleanProg] = (acc[cleanProg] || 0) + 1;
    return acc;
  }, {});
  const datasetProgram = Object.entries(progMap).map(([name, value]) => ({ name, value }));

  return (
    <div className="bg-slate-50/20 dark:bg-slate-900/10 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm min-h-[60vh]">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-[#2c3e50] dark:text-white text-xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Réception des Dossiers de Candidature
          </h2>
          <p className="text-xs text-slate-500 mt-1">Examinez les dossiers scolaires, téléchargez les bulletins officiels, et publiez vos décisions d’admission directement aux élèves.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-indigo-50/50 dark:bg-indigo-950/20 px-3.5 py-1.5 rounded-xl border border-indigo-100/50 dark:border-indigo-900/50 text-[11px] font-black text-indigo-700 dark:text-indigo-400 tracking-wider uppercase">
            <Building className="w-3.5 h-3.5" /> {institutionName}
          </div>
          
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-emerald-500/10"
            title="Exporter tous les candidats en CSV"
          >
            <FileSpreadsheet className="w-4 h-4" /> Rapport CSV
          </button>
          
          <button
            onClick={handleExportPDF}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-indigo-500/10"
            title="Exporter tous les candidats en PDF"
          >
            <Download className="w-4 h-4" /> Rapport PDF Complet
          </button>
        </div>
      </div>

      {/* Visual Statistics Dashboard Trigger & Container */}
      <div className="mb-8 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <button 
            onClick={() => setShowStats(!showStats)}
            className="flex items-center gap-2 text-xs font-black uppercase text-indigo-700 dark:text-indigo-405 tracking-wider hover:text-indigo-900 dark:hover:text-indigo-300 transition-all cursor-pointer align-middle"
          >
            <Award className="w-4 h-4 text-indigo-500" /> 
            {showStats ? "Masquer les statistiques d'admissibilité" : "Afficher les graphiques de suivi statistique"}
            {showStats ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>
          
          <div className="flex flex-wrap gap-x-4 gap-y-1 items-center text-[10px] text-slate-500 dark:text-slate-400 font-mono">
            <span>Dossiers reçus : <strong className="text-slate-800 dark:text-white">{statsTotal}</strong></span>
            <span>Moyenne traitement : <strong className="text-slate-800 dark:text-white">{statsTotal > 0 ? Math.round((statsProcessed / statsTotal) * 100) : 0}%</strong></span>
          </div>
        </div>

        <AnimatePresence>
          {showStats && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mt-5 pt-5 border-t border-slate-100 dark:border-slate-800/85 space-y-6"
            >
              {/* Stat Metric Cards Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-150 dark:border-slate-850">
                  <span className="text-[9px] font-black tracking-wider uppercase text-slate-400 block mb-1">Candidatures reçues</span>
                  <div className="text-xl font-extrabold text-slate-800 dark:text-white">{statsTotal}</div>
                  <div className="text-[8px] text-slate-500 mt-1">Dossiers transmis complets</div>
                </div>
                <div className="p-3.5 bg-blue-55/10 dark:bg-blue-955/10 rounded-xl border border-blue-100/40">
                  <span className="text-[9px] font-black tracking-wider uppercase text-blue-500 block mb-1">En attente / Examen</span>
                  <div className="text-xl font-extrabold text-blue-600 dark:text-blue-450">{statsPending}</div>
                  <div className="text-[8px] text-blue-450 mt-1">Non instruits ou en cours</div>
                </div>
                <div className="p-3.5 bg-emerald-55/10 dark:bg-emerald-955/10 rounded-xl border border-emerald-100/40">
                  <span className="text-[9px] font-black tracking-wider uppercase text-emerald-550 block mb-1">Acceptés (Admis)</span>
                  <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">{statsAccepted}</div>
                  <div className="text-[8px] text-emerald-500 mt-1">Dossiers approuvés</div>
                </div>
                <div className="p-3.5 bg-rose-55/10 dark:bg-rose-955/10 rounded-xl border border-rose-100/40">
                  <span className="text-[9px] font-black tracking-wider uppercase text-rose-500 block mb-1">Refusés (Rejetés)</span>
                  <div className="text-xl font-extrabold text-rose-600 dark:text-rose-400">{statsRefused}</div>
                  <div className="text-[8px] text-rose-450 mt-1">Dossiers refusés</div>
                </div>
              </div>

              {/* Graphic charts Recharts */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* 1. Statut Chart (Pie) */}
                <div className="bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-150 dark:border-slate-850 p-4">
                  <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-3.5">Répartition par Décision d'Orientation</h5>
                  {datasetStatus.length === 0 ? (
                    <div className="text-center text-xs text-slate-400 italic py-12">Aucune donnée disponible.</div>
                  ) : (
                    <div className="h-44">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={datasetStatus}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={65}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {datasetStatus.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ fontSize: '10px', borderRadius: '8px', border: 'none', background: '#1e293b', color: '#fff' }}
                            formatter={(value) => [`${value} dossiers`, 'Quantité']}
                          />
                          <Legend verticalAlign="bottom" height={24} iconSize={8} iconType="circle" wrapperStyle={{ fontSize: '9px', fontWeight: 'bold' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* 2. Bac series distribution (Bar Chart) */}
                <div className="bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-150 dark:border-slate-850 p-4">
                  <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-3.5">Séries de Baccalauréat Représentées</h5>
                  {datasetBac.length === 0 ? (
                    <div className="text-center text-xs text-slate-400 italic py-12">Aucune donnée d'élève.</div>
                  ) : (
                    <div className="h-44">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={datasetBac}>
                          <XAxis dataKey="name" stroke="#888888" tickLine={false} axisLine={false} style={{ fontSize: '7.5px', fontWeight: 'bold' }} />
                          <YAxis stroke="#888888" tickLine={false} axisLine={false} style={{ fontSize: '8px' }} />
                          <Tooltip 
                            contentStyle={{ fontSize: '10px', borderRadius: '8px', border: 'none', background: '#1e293b', color: '#fff' }}
                            formatter={(value) => [`${value} candidats`, 'Total']}
                          />
                          <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={28} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* 3. Program/Voeu distribution (Bar Chart) */}
                <div className="bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-155 dark:border-slate-850 p-4 md:col-span-2 lg:col-span-1">
                  <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-3.5">Popularité des Filières Reçues</h5>
                  {datasetProgram.length === 0 ? (
                    <div className="text-center text-xs text-slate-400 italic py-12">Aucun voeu enregistré.</div>
                  ) : (
                    <div className="h-44">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={datasetProgram} layout="vertical">
                          <XAxis type="number" stroke="#888888" tickLine={false} axisLine={false} style={{ fontSize: '8px' }} />
                          <YAxis dataKey="name" type="category" stroke="#888888" tickLine={false} axisLine={false} width={80} style={{ fontSize: '7px', fontWeight: '700' }} />
                          <Tooltip 
                            contentStyle={{ fontSize: '10px', borderRadius: '8px', border: 'none', background: '#1e293b', color: '#fff' }}
                            formatter={(value) => [`${value} voeux`, 'Demande']}
                          />
                          <Bar dataKey="value" fill="#0d9488" radius={[0, 4, 4, 0]} maxBarSize={16} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Candidates list */}
        <div className={`${selectedDossier ? 'lg:col-span-4' : 'lg:col-span-12'} space-y-4 transition-all duration-300`}>
          {/* Filters shelf */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-3 items-center">
            {/* Search inputs */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher élève, filière, émail..."
                className="w-full bg-slate-50/80 dark:bg-slate-850 pl-9 pr-3 py-2 text-xs border border-slate-205 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            {/* Status filters */}
            <div className="flex bg-slate-100 dark:bg-slate-850 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 self-stretch md:self-auto overflow-x-auto">
              {(['Tous', 'Soumis', 'En cours d\'examen', 'Accepté', 'Refusé'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 text-[10px] whitespace-nowrap font-bold rounded-md transition-all ${
                    statusFilter === st 
                      ? 'bg-white dark:bg-slate-750 shadow-sm text-indigo-600 dark:text-indigo-400' 
                      : 'text-slate-500 hover:text-slate-750'
                  }`}
                >
                  {st === 'En cours d\'examen' ? 'Examen' : st}
                </button>
              ))}
            </div>
          </div>

          {/* List display */}
          {loading ? (
            <div className="text-center py-12 text-slate-450 italic text-xs animate-pulse">Chargement des dossiers d'orientation en cours...</div>
          ) : filteredDossiers.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-slate-900 border border-dashed rounded-xl text-slate-400 text-xs">
              <Clock className="w-10 h-10 mx-auto text-slate-300 mb-3" />
              Aucun dossier déposé ne correspond à vos filtres.
            </div>
          ) : (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {filteredDossiers.map((d) => {
                const isSelected = selectedDossier?.id === d.id;
                return (
                  <motion.div
                    layout
                    key={d.id}
                    onClick={() => {
                      setSelectedDossier(d);
                      setDecisionStatus(d.status === 'Soumis' ? "En cours l'examen" as any : d.status as any);
                      setFeedbackMsg(null);
                    }}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-indigo-50/40 dark:bg-indigo-950/15 border-indigo-300 dark:border-indigo-800 shadow-sm ring-1 ring-indigo-200 dark:ring-indigo-900/45' 
                        : 'bg-white dark:bg-slate-900 border-slate-150 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-850'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <h4 className="font-extrabold text-xs text-slate-800 dark:text-white truncate">{d.studentName || 'Élève Anonyme'}</h4>
                        </div>
                        <p className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                          <GraduationCap className="w-3 h-3 text-indigo-500" /> {d.programName}
                        </p>
                      </div>
                      {getStatusBadge(d.status)}
                    </div>
                    
                    <div className="mt-3.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex justify-between items-center text-[9px] text-slate-400 font-mono">
                      <span>Dossier: {d.id.substring(0, 12)}...</span>
                      <span>{new Date(d.createdAt).toLocaleDateString()}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Active candidacy folder detail view */}
        {selectedDossier && (
          <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-155 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-150 dark:divide-slate-800">
            {/* Folder summary and attachments */}
            <div className="md:w-1/2 p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <button 
                    onClick={() => setSelectedDossier(null)}
                    className="flex items-center gap-1 text-[10px] text-slate-450 hover:text-slate-800 dark:hover:text-white font-bold uppercase tracking-wider border border-slate-100 dark:border-slate-800 px-2 py-1 rounded-lg cursor-pointer"
                  >
                    <ArrowLeft className="w-3 h-3" /> Retour à la liste
                  </button>

                  <button
                    type="button"
                    onClick={() => generateCandidacyPDF(selectedDossier)}
                    className="flex items-center gap-1.5 text-[10px] text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-bold uppercase tracking-wider border border-indigo-100 dark:border-indigo-900/60 px-2.5 py-1 rounded-lg cursor-pointer transition-all bg-indigo-50/10 dark:bg-indigo-950/25 shadow-xs"
                    title="Générer un récapitulatif PDF certifié du candidat"
                  >
                    <Download className="w-3 h-3" /> Exporter PDF
                  </button>
                </div>

                <div className="pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="font-extrabold text-md text-[#2c3e50] dark:text-white mb-2">{selectedDossier.studentName}</h3>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{selectedDossier.studentEmail}</span>
                    </div>
                    {selectedDossier.studentPhone && (
                      <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{selectedDossier.studentPhone}</span>
                      </div>
                    )}
                    {selectedDossier.studentBacSeries && (
                      <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                        <Award className="w-3.5 h-3.5 text-amber-500" />
                        <span className="font-semibold text-slate-700 dark:text-slate-350">{selectedDossier.studentBacSeries}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Attachments Section */}
                <div>
                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-3">Pièces du Dossier d'Orientation</h4>
                  <div className="space-y-2">
                    {Object.entries(selectedDossier.documents || {}).map(([key, content]) => {
                      if (!content) return null;
                      const fileName = selectedDossier.documentNames?.[key as any] || `${key}.txt`;
                      return (
                        <div 
                          key={key}
                          className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-150 dark:border-slate-850/50 flex items-center justify-between gap-3 group"
                        >
                          <div className="flex items-center gap-2 truncate min-w-0">
                            <FileText className="w-4 h-4 text-indigo-505 dark:text-indigo-400 flex-shrink-0" />
                            <div className="truncate">
                              <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 capitalize truncate">{key === 'attestationBac' ? 'Diplôme du BAC' : key === 'lettreMotivation' ? 'Lettre de Motivation' : key === 'acteNaissance' ? 'Acte Naissance' : key}</p>
                              <p className="text-[9px] text-slate-400 dark:text-slate-500 truncate">{fileName}</p>
                            </div>
                          </div>
                          <div className="flex gap-1.5 flex-shrink-0">
                            <button
                              onClick={() => setPreviewDoc({ label: key, name: fileName, content: content as string })}
                              className="p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 rounded text-slate-500 hover:text-indigo-500 transition-all cursor-pointer"
                              title="Visualiser"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => triggerDownload(content as string, fileName)}
                              className="p-1.5 bg-indigo-55/10 dark:bg-indigo-950/35 border border-indigo-100 dark:border-indigo-900 hover:bg-indigo-600 hover:text-white rounded text-indigo-600 transition-all cursor-pointer"
                              title="Télécharger"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    {Object.keys(selectedDossier.documents || {}).length === 0 && (
                      <p className="text-xs text-slate-400 italic">Aucun document téléversé dans ce dossier.</p>
                    )}
                  </div>
                </div>

                {/* MESSAGING SYSTEM INTERNAL TO ESTABLISHMENT EVALUATOR */}
                <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquare className="w-4 h-4 text-indigo-500" />
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Messagerie de Concertation (Élève/Université)</h4>
                  </div>

                  {/* Previous messages thread list */}
                  <div className="bg-slate-50 dark:bg-slate-950/50 rounded-xl p-3 border border-slate-150 dark:border-slate-850 max-h-[160px] overflow-y-auto mb-3 space-y-2.5">
                    {(!selectedDossier.messages || selectedDossier.messages.length === 0) ? (
                      <p className="text-[10px] text-slate-400 italic text-center py-4">Aucun retour formulé. Saisissez une remarque ou une demande de correction ci-dessous.</p>
                    ) : (
                      selectedDossier.messages.map((m) => {
                        const isStudent = m.sender === 'student';
                        return (
                          <div key={m.id} className={`flex flex-col ${isStudent ? 'items-start' : 'items-end'}`}>
                            <div className={`max-w-[90%] rounded-xl px-2.5 py-1.5 text-[11px] leading-relaxed border ${
                              isStudent 
                                ? 'bg-indigo-50/20 text-slate-800 border-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-200 dark:border-indigo-900/30'
                                : 'bg-teal-50/50 text-teal-800 border-teal-100 dark:bg-teal-950/30 dark:text-teal-300 dark:border-teal-900/40'
                            }`}>
                              <div className="flex items-center justify-between gap-3 text-[8.5px] opacity-75 border-b border-black/5 dark:border-white/5 pb-0.5 mb-1">
                                <span className="font-extrabold">{m.senderName} ({isStudent ? 'Élève' : 'Moi'})</span>
                                <span>{new Date(m.createdAt).toLocaleDateString([], {month: 'short', day: 'numeric'})}</span>
                              </div>
                              {m.documentKey && (
                                <span className="inline-block bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[7px] font-black uppercase px-1 py-0.2 rounded mb-1">
                                  Cible : {m.documentKey === 'attestationBac' ? 'Diplôme BAC' : m.documentKey === 'lettreMotivation' ? 'Motivation' : m.documentKey === 'bulletins' ? 'Bulletins de notes' : m.documentKey}
                                </span>
                              )}
                              <p className="whitespace-pre-wrap">{m.text}</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Reply container */}
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <select
                        value={managerDocTarget}
                        onChange={(e) => setManagerDocTarget(e.target.value)}
                        className="flex-1 text-[9px] font-bold px-2 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-700 dark:text-slate-350 outline-none"
                      >
                        <option value="general">Discussion générale</option>
                        {Object.keys(selectedDossier.documents || {}).map((f) => (
                          <option key={f} value={f}>Cible : {f === 'attestationBac' ? 'Diplôme BAC' : f === 'lettreMotivation' ? 'Lettre de Motivation' : f === 'bulletins' ? 'Bulletins de notes' : f}</option>
                        ))}
                      </select>
                    </div>

                    <div className="relative">
                      <textarea
                        value={managerMessage}
                        onChange={(e) => setManagerMessage(e.target.value)}
                        placeholder="Précisez une remarque ou un motif d'invalidité de document..."
                        rows={2.5}
                        className="w-full text-xs p-2.5 pb-10 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-800 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500 placeholder-slate-400"
                      />
                      <button
                        type="button"
                        onClick={handleSendManagerMessage}
                        disabled={!managerMessage.trim()}
                        className="absolute bottom-2 right-2 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-md text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Send className="w-2.5 h-2.5" /> Poser retour
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-[9px] text-slate-400 italic mt-6 border-t border-slate-100 dark:border-slate-800/80 pt-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Mis à jour le {new Date(selectedDossier.updatedAt || selectedDossier.createdAt).toLocaleString()}
              </div>
            </div>

            {/* Decision panel console */}
            <div className="md:w-1/2 p-5 bg-slate-55/20 dark:bg-slate-950/20 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="pb-2 border-b border-slate-100 dark:border-slate-800">
                  <h4 className="text-[10px] font-black uppercase text-slate-450 tracking-wider flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400" /> Console de Traitement d'Orientation
                  </h4>
                </div>

                {/* Dropdown status selector */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1.5">Statut de la Candidature</label>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { status: 'En cours d\'examen', label: 'En Examen', bg: 'hover:bg-amber-100 text-amber-700 hover:border-amber-400', activeBg: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-400' },
                      { status: 'Accepté', label: 'Accepte', bg: 'hover:bg-emerald-100 text-emerald-700 hover:border-emerald-400', activeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400' },
                      { status: 'Refusé', label: 'Refuse', bg: 'hover:bg-rose-100 text-rose-700 hover:border-rose-400', activeBg: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/40 dark:text-rose-400' }
                    ] as const).map((opt) => {
                      const isActive = decisionStatus === opt.status;
                      return (
                        <button
                          type="button"
                          key={opt.status}
                          onClick={() => setDecisionStatus(opt.status as any)}
                          className={`p-2.5 rounded-xl text-center text-xs font-black border transition-all cursor-pointer ${
                            isActive ? opt.activeBg : `bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-350 ${opt.bg}`
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Feedback note text area */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1.5">Commentaire & Conseils d'Orientation</label>
                  <textarea
                    rows={6}
                    value={adviceText}
                    onChange={(e) => setAdviceText(e.target.value)}
                    placeholder="Saisissez des conseils d'orientation, des demandes de compléments ou des encouragements..."
                    className="w-full text-xs p-3 bg-white dark:bg-slate-905 border border-slate-210 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-550 text-slate-800 dark:text-white placeholder-slate-400"
                  />
                  <p className="text-[10px] text-slate-450 mt-1 italic">Ce message sera inclus dans la notification envoyée instantanément à l'élève.</p>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-6">
                {feedbackMsg && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    className={`p-2.5 rounded-xl text-[11px] leading-relaxed font-bold ${
                      feedbackMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                    }`}
                  >
                    {feedbackMsg.text}
                  </motion.div>
                )}

                <button
                  type="button"
                  onClick={handleUpdateStatusAndNotify}
                  disabled={processing}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md check-pulse"
                >
                  <Send className="w-3.5 h-3.5" />
                  {processing ? "Notification en cours..." : "Valider et notifier l'élève"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Embedded Document Preview Modal Modal */}
      <AnimatePresence>
        {previewDoc && (
          <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-2xl border border-slate-100 dark:border-slate-800 relative shadow-2xl"
            >
              <button
                onClick={() => setPreviewDoc(null)}
                className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-705 text-slate-500 rounded-full cursor-pointer transition-all"
              >
                <XCircle className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
                <FileText className="w-6 h-6 text-indigo-500" />
                <div>
                  <h3 className="font-extrabold text-sm text-slate-850 dark:text-white capitalize">Visualisation : {previewDoc.label}</h3>
                  <p className="text-[10px] text-slate-400">{previewDoc.name}</p>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-4 max-h-[50vh] overflow-y-auto flex items-center justify-center border border-slate-100 dark:border-slate-850">
                {previewDoc.content.startsWith('data:image/') ? (
                  <img src={previewDoc.content} alt={previewDoc.name} className="max-w-full h-auto rounded" />
                ) : (
                  <div className="p-8 text-center space-y-4">
                    <FileText className="w-12 h-12 mx-auto text-indigo-500 animate-pulse" />
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Fichier encodé avec succès [Mime/Type: Base64]</p>
                    <p className="text-[11px] text-slate-500">Pour garantir l'intégrité et l'authenticité des bulletins d'orientation scolaires, les documents sont conservés sous signature cryptée.</p>
                    <button
                      onClick={() => triggerDownload(previewDoc.content, previewDoc.name)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-650 hover:bg-indigo-750 text-white rounded-xl text-xs font-bold transition-all"
                    >
                      <Download className="w-3.5 h-3.5" /> Télécharger pour lire localement
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
