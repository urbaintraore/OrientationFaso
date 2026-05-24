import React, { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ChevronLeft, Check, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { StudentProfile, GradeEntry, YearGrades } from '../types';
import { FileUploader } from './FileUploader';

const gradeSchema = z.number().min(0).max(20);

const trimesterSchema = z.object({
  t1: gradeSchema,
  t2: gradeSchema,
  t3: gradeSchema,
});

const yearSchema = z.object({
  avg: trimesterSchema,
  math: trimesterSchema,
  pc: trimesterSchema,
  svt: trimesterSchema,
  fr: trimesterSchema,
  eng: trimesterSchema,
  hg: trimesterSchema,
});

const examSchema = z.object({
  avg: gradeSchema,
  math: gradeSchema,
  pc: gradeSchema,
  svt: gradeSchema,
  fr: gradeSchema,
  eng: gradeSchema,
  hg: gradeSchema,
});

const formSchema = z.object({
  name: z.string().min(2, "Nom requis"),
  age: z.number().min(10).max(25),
  school: z.string().min(2, "École requise"),
  gender: z.enum(['M', 'F']),
  
  grade6: yearSchema,
  grade5: yearSchema,
  grade4: yearSchema,
  grade3: yearSchema,
  bepc: examSchema,

  preferredSeries: z.string().min(1, "Choix requis"),
  motivation: z.string().min(10, "Motivation requise"),
  hobbies: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface AssessmentFormProps {
  onSubmit: (data: StudentProfile) => void;
  isLoading: boolean;
}

const steps = [
  { id: 'identity', title: 'Identité' },
  { id: 'history', title: 'Parcours (6ème-4ème)' },
  { id: 'current', title: 'Niveau Actuel (3ème & BEPC)' },
  { id: 'project', title: 'Projet & Motivation' },
];

const calcAvg = (grades: { t1: number, t2: number, t3: number }) => {
  return Number(((grades.t1 + grades.t2 + grades.t3) / 3).toFixed(2));
};

export function AssessmentForm({ onSubmit, isLoading }: AssessmentFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const { register, handleSubmit, control, formState: { errors }, trigger } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      gender: 'M',
    }
  });

  const [transcriptUrl, setTranscriptUrl] = useState<string | undefined>();

  const nextStep = async () => {
    let fieldsToValidate: any[] = [];
    
    if (currentStep === 0) fieldsToValidate = ['name', 'age', 'school', 'gender'];
    if (currentStep === 1) fieldsToValidate = ['grade6', 'grade5', 'grade4'];
    if (currentStep === 2) fieldsToValidate = ['grade3', 'bepc'];

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    }
  };

  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  const processSubmit = (data: FormData) => {
    const gradesHistory: YearGrades[] = [
      {
        level: '6ème',
        average: calcAvg(data.grade6.avg),
        grades: [
          { subject: 'Mathématiques', grade: calcAvg(data.grade6.math) },
          { subject: 'Physique-Chimie', grade: calcAvg(data.grade6.pc) },
          { subject: 'SVT', grade: calcAvg(data.grade6.svt) },
          { subject: 'Français', grade: calcAvg(data.grade6.fr) },
          { subject: 'Anglais', grade: calcAvg(data.grade6.eng) },
          { subject: 'Histoire-Géo', grade: calcAvg(data.grade6.hg) },
        ]
      },
      {
        level: '5ème',
        average: calcAvg(data.grade5.avg),
        grades: [
          { subject: 'Mathématiques', grade: calcAvg(data.grade5.math) },
          { subject: 'Physique-Chimie', grade: calcAvg(data.grade5.pc) },
          { subject: 'SVT', grade: calcAvg(data.grade5.svt) },
          { subject: 'Français', grade: calcAvg(data.grade5.fr) },
          { subject: 'Anglais', grade: calcAvg(data.grade5.eng) },
          { subject: 'Histoire-Géo', grade: calcAvg(data.grade5.hg) },
        ]
      },
      {
        level: '4ème',
        average: calcAvg(data.grade4.avg),
        grades: [
          { subject: 'Mathématiques', grade: calcAvg(data.grade4.math) },
          { subject: 'Physique-Chimie', grade: calcAvg(data.grade4.pc) },
          { subject: 'SVT', grade: calcAvg(data.grade4.svt) },
          { subject: 'Français', grade: calcAvg(data.grade4.fr) },
          { subject: 'Anglais', grade: calcAvg(data.grade4.eng) },
          { subject: 'Histoire-Géo', grade: calcAvg(data.grade4.hg) },
        ]
      },
      {
        level: '3ème',
        average: calcAvg(data.grade3.avg),
        grades: [
          { subject: 'Mathématiques', grade: calcAvg(data.grade3.math) },
          { subject: 'Physique-Chimie', grade: calcAvg(data.grade3.pc) },
          { subject: 'SVT', grade: calcAvg(data.grade3.svt) },
          { subject: 'Français', grade: calcAvg(data.grade3.fr) },
          { subject: 'Anglais', grade: calcAvg(data.grade3.eng) },
          { subject: 'Histoire-Géo', grade: calcAvg(data.grade3.hg) },
        ]
      },
    ];

    const bepcGrades: GradeEntry[] = [
      { subject: 'Mathématiques', grade: data.bepc.math },
      { subject: 'Physique-Chimie', grade: data.bepc.pc },
      { subject: 'SVT', grade: data.bepc.svt },
      { subject: 'Français', grade: data.bepc.fr },
      { subject: 'Anglais', grade: data.bepc.eng },
      { subject: 'Histoire-Géo', grade: data.bepc.hg },
    ];

    const profile: StudentProfile = {
      name: data.name,
      age: data.age,
      gender: data.gender,
      school: data.school,
      gradesHistory,
      bepcGrades,
      bepcAverage: data.bepc.avg,
      preferredSeries: data.preferredSeries,
      motivation: data.motivation,
      hobbies: data.hobbies || '',
      transcriptUrl: transcriptUrl,
    };

    onSubmit(profile);
  };

  const TrimesterInputGroup = ({ label, prefix, errorPrefix }: { label: string, prefix: string, errorPrefix: any }) => {
    const [activeTab, setActiveTab] = useState<'t1' | 't2' | 't3'>('t1');
    const values = useWatch({ control, name: prefix as any });

    const calculateAverage = (trim: string) => {
      if (!values) return '-';
      let sum = 0;
      let count = 0;
      const subjects = ['math', 'pc', 'svt', 'fr', 'eng', 'hg'];
      subjects.forEach(sub => {
        const val = values[sub]?.[trim];
        if (val !== undefined && val !== null && !isNaN(val) && val !== '') {
          sum += Number(val);
          count++;
        }
      });
      return count > 0 ? (sum / count).toFixed(2) : '-';
    };

    const currentAvg = calculateAverage(activeTab);

    return (
      <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-semibold text-slate-700">{label}</h4>
          <div className="flex bg-slate-200 rounded-lg p-1">
            {['t1', 't2', 't3'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setActiveTab(t as any)}
                className={clsx(
                  "px-3 py-1 text-xs font-medium rounded-md transition-all",
                  activeTab === t ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                {t === 't1' ? 'Trim 1' : t === 't2' ? 'Trim 2' : 'Trim 3'}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-indigo-50/50 rounded-lg p-3 flex justify-between items-center border border-indigo-100">
              <span className="text-sm font-medium text-indigo-900">Moyenne Générale (Bulletin)</span>
              <div className="flex items-center gap-2">
                  <span className="text-xs text-indigo-400 hidden sm:inline">Moy. calculée: {currentAvg}</span>
                  <input
                      type="number"
                      step="0.01"
                      {...register(`${prefix}.avg.${activeTab}` as any, { valueAsNumber: true })}
                      className="w-20 rounded-md border-indigo-200 px-2 py-1 text-sm text-center font-bold text-indigo-700 focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="Note"
                  />
              </div>
          </div>
          {errorPrefix?.[prefix]?.avg && <div className="text-xs text-red-500 text-right">Moyenne requise</div>}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {['Math', 'PC', 'SVT', 'Fr', 'Eng', 'HG'].map((subj) => (
                  <div key={subj}>
                      <label className="block text-xs font-medium text-slate-500 mb-1">{subj}</label>
                      <input
                          type="number"
                          step="0.01"
                          {...register(`${prefix}.${subj.toLowerCase()}.${activeTab}` as any, { valueAsNumber: true })}
                          className="w-full rounded-lg border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                          placeholder="Note"
                      />
                  </div>
              ))}
          </div>
        </div>
      </div>
    );
  };

  const ExamInputGroup = ({ label, prefix, errorPrefix }: { label: string, prefix: string, errorPrefix: any }) => (
    <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
      <h4 className="mb-3 font-semibold text-slate-700">{label}</h4>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Moyenne Générale</label>
          <input
            type="number"
            step="0.01"
            {...register(`${prefix}.avg` as any, { valueAsNumber: true })}
            className="w-full rounded-lg border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
          {errorPrefix?.[prefix]?.avg && <span className="text-xs text-red-500">Requis</span>}
        </div>
        {['Math', 'PC', 'SVT', 'Fr', 'Eng', 'HG'].map((subj) => (
          <div key={subj}>
            <label className="mb-1 block text-xs font-medium text-slate-500">{subj}</label>
            <input
              type="number"
              step="0.01"
              {...register(`${prefix}.${subj.toLowerCase()}` as any, { valueAsNumber: true })}
              className="w-full rounded-lg border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      {/* Progress Bar */}
      <div className="bg-slate-50 px-6 py-4 border-b border-slate-100">
        <div className="flex justify-between mb-2">
          {steps.map((step, idx) => (
            <div key={step.id} className={clsx(
              "text-xs font-medium transition-colors duration-300",
              idx <= currentStep ? "text-indigo-600" : "text-slate-400"
            )}>
              {step.title}
            </div>
          ))}
        </div>
        <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-indigo-600"
            initial={{ width: 0 }}
            animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit(processSubmit)} className="p-6 sm:p-8">
        <AnimatePresence mode="wait">
          {currentStep === 0 && (
            <motion.div
              key="step0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h3 className="text-xl font-bold text-slate-900">Qui es-tu ?</h3>
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Nom complet</label>
                  <input
                    {...register('name')}
                    className="w-full rounded-xl border-slate-200 px-4 py-3 focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Ex: Ouédraogo Jean"
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Âge</label>
                  <input
                    type="number"
                    {...register('age', { valueAsNumber: true })}
                    className="w-full rounded-xl border-slate-200 px-4 py-3 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                  {errors.age && <p className="mt-1 text-sm text-red-500">{errors.age.message}</p>}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Établissement</label>
                  <input
                    {...register('school')}
                    className="w-full rounded-xl border-slate-200 px-4 py-3 focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Ex: Lycée Philippe Zinda Kaboré"
                  />
                  {errors.school && <p className="mt-1 text-sm text-red-500">{errors.school.message}</p>}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Genre</label>
                  <select
                    {...register('gender')}
                    className="w-full rounded-xl border-slate-200 px-4 py-3 focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="M">Masculin</option>
                    <option value="F">Féminin</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <FileUploader
                    label="Téléchargez votre relevé de notes BEPC (Optionnel)"
                    folder="transcripts"
                    accept="image/*,application/pdf"
                    onUploadComplete={setTranscriptUrl}
                  />
                  {transcriptUrl && (
                    <p className="text-[10px] text-emerald-600 font-bold mt-1 uppercase">Relevé chargé avec succès</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h3 className="text-xl font-bold text-slate-900">Ton parcours (6ème - 4ème)</h3>
              <p className="text-sm text-slate-500">Rentre tes moyennes trimestrielles pour chaque classe.</p>
              
              <TrimesterInputGroup label="Classe de 6ème" prefix="grade6" errorPrefix={errors} />
              <TrimesterInputGroup label="Classe de 5ème" prefix="grade5" errorPrefix={errors} />
              <TrimesterInputGroup label="Classe de 4ème" prefix="grade4" errorPrefix={errors} />
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h3 className="text-xl font-bold text-slate-900">Niveau Actuel (3ème & BEPC)</h3>
              <p className="text-sm text-slate-500">Tes résultats les plus récents sont les plus importants.</p>
              
              <TrimesterInputGroup label="Classe de 3ème" prefix="grade3" errorPrefix={errors} />
              <ExamInputGroup label="Résultats BEPC (Estimés ou Réels)" prefix="bepc" errorPrefix={errors} />
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h3 className="text-xl font-bold text-slate-900">Ton Projet</h3>
              
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Quelle série t'intéresse le plus ?</label>
                <select
                  {...register('preferredSeries')}
                  className="w-full rounded-xl border-slate-200 px-4 py-3 focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="">-- Choisir une série --</option>
                  <optgroup label="Enseignement Général">
                    <option value="A">Série A (Lettres)</option>
                    <option value="D">Série D (Sciences de la nature)</option>
                    <option value="C">Série C (Maths & Physique)</option>
                  </optgroup>
                  <optgroup label="Enseignement Technique">
                    <option value="E">Série E (Mathématiques et Technique)</option>
                    <option value="F1">Série F1 (Construction Mécanique)</option>
                    <option value="F2">Série F2 (Électronique)</option>
                    <option value="F3">Série F3 (Électrotechnique)</option>
                    <option value="F4">Série F4 (Génie Civil)</option>
                    <option value="G2">Série G2 (Techniques Quantitatives de Gestion)</option>
                    <option value="G3">Série G3 (Techniques Commerciales)</option>
                  </optgroup>
                </select>
                {errors.preferredSeries && <p className="mt-1 text-sm text-red-500">{errors.preferredSeries.message}</p>}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Pourquoi ce choix ? (Motivation)</label>
                <textarea
                  {...register('motivation')}
                  rows={4}
                  className="w-full rounded-xl border-slate-200 px-4 py-3 focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="J'aime les mathématiques et je veux devenir ingénieur..."
                />
                {errors.motivation && <p className="mt-1 text-sm text-red-500">{errors.motivation.message}</p>}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Tes centres d'intérêt (Hobbies)</label>
                <textarea
                  {...register('hobbies')}
                  rows={2}
                  className="w-full rounded-xl border-slate-200 px-4 py-3 focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Football, Lecture, Informatique, Dessin..."
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-8 flex justify-between pt-6 border-t border-slate-100">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 0 || isLoading}
            className={clsx(
              "flex items-center gap-2 rounded-lg px-6 py-3 font-medium transition-colors",
              currentStep === 0 ? "invisible" : "text-slate-600 hover:bg-slate-100"
            )}
          >
            <ChevronLeft className="h-4 w-4" />
            Précédent
          </button>

          {currentStep < steps.length - 1 ? (
            <button
              type="button"
              onClick={nextStep}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 font-medium text-white hover:bg-indigo-700 transition-colors"
            >
              Suivant
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-8 py-3 font-medium text-white hover:bg-indigo-700 transition-colors disabled:opacity-70"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyse en cours...
                </>
              ) : (
                <>
                  Terminer et Analyser
                  <Check className="h-4 w-4" />
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
