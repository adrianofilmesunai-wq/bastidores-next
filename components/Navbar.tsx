'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, Settings, Menu, X } from 'lucide-react';
import { supabase } from '@/supabaseClient';
import { Artigo } from '@/types';

const Navbar: React.FC = () => {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAgroModalOpen, setIsAgroModalOpen] = useState(false);
  const [agroArticles, setAgroArticles] = useState<Artigo[]>([]);
  const [loadingAgro, setLoadingAgro] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAdmin(!!session);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAdmin(!!session);
      if (session) {
        localStorage.setItem('agro_admin_session', 'true');
      } else {
        localStorage.removeItem('agro_admin_session');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
    localStorage.removeItem('agro_admin_session');
    router.push('/');
  };

  const handleScrollTo = (id: string) => {
    setIsMobileMenuOpen(false);
    if (pathname !== '/') {
      router.push('/#' + id);
    } else {
      const element = document.getElementById(id);
      if (element) element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const openAgroModal = async () => {
    setIsAgroModalOpen(true);
    setIsMobileMenuOpen(false);
    setLoadingAgro(true);
    try {
      const { data, error } = await supabase
        .from('artigos')
        .select('*')
        .eq('category', 'Destaques')
        .eq('published', true)
        .order('created_at', { ascending: false });
      
      if (!error) setAgroArticles(data || []);
    } catch (err) {
      console.error('Erro ao buscar matérias agro regional:', err);
    } finally {
      setLoadingAgro(false);
    }
  };

  return (
    <>
      <nav className="bg-white/95 backdrop-blur-md border-b sticky top-0 z-[60] h-20 flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex justify-between items-center">
          <Link href="/" onClick={() => { setIsMobileMenuOpen(false); }} className="flex items-center">
            <img src="https://i.ibb.co/JjS1Dgtb/logo-semi.png" alt="Logo" className="h-10 md:h-14 w-auto" />
          </Link>
          
          <div className="flex items-center space-x-6">
            <div className="hidden md:flex space-x-2">
              <Link href="/" className="text-gray-700 hover:text-green-700 font-bold px-4 py-2 text-sm transition-colors">Início</Link>
              <button onClick={openAgroModal} className="text-gray-700 hover:text-green-700 font-bold px-4 py-2 text-sm transition-colors">Agro Regional</button>
              <button onClick={() => handleScrollTo('noticias')} className="text-gray-700 hover:text-green-700 font-bold px-4 py-2 text-sm transition-colors">Notícias</button>
              <button onClick={() => handleScrollTo('canal')} className="text-gray-700 hover:text-green-700 font-bold px-4 py-2 text-sm transition-colors">Vídeos</button>
              <button className="text-gray-400 font-bold px-4 py-2 text-sm cursor-not-allowed">Quem Somos</button>
            </div>

            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition-all"
            >
              {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>

            {isAdmin && (
              <div className="hidden md:flex items-center space-x-4 border-l pl-6">
                <Link href="/admin" className="text-green-700 hover:text-green-800 font-bold flex items-center text-xs bg-green-50 px-3 py-1.5 rounded-lg border border-green-100">
                  <Settings size={14} className="mr-1.5" /> Painel
                </Link>
                <button onClick={handleLogout} className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg transition-all" title="Sair">
                  <LogOut size={20} />
                </button>
              </div>
            )}
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="absolute top-20 left-0 w-full bg-white border-b shadow-xl md:hidden animate-in slide-in-from-top-4 duration-300">
            <div className="flex flex-col p-6 space-y-4">
              <Link href="/" onClick={() => { setIsMobileMenuOpen(false); }} className="text-gray-700 font-bold text-lg border-b border-gray-50 pb-2">Início</Link>
              <button onClick={openAgroModal} className="text-left text-gray-700 font-bold text-lg border-b border-gray-50 pb-2">Agro Regional</button>
              <button onClick={() => handleScrollTo('noticias')} className="text-left text-gray-700 font-bold text-lg border-b border-gray-50 pb-2">Notícias</button>
              <button onClick={() => handleScrollTo('canal')} className="text-left text-gray-700 font-bold text-lg border-b border-gray-50 pb-2">Vídeos</button>
              <button className="text-left text-gray-300 font-bold text-lg cursor-not-allowed">Quem somos</button>
              
              {isAdmin && (
                <div className="pt-4 flex flex-col space-y-4">
                  <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)} className="text-green-700 font-bold flex items-center gap-2 bg-green-50 p-4 rounded-xl border border-green-100">
                    <Settings size={20} /> Painel Administrativo
                  </Link>
                  <button onClick={handleLogout} className="text-red-500 font-bold flex items-center gap-2 p-4">
                    <LogOut size={20} /> Encerrar Sessão
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Modal Agro Regional */}
      {isAgroModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={() => setIsAgroModalOpen(false)}>
          <div className="bg-white w-full max-w-3xl rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-green-50/50">
              <div>
                <h3 className="text-2xl font-serif font-bold text-green-900">Agro Regional</h3>
                <p className="text-xs text-green-700 font-bold uppercase tracking-widest mt-1">Matérias em Destaque Regional</p>
              </div>
              <button onClick={() => setIsAgroModalOpen(false)} className="bg-white text-gray-400 hover:text-red-500 p-2 rounded-full transition-all shadow-sm">
                <X size={24} />
              </button>
            </div>
            <div className="p-8 max-h-[70vh] overflow-y-auto scrollbar-hide">
              {loadingAgro ? (
                <div className="text-center py-20 text-gray-400 italic">Carregando notícias regionais...</div>
              ) : agroArticles.length > 0 ? (
                <div className="grid gap-6">
                  {agroArticles.map(art => (
                    <Link 
                      key={art.id} 
                      href={`/artigo/${art.slug || art.id}`}
                      onClick={() => setIsAgroModalOpen(false)}
                      className="flex items-center gap-6 p-4 rounded-2xl hover:bg-green-50 transition-all border border-transparent hover:border-green-100 group"
                    >
                      <div className="w-24 h-16 rounded-xl overflow-hidden shrink-0 shadow-md">
                        <img src={art.thumb_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={art.title} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-800 line-clamp-2 group-hover:text-green-700 transition-colors leading-tight">{art.title}</h4>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2 block">
                          {new Date(art.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 text-gray-300 italic">Nenhuma matéria regional encontrada.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
