
export interface Artigo {
  id: string;
  title: string;
  slug: string;
  content: string;
  thumb_url: string;
  read_more_link: string;
  category: string;
  published: boolean;
  show_reporter?: boolean;
  created_at: string;
}

export interface Categoria {
  id: string;
  nome: string;
  created_at: string;
}

export interface FluxoRSS {
  id: string;
  url: string;
  source_name: string;
  last_sync: string;
}

export interface Ajuste {
  id: string;
  key: string;
  value: string;
}

export interface Anuncio {
  id: string;
  nome: string;
  imagem_url: string;
  link_externo: string;
  created_at: string;
}

export interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  pubDate: string;
  link: string;
}

export interface Profile {
  id: string;
  email: string;
}

export interface Cotacao {
  id: string;
  produto: string;
  preco: number;
  unidade: string;
  fonte: string;
  updated_at: string;
}
