-- docker run --name pg-pedido-certo-ai -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=admin -e POSTGRES_DB=pedido_certo_ai -p 5432:5432 -d postgres:latest

-- docker run --name pg-pedido-certo-ai -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=admin -e POSTGRES_DB=pedido_certo_ai -p 5432:5432 -d postgres:latest

CREATE SCHEMA IF NOT EXISTS pedido_certo_ai;

-- ==========================================
-- 1. USUÁRIOS E ACESSOS
-- ==========================================
CREATE TABLE IF NOT EXISTS pedido_certo_ai.usuario (
    usuario_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(12) NOT NULL,
    senha VARCHAR(255) NOT NULL,
    nome VARCHAR(100) NOT NULL,
    perfil INTEGER NOT NULL DEFAULT 2,
    cadastro_completo BOOLEAN NOT NULL DEFAULT FALSE,
    jornada_usuario INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT uk_usuario_username UNIQUE (username)
);

CREATE TABLE IF NOT EXISTS pedido_certo_ai.codigo_acesso (
    usuario_id UUID NOT NULL REFERENCES pedido_certo_ai.usuario(usuario_id) ON DELETE CASCADE,
    codigo VARCHAR(6) NOT NULL,
    data_solicitacao TIMESTAMP NOT NULL DEFAULT NOW(),
    data_validacao TIMESTAMP NULL,
    utilizado BOOLEAN NOT NULL DEFAULT FALSE,
    codigo_reset_id VARCHAR(100) NULL,
    data_reset_id TIMESTAMP NULL,
    reset_efetuado BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (usuario_id, codigo, data_solicitacao)
);

-- ==========================================
-- 2. CADASTROS BÁSICOS (CLIENTES E FORNECEDORES)
-- ==========================================
CREATE TABLE IF NOT EXISTS pedido_certo_ai.cliente (
    cliente_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    razao_social VARCHAR(150) NOT NULL,
    fantasia VARCHAR(150) NOT NULL,
    cnpj VARCHAR(14) NOT NULL,
    inscricao_estadual VARCHAR(30) NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_cliente_cnpj_preenchido ON pedido_certo_ai.cliente (cnpj) WHERE cnpj <> '';

CREATE TABLE IF NOT EXISTS pedido_certo_ai.cliente_endereco (
    cliente_endereco_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID NOT NULL REFERENCES pedido_certo_ai.cliente(cliente_id) ON DELETE CASCADE,
    logradouro VARCHAR(255) NOT NULL,
    numero VARCHAR(20) NOT NULL,
    complemento VARCHAR(100) NULL,
    bairro VARCHAR(100) NOT NULL,
    cidade VARCHAR(100) NOT NULL,
    uf VARCHAR(2) NOT NULL,
    cep VARCHAR(20) NOT NULL,
    "default" BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS pedido_certo_ai.cliente_contato (
    cliente_contato_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID NOT NULL REFERENCES pedido_certo_ai.cliente(cliente_id) ON DELETE CASCADE,
    tipo_contato INTEGER NOT NULL,
    valor VARCHAR(150) NOT NULL,
    "default" BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE UNIQUE INDEX IF NOT EXISTS uk_cliente_contato_default_por_tipo ON pedido_certo_ai.cliente_contato (cliente_id, tipo_contato) WHERE "default" = TRUE;

CREATE TABLE IF NOT EXISTS pedido_certo_ai.fornecedor (
    fornecedor_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    razao_social VARCHAR(150) NOT NULL,
    fantasia VARCHAR(150) NOT NULL,
    cnpj VARCHAR(14) NOT NULL,
    inscricao_estadual VARCHAR(30) NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_fornecedor_cnpj_preenchido ON pedido_certo_ai.fornecedor (cnpj) WHERE cnpj <> '';

CREATE TABLE IF NOT EXISTS pedido_certo_ai.fornecedor_endereco (
    fornecedor_endereco_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fornecedor_id UUID NOT NULL REFERENCES pedido_certo_ai.fornecedor(fornecedor_id) ON DELETE CASCADE,
    logradouro VARCHAR(255) NOT NULL,
    numero VARCHAR(10) NOT NULL,
    complemento VARCHAR(100) NULL,
    bairro VARCHAR(100) NOT NULL,
    cidade VARCHAR(100) NOT NULL,
    uf VARCHAR(2) NOT NULL,
    cep VARCHAR(20) NOT NULL,
    "default" BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS pedido_certo_ai.fornecedor_contato (
    fornecedor_contato_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fornecedor_id UUID NOT NULL REFERENCES pedido_certo_ai.fornecedor(fornecedor_id) ON DELETE CASCADE,
    tipo_contato INTEGER NOT NULL,
    valor VARCHAR(150) NOT NULL,
    "default" BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE UNIQUE INDEX IF NOT EXISTS uk_fornecedor_contato_default_por_tipo ON pedido_certo_ai.fornecedor_contato (fornecedor_id, tipo_contato) WHERE "default" = TRUE;


-- ==========================================
-- 3. DESENVOLVIMENTO (LINHAS E REFERÊNCIAS)
-- ==========================================
CREATE TABLE IF NOT EXISTS pedido_certo_ai.linha (
    linha_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    linha VARCHAR(2) NOT NULL,
    numero_inicial SMALLINT NOT NULL,
    numero_final SMALLINT NOT NULL,
    categoria SMALLINT NOT NULL,
    genero SMALLINT NOT NULL,
    exclusiva BOOLEAN NOT NULL DEFAULT FALSE,
    cliente_id UUID NULL REFERENCES pedido_certo_ai.cliente(cliente_id) ON DELETE SET NULL,
    processo_produtivo SMALLINT NOT NULL,
    fabricante_id UUID NULL REFERENCES pedido_certo_ai.fornecedor(fornecedor_id) ON DELETE SET NULL,
    rendimento NUMERIC(15, 2) NOT NULL DEFAULT 0,
    CONSTRAINT ck_linha_numeros CHECK (linha ~ '^[0-9]{2}$')
);

CREATE TABLE IF NOT EXISTS pedido_certo_ai.cor (
    cor_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cor_descricao VARCHAR(100) NOT NULL,
    cor_codigo VARCHAR(30) NOT NULL
);

CREATE TABLE IF NOT EXISTS pedido_certo_ai.referencia (
    referencia_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    linha_id UUID NOT NULL REFERENCES pedido_certo_ai.linha(linha_id) ON DELETE RESTRICT,
    numero_referencia INTEGER NOT NULL,
    referencia VARCHAR(30) NOT NULL,
    sigla VARCHAR(10) NOT NULL DEFAULT '',
    observacao VARCHAR(500) NULL,
    data_criacao TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_referencia_linha_numero ON pedido_certo_ai.referencia (linha_id, numero_referencia);

CREATE TABLE IF NOT EXISTS pedido_certo_ai.referencia_cor (
    referencia_id UUID NOT NULL REFERENCES pedido_certo_ai.referencia(referencia_id) ON DELETE CASCADE,
    cor_id UUID NOT NULL REFERENCES pedido_certo_ai.cor(cor_id) ON DELETE RESTRICT,
    PRIMARY KEY (referencia_id, cor_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_referencia_cor_referencia_cor ON pedido_certo_ai.referencia_cor (referencia_id, cor_id);

CREATE TABLE IF NOT EXISTS pedido_certo_ai.referencia_desenho (
    referencia_desenho_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referencia_id UUID NOT NULL REFERENCES pedido_certo_ai.referencia(referencia_id) ON DELETE CASCADE,
    referencia_desenho_link_id VARCHAR(300) NOT NULL,
    desenho_original BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS pedido_certo_ai.referencia_prototipo (
    referencia_prototipo_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referencia_id UUID NOT NULL REFERENCES pedido_certo_ai.referencia(referencia_id) ON DELETE CASCADE,
    referencia_desenho_id UUID NOT NULL REFERENCES pedido_certo_ai.referencia_desenho(referencia_desenho_id) ON DELETE CASCADE,
    cor_id UUID NOT NULL REFERENCES pedido_certo_ai.cor(cor_id) ON DELETE RESTRICT,
    CONSTRAINT ux_referencia_prototipo_referencia_cor UNIQUE (referencia_id, cor_id)
);

CREATE TABLE IF NOT EXISTS pedido_certo_ai.materia_prima (
    materia_prima_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    descricao VARCHAR(150) NOT NULL,
    unidade INTEGER NOT NULL,
    estoque NUMERIC(12, 3) NOT NULL DEFAULT 0,
    preco NUMERIC(12, 2) NOT NULL DEFAULT 0,
    data_criacao TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_materia_prima_descricao ON pedido_certo_ai.materia_prima (descricao);


-- ==========================================
-- 4. PEDIDOS, AGENDAS E PROGRAMAÇÃO
-- ==========================================
CREATE TABLE IF NOT EXISTS pedido_certo_ai.agenda (
    agenda_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data DATE NOT NULL,
    util BOOLEAN NOT NULL DEFAULT TRUE,
    motivo VARCHAR(100) NULL,
    data_criacao TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pedido_certo_ai.pedido (
    pedido_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_link_id VARCHAR(500) NULL,
    usuario_id UUID NULL REFERENCES pedido_certo_ai.usuario(usuario_id) ON DELETE SET NULL,
    cliente_id UUID NULL REFERENCES pedido_certo_ai.cliente(cliente_id) ON DELETE SET NULL,
    fornecedor_id UUID NULL REFERENCES pedido_certo_ai.fornecedor(fornecedor_id) ON DELETE SET NULL,
    numero_pedido VARCHAR(50) NULL,
    data_emissao TIMESTAMP NULL,
    data_faturamento TIMESTAMP NULL,
    condicao_pagamento VARCHAR(100) NULL,
    representante VARCHAR(100) NULL,
    percentual_desconto NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total_pares INTEGER NOT NULL DEFAULT 0,
    total_bruto NUMERIC(12, 2) NOT NULL DEFAULT 0,
    valor_desconto NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total_liquido NUMERIC(12, 2) NOT NULL DEFAULT 0,
    observacoes VARCHAR(1000) NULL,
    status INTEGER NOT NULL DEFAULT 1,
    data_criacao TIMESTAMP NOT NULL DEFAULT NOW(),
    data_processado TIMESTAMP NULL
);

CREATE TABLE IF NOT EXISTS pedido_certo_ai.pedido_avaliacao_gestor (
    pedido_avaliacao_gestor_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID NOT NULL REFERENCES pedido_certo_ai.pedido(pedido_id) ON DELETE CASCADE,
    aprovado BOOLEAN NOT NULL DEFAULT FALSE,
    nota INTEGER NOT NULL,
    motivo VARCHAR(1000) NULL,
    prompt VARCHAR(1000) NULL,
    solicita_revisao BOOLEAN NOT NULL DEFAULT FALSE,
    data_avaliacao TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_pedido_avaliacao_gestor_nota CHECK (nota BETWEEN 1 AND 5)
);

CREATE TABLE IF NOT EXISTS pedido_certo_ai.pedido_item (
    pedido_item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID NOT NULL REFERENCES pedido_certo_ai.pedido(pedido_id) ON DELETE CASCADE,
    sequencia INTEGER NOT NULL DEFAULT 0,
    referencia VARCHAR(100) NOT NULL,
    material_cor VARCHAR(150) NOT NULL,
    quantidade INTEGER NOT NULL DEFAULT 0,
    valor_unitario NUMERIC(12, 2) NOT NULL DEFAULT 0,
    valor_total NUMERIC(12, 2) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS pedido_certo_ai.pedido_item_grade (
    pedido_item_grade_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_item_id UUID NOT NULL REFERENCES pedido_certo_ai.pedido_item(pedido_item_id) ON DELETE CASCADE,
    numeracao VARCHAR(20) NOT NULL,
    quantidade INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS pedido_certo_ai.programacao (
    programacao_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agenda_id UUID NOT NULL REFERENCES pedido_certo_ai.agenda(agenda_id) ON DELETE CASCADE,
    pedido_id UUID NOT NULL REFERENCES pedido_certo_ai.pedido(pedido_id) ON DELETE CASCADE,
    quantidade INTEGER NOT NULL DEFAULT 0
);


-- novas atualizações para desenvolvimento

CREATE TABLE IF NOT EXISTS pedido_certo_ai.linha (
    linha_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    linha INTEGER NOT NULL,
    numero_inicial SMALLINT NOT NULL,
    numero_final SMALLINT NOT NULL,
    categoria SMALLINT NOT NULL,
    genero SMALLINT NOT NULL,
    exclusiva BOOLEAN NOT NULL DEFAULT FALSE,
    cliente_id UUID NULL REFERENCES pedido_certo_ai.cliente(cliente_id) ON DELETE SET NULL,
    processo_produtivo SMALLINT NOT NULL,
    fabricante_id UUID NULL REFERENCES pedido_certo_ai.fornecedor(fornecedor_id) ON DELETE SET NULL,
    rendimento NUMERIC(15, 2) NOT NULL DEFAULT 0
);

ALTER TABLE pedido_certo_ai.linha
ADD COLUMN IF NOT EXISTS cliente_id UUID NULL REFERENCES pedido_certo_ai.cliente(cliente_id) ON DELETE SET NULL;

DROP INDEX IF EXISTS pedido_certo_ai.ux_linha_linha;
DROP INDEX IF EXISTS pedido_certo_ai.ux_linha_linha_marca_cliente;

CREATE TABLE IF NOT EXISTS pedido_certo_ai.cor (
    cor_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cor_descricao VARCHAR(100) NOT NULL,
    cor_codigo VARCHAR(30) NOT NULL
);

CREATE TABLE IF NOT EXISTS pedido_certo_ai.referencia (
    referencia_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    linha_id UUID NOT NULL REFERENCES pedido_certo_ai.linha(linha_id) ON DELETE RESTRICT,
    numero_referencia INTEGER NOT NULL,
    referencia VARCHAR(30) NOT NULL,
    sigla VARCHAR(10) NOT NULL DEFAULT '',
    observacao VARCHAR(500) NULL,
    data_criacao TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE pedido_certo_ai.referencia
ADD COLUMN IF NOT EXISTS observacao VARCHAR(500) NULL;

ALTER TABLE pedido_certo_ai.referencia
ADD COLUMN IF NOT EXISTS sigla VARCHAR(10) NOT NULL DEFAULT '';

CREATE UNIQUE INDEX IF NOT EXISTS ux_referencia_linha_numero
ON pedido_certo_ai.referencia (linha_id, numero_referencia);

CREATE TABLE IF NOT EXISTS pedido_certo_ai.referencia_cor (
    referencia_id UUID NOT NULL REFERENCES pedido_certo_ai.referencia(referencia_id) ON DELETE CASCADE,
    cor_id UUID NOT NULL REFERENCES pedido_certo_ai.cor(cor_id) ON DELETE RESTRICT,
    PRIMARY KEY (referencia_id, cor_id)
);

ALTER TABLE pedido_certo_ai.referencia_cor
DROP CONSTRAINT IF EXISTS referencia_cor_pkey;

ALTER TABLE pedido_certo_ai.referencia_cor
DROP COLUMN IF EXISTS referencia_cor_id;

ALTER TABLE pedido_certo_ai.referencia_cor
DROP COLUMN IF EXISTS referencia_cor;

ALTER TABLE pedido_certo_ai.referencia_cor
ADD PRIMARY KEY (referencia_id, cor_id);

CREATE UNIQUE INDEX IF NOT EXISTS ux_referencia_cor_referencia_cor
ON pedido_certo_ai.referencia_cor (referencia_id, cor_id);

DROP TABLE IF EXISTS pedido_certo_ai.referencia_desenho_arquivo;
DROP TABLE IF EXISTS pedido_certo_ai.referencia_prototipo;
DROP TABLE IF EXISTS pedido_certo_ai.referencia_desenho;

CREATE TABLE IF NOT EXISTS pedido_certo_ai.referencia_desenho (
    referencia_desenho_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referencia_id UUID NOT NULL REFERENCES pedido_certo_ai.referencia(referencia_id) ON DELETE CASCADE,
    referencia_desenho_link_id VARCHAR(300) NOT NULL,
    desenho_original BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS pedido_certo_ai.referencia_prototipo (
    referencia_prototipo_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referencia_id UUID NOT NULL REFERENCES pedido_certo_ai.referencia(referencia_id) ON DELETE CASCADE,
    referencia_desenho_id UUID NOT NULL REFERENCES pedido_certo_ai.referencia_desenho(referencia_desenho_id) ON DELETE CASCADE,
    cor_id UUID NOT NULL REFERENCES pedido_certo_ai.cor(cor_id) ON DELETE RESTRICT,
    CONSTRAINT ux_referencia_prototipo_referencia_cor UNIQUE (referencia_id, cor_id)
);

CREATE TABLE IF NOT EXISTS pedido_certo_ai.materia_prima (
    materia_prima_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    descricao VARCHAR(150) NOT NULL,
    unidade INTEGER NOT NULL,
    estoque NUMERIC(12, 3) NOT NULL DEFAULT 0,
    preco NUMERIC(12, 2) NOT NULL DEFAULT 0,
    data_criacao TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_materia_prima_descricao
ON pedido_certo_ai.materia_prima (descricao);




-- updates para uso da linha string

ALTER TABLE pedido_certo_ai.linha ALTER COLUMN linha TYPE VARCHAR(2);
ALTER TABLE pedido_certo_ai.linha ADD CONSTRAINT ck_linha_numeros CHECK (linha ~ '^[0-9]{2}$');