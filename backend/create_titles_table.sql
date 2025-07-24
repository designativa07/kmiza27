-- Criar tabela de títulos
CREATE TABLE IF NOT EXISTS titles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    competition_name VARCHAR(255),
    season VARCHAR(100),
    year INTEGER,
    description TEXT,
    category VARCHAR(50),
    type VARCHAR(50),
    display_order INTEGER,
    is_active BOOLEAN DEFAULT true,
    image_url TEXT,
    team_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);

-- Adicionar comentários
COMMENT ON TABLE titles IS 'Tabela para armazenar títulos conquistados pelos times';
COMMENT ON COLUMN titles.name IS 'Nome do título (ex: Campeonato Brasileiro)';
COMMENT ON COLUMN titles.competition_name IS 'Nome da competição específica';
COMMENT ON COLUMN titles.season IS 'Temporada (ex: 2024)';
COMMENT ON COLUMN titles.year IS 'Ano da conquista';
COMMENT ON COLUMN titles.description IS 'Descrição detalhada do título';
COMMENT ON COLUMN titles.category IS 'Categoria: Nacional, Internacional, Estadual, Regional';
COMMENT ON COLUMN titles.type IS 'Tipo: Campeonato, Copa, Supercopa, Torneio';
COMMENT ON COLUMN titles.display_order IS 'Ordem de exibição na interface';
COMMENT ON COLUMN titles.is_active IS 'Se o título está ativo para exibição';
COMMENT ON COLUMN titles.image_url IS 'URL da imagem do troféu/título';
COMMENT ON COLUMN titles.team_id IS 'ID do time que conquistou o título'; 