import React from 'react';
import { GraduationCap, ArrowRight, Building2 } from 'lucide-react';

export function Partners() {
  return (
    <section className="py-16 bg-white border-y border-slate-100">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h3 className="text-2xl font-bold text-slate-900 mb-2">Nos Universités et Écoles Partenaires</h3>
          <p className="text-slate-600">Ils nous font confiance pour orienter les meilleurs talents.</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center mb-16">
          <div className="flex flex-col items-center justify-center p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-all border border-slate-100 h-40 group cursor-pointer">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 group-hover:bg-indigo-50 transition-colors">
              <GraduationCap className="w-8 h-8 text-slate-700 group-hover:text-indigo-600 transition-colors" />
            </div>
            <span className="font-bold text-slate-800 text-center text-sm">Université Aube Nouvelle</span>
          </div>
          
          <div className="flex flex-col items-center justify-center p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-all border border-slate-100 h-40 group cursor-pointer">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4 group-hover:bg-green-100 transition-colors">
              <Building2 className="w-8 h-8 text-green-700 transition-colors" />
            </div>
            <span className="font-bold text-green-700 text-center text-sm">USTA</span>
          </div>
          
          <div className="flex flex-col items-center justify-center p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-all border border-slate-100 h-40 group cursor-pointer">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
              <GraduationCap className="w-8 h-8 text-blue-800 transition-colors" />
            </div>
            <span className="font-bold text-blue-800 text-center text-sm">UCAO</span>
          </div>
          
          <div className="flex flex-col items-center justify-center p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-all border border-slate-100 h-40 group cursor-pointer">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4 group-hover:bg-red-100 transition-colors">
              <Building2 className="w-8 h-8 text-red-700 transition-colors" />
            </div>
            <span className="font-bold text-red-700 text-center text-sm">ISPP</span>
          </div>
        </div>
        
        <div className="text-center bg-slate-50 rounded-2xl p-8 max-w-3xl mx-auto border border-slate-100">
          <h4 className="text-lg font-semibold text-slate-900 mb-2">Vous représentez un établissement ?</h4>
          <p className="text-slate-600 mb-6">Devenez partenaire et augmentez votre visibilité auprès des futurs étudiants.</p>
          <a 
            href="mailto:partenariat@orientationbf.com"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm mx-auto"
          >
            Nous contacter <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
