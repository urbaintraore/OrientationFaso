import React, { useState, useRef } from 'react';
import { Upload, X, CheckCircle, Loader2 } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';

interface FileUploaderProps {
  onUploadComplete: (url: string) => void;
  folder?: string;
  label?: string;
  accept?: string;
}

export function FileUploader({ onUploadComplete, folder = 'general', label = 'Télécharger un fichier', accept = 'image/*' }: FileUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Basic validation
    if (file.size > 5 * 1024 * 1024) {
      setError('Le fichier est trop volumineux (max 5MB)');
      return;
    }

    setIsUploading(true);
    setError('');
    setSuccess(false);

    try {
      const storageRef = ref(storage, `${folder}/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      onUploadComplete(downloadURL);
      setSuccess(true);
    } catch (err) {
      console.error('Upload error:', err);
      setError('Erreur lors du téléchargement. Veuillez réessayer.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
        {label}
      </label>
      
      <div 
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-6 transition-all cursor-pointer flex flex-col items-center justify-center gap-2
          ${isUploading ? 'border-indigo-300 bg-indigo-50/30' : 
            success ? 'border-emerald-300 bg-emerald-50/30' : 
            error ? 'border-rose-300 bg-rose-50/30' : 
            'border-slate-200 hover:border-indigo-400 hover:bg-slate-50/50'}
        `}
      >
        <input 
          type="file" 
          ref={fileInputRef}
          className="hidden" 
          onChange={handleFileChange}
          accept={accept}
        />

        {isUploading ? (
          <>
            <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Téléchargement...</span>
          </>
        ) : success ? (
          <>
            <CheckCircle className="w-6 h-6 text-emerald-600" />
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Téléchargé avec succès</span>
          </>
        ) : (
          <>
            <Upload className="w-6 h-6 text-slate-400 group-hover:text-indigo-600" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Cliquez pour choisir</span>
          </>
        )}
      </div>

      {error && (
        <p className="text-[9px] font-bold text-rose-500 uppercase tracking-tighter ml-1">
          {error}
        </p>
      )}
    </div>
  );
}
