'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/supabaseClient';
import { Artigo, YouTubeVideo, Ajuste, Anuncio, Cotacao } from '@/types';
import { 
  Play, 
  X, 
  ChevronRight, 
  Youtube, 
  ArrowUpRight, 
  Radio, 
  LayoutGrid, 
  List, 
  PlusCircle,
  Facebook,
  Instagram,
  MessageCircle,
  Search,
  TrendingUp
} from 'lucide-react';

export default function HomePage() {
  const [articles, setArticles] = useState<Artigo[]>([]);
  const [youtubeVideos, setYoutubeVideos] = useState<YouTubeVideo[]>([]);
  const [ajustes, setAjustes] = useState<Record<string, string>>({});
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
  const [cotacoes, setCotacoes] = useState<Cotacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [displayLimit, setDisplayLimit] = useState(6);

  // Estados para Pesquisa
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Artigo[]>([]);
  const [searching, setSearching] = useState(false);

  const DEFAULT_CHANNEL_ID = 'UC3av8fBZS1z8P5QHlUnNPqQ';

  useEffect(() => {
    fetchData();
    fetchYoutubeFeed();
    fetchAjustes();
    fetchAnuncios();
    fetchCotacoes();
  }, []);

  useEffect(() => {
    if (viewMode === 'grid') setDisplayLimit(6);
    else setDisplayLimit(12);
  }, [viewMode]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const { data, error } = await supabase
        .from('artigos')
        .select('*')
        .eq('published', true)
        .ilike('title', `%${searchQuery}%`)
        .order('created_at', { ascending: false });
      
      if (!error) setSearchResults(data || []);
    } catch (err) {
      console.error('Erro na pesquisa:', err);
    } finally {
      setSearching(false);
    }
  };

  const fetchCotacoes = async () => {
    try {
      const { data, error } = await supabase
        .from('cotacoes')
        .select('*')
        .order('produto', { ascending: true });
      if (!error) setCotacoes(data || []);
    } catch (err) { console.error('Erro cotações:', err); }
  };

  const heroArticles = articles.filter(art => art.category === 'Destaques' && art.published);

  useEffect(() => {
    if (heroArticles.length > 1) {
      const timer = setInterval(() => {
        setCarouselIndex((prev) => (prev + 1) % heroArticles.length);
      }, 7000);
      return () => clearInterval(timer);
    }
  }, [heroArticles.length]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('artigos')
        .select('*')
        .eq('published', true)
        .order('created_at', { ascending: false });
        
      if (!error) setArticles(data || []);
    } catch (err) { console.error('Erro artigos:', err); }
    finally { setLoading(false); }
  };

  const fetchAjustes = async () => {
    try {
      const { data } = await supabase.from('ajustes').select('*');
      if (data) {
        const settingsMap: Record<string, string> = {};
        data.forEach((item: Ajuste) => {
          settingsMap[item.key] = item.value;
        });
        setAjustes(settingsMap);
      }
    } catch (err) { console.error('Erro ajustes:', err); }
  };

  const fetchAnuncios = async () => {
    try {
      const { data } = await supabase.from('anuncios').select('*');
      if (data && data.length > 0) {
        const shuffled = [...data].sort(() => 0.5 - Math.random());
        setAnuncios(shuffled);
      }
    } catch (err) { console.error('Erro anúncios:', err); }
  };

  const fetchYoutubeFeed = async () => {
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${DEFAULT_CHANNEL_ID}`;
    const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
    try {
      const response = await fetch(apiUrl);
      const text = await response.text();
      
      // Proteção contra erro "undefined" is not valid JSON
      if (!text || text === 'undefined') {
        console.warn('YouTube API returned empty or undefined response');
        return;
      }

      const data = JSON.parse(text);
      if (data.items) {
        setYoutubeVideos(data.items.slice(0, 10).map((item: any) => ({
          id: item.guid.split(':')[2] || item.link.split('v=')[1],
          title: item.title,
          thumbnail: item.thumbnail,
          pubDate: item.pubDate,
          link: item.link
        })));
      }
    } catch (err) { console.error('Erro YouTube:', err); }
  };

  const getAgroTVEmbedUrl = () => {
    let rawValue = ajustes['youtube_live_id'] || DEFAULT_CHANNEL_ID;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = rawValue.match(regExp);
    let videoId = (match && match[2].length === 11) ? match[2] : rawValue;
    if (videoId.length !== 11 && videoId.startsWith('UC')) {
       return `https://www.youtube.com/embed/live_stream?channel=${videoId}&autoplay=1&mute=1&rel=0`;
    }
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&rel=0&controls=1&playlist=${videoId}&loop=1`;
  };

  const AdRenderer = ({ index }: { index: number }) => {
    if (anuncios.length === 0) return null;
    const ad = anuncios[index % anuncios.length];
    return (
      <div className="max-w-7xl mx-auto px-4 my-8 flex justify-center">
        <div className="w-full md:max-w-[728px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md">
           <a href={ad.link_externo || '#'} target="_blank" rel="noopener noreferrer" className="block relative group">
             <img src={ad.imagem_url} className="w-full h-auto md:h-[90px] object-contain mx-auto" alt={ad.nome} />
           </a>
        </div>
      </div>
    );
  };

  const currentArtigo = heroArticles.length > 0 ? heroArticles[carouselIndex] : articles[0];
  const displayedArticles = articles.slice(0, displayLimit);
  const hasMore = articles.length > displayLimit;

  // Extrair data comum das cotações
  const ultimaAtualizacao = cotacoes.length > 0 
    ? new Date(cotacoes[0].updated_at).toLocaleDateString('pt-BR') 
    : new Date().toLocaleDateString('pt-BR');

  return (
    <div className="bg-gray-50 min-h-screen">
      <AdRenderer index={0} />

      {/* HERO COM ALTURA REDUZIDA EM 6% (450px) */}
      <section className="bg-green-950 text-white relative h-[470px] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <video autoPlay loop muted playsInline className="w-full h-full object-cover opacity-60">
            <source src="https://controlmix.meuagente.fun/adriano/backgroud.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-r from-green-950 via-green-950/30 to-transparent"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 w-full relative z-10 h-full flex items-center">
          <div className="w-full h-auto py-4">
            <div className="absolute top-1 right-4 flex space-x-3">
              <a href={ajustes['facebook_url'] || '#'} target="_blank" className="bg-white/10 hover:bg-green-600 p-2 rounded-full transition-all"><Facebook size={13} /></a>
              <a href={ajustes['instagram_url'] || '#'} target="_blank" className="bg-white/10 hover:bg-green-600 p-2 rounded-full transition-all"><Instagram size={13} /></a>
              <a href={`https://wa.me/${ajustes['whatsapp_num'] || ''}`} target="_blank" className="bg-white/10 hover:bg-green-600 p-2 rounded-full transition-all"><MessageCircle size={13} /></a>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7">
                <div className="mb-2">
                  <h1 className="text-4xl md:text-5xl font-serif font-bold mb-2 leading-tight drop-shadow-md">Bastidores do Agro</h1>
                  <p className="text-base text-green-100/70 max-w-xl leading-relaxed font-light mb-4">Informação estratégica e bastidores de quem move a economia do Brasil.</p>
                </div>
                <div className="min-h-[80px] mb-4">
                  {currentArtigo && (
                    <div key={currentArtigo.id} className="animate-in fade-in slide-in-from-left-6 duration-700">
                      <h2 className="text-lg md:text-2xl font-bold text-green-400 border-l-4 border-green-500 pl-4 py-1 leading-tight">{currentArtigo.title}</h2>
                    </div>
                  )}
                </div>
                {currentArtigo && (
                  <Link href={`/artigo/${currentArtigo.slug || currentArtigo.id}`} className="bg-white text-green-900 px-8 py-2.5 rounded-full font-bold shadow-2xl hover:bg-gray-100 transition-all flex items-center group text-xs w-fit mb-6">
                    Leia o Destaque <ChevronRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                )}

                {/* BARRA DE COTAÇÕES - GRID ESTÁTICO (SEM TICKER) PARA MOSTRAR TUDO */}
                <div className="mt-2 bg-black/40 backdrop-blur-xl border border-white/10 p-4 rounded-2xl max-w-xl shadow-2xl">
                   <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between border-b border-white/5 pb-2">
                         <div className="flex items-center gap-2">
                            <TrendingUp size={16} className="text-green-400" />
                            <span className="text-[11px] font-black uppercase tracking-widest text-white">Cotações em Tempo Real</span>
                         </div>
                         <span className="text-[10px] font-bold text-gray-400">Atualizado: {ultimaAtualizacao}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                        {cotacoes.length > 0 ? (
                          cotacoes.map((item) => (
                            <div key={item.id} className="flex flex-col">
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter line-clamp-1">{item.produto}</span>
                              <div className="flex items-baseline gap-1">
                                <span className="text-sm font-black text-green-400">R$ {Number(item.preco).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                                
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="col-span-2 text-[10px] text-gray-400 animate-pulse py-2 italic font-light">Buscando dados...</div>
                        )}
                      </div>
                   </div>
                </div>
              </div>
              <div className="lg:col-span-5 hidden lg:block">
                <div className="relative group">
                   {currentArtigo ? (
                      <div className="aspect-video rounded-xl overflow-hidden shadow-2xl relative border border-white/10 max-w-[400px] ml-auto">
                        <div className="absolute top-3 left-3 z-20">
                          <span className="bg-green-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-lg">
                            Agro Regional
                          </span>
                        </div>
                        <img src={currentArtigo.thumb_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt="Destaque" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                      </div>
                   ) : (
                      <div className="aspect-video bg-white/5 rounded-xl border-2 border-dashed border-white/10 flex items-center justify-center text-white/20 font-bold uppercase tracking-widest text-xs">Carregando Destaques</div>
                   )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="noticias" className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 border-b border-gray-100 pb-8">
          <div>
            <h2 className="text-4xl font-serif font-bold text-gray-900">Agro Nacional</h2>
            <p className="text-gray-400 mt-2 text-base">As atualizações mais recentes do agronegócio nacional.</p>
          </div>
          <div className="flex items-center bg-gray-100 p-1 rounded-xl shadow-inner mt-6 md:mt-0 border border-gray-200 gap-1">
            <button onClick={() => setIsSearchModalOpen(true)} className="p-2 rounded-lg text-gray-400 hover:text-green-700 transition-all hover:bg-white"><Search size={20} /></button>
            <div className="w-px h-6 bg-gray-200 mx-1"></div>
            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-green-700 shadow-md border border-gray-200' : 'text-gray-400'}`}><LayoutGrid size={20} /></button>
            <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-green-700 shadow-md border border-gray-200' : 'text-gray-400'}`}><List size={20} /></button>
          </div>
        </div>

        <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10" : "flex flex-col gap-5 max-w-4xl mx-auto"}>
          {displayedArticles.map((artigo) => (
            <Link key={artigo.id} href={`/artigo/${artigo.slug || artigo.id}`} className={`group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 ${viewMode === 'list' ? 'flex flex-row h-28 md:h-32 w-full' : ''}`}>
              <div className={`${viewMode === 'list' ? 'w-28 md:w-40 h-full shrink-0' : 'h-52'} overflow-hidden relative`}>
                <img src={artigo.thumb_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={artigo.title} />
                {viewMode === 'grid' && (
                  <div className="absolute top-4 left-4">
                    <span className="bg-green-700/90 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg">
                      {artigo.category === 'Destaques' ? 'Agro Regional' : (artigo.category || 'Agro')}
                    </span>
                  </div>
                )}
              </div>
              <div className={`${viewMode === 'list' ? 'px-5 py-3' : 'p-8'} flex flex-col justify-center flex-1`}>
                <span className="text-[9px] text-gray-400 uppercase font-bold tracking-widest mb-1 block">
                  {new Date(artigo.created_at).toLocaleDateString('pt-BR')}
                </span>
                <h3 className={`${viewMode === 'list' ? 'text-base md:text-lg' : 'text-xl'} font-bold text-gray-900 group-hover:text-green-700 transition-colors line-clamp-2 leading-snug`}>{artigo.title}</h3>
                {viewMode === 'grid' && (
                  <div className="text-green-700 font-bold text-xs flex items-center mt-4 group-hover:translate-x-2 transition-transform uppercase tracking-widest">
                    Ler matéria <ArrowUpRight size={16} className="ml-2" />
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>

        {hasMore && (
          <div className="mt-16 flex justify-center">
            <button onClick={() => setDisplayLimit(prev => prev + 6)} className="group flex flex-col items-center text-gray-400 hover:text-green-700 transition-all">
              <PlusCircle size={44} className="mb-3 group-hover:scale-110 transition-all text-green-700/20 group-hover:text-green-700" />
              <span className="font-bold text-[11px] uppercase tracking-[0.2em]">Ver mais notícias</span>
            </button>
          </div>
        )}
      </section>

      <AdRenderer index={1} />

      <section id="canal" className="bg-white py-24 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-16 gap-10">
            <div className="flex items-center">
              <Radio size={36} className="text-red-600 mr-6 animate-pulse" />
              <h2 className="text-4xl font-serif font-bold text-gray-900">Bastidores Agro TV</h2>
            </div>
            <a href={`https://www.youtube.com/channel/${DEFAULT_CHANNEL_ID}`} target="_blank" className="bg-green-900 text-white px-10 py-4 rounded-full font-bold flex items-center hover:bg-green-700 transition-all shadow-xl shadow-red-600/10">
              <Youtube size={22} className="mr-3" /> Inscrever-se no Canal
            </a>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-8">
              <div className="bg-black rounded-3xl overflow-hidden shadow-2xl aspect-video relative group border-2 border-gray-100">
                <iframe src={getAgroTVEmbedUrl()} className="w-full h-full border-0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen></iframe>
              </div>
            </div>
            <div className="lg:col-span-4 space-y-5 overflow-y-auto max-h-[550px] scrollbar-hide pr-4">
              <h4 className="font-bold text-gray-400 text-[11px] uppercase tracking-[0.2em] mb-6 flex items-center">
                <div className="w-8 h-[2px] bg-green-700 mr-3"></div> Vídeos Recentes
              </h4>
              {youtubeVideos.map(video => (
                <div key={video.id} onClick={() => setSelectedVideo(video.id)} className="flex gap-5 p-4 bg-gray-50 rounded-2xl hover:bg-green-50 cursor-pointer transition-all group border border-transparent hover:border-green-100">
                  <div className="w-32 h-20 shrink-0 rounded-xl overflow-hidden relative shadow-md">
                    <img src={video.thumbnail} className="w-full h-full object-cover" alt={video.title} />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play size={20} fill="white" className="text-white" />
                    </div>
                  </div>
                  <h5 className="text-[13px] font-bold text-gray-800 line-clamp-2 group-hover:text-green-700 leading-tight self-center">
                    {video.title}
                  </h5>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Modal de Pesquisa */}
      {isSearchModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md" onClick={() => { setIsSearchModalOpen(false); setSearchResults([]); setSearchQuery(''); }}>
          <div className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="p-8 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Pesquisar no Portal</h3>
              <button onClick={() => { setIsSearchModalOpen(false); setSearchResults([]); setSearchQuery(''); }} className="text-gray-400 hover:text-red-500 transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-8">
              <div className="flex gap-4 mb-8">
                <input 
                  autoFocus
                  type="text" 
                  placeholder="Digite o que procura..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1 p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-green-500 transition-all"
                />
                <button 
                  onClick={handleSearch}
                  className="bg-green-700 text-white px-8 rounded-2xl font-bold hover:bg-green-800 transition-all shadow-lg shadow-green-700/20"
                >
                  OK
                </button>
              </div>

              <div className="max-h-[400px] overflow-y-auto space-y-4 pr-2 scrollbar-hide">
                {searching ? (
                  <div className="text-center py-10 text-gray-400">Pesquisando...</div>
                ) : searchResults.length > 0 ? (
                  searchResults.map(result => (
                    <Link 
                      key={result.id} 
                      href={`/artigo/${result.slug || result.id}`} 
                      onClick={() => { setIsSearchModalOpen(false); setSearchResults([]); setSearchQuery(''); }}
                      className="flex items-center gap-4 p-4 rounded-2xl hover:bg-green-50 transition-all border border-transparent hover:border-green-100 group"
                    >
                      <div className="w-16 h-12 rounded-lg overflow-hidden shrink-0 bg-gray-100 shadow-sm">
                        <img src={result.thumb_url} className="w-full h-full object-cover" alt={result.title} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-800 line-clamp-1 group-hover:text-green-700 transition-colors">{result.title}</h4>
                        <span className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">{new Date(result.created_at).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <ArrowUpRight size={18} className="text-gray-300 group-hover:text-green-700" />
                    </Link>
                  ))
                ) : searchQuery && !searching ? (
                  <div className="text-center py-10 text-gray-400 font-medium">Nenhum resultado encontrado para "{searchQuery}"</div>
                ) : (
                  <div className="text-center py-10 text-gray-300 italic font-light">Digite uma palavra-chave para buscar matérias...</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedVideo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/98 p-6 backdrop-blur-md" onClick={() => setSelectedVideo(null)}>
          <div className="relative w-full max-w-5xl aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedVideo(null)} className="absolute top-6 right-6 z-10 bg-white/10 hover:bg-red-600 text-white p-2 rounded-full backdrop-blur-md transition-all">
              <X size={28} />
            </button>
            <iframe src={`https://www.youtube.com/embed/${selectedVideo}?autoplay=1`} className="w-full h-full border-0" allow="autoplay; encrypted-media" allowFullScreen></iframe>
          </div>
        </div>
      )}
    </div>
  );
}
