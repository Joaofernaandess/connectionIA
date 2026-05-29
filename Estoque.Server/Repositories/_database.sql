-- docker run --name pg-estoque -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=admin -e POSTGRES_DB=estoque_certo -p 5432:5432 -d postgres:latest


CREATE SCHEMA IF NOT EXISTS estoque_certo;

CREATE TABLE IF NOT EXISTS estoque_certo.unidade_organizacional (
    unidade_organizacional_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    matriz_id UUID,
    cnpj VARCHAR(14) NOT NULL,
    razao_social VARCHAR(100) NOT NULL,
    nome_fantasia VARCHAR(100),
    cep VARCHAR(8),
    endereco VARCHAR(100),
    numero VARCHAR(20),
    complemento VARCHAR(100),
    bairro VARCHAR(100),
    cidade VARCHAR(100),
    uf VARCHAR(2),
    pais VARCHAR(100),
    email VARCHAR(100),
    telefone VARCHAR(12)
);

CREATE TABLE IF NOT EXISTS estoque_certo.espaco (
    espaco_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unidade_organizacional_id UUID NOT NULL,
    nome VARCHAR(100) NOT NULL,
    descricao VARCHAR(255),
    
    CONSTRAINT fk_espaco_unidade FOREIGN KEY (unidade_organizacional_id) 
        REFERENCES estoque_certo.unidade_organizacional (unidade_organizacional_id) ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS estoque_certo.usuario (
    usuario_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unidade_organizacional_id UUID NOT NULL,
    username VARCHAR(12) NOT NULL,
    senha VARCHAR(255) NOT NULL,
    nome VARCHAR(100) NOT NULL,
    perfil INTEGER NOT NULL,
    valido BOOLEAN NOT NULL DEFAULT FALSE,
    
    CONSTRAINT uk_usuario_username_unidade UNIQUE (username, unidade_organizacional_id),
    
    CONSTRAINT fk_usuario_unidade FOREIGN KEY (unidade_organizacional_id) 
        REFERENCES estoque_certo.unidade_organizacional (unidade_organizacional_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS estoque_certo.item_estoque (
    item_estoque_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unidade_organizacional_id UUID NOT NULL,
    espaco_id UUID NOT NULL,
    descricao VARCHAR(255) NOT NULL,
    tipo_unidade_medida INTEGER NOT NULL,
    quantidade NUMERIC(18,3) NOT NULL DEFAULT 0,
    
    CONSTRAINT fk_item_unidade FOREIGN KEY (unidade_organizacional_id) 
        REFERENCES estoque_certo.unidade_organizacional (unidade_organizacional_id) ON DELETE CASCADE,
        
    CONSTRAINT fk_item_espaco FOREIGN KEY (espaco_id) 
        REFERENCES estoque_certo.espaco (espaco_id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS estoque_certo.historico (
    historico_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_estoque_id UUID NOT NULL,
    usuario_id UUID NOT NULL,
    tipo_movimentacao INTEGER NOT NULL,
    data_hora TIMESTAMP NOT NULL DEFAULT NOW(),
    quantidade_anterior NUMERIC(18,3) NOT NULL,
    quantidade_resultante NUMERIC(18,3) NOT NULL,
    espaco_origem_id UUID,
    espaco_destino_id UUID,
    
    CONSTRAINT fk_historico_item FOREIGN KEY (item_estoque_id) 
        REFERENCES estoque_certo.item_estoque (item_estoque_id) ON DELETE CASCADE,
        
    CONSTRAINT fk_historico_usuario FOREIGN KEY (usuario_id) 
        REFERENCES estoque_certo.usuario (usuario_id) ON DELETE SET NULL
);

CREATE TABLE estoque_certo.codigo_acesso (
    usuario_id UUID NOT NULL REFERENCES estoque_certo.usuario(usuario_id) ON DELETE CASCADE,
    codigo VARCHAR(6) NOT NULL,
    data_solicitacao TIMESTAMP NOT NULL DEFAULT NOW(),
    data_validacao TIMESTAMP NULL,
    utilizado BOOLEAN NOT NULL DEFAULT FALSE,
    codigo_reset_id VARCHAR(100) NULL,
    data_reset_id TIMESTAMP NULL,       
    reset_efetuado BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (usuario_id, codigo, data_solicitacao)
);