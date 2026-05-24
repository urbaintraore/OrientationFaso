import React, { useState, useEffect } from 'react';
import { Link as LinkIcon, Plus, Trash2, Edit2, ExternalLink, Loader2, Save, X } from 'lucide-react';
import { usefulLinkService, UsefulLink } from '../services/usefulLinkService';

export const UsefulLinksPanel = ({ isAdmin = false }: { isAdmin?: boolean }) => {
  const [links, setLinks] = useState<UsefulLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    url: '',
    description: '',
    category: ''
  });

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

  useEffect(() => {
    fetchLinks();
  }, []);

  const handleSave = async () => {
    console.log("handleSave called, isAdmin:", isAdmin);
    alert("Save triggered");
    if (!isAdmin) return;
    
    if (!formData.title || !formData.url) {
        alert("Veuillez remplir le titre et l'URL.");
        return;
    }
    
    try {
      if (editingId) {
        await usefulLinkService.updateLink(editingId, formData);
      } else {
        await usefulLinkService.addLink(formData);
      }
      setFormData({ title: '', url: '', description: '', category: '' });
      setIsAdding(false);
      setEditingId(null);
      fetchLinks();
    } catch (error) {
      alert("Erreur lors de l'enregistrement : " + (error as Error).message);
    }
  };

  const handleEdit = (link: UsefulLink) => {
    if (!isAdmin) return;
    setFormData({
      title: link.title,
      url: link.url,
      description: link.description || '',
      category: link.category || ''
    });
    setEditingId(link.id!);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) return;
    if (window.confirm("Supprimer ce lien ?")) {
      try {
        await usefulLinkService.deleteLink(id);
        setLinks(links.filter(l => l.id !== id));
      } catch (e) {
        alert("Erreur lors de la suppression");
      }
    }
  };

  return (
    <div className="bg-white rounded-3xl overflow-hidden mt-6 p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <LinkIcon className="w-6 h-6 text-indigo-500" />
            Liens Utiles
          </h2>
          <p className="text-sm text-slate-500 mt-1">Liens utiles partagés sur la plateforme.</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => {
              setFormData({ title: '', url: '', description: '', category: '' });
              setEditingId(null);
              setIsAdding(!isAdding);
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-200 flex items-center gap-2"
          >
            {isAdding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {isAdding ? "Annuler" : "Ajouter un lien"}
          </button>
        )}
      </div>

      {isAdding && isAdmin && (
        <div className="bg-slate-50 p-6 rounded-2xl mb-6 border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-4">{editingId ? "Modifier le lien" : "Nouveau lien"}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase mb-1">Titre</label>
              <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm" placeholder="ex: Ministère de l'Éducation" />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase mb-1">URL (Lien)</label>
              <input type="url" value={formData.url} onChange={e => setFormData({...formData, url: e.target.value})} className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm" placeholder="https://" />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase mb-1">Description (Optionnel)</label>
              <input type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm" placeholder="Description courte..." />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase mb-1">Catégorie (Optionnel)</label>
              <input type="text" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm" placeholder="ex: Bourses, Officiel..." />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleSave}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-md shadow-indigo-200 flex items-center gap-2"
            >
              <Save className="w-4 h-4" /> {editingId ? "Enregistrer les modifications" : "Enregistrer"}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-12 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : links.length === 0 ? (
        <div className="text-center p-12 bg-slate-50 rounded-2xl text-slate-500">
          <LinkIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="font-bold">Aucun lien utile</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {links.map((link) => (
            <div key={link.id} className="border border-slate-200 rounded-xl p-5 hover:border-indigo-300 transition-colors bg-white shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-black uppercase bg-slate-100 text-slate-500 px-2 py-1 rounded-md">
                    {link.category || 'Général'}
                  </span>
                  {isAdmin && (
                    <div className="flex gap-1">
                      <button onClick={() => handleEdit(link)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(link.id!)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
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
