import React, { useState, useEffect } from 'react';
import { Link as LinkIcon, ExternalLink, Loader2 } from 'lucide-react';
import { usefulLinkService, UsefulLink } from '../services/usefulLinkService';

export const UsefulLinksView = () => {
  const [links, setLinks] = useState<UsefulLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLinks = async () => {
      setLoading(true);
      try {
        const data = await usefulLinkService.getAllLinks();
        setLinks(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchLinks();
  }, []);

  if (loading) return <div className="flex justify-center p-12 text-slate-400"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  return (
    <div className="bg-white rounded-3xl overflow-hidden mt-6 p-6">
      <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <LinkIcon className="w-6 h-6 text-indigo-500" />
        Liens Utiles
      </h2>
      {links.length === 0 ? (
        <p className="text-slate-500 italic">Aucun lien utile pour le moment.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {links.map((link) => (
            <div key={link.id} className="border border-slate-200 rounded-xl p-5 hover:border-indigo-300 transition-colors bg-white shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black uppercase bg-slate-100 text-slate-500 px-2 py-1 rounded-md mb-2 inline-block">
                  {link.category || 'Général'}
                </span>
                <h3 className="font-bold text-slate-800 line-clamp-1">{link.title}</h3>
                {link.description && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{link.description}</p>}
              </div>
              <a href={link.url} target="_blank" rel="noopener noreferrer" className="mt-4 flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
                <ExternalLink className="w-3.5 h-3.5" /> Visiter le lien
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
