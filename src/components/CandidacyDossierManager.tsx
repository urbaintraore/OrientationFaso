import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  Upload, 
  CheckCircle, 
  X, 
  Building, 
  GraduationCap, 
  Clock, 
  FileCheck, 
  Trash2, 
  Eye, 
  FolderPlus, 
  AlertCircle,
  FileSignature,
  FileSpreadsheet,
  Award,
  BookOpen,
  User,
  ExternalLink,
  Download,
  Send,
  Camera
} from 'lucide-react';
import jsPDF from 'jspdf';
import { db, auth, isFirebaseConfigured } from '../lib/firebase';
import { collection, query, where, getDocs, getDoc, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { CandidacyDossier, Institution } from '../types';
import { mockInstitutions } from '../data/mockInstitutions';
import { Bell, MessageSquare } from 'lucide-react';
import { generateCandidacyPDF } from '../utils/pdfGenerator';

const getDocLabel = (field: string) => {
  switch(field) {
    case 'bulletins': return "Bulletins & Relevés de notes";
    case 'attestationBac': return "Attestation du Bac/BEPC";
    case 'cv': return "Curriculum Vitae (CV)";
    case 'lettreMotivation': return "Lettre de motivation avec photo";
    case 'acteNaissance': return "Acte de naissance";
    case 'autres': return "Autres justificatifs d'appui";
    default: return field;
  }
};

export function CandidacyDossierManager() {
  const [dossiers, setDossiers] = useState<CandidacyDossier[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [activeDossier, setActiveDossier] = useState<Partial<CandidacyDossier> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dragOverField, setDragOverField] = useState<string | null>(null);
  const [previewDocument, setPreviewDocument] = useState<{ name: string; content: string } | null>(null);
  const [studentProfile, setStudentProfile] = useState<{ displayName?: string; email?: string; phone?: string; bac?: { series?: string }; fullName?: string } | null>(null);
  const [estNotifications, setEstNotifications] = useState<any[]>([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [messageDocKey, setMessageDocKey] = useState<string>('general');

  // Camera Capture sub-system states
  const [cameraField, setCameraField] = useState<string | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);

  const handleStartCamera = async (field: string) => {
    setCameraField(field);
    setCapturedPhoto(null);
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      setCameraStream(stream);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(e => console.error("Error starting video playback:", e));
        }
      }, 300);
    } catch (err) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setCameraStream(stream);
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(e => console.error("Error starting fallback video:", e));
          }
        }, 300);
      } catch (fErr) {
        setCameraError("Impossible d'accéder à l'appareil de Capture. Veuillez vérifier vos permissions.");
      }
    }
  };

  const handleStopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
    }
    setCameraStream(null);
    setCameraField(null);
    setCapturedPhoto(null);
  };

  const handleCapturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setCapturedPhoto(dataUrl);
    }
  };

  const handleConfirmPhoto = () => {
    if (!capturedPhoto || !cameraField || !activeDossier) return;
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const imgHeight = 297;
      pdf.addImage(capturedPhoto, 'JPEG', 0, 0, imgWidth, imgHeight);
      const pdfDataUrl = pdf.output('datauristring');

      const updatedDocs = { ...activeDossier.documents, [cameraField]: pdfDataUrl };
      const updatedNames = { ...activeDossier.documentNames, [cameraField]: `offset_capture_${cameraField}_${Date.now().toString().slice(-4)}.pdf` };

      setActiveDossier({
        ...activeDossier,
        documents: updatedDocs,
        documentNames: updatedNames
      });

      setSuccess(`Photo convertie et enregistrée au format PDF pour "${getDocLabel(cameraField)}".`);
      setTimeout(() => setSuccess(null), 4000);
      handleStopCamera();
    } catch (e) {
      setCameraError("Une erreur est survenue lors de l'encapsulation du PDF.");
    }
  };

  const handleSendMessage = async () => {
    if (!newMessageText.trim() || !activeDossier || !activeDossier.id) return;

    const msg = {
      id: 'msg-' + Math.random().toString(36).substring(2, 9),
      sender: 'student' as const,
      senderName: studentProfile?.displayName || studentProfile?.fullName || auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || 'Élève',
      text: newMessageText.trim(),
      createdAt: new Date().toISOString(),
      documentKey: messageDocKey !== 'general' ? messageDocKey : undefined
    };

    const updatedMessages = [...(activeDossier.messages || []), msg];
    const updated = {
      ...activeDossier,
      messages: updatedMessages,
      updatedAt: new Date().toISOString()
    } as CandidacyDossier;

    setActiveDossier(updated);
    setNewMessageText('');

    try {
      if (isFirebaseConfigured && auth.currentUser) {
        await updateDoc(doc(db, 'candidacy_dossiers', activeDossier.id), {
          messages: updatedMessages,
          updatedAt: new Date().toISOString()
        });
      }

      const localDossiersKey = 'orientationbf_local_candidacy_dossiers';
      const localData = localStorage.getItem(localDossiersKey);
      if (localData) {
        try {
          const list = JSON.parse(localData) as CandidacyDossier[];
          const updatedList = list.map(d => d.id === activeDossier.id ? updated : d);
          localStorage.setItem(localDossiersKey, JSON.stringify(updatedList));
        } catch {}
      }
      
      setDossiers(prev => prev.map(d => d.id === activeDossier.id ? updated : d));
      setSuccess("Message de retour enregistré !");
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      console.error("Error sending message:", e);
      setError("Échec de l'envoi de votre message.");
      setTimeout(() => setError(null), 3000);
    }
  };

  // Load student profile & direct establishment notifications
  useEffect(() => {
    let unsubscribeNotifs: (() => void) | undefined;

    const fetchProfileAndNotifications = async () => {
      const user = auth.currentUser;
      if (!user) {
        try {
          const cachedNotifs = localStorage.getItem('orientationbf_local_notifications');
          if (cachedNotifs) {
            const parsed = JSON.parse(cachedNotifs);
            setEstNotifications(parsed.filter((n: any) => n.category === 'establishment'));
          }
        } catch {}
        return;
      }

      if (isFirebaseConfigured) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setStudentProfile(userDoc.data() as any);
          }
        } catch (e) {
          console.error("Error loading user profile in candidacy manager:", e);
        }

        const qNotifs = query(
          collection(db, 'notifications'),
          where('userId', '==', user.uid),
          where('category', '==', 'establishment')
        );
        unsubscribeNotifs = onSnapshot(qNotifs, (snapshot) => {
          const list: any[] = [];
          snapshot.forEach((doc) => {
            list.push({ id: doc.id, ...doc.data() });
          });
          setEstNotifications(list);
        });
      } else {
        const cachedNotifs = localStorage.getItem('orientationbf_local_notifications');
        if (cachedNotifs) {
          try {
            const parsed = JSON.parse(cachedNotifs);
            setEstNotifications(parsed.filter((n: any) => n.category === 'establishment'));
          } catch {}
        }
      }
    };

    fetchProfileAndNotifications();

    const handleLocalUpdate = () => {
      const data = localStorage.getItem('orientationbf_local_notifications');
      if (data) {
        try {
          const parsed = JSON.parse(data);
          setEstNotifications(parsed.filter((n: any) => n.category === 'establishment'));
        } catch {}
      }
    };
    window.addEventListener('local-notifications-updated', handleLocalUpdate);

    return () => {
      if (unsubscribeNotifs) {
        unsubscribeNotifs();
      }
      window.removeEventListener('local-notifications-updated', handleLocalUpdate);
    };
  }, []);

  // Load dossiers
  useEffect(() => {
    const localDossiersKey = 'orientationbf_local_candidacy_dossiers';
    
    // Fallback load local
    const loadLocal = () => {
      const data = localStorage.getItem(localDossiersKey);
      if (data) {
        try {
          setDossiers(JSON.parse(data));
        } catch (e) {
          console.error("Failed parsing local dossiers", e);
        }
      }
    };

    if (isFirebaseConfigured && auth.currentUser) {
      const uid = auth.currentUser.uid;
      const q = query(collection(db, 'candidacy_dossiers'), where('userId', '==', uid));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list: CandidacyDossier[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as CandidacyDossier);
        });
        
        // Save to cache for offline consultation
        localStorage.setItem(localDossiersKey, JSON.stringify(list));
        setDossiers(list);
      }, (err) => {
        console.error("Error fetching firebase dossiers, falling back to cache", err);
        loadLocal();
      });

      return () => unsubscribe();
    } else {
      loadLocal();
    }
  }, []);

  // Update local storage backup whenever dossiers state changes
  const updateOfflineCache = (updatedList: CandidacyDossier[]) => {
    localStorage.setItem('orientationbf_local_candidacy_dossiers', JSON.stringify(updatedList));
  };

  const handleOpenNew = () => {
    setActiveDossier({
      institutionId: '',
      institutionName: '',
      programId: '',
      programName: '',
      status: 'Brouillon',
      documents: {},
      documentNames: {}
    });
    setIsEditing(true);
  };

  const handleInstitutionChange = (instId: string) => {
    const inst = mockInstitutions.find(i => i.id === instId);
    if (inst && activeDossier) {
      setActiveDossier({
        ...activeDossier,
        institutionId: instId,
        institutionName: inst.name,
        programId: '', // Reset program
        programName: ''
      });
    }
  };

  const handleProgramChange = (progId: string) => {
    if (!activeDossier || !activeDossier.institutionId) return;
    const inst = mockInstitutions.find(i => i.id === activeDossier.institutionId);
    const prog = inst?.programs?.find(p => p.id === progId);
    if (prog) {
      setActiveDossier({
        ...activeDossier,
        programId: progId,
        programName: prog.name
      });
    }
  };

  const processFile = (fieldName: string, file: File) => {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Les fichiers doivent faire moins de 5 Mo.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string' && activeDossier) {
        const updatedDocs = { ...activeDossier.documents, [fieldName]: reader.result };
        const updatedNames = { ...activeDossier.documentNames, [fieldName]: file.name };
        
        setActiveDossier({
          ...activeDossier,
          documents: updatedDocs,
          documentNames: updatedNames
        });
        setSuccess(`Document "${file.name}" chargé avec succès.`);
        setTimeout(() => setSuccess(null), 3000);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileDrop = (e: React.DragEvent, fieldName: string) => {
    e.preventDefault();
    setDragOverField(null);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(fieldName, files[0]);
    }
  };

  const handleRemoveFile = (fieldName: string) => {
    if (!activeDossier) return;
    
    const updatedDocs = { ...activeDossier.documents };
    delete updatedDocs[fieldName];
    
    const updatedNames = { ...activeDossier.documentNames };
    delete updatedNames[fieldName];

    setActiveDossier({
      ...activeDossier,
      documents: updatedDocs,
      documentNames: updatedNames
    });
  };

  const handleSave = async (submitStatus: 'Brouillon' | 'Soumis') => {
    if (!activeDossier?.institutionId || !activeDossier?.programId) {
      setError("Veuillez sélectionner un établissement et une filière.");
      return;
    }

    setLoading(true);
    setError(null);

    const uid = auth.currentUser?.uid || 'offline-student';
    const finalDossier: Omit<CandidacyDossier, 'id'> = {
      userId: uid,
      institutionId: activeDossier.institutionId,
      institutionName: activeDossier.institutionName || '',
      programId: activeDossier.programId,
      programName: activeDossier.programName || '',
      status: submitStatus,
      createdAt: activeDossier.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      studentName: studentProfile?.displayName || studentProfile?.fullName || auth.currentUser?.displayName || 'Élève Anonyme',
      studentEmail: studentProfile?.email || auth.currentUser?.email || 'eleve@orientation.bf',
      studentPhone: studentProfile?.phone || '',
      studentBacSeries: studentProfile?.bac?.series || '',
      documents: activeDossier.documents || {},
      documentNames: activeDossier.documentNames || {}
    };

    try {
      if (isFirebaseConfigured && auth.currentUser) {
        if (activeDossier.id) {
          // Update
          await updateDoc(doc(db, 'candidacy_dossiers', activeDossier.id), finalDossier);
          setSuccess(submitStatus === 'Soumis' ? "Dossier soumis avec succès !" : "Dossier enregistré en brouillon.");
        } else {
          // Create
          await addDoc(collection(db, 'candidacy_dossiers'), finalDossier);
          setSuccess(submitStatus === 'Soumis' ? "Dossier créé et soumis avec succès !" : "Dossier créé en brouillon.");
        }
      } else {
        // Offline or standard local storage
        let updatedList = [...dossiers];
        if (activeDossier.id) {
          updatedList = updatedList.map(d => d.id === activeDossier.id ? { ...finalDossier, id: activeDossier.id } as CandidacyDossier : d);
        } else {
          const newDossier: CandidacyDossier = {
            ...finalDossier,
            id: 'dossier-' + Date.now()
          };
          updatedList.push(newDossier);
        }
        setDossiers(updatedList);
        updateOfflineCache(updatedList);
        setSuccess(submitStatus === 'Soumis' ? "Enregistré hors ligne : Dossier soumis." : "Enregistré hors ligne : Brouillon sauvegardé.");
      }

      setIsEditing(false);
      setActiveDossier(null);
    } catch (err: any) {
      console.error(err);
      setError("Une erreur est survenue lors de l'enregistrement. Enregistrement local de sécurité...");
      // Save local backup anyway
      let backupList = [...dossiers];
      const backupDossier: CandidacyDossier = {
        ...finalDossier,
        id: activeDossier.id || 'dossier-backup-' + Date.now()
      };
      if (activeDossier.id) {
        backupList = backupList.map(d => d.id === activeDossier.id ? backupDossier : d);
      } else {
        backupList.push(backupDossier);
      }
      setDossiers(backupList);
      updateOfflineCache(backupList);
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(null), 4000);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Voulez-vous vraiment supprimer ce dossier de candidature ? En mode Hors ligne, le dossier local sera effacé.")) return;

    try {
      if (isFirebaseConfigured && auth.currentUser && !id.startsWith('dossier-')) {
        await deleteDoc(doc(db, 'candidacy_dossiers', id));
      } else {
        const updatedList = dossiers.filter(d => d.id !== id);
        setDossiers(updatedList);
        updateOfflineCache(updatedList);
        setSuccess("Dossier supprimé localement.");
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      console.error(err);
      setError("Impossible de supprimer le dossier en ligne. Suppression locale de secours effectuée.");
      const updatedList = dossiers.filter(d => d.id !== id);
      setDossiers(updatedList);
      updateOfflineCache(updatedList);
    }
  };

  const getDocIcon = (field: string) => {
    switch(field) {
      case 'bulletins': return <FileSpreadsheet className="w-5 h-5 text-indigo-500" />;
      case 'attestationBac': return <Award className="w-5 h-5 text-emerald-500" />;
      case 'cv': return <User className="w-5 h-5 text-amber-500" />;
      case 'lettreMotivation': return <FileSignature className="w-5 h-5 text-teal-500" />;
      case 'acteNaissance': return <FileText className="w-5 h-5 text-rose-500" />;
      default: return <FileCheck className="w-5 h-5 text-blue-500" />;
    }
  };

  const REQUIRED_FIELDS = ['bulletins', 'attestationBac', 'cv', 'lettreMotivation', 'acteNaissance', 'autres'];

  return (
    <div className="bg-slate-50/50 dark:bg-slate-900/10 rounded-3xl p-6 border border-slate-100 dark:border-slate-800/60 shadow-inner">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-5.5 h-5.5 text-teal-600" />
            Mon Dossier de Candidature
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-450 mt-1">
            Gérez vos pièces justificatives, remplissez vos dossiers de candidature universitaires et suivez vos envois.
          </p>
        </div>
        {!isEditing && (
          <button
            onClick={handleOpenNew}
            className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-teal-500/10"
          >
            <FolderPlus className="w-4 h-4" />
            Créer un dossier
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-950/20 border-l-4 border-rose-500 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs font-medium text-rose-850 dark:text-rose-300">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-950/20 border-l-4 border-emerald-500 rounded-xl flex items-center gap-3 animate-fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
          <p className="text-xs font-semibold text-emerald-850 dark:text-emerald-300">{success}</p>
        </div>
      )}

      {!isEditing ? (
        <>
          {dossiers.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            <div className="w-14 h-14 bg-teal-50 dark:bg-teal-950/30 text-teal-500 dark:text-teal-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-teal-100 dark:border-teal-900/40">
              <FileText className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm uppercase tracking-wider">Aucun dossier déposé</h3>
            <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed">
              Vous n'avez pas encore préparé de dossier d'inscription. Créez votre dossier, importez vos bulletins et postulez auprès des instituts burkinabés.
            </p>
            <button
              onClick={handleOpenNew}
              className="mt-6 px-5 py-2.5 bg-slate-900 hover:bg-slate-850 dark:bg-slate-750 dark:hover:bg-slate-700 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer shadow transition-all"
            >
              Préparer mon premier dossier
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {dossiers.map((d) => (
              <div 
                key={d.id}
                className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-150 dark:border-slate-750 flex flex-col justify-between hover:shadow-md transition-all group"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                      d.status === 'Soumis' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400' :
                      d.status === 'Accepté' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400' :
                      d.status === 'Refusé' ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400' :
                      'bg-slate-100 text-slate-750 dark:bg-slate-700 dark:text-slate-350'
                    }`}>
                      {d.status}
                    </span>
                    
                    <div className="flex gap-1.5 items-center">
                      <button
                        onClick={() => generateCandidacyPDF(d)}
                        className="p-1.5 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border border-indigo-100/30 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition-all hover:bg-indigo-600 hover:text-white cursor-pointer"
                        title="Télécharger le dossier au format PDF"
                      >
                        <Download className="w-3.5 h-3.5" /> PDF d’Orientation
                      </button>
                      <button
                        onClick={() => {
                          setActiveDossier(d);
                          setIsEditing(true);
                        }}
                        className="p-1 px-2.5 text-[10px] font-extrabold uppercase tracking-widest text-[#2c3e50] dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-955 rounded-lg transition-all cursor-pointer"
                      >
                        Ouvrir / Modifier
                      </button>
                      <button
                        onClick={(e) => handleDelete(d.id, e)}
                        className="p-2 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50/50 dark:hover:bg-rose-950/30 transition-all cursor-pointer"
                        title="Retirer ce dossier"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-extrabold text-[#2c3e50] dark:text-white text-md flex items-center gap-1.5 leading-snug">
                    <Building className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    {d.institutionName}
                  </h3>
                  
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mt-2 pl-5.5">
                    <GraduationCap className="w-4 h-4 text-[#16a085]" />
                    {d.programName}
                  </div>

                  {/* Documents mini-stats */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">Documents fournis ({Object.keys(d.documents || {}).length} / 6)</h4>
                    <div className="flex flex-wrap gap-2">
                      {REQUIRED_FIELDS.map((docField) => {
                        const uploaded = !!d.documents?.[docField];
                        return (
                          <span 
                            key={docField} 
                            className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                              uploaded 
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/10 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30' 
                                : 'bg-slate-50 text-slate-400 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850'
                            }`}
                          >
                            {docField === 'attestationBac' ? 'Diplôme' : docField === 'lettreMotivation' ? 'Lettre' : docField}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Visual Step-by-Step Progress Tracker */}
                  <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <h5 className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-2.5">Traitement de votre dossier</h5>
                    <div className="relative flex items-center justify-between px-1 mb-2">
                      {/* Connection bar background */}
                      <div className="absolute left-3 right-3 top-[11px] h-0.5 bg-slate-100 dark:bg-slate-700 -z-10" />
                      
                      {/* Filled progress bar */}
                      <div 
                        className="absolute left-3 top-[11px] h-0.5 bg-teal-500 transition-all duration-500 -z-10"
                        style={{
                          width: 
                            d.status === 'Brouillon' ? '0%' :
                            d.status === 'Soumis' ? '33.33%' :
                            d.status === "En cours d'examen" || d.status === "En cours l'examen" ? '66.66%' :
                            '100%'
                        }}
                      />

                      {/* Step 1: Brouillon */}
                      <div className="flex flex-col items-center">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black ${
                          d.status === 'Brouillon'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 ring-2 ring-amber-50 dark:ring-amber-950/20'
                            : 'bg-teal-500 text-white'
                        }`}>
                          {d.status === 'Brouillon' ? <Clock className="w-2.5 h-2.5" /> : '✓'}
                        </div>
                        <span className="text-[7px] font-bold uppercase tracking-wider text-slate-400 mt-1">Brouillon</span>
                      </div>

                      {/* Step 2: Soumis */}
                      <div className="flex flex-col items-center">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black ${
                          d.status === 'Brouillon'
                            ? 'bg-slate-100 text-slate-300 dark:bg-slate-850 dark:text-slate-650'
                            : d.status === 'Soumis'
                              ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 ring-2 ring-indigo-50 dark:ring-indigo-950/20'
                              : 'bg-teal-500 text-white'
                        }`}>
                          {d.status === 'Brouillon' ? '2' : (d.status === 'Soumis' ? <Send className="w-2.5 h-2.5" /> : '✓')}
                        </div>
                        <span className="text-[7px] font-bold uppercase tracking-wider text-slate-400 mt-1">Soumis</span>
                      </div>

                      {/* Step 3: En examen */}
                      <div className="flex flex-col items-center">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black ${
                          d.status === 'Brouillon' || d.status === 'Soumis'
                            ? 'bg-slate-100 text-slate-300 dark:bg-slate-850 dark:text-slate-650'
                            : d.status === "En cours d'examen" || d.status === "En cours l'examen"
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 ring-2 ring-amber-50 dark:ring-amber-950/20'
                              : 'bg-teal-500 text-white'
                        }`}>
                          {d.status === 'Brouillon' || d.status === 'Soumis' ? '3' : (d.status === "En cours d'examen" || d.status === "En cours l'examen" ? <Eye className="w-2.5 h-2.5" /> : '✓')}
                        </div>
                        <span className="text-[7px] font-bold uppercase tracking-wider text-slate-400 mt-1">Examen</span>
                      </div>

                      {/* Step 4: Decision Adm/Rej/Attente */}
                      <div className="flex flex-col items-center">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black ${
                          d.status === 'Accepté'
                            ? 'bg-emerald-505 bg-emerald-500 text-white font-black'
                            : d.status === 'Refusé'
                              ? 'bg-rose-505 bg-rose-500 text-white font-black'
                              : 'bg-slate-100 text-slate-300 dark:bg-slate-850 dark:text-slate-650'
                        }`}>
                          {d.status === 'Accepté' ? '✓' : d.status === 'Refusé' ? '✗' : '4'}
                        </div>
                        <span className="text-[7px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                          {d.status === 'Accepté' ? 'Admis' : d.status === 'Refusé' ? 'Rejeté' : 'Décision'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="text-[9px] font-mono text-slate-420 dark:text-slate-500">
                    Dossier ID: {d.id}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    Mise à jour: {new Date(d.updatedAt || d.createdAt).toLocaleDateString('fr-FR')}
                  </div>
                </div>
              </div>
            ))}
          </div>
          )}

        {/* Direct notifications from institutions tracking decision advancement */}
        <div className="mt-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 pb-4 mb-4 border-b border-slate-100 dark:border-slate-850">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-850 dark:text-white uppercase tracking-wider">Suivi des décisions & Communications Établissements</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Retours administratifs, décisions d'admission et retours d'examen de dossier.</p>
            </div>
          </div>

          {estNotifications.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs italic">
              Aucune notification officielle reçue à ce jour de la part des universités partenaires.
            </div>
          ) : (
            <div className="space-y-4">
              {estNotifications.map((notif: any) => {
                const formattedDate = notif.createdAt 
                  ? typeof notif.createdAt === 'string' 
                    ? new Date(notif.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'numeric', year: 'numeric' })
                    : notif.createdAt.toDate 
                      ? notif.createdAt.toDate().toLocaleDateString('fr-FR', { day: 'numeric', month: 'numeric', year: 'numeric' })
                      : new Date(notif.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'numeric', year: 'numeric' })
                  : 'Récemment';

                return (
                  <div 
                    key={notif.id}
                    className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-850 flex items-start gap-3.5 hover:border-indigo-200 dark:hover:border-indigo-950 transition-colors"
                  >
                    <div className="p-2 bg-white dark:bg-slate-900 rounded-lg text-indigo-500 shadow-sm border border-slate-100 dark:border-slate-800 mt-0.5">
                      <Building className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                        <h4 className="font-extrabold text-xs text-slate-850 dark:text-white truncate">{notif.title}</h4>
                        <span className="text-[9px] text-slate-400 font-mono">
                          {formattedDate}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-350 text-xs leading-relaxed whitespace-pre-wrap">{notif.message}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        </>
      ) : (
        // EDIT / CREATE FORM
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg"
        >
          <div className="flex justify-between items-center pb-4 mb-6 border-b border-slate-100 dark:border-slate-700">
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-[#2c3e50] dark:text-white">
              {activeDossier?.id ? "Mettre à jour mon dossier" : "Créer un dossier de candidature universitaire"}
            </h3>
            <button 
              onClick={() => {
                setIsEditing(false);
                setActiveDossier(null);
                setError(null);
              }}
              className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-full cursor-pointer transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Institution Choice */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Établissement cible</label>
              <select
                value={activeDossier?.institutionId || ''}
                onChange={(e) => handleInstitutionChange(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-teal-500/20 transition-all cursor-pointer"
              >
                <option value="">Sélectionner un établissement...</option>
                {mockInstitutions.map((inst) => (
                  <option key={inst.id} value={inst.id}>{inst.name} ({inst.city})</option>
                ))}
              </select>
            </div>

            {/* Filiere / Program Choice */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Filière / Programme d’étude</label>
              <select
                value={activeDossier?.programId || ''}
                onChange={(e) => handleProgramChange(e.target.value)}
                disabled={!activeDossier?.institutionId}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-teal-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <option value="">-- Choisir une filière --</option>
                {activeDossier?.institutionId && mockInstitutions.find(i => i.id === activeDossier.institutionId)?.programs?.map((prog) => (
                  <option key={prog.id} value={prog.id}>{prog.name} ({prog.level})</option>
                ))}
              </select>
              {!activeDossier?.institutionId && (
                <p className="text-[9px] text-amber-500 pl-1 font-semibold">Veuillez d'abord choisir un établissement.</p>
              )}
            </div>
          </div>

          {/* Grid of pieces à déposer */}
          <div className="mb-8">
            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-4">Pièces et documents administratifs requis</h4>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {REQUIRED_FIELDS.map((field) => {
                const uploadedFile = activeDossier?.documents?.[field];
                const uploadedName = activeDossier?.documentNames?.[field];
                const isDragOver = dragOverField === field;

                return (
                  <div 
                    key={field}
                    className={`border-2 rounded-2xl p-4 flex flex-col justify-between min-h-[140px] transition-all relative ${
                      uploadedFile 
                        ? 'border-emerald-200 bg-emerald-50/10 dark:border-emerald-950 dark:bg-emerald-950/5' 
                        : isDragOver 
                          ? 'border-teal-500 bg-teal-50/40 dark:bg-teal-950/20 scale-[1.02]' 
                          : 'border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 hover:border-slate-350 dark:hover:border-slate-650'
                    }`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverField(field);
                    }}
                    onDragLeave={() => setDragOverField(null)}
                    onDrop={(e) => handleFileDrop(e, field)}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="p-2 rounded-xl bg-white dark:bg-slate-950 shadow-sm">
                          {getDocIcon(field)}
                        </div>
                        {uploadedFile && (
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                if (uploadedFile) {
                                  setPreviewDocument({ name: uploadedName || '', content: uploadedFile });
                                }
                              }}
                              className="p-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-950 dark:hover:bg-slate-900 rounded-lg text-slate-600 dark:text-slate-300 transition-colors"
                              title="Aperçu du justificatif"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveFile(field)}
                              className="p-1 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900 rounded-lg text-rose-600 dark:text-rose-400 transition-colors"
                              title="Retirer le document"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      <h5 className="text-[11px] font-extrabold text-slate-800 dark:text-white leading-snug">
                        {getDocLabel(field)}
                      </h5>
                    </div>

                    <div className="mt-4 pt-2">
                      {uploadedFile ? (
                        <div className="flex items-center gap-1.5">
                          <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                          <span className="text-[9px] font-mono text-slate-600 dark:text-slate-350 truncate block w-full max-w-[150px]">
                            {uploadedName || "Chargé"}
                          </span>
                        </div>
                      ) : (
                        <div className="text-center">
                          <input 
                            id={`file-input-${field}`}
                            type="file" 
                            accept="image/*,application/pdf"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files && e.target.files.length > 0) {
                                processFile(field, e.target.files[0]);
                              }
                            }}
                          />
                          <div className="flex flex-col gap-2 mt-2">
                            <button
                              type="button"
                              onClick={() => document.getElementById(`file-input-${field}`)?.click()}
                              className="w-full py-1.5 px-3 bg-white hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                            >
                              <Upload className="w-3 h-3 text-[#16a085]" />
                              Importer un fichier
                            </button>
                            
                            <button
                              type="button"
                              onClick={() => handleStartCamera(field)}
                              className="w-full py-1.5 px-3 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/30 dark:hover:bg-teal-900/40 text-teal-700 dark:text-teal-400 border border-teal-100/30 dark:border-teal-900/30 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                            >
                              <Camera className="w-3.5 h-3.5" />
                              Scanner via Caméra
                            </button>
                          </div>
                          <p className="text-[8px] text-slate-400 dark:text-slate-500 mt-1.5">PDF ou Image (Max 5 Mo)</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECURED MESSAGING SUB-SYSTEM */}
          {activeDossier?.id && (
            <div className="mt-12 pt-8 border-t border-slate-150 dark:border-slate-700">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950/45 rounded-xl text-indigo-600 dark:text-indigo-400">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-[#2c3e50] dark:text-white">Messagerie Intégrée de Coordination</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Pour tout retour spécifique ou demande de justification sur vos pièces jointes.</p>
                </div>
              </div>

              <div className="grid md:grid-cols-12 gap-6 bg-slate-50/50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-4">
                {/* Message display thread */}
                <div className="md:col-span-7 space-y-3 max-h-[260px] overflow-y-auto pr-2 bg-white dark:bg-slate-950 rounded-xl p-3 border border-slate-100 dark:border-slate-900 shadow-inner">
                  {(!activeDossier.messages || activeDossier.messages.length === 0) ? (
                    <div className="text-center py-10 text-slate-400 italic text-xs">
                      Aucun message de coordination échangé. S'il y a un défaut de pièce, l'établissement vous enverra un retour ici.
                    </div>
                  ) : (
                    activeDossier.messages.map((m) => {
                      const isStudent = m.sender === 'student';
                      return (
                        <div key={m.id} className={`flex flex-col ${isStudent ? 'items-end' : 'items-start'}`}>
                          <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs border ${
                            isStudent 
                              ? 'bg-teal-50/50 text-teal-800 border-teal-100 dark:bg-teal-950/30 dark:text-teal-405 dark:border-teal-900/40' 
                              : 'bg-indigo-50 text-slate-800 border-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900/30'
                          }`}>
                            <div className="flex items-center justify-between gap-4 mb-1 border-b border-black/5 dark:border-white/5 pb-1">
                              <span className="font-black text-[9px] uppercase tracking-wider">
                                {m.senderName} ({isStudent ? 'Moi' : 'Administration'})
                              </span>
                              <span className="text-[8px] opacity-75">
                                {new Date(m.createdAt).toLocaleDateString('fr-FR')} {new Date(m.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </span>
                            </div>
                            
                            {m.documentKey && (
                              <span className="inline-block px-1.5 py-0.5 mb-1 text-[8px] font-black uppercase bg-amber-55/20 text-amber-600 dark:text-amber-400 rounded">
                                Pièce : {getDocLabel(m.documentKey)}
                              </span>
                            )}
                            
                            <p className="leading-relaxed whitespace-pre-wrap text-[11.5px]">{m.text}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Send message controls */}
                <div className="md:col-span-5 flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Cibler un document</label>
                    <select
                      value={messageDocKey}
                      onChange={(e) => setMessageDocKey(e.target.value)}
                      className="w-full text-xs font-bold px-3 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 outline-none"
                    >
                      <option value="general">Discussion générale / Demande globale</option>
                      {REQUIRED_FIELDS.map((f) => (
                        <option key={f} value={f}>{getDocLabel(f)}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Votre réponse ou commentaire</label>
                    <textarea
                      value={newMessageText}
                      onChange={(e) => setNewMessageText(e.target.value)}
                      placeholder="Tapez ici votre réponse ou justification sur la pièce jointe..."
                      rows={2.5}
                      className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleSendMessage}
                    disabled={!newMessageText.trim()}
                    className="w-full py-2 px-4 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-teal-500/10"
                  >
                    <Send className="w-3.5 h-3.5" /> Envoyer un retour
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 mt-6 border-t border-slate-100 dark:border-slate-700">
            <div className="text-[10px] text-slate-550 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-teal-600" />
              <span>Chaque pièce est sécurisée et stockée localement ou synchronisée avec Firestore.</span>
            </div>
            
            <div className="flex gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => handleSave('Brouillon')}
                disabled={loading}
                className="flex-1 sm:flex-none px-5 py-3 border border-slate-250 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-750 dark:text-slate-300 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer disabled:opacity-55"
              >
                Sauvegarder Brouillon
              </button>
              
              <button
                type="button"
                onClick={() => handleSave('Soumis')}
                disabled={loading}
                className="flex-1 sm:flex-none px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-teal-500/10 disabled:opacity-55"
              >
                {loading ? "Envoi..." : "Soumettre le dossier"}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* APERCU MODAL ZONE */}
      <AnimatePresence>
        {previewDocument && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden max-w-2xl w-full p-6 border border-slate-150 relative"
            >
              <div className="flex justify-between items-center pb-3 mb-4 border-b border-slate-150">
                <h4 className="font-extrabold text-sm uppercase text-[#2c3e50] dark:text-white truncate max-w-[80%]">{previewDocument.name}</h4>
                <button 
                  onClick={() => setPreviewDocument(null)}
                  className="p-1.5 hover:bg-slate-100 rounded-full cursor-pointer dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5 text-slate-450" />
                </button>
              </div>

              {/* Rendering canvas or img preview */}
              <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-2 max-h-[60vh] overflow-y-auto flex items-center justify-center">
                {previewDocument.content.startsWith('data:image/') ? (
                  <img src={previewDocument.content} alt={previewDocument.name} className="max-w-full h-auto rounded-lg" referrerPolicy="no-referrer" />
                ) : (
                  <div className="p-8 text-center space-y-4">
                    <FileText className="w-14 h-14 mx-auto text-indigo-500" />
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-300">Ce fichier est un document {previewDocument.name.split('.').pop()?.toUpperCase() || "PDF / Word"}.</p>
                    <p className="text-[11px] text-slate-500">Pour votre sécurité, nous affichons les métadonnées et conservons une copie base64 locale dans le cache.</p>
                    <a 
                      href={previewDocument.content}
                      download={previewDocument.name}
                      className="inline-block px-5 py-2.5 bg-indigo-650 hover:bg-indigo-750 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                    >
                      Télécharger pour voir
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CAMÉRA CAPTURE MODAL OVERLAY */}
      <AnimatePresence>
        {cameraField && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden max-w-lg w-full p-6 border border-slate-200/50 dark:border-slate-800 shadow-2xl relative"
            >
              <div className="flex justify-between items-center pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Camera className="w-5 h-5 text-teal-605 text-teal-600" />
                  <h4 className="font-extrabold text-xs uppercase text-[#2c3e50] dark:text-white">
                    Numériser : {getDocLabel(cameraField)}
                  </h4>
                </div>
                <button 
                  type="button"
                  onClick={handleStopCamera}
                  className="p-1.5 hover:bg-slate-100 rounded-full cursor-pointer dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5 text-slate-450" />
                </button>
              </div>

              {cameraError && (
                <div className="mb-4 p-3 bg-rose-50 text-rose-750 text-[10px] rounded-xl font-medium border border-rose-100">
                  {cameraError}
                </div>
              )}

              {/* Camera Video Area / captured photo preview */}
              <div className="relative bg-slate-950 rounded-2xl overflow-hidden aspect-[4/3] flex items-center justify-center border border-slate-800">
                {!capturedPhoto ? (
                  <>
                    <video 
                      ref={videoRef}
                      className="w-full h-full object-cover transform scale-x-[-1]"
                      playsInline
                      muted
                    />
                    <div className="absolute inset-0 border-[24px] border-black/45 pointer-events-none flex items-center justify-center">
                      {/* Document capture bounding helper box lines */}
                      <div className="w-[85%] h-[80%] border-2 border-dashed border-white/60 rounded-xl relative">
                        <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[8px] bg-black/60 text-white font-extrabold px-2 py-0.5 rounded uppercase tracking-wider whitespace-nowrap">
                          Placer le document au centre
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <img 
                    src={capturedPhoto} 
                    alt="Cliché Capturé" 
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer"
                  />
                )}
              </div>

              {/* Control Actions buttons */}
              <div className="flex justify-between items-center gap-4 mt-6">
                {!capturedPhoto ? (
                  <>
                    <button
                      type="button"
                      onClick={handleStopCamera}
                      className="px-4 py-2.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-855 text-slate-700 dark:text-slate-350 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={handleCapturePhoto}
                      className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-teal-500/15"
                    >
                      <Camera className="w-3.5 h-3.5" /> Prendre la photo
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setCapturedPhoto(null)}
                      className="px-4 py-2.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-855 text-slate-705 dark:text-slate-350 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
                    >
                      Recommencer
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmPhoto}
                      className="px-6 py-2.5 bg-indigo-650 hover:bg-indigo-750 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-indigo-500/15"
                    >
                      ✓ Convertir en PDF
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
