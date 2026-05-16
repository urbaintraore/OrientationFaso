import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Users, GraduationCap, Award, BrainCircuit, Loader2, Target, CheckCircle, FileText, PieChart as PieChartIcon, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';
import { Institution, UniversityAnalysisResult, AnalysisResult } from '../../types';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

export function SchoolStudentsPanel({ institution }: { institution: Institution }) {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'users'), where('profileType', '==', 'student'));
        const snap = await getDocs(q);
        const allStudents = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

        const schoolName = (institution.name || '').toLowerCase();
        const filtered = allStudents.filter(s => {
          const sSchool = (s.school || '').toLowerCase();
          return sSchool.length > 3 && (sSchool.includes(schoolName) || schoolName.includes(sSchool) || sSchool === schoolName);
        });
        
        setStudents(filtered);
      } catch (e) {
        console.error("Error fetching students:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [institution.name]);

  const stats = useMemo(() => {
    const tested = students.filter(s => s.analysisResult);
    
    // Distribution des séries (BAC)
    const seriesCount: Record<string, number> = {};
    students.forEach(s => {
      if (s.bac?.series) {
        seriesCount[s.bac.series] = (seriesCount[s.bac.series] || 0) + 1;
      }
    });
    
    // Distribution des orientations recommandées
    const majorsCount: Record<string, number> = {};
    tested.forEach(s => {
      if (s.analysisResult?.recommendedMajors?.length > 0) {
        const topMajor = s.analysisResult.recommendedMajors[0].name;
        // Group similar majors for cleaner chart
        const abstractMajor = topMajor.split(' ')[0]; // Basic grouping
        majorsCount[abstractMajor] = (majorsCount[abstractMajor] || 0) + 1;
      }
    });

    const seriesData = Object.entries(seriesCount).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
    const majorsData = Object.entries(majorsCount).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value).slice(0, 5);

    return {
      total: students.length,
      tested: tested.length,
      premium: students.filter(s => s.hasPaid).length,
      seriesData,
      majorsData
    };
  }, [students]);

  const COLORS = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Élèves Associés</div>
            <div className="text-2xl font-black text-slate-900">{stats.total}</div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center flex-shrink-0">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-500 uppercase tracking-wider">Tests Effectués</div>
            <div className="text-2xl font-black text-slate-900">{stats.tested}</div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-500 uppercase tracking-wider">Abonnés Premium</div>
            <div className="text-2xl font-black text-slate-900">{stats.premium}</div>
          </div>
        </div>
      </div>

      {/* Analytics Charts */}
      {students.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
             <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-6">
               <PieChartIcon className="w-4 h-4 text-indigo-500" />
               Répartition par Séries / Niveaux
             </h3>
             {stats.seriesData.length > 0 ? (
               <div className="h-64">
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                     <Pie
                       data={stats.seriesData}
                       cx="50%"
                       cy="50%"
                       innerRadius={60}
                       outerRadius={80}
                       paddingAngle={5}
                       dataKey="value"
                     >
                       {stats.seriesData.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                       ))}
                     </Pie>
                     <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ fontWeight: 'bold' }}
                     />
                   </PieChart>
                 </ResponsiveContainer>
                 <div className="flex flex-wrap justify-center gap-3 mt-4">
                   {stats.seriesData.map((entry, i) => (
                     <div key={entry.name} className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                       <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                       Série {entry.name} ({entry.value})
                     </div>
                   ))}
                 </div>
               </div>
             ) : (
                <div className="h-64 flex flex-col items-center justify-center text-slate-400">
                  <div className="text-xs font-bold uppercase mb-2">Données Insuffisantes</div>
                  <div className="text-[10px]">Aucune série renseignée.</div>
                </div>
             )}
           </div>

           <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
             <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-6">
               <TrendingUp className="w-4 h-4 text-emerald-500" />
               Top Domaines Recommandés (IA)
             </h3>
             {stats.majorsData.length > 0 ? (
               <div className="h-64">
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={stats.majorsData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                     <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                     <XAxis type="number" hide />
                     <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }} width={100} />
                     <Tooltip 
                        cursor={{ fill: '#f8fafc' }}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                     />
                     <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]}>
                       {stats.majorsData.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={COLORS[(index + 1) % COLORS.length]} />
                       ))}
                     </Bar>
                   </BarChart>
                 </ResponsiveContainer>
               </div>
             ) : (
                <div className="h-64 flex flex-col items-center justify-center text-slate-400">
                  <div className="text-xs font-bold uppercase mb-2">Données Insuffisantes</div>
                  <div className="text-[10px]">Très peu de tests effectués.</div>
                </div>
             )}
           </div>
        </div>
      )}

      {/* Student List */}
      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
            <GraduationCap className="w-6 h-6 text-indigo-600" />
            Liste des Élèves Associés
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 uppercase tracking-wider text-[10px]">Élève</th>
                <th className="px-6 py-4 uppercase tracking-wider text-[10px]">Niveau / Classe</th>
                <th className="px-6 py-4 uppercase tracking-wider text-[10px]">Série (BAC)</th>
                <th className="px-6 py-4 uppercase tracking-wider text-[10px]">Statut</th>
                <th className="px-6 py-4 uppercase tracking-wider text-[10px]">Orientation (Test)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                    Recherche des élèves rattachés à votre établissement...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-medium bg-slate-50/50">
                    Aucun élève trouvé pour "{institution.name}".<br/>
                    <span className="text-xs font-normal">Assurez-vous que vos élèves renseignent correctement le nom de votre établissement à l'inscription.</span>
                  </td>
                </tr>
              ) : (
                students.map((student, idx) => (
                  <tr key={student.id || idx} className="hover:bg-indigo-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{student.displayName || student.fullName || 'Inconnu'}</div>
                      <div className="text-xs text-slate-500">{new Date(student.createdAt || new Date()).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block bg-slate-100 px-2 py-1 rounded text-slate-700 font-bold text-[10px]">
                        {student.level || 'Non spécifié'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                       <span className="font-bold text-indigo-700">
                         {student.bac?.series || '-'}
                       </span>
                    </td>
                    <td className="px-6 py-4 flex gap-1">
                      {student.hasPaid ? (
                         <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 font-bold text-[10px] px-2 py-1 rounded-full whitespace-nowrap">
                           <Award className="w-3 h-3" /> Premium
                         </span>
                      ) : (
                         <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 font-bold text-[10px] px-2 py-1 rounded-full whitespace-nowrap">
                           Gratuit
                         </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {student.analysisResult ? (
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-xs">
                            <CheckCircle className="w-3 h-3" /> Test Effectué
                          </span>
                          {/* On montre la première filière ou série recommandée si possible */}
                          {student.analysisResult.recommendedMajors && student.analysisResult.recommendedMajors.length > 0 && (
                            <span className="text-[10px] text-slate-500 truncate max-w-[150px]" title={student.analysisResult.recommendedMajors[0].name}>
                              Top: {student.analysisResult.recommendedMajors[0].name}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs italic">Non effectué</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
