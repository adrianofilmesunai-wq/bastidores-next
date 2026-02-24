import { Metadata } from 'next';
import { supabase } from '@/supabaseClient';
import ArtigoContent from './ArtigoContent';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  
  try {
    // Tenta buscar pelo slug primeiro, depois pelo ID
    let { data: artigo } = await supabase
      .from('artigos')
      .select('title, thumb_url, content')
      .eq('slug', slug)
      .single();

    if (!artigo) {
      const { data } = await supabase
        .from('artigos')
        .select('title, thumb_url, content')
        .eq('id', slug)
        .single();
      artigo = data;
    }

    if (!artigo) {
      return {
        title: 'Matéria não encontrada | Bastidores do Agro',
      };
    }

    // Limpar HTML do conteúdo para a descrição se necessário, ou usar um resumo
    const description = artigo.title;

    return {
      title: `${artigo.title} | Bastidores do Agro`,
      description: description,
      openGraph: {
        title: artigo.title,
        description: description,
        images: [artigo.thumb_url],
        type: 'article',
      },
      twitter: {
        card: 'summary_large_image',
        title: artigo.title,
        description: description,
        images: [artigo.thumb_url],
      },
    };
  } catch (error) {
    console.error('Erro ao gerar metadados:', error);
    return {
      title: 'Bastidores do Agro',
    };
  }
}

export default async function ArtigoPage({ params }: Props) {
  const { slug } = await params;
  return <ArtigoContent slug={slug} />;
}
