
'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabaseClient';
import { Artigo, FluxoRSS, Ajuste, Anuncio, Categoria } from '@/types';
import { slugify } from '@/lib/utils';
import { 
  FileText, Rss, Settings, Plus, Trash2, Edit, Megaphone, Tag, FolderTree, ChevronDown, Eye, Code, Link as LinkIcon
} from 'lucide-react';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(
  async () => {
    const { default: RQ, Quill } = await import("react-quill-new");
    const BlockEmbed = Quill.import('blots/block/embed') as any;
    
    class VideoBlot extends BlockEmbed {
      static blotName = 'video';
      static tagName = 'iframe';

      static create(url: string) {
        let node = super.create();
        node.setAttribute('src', url);
        node.setAttribute('frameborder', '0');
        node.setAttribute('allowfullscreen', 'true');
        node.setAttribute('width', '100%');
        node.setAttribute('height', '400');
        node.setAttribute('class', 'ql-video');
        node.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
        return node;
      }

      static value(node: HTMLElement) {
        return node.getAttribute('src');
      }
    }
    Quill.register(VideoBlot, true);
    
    return RQ;
  },
  { ssr: false }
);

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'artigos' | 'categorias' | 'rss' | 'anuncios' | 'ajustes'>('artigos');
  const [articles, setArticles] = useState<Artigo[]>([]);
  const [categories, setCategories] = useState<Categoria[]>([]);
  const [rssFeeds, setRssFeeds] = useState<FluxoRSS[]>([]);
  const [ajustes, setAjustes] = useState<Ajuste[]>([]);
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
  const [loading, setLoading] = useState(false);
  const [displayLimit, setDisplayLimit] = useState(20);
  const [editorMode, setEditorMode] = useState<'visual' | 'html'>('visual');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const router = useRouter();

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        ['link', 'image', 'video'],
        ['clean']
      ],
      handlers: {
        image: function(this: any) {
          const choice = confirm("Deseja carregar uma imagem do computador? (Cancelar para inserir link externo)");
          
          if (choice) {
            const input = document.createElement('input');
            input.setAttribute('type', 'file');
            input.setAttribute('accept', 'image/*');
            input.click();
            input.onchange = async () => {
              const file = input.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = () => {
                  const range = this.quill.getSelection();
                  if (range) {
                    this.quill.insertEmbed(range.index, 'image', reader.result);
                  }
                };
                reader.readAsDataURL(file);
              }
            };
          } else {
            const url = prompt("Insira a URL da imagem:");
            if (url) {
              const range = this.quill.getSelection();
              if (range) {
                this.quill.insertEmbed(range.index, 'image', url);
              }
            }
          }
        },
        video: function(this: any) {
          let url = prompt("Insira a URL do vídeo do YouTube (ou o código de incorporação):");
          if (url) {
            // Se o usuário colou o código completo do iframe, extrai apenas o src
            if (url.includes('<iframe')) {
              const match = url.match(/src="([^"]+)"/);
              if (match && match[1]) {
                url = match[1];
              }
            }
            
            // Converte links comuns do YouTube para formato embed
            if (url.includes('youtube.com/watch?v=')) {
              url = url.replace('watch?v=', 'embed/');
              // Remove parâmetros extras como &t= ou &ab_channel
              url = url.split('&')[0];
            } else if (url.includes('youtu.be/')) {
              url = url.replace('youtu.be/', 'youtube.com/embed/');
              url = url.split('?')[0];
            }
            
            const range = this.quill.getSelection();
            if (range) {
              this.quill.insertEmbed(range.index, 'video', url);
            }
          }
        }
      }
    },
    clipboard: {
      matchVisual: false,
    }
  }), []);

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'link', 'image', 'video'
  ];

  const [artigoForm, setArtigoForm] = useState({ title: '', content: '', thumb_url: '', read_more_link: '', category: '', published: true, show_reporter: true });
  const [catForm, setCatForm] = useState({ nome: '' });
  const [rssForm, setRssForm] = useState({ source_name: '', url: '' });
  const [anuncioForm, setAnuncioForm] = useState({ nome: '', imagem_url: '', link_externo: '' });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      loadData();
    };
    checkAuth();
  }, [activeTab, router]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Sempre carregar categorias para os formulários
      const { data: catData } = await supabase.from('categorias').select('*').order('nome');
      const loadedCats = catData || [];
      setCategories(loadedCats);

      if (activeTab === 'artigos') {
        const { data } = await supabase.from('artigos').select('*').order('created_at', { ascending: false });
        setArticles(data || []);
        // Pré-selecionar primeira categoria no form se estiver vazio
        if (artigoForm.category === '' && loadedCats.length > 0) {
          setArtigoForm(prev => ({ ...prev, category: loadedCats[0].nome }));
        }
      } else if (activeTab === 'categorias') {
        // Categorias já carregadas acima
      } else if (activeTab === 'rss') {
        const { data } = await supabase.from('fluxos_rss').select('*');
        setRssFeeds(data || []);
      } else if (activeTab === 'ajustes') {
        const { data } = await supabase.from('ajustes').select('*');
        setAjustes(data || []);
      } else if (activeTab === 'anuncios') {
        const { data } = await supabase.from('anuncios').select('*').order('created_at', { ascending: false });
        setAnuncios(data || []);
      }
    } catch (err: any) { 
      console.error(err);
    } finally { setLoading(false); }
  };

  const handleSaveArtigo = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const slug = slugify(artigoForm.title);
    const payload = { ...artigoForm, slug };
    try {
      if (editingId) {
        await supabase.from('artigos').update(payload).eq('id', editingId);
      } else {
        await supabase.from('artigos').insert([payload]);
      }
      setIsFormOpen(false);
      setEditingId(null);
      setArtigoForm({ title: '', content: '', thumb_url: '', read_more_link: '', category: categories[0]?.nome || '', published: true, show_reporter: true });
      await loadData();
    } catch (err: any) { alert(err.message); }
    finally { setLoading(false); }
  };

  const handleSaveCategoria = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catForm.nome) return;
    try {
      const { error } = await supabase.from('categorias').insert([{ nome: catForm.nome }]);
      if (error) throw error;
      setCatForm({ nome: '' });
      await loadData();
    } catch (err: any) { alert(err.message); }
  };

  const handleDeleteCategoria = async (id: string) => {
    if (!confirm('Excluir categoria? Matérias desta categoria permanecerão no banco, mas o rótulo pode sumir.')) return;
    try {
      await supabase.from('categorias').delete().eq('id', id);
      await loadData();
    } catch (err: any) { alert(err.message); }
  };

  const handleSaveAnuncio = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingId) {
        await supabase.from('anuncios').update(anuncioForm).eq('id', editingId);
      } else {
        await supabase.from('anuncios').insert([anuncioForm]);
      }
      setAnuncioForm({ nome: '', imagem_url: '', link_externo: '' });
      setEditingId(null);
      await loadData();
    } catch (err: any) { alert(err.message); }
    finally { setLoading(false); }
  };

  const handleTogglePublished = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('artigos')
        .update({ published: !currentStatus })
        .eq('id', id);
      
      if (error) throw error;
      setArticles(prev => prev.map(art => art.id === id ? { ...art, published: !currentStatus } : art));
    } catch (err: any) {
      alert('Erro ao atualizar status: ' + err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 min-h-screen">
      <div className="mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <h1 className="text-3xl font-bold text-gray-900">Painel Administrativo</h1>
        <div className="flex bg-gray-100 p-1 rounded-xl shadow-inner overflow-x-auto scrollbar-hide border border-gray-200">
          {[
            { id: 'artigos', label: 'Matérias', icon: FileText },
            { id: 'categorias', label: 'Categorias', icon: FolderTree },
            { id: 'anuncios', label: 'Anúncios', icon: Megaphone },
            { id: 'rss', label: 'RSS Feed', icon: Rss },
            { id: 'ajustes', label: 'Ajustes', icon: Settings },
          ].map((tab) => (
            <button 
              key={tab.id} 
              onClick={() => setActiveTab(tab.id as any)} 
              className={`px-6 py-2.5 rounded-lg font-bold capitalize transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === tab.id ? 'bg-white text-green-700 shadow-sm border border-gray-100' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'artigos' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold flex items-center gap-2 text-gray-700"><FileText size={20} /> Todas as Matérias</h2>
            <button 
              onClick={() => { 
                setEditingId(null); 
                setArtigoForm({ title: '', content: '', thumb_url: '', read_more_link: '', category: categories[0]?.nome || 'Agronegócio', published: true, show_reporter: true }); 
                setIsFormOpen(true); 
              }} 
              className="bg-green-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-bold shadow-lg shadow-green-700/20 hover:bg-green-800 transition-all"
            >
              <Plus size={18} /> Nova Matéria
            </button>
          </div>
          
          {isFormOpen && (
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-2xl mb-12 animate-in fade-in slide-in-from-top-4 duration-300">
               <form onSubmit={handleSaveArtigo} className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                     <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Título da Matéria</label>
                     <input required value={artigoForm.title} onChange={e => setArtigoForm({...artigoForm, title: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-green-500 outline-none transition-all" placeholder="Digite o título..." />
                   </div>
                   <div className="space-y-2">
                     <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Categoria</label>
                     <div className="relative">
                        <select 
                          required
                          value={artigoForm.category} 
                          onChange={e => setArtigoForm({...artigoForm, category: e.target.value})} 
                          className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-green-500 outline-none transition-all appearance-none cursor-pointer"
                        >
                          <option value="" disabled>Selecione uma categoria</option>
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.nome}>{cat.nome}</option>
                          ))}
                        </select>
                        <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                     </div>
                   </div>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                     <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">URL da Imagem de Capa</label>
                     <input required value={artigoForm.thumb_url} onChange={e => setArtigoForm({...artigoForm, thumb_url: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-green-500 outline-none transition-all" placeholder="Ex: https://imagem.com/foto.jpg" />
                   </div>
                   <div className="space-y-2">
                     <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Status de Publicação</label>
                     <div className="flex items-center gap-4 p-4 bg-gray-50 border border-gray-200 rounded-2xl h-[58px]">
                        <span className={`text-xs font-bold uppercase tracking-widest ${artigoForm.published ? 'text-green-600' : 'text-gray-400'}`}>
                          {artigoForm.published ? 'Online (Visível no site)' : 'Offline (Oculto)'}
                        </span>
                        <button 
                          type="button"
                          onClick={() => setArtigoForm({...artigoForm, published: !artigoForm.published})}
                          className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ml-auto ${artigoForm.published ? 'bg-green-600' : 'bg-gray-300'}`}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-200 ease-in-out ${artigoForm.published ? 'translate-x-6' : 'translate-x-0'}`}></div>
                        </button>
                     </div>
                   </div>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                     <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Link Externo (Fonte Original)</label>
                     <div className="relative">
                       <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                       <input value={artigoForm.read_more_link} onChange={e => setArtigoForm({...artigoForm, read_more_link: e.target.value})} className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-green-500 outline-none transition-all" placeholder="Ex: https://canalrural.com.br/noticia..." />
                     </div>
                   </div>
                   <div className="space-y-2">
                     <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Exibir Repórter</label>
                     <div className="flex items-center gap-4 p-4 bg-gray-50 border border-gray-200 rounded-2xl h-[58px]">
                        <span className={`text-xs font-bold uppercase tracking-widest ${artigoForm.show_reporter ? 'text-green-600' : 'text-gray-400'}`}>
                          {artigoForm.show_reporter ? 'Sim (Giancarlo Faria)' : 'Não'}
                        </span>
                        <button 
                          type="button"
                          onClick={() => setArtigoForm({...artigoForm, show_reporter: !artigoForm.show_reporter})}
                          className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ml-auto ${artigoForm.show_reporter ? 'bg-green-600' : 'bg-gray-300'}`}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-200 ease-in-out ${artigoForm.show_reporter ? 'translate-x-6' : 'translate-x-0'}`}></div>
                        </button>
                     </div>
                   </div>
                 </div>
                 <div className="space-y-2">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Conteúdo Completo</label>
                      <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
                        <button 
                          type="button"
                          onClick={() => setEditorMode('visual')}
                          className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all flex items-center gap-1 ${editorMode === 'visual' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500'}`}
                        >
                          <Eye size={12} /> Visual
                        </button>
                        <button 
                          type="button"
                          onClick={() => setEditorMode('html')}
                          className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all flex items-center gap-1 ${editorMode === 'html' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500'}`}
                        >
                          <Code size={12} /> HTML
                        </button>
                      </div>
                    </div>
                    
                    {editorMode === 'visual' ? (
                      <div className="bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden">
                        <ReactQuill 
                          theme="snow"
                          value={artigoForm.content}
                          onChange={(content) => setArtigoForm({...artigoForm, content})}
                          className="h-80 mb-12"
                          modules={modules}
                          formats={formats}
                        />
                      </div>
                    ) : (
                      <textarea 
                        required 
                        rows={15} 
                        value={artigoForm.content} 
                        onChange={e => setArtigoForm({...artigoForm, content: e.target.value})} 
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-green-500 outline-none transition-all font-mono text-sm" 
                        placeholder="Cole aqui o código HTML da notícia..."
                      ></textarea>
                    )}
                 </div>
                 <div className="flex justify-end gap-3 pt-4">
                   <button type="button" onClick={() => setIsFormOpen(false)} className="px-8 py-3 font-bold text-gray-500 hover:text-gray-700">Cancelar</button>
                   <button type="submit" className="bg-green-700 text-white px-12 py-3 rounded-2xl font-bold shadow-xl shadow-green-700/20 hover:bg-green-800 transition-all">
                     {editingId ? 'Atualizar Matéria' : 'Publicar Matéria'}
                   </button>
                 </div>
               </form>
            </div>
          )}

          <div className="grid gap-3">
            {articles.length === 0 ? (
              <div className="bg-white p-20 rounded-3xl border border-dashed border-gray-200 text-center">
                <FileText size={48} className="mx-auto text-gray-200 mb-4" />
                <p className="text-gray-400 font-medium">Nenhuma matéria cadastrada ainda.</p>
              </div>
            ) : (
              <>
                {articles.slice(0, displayLimit).map(art => (
                  <div key={art.id} className="bg-white p-4 rounded-2xl border border-gray-100 flex justify-between items-center group hover:shadow-md transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                        <img src={art.thumb_url} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <span className="font-bold block text-gray-800 text-lg line-clamp-1">{art.title}</span>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] uppercase font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-lg border border-green-100">
                            {art.category || 'Sem Categoria'}
                          </span>
                          <span className="text-[10px] text-gray-400 font-medium">
                            {new Date(art.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 pr-2">
                      <div className="flex items-center gap-2 mr-4">
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${art.published ? 'text-green-600' : 'text-gray-400'}`}>
                          {art.published ? 'Online' : 'Offline'}
                        </span>
                        <button 
                          onClick={() => handleTogglePublished(art.id, !!art.published)}
                          className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${art.published ? 'bg-green-600' : 'bg-gray-300'}`}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-200 ease-in-out ${art.published ? 'translate-x-6' : 'translate-x-0'}`}></div>
                        </button>
                      </div>

                      <div className="flex gap-2">
                        <button onClick={() => { 
                          setArtigoForm({
                            title: art.title,
                            content: art.content,
                            thumb_url: art.thumb_url,
                            read_more_link: art.read_more_link || '',
                            category: art.category,
                            published: !!art.published,
                            show_reporter: art.show_reporter !== false // Default to true if undefined
                          }); 
                          setEditingId(art.id); 
                          setIsFormOpen(true); 
                        }} className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors" title="Editar"><Edit size={20} /></button>
                        <button onClick={async () => { if(confirm('Excluir esta matéria permanentemente?')) { await supabase.from('artigos').delete().eq('id', art.id); loadData(); } }} className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-colors" title="Excluir"><Trash2 size={20} /></button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {articles.length > displayLimit && (
                  <div className="mt-8 flex justify-center">
                    <button 
                      onClick={() => setDisplayLimit(prev => prev + 20)}
                      className="text-green-700 font-bold text-sm hover:underline uppercase tracking-widest"
                    >
                      Carregar mais 20 matérias
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {activeTab === 'categorias' && (
        <div className="space-y-8 max-w-3xl">
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-700"><FolderTree size={20} className="text-green-600" /> Gerenciar Categorias</h2>
            <form onSubmit={handleSaveCategoria} className="flex gap-3">
              <input 
                required 
                value={catForm.nome} 
                onChange={e => setCatForm({ nome: e.target.value })} 
                className="flex-1 p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-green-500 outline-none transition-all" 
                placeholder="Ex: Pecuária, Soja, Destaques..." 
              />
              <button type="submit" className="bg-green-700 text-white px-8 rounded-2xl font-bold flex items-center gap-2 hover:bg-green-800 transition-all shadow-lg shadow-green-700/10">
                <Plus size={18} /> Adicionar
              </button>
            </form>
            <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-2xl flex gap-3 items-start">
              <Tag size={20} className="text-blue-500 mt-1 shrink-0" />
              <p className="text-sm text-blue-700 leading-relaxed font-medium">
                <strong>Importante:</strong> Use o nome exato <span className="bg-white px-2 py-0.5 rounded-md border border-blue-200 text-blue-900 font-bold">Destaques</span> para as notícias que você deseja que apareçam no carrossel animado do topo do site.
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map(cat => (
              <div key={cat.id} className="bg-white p-5 rounded-2xl border border-gray-100 flex justify-between items-center group hover:border-green-200 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="font-bold text-gray-700 text-lg">{cat.nome}</span>
                </div>
                <button 
                  onClick={() => handleDeleteCategoria(cat.id)} 
                  className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'anuncios' && (
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-700"><Megaphone size={20} className="text-yellow-500" /> {editingId ? 'Editar Anúncio' : 'Novo Anúncio Publicitário'}</h2>
            <form onSubmit={handleSaveAnuncio} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input required value={anuncioForm.nome} onChange={e => setAnuncioForm({...anuncioForm, nome: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl" placeholder="Nome Interno (ex: Banner Lateral Setembro)" />
                <input required value={anuncioForm.imagem_url} onChange={e => setAnuncioForm({...anuncioForm, imagem_url: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl" placeholder="URL da Imagem do Banner" />
              </div>
              <input value={anuncioForm.link_externo} onChange={e => setAnuncioForm({...anuncioForm, link_externo: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl" placeholder="Link de Destino ao Clicar (opcional)" />
              <div className="flex justify-end gap-3 pt-2">
                {editingId && <button type="button" onClick={() => { setEditingId(null); setAnuncioForm({nome:'', imagem_url:'', link_externo:''}); }} className="px-6 py-2 font-bold text-gray-400">Cancelar</button>}
                <button type="submit" className="bg-green-700 text-white px-10 py-3 rounded-2xl font-bold shadow-lg shadow-green-700/20 hover:bg-green-800">Salvar Anúncio</button>
              </div>
            </form>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {anuncios.map(anun => (
              <div key={anun.id} className="bg-white p-5 rounded-3xl border border-gray-100 group shadow-sm hover:shadow-md transition-all">
                <div className="w-full aspect-video bg-gray-50 rounded-2xl mb-4 border border-gray-100 overflow-hidden">
                   <img src={anun.imagem_url} className="w-full h-full object-contain" />
                </div>
                <h4 className="font-bold text-gray-800 text-lg mb-1">{anun.nome}</h4>
                <div className="flex gap-2 mt-4">
                  <button onClick={() => { setAnuncioForm(anun); setEditingId(anun.id); }} className="flex-1 bg-blue-50 text-blue-600 py-2.5 rounded-xl text-xs font-bold hover:bg-blue-100 transition-colors">Editar</button>
                  <button onClick={async () => { if(confirm('Remover este anúncio?')) { await supabase.from('anuncios').delete().eq('id', anun.id); loadData(); } }} className="bg-red-50 text-red-600 p-2.5 rounded-xl hover:bg-red-100 transition-colors"><Trash2 size={18} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'rss' && (
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-700"><Rss size={20} className="text-orange-500" /> Gerenciar Fontes RSS</h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                const { error } = await supabase.from('fluxos_rss').insert([rssForm]);
                if (error) throw error;
                setRssForm({ source_name: '', url: '' });
                await loadData();
              } catch (err: any) { alert(err.message); }
            }} className="flex flex-col md:flex-row gap-3">
              <input required value={rssForm.source_name} onChange={e => setRssForm({...rssForm, source_name: e.target.value})} className="flex-1 p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-green-500" placeholder="Nome da Fonte (ex: Canal Rural)" />
              <input required value={rssForm.url} onChange={e => setRssForm({...rssForm, url: e.target.value})} className="flex-[2] p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-green-500" placeholder="URL do Feed XML/RSS" />
              <button type="submit" className="bg-green-700 text-white px-8 rounded-2xl font-bold hover:bg-green-800 shadow-lg shadow-green-700/10">Adicionar Fonte</button>
            </form>
          </div>
          
          <div className="grid gap-3">
            {rssFeeds.map(feed => (
              <div key={feed.id} className="bg-white p-5 rounded-2xl border border-gray-100 flex justify-between items-center group">
                <div>
                  <span className="font-bold text-gray-800 block text-lg">{feed.source_name}</span>
                  <span className="text-xs text-gray-400 font-medium truncate max-w-md block">{feed.url}</span>
                </div>
                <button onClick={async () => { if(confirm('Remover esta fonte RSS?')) { await supabase.from('fluxos_rss').delete().eq('id', feed.id); loadData(); } }} className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={20} /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'ajustes' && (
        <div className="bg-white p-10 rounded-3xl border border-gray-100 shadow-sm max-w-4xl">
          <h3 className="text-xl font-bold mb-8 flex items-center gap-2 text-gray-700"><Settings size={22} className="text-green-600" /> Ajustes Gerais do Portal</h3>
          <div className="grid gap-6">
             {ajustes.map(adj => (
               <div key={adj.id} className="flex flex-col md:flex-row gap-2 md:items-center">
                 <span className="w-full md:w-56 text-[10px] font-bold uppercase text-gray-400 tracking-widest">{adj.key.replace(/_/g, ' ')}</span>
                 <div className="flex-1 flex gap-2">
                   <input 
                     id={`adj-${adj.key}`} 
                     defaultValue={adj.value} 
                     className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none transition-all" 
                   />
                   <button 
                    onClick={async () => {
                      const val = (document.getElementById(`adj-${adj.key}`) as HTMLInputElement).value;
                      try {
                        const { error } = await supabase.from('ajustes').update({ value: val }).eq('key', adj.key);
                        if (error) throw error;
                        alert('Ajuste salvo com sucesso!');
                        await loadData();
                      } catch (err: any) { alert(err.message); }
                    }} 
                    className="bg-green-700 text-white px-5 rounded-xl text-xs font-bold hover:bg-green-800 shadow-md"
                   >
                     SALVAR
                   </button>
                 </div>
               </div>
             ))}
          </div>
        </div>
      )}
    </div>
  );
}
