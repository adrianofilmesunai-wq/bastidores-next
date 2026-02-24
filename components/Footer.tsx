'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Facebook, Instagram, MessageCircle, Lock, ArrowUpRight } from 'lucide-react';
import { supabase } from '@/supabaseClient';
import { Ajuste } from '@/types';

const Footer: React.FC = () => {
  const [ajustes, setAjustes] = useState<Record<string, string>>({});

  useEffect(() => {
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
      } catch (err) {
        console.error('Erro ao buscar ajustes no footer:', err);
      }
    };
    fetchAjustes();
  }, []);

  return (
    <footer className="bg-green-950 text-white pt-20 pb-10 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
          <div className="md:col-span-5">
            <img src="https://i.ibb.co/JjS1Dgtb/logo-semi.png" alt="Logo" className="h-16 mb-8 brightness-0 invert" />
            <p className="text-green-100/60 max-w-sm leading-relaxed mb-8">
              O portal Bastidores do Agro traz informação estratégica, análises de mercado e os bastidores de quem move o agronegócio brasileiro.
            </p>
            <div className="flex space-x-4">
              <a href={ajustes['facebook_url'] || '#'} target="_blank" rel="noopener noreferrer" className="bg-white/5 hover:bg-green-600 p-3 rounded-full transition-all border border-white/10"><Facebook size={20} /></a>
              <a href={ajustes['instagram_url'] || '#'} target="_blank" rel="noopener noreferrer" className="bg-white/5 hover:bg-green-600 p-3 rounded-full transition-all border border-white/10"><Instagram size={20} /></a>
              <a href={`https://wa.me/${ajustes['whatsapp_num'] || ''}`} target="_blank" rel="noopener noreferrer" className="bg-white/5 hover:bg-green-600 p-3 rounded-full transition-all border border-white/10"><MessageCircle size={20} /></a>
            </div>
          </div>
          
          <div className="md:col-span-3">
            <h4 className="font-bold text-white uppercase tracking-widest text-xs mb-8">Navegação</h4>
            <ul className="space-y-4 text-sm text-green-100/60">
              <li><Link href="/" className="hover:text-white transition-colors">Início</Link></li>
              <li><Link href="/#noticias" className="hover:text-white transition-colors">Notícias</Link></li>
              <li><Link href="/#canal" className="hover:text-white transition-colors">Vídeos</Link></li>
              <li><span className="opacity-50 cursor-not-allowed">Quem Somos</span></li>
            </ul>
          </div>

          <div className="md:col-span-4">
            <h4 className="font-bold text-white uppercase tracking-widest text-xs mb-8">Contato & Sugestões</h4>
            <p className="text-sm text-green-100/60 mb-6">Tem uma sugestão de pauta ou quer anunciar conosco? Entre em contato pelo nosso canal oficial.</p>
            <a 
              href={`https://wa.me/${ajustes['whatsapp_num'] || ''}`} 
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-green-400 font-bold hover:text-green-300 transition-colors"
            >
              Falar com a Redação <ArrowUpRight size={18} />
            </a>
          </div>
        </div>

        <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[11px] text-green-100/30 uppercase tracking-[0.2em]">
            © {new Date().getFullYear()} Bastidores do Agro. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/login" className="text-green-100/20 hover:text-white transition-colors flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
              <Lock size={14} /> Acesso Restrito
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
