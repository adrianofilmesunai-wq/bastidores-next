import { MetadataRoute } from 'next';
import { supabase } from '@/supabaseClient';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.bastidoresdoagro.com.br';

  try {
    // Buscar todos os artigos publicados para gerar os links
    const { data: artigos } = await supabase
      .from('artigos')
      .select('slug, id, updated_at')
      .eq('published', true);

    const artigoEntries: MetadataRoute.Sitemap = (artigos || []).map((artigo) => ({
      url: `${baseUrl}/artigo/${artigo.slug || artigo.id}`,
      lastModified: new Date(artigo.updated_at || new Date()),
      changeFrequency: 'daily',
      priority: 0.7,
    }));

    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'always',
        priority: 1,
      },
      ...artigoEntries,
    ];
  } catch (error) {
    console.error('Erro ao gerar sitemap:', error);
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'always',
        priority: 1,
      },
    ];
  }
}
