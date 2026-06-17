import React, { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ChevronLeft, Check, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { PostBacProfile, GradeEntry, YearGrades } from '../types';
import { FileUploader } from './FileUploader';

const gradeSchema = z.coerce.number().min(0).max(20);

const trimesterSchema = z.object({
  t1: gradeSchema,
  t2: gradeSchema,
  t3: gradeSchema,
});

const yearSchema = z.object({
  avg: trimesterSchema,
  math: trimesterSchema,
  physique: trimesterSchema,
  chimie: trimesterSchema,
  svt: trimesterSchema,
  fr: trimesterSchema,
  eng: trimesterSchema,
  hg: trimesterSchema,
  philo: trimesterSchema.optional(),
});

const examSchema = z.object({
  avg: gradeSchema,
  math: gradeSchema,
  physique: gradeSchema,
  chimie: gradeSchema,
  svt: gradeSchema,
  fr: gradeSchema,
  eng: gradeSchema,
  hg: gradeSchema,
  philo: gradeSchema,
});

const formSchema = z.object({
  name: z.string().min(2, "Nom requis"),
  age: z.coerce.number().min(15).max(30),
  school: z.string().min(2, "École requise"),
  gender: z.enum(['M', 'F']),
  bacSeries: z.string().min(1, "Série requise"),
  
  grade2nd: yearSchema,
  grade1st: yearSchema,
  gradeTerm: yearSchema,
  bac: examSchema,

  preferredFields: z.string().min(1, "Choix requis"),
  motivation: z.string().min(10, "Motivation requise"),
  hobbies: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface PostBacFormProps {
  onSubmit: (data: PostBacProfile) => void;
  isLoading: boolean;
}

const steps = [
  { id: 'identity', title: 'Identité & Série' },
  { id: 'history', title: 'Lycée (2nde-1ère)' },
  { id: 'current', title: 'Terminale & BAC' },
  { id: 'project', title: 'Projet Universitaire' },
];

const calcAvg = (grades: { t1?: number, t2?: number, t3?: number }) => {
  const t1 = grades.t1 || 0;
  const t2 = grades.t2 || 0;
  const t3 = grades.t3 || 0;
  return Number(((t1 + t2 + t3) / 3).toFixed(2));
};

export function PostBacForm({ onSubmit, isLoading }: PostBacFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const { register, handleSubmit, control, formState: { errors }, trigger } = useForm<FormData>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      gender: 'M',
      bacSeries: '',
    }
  });

  const [transcriptUrl, setTranscriptUrl] = useState<string | undefined>();

  const nextStep = async () => {
    let fieldsToValidate: any[] = [];
    
    if (currentStep === 0) fieldsToValidate = ['name', 'age', 'school', 'gender', 'bacSeries'];
    if (currentStep === 1) fieldsToValidate = ['grade2nd', 'grade1st'];
    if (currentStep === 2) fieldsToValidate = ['gradeTerm', 'bac'];

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    }
  };

  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  const processSubmit = (data: FormData) => {
    const gradesHistory: YearGrades[] = [
      {
        level: 'Seconde',
        average: calcAvg(data.grade2nd.avg),
        grades: [
          { subject: 'Mathématiques', grade: calcAvg(data.grade2nd.math) },
          { subject: 'Physique', grade: calcAvg(data.grade2nd.physique) },
          { subject: 'Chimie', grade: calcAvg(data.grade2nd.chimie) },
          { subject: 'SVT', grade: calcAvg(data.grade2nd.svt) },
          { subject: 'Français', grade: calcAvg(data.grade2nd.fr) },
          { subject: 'Anglais', grade: calcAvg(data.grade2nd.eng) },
          { subject: 'Histoire-Géo', grade: calcAvg(data.grade2nd.hg) },
          ...(data.grade2nd.philo ? [{ subject: 'Philosophie', grade: calcAvg(data.grade2nd.philo) }] : []),
        ]
      },
      {
        level: 'Première',
        average: calcAvg(data.grade1st.avg),
        grades: [
          { subject: 'Mathématiques', grade: calcAvg(data.grade1st.math) },
          { subject: 'Physique', grade: calcAvg(data.grade1st.physique) },
          { subject: 'Chimie', grade: calcAvg(data.grade1st.chimie) },
          { subject: 'SVT', grade: calcAvg(data.grade1st.svt) },
          { subject: 'Français', grade: calcAvg(data.grade1st.fr) },
          { subject: 'Anglais', grade: calcAvg(data.grade1st.eng) },
          { subject: 'Histoire-Géo', grade: calcAvg(data.grade1st.hg) },
          ...(data.grade1st.philo ? [{ subject: 'Philosophie', grade: calcAvg(data.grade1st.philo) }] : []),
        ]
      },
      {
        level: 'Terminale',
        average: calcAvg(data.gradeTerm.avg),
        grades: [
          { subject: 'Mathématiques', grade: calcAvg(data.gradeTerm.math) },
          { subject: 'Physique', grade: calcAvg(data.gradeTerm.physique) },
          { subject: 'Chimie', grade: calcAvg(data.gradeTerm.chimie) },
          { subject: 'SVT', grade: calcAvg(data.gradeTerm.svt) },
          { subject: 'Français', grade: calcAvg(data.gradeTerm.fr) },
          { subject: 'Anglais', grade: calcAvg(data.gradeTerm.eng) },
          { subject: 'Histoire-Géo', grade: calcAvg(data.gradeTerm.hg) },
          ...(data.gradeTerm.philo ? [{ subject: 'Philosophie', grade: calcAvg(data.gradeTerm.philo) }] : []),
        ]
      },
    ];

    const bacGrades: GradeEntry[] = [
      { subject: 'Mathématiques', grade: data.bac.math || 0 },
      { subject: 'Physique', grade: data.bac.physique || 0 },
      { subject: 'Chimie', grade: data.bac.chimie || 0 },
      { subject: 'SVT', grade: data.bac.svt || 0 },
      { subject: 'Français', grade: data.bac.fr || 0 },
      { subject: 'Anglais', grade: data.bac.eng || 0 },
      { subject: 'Histoire-Géo', grade: data.bac.hg || 0 },
      { subject: 'Philosophie', grade: data.bac.philo || 0 },
    ];

    const profile: PostBacProfile = {
      name: data.name,
      age: data.age,
      gender: data.gender,
      school: data.school,
      bacSeries: data.bacSeries,
      gradesHistory,
      bacGrades,
      bacAverage: data.bac.avg || 0,
      preferredFields: data.preferredFields,
      motivation: data.motivation,
      hobbies: data.hobbies || '',
      transcriptUrl: transcriptUrl,
    };

    onSubmit(profile);
  };

  const TrimesterInputGroup = ({ label, prefix, errorPrefix, hasPhilo = false }: { label: string, prefix: string, errorPrefix: any, hasPhilo?: boolean }) => {
    const [activeTab, setActiveTab] = useState<'t1' | 't2' | 't3'>('t1');
    const values = useWatch({ control, name: prefix as any });

    const calculateAverage = (trim: string) => {
      if (!values) return '-';
      let sum = 0;
      let count = 0;
      const subjects = ['math', 'physique', 'chimie', 'svt', 'fr', 'eng', 'hg'];
      if (hasPhilo) subjects.push('philo');

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
              {[
                { name: 'math', label: 'Mathématiques' },
                { name: 'physique', label: 'Physique' },
                { name: 'chimie', label: 'Chimie' },
                { name: 'svt', label: 'SVT' },
                { name: 'fr', label: 'Français' },
                { name: 'eng', label: 'Anglais' },
                { name: 'hg', label: 'Histoire-Géo' }
              ].map((subj) => (
                  <div key={subj.name}>
                      <label className="block text-xs font-medium text-slate-500 mb-1">{subj.label}</label>
                      <input
                          type="number"
                          step="0.01"
                          {...register(`${prefix}.${subj.name}.${activeTab}` as any, { valueAsNumber: true })}
                          className="w-full rounded-lg border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                          placeholder="Note"
                      />
                  </div>
              ))}
              {hasPhilo && (
                  <div key="Philo">
                      <label className="block text-xs font-medium text-slate-500 mb-1">Philosophie</label>
                      <input
                          type="number"
                          step="0.01"
                          {...register(`${prefix}.philo.${activeTab}` as any, { valueAsNumber: true })}
                          className="w-full rounded-lg border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                          placeholder="Note"
                      />
                  </div>
              )}
          </div>
        </div>
      </div>
    );
  };

  const ExamInputGroup = ({ label, prefix, errorPrefix, hasPhilo = false }: { label: string, prefix: string, errorPrefix: any, hasPhilo?: boolean }) => (
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
        {[
          { name: 'math', label: 'Mathématiques' },
          { name: 'physique', label: 'Physique' },
          { name: 'chimie', label: 'Chimie' },
          { name: 'svt', label: 'SVT' },
          { name: 'fr', label: 'Français' },
          { name: 'eng', label: 'Anglais' },
          { name: 'hg', label: 'Histoire-Géo' }
        ].map((subj) => (
          <div key={subj.name}>
            <label className="mb-1 block text-xs font-medium text-slate-500">{subj.label}</label>
            <input
              type="number"
              step="0.01"
              {...register(`${prefix}.${subj.name}` as any, { valueAsNumber: true })}
              className="w-full rounded-lg border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
        ))}
        {hasPhilo && (
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Philosophie</label>
            <input
              type="number"
              step="0.01"
              {...register(`${prefix}.philo` as any, { valueAsNumber: true })}
              className="w-full rounded-lg border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      {/* Visual Stepper Progress Bar */}
      <div className="bg-slate-50/80 px-6 py-8 border-b border-slate-100">
        <div className="relative flex justify-between max-w-lg mx-auto">
          {/* Background trace line */}
          <div className="absolute top-4 left-0 right-0 h-1 bg-slate-200 -translate-y-1/2 z-0 rounded-full" />
          
          {/* Active filled connection line */}
          <motion.div 
            className="absolute top-4 left-0 h-1 bg-indigo-600 -translate-y-1/2 z-0 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          />

          {steps.map((step, idx) => {
            const isCompleted = idx < currentStep;
            const isActive = idx === currentStep;
            
            return (
              <div key={step.id} className="relative z-10 flex flex-col items-center">
                {/* Stepper Circle */}
                <motion.div
                  initial={false}
                  animate={{
                    scale: isActive ? 1.15 : 1.0,
                    backgroundColor: isCompleted ? '#4f46e5' : isActive ? '#ffffff' : '#f1f5f9',
                    borderColor: isCompleted ? '#4f46e5' : isActive ? '#4f46e5' : '#cbd5e1',
                  }}
                  className={clsx(
                    "w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-sm transition-all shadow-sm",
                    isCompleted ? "text-white" : isActive ? "text-indigo-600 bg-white" : "text-slate-400"
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4 text-white font-bold" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </motion.div>
                
                {/* Stepper Title */}
                <span className={clsx(
                  "mt-2 text-[11px] font-black tracking-wide uppercase transition-colors duration-300 hidden sm:block",
                  isActive ? "text-indigo-600" : isCompleted ? "text-slate-800" : "text-slate-400"
                )}>
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>

        {/* Dynamic status helper subtitle */}
        <div className="text-center mt-5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-xs font-bold text-indigo-700 border border-indigo-100">
            Étape {currentStep + 1} sur {steps.length} • {Math.round(((currentStep + 1) / steps.length) * 100)}% Complété ({steps[currentStep].title})
          </span>
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
                    {...register('age')}
                    className="w-full rounded-xl border-slate-200 px-4 py-3 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                  {errors.age && <p className="mt-1 text-sm text-red-500">{errors.age.message}</p>}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Lycée d'origine</label>
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
                  <label className="mb-2 block text-sm font-medium text-slate-700">Série du BAC</label>
                  <input
                    {...register('bacSeries')}
                    list="bac-series-list"
                    className="w-full rounded-xl border-slate-200 px-4 py-3 focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Ex: D, C, A, F1..."
                  />
                  <datalist id="bac-series-list">
                    <option value="A">Série A (Lettres)</option>
                    <option value="C">Série C (Maths & Physique)</option>
                    <option value="D">Série D (Sciences de la nature)</option>
                    <option value="E">Série E (Mathématiques et Technique)</option>
                    <option value="F1">Série F1 (Construction Mécanique)</option>
                    <option value="F2">Série F2 (Électronique)</option>
                    <option value="F3">Série F3 (Électrotechnique)</option>
                    <option value="F4">Série F4 (Génie Civil)</option>
                    <option value="G2">Série G2 (Techniques Quantitatives de Gestion)</option>
                    <option value="G3">Série G3 (Techniques Commerciales)</option>
                  </datalist>
                  {errors.bacSeries && <p className="mt-1 text-sm text-red-500">{errors.bacSeries.message}</p>}
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
              <h3 className="text-xl font-bold text-slate-900">Ton parcours Lycée</h3>
              <p className="text-sm text-slate-500">Rentre tes moyennes trimestrielles pour chaque classe.</p>
              
              <TrimesterInputGroup label="Classe de Seconde" prefix="grade2nd" errorPrefix={errors} />
              <TrimesterInputGroup label="Classe de Première" prefix="grade1st" errorPrefix={errors} />
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
              <h3 className="text-xl font-bold text-slate-900">Terminale & BAC</h3>
              <p className="text-sm text-slate-500">L'année décisive.</p>
              
              <TrimesterInputGroup label="Classe de Terminale" prefix="gradeTerm" errorPrefix={errors} hasPhilo={true} />
              <div className="mt-8 border-t border-slate-100 pt-8">
                <FileUploader 
                  label="Ou téléchargez votre relevé de notes BAC (Optionnel)"
                  folder="transcripts"
                  accept="image/*,application/pdf"
                  onUploadComplete={setTranscriptUrl}
                />
                {transcriptUrl && (
                  <p className="text-[10px] text-emerald-600 font-bold mt-1 uppercase">Relevé chargé avec succès</p>
                )}
              </div>
              <ExamInputGroup label="Notes du BAC" prefix="bac" errorPrefix={errors} hasPhilo={true} />
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
              <h3 className="text-xl font-bold text-slate-900">Ton Projet Universitaire</h3>
              
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Quels domaines t'intéressent ?</label>
                <textarea
                  {...register('preferredFields')}
                  rows={2}
                  className="w-full rounded-xl border-slate-200 px-4 py-3 focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Ex: Médecine, Informatique, Droit, Économie..."
                />
                {errors.preferredFields && <p className="mt-1 text-sm text-red-500">{errors.preferredFields.message}</p>}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Motivation & Ambitions</label>
                <textarea
                  {...register('motivation')}
                  rows={4}
                  className="w-full rounded-xl border-slate-200 px-4 py-3 focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Je veux travailler dans la santé publique pour aider..."
                />
                {errors.motivation && <p className="mt-1 text-sm text-red-500">{errors.motivation.message}</p>}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Tes centres d'intérêt (Hobbies)</label>
                <textarea
                  {...register('hobbies')}
                  rows={2}
                  className="w-full rounded-xl border-slate-200 px-4 py-3 focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Engagement associatif, Sport, Lecture..."
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
