'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/supabaseClient';
import { Artigo, Anuncio } from '@/types';
import { ArrowLeft, Calendar, Tag, ExternalLink, User, X } from 'lucide-react';

interface Props {
  slug: string;
}

const ArtigoContent: React.FC<Props> = ({ slug }) => {
  const [artigo, setArtigo] = useState<Artigo | null>(null);
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
  const [loading, setLoading] = useState(true);
  const [isReporterModalOpen, setIsReporterModalOpen] = useState(false);

  useEffect(() => {
    loadArtigo();
    loadAnuncios();
  }, [slug]);

  const loadArtigo = async () => {
    try {
      let result = await supabase.from('artigos').select('*').eq('slug', slug).single();
      if (result.error) result = await supabase.from('artigos').select('*').eq('id', slug).single();
      if (!result.error) setArtigo(result.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const loadAnuncios = async () => {
    try {
      const { data } = await supabase.from('anuncios').select('*');
      if (data && data.length > 0) {
        const shuffled = [...data].sort(() => 0.5 - Math.random());
        setAnuncios(shuffled);
      }
    } catch (err) { console.error('Erro ao carregar anúncios:', err); }
  };

  const AdRenderer = ({ index }: { index: number }) => {
    if (anuncios.length === 0) return null;
    const ad = anuncios[index % anuncios.length];
    
    return (
      <div className="max-w-7xl mx-auto my-12 px-4 flex justify-center">
        <div className="w-full md:max-w-[728px] overflow-hidden rounded-lg shadow-sm bg-gray-50 border border-gray-100 transition-all hover:shadow-md">
          <a 
            href={ad.link_externo || '#'} 
            target="_blank" 
            rel="noopener noreferrer"
            className="block relative group"
            onClick={(e) => !ad.link_externo && e.preventDefault()}
          >
            <img 
              src={ad.imagem_url} 
              alt={ad.nome} 
              className="w-full h-auto min-h-[50px] md:h-[90px] object-contain mx-auto"
            />
          </a>
        </div>
      </div>
    );
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Lendo matéria...</div>;
  if (!artigo) return <div className="min-h-screen flex items-center justify-center">Matéria não encontrada.</div>;

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link href="/" className="inline-flex items-center text-green-700 font-bold mb-6 hover:translate-x-1 transition-transform">
          <ArrowLeft size={18} className="mr-2" /> Voltar para o portal
        </Link>

        <AdRenderer index={0} />

        <header className="mb-12">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 leading-tight mb-6">
            {artigo.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 mb-8 pb-6 border-b border-gray-100">
            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center">
              <Tag size={12} className="mr-1.5" /> {artigo.category === 'Destaques' ? 'Agro Regional' : artigo.category}
            </span>
            <span className="text-gray-400 text-xs font-bold flex items-center">
              <Calendar size={12} className="mr-1.5" /> {new Date(artigo.created_at).toLocaleDateString('pt-BR')}
            </span>
            {artigo.show_reporter && (
              <button 
                onClick={() => setIsReporterModalOpen(true)}
                className="text-gray-500 text-xs font-bold flex items-center border-l border-gray-200 pl-4 ml-2 hover:text-green-700 transition-colors"
              >
                <User size={12} className="mr-1.5 text-green-700" /> Giancarlo Faria - Repórter Agro
              </button>
            )}
          </div>

          <div className="rounded-3xl overflow-hidden shadow-2xl h-auto min-h-[300px] md:h-96">
            <img src={artigo.thumb_url} className="w-full h-full object-cover" alt={artigo.title} />
          </div>
        </header>

        <AdRenderer index={1} />

        {/* Renderização de HTML interpretado para matérias RSS e manuais */}
        <div 
          className="prose prose-lg max-w-none text-gray-700 leading-relaxed font-light text-xl mb-12 article-content-render"
          dangerouslySetInnerHTML={{ __html: artigo.content }}
        />

        {/* Bloco de Sugestões WhatsApp */}
        <div className="py-10 my-10 border-t border-gray-100 text-center">
          <a 
            href="https://wa.me/5538999629495?text=Sugest%C3%B5es%20de%20Reportagens!" 
            target="_blank" 
            title="Clique aqui!" 
            aria-label="Clique aqui!" 
            className="font-bold text-[#0b5e2a] no-underline inline-flex items-center gap-4 text-lg md:text-xl hover:scale-105 transition-transform"
          >
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/WhatsApp.svg/3840px-WhatsApp.svg.png" 
              alt="WhatsApp" 
              className="w-10 h-10 md:w-14 md:h-14 shrink-0"
            />
            <span>Sugestões de Reportagens!</span>
          </a>
        </div>

        <AdRenderer index={2} />

        {artigo.read_more_link && (
          <div className="mt-8 pt-6 border-t border-gray-100 flex justify-center">
            <a href={artigo.read_more_link} target="_blank" rel="noopener noreferrer" className="bg-green-700 text-white px-10 py-4 rounded-full font-bold shadow-xl hover:bg-green-800 transition-all flex items-center group">
              Leia a matéria completa na fonte <ExternalLink size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        )}
      </div>

      {/* Modal do Repórter */}
      {isReporterModalOpen && (
        <div 
          className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" 
          onClick={() => setIsReporterModalOpen(false)}
        >
          <div 
            className="relative max-w-lg w-full bg-white rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200" 
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => setIsReporterModalOpen(false)}
              className="absolute top-4 right-4 z-10 bg-black/10 hover:bg-red-500 hover:text-white text-gray-700 p-2 rounded-full transition-all"
            >
              <X size={24} />
            </button>
            <img 
              src="http://up.svplay.cv/u/GJ1suI.png" 
              className="w-full h-auto" 
              alt="Giancarlo Faria - Repórter Agro" 
            />
          </div>
        </div>
      )}

      <style jsx global>{`
        .article-content-render img { border-radius: 1.5rem; margin: 2rem 0; width: 100%; height: auto; object-fit: cover; }
        .article-content-render p { margin-bottom: 1.5rem; }
        .article-content-render a { color: #15803d; font-weight: bold; text-decoration: underline; }
      `}</style>
    </div>
  );
};

export default ArtigoContent;
