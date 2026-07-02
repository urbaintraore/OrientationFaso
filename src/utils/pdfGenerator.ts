import jsPDF from 'jspdf';
import { CandidacyDossier } from '../types';

export const generateCandidacyPDF = (dossier: CandidacyDossier) => {
  const doc = new jsPDF();

  // Draw colorful header banner
  doc.setFillColor(30, 41, 59); // Slate-800
  doc.rect(0, 0, 210, 42, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("ORIENTATION.BF", 15, 18);
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Ministère de l'Enseignement Supérieur, de la Recherche Scientifique", 15, 26);
  doc.text("et de l'Innovation du Burkina Faso - Plateforme Officielle d'Orientation", 15, 31);
  
  doc.setFontSize(9);
  doc.text(`Rapport édité le : ${new Date().toLocaleDateString('fr-FR')}`, 155, 18);
  doc.text("Document Officiel", 155, 24);

  // Section 1: Candidate Profile
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("1. PROFIL DE L'ÉLÈVE / ÉTUDIANT", 15, 56);
  
  doc.setLineWidth(0.4);
  doc.setDrawColor(226, 232, 240); // Slate-200
  doc.line(15, 59, 195, 59);

  let y = 67;
  doc.setFontSize(10);
  
  const drawRow = (label: string, value: string) => {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(71, 85, 105); // Slate-600
    doc.text(label, 15, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(15, 23, 42); // Slate-900
    doc.text(value, 60, y);
    y += 8;
  };

  drawRow("Nom de l'élève :", dossier.studentName || 'Non communiqué');
  drawRow("Courriel d'accès :", dossier.studentEmail || 'Non communiqué');
  drawRow("Téléphone de contact :", dossier.studentPhone || 'Non communiqué');
  drawRow("Série de Bac :", dossier.studentBacSeries || 'Non communiqué');
  drawRow("Dossier ID unique :", dossier.id);

  // Section 2: Solicited University program details
  y += 4;
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("2. VOEU DE FORMATION MULTIPLE", 15, y);
  doc.line(15, y + 3, 195, y + 3);
  
  y += 11;
  drawRow("Établissement académique :", dossier.institutionName || 'Non communiqué');
  drawRow("Filière sollicitée :", dossier.programName || 'Non communiqué');
  drawRow("Candidature ajoutée le :", new Date(dossier.createdAt).toLocaleDateString('fr-FR'));

  // Section 3: Status and decision
  y += 4;
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("3. STATUT DU DOSSIER ET HISTORIQUE", 15, y);
  doc.line(15, y + 3, 195, y + 3);

  y += 11;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text("Statut du traitement :", 15, y);

  const stat = dossier.status;
  doc.setFont("helvetica", "bold");
  if (stat === 'Accepté') {
    doc.setFillColor(209, 250, 229); // Green background
    doc.rect(58, y - 5, 27, 7, 'F');
    doc.setTextColor(5, 150, 105);
  } else if (stat === 'Refusé') {
    doc.setFillColor(254, 226, 226); // Red background
    doc.rect(58, y - 5, 27, 7, 'F');
    doc.setTextColor(220, 38, 38);
  } else if (stat === 'En cours d\'examen') {
    doc.setFillColor(254, 243, 199); // Amber background
    doc.rect(58, y - 5, 38, 7, 'F');
    doc.setTextColor(217, 119, 6);
  } else {
    doc.setFillColor(219, 234, 254); // Blue background
    doc.rect(58, y - 5, 27, 7, 'F');
    doc.setTextColor(37, 99, 235);
  }
  doc.text(` ${stat} `, 60, y);
  y += 10;

  // Feedback note block
  doc.setTextColor(71, 85, 105);
  doc.setFont("helvetica", "bold");
  doc.text("Retours & Conseils d'Orientation :", 15, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  
  const textBody = dossier.feedback || "Aucune observation rédigée à ce jour.";
  const splitText = doc.splitTextToSize(textBody, 175);
  doc.text(splitText, 15, y);
  y += (splitText.length * 5) + 8;

  // Section 4: Document Check-list
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("4. VÉRIFICATION DES PIÈCES JOINTES", 15, y);
  doc.line(15, y + 3, 195, y + 3);

  y += 11;
  doc.setFontSize(10);
  const docsList = Object.keys(dossier.documents || {});
  if (docsList.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setTextColor(148, 163, 184);
    doc.text("Aucun document n'a été fourni par le candidat à ce jour.", 15, y);
  } else {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(71, 85, 105);
    doc.text("Type de document", 15, y);
    doc.text("Statut", 110, y);
    doc.text("Nom de la pièce jointe", 140, y);
    y += 5;
    
    doc.setLineWidth(0.2);
    doc.setDrawColor(203, 213, 225);
    doc.line(15, y, 195, y);
    y += 7;

    doc.setFont("helvetica", "normal");
    Object.entries(dossier.documents || {}).forEach(([key, value]) => {
      if (!value) return;
      const label = key === 'bulletins' ? 'Bulletins de notes' 
                  : key === 'attestationBac' ? 'Relevé de notes BAC' 
                  : key === 'cv' ? 'Curriculum Vitae' 
                  : key === 'lettreMotivation' ? 'Lettre de Motivation' 
                  : key === 'acteNaissance' ? "Copie acte de naissance" 
                  : key;
      const name = dossier.documentNames?.[key as any] || `${key}.txt`;

      doc.setTextColor(15, 23, 42);
      doc.text(label, 15, y);
      
      doc.setTextColor(16, 185, 129); // Green check
      doc.text("Fourni", 110, y);
      
      doc.setTextColor(100, 116, 139);
      doc.text(name.substring(0, 24) + (name.length > 24 ? "..." : ""), 140, y);
      y += 7;
    });
  }

  // Draw signature fields or official footer
  y = 265;
  doc.setLineWidth(0.3);
  doc.setDrawColor(226, 232, 240);
  doc.line(15, y, 195, y);
  y += 7;

  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(148, 163, 184);
  doc.text("Ce rapport est numériquement signé et fait foi pour les procédures d'admission.", 15, y);
  doc.text("Fait à Ouagadougou, Burkina Faso.", 15, y + 4);
  
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("orientation.bf © 2026", 160, y);

  doc.save(`OrientationBF_Dossier_${dossier.studentName?.replace(/\s+/g, '_') || 'Candidat'}.pdf`);
};
