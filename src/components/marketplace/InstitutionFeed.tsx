import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Share2, 
  MessageCircle, 
  Bookmark, 
  MoreHorizontal, 
  CheckCircle, 
  Calendar,
  FileText,
  Image as ImageIcon,
  Video,
  ExternalLink,
  ChevronRight,
  Loader2,
  Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { postService } from '../../services/postService';
import { institutionService } from '../../services/institutionService';
import { EstablishmentPost, Institution } from '../../types';

export function InstitutionFeed() {
  const [posts, setPosts] = useState<(EstablishmentPost & { establishment?: Institution })[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const postsData = await postService.getAllPosts(30);
        const institutionsData = await institutionService.getAllInstitutions();
        
        const mergedPosts = postsData.map(post => ({
          ...post,
          establishment: institutionsData.find(inst => inst.id === post.establishmentId)
        }));
        
        setPosts(mergedPosts);
      } catch (error) {
        console.error("Error fetching feed:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, []);

  if (isLoading) {
    return (
      <div className="py-20 flex justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Fil d'Actualité <span className="bg-indigo-600 text-white p-1 rounded-lg"><Bell className="w-4 h-4" /></span>
          </h2>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Annonces & Opportunités des campus</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {posts.map((post, index) => (
          <motion.div 
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="group bg-white rounded-3xl border border-slate-200/60 shadow-sm hover:shadow-xl hover:border-indigo-600 transition-all overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 p-2 flex items-center justify-center overflow-hidden">
                  <img src={post.establishment?.logo || 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&q=80'} className="w-full h-full object-contain" alt="" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-black text-slate-900 truncate max-w-[200px] leading-none">{post.establishment?.name || 'Établissement'}</h3>
                    {post.establishment?.isVerified && <CheckCircle className="w-3.5 h-3.5 text-blue-600 fill-blue-50" />}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{new Date(post.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</span>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                       post.category === 'Concours' ? 'bg-rose-100 text-rose-700' :
                       post.category === 'Événement' ? 'bg-indigo-100 text-indigo-700' :
                       'bg-slate-100 text-slate-600'
                    }`}>
                      {post.category || 'Actualité'}
                    </span>
                    {post.isImportant && (
                      <span className="bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border border-rose-200">Important</span>
                    )}
                  </div>
                </div>
              </div>
              <button className="text-slate-300 hover:text-slate-600 transition-colors p-2">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 pb-4">
              <h4 className="text-xl font-black text-slate-900 leading-tight mb-3 tracking-tight">{post.title}</h4>
              <p className="text-sm text-slate-600 font-medium leading-relaxed mb-4 line-clamp-4">
                {post.content}
              </p>
              {post.eventDate && (
                <div className="bg-indigo-50 p-4 rounded-2xl flex items-center gap-4 mb-4">
                   <Calendar className="w-5 h-5 text-indigo-600" />
                   <div>
                      <span className="block text-[8px] font-black uppercase text-indigo-400 tracking-widest">Événement le</span>
                      <span className="text-sm font-black text-slate-900">{new Date(post.eventDate).toLocaleDateString()}</span>
                      {post.location && (
                        <span className="ml-4 text-[10px] font-bold text-slate-500 italic">à {post.location}</span>
                      )}
                   </div>
                </div>
              )}
            </div>

            {post.mediaUrl && (
              <div className="mx-6 mb-6 rounded-2xl overflow-hidden aspect-video relative group/media">
                <img src={post.mediaUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover/media:scale-110" alt="" />
                {post.mediaType === 'video' && (
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 text-white">
                      <Video className="w-8 h-8 fill-current" />
                    </div>
                  </div>
                )}
                {post.mediaType === 'pdf' && (
                  <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                    <div className="flex items-center gap-2 text-white">
                      <FileText className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Document PDF disponible</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Footer / Interactions */}
            <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <button className="flex items-center gap-2 text-slate-400 hover:text-rose-500 transition-colors group/heart">
                  <Heart className="w-5 h-5 group-active/heart:scale-150 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-widest">{post.likesCount}</span>
                </button>
                <button className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors">
                  <MessageCircle className="w-5 h-5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">{post.commentsCount}</span>
                </button>
                <button className="flex items-center gap-2 text-slate-400 hover:text-emerald-600 transition-colors">
                  <Share2 className="w-5 h-5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">{post.sharesCount}</span>
                </button>
              </div>
              <button className="text-slate-400 hover:text-slate-900 transition-colors">
                <Bookmark className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        ))}

        {posts.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
             <Bell className="w-12 h-12 text-slate-200 mx-auto mb-4" />
             <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Aucune publication pour le moment.</p>
          </div>
        )}
      </div>
    </div>
  );
}
