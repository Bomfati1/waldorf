
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);

CREATE TYPE public.meio_de_contato AS ENUM (
    'Indicação',
    'Google',
    'Instagram',
    'Facebook',
    'Outros'
);

CREATE TYPE public.periodo_enum AS ENUM (
    'Manhã',
    'Tarde',
    'Noite'
);

CREATE TYPE public.status_aluno_enum AS ENUM (
    'Ativo',
    'Inativo'
);

CREATE TYPE public.status_enum AS ENUM (
    'P',
    'F',
    'FJ'
);

CREATE TYPE public.status_interesse AS ENUM (
    'Entrou em contato',
    'Conversando',
    'Visita agendada',
    'Perdido',
    'Ganho'
);

CREATE TYPE public.status_negociacao AS ENUM (
    'Entrou Em Contato',
    'Conversando',
    'Negociando',
    'Visita Agendada',
    'Ganho',
    'Perdido'
);

CREATE TYPE public.status_pagamento_enum AS ENUM (
    'Integral',
    'Bolsista'
);

CREATE TYPE public.status_planejamento AS ENUM (
    'Pendente',
    'Aprovado',
    'Reprovado'
);

CREATE TYPE public.tipo_periodo AS ENUM (
    'manha',
    'tarde',
    'integral'
);

CREATE TYPE public.user_role AS ENUM (
    'Administrador Geral',
    'Administrador Pedagógico',
    'Professor',
    'professor'
);

CREATE FUNCTION public.atualizar_data_modificacao() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.data_modificacao = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

CREATE TABLE public.aluno_anexos (
    id integer NOT NULL,
    aluno_id integer NOT NULL,
    nome_original character varying(255) NOT NULL,
    caminho_arquivo text NOT NULL,
    tamanho integer,
    data_upload timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE public.aluno_anexos IS 'Armazena documentos e anexos dos alunos (apenas caminho e metadados)';

COMMENT ON COLUMN public.aluno_anexos.aluno_id IS 'ID do aluno (FK para tabela alunos)';

COMMENT ON COLUMN public.aluno_anexos.nome_original IS 'Nome original do arquivo enviado';

COMMENT ON COLUMN public.aluno_anexos.caminho_arquivo IS 'Caminho relativo do arquivo no servidor (/uploads/anexos_aluno/...)';

COMMENT ON COLUMN public.aluno_anexos.tamanho IS 'Tamanho do arquivo em bytes';

COMMENT ON COLUMN public.aluno_anexos.data_upload IS 'Data e hora do upload';

CREATE SEQUENCE public.aluno_anexos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.aluno_anexos_id_seq OWNED BY public.aluno_anexos.id;

CREATE TABLE public.alunos (
    id integer NOT NULL,
    nome_completo character varying(255) NOT NULL,
    data_nascimento date NOT NULL,
    informacoes_saude text,
    status_pagamento public.status_pagamento_enum DEFAULT 'Integral'::public.status_pagamento_enum NOT NULL,
    status_aluno boolean DEFAULT false NOT NULL,
    familia_id integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    foto_perfil character varying(255)
);

CREATE SEQUENCE public.alunos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.alunos_id_seq OWNED BY public.alunos.id;

CREATE TABLE public.familias (
    id integer NOT NULL,
    nome_completo character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    telefone character varying(20) NOT NULL,
    outro_telefone character varying(20),
    data_cadastro timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    rg character varying(20),
    cpf character varying(14),
    cpf_normalizado text GENERATED ALWAYS AS (regexp_replace((cpf)::text, '[^0-9]'::text, ''::text, 'g'::text)) STORED,
    cidade character varying(100),
    bairro character varying(100),
    tipo_logradouro character varying(50),
    logradouro character varying(200),
    numero character varying(20),
    complemento character varying(100)
);

COMMENT ON COLUMN public.familias.cpf IS 'CPF do responsável (formato: XXX.XXX.XXX-XX ou apenas números)';

COMMENT ON COLUMN public.familias.cpf_normalizado IS 'CPF do responsável normalizado (apenas dígitos), gerado automaticamente a partir de cpf';

COMMENT ON COLUMN public.familias.cidade IS 'Cidade onde o responsável reside';

COMMENT ON COLUMN public.familias.bairro IS 'Bairro do endereço do responsável';

COMMENT ON COLUMN public.familias.tipo_logradouro IS 'Tipo de logradouro (Rua, Avenida, Travessa, etc.)';

COMMENT ON COLUMN public.familias.logradouro IS 'Nome da rua/avenida/travessa';

COMMENT ON COLUMN public.familias.numero IS 'Número do imóvel';

COMMENT ON COLUMN public.familias.complemento IS 'Complemento do endereço (Apt, Bloco, Casa, etc.)';

CREATE SEQUENCE public.familias_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.familias_id_seq OWNED BY public.familias.id;

CREATE TABLE public.interessados (
    id integer NOT NULL,
    nome character varying(255) NOT NULL,
    telefone character varying(20),
    como_conheceu public.meio_de_contato,
    intencao boolean,
    data_contato date,
    status public.status_negociacao,
    data_criacao timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE public.interessados IS 'Tabela para armazenar informações de leads e interessados.';

COMMENT ON COLUMN public.interessados.id IS 'Identificador único para cada interessado (gerado automaticamente).';

COMMENT ON COLUMN public.interessados.nome IS 'Nome completo do contato.';

COMMENT ON COLUMN public.interessados.telefone IS 'Número de telefone do contato.';

COMMENT ON COLUMN public.interessados.como_conheceu IS 'Canal pelo qual o interessado conheceu a empresa.';

COMMENT ON COLUMN public.interessados.intencao IS 'Indica se o contato tem intenção de compra (true/false).';

COMMENT ON COLUMN public.interessados.data_contato IS 'Data do primeiro contato com o interessado.';

COMMENT ON COLUMN public.interessados.status IS 'Status atual do relacionamento ou negociação com o interessado.';

COMMENT ON COLUMN public.interessados.data_criacao IS 'Data e hora em que o registro foi inserido no banco de dados.';

CREATE SEQUENCE public.interessados_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.interessados_id_seq OWNED BY public.interessados.id;

CREATE TABLE public.notificacoes (
    id integer NOT NULL,
    usuario_id integer NOT NULL,
    tipo character varying(50) NOT NULL,
    mensagem text NOT NULL,
    planejamento_id integer,
    lida boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE public.notificacoes IS 'Armazena notificações para usuários sobre ações no sistema';

COMMENT ON COLUMN public.notificacoes.tipo IS 'Tipo da notificação: anexo_adicionado, comentario, aprovado, reprovado';

COMMENT ON COLUMN public.notificacoes.lida IS 'Indica se a notificação foi lida pelo usuário';

CREATE SEQUENCE public.notificacoes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.notificacoes_id_seq OWNED BY public.notificacoes.id;

CREATE TABLE public.planejamento_anexos (
    id_anexo integer NOT NULL,
    planejamento_id integer NOT NULL,
    nome_arquivo character varying(255) NOT NULL,
    path_arquivo character varying(1024) NOT NULL,
    data_upload timestamp with time zone DEFAULT now() NOT NULL
);

CREATE SEQUENCE public.planejamento_anexos_id_anexo_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.planejamento_anexos_id_anexo_seq OWNED BY public.planejamento_anexos.id_anexo;

CREATE TABLE public.planejamento_comentarios (
    id_comentario integer NOT NULL,
    planejamento_id integer NOT NULL,
    usuario_id integer NOT NULL,
    texto_comentario text NOT NULL,
    data_comentario timestamp with time zone DEFAULT now() NOT NULL
);

CREATE SEQUENCE public.planejamento_comentarios_id_comentario_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.planejamento_comentarios_id_comentario_seq OWNED BY public.planejamento_comentarios.id_comentario;

CREATE TABLE public.planejamentos (
    id_planejamento integer NOT NULL,
    turma_id integer NOT NULL,
    ano smallint NOT NULL,
    mes smallint NOT NULL,
    status public.status_planejamento DEFAULT 'Pendente'::public.status_planejamento NOT NULL,
    data_criacao timestamp with time zone DEFAULT now() NOT NULL,
    data_modificacao timestamp with time zone DEFAULT now() NOT NULL,
    usuario_id integer,
    CONSTRAINT planejamentos_mes_check CHECK (((mes >= 1) AND (mes <= 12)))
);

COMMENT ON TABLE public.planejamentos IS 'Armazena planejamentos mensais das turmas';

COMMENT ON COLUMN public.planejamentos.ano IS 'Ano do planejamento';

COMMENT ON COLUMN public.planejamentos.mes IS 'Mês do planejamento (1-12)';

CREATE SEQUENCE public.planejamentos_id_planejamento_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.planejamentos_id_planejamento_seq OWNED BY public.planejamentos.id_planejamento;

CREATE TABLE public.presencas (
    id_presenca integer NOT NULL,
    aluno_id integer NOT NULL,
    turma_id integer NOT NULL,
    data_aula date NOT NULL,
    status_presenca public.status_enum NOT NULL,
    observacao character varying(255)
);

CREATE SEQUENCE public.presencas_id_presenca_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.presencas_id_presenca_seq OWNED BY public.presencas.id_presenca;

CREATE TABLE public.relatorios (
    id integer NOT NULL,
    nome_arquivo character varying(255) NOT NULL,
    nome_original character varying(255) NOT NULL,
    tipo_mime character varying(100),
    tamanho_bytes bigint,
    data_upload timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    tipo_destino character varying(10) NOT NULL,
    destino_id integer NOT NULL,
    caminho_arquivo character varying(500) NOT NULL,
    CONSTRAINT relatorios_tipo_destino_check CHECK (((tipo_destino)::text = ANY ((ARRAY['aluno'::character varying, 'turma'::character varying])::text[])))
);

COMMENT ON TABLE public.relatorios IS 'Tabela para associar relatórios (arquivos) a alunos ou turmas';

COMMENT ON COLUMN public.relatorios.tipo_destino IS 'Tipo do destino: aluno ou turma';

COMMENT ON COLUMN public.relatorios.destino_id IS 'ID do aluno ou turma dependendo do tipo_destino';

COMMENT ON COLUMN public.relatorios.caminho_arquivo IS 'Caminho relativo do arquivo no sistema de arquivos';

CREATE SEQUENCE public.relatorios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.relatorios_id_seq OWNED BY public.relatorios.id;

CREATE TABLE public.turma_alunos (
    id integer NOT NULL,
    aluno_id integer NOT NULL,
    turma_id integer NOT NULL,
    data_matricula timestamp with time zone DEFAULT now()
);

COMMENT ON TABLE public.turma_alunos IS 'Tabela de associação para matricular alunos em turmas.';

COMMENT ON COLUMN public.turma_alunos.aluno_id IS 'Referência ao ID do aluno. Um aluno só pode estar em uma turma por vez.';

COMMENT ON COLUMN public.turma_alunos.turma_id IS 'Referência ao ID da turma.';

COMMENT ON COLUMN public.turma_alunos.data_matricula IS 'Data e hora em que a matrícula foi efetuada.';

CREATE SEQUENCE public.turma_alunos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.turma_alunos_id_seq OWNED BY public.turma_alunos.id;

CREATE TABLE public.turma_professores (
    turma_id integer NOT NULL,
    usuario_id integer NOT NULL
);

CREATE TABLE public.turmas (
    id integer NOT NULL,
    nome_turma character varying(100) NOT NULL,
    ano_letivo integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    periodo public.tipo_periodo,
    nivel character varying(20) DEFAULT 'jardim'::character varying NOT NULL,
    CONSTRAINT nivel_check CHECK (((nivel)::text = ANY ((ARRAY['jardim'::character varying, 'maternal'::character varying, 'fundamental'::character varying])::text[])))
);

COMMENT ON COLUMN public.turmas.nivel IS 'Nível de ensino: jardim, maternal ou fundamental';

CREATE SEQUENCE public.turmas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.turmas_id_seq OWNED BY public.turmas.id;

CREATE TABLE public.usuarios (
    id integer NOT NULL,
    nome character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    senha character varying(255) NOT NULL,
    cargo public.user_role DEFAULT 'Professor'::public.user_role NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    foto_perfil character varying(255)
);

CREATE SEQUENCE public.usuarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.usuarios_id_seq OWNED BY public.usuarios.id;

ALTER TABLE ONLY public.aluno_anexos ALTER COLUMN id SET DEFAULT nextval('public.aluno_anexos_id_seq'::regclass);

ALTER TABLE ONLY public.alunos ALTER COLUMN id SET DEFAULT nextval('public.alunos_id_seq'::regclass);

ALTER TABLE ONLY public.familias ALTER COLUMN id SET DEFAULT nextval('public.familias_id_seq'::regclass);

ALTER TABLE ONLY public.interessados ALTER COLUMN id SET DEFAULT nextval('public.interessados_id_seq'::regclass);

ALTER TABLE ONLY public.notificacoes ALTER COLUMN id SET DEFAULT nextval('public.notificacoes_id_seq'::regclass);

ALTER TABLE ONLY public.planejamento_anexos ALTER COLUMN id_anexo SET DEFAULT nextval('public.planejamento_anexos_id_anexo_seq'::regclass);

ALTER TABLE ONLY public.planejamento_comentarios ALTER COLUMN id_comentario SET DEFAULT nextval('public.planejamento_comentarios_id_comentario_seq'::regclass);

ALTER TABLE ONLY public.planejamentos ALTER COLUMN id_planejamento SET DEFAULT nextval('public.planejamentos_id_planejamento_seq'::regclass);

ALTER TABLE ONLY public.presencas ALTER COLUMN id_presenca SET DEFAULT nextval('public.presencas_id_presenca_seq'::regclass);

ALTER TABLE ONLY public.relatorios ALTER COLUMN id SET DEFAULT nextval('public.relatorios_id_seq'::regclass);

ALTER TABLE ONLY public.turma_alunos ALTER COLUMN id SET DEFAULT nextval('public.turma_alunos_id_seq'::regclass);

ALTER TABLE ONLY public.turmas ALTER COLUMN id SET DEFAULT nextval('public.turmas_id_seq'::regclass);

ALTER TABLE ONLY public.usuarios ALTER COLUMN id SET DEFAULT nextval('public.usuarios_id_seq'::regclass);

COPY public.aluno_anexos (id, aluno_id, nome_original, caminho_arquivo, tamanho, data_upload) FROM stdin;
2	46	declaracao-matricula.pdf	/uploads/anexos_aluno/1768386714546_declaracao_matricula.pdf	21838	2026-01-14 07:31:54.550243
\.

COPY public.alunos (id, nome_completo, data_nascimento, informacoes_saude, status_pagamento, status_aluno, familia_id, created_at, foto_perfil) FROM stdin;
54	Clara	2024-05-21	aaa	Bolsista	t	58	2025-11-04 05:10:26.994438-03	\N
66	Davi	2015-05-23	aaa	Integral	t	69	2025-11-04 05:21:20.72814-03	\N
70	Enrico	2013-02-23	aaa	Integral	t	71	2025-11-04 05:24:22.07624-03	\N
68	Flora	2024-01-12	aaaaa	Integral	t	70	2025-11-04 05:22:32.128814-03	\N
57	Frederick	2020-04-12	aaaa	Integral	t	61	2025-11-04 05:13:20.196242-03	\N
88	Gabriella	2004-12-12	ALERGIA	Integral	t	86	2025-11-04 05:39:14.371402-03	\N
97	Matheus Bomfati Lemes	2002-12-21	aaa	Integral	t	42	2026-01-14 04:57:05.949437-03	\N
78	Gea	2021-02-15	aaa	Integral	t	78	2025-11-04 05:32:07.76762-03	\N
83	Guilherme	2022-12-23	aaaa	Integral	t	83	2025-11-04 05:36:23.697034-03	\N
98	Matheus Bomfati Lemes	2003-05-28	aaaaa	Bolsista	t	97	2026-01-14 10:56:49.376054-03	\N
61	Iasmin	2002-03-23		Integral	t	65	2025-11-04 05:17:18.91352-03	\N
93	Italo	2020-12-12	aaaa	Integral	t	90	2025-11-04 05:42:48.276563-03	\N
51	Joao	2024-02-26	aa	Bolsista	t	55	2025-11-04 05:06:40.457962-03	\N
52	Sarah	2021-03-22	aaa	Bolsista	f	56	2025-11-04 05:07:39.907967-03	\N
89	Joaquim	2012-02-12	aaaa	Integral	t	57	2025-11-04 05:40:07.906326-03	\N
55	Zoe	2003-04-24	aaa	Integral	f	59	2025-11-04 05:11:17.770818-03	\N
81	Laura	2020-10-21	aaaa	Integral	t	81	2025-11-04 05:34:47.203365-03	\N
84	Laura	2023-12-12	aa	Integral	t	83	2025-11-04 05:36:37.017937-03	\N
60	Laura	2020-02-23	aaaaa	Integral	t	64	2025-11-04 05:16:15.271678-03	\N
56	Valentim	2003-12-03	aaa	Bolsista	f	60	2025-11-04 05:12:21.127956-03	\N
74	Leonardo	2004-12-12	aaaa	Integral	t	75	2025-11-04 05:29:37.699804-03	\N
85	Levi	2024-12-12	aaa	Integral	t	84	2025-11-04 05:37:10.855913-03	\N
80	Lua	2012-03-23		Integral	t	80	2025-11-04 05:33:54.98225-03	\N
91	Lucas	2020-12-12	aaa	Integral	t	88	2025-11-04 05:41:30.2639-03	\N
59	Luiza	2020-12-15	aaa	Integral	t	63	2025-11-04 05:15:28.217663-03	\N
87	Maju	2021-03-23	aaaa	Integral	t	85	2025-11-04 05:38:23.067385-03	\N
94	Marina	2020-10-22	aaaa	Integral	t	82	2025-11-04 05:43:34.303422-03	\N
72	Martin	2022-11-23	aaa	Integral	t	73	2025-11-04 05:27:57.058795-03	\N
77	Matteo	2015-02-21	aaaa	Integral	t	77	2025-11-04 05:31:23.044281-03	\N
90	Maya	2020-11-12	aaaa	Integral	t	87	2025-11-04 05:40:50.675735-03	\N
76	Miguel	2003-11-12	aaa	Integral	t	76	2025-11-04 05:30:40.622446-03	\N
53	Miguel	2022-03-23	aaa	Bolsista	t	57	2025-11-04 05:09:07.174719-03	\N
49	Nolan	2021-04-24	aaa	Integral	t	54	2025-11-04 05:05:05.437468-03	\N
50	Olivia	2022-12-30	aaa	Integral	t	55	2025-11-04 05:06:13.293346-03	\N
99	Matheus Bomfati Lemes	2003-05-28		Integral	f	59	2026-01-14 11:40:39.48862-03	\N
100	Lucas Rafael Paulino de Oliveira	2002-12-21	aa	Bolsista	f	99	2026-01-15 08:28:22.863531-03	\N
96	Bomfaaas	2003-05-28	add	Bolsista	t	92	2025-11-17 15:07:50.581075-03	\N
46	Albert	2001-02-21	2aaa	Bolsista	t	52	2025-11-04 05:02:20.319314-03	/uploads/aluno_image/aluno_46_1762246781476.jpg
48	Heitor	2020-03-30	aaaa	Integral	t	53	2025-11-04 05:04:27.210982-03	\N
45	Pedro	2021-02-21	aa	Integral	t	51	2025-11-04 05:01:11.255869-03	\N
86	Ariane de Miranda Leal	2019-05-21	aaaa	Integral	t	85	2025-11-04 05:38:06.70504-03	\N
62	Theo	2020-04-26	aaaa	Integral	f	66	2025-11-04 05:18:05.704046-03	\N
64	Alice	2013-12-12	aaa	Integral	t	68	2025-11-04 05:19:21.428968-03	/uploads/aluno_image/aluno_64_1762246795795.webp
47	Gael	2020-12-12	aaa	Integral	t	52	2025-11-04 05:03:26.007538-03	\N
69	Antony	2016-02-22	aaaa	Integral	t	71	2025-11-04 05:23:59.400792-03	\N
71	Alice	2005-05-24	aaaa	Integral	t	72	2025-11-04 05:25:12.889511-03	/uploads/aluno_image/aluno_71_1768398502685.avif
63	Romeo	2012-12-12	aaa	Integral	f	67	2025-11-04 05:18:43.096237-03	\N
73	Thiago	2020-12-22	aaa	Integral	f	74	2025-11-04 05:28:51.788809-03	\N
75	Pedro	2012-12-30	aaaa	Integral	f	76	2025-11-04 05:30:19.801877-03	\N
92	Theodoro	2012-03-12	aaa	Integral	f	89	2025-11-04 05:42:07.523762-03	\N
79	Bento	2012-02-14	aaaaa	Integral	t	79	2025-11-04 05:32:52.426471-03	\N
67	Bento	2013-12-24	aaa	Integral	t	70	2025-11-04 05:22:06.850438-03	\N
82	Caio	2023-12-23	aaaa	Integral	t	82	2025-11-04 05:35:34.303892-03	\N
65	Cecilia	2013-12-13	aaaa	Integral	t	68	2025-11-04 05:20:27.974617-03	\N
58	Cecilia	2019-02-22	aaaa	Integral	t	62	2025-11-04 05:14:38.241154-03	\N
\.

COPY public.familias (id, nome_completo, email, telefone, outro_telefone, data_cadastro, rg, cpf, cidade, bairro, tipo_logradouro, logradouro, numero, complemento) FROM stdin;
42	aaaa	matheusbomfati10@gmail.com	32271938	32271937	2025-11-03 01:05:41.908148-03	\N	26558959089	\N	\N	\N	\N	\N	\N
92	aaaaaaaaaa	michllelee@gmail.com	4244444422		2025-11-17 15:07:50.581075-03	\N	68841845074	\N	\N	\N	\N	\N	\N
53	Bruna	brunaa@gmail.com	42333333333		2025-11-04 05:04:27.210982-03	\N	99052318034	\N	\N	\N	\N	\N	\N
54	Bruno	bruno@gmail.com	4233332222		2025-11-04 05:05:05.437468-03	\N	38026421043	\N	\N	\N	\N	\N	\N
55	Camila Justus	camila@gmail.com	4255555555		2025-11-04 05:06:13.293346-03	\N	00981966004	\N	\N	\N	\N	\N	\N
56	Caroline Paz	caroline@gmail.com	4222222211		2025-11-04 05:07:39.907967-03	\N	82524612040	\N	\N	\N	\N	\N	\N
57	Danielle Schoenberger	danielle@gmail.com	4244444444		2025-11-04 05:09:07.174719-03	\N	55161418001	\N	\N	\N	\N	\N	\N
58	Elaine	elaine@gmail.com	4266666666		2025-11-04 05:10:26.994438-03	\N	64535328080	\N	\N	\N	\N	\N	\N
59	Emanuelle	emauelle@gmail.com	3288888888		2025-11-04 05:11:17.770818-03	\N	80306485028	\N	\N	\N	\N	\N	\N
60	Fabiola Cotian	fabiola@gmail.com	42333333222		2025-11-04 05:12:21.127956-03	\N	85679392089	\N	\N	\N	\N	\N	\N
61	Fabricio	fabricio@gmail.com	4255555555		2025-11-04 05:13:20.196242-03	\N	07696371088	\N	\N	\N	\N	\N	\N
62	Fernanda	fernanda@gmail.com	4299999999		2025-11-04 05:14:38.241154-03	\N	11136365052	\N	\N	\N	\N	\N	\N
63	Fernando	fernando@gmail.com	4288888888		2025-11-04 05:15:28.217663-03	\N	08256946040	\N	\N	\N	\N	\N	\N
64	Heloisa	heloisa@gmail.com	4266666666		2025-11-04 05:16:15.271678-03	\N	32607377072	\N	\N	\N	\N	\N	\N
65	Jamile Salim	jamile@gmail.com	4233333333		2025-11-04 05:17:18.91352-03	\N	00774331062	\N	\N	\N	\N	\N	\N
66	Jefferson de Oliveira	jefferson@gmail.com	42343434343		2025-11-04 05:18:05.704046-03	\N	76261098050	\N	\N	\N	\N	\N	\N
67	Jeronimo	jeronimo@gmail.com	4243434343		2025-11-04 05:18:43.096237-03	\N	39580928029	\N	\N	\N	\N	\N	\N
69	Jocivania	jocivania@gmail.com	4233332222		2025-11-04 05:21:20.72814-03	\N	44908302030	\N	\N	\N	\N	\N	\N
70	Jose Ruiter	jose@gmail.com	3232323232		2025-11-04 05:22:06.850438-03	\N	26072896022	\N	\N	\N	\N	\N	\N
73	Lais da Silva	lais@gmail.com	5555555555		2025-11-04 05:27:57.058795-03	\N	28636942004	\N	\N	\N	\N	\N	\N
74	Leticia	leticia@gmail.com	1212121212		2025-11-04 05:28:51.788809-03	\N	59490766054	\N	\N	\N	\N	\N	\N
75	Lia Antiqueira	lia@gmail.com	2332323232		2025-11-04 05:29:37.699804-03	\N	56383867008	\N	\N	\N	\N	\N	\N
76	Lucas	lucas@gmail.com	3111111111		2025-11-04 05:30:19.801877-03	\N	15010278081	\N	\N	\N	\N	\N	\N
77	Maria	maria@gmail.com	3232323232		2025-11-04 05:31:23.044281-03	\N	74734219052	\N	\N	\N	\N	\N	\N
78	Murilo	murilo@gmail.com	323232323232		2025-11-04 05:32:07.76762-03	\N	45708680024	\N	\N	\N	\N	\N	\N
79	Oseas Tormen	tormen@gmail.com	3333333333		2025-11-04 05:32:52.426471-03	\N	37154090022	\N	\N	\N	\N	\N	\N
80	Petruska	petruska@gmail.com	3232434343		2025-11-04 05:33:54.98225-03	\N	23565394099	\N	\N	\N	\N	\N	\N
81	Rogerio	rogerio@gmail.com	4255555555		2025-11-04 05:34:47.203365-03	\N	33694130004	\N	\N	\N	\N	\N	\N
82	Thai kievtsboch	thais@gmail.com	4234343434		2025-11-04 05:35:34.303892-03	\N	74427834060	\N	\N	\N	\N	\N	\N
83	Tiago Teixeira	tiago@gmail.com	323333333		2025-11-04 05:36:23.697034-03	\N	36454425029	\N	\N	\N	\N	\N	\N
84	Willian	willian@gmail.com	1212122222		2025-11-04 05:37:10.855913-03	\N	56044495043	\N	\N	\N	\N	\N	\N
86	Clarissa	clarissa@gmail.com	4444422222		2025-11-04 05:39:14.371402-03	\N	13248831030	\N	\N	\N	\N	\N	\N
87	Diogo dos Santos	diogo@gmail.com	4233232333		2025-11-04 05:40:50.675735-03	\N	17830263086	\N	\N	\N	\N	\N	\N
88	Helder Talevi	helder@gmail.com	2120233322		2025-11-04 05:41:30.2639-03	\N	40038467020	\N	\N	\N	\N	\N	\N
89	Luana	luana@gmail.com	423323232323		2025-11-04 05:42:07.523762-03	\N	11884490018	\N	\N	\N	\N	\N	\N
90	Rosane de Albuquerque	rosane@gmail.com	3233233233		2025-11-04 05:42:48.276563-03	\N	48498776058	\N	\N	\N	\N	\N	\N
98	diogo lealll	matheusbomfati21@gmail.com	4222222223		2026-01-14 11:32:10.355402-03	\N	69298954077	Ponta grossa	santa maria	\N	rua avenida aaaa	222	2222
99	BOMFAS	vomfas@gmail.com	4299999999	\N	2026-01-15 08:27:18.511587-03	\N	59808114008	Ponta grossa	santa maria	\N	rua avenida	222	2222
52	André Schuart	andre@gmail.com	4299999999	4299999999	2025-11-04 05:02:20.319314-03	\N	28455130032	Ponta grossa	\N	\N	\N	\N	\N
93	serafim	matheusbomfati20@gmail.com	3244444444	\N	2026-01-14 04:49:33.17379-03	\N	66649902020	\N	\N	\N	\N	\N	\N
94	matheusbomfati10	matheusbomfati10@gmail.com	32271937	\N	2026-01-14 05:04:19.451215-03	\N	591041010	\N	\N	\N	\N	\N	\N
96	matheusbomfati10	matheusbomfati10@gmail.com	32271937	\N	2026-01-14 05:07:03.315221-03	\N	5910410105	\N	\N	\N	\N	\N	\N
51	Aline	matheusbomfati12@gmail.com	9999999999	9999999999	2025-11-04 05:01:11.255869-03	\N	19369487026	\N	\N	\N	\N	\N	\N
85	Ariane de Miranda Leal	ariane@gmail.com	3243333333		2025-11-04 05:38:06.70504-03	\N	27819691093	Ponta Grossa	\N	\N	\N	\N	\N
97	amtheussss	matheusbomfati21@gmail.com	4222222222	\N	2026-01-14 10:56:16.299888-03	\N	93142350098	Ponta grossa	\N	\N	\N	\N	\N
68	Joao	joao@gmail.com	42353535353		2025-11-04 05:19:21.428968-03	\N	42476679046	\N	\N	\N	\N	\N	\N
71	Katie Fraiolli Walter	katie@gmail.com	3434354344		2025-11-04 05:23:59.400792-03	\N	34482887056	\N	\N	\N	\N	\N	\N
72	Kauana da Silva	kauana@gmail.com	5020202020		2025-11-04 05:25:12.889511-03	\N	12409888003	\N	\N	\N	\N	\N	\N
\.

COPY public.interessados (id, nome, telefone, como_conheceu, intencao, data_contato, status, data_criacao) FROM stdin;
26	Eduardo Carvalho	(11) 97654-3210	Instagram	t	\N	Perdido	2025-08-25 10:54:38.948716-03
14	Felipe Oliveira	(41) 98877-1234	Google	t	\N	Perdido	2025-08-25 10:54:38.948716-03
10	Ana Carolina Souza	(42) 99876-5432	Instagram	t	2025-08-09	Perdido	2025-08-25 10:54:38.948716-03
21	Beatriz Ribeiro	(41) 98444-6677	Google	t	2025-08-08	Perdido	2025-08-25 10:54:38.948716-03
11	Bruno Mendes	(11) 97654-1234	Indicação	t	2025-04-16	Ganho	2025-08-25 10:54:38.948716-03
12	Carla Vianna	(21) 98888-7777	Google	f	2025-06-11	Ganho	2025-08-25 10:54:38.948716-03
25	Vanessa Barbosa	(42) 99876-5432	Google	t	2025-09-11	Ganho	2025-08-25 10:54:38.948716-03
28	Thiago Souza	(31) 98989-1212	Google	t	2025-09-25	Ganho	2025-08-25 10:54:38.948716-03
23	Sandra Rocha	(11) 97222-1133	Indicação	t	2025-07-09	Perdido	2025-08-25 10:54:38.948716-03
24	Ricardo Nunes	(21) 98800-9911	Facebook	f	2025-05-07	Ganho	2025-08-25 10:54:38.948716-03
18	Rafael Almeida	(31) 98899-0011	Google	t	2025-04-11	Perdido	2025-08-25 10:54:38.948716-03
29	Matheus	(42) 999999999	Google	t	2025-09-29	Entrou Em Contato	2025-08-25 10:54:38.948716-03
33	Maria Da Silva Teste	(11) 91234-5678	Instagram	t	2025-09-15	Entrou Em Contato	2025-11-04 04:14:24.176775-03
34	Aaaaaathe	4233333333	Google	t	2025-11-04	Entrou Em Contato	2025-11-04 04:26:44.76567-03
35	Matheusinh	4299999292	Google	t	2025-11-04	Entrou Em Contato	2025-11-04 04:27:27.334202-03
36	Matheus	42999641120	Google	t	2025-11-04	Entrou Em Contato	2025-11-04 07:03:05.382544-03
37	aaa	23332333	Instagram	f	\N	Entrou Em Contato	2026-01-14 08:49:31.535608-03
38	aaaaaa	4299929292	Google	f	\N	Entrou Em Contato	2026-01-14 12:25:20.037254-03
39	aaa	4299929292	Google	f	\N	Entrou Em Contato	2026-01-14 12:29:56.456512-03
40	avbvv	4299929292	Google	f	\N	Entrou Em Contato	2026-01-14 12:31:51.042131-03
41	adsadasdas	232323232	Google	f	\N	Entrou Em Contato	2026-01-14 12:32:13.268382-03
42	ffasdfaed	429992929222	Google	f	\N	Entrou Em Contato	2026-01-14 12:40:04.77224-03
43	aasdadasdasdasdasdasdas	32323232322	Google	f	2026-01-14	Entrou Em Contato	2026-01-14 12:40:27.437536-03
5	Ana Carolina Souza	(42) 99876-5432	Instagram	t	2025-07-30	Ganho	2025-08-25 09:36:50.848294-03
6	Bruno Mendes	(11) 97654-1234	Indicação	t	2025-08-07	Perdido	2025-08-25 09:36:50.848294-03
7	Carla Vianna	(21) 98888-7777	Google	f	2025-08-07	Entrou Em Contato	2025-08-25 09:36:50.848294-03
8	Diego Martins	(42) 99111-2222	Facebook	t	2025-08-14	Ganho	2025-08-25 09:36:50.848294-03
19	Patricia Lima	(21) 97555-2233	Outros	f	\N	Perdido	2025-08-25 10:54:38.948716-03
17	Juliana Pereira	(42) 99234-8765	Indicação	t	\N	Perdido	2025-08-25 10:54:38.948716-03
15	Gabriela Santos	(11) 97655-4321	Instagram	t	\N	Perdido	2025-08-25 10:54:38.948716-03
27	Fernanda Gomes	(41) 98765-4321	Indicação	t	\N	Ganho	2025-08-25 10:54:38.948716-03
22	Leonardo Azevedo	(42) 99109-8765	Instagram	t	\N	Ganho	2025-08-25 10:54:38.948716-03
16	Lucas Costa	(51) 98123-5678	Facebook	t	\N	Ganho	2025-08-25 10:54:38.948716-03
20	Marcos Ferreira	(11) 99333-4455	Instagram	t	\N	Ganho	2025-08-25 10:54:38.948716-03
13	Diego Martins	(42) 99111-2222	Facebook	t	\N	Perdido	2025-08-25 10:54:38.948716-03
\.

COPY public.notificacoes (id, usuario_id, tipo, mensagem, planejamento_id, lida, created_at) FROM stdin;
972	16	aprovado	✅ O Planejamento 3/2026 foi aprovado	202	f	2026-01-14 12:26:08.754183
914	11	planejamento	Novo aluno cadastrado: Bomfaaas. Vincule-o a uma turma!	\N	f	2025-11-17 15:07:50.581075
915	12	planejamento	Novo aluno cadastrado: Bomfaaas. Vincule-o a uma turma!	\N	f	2025-11-17 15:07:50.581075
916	13	planejamento	Novo aluno cadastrado: Bomfaaas. Vincule-o a uma turma!	\N	f	2025-11-17 15:07:50.581075
917	14	planejamento	Novo aluno cadastrado: Bomfaaas. Vincule-o a uma turma!	\N	f	2025-11-17 15:07:50.581075
918	15	planejamento	Novo aluno cadastrado: Bomfaaas. Vincule-o a uma turma!	\N	f	2025-11-17 15:07:50.581075
919	16	planejamento	Novo aluno cadastrado: Bomfaaas. Vincule-o a uma turma!	\N	f	2025-11-17 15:07:50.581075
920	17	planejamento	Novo aluno cadastrado: Bomfaaas. Vincule-o a uma turma!	\N	f	2025-11-17 15:07:50.581075
921	18	planejamento	Novo aluno cadastrado: Bomfaaas. Vincule-o a uma turma!	\N	f	2025-11-17 15:07:50.581075
922	19	planejamento	Novo aluno cadastrado: Bomfaaas. Vincule-o a uma turma!	\N	f	2025-11-17 15:07:50.581075
923	20	planejamento	Novo aluno cadastrado: Bomfaaas. Vincule-o a uma turma!	\N	f	2025-11-17 15:07:50.581075
924	21	planejamento	Novo aluno cadastrado: Bomfaaas. Vincule-o a uma turma!	\N	f	2025-11-17 15:07:50.581075
928	11	planejamento	Novo aluno cadastrado: Matheus Bomfati Lemes. Vincule-o a uma turma!	\N	f	2026-01-14 04:57:05.949437
929	12	planejamento	Novo aluno cadastrado: Matheus Bomfati Lemes. Vincule-o a uma turma!	\N	f	2026-01-14 04:57:05.949437
930	13	planejamento	Novo aluno cadastrado: Matheus Bomfati Lemes. Vincule-o a uma turma!	\N	f	2026-01-14 04:57:05.949437
931	14	planejamento	Novo aluno cadastrado: Matheus Bomfati Lemes. Vincule-o a uma turma!	\N	f	2026-01-14 04:57:05.949437
932	15	planejamento	Novo aluno cadastrado: Matheus Bomfati Lemes. Vincule-o a uma turma!	\N	f	2026-01-14 04:57:05.949437
933	16	planejamento	Novo aluno cadastrado: Matheus Bomfati Lemes. Vincule-o a uma turma!	\N	f	2026-01-14 04:57:05.949437
934	17	planejamento	Novo aluno cadastrado: Matheus Bomfati Lemes. Vincule-o a uma turma!	\N	f	2026-01-14 04:57:05.949437
935	18	planejamento	Novo aluno cadastrado: Matheus Bomfati Lemes. Vincule-o a uma turma!	\N	f	2026-01-14 04:57:05.949437
936	19	planejamento	Novo aluno cadastrado: Matheus Bomfati Lemes. Vincule-o a uma turma!	\N	f	2026-01-14 04:57:05.949437
937	20	planejamento	Novo aluno cadastrado: Matheus Bomfati Lemes. Vincule-o a uma turma!	\N	f	2026-01-14 04:57:05.949437
938	21	planejamento	Novo aluno cadastrado: Matheus Bomfati Lemes. Vincule-o a uma turma!	\N	f	2026-01-14 04:57:05.949437
48	11	planejamento	Novo aluno cadastrado: Pedro. Vincule-o a uma turma!	\N	f	2025-11-04 05:01:11.255869
49	12	planejamento	Novo aluno cadastrado: Pedro. Vincule-o a uma turma!	\N	f	2025-11-04 05:01:11.255869
50	13	planejamento	Novo aluno cadastrado: Pedro. Vincule-o a uma turma!	\N	f	2025-11-04 05:01:11.255869
51	14	planejamento	Novo aluno cadastrado: Pedro. Vincule-o a uma turma!	\N	f	2025-11-04 05:01:11.255869
52	15	planejamento	Novo aluno cadastrado: Pedro. Vincule-o a uma turma!	\N	f	2025-11-04 05:01:11.255869
53	16	planejamento	Novo aluno cadastrado: Pedro. Vincule-o a uma turma!	\N	f	2025-11-04 05:01:11.255869
54	17	planejamento	Novo aluno cadastrado: Pedro. Vincule-o a uma turma!	\N	f	2025-11-04 05:01:11.255869
55	18	planejamento	Novo aluno cadastrado: Pedro. Vincule-o a uma turma!	\N	f	2025-11-04 05:01:11.255869
56	19	planejamento	Novo aluno cadastrado: Pedro. Vincule-o a uma turma!	\N	f	2025-11-04 05:01:11.255869
57	20	planejamento	Novo aluno cadastrado: Pedro. Vincule-o a uma turma!	\N	f	2025-11-04 05:01:11.255869
58	21	planejamento	Novo aluno cadastrado: Pedro. Vincule-o a uma turma!	\N	f	2025-11-04 05:01:11.255869
65	11	planejamento	Novo aluno cadastrado: Albert. Vincule-o a uma turma!	\N	f	2025-11-04 05:02:20.319314
66	12	planejamento	Novo aluno cadastrado: Albert. Vincule-o a uma turma!	\N	f	2025-11-04 05:02:20.319314
67	13	planejamento	Novo aluno cadastrado: Albert. Vincule-o a uma turma!	\N	f	2025-11-04 05:02:20.319314
68	14	planejamento	Novo aluno cadastrado: Albert. Vincule-o a uma turma!	\N	f	2025-11-04 05:02:20.319314
69	15	planejamento	Novo aluno cadastrado: Albert. Vincule-o a uma turma!	\N	f	2025-11-04 05:02:20.319314
70	16	planejamento	Novo aluno cadastrado: Albert. Vincule-o a uma turma!	\N	f	2025-11-04 05:02:20.319314
71	17	planejamento	Novo aluno cadastrado: Albert. Vincule-o a uma turma!	\N	f	2025-11-04 05:02:20.319314
72	18	planejamento	Novo aluno cadastrado: Albert. Vincule-o a uma turma!	\N	f	2025-11-04 05:02:20.319314
73	19	planejamento	Novo aluno cadastrado: Albert. Vincule-o a uma turma!	\N	f	2025-11-04 05:02:20.319314
74	20	planejamento	Novo aluno cadastrado: Albert. Vincule-o a uma turma!	\N	f	2025-11-04 05:02:20.319314
75	21	planejamento	Novo aluno cadastrado: Albert. Vincule-o a uma turma!	\N	f	2025-11-04 05:02:20.319314
973	16	comentario	Matheus Bomfati comentou no Planejamento 6/2026	203	f	2026-01-14 12:28:14.244329
82	11	planejamento	Novo aluno cadastrado: Gael. Vincule-o a uma turma!	\N	f	2025-11-04 05:03:26.007538
83	12	planejamento	Novo aluno cadastrado: Gael. Vincule-o a uma turma!	\N	f	2025-11-04 05:03:26.007538
84	13	planejamento	Novo aluno cadastrado: Gael. Vincule-o a uma turma!	\N	f	2025-11-04 05:03:26.007538
85	14	planejamento	Novo aluno cadastrado: Gael. Vincule-o a uma turma!	\N	f	2025-11-04 05:03:26.007538
86	15	planejamento	Novo aluno cadastrado: Gael. Vincule-o a uma turma!	\N	f	2025-11-04 05:03:26.007538
87	16	planejamento	Novo aluno cadastrado: Gael. Vincule-o a uma turma!	\N	f	2025-11-04 05:03:26.007538
88	17	planejamento	Novo aluno cadastrado: Gael. Vincule-o a uma turma!	\N	f	2025-11-04 05:03:26.007538
89	18	planejamento	Novo aluno cadastrado: Gael. Vincule-o a uma turma!	\N	f	2025-11-04 05:03:26.007538
90	19	planejamento	Novo aluno cadastrado: Gael. Vincule-o a uma turma!	\N	f	2025-11-04 05:03:26.007538
91	20	planejamento	Novo aluno cadastrado: Gael. Vincule-o a uma turma!	\N	f	2025-11-04 05:03:26.007538
92	21	planejamento	Novo aluno cadastrado: Gael. Vincule-o a uma turma!	\N	f	2025-11-04 05:03:26.007538
99	11	planejamento	Novo aluno cadastrado: Heitor. Vincule-o a uma turma!	\N	f	2025-11-04 05:04:27.210982
100	12	planejamento	Novo aluno cadastrado: Heitor. Vincule-o a uma turma!	\N	f	2025-11-04 05:04:27.210982
101	13	planejamento	Novo aluno cadastrado: Heitor. Vincule-o a uma turma!	\N	f	2025-11-04 05:04:27.210982
102	14	planejamento	Novo aluno cadastrado: Heitor. Vincule-o a uma turma!	\N	f	2025-11-04 05:04:27.210982
103	15	planejamento	Novo aluno cadastrado: Heitor. Vincule-o a uma turma!	\N	f	2025-11-04 05:04:27.210982
104	16	planejamento	Novo aluno cadastrado: Heitor. Vincule-o a uma turma!	\N	f	2025-11-04 05:04:27.210982
105	17	planejamento	Novo aluno cadastrado: Heitor. Vincule-o a uma turma!	\N	f	2025-11-04 05:04:27.210982
106	18	planejamento	Novo aluno cadastrado: Heitor. Vincule-o a uma turma!	\N	f	2025-11-04 05:04:27.210982
107	19	planejamento	Novo aluno cadastrado: Heitor. Vincule-o a uma turma!	\N	f	2025-11-04 05:04:27.210982
108	20	planejamento	Novo aluno cadastrado: Heitor. Vincule-o a uma turma!	\N	f	2025-11-04 05:04:27.210982
109	21	planejamento	Novo aluno cadastrado: Heitor. Vincule-o a uma turma!	\N	f	2025-11-04 05:04:27.210982
116	11	planejamento	Novo aluno cadastrado: Nolan. Vincule-o a uma turma!	\N	f	2025-11-04 05:05:05.437468
117	12	planejamento	Novo aluno cadastrado: Nolan. Vincule-o a uma turma!	\N	f	2025-11-04 05:05:05.437468
118	13	planejamento	Novo aluno cadastrado: Nolan. Vincule-o a uma turma!	\N	f	2025-11-04 05:05:05.437468
119	14	planejamento	Novo aluno cadastrado: Nolan. Vincule-o a uma turma!	\N	f	2025-11-04 05:05:05.437468
120	15	planejamento	Novo aluno cadastrado: Nolan. Vincule-o a uma turma!	\N	f	2025-11-04 05:05:05.437468
121	16	planejamento	Novo aluno cadastrado: Nolan. Vincule-o a uma turma!	\N	f	2025-11-04 05:05:05.437468
122	17	planejamento	Novo aluno cadastrado: Nolan. Vincule-o a uma turma!	\N	f	2025-11-04 05:05:05.437468
123	18	planejamento	Novo aluno cadastrado: Nolan. Vincule-o a uma turma!	\N	f	2025-11-04 05:05:05.437468
124	19	planejamento	Novo aluno cadastrado: Nolan. Vincule-o a uma turma!	\N	f	2025-11-04 05:05:05.437468
125	20	planejamento	Novo aluno cadastrado: Nolan. Vincule-o a uma turma!	\N	f	2025-11-04 05:05:05.437468
126	21	planejamento	Novo aluno cadastrado: Nolan. Vincule-o a uma turma!	\N	f	2025-11-04 05:05:05.437468
133	11	planejamento	Novo aluno cadastrado: Olivia. Vincule-o a uma turma!	\N	f	2025-11-04 05:06:13.293346
134	12	planejamento	Novo aluno cadastrado: Olivia. Vincule-o a uma turma!	\N	f	2025-11-04 05:06:13.293346
135	13	planejamento	Novo aluno cadastrado: Olivia. Vincule-o a uma turma!	\N	f	2025-11-04 05:06:13.293346
136	14	planejamento	Novo aluno cadastrado: Olivia. Vincule-o a uma turma!	\N	f	2025-11-04 05:06:13.293346
137	15	planejamento	Novo aluno cadastrado: Olivia. Vincule-o a uma turma!	\N	f	2025-11-04 05:06:13.293346
138	16	planejamento	Novo aluno cadastrado: Olivia. Vincule-o a uma turma!	\N	f	2025-11-04 05:06:13.293346
139	17	planejamento	Novo aluno cadastrado: Olivia. Vincule-o a uma turma!	\N	f	2025-11-04 05:06:13.293346
140	18	planejamento	Novo aluno cadastrado: Olivia. Vincule-o a uma turma!	\N	f	2025-11-04 05:06:13.293346
141	19	planejamento	Novo aluno cadastrado: Olivia. Vincule-o a uma turma!	\N	f	2025-11-04 05:06:13.293346
142	20	planejamento	Novo aluno cadastrado: Olivia. Vincule-o a uma turma!	\N	f	2025-11-04 05:06:13.293346
143	21	planejamento	Novo aluno cadastrado: Olivia. Vincule-o a uma turma!	\N	f	2025-11-04 05:06:13.293346
975	16	reprovado	❌ O Planejamento 3/2026 foi reprovado	202	f	2026-01-14 12:29:24.728971
150	11	planejamento	Novo aluno cadastrado: Joao. Vincule-o a uma turma!	\N	f	2025-11-04 05:06:40.457962
151	12	planejamento	Novo aluno cadastrado: Joao. Vincule-o a uma turma!	\N	f	2025-11-04 05:06:40.457962
152	13	planejamento	Novo aluno cadastrado: Joao. Vincule-o a uma turma!	\N	f	2025-11-04 05:06:40.457962
153	14	planejamento	Novo aluno cadastrado: Joao. Vincule-o a uma turma!	\N	f	2025-11-04 05:06:40.457962
154	15	planejamento	Novo aluno cadastrado: Joao. Vincule-o a uma turma!	\N	f	2025-11-04 05:06:40.457962
155	16	planejamento	Novo aluno cadastrado: Joao. Vincule-o a uma turma!	\N	f	2025-11-04 05:06:40.457962
156	17	planejamento	Novo aluno cadastrado: Joao. Vincule-o a uma turma!	\N	f	2025-11-04 05:06:40.457962
157	18	planejamento	Novo aluno cadastrado: Joao. Vincule-o a uma turma!	\N	f	2025-11-04 05:06:40.457962
158	19	planejamento	Novo aluno cadastrado: Joao. Vincule-o a uma turma!	\N	f	2025-11-04 05:06:40.457962
159	20	planejamento	Novo aluno cadastrado: Joao. Vincule-o a uma turma!	\N	f	2025-11-04 05:06:40.457962
160	21	planejamento	Novo aluno cadastrado: Joao. Vincule-o a uma turma!	\N	f	2025-11-04 05:06:40.457962
167	11	planejamento	Novo aluno cadastrado: Sarah. Vincule-o a uma turma!	\N	f	2025-11-04 05:07:39.907967
168	12	planejamento	Novo aluno cadastrado: Sarah. Vincule-o a uma turma!	\N	f	2025-11-04 05:07:39.907967
169	13	planejamento	Novo aluno cadastrado: Sarah. Vincule-o a uma turma!	\N	f	2025-11-04 05:07:39.907967
170	14	planejamento	Novo aluno cadastrado: Sarah. Vincule-o a uma turma!	\N	f	2025-11-04 05:07:39.907967
171	15	planejamento	Novo aluno cadastrado: Sarah. Vincule-o a uma turma!	\N	f	2025-11-04 05:07:39.907967
172	16	planejamento	Novo aluno cadastrado: Sarah. Vincule-o a uma turma!	\N	f	2025-11-04 05:07:39.907967
173	17	planejamento	Novo aluno cadastrado: Sarah. Vincule-o a uma turma!	\N	f	2025-11-04 05:07:39.907967
174	18	planejamento	Novo aluno cadastrado: Sarah. Vincule-o a uma turma!	\N	f	2025-11-04 05:07:39.907967
175	19	planejamento	Novo aluno cadastrado: Sarah. Vincule-o a uma turma!	\N	f	2025-11-04 05:07:39.907967
176	20	planejamento	Novo aluno cadastrado: Sarah. Vincule-o a uma turma!	\N	f	2025-11-04 05:07:39.907967
177	21	planejamento	Novo aluno cadastrado: Sarah. Vincule-o a uma turma!	\N	f	2025-11-04 05:07:39.907967
184	11	planejamento	Novo aluno cadastrado: Miguel. Vincule-o a uma turma!	\N	f	2025-11-04 05:09:07.174719
185	12	planejamento	Novo aluno cadastrado: Miguel. Vincule-o a uma turma!	\N	f	2025-11-04 05:09:07.174719
186	13	planejamento	Novo aluno cadastrado: Miguel. Vincule-o a uma turma!	\N	f	2025-11-04 05:09:07.174719
187	14	planejamento	Novo aluno cadastrado: Miguel. Vincule-o a uma turma!	\N	f	2025-11-04 05:09:07.174719
188	15	planejamento	Novo aluno cadastrado: Miguel. Vincule-o a uma turma!	\N	f	2025-11-04 05:09:07.174719
189	16	planejamento	Novo aluno cadastrado: Miguel. Vincule-o a uma turma!	\N	f	2025-11-04 05:09:07.174719
190	17	planejamento	Novo aluno cadastrado: Miguel. Vincule-o a uma turma!	\N	f	2025-11-04 05:09:07.174719
191	18	planejamento	Novo aluno cadastrado: Miguel. Vincule-o a uma turma!	\N	f	2025-11-04 05:09:07.174719
192	19	planejamento	Novo aluno cadastrado: Miguel. Vincule-o a uma turma!	\N	f	2025-11-04 05:09:07.174719
193	20	planejamento	Novo aluno cadastrado: Miguel. Vincule-o a uma turma!	\N	f	2025-11-04 05:09:07.174719
194	21	planejamento	Novo aluno cadastrado: Miguel. Vincule-o a uma turma!	\N	f	2025-11-04 05:09:07.174719
201	11	planejamento	Novo aluno cadastrado: Clara. Vincule-o a uma turma!	\N	f	2025-11-04 05:10:26.994438
202	12	planejamento	Novo aluno cadastrado: Clara. Vincule-o a uma turma!	\N	f	2025-11-04 05:10:26.994438
203	13	planejamento	Novo aluno cadastrado: Clara. Vincule-o a uma turma!	\N	f	2025-11-04 05:10:26.994438
204	14	planejamento	Novo aluno cadastrado: Clara. Vincule-o a uma turma!	\N	f	2025-11-04 05:10:26.994438
205	15	planejamento	Novo aluno cadastrado: Clara. Vincule-o a uma turma!	\N	f	2025-11-04 05:10:26.994438
206	16	planejamento	Novo aluno cadastrado: Clara. Vincule-o a uma turma!	\N	f	2025-11-04 05:10:26.994438
207	17	planejamento	Novo aluno cadastrado: Clara. Vincule-o a uma turma!	\N	f	2025-11-04 05:10:26.994438
208	18	planejamento	Novo aluno cadastrado: Clara. Vincule-o a uma turma!	\N	f	2025-11-04 05:10:26.994438
209	19	planejamento	Novo aluno cadastrado: Clara. Vincule-o a uma turma!	\N	f	2025-11-04 05:10:26.994438
210	20	planejamento	Novo aluno cadastrado: Clara. Vincule-o a uma turma!	\N	f	2025-11-04 05:10:26.994438
211	21	planejamento	Novo aluno cadastrado: Clara. Vincule-o a uma turma!	\N	f	2025-11-04 05:10:26.994438
976	16	comentario	Matheus Bomfati comentou no Planejamento 2/2026	200	f	2026-01-14 12:32:28.013527
218	11	planejamento	Novo aluno cadastrado: Zoe. Vincule-o a uma turma!	\N	f	2025-11-04 05:11:17.770818
219	12	planejamento	Novo aluno cadastrado: Zoe. Vincule-o a uma turma!	\N	f	2025-11-04 05:11:17.770818
220	13	planejamento	Novo aluno cadastrado: Zoe. Vincule-o a uma turma!	\N	f	2025-11-04 05:11:17.770818
221	14	planejamento	Novo aluno cadastrado: Zoe. Vincule-o a uma turma!	\N	f	2025-11-04 05:11:17.770818
222	15	planejamento	Novo aluno cadastrado: Zoe. Vincule-o a uma turma!	\N	f	2025-11-04 05:11:17.770818
223	16	planejamento	Novo aluno cadastrado: Zoe. Vincule-o a uma turma!	\N	f	2025-11-04 05:11:17.770818
224	17	planejamento	Novo aluno cadastrado: Zoe. Vincule-o a uma turma!	\N	f	2025-11-04 05:11:17.770818
225	18	planejamento	Novo aluno cadastrado: Zoe. Vincule-o a uma turma!	\N	f	2025-11-04 05:11:17.770818
226	19	planejamento	Novo aluno cadastrado: Zoe. Vincule-o a uma turma!	\N	f	2025-11-04 05:11:17.770818
227	20	planejamento	Novo aluno cadastrado: Zoe. Vincule-o a uma turma!	\N	f	2025-11-04 05:11:17.770818
228	21	planejamento	Novo aluno cadastrado: Zoe. Vincule-o a uma turma!	\N	f	2025-11-04 05:11:17.770818
944	21	comentario	Matheus Bomfati comentou no Planejamento 1/2026	195	f	2026-01-14 08:06:01.74329
235	11	planejamento	Novo aluno cadastrado: Valentim. Vincule-o a uma turma!	\N	f	2025-11-04 05:12:21.127956
236	12	planejamento	Novo aluno cadastrado: Valentim. Vincule-o a uma turma!	\N	f	2025-11-04 05:12:21.127956
237	13	planejamento	Novo aluno cadastrado: Valentim. Vincule-o a uma turma!	\N	f	2025-11-04 05:12:21.127956
238	14	planejamento	Novo aluno cadastrado: Valentim. Vincule-o a uma turma!	\N	f	2025-11-04 05:12:21.127956
239	15	planejamento	Novo aluno cadastrado: Valentim. Vincule-o a uma turma!	\N	f	2025-11-04 05:12:21.127956
240	16	planejamento	Novo aluno cadastrado: Valentim. Vincule-o a uma turma!	\N	f	2025-11-04 05:12:21.127956
241	17	planejamento	Novo aluno cadastrado: Valentim. Vincule-o a uma turma!	\N	f	2025-11-04 05:12:21.127956
242	18	planejamento	Novo aluno cadastrado: Valentim. Vincule-o a uma turma!	\N	f	2025-11-04 05:12:21.127956
243	19	planejamento	Novo aluno cadastrado: Valentim. Vincule-o a uma turma!	\N	f	2025-11-04 05:12:21.127956
244	20	planejamento	Novo aluno cadastrado: Valentim. Vincule-o a uma turma!	\N	f	2025-11-04 05:12:21.127956
245	21	planejamento	Novo aluno cadastrado: Valentim. Vincule-o a uma turma!	\N	f	2025-11-04 05:12:21.127956
252	11	planejamento	Novo aluno cadastrado: Frederick. Vincule-o a uma turma!	\N	f	2025-11-04 05:13:20.196242
253	12	planejamento	Novo aluno cadastrado: Frederick. Vincule-o a uma turma!	\N	f	2025-11-04 05:13:20.196242
254	13	planejamento	Novo aluno cadastrado: Frederick. Vincule-o a uma turma!	\N	f	2025-11-04 05:13:20.196242
255	14	planejamento	Novo aluno cadastrado: Frederick. Vincule-o a uma turma!	\N	f	2025-11-04 05:13:20.196242
256	15	planejamento	Novo aluno cadastrado: Frederick. Vincule-o a uma turma!	\N	f	2025-11-04 05:13:20.196242
257	16	planejamento	Novo aluno cadastrado: Frederick. Vincule-o a uma turma!	\N	f	2025-11-04 05:13:20.196242
258	17	planejamento	Novo aluno cadastrado: Frederick. Vincule-o a uma turma!	\N	f	2025-11-04 05:13:20.196242
259	18	planejamento	Novo aluno cadastrado: Frederick. Vincule-o a uma turma!	\N	f	2025-11-04 05:13:20.196242
260	19	planejamento	Novo aluno cadastrado: Frederick. Vincule-o a uma turma!	\N	f	2025-11-04 05:13:20.196242
261	20	planejamento	Novo aluno cadastrado: Frederick. Vincule-o a uma turma!	\N	f	2025-11-04 05:13:20.196242
262	21	planejamento	Novo aluno cadastrado: Frederick. Vincule-o a uma turma!	\N	f	2025-11-04 05:13:20.196242
269	11	planejamento	Novo aluno cadastrado: Cecilia. Vincule-o a uma turma!	\N	f	2025-11-04 05:14:38.241154
270	12	planejamento	Novo aluno cadastrado: Cecilia. Vincule-o a uma turma!	\N	f	2025-11-04 05:14:38.241154
271	13	planejamento	Novo aluno cadastrado: Cecilia. Vincule-o a uma turma!	\N	f	2025-11-04 05:14:38.241154
272	14	planejamento	Novo aluno cadastrado: Cecilia. Vincule-o a uma turma!	\N	f	2025-11-04 05:14:38.241154
273	15	planejamento	Novo aluno cadastrado: Cecilia. Vincule-o a uma turma!	\N	f	2025-11-04 05:14:38.241154
274	16	planejamento	Novo aluno cadastrado: Cecilia. Vincule-o a uma turma!	\N	f	2025-11-04 05:14:38.241154
275	17	planejamento	Novo aluno cadastrado: Cecilia. Vincule-o a uma turma!	\N	f	2025-11-04 05:14:38.241154
276	18	planejamento	Novo aluno cadastrado: Cecilia. Vincule-o a uma turma!	\N	f	2025-11-04 05:14:38.241154
277	19	planejamento	Novo aluno cadastrado: Cecilia. Vincule-o a uma turma!	\N	f	2025-11-04 05:14:38.241154
278	20	planejamento	Novo aluno cadastrado: Cecilia. Vincule-o a uma turma!	\N	f	2025-11-04 05:14:38.241154
279	21	planejamento	Novo aluno cadastrado: Cecilia. Vincule-o a uma turma!	\N	f	2025-11-04 05:14:38.241154
977	11	planejamento	Novo aluno cadastrado: Lucas Rafael Paulino de Oliveira. Vincule-o a uma turma!	\N	f	2026-01-15 08:28:22.863531
978	12	planejamento	Novo aluno cadastrado: Lucas Rafael Paulino de Oliveira. Vincule-o a uma turma!	\N	f	2026-01-15 08:28:22.863531
979	13	planejamento	Novo aluno cadastrado: Lucas Rafael Paulino de Oliveira. Vincule-o a uma turma!	\N	f	2026-01-15 08:28:22.863531
980	14	planejamento	Novo aluno cadastrado: Lucas Rafael Paulino de Oliveira. Vincule-o a uma turma!	\N	f	2026-01-15 08:28:22.863531
981	15	planejamento	Novo aluno cadastrado: Lucas Rafael Paulino de Oliveira. Vincule-o a uma turma!	\N	f	2026-01-15 08:28:22.863531
982	16	planejamento	Novo aluno cadastrado: Lucas Rafael Paulino de Oliveira. Vincule-o a uma turma!	\N	f	2026-01-15 08:28:22.863531
286	11	planejamento	Novo aluno cadastrado: Luiza. Vincule-o a uma turma!	\N	f	2025-11-04 05:15:28.217663
287	12	planejamento	Novo aluno cadastrado: Luiza. Vincule-o a uma turma!	\N	f	2025-11-04 05:15:28.217663
288	13	planejamento	Novo aluno cadastrado: Luiza. Vincule-o a uma turma!	\N	f	2025-11-04 05:15:28.217663
289	14	planejamento	Novo aluno cadastrado: Luiza. Vincule-o a uma turma!	\N	f	2025-11-04 05:15:28.217663
290	15	planejamento	Novo aluno cadastrado: Luiza. Vincule-o a uma turma!	\N	f	2025-11-04 05:15:28.217663
291	16	planejamento	Novo aluno cadastrado: Luiza. Vincule-o a uma turma!	\N	f	2025-11-04 05:15:28.217663
292	17	planejamento	Novo aluno cadastrado: Luiza. Vincule-o a uma turma!	\N	f	2025-11-04 05:15:28.217663
293	18	planejamento	Novo aluno cadastrado: Luiza. Vincule-o a uma turma!	\N	f	2025-11-04 05:15:28.217663
294	19	planejamento	Novo aluno cadastrado: Luiza. Vincule-o a uma turma!	\N	f	2025-11-04 05:15:28.217663
295	20	planejamento	Novo aluno cadastrado: Luiza. Vincule-o a uma turma!	\N	f	2025-11-04 05:15:28.217663
296	21	planejamento	Novo aluno cadastrado: Luiza. Vincule-o a uma turma!	\N	f	2025-11-04 05:15:28.217663
945	11	planejamento	Novo aluno cadastrado: Matheus Bomfati Lemes. Vincule-o a uma turma!	\N	f	2026-01-14 10:56:49.376054
946	12	planejamento	Novo aluno cadastrado: Matheus Bomfati Lemes. Vincule-o a uma turma!	\N	f	2026-01-14 10:56:49.376054
983	17	planejamento	Novo aluno cadastrado: Lucas Rafael Paulino de Oliveira. Vincule-o a uma turma!	\N	f	2026-01-15 08:28:22.863531
947	13	planejamento	Novo aluno cadastrado: Matheus Bomfati Lemes. Vincule-o a uma turma!	\N	f	2026-01-14 10:56:49.376054
948	14	planejamento	Novo aluno cadastrado: Matheus Bomfati Lemes. Vincule-o a uma turma!	\N	f	2026-01-14 10:56:49.376054
984	18	planejamento	Novo aluno cadastrado: Lucas Rafael Paulino de Oliveira. Vincule-o a uma turma!	\N	f	2026-01-15 08:28:22.863531
303	11	planejamento	Novo aluno cadastrado: Laura. Vincule-o a uma turma!	\N	f	2025-11-04 05:16:15.271678
304	12	planejamento	Novo aluno cadastrado: Laura. Vincule-o a uma turma!	\N	f	2025-11-04 05:16:15.271678
305	13	planejamento	Novo aluno cadastrado: Laura. Vincule-o a uma turma!	\N	f	2025-11-04 05:16:15.271678
306	14	planejamento	Novo aluno cadastrado: Laura. Vincule-o a uma turma!	\N	f	2025-11-04 05:16:15.271678
307	15	planejamento	Novo aluno cadastrado: Laura. Vincule-o a uma turma!	\N	f	2025-11-04 05:16:15.271678
308	16	planejamento	Novo aluno cadastrado: Laura. Vincule-o a uma turma!	\N	f	2025-11-04 05:16:15.271678
309	17	planejamento	Novo aluno cadastrado: Laura. Vincule-o a uma turma!	\N	f	2025-11-04 05:16:15.271678
310	18	planejamento	Novo aluno cadastrado: Laura. Vincule-o a uma turma!	\N	f	2025-11-04 05:16:15.271678
311	19	planejamento	Novo aluno cadastrado: Laura. Vincule-o a uma turma!	\N	f	2025-11-04 05:16:15.271678
312	20	planejamento	Novo aluno cadastrado: Laura. Vincule-o a uma turma!	\N	f	2025-11-04 05:16:15.271678
313	21	planejamento	Novo aluno cadastrado: Laura. Vincule-o a uma turma!	\N	f	2025-11-04 05:16:15.271678
949	15	planejamento	Novo aluno cadastrado: Matheus Bomfati Lemes. Vincule-o a uma turma!	\N	f	2026-01-14 10:56:49.376054
950	16	planejamento	Novo aluno cadastrado: Matheus Bomfati Lemes. Vincule-o a uma turma!	\N	f	2026-01-14 10:56:49.376054
985	19	planejamento	Novo aluno cadastrado: Lucas Rafael Paulino de Oliveira. Vincule-o a uma turma!	\N	f	2026-01-15 08:28:22.863531
951	17	planejamento	Novo aluno cadastrado: Matheus Bomfati Lemes. Vincule-o a uma turma!	\N	f	2026-01-14 10:56:49.376054
952	18	planejamento	Novo aluno cadastrado: Matheus Bomfati Lemes. Vincule-o a uma turma!	\N	f	2026-01-14 10:56:49.376054
986	20	planejamento	Novo aluno cadastrado: Lucas Rafael Paulino de Oliveira. Vincule-o a uma turma!	\N	f	2026-01-15 08:28:22.863531
320	11	planejamento	Novo aluno cadastrado: Iasmin. Vincule-o a uma turma!	\N	f	2025-11-04 05:17:18.91352
321	12	planejamento	Novo aluno cadastrado: Iasmin. Vincule-o a uma turma!	\N	f	2025-11-04 05:17:18.91352
322	13	planejamento	Novo aluno cadastrado: Iasmin. Vincule-o a uma turma!	\N	f	2025-11-04 05:17:18.91352
323	14	planejamento	Novo aluno cadastrado: Iasmin. Vincule-o a uma turma!	\N	f	2025-11-04 05:17:18.91352
324	15	planejamento	Novo aluno cadastrado: Iasmin. Vincule-o a uma turma!	\N	f	2025-11-04 05:17:18.91352
325	16	planejamento	Novo aluno cadastrado: Iasmin. Vincule-o a uma turma!	\N	f	2025-11-04 05:17:18.91352
326	17	planejamento	Novo aluno cadastrado: Iasmin. Vincule-o a uma turma!	\N	f	2025-11-04 05:17:18.91352
327	18	planejamento	Novo aluno cadastrado: Iasmin. Vincule-o a uma turma!	\N	f	2025-11-04 05:17:18.91352
328	19	planejamento	Novo aluno cadastrado: Iasmin. Vincule-o a uma turma!	\N	f	2025-11-04 05:17:18.91352
329	20	planejamento	Novo aluno cadastrado: Iasmin. Vincule-o a uma turma!	\N	f	2025-11-04 05:17:18.91352
330	21	planejamento	Novo aluno cadastrado: Iasmin. Vincule-o a uma turma!	\N	f	2025-11-04 05:17:18.91352
953	19	planejamento	Novo aluno cadastrado: Matheus Bomfati Lemes. Vincule-o a uma turma!	\N	f	2026-01-14 10:56:49.376054
954	20	planejamento	Novo aluno cadastrado: Matheus Bomfati Lemes. Vincule-o a uma turma!	\N	f	2026-01-14 10:56:49.376054
337	11	planejamento	Novo aluno cadastrado: Theo. Vincule-o a uma turma!	\N	f	2025-11-04 05:18:05.704046
338	12	planejamento	Novo aluno cadastrado: Theo. Vincule-o a uma turma!	\N	f	2025-11-04 05:18:05.704046
339	13	planejamento	Novo aluno cadastrado: Theo. Vincule-o a uma turma!	\N	f	2025-11-04 05:18:05.704046
340	14	planejamento	Novo aluno cadastrado: Theo. Vincule-o a uma turma!	\N	f	2025-11-04 05:18:05.704046
341	15	planejamento	Novo aluno cadastrado: Theo. Vincule-o a uma turma!	\N	f	2025-11-04 05:18:05.704046
342	16	planejamento	Novo aluno cadastrado: Theo. Vincule-o a uma turma!	\N	f	2025-11-04 05:18:05.704046
343	17	planejamento	Novo aluno cadastrado: Theo. Vincule-o a uma turma!	\N	f	2025-11-04 05:18:05.704046
344	18	planejamento	Novo aluno cadastrado: Theo. Vincule-o a uma turma!	\N	f	2025-11-04 05:18:05.704046
345	19	planejamento	Novo aluno cadastrado: Theo. Vincule-o a uma turma!	\N	f	2025-11-04 05:18:05.704046
346	20	planejamento	Novo aluno cadastrado: Theo. Vincule-o a uma turma!	\N	f	2025-11-04 05:18:05.704046
347	21	planejamento	Novo aluno cadastrado: Theo. Vincule-o a uma turma!	\N	f	2025-11-04 05:18:05.704046
987	21	planejamento	Novo aluno cadastrado: Lucas Rafael Paulino de Oliveira. Vincule-o a uma turma!	\N	f	2026-01-15 08:28:22.863531
354	11	planejamento	Novo aluno cadastrado: Romeo. Vincule-o a uma turma!	\N	f	2025-11-04 05:18:43.096237
355	12	planejamento	Novo aluno cadastrado: Romeo. Vincule-o a uma turma!	\N	f	2025-11-04 05:18:43.096237
356	13	planejamento	Novo aluno cadastrado: Romeo. Vincule-o a uma turma!	\N	f	2025-11-04 05:18:43.096237
357	14	planejamento	Novo aluno cadastrado: Romeo. Vincule-o a uma turma!	\N	f	2025-11-04 05:18:43.096237
358	15	planejamento	Novo aluno cadastrado: Romeo. Vincule-o a uma turma!	\N	f	2025-11-04 05:18:43.096237
359	16	planejamento	Novo aluno cadastrado: Romeo. Vincule-o a uma turma!	\N	f	2025-11-04 05:18:43.096237
360	17	planejamento	Novo aluno cadastrado: Romeo. Vincule-o a uma turma!	\N	f	2025-11-04 05:18:43.096237
361	18	planejamento	Novo aluno cadastrado: Romeo. Vincule-o a uma turma!	\N	f	2025-11-04 05:18:43.096237
362	19	planejamento	Novo aluno cadastrado: Romeo. Vincule-o a uma turma!	\N	f	2025-11-04 05:18:43.096237
363	20	planejamento	Novo aluno cadastrado: Romeo. Vincule-o a uma turma!	\N	f	2025-11-04 05:18:43.096237
364	21	planejamento	Novo aluno cadastrado: Romeo. Vincule-o a uma turma!	\N	f	2025-11-04 05:18:43.096237
955	21	planejamento	Novo aluno cadastrado: Matheus Bomfati Lemes. Vincule-o a uma turma!	\N	f	2026-01-14 10:56:49.376054
371	11	planejamento	Novo aluno cadastrado: Alice. Vincule-o a uma turma!	\N	f	2025-11-04 05:19:21.428968
372	12	planejamento	Novo aluno cadastrado: Alice. Vincule-o a uma turma!	\N	f	2025-11-04 05:19:21.428968
373	13	planejamento	Novo aluno cadastrado: Alice. Vincule-o a uma turma!	\N	f	2025-11-04 05:19:21.428968
374	14	planejamento	Novo aluno cadastrado: Alice. Vincule-o a uma turma!	\N	f	2025-11-04 05:19:21.428968
375	15	planejamento	Novo aluno cadastrado: Alice. Vincule-o a uma turma!	\N	f	2025-11-04 05:19:21.428968
376	16	planejamento	Novo aluno cadastrado: Alice. Vincule-o a uma turma!	\N	f	2025-11-04 05:19:21.428968
377	17	planejamento	Novo aluno cadastrado: Alice. Vincule-o a uma turma!	\N	f	2025-11-04 05:19:21.428968
378	18	planejamento	Novo aluno cadastrado: Alice. Vincule-o a uma turma!	\N	f	2025-11-04 05:19:21.428968
379	19	planejamento	Novo aluno cadastrado: Alice. Vincule-o a uma turma!	\N	f	2025-11-04 05:19:21.428968
380	20	planejamento	Novo aluno cadastrado: Alice. Vincule-o a uma turma!	\N	f	2025-11-04 05:19:21.428968
381	21	planejamento	Novo aluno cadastrado: Alice. Vincule-o a uma turma!	\N	f	2025-11-04 05:19:21.428968
388	11	planejamento	Novo aluno cadastrado: Cecilia. Vincule-o a uma turma!	\N	f	2025-11-04 05:20:27.974617
389	12	planejamento	Novo aluno cadastrado: Cecilia. Vincule-o a uma turma!	\N	f	2025-11-04 05:20:27.974617
390	13	planejamento	Novo aluno cadastrado: Cecilia. Vincule-o a uma turma!	\N	f	2025-11-04 05:20:27.974617
391	14	planejamento	Novo aluno cadastrado: Cecilia. Vincule-o a uma turma!	\N	f	2025-11-04 05:20:27.974617
392	15	planejamento	Novo aluno cadastrado: Cecilia. Vincule-o a uma turma!	\N	f	2025-11-04 05:20:27.974617
393	16	planejamento	Novo aluno cadastrado: Cecilia. Vincule-o a uma turma!	\N	f	2025-11-04 05:20:27.974617
394	17	planejamento	Novo aluno cadastrado: Cecilia. Vincule-o a uma turma!	\N	f	2025-11-04 05:20:27.974617
395	18	planejamento	Novo aluno cadastrado: Cecilia. Vincule-o a uma turma!	\N	f	2025-11-04 05:20:27.974617
396	19	planejamento	Novo aluno cadastrado: Cecilia. Vincule-o a uma turma!	\N	f	2025-11-04 05:20:27.974617
397	20	planejamento	Novo aluno cadastrado: Cecilia. Vincule-o a uma turma!	\N	f	2025-11-04 05:20:27.974617
398	21	planejamento	Novo aluno cadastrado: Cecilia. Vincule-o a uma turma!	\N	f	2025-11-04 05:20:27.974617
405	11	planejamento	Novo aluno cadastrado: Davi. Vincule-o a uma turma!	\N	f	2025-11-04 05:21:20.72814
406	12	planejamento	Novo aluno cadastrado: Davi. Vincule-o a uma turma!	\N	f	2025-11-04 05:21:20.72814
407	13	planejamento	Novo aluno cadastrado: Davi. Vincule-o a uma turma!	\N	f	2025-11-04 05:21:20.72814
408	14	planejamento	Novo aluno cadastrado: Davi. Vincule-o a uma turma!	\N	f	2025-11-04 05:21:20.72814
409	15	planejamento	Novo aluno cadastrado: Davi. Vincule-o a uma turma!	\N	f	2025-11-04 05:21:20.72814
410	16	planejamento	Novo aluno cadastrado: Davi. Vincule-o a uma turma!	\N	f	2025-11-04 05:21:20.72814
411	17	planejamento	Novo aluno cadastrado: Davi. Vincule-o a uma turma!	\N	f	2025-11-04 05:21:20.72814
412	18	planejamento	Novo aluno cadastrado: Davi. Vincule-o a uma turma!	\N	f	2025-11-04 05:21:20.72814
413	19	planejamento	Novo aluno cadastrado: Davi. Vincule-o a uma turma!	\N	f	2025-11-04 05:21:20.72814
414	20	planejamento	Novo aluno cadastrado: Davi. Vincule-o a uma turma!	\N	f	2025-11-04 05:21:20.72814
415	21	planejamento	Novo aluno cadastrado: Davi. Vincule-o a uma turma!	\N	f	2025-11-04 05:21:20.72814
989	5	anexo_adicionado	Andriely adicionou o anexo "comp-end.pdf" ao Planejamento 1/2026	195	f	2026-01-15 10:18:08.87194
990	5	comentario	Andriely comentou no Planejamento 1/2026	195	f	2026-01-15 10:18:13.482869
422	11	planejamento	Novo aluno cadastrado: Bento. Vincule-o a uma turma!	\N	f	2025-11-04 05:22:06.850438
423	12	planejamento	Novo aluno cadastrado: Bento. Vincule-o a uma turma!	\N	f	2025-11-04 05:22:06.850438
424	13	planejamento	Novo aluno cadastrado: Bento. Vincule-o a uma turma!	\N	f	2025-11-04 05:22:06.850438
425	14	planejamento	Novo aluno cadastrado: Bento. Vincule-o a uma turma!	\N	f	2025-11-04 05:22:06.850438
426	15	planejamento	Novo aluno cadastrado: Bento. Vincule-o a uma turma!	\N	f	2025-11-04 05:22:06.850438
427	16	planejamento	Novo aluno cadastrado: Bento. Vincule-o a uma turma!	\N	f	2025-11-04 05:22:06.850438
428	17	planejamento	Novo aluno cadastrado: Bento. Vincule-o a uma turma!	\N	f	2025-11-04 05:22:06.850438
429	18	planejamento	Novo aluno cadastrado: Bento. Vincule-o a uma turma!	\N	f	2025-11-04 05:22:06.850438
430	19	planejamento	Novo aluno cadastrado: Bento. Vincule-o a uma turma!	\N	f	2025-11-04 05:22:06.850438
431	20	planejamento	Novo aluno cadastrado: Bento. Vincule-o a uma turma!	\N	f	2025-11-04 05:22:06.850438
432	21	planejamento	Novo aluno cadastrado: Bento. Vincule-o a uma turma!	\N	f	2025-11-04 05:22:06.850438
958	11	planejamento	Novo aluno cadastrado: Matheus Bomfati Lemes. Vincule-o a uma turma!	\N	f	2026-01-14 11:40:39.48862
959	12	planejamento	Novo aluno cadastrado: Matheus Bomfati Lemes. Vincule-o a uma turma!	\N	f	2026-01-14 11:40:39.48862
439	11	planejamento	Novo aluno cadastrado: Flora. Vincule-o a uma turma!	\N	f	2025-11-04 05:22:32.128814
440	12	planejamento	Novo aluno cadastrado: Flora. Vincule-o a uma turma!	\N	f	2025-11-04 05:22:32.128814
441	13	planejamento	Novo aluno cadastrado: Flora. Vincule-o a uma turma!	\N	f	2025-11-04 05:22:32.128814
442	14	planejamento	Novo aluno cadastrado: Flora. Vincule-o a uma turma!	\N	f	2025-11-04 05:22:32.128814
443	15	planejamento	Novo aluno cadastrado: Flora. Vincule-o a uma turma!	\N	f	2025-11-04 05:22:32.128814
444	16	planejamento	Novo aluno cadastrado: Flora. Vincule-o a uma turma!	\N	f	2025-11-04 05:22:32.128814
445	17	planejamento	Novo aluno cadastrado: Flora. Vincule-o a uma turma!	\N	f	2025-11-04 05:22:32.128814
446	18	planejamento	Novo aluno cadastrado: Flora. Vincule-o a uma turma!	\N	f	2025-11-04 05:22:32.128814
447	19	planejamento	Novo aluno cadastrado: Flora. Vincule-o a uma turma!	\N	f	2025-11-04 05:22:32.128814
448	20	planejamento	Novo aluno cadastrado: Flora. Vincule-o a uma turma!	\N	f	2025-11-04 05:22:32.128814
449	21	planejamento	Novo aluno cadastrado: Flora. Vincule-o a uma turma!	\N	f	2025-11-04 05:22:32.128814
960	13	planejamento	Novo aluno cadastrado: Matheus Bomfati Lemes. Vincule-o a uma turma!	\N	f	2026-01-14 11:40:39.48862
961	14	planejamento	Novo aluno cadastrado: Matheus Bomfati Lemes. Vincule-o a uma turma!	\N	f	2026-01-14 11:40:39.48862
962	15	planejamento	Novo aluno cadastrado: Matheus Bomfati Lemes. Vincule-o a uma turma!	\N	f	2026-01-14 11:40:39.48862
963	16	planejamento	Novo aluno cadastrado: Matheus Bomfati Lemes. Vincule-o a uma turma!	\N	f	2026-01-14 11:40:39.48862
456	11	planejamento	Novo aluno cadastrado: Antony. Vincule-o a uma turma!	\N	f	2025-11-04 05:23:59.400792
457	12	planejamento	Novo aluno cadastrado: Antony. Vincule-o a uma turma!	\N	f	2025-11-04 05:23:59.400792
458	13	planejamento	Novo aluno cadastrado: Antony. Vincule-o a uma turma!	\N	f	2025-11-04 05:23:59.400792
459	14	planejamento	Novo aluno cadastrado: Antony. Vincule-o a uma turma!	\N	f	2025-11-04 05:23:59.400792
460	15	planejamento	Novo aluno cadastrado: Antony. Vincule-o a uma turma!	\N	f	2025-11-04 05:23:59.400792
461	16	planejamento	Novo aluno cadastrado: Antony. Vincule-o a uma turma!	\N	f	2025-11-04 05:23:59.400792
462	17	planejamento	Novo aluno cadastrado: Antony. Vincule-o a uma turma!	\N	f	2025-11-04 05:23:59.400792
463	18	planejamento	Novo aluno cadastrado: Antony. Vincule-o a uma turma!	\N	f	2025-11-04 05:23:59.400792
464	19	planejamento	Novo aluno cadastrado: Antony. Vincule-o a uma turma!	\N	f	2025-11-04 05:23:59.400792
465	20	planejamento	Novo aluno cadastrado: Antony. Vincule-o a uma turma!	\N	f	2025-11-04 05:23:59.400792
466	21	planejamento	Novo aluno cadastrado: Antony. Vincule-o a uma turma!	\N	f	2025-11-04 05:23:59.400792
964	17	planejamento	Novo aluno cadastrado: Matheus Bomfati Lemes. Vincule-o a uma turma!	\N	f	2026-01-14 11:40:39.48862
965	18	planejamento	Novo aluno cadastrado: Matheus Bomfati Lemes. Vincule-o a uma turma!	\N	f	2026-01-14 11:40:39.48862
966	19	planejamento	Novo aluno cadastrado: Matheus Bomfati Lemes. Vincule-o a uma turma!	\N	f	2026-01-14 11:40:39.48862
967	20	planejamento	Novo aluno cadastrado: Matheus Bomfati Lemes. Vincule-o a uma turma!	\N	f	2026-01-14 11:40:39.48862
473	11	planejamento	Novo aluno cadastrado: Enrico. Vincule-o a uma turma!	\N	f	2025-11-04 05:24:22.07624
474	12	planejamento	Novo aluno cadastrado: Enrico. Vincule-o a uma turma!	\N	f	2025-11-04 05:24:22.07624
475	13	planejamento	Novo aluno cadastrado: Enrico. Vincule-o a uma turma!	\N	f	2025-11-04 05:24:22.07624
476	14	planejamento	Novo aluno cadastrado: Enrico. Vincule-o a uma turma!	\N	f	2025-11-04 05:24:22.07624
477	15	planejamento	Novo aluno cadastrado: Enrico. Vincule-o a uma turma!	\N	f	2025-11-04 05:24:22.07624
478	16	planejamento	Novo aluno cadastrado: Enrico. Vincule-o a uma turma!	\N	f	2025-11-04 05:24:22.07624
479	17	planejamento	Novo aluno cadastrado: Enrico. Vincule-o a uma turma!	\N	f	2025-11-04 05:24:22.07624
480	18	planejamento	Novo aluno cadastrado: Enrico. Vincule-o a uma turma!	\N	f	2025-11-04 05:24:22.07624
481	19	planejamento	Novo aluno cadastrado: Enrico. Vincule-o a uma turma!	\N	f	2025-11-04 05:24:22.07624
482	20	planejamento	Novo aluno cadastrado: Enrico. Vincule-o a uma turma!	\N	f	2025-11-04 05:24:22.07624
483	21	planejamento	Novo aluno cadastrado: Enrico. Vincule-o a uma turma!	\N	f	2025-11-04 05:24:22.07624
968	21	planejamento	Novo aluno cadastrado: Matheus Bomfati Lemes. Vincule-o a uma turma!	\N	f	2026-01-14 11:40:39.48862
490	11	planejamento	Novo aluno cadastrado: Alice. Vincule-o a uma turma!	\N	f	2025-11-04 05:25:12.889511
491	12	planejamento	Novo aluno cadastrado: Alice. Vincule-o a uma turma!	\N	f	2025-11-04 05:25:12.889511
492	13	planejamento	Novo aluno cadastrado: Alice. Vincule-o a uma turma!	\N	f	2025-11-04 05:25:12.889511
493	14	planejamento	Novo aluno cadastrado: Alice. Vincule-o a uma turma!	\N	f	2025-11-04 05:25:12.889511
494	15	planejamento	Novo aluno cadastrado: Alice. Vincule-o a uma turma!	\N	f	2025-11-04 05:25:12.889511
495	16	planejamento	Novo aluno cadastrado: Alice. Vincule-o a uma turma!	\N	f	2025-11-04 05:25:12.889511
496	17	planejamento	Novo aluno cadastrado: Alice. Vincule-o a uma turma!	\N	f	2025-11-04 05:25:12.889511
497	18	planejamento	Novo aluno cadastrado: Alice. Vincule-o a uma turma!	\N	f	2025-11-04 05:25:12.889511
498	19	planejamento	Novo aluno cadastrado: Alice. Vincule-o a uma turma!	\N	f	2025-11-04 05:25:12.889511
499	20	planejamento	Novo aluno cadastrado: Alice. Vincule-o a uma turma!	\N	f	2025-11-04 05:25:12.889511
500	21	planejamento	Novo aluno cadastrado: Alice. Vincule-o a uma turma!	\N	f	2025-11-04 05:25:12.889511
507	11	planejamento	Novo aluno cadastrado: Martin. Vincule-o a uma turma!	\N	f	2025-11-04 05:27:57.058795
508	12	planejamento	Novo aluno cadastrado: Martin. Vincule-o a uma turma!	\N	f	2025-11-04 05:27:57.058795
509	13	planejamento	Novo aluno cadastrado: Martin. Vincule-o a uma turma!	\N	f	2025-11-04 05:27:57.058795
510	14	planejamento	Novo aluno cadastrado: Martin. Vincule-o a uma turma!	\N	f	2025-11-04 05:27:57.058795
511	15	planejamento	Novo aluno cadastrado: Martin. Vincule-o a uma turma!	\N	f	2025-11-04 05:27:57.058795
512	16	planejamento	Novo aluno cadastrado: Martin. Vincule-o a uma turma!	\N	f	2025-11-04 05:27:57.058795
513	17	planejamento	Novo aluno cadastrado: Martin. Vincule-o a uma turma!	\N	f	2025-11-04 05:27:57.058795
514	18	planejamento	Novo aluno cadastrado: Martin. Vincule-o a uma turma!	\N	f	2025-11-04 05:27:57.058795
515	19	planejamento	Novo aluno cadastrado: Martin. Vincule-o a uma turma!	\N	f	2025-11-04 05:27:57.058795
516	20	planejamento	Novo aluno cadastrado: Martin. Vincule-o a uma turma!	\N	f	2025-11-04 05:27:57.058795
517	21	planejamento	Novo aluno cadastrado: Martin. Vincule-o a uma turma!	\N	f	2025-11-04 05:27:57.058795
524	11	planejamento	Novo aluno cadastrado: Thiago. Vincule-o a uma turma!	\N	f	2025-11-04 05:28:51.788809
525	12	planejamento	Novo aluno cadastrado: Thiago. Vincule-o a uma turma!	\N	f	2025-11-04 05:28:51.788809
526	13	planejamento	Novo aluno cadastrado: Thiago. Vincule-o a uma turma!	\N	f	2025-11-04 05:28:51.788809
527	14	planejamento	Novo aluno cadastrado: Thiago. Vincule-o a uma turma!	\N	f	2025-11-04 05:28:51.788809
528	15	planejamento	Novo aluno cadastrado: Thiago. Vincule-o a uma turma!	\N	f	2025-11-04 05:28:51.788809
529	16	planejamento	Novo aluno cadastrado: Thiago. Vincule-o a uma turma!	\N	f	2025-11-04 05:28:51.788809
530	17	planejamento	Novo aluno cadastrado: Thiago. Vincule-o a uma turma!	\N	f	2025-11-04 05:28:51.788809
531	18	planejamento	Novo aluno cadastrado: Thiago. Vincule-o a uma turma!	\N	f	2025-11-04 05:28:51.788809
532	19	planejamento	Novo aluno cadastrado: Thiago. Vincule-o a uma turma!	\N	f	2025-11-04 05:28:51.788809
533	20	planejamento	Novo aluno cadastrado: Thiago. Vincule-o a uma turma!	\N	f	2025-11-04 05:28:51.788809
534	21	planejamento	Novo aluno cadastrado: Thiago. Vincule-o a uma turma!	\N	f	2025-11-04 05:28:51.788809
541	11	planejamento	Novo aluno cadastrado: Leonardo. Vincule-o a uma turma!	\N	f	2025-11-04 05:29:37.699804
542	12	planejamento	Novo aluno cadastrado: Leonardo. Vincule-o a uma turma!	\N	f	2025-11-04 05:29:37.699804
543	13	planejamento	Novo aluno cadastrado: Leonardo. Vincule-o a uma turma!	\N	f	2025-11-04 05:29:37.699804
544	14	planejamento	Novo aluno cadastrado: Leonardo. Vincule-o a uma turma!	\N	f	2025-11-04 05:29:37.699804
545	15	planejamento	Novo aluno cadastrado: Leonardo. Vincule-o a uma turma!	\N	f	2025-11-04 05:29:37.699804
546	16	planejamento	Novo aluno cadastrado: Leonardo. Vincule-o a uma turma!	\N	f	2025-11-04 05:29:37.699804
547	17	planejamento	Novo aluno cadastrado: Leonardo. Vincule-o a uma turma!	\N	f	2025-11-04 05:29:37.699804
548	18	planejamento	Novo aluno cadastrado: Leonardo. Vincule-o a uma turma!	\N	f	2025-11-04 05:29:37.699804
549	19	planejamento	Novo aluno cadastrado: Leonardo. Vincule-o a uma turma!	\N	f	2025-11-04 05:29:37.699804
550	20	planejamento	Novo aluno cadastrado: Leonardo. Vincule-o a uma turma!	\N	f	2025-11-04 05:29:37.699804
551	21	planejamento	Novo aluno cadastrado: Leonardo. Vincule-o a uma turma!	\N	f	2025-11-04 05:29:37.699804
558	11	planejamento	Novo aluno cadastrado: Pedro. Vincule-o a uma turma!	\N	f	2025-11-04 05:30:19.801877
559	12	planejamento	Novo aluno cadastrado: Pedro. Vincule-o a uma turma!	\N	f	2025-11-04 05:30:19.801877
560	13	planejamento	Novo aluno cadastrado: Pedro. Vincule-o a uma turma!	\N	f	2025-11-04 05:30:19.801877
561	14	planejamento	Novo aluno cadastrado: Pedro. Vincule-o a uma turma!	\N	f	2025-11-04 05:30:19.801877
562	15	planejamento	Novo aluno cadastrado: Pedro. Vincule-o a uma turma!	\N	f	2025-11-04 05:30:19.801877
563	16	planejamento	Novo aluno cadastrado: Pedro. Vincule-o a uma turma!	\N	f	2025-11-04 05:30:19.801877
564	17	planejamento	Novo aluno cadastrado: Pedro. Vincule-o a uma turma!	\N	f	2025-11-04 05:30:19.801877
565	18	planejamento	Novo aluno cadastrado: Pedro. Vincule-o a uma turma!	\N	f	2025-11-04 05:30:19.801877
566	19	planejamento	Novo aluno cadastrado: Pedro. Vincule-o a uma turma!	\N	f	2025-11-04 05:30:19.801877
567	20	planejamento	Novo aluno cadastrado: Pedro. Vincule-o a uma turma!	\N	f	2025-11-04 05:30:19.801877
568	21	planejamento	Novo aluno cadastrado: Pedro. Vincule-o a uma turma!	\N	f	2025-11-04 05:30:19.801877
575	11	planejamento	Novo aluno cadastrado: Miguel. Vincule-o a uma turma!	\N	f	2025-11-04 05:30:40.622446
576	12	planejamento	Novo aluno cadastrado: Miguel. Vincule-o a uma turma!	\N	f	2025-11-04 05:30:40.622446
577	13	planejamento	Novo aluno cadastrado: Miguel. Vincule-o a uma turma!	\N	f	2025-11-04 05:30:40.622446
578	14	planejamento	Novo aluno cadastrado: Miguel. Vincule-o a uma turma!	\N	f	2025-11-04 05:30:40.622446
579	15	planejamento	Novo aluno cadastrado: Miguel. Vincule-o a uma turma!	\N	f	2025-11-04 05:30:40.622446
580	16	planejamento	Novo aluno cadastrado: Miguel. Vincule-o a uma turma!	\N	f	2025-11-04 05:30:40.622446
581	17	planejamento	Novo aluno cadastrado: Miguel. Vincule-o a uma turma!	\N	f	2025-11-04 05:30:40.622446
582	18	planejamento	Novo aluno cadastrado: Miguel. Vincule-o a uma turma!	\N	f	2025-11-04 05:30:40.622446
583	19	planejamento	Novo aluno cadastrado: Miguel. Vincule-o a uma turma!	\N	f	2025-11-04 05:30:40.622446
584	20	planejamento	Novo aluno cadastrado: Miguel. Vincule-o a uma turma!	\N	f	2025-11-04 05:30:40.622446
585	21	planejamento	Novo aluno cadastrado: Miguel. Vincule-o a uma turma!	\N	f	2025-11-04 05:30:40.622446
592	11	planejamento	Novo aluno cadastrado: Matteo. Vincule-o a uma turma!	\N	f	2025-11-04 05:31:23.044281
593	12	planejamento	Novo aluno cadastrado: Matteo. Vincule-o a uma turma!	\N	f	2025-11-04 05:31:23.044281
594	13	planejamento	Novo aluno cadastrado: Matteo. Vincule-o a uma turma!	\N	f	2025-11-04 05:31:23.044281
595	14	planejamento	Novo aluno cadastrado: Matteo. Vincule-o a uma turma!	\N	f	2025-11-04 05:31:23.044281
596	15	planejamento	Novo aluno cadastrado: Matteo. Vincule-o a uma turma!	\N	f	2025-11-04 05:31:23.044281
597	16	planejamento	Novo aluno cadastrado: Matteo. Vincule-o a uma turma!	\N	f	2025-11-04 05:31:23.044281
598	17	planejamento	Novo aluno cadastrado: Matteo. Vincule-o a uma turma!	\N	f	2025-11-04 05:31:23.044281
599	18	planejamento	Novo aluno cadastrado: Matteo. Vincule-o a uma turma!	\N	f	2025-11-04 05:31:23.044281
600	19	planejamento	Novo aluno cadastrado: Matteo. Vincule-o a uma turma!	\N	f	2025-11-04 05:31:23.044281
601	20	planejamento	Novo aluno cadastrado: Matteo. Vincule-o a uma turma!	\N	f	2025-11-04 05:31:23.044281
602	21	planejamento	Novo aluno cadastrado: Matteo. Vincule-o a uma turma!	\N	f	2025-11-04 05:31:23.044281
609	11	planejamento	Novo aluno cadastrado: Gea. Vincule-o a uma turma!	\N	f	2025-11-04 05:32:07.76762
610	12	planejamento	Novo aluno cadastrado: Gea. Vincule-o a uma turma!	\N	f	2025-11-04 05:32:07.76762
611	13	planejamento	Novo aluno cadastrado: Gea. Vincule-o a uma turma!	\N	f	2025-11-04 05:32:07.76762
612	14	planejamento	Novo aluno cadastrado: Gea. Vincule-o a uma turma!	\N	f	2025-11-04 05:32:07.76762
613	15	planejamento	Novo aluno cadastrado: Gea. Vincule-o a uma turma!	\N	f	2025-11-04 05:32:07.76762
614	16	planejamento	Novo aluno cadastrado: Gea. Vincule-o a uma turma!	\N	f	2025-11-04 05:32:07.76762
615	17	planejamento	Novo aluno cadastrado: Gea. Vincule-o a uma turma!	\N	f	2025-11-04 05:32:07.76762
616	18	planejamento	Novo aluno cadastrado: Gea. Vincule-o a uma turma!	\N	f	2025-11-04 05:32:07.76762
617	19	planejamento	Novo aluno cadastrado: Gea. Vincule-o a uma turma!	\N	f	2025-11-04 05:32:07.76762
618	20	planejamento	Novo aluno cadastrado: Gea. Vincule-o a uma turma!	\N	f	2025-11-04 05:32:07.76762
619	21	planejamento	Novo aluno cadastrado: Gea. Vincule-o a uma turma!	\N	f	2025-11-04 05:32:07.76762
626	11	planejamento	Novo aluno cadastrado: Bento. Vincule-o a uma turma!	\N	f	2025-11-04 05:32:52.426471
627	12	planejamento	Novo aluno cadastrado: Bento. Vincule-o a uma turma!	\N	f	2025-11-04 05:32:52.426471
628	13	planejamento	Novo aluno cadastrado: Bento. Vincule-o a uma turma!	\N	f	2025-11-04 05:32:52.426471
629	14	planejamento	Novo aluno cadastrado: Bento. Vincule-o a uma turma!	\N	f	2025-11-04 05:32:52.426471
630	15	planejamento	Novo aluno cadastrado: Bento. Vincule-o a uma turma!	\N	f	2025-11-04 05:32:52.426471
631	16	planejamento	Novo aluno cadastrado: Bento. Vincule-o a uma turma!	\N	f	2025-11-04 05:32:52.426471
632	17	planejamento	Novo aluno cadastrado: Bento. Vincule-o a uma turma!	\N	f	2025-11-04 05:32:52.426471
633	18	planejamento	Novo aluno cadastrado: Bento. Vincule-o a uma turma!	\N	f	2025-11-04 05:32:52.426471
634	19	planejamento	Novo aluno cadastrado: Bento. Vincule-o a uma turma!	\N	f	2025-11-04 05:32:52.426471
635	20	planejamento	Novo aluno cadastrado: Bento. Vincule-o a uma turma!	\N	f	2025-11-04 05:32:52.426471
636	21	planejamento	Novo aluno cadastrado: Bento. Vincule-o a uma turma!	\N	f	2025-11-04 05:32:52.426471
643	11	planejamento	Novo aluno cadastrado: Lua. Vincule-o a uma turma!	\N	f	2025-11-04 05:33:54.98225
644	12	planejamento	Novo aluno cadastrado: Lua. Vincule-o a uma turma!	\N	f	2025-11-04 05:33:54.98225
645	13	planejamento	Novo aluno cadastrado: Lua. Vincule-o a uma turma!	\N	f	2025-11-04 05:33:54.98225
646	14	planejamento	Novo aluno cadastrado: Lua. Vincule-o a uma turma!	\N	f	2025-11-04 05:33:54.98225
647	15	planejamento	Novo aluno cadastrado: Lua. Vincule-o a uma turma!	\N	f	2025-11-04 05:33:54.98225
648	16	planejamento	Novo aluno cadastrado: Lua. Vincule-o a uma turma!	\N	f	2025-11-04 05:33:54.98225
649	17	planejamento	Novo aluno cadastrado: Lua. Vincule-o a uma turma!	\N	f	2025-11-04 05:33:54.98225
650	18	planejamento	Novo aluno cadastrado: Lua. Vincule-o a uma turma!	\N	f	2025-11-04 05:33:54.98225
651	19	planejamento	Novo aluno cadastrado: Lua. Vincule-o a uma turma!	\N	f	2025-11-04 05:33:54.98225
652	20	planejamento	Novo aluno cadastrado: Lua. Vincule-o a uma turma!	\N	f	2025-11-04 05:33:54.98225
653	21	planejamento	Novo aluno cadastrado: Lua. Vincule-o a uma turma!	\N	f	2025-11-04 05:33:54.98225
660	11	planejamento	Novo aluno cadastrado: Laura. Vincule-o a uma turma!	\N	f	2025-11-04 05:34:47.203365
661	12	planejamento	Novo aluno cadastrado: Laura. Vincule-o a uma turma!	\N	f	2025-11-04 05:34:47.203365
662	13	planejamento	Novo aluno cadastrado: Laura. Vincule-o a uma turma!	\N	f	2025-11-04 05:34:47.203365
663	14	planejamento	Novo aluno cadastrado: Laura. Vincule-o a uma turma!	\N	f	2025-11-04 05:34:47.203365
664	15	planejamento	Novo aluno cadastrado: Laura. Vincule-o a uma turma!	\N	f	2025-11-04 05:34:47.203365
665	16	planejamento	Novo aluno cadastrado: Laura. Vincule-o a uma turma!	\N	f	2025-11-04 05:34:47.203365
666	17	planejamento	Novo aluno cadastrado: Laura. Vincule-o a uma turma!	\N	f	2025-11-04 05:34:47.203365
667	18	planejamento	Novo aluno cadastrado: Laura. Vincule-o a uma turma!	\N	f	2025-11-04 05:34:47.203365
668	19	planejamento	Novo aluno cadastrado: Laura. Vincule-o a uma turma!	\N	f	2025-11-04 05:34:47.203365
669	20	planejamento	Novo aluno cadastrado: Laura. Vincule-o a uma turma!	\N	f	2025-11-04 05:34:47.203365
670	21	planejamento	Novo aluno cadastrado: Laura. Vincule-o a uma turma!	\N	f	2025-11-04 05:34:47.203365
677	11	planejamento	Novo aluno cadastrado: Caio. Vincule-o a uma turma!	\N	f	2025-11-04 05:35:34.303892
678	12	planejamento	Novo aluno cadastrado: Caio. Vincule-o a uma turma!	\N	f	2025-11-04 05:35:34.303892
679	13	planejamento	Novo aluno cadastrado: Caio. Vincule-o a uma turma!	\N	f	2025-11-04 05:35:34.303892
680	14	planejamento	Novo aluno cadastrado: Caio. Vincule-o a uma turma!	\N	f	2025-11-04 05:35:34.303892
681	15	planejamento	Novo aluno cadastrado: Caio. Vincule-o a uma turma!	\N	f	2025-11-04 05:35:34.303892
682	16	planejamento	Novo aluno cadastrado: Caio. Vincule-o a uma turma!	\N	f	2025-11-04 05:35:34.303892
683	17	planejamento	Novo aluno cadastrado: Caio. Vincule-o a uma turma!	\N	f	2025-11-04 05:35:34.303892
684	18	planejamento	Novo aluno cadastrado: Caio. Vincule-o a uma turma!	\N	f	2025-11-04 05:35:34.303892
685	19	planejamento	Novo aluno cadastrado: Caio. Vincule-o a uma turma!	\N	f	2025-11-04 05:35:34.303892
686	20	planejamento	Novo aluno cadastrado: Caio. Vincule-o a uma turma!	\N	f	2025-11-04 05:35:34.303892
687	21	planejamento	Novo aluno cadastrado: Caio. Vincule-o a uma turma!	\N	f	2025-11-04 05:35:34.303892
694	11	planejamento	Novo aluno cadastrado: Guilherme. Vincule-o a uma turma!	\N	f	2025-11-04 05:36:23.697034
695	12	planejamento	Novo aluno cadastrado: Guilherme. Vincule-o a uma turma!	\N	f	2025-11-04 05:36:23.697034
696	13	planejamento	Novo aluno cadastrado: Guilherme. Vincule-o a uma turma!	\N	f	2025-11-04 05:36:23.697034
697	14	planejamento	Novo aluno cadastrado: Guilherme. Vincule-o a uma turma!	\N	f	2025-11-04 05:36:23.697034
698	15	planejamento	Novo aluno cadastrado: Guilherme. Vincule-o a uma turma!	\N	f	2025-11-04 05:36:23.697034
699	16	planejamento	Novo aluno cadastrado: Guilherme. Vincule-o a uma turma!	\N	f	2025-11-04 05:36:23.697034
700	17	planejamento	Novo aluno cadastrado: Guilherme. Vincule-o a uma turma!	\N	f	2025-11-04 05:36:23.697034
701	18	planejamento	Novo aluno cadastrado: Guilherme. Vincule-o a uma turma!	\N	f	2025-11-04 05:36:23.697034
702	19	planejamento	Novo aluno cadastrado: Guilherme. Vincule-o a uma turma!	\N	f	2025-11-04 05:36:23.697034
703	20	planejamento	Novo aluno cadastrado: Guilherme. Vincule-o a uma turma!	\N	f	2025-11-04 05:36:23.697034
704	21	planejamento	Novo aluno cadastrado: Guilherme. Vincule-o a uma turma!	\N	f	2025-11-04 05:36:23.697034
711	11	planejamento	Novo aluno cadastrado: Laura. Vincule-o a uma turma!	\N	f	2025-11-04 05:36:37.017937
712	12	planejamento	Novo aluno cadastrado: Laura. Vincule-o a uma turma!	\N	f	2025-11-04 05:36:37.017937
713	13	planejamento	Novo aluno cadastrado: Laura. Vincule-o a uma turma!	\N	f	2025-11-04 05:36:37.017937
714	14	planejamento	Novo aluno cadastrado: Laura. Vincule-o a uma turma!	\N	f	2025-11-04 05:36:37.017937
715	15	planejamento	Novo aluno cadastrado: Laura. Vincule-o a uma turma!	\N	f	2025-11-04 05:36:37.017937
716	16	planejamento	Novo aluno cadastrado: Laura. Vincule-o a uma turma!	\N	f	2025-11-04 05:36:37.017937
717	17	planejamento	Novo aluno cadastrado: Laura. Vincule-o a uma turma!	\N	f	2025-11-04 05:36:37.017937
718	18	planejamento	Novo aluno cadastrado: Laura. Vincule-o a uma turma!	\N	f	2025-11-04 05:36:37.017937
719	19	planejamento	Novo aluno cadastrado: Laura. Vincule-o a uma turma!	\N	f	2025-11-04 05:36:37.017937
720	20	planejamento	Novo aluno cadastrado: Laura. Vincule-o a uma turma!	\N	f	2025-11-04 05:36:37.017937
721	21	planejamento	Novo aluno cadastrado: Laura. Vincule-o a uma turma!	\N	f	2025-11-04 05:36:37.017937
728	11	planejamento	Novo aluno cadastrado: Levi. Vincule-o a uma turma!	\N	f	2025-11-04 05:37:10.855913
729	12	planejamento	Novo aluno cadastrado: Levi. Vincule-o a uma turma!	\N	f	2025-11-04 05:37:10.855913
730	13	planejamento	Novo aluno cadastrado: Levi. Vincule-o a uma turma!	\N	f	2025-11-04 05:37:10.855913
731	14	planejamento	Novo aluno cadastrado: Levi. Vincule-o a uma turma!	\N	f	2025-11-04 05:37:10.855913
732	15	planejamento	Novo aluno cadastrado: Levi. Vincule-o a uma turma!	\N	f	2025-11-04 05:37:10.855913
733	16	planejamento	Novo aluno cadastrado: Levi. Vincule-o a uma turma!	\N	f	2025-11-04 05:37:10.855913
734	17	planejamento	Novo aluno cadastrado: Levi. Vincule-o a uma turma!	\N	f	2025-11-04 05:37:10.855913
735	18	planejamento	Novo aluno cadastrado: Levi. Vincule-o a uma turma!	\N	f	2025-11-04 05:37:10.855913
736	19	planejamento	Novo aluno cadastrado: Levi. Vincule-o a uma turma!	\N	f	2025-11-04 05:37:10.855913
737	20	planejamento	Novo aluno cadastrado: Levi. Vincule-o a uma turma!	\N	f	2025-11-04 05:37:10.855913
738	21	planejamento	Novo aluno cadastrado: Levi. Vincule-o a uma turma!	\N	f	2025-11-04 05:37:10.855913
745	11	planejamento	Novo aluno cadastrado: Ariane de Miranda Leal. Vincule-o a uma turma!	\N	f	2025-11-04 05:38:06.70504
746	12	planejamento	Novo aluno cadastrado: Ariane de Miranda Leal. Vincule-o a uma turma!	\N	f	2025-11-04 05:38:06.70504
747	13	planejamento	Novo aluno cadastrado: Ariane de Miranda Leal. Vincule-o a uma turma!	\N	f	2025-11-04 05:38:06.70504
748	14	planejamento	Novo aluno cadastrado: Ariane de Miranda Leal. Vincule-o a uma turma!	\N	f	2025-11-04 05:38:06.70504
749	15	planejamento	Novo aluno cadastrado: Ariane de Miranda Leal. Vincule-o a uma turma!	\N	f	2025-11-04 05:38:06.70504
750	16	planejamento	Novo aluno cadastrado: Ariane de Miranda Leal. Vincule-o a uma turma!	\N	f	2025-11-04 05:38:06.70504
751	17	planejamento	Novo aluno cadastrado: Ariane de Miranda Leal. Vincule-o a uma turma!	\N	f	2025-11-04 05:38:06.70504
752	18	planejamento	Novo aluno cadastrado: Ariane de Miranda Leal. Vincule-o a uma turma!	\N	f	2025-11-04 05:38:06.70504
753	19	planejamento	Novo aluno cadastrado: Ariane de Miranda Leal. Vincule-o a uma turma!	\N	f	2025-11-04 05:38:06.70504
754	20	planejamento	Novo aluno cadastrado: Ariane de Miranda Leal. Vincule-o a uma turma!	\N	f	2025-11-04 05:38:06.70504
755	21	planejamento	Novo aluno cadastrado: Ariane de Miranda Leal. Vincule-o a uma turma!	\N	f	2025-11-04 05:38:06.70504
762	11	planejamento	Novo aluno cadastrado: Maju. Vincule-o a uma turma!	\N	f	2025-11-04 05:38:23.067385
763	12	planejamento	Novo aluno cadastrado: Maju. Vincule-o a uma turma!	\N	f	2025-11-04 05:38:23.067385
764	13	planejamento	Novo aluno cadastrado: Maju. Vincule-o a uma turma!	\N	f	2025-11-04 05:38:23.067385
765	14	planejamento	Novo aluno cadastrado: Maju. Vincule-o a uma turma!	\N	f	2025-11-04 05:38:23.067385
766	15	planejamento	Novo aluno cadastrado: Maju. Vincule-o a uma turma!	\N	f	2025-11-04 05:38:23.067385
767	16	planejamento	Novo aluno cadastrado: Maju. Vincule-o a uma turma!	\N	f	2025-11-04 05:38:23.067385
768	17	planejamento	Novo aluno cadastrado: Maju. Vincule-o a uma turma!	\N	f	2025-11-04 05:38:23.067385
769	18	planejamento	Novo aluno cadastrado: Maju. Vincule-o a uma turma!	\N	f	2025-11-04 05:38:23.067385
770	19	planejamento	Novo aluno cadastrado: Maju. Vincule-o a uma turma!	\N	f	2025-11-04 05:38:23.067385
771	20	planejamento	Novo aluno cadastrado: Maju. Vincule-o a uma turma!	\N	f	2025-11-04 05:38:23.067385
772	21	planejamento	Novo aluno cadastrado: Maju. Vincule-o a uma turma!	\N	f	2025-11-04 05:38:23.067385
779	11	planejamento	Novo aluno cadastrado: Gabriella. Vincule-o a uma turma!	\N	f	2025-11-04 05:39:14.371402
780	12	planejamento	Novo aluno cadastrado: Gabriella. Vincule-o a uma turma!	\N	f	2025-11-04 05:39:14.371402
781	13	planejamento	Novo aluno cadastrado: Gabriella. Vincule-o a uma turma!	\N	f	2025-11-04 05:39:14.371402
782	14	planejamento	Novo aluno cadastrado: Gabriella. Vincule-o a uma turma!	\N	f	2025-11-04 05:39:14.371402
783	15	planejamento	Novo aluno cadastrado: Gabriella. Vincule-o a uma turma!	\N	f	2025-11-04 05:39:14.371402
784	16	planejamento	Novo aluno cadastrado: Gabriella. Vincule-o a uma turma!	\N	f	2025-11-04 05:39:14.371402
785	17	planejamento	Novo aluno cadastrado: Gabriella. Vincule-o a uma turma!	\N	f	2025-11-04 05:39:14.371402
786	18	planejamento	Novo aluno cadastrado: Gabriella. Vincule-o a uma turma!	\N	f	2025-11-04 05:39:14.371402
787	19	planejamento	Novo aluno cadastrado: Gabriella. Vincule-o a uma turma!	\N	f	2025-11-04 05:39:14.371402
788	20	planejamento	Novo aluno cadastrado: Gabriella. Vincule-o a uma turma!	\N	f	2025-11-04 05:39:14.371402
789	21	planejamento	Novo aluno cadastrado: Gabriella. Vincule-o a uma turma!	\N	f	2025-11-04 05:39:14.371402
796	11	planejamento	Novo aluno cadastrado: Joaquim. Vincule-o a uma turma!	\N	f	2025-11-04 05:40:07.906326
797	12	planejamento	Novo aluno cadastrado: Joaquim. Vincule-o a uma turma!	\N	f	2025-11-04 05:40:07.906326
798	13	planejamento	Novo aluno cadastrado: Joaquim. Vincule-o a uma turma!	\N	f	2025-11-04 05:40:07.906326
799	14	planejamento	Novo aluno cadastrado: Joaquim. Vincule-o a uma turma!	\N	f	2025-11-04 05:40:07.906326
800	15	planejamento	Novo aluno cadastrado: Joaquim. Vincule-o a uma turma!	\N	f	2025-11-04 05:40:07.906326
801	16	planejamento	Novo aluno cadastrado: Joaquim. Vincule-o a uma turma!	\N	f	2025-11-04 05:40:07.906326
802	17	planejamento	Novo aluno cadastrado: Joaquim. Vincule-o a uma turma!	\N	f	2025-11-04 05:40:07.906326
803	18	planejamento	Novo aluno cadastrado: Joaquim. Vincule-o a uma turma!	\N	f	2025-11-04 05:40:07.906326
804	19	planejamento	Novo aluno cadastrado: Joaquim. Vincule-o a uma turma!	\N	f	2025-11-04 05:40:07.906326
805	20	planejamento	Novo aluno cadastrado: Joaquim. Vincule-o a uma turma!	\N	f	2025-11-04 05:40:07.906326
806	21	planejamento	Novo aluno cadastrado: Joaquim. Vincule-o a uma turma!	\N	f	2025-11-04 05:40:07.906326
813	11	planejamento	Novo aluno cadastrado: Maya. Vincule-o a uma turma!	\N	f	2025-11-04 05:40:50.675735
814	12	planejamento	Novo aluno cadastrado: Maya. Vincule-o a uma turma!	\N	f	2025-11-04 05:40:50.675735
815	13	planejamento	Novo aluno cadastrado: Maya. Vincule-o a uma turma!	\N	f	2025-11-04 05:40:50.675735
816	14	planejamento	Novo aluno cadastrado: Maya. Vincule-o a uma turma!	\N	f	2025-11-04 05:40:50.675735
817	15	planejamento	Novo aluno cadastrado: Maya. Vincule-o a uma turma!	\N	f	2025-11-04 05:40:50.675735
818	16	planejamento	Novo aluno cadastrado: Maya. Vincule-o a uma turma!	\N	f	2025-11-04 05:40:50.675735
819	17	planejamento	Novo aluno cadastrado: Maya. Vincule-o a uma turma!	\N	f	2025-11-04 05:40:50.675735
820	18	planejamento	Novo aluno cadastrado: Maya. Vincule-o a uma turma!	\N	f	2025-11-04 05:40:50.675735
821	19	planejamento	Novo aluno cadastrado: Maya. Vincule-o a uma turma!	\N	f	2025-11-04 05:40:50.675735
822	20	planejamento	Novo aluno cadastrado: Maya. Vincule-o a uma turma!	\N	f	2025-11-04 05:40:50.675735
823	21	planejamento	Novo aluno cadastrado: Maya. Vincule-o a uma turma!	\N	f	2025-11-04 05:40:50.675735
830	11	planejamento	Novo aluno cadastrado: Lucas. Vincule-o a uma turma!	\N	f	2025-11-04 05:41:30.2639
831	12	planejamento	Novo aluno cadastrado: Lucas. Vincule-o a uma turma!	\N	f	2025-11-04 05:41:30.2639
832	13	planejamento	Novo aluno cadastrado: Lucas. Vincule-o a uma turma!	\N	f	2025-11-04 05:41:30.2639
833	14	planejamento	Novo aluno cadastrado: Lucas. Vincule-o a uma turma!	\N	f	2025-11-04 05:41:30.2639
834	15	planejamento	Novo aluno cadastrado: Lucas. Vincule-o a uma turma!	\N	f	2025-11-04 05:41:30.2639
835	16	planejamento	Novo aluno cadastrado: Lucas. Vincule-o a uma turma!	\N	f	2025-11-04 05:41:30.2639
836	17	planejamento	Novo aluno cadastrado: Lucas. Vincule-o a uma turma!	\N	f	2025-11-04 05:41:30.2639
837	18	planejamento	Novo aluno cadastrado: Lucas. Vincule-o a uma turma!	\N	f	2025-11-04 05:41:30.2639
838	19	planejamento	Novo aluno cadastrado: Lucas. Vincule-o a uma turma!	\N	f	2025-11-04 05:41:30.2639
839	20	planejamento	Novo aluno cadastrado: Lucas. Vincule-o a uma turma!	\N	f	2025-11-04 05:41:30.2639
840	21	planejamento	Novo aluno cadastrado: Lucas. Vincule-o a uma turma!	\N	f	2025-11-04 05:41:30.2639
847	11	planejamento	Novo aluno cadastrado: Theodoro. Vincule-o a uma turma!	\N	f	2025-11-04 05:42:07.523762
848	12	planejamento	Novo aluno cadastrado: Theodoro. Vincule-o a uma turma!	\N	f	2025-11-04 05:42:07.523762
849	13	planejamento	Novo aluno cadastrado: Theodoro. Vincule-o a uma turma!	\N	f	2025-11-04 05:42:07.523762
850	14	planejamento	Novo aluno cadastrado: Theodoro. Vincule-o a uma turma!	\N	f	2025-11-04 05:42:07.523762
851	15	planejamento	Novo aluno cadastrado: Theodoro. Vincule-o a uma turma!	\N	f	2025-11-04 05:42:07.523762
852	16	planejamento	Novo aluno cadastrado: Theodoro. Vincule-o a uma turma!	\N	f	2025-11-04 05:42:07.523762
853	17	planejamento	Novo aluno cadastrado: Theodoro. Vincule-o a uma turma!	\N	f	2025-11-04 05:42:07.523762
854	18	planejamento	Novo aluno cadastrado: Theodoro. Vincule-o a uma turma!	\N	f	2025-11-04 05:42:07.523762
855	19	planejamento	Novo aluno cadastrado: Theodoro. Vincule-o a uma turma!	\N	f	2025-11-04 05:42:07.523762
856	20	planejamento	Novo aluno cadastrado: Theodoro. Vincule-o a uma turma!	\N	f	2025-11-04 05:42:07.523762
857	21	planejamento	Novo aluno cadastrado: Theodoro. Vincule-o a uma turma!	\N	f	2025-11-04 05:42:07.523762
864	11	planejamento	Novo aluno cadastrado: Italo. Vincule-o a uma turma!	\N	f	2025-11-04 05:42:48.276563
865	12	planejamento	Novo aluno cadastrado: Italo. Vincule-o a uma turma!	\N	f	2025-11-04 05:42:48.276563
866	13	planejamento	Novo aluno cadastrado: Italo. Vincule-o a uma turma!	\N	f	2025-11-04 05:42:48.276563
867	14	planejamento	Novo aluno cadastrado: Italo. Vincule-o a uma turma!	\N	f	2025-11-04 05:42:48.276563
868	15	planejamento	Novo aluno cadastrado: Italo. Vincule-o a uma turma!	\N	f	2025-11-04 05:42:48.276563
869	16	planejamento	Novo aluno cadastrado: Italo. Vincule-o a uma turma!	\N	f	2025-11-04 05:42:48.276563
870	17	planejamento	Novo aluno cadastrado: Italo. Vincule-o a uma turma!	\N	f	2025-11-04 05:42:48.276563
871	18	planejamento	Novo aluno cadastrado: Italo. Vincule-o a uma turma!	\N	f	2025-11-04 05:42:48.276563
872	19	planejamento	Novo aluno cadastrado: Italo. Vincule-o a uma turma!	\N	f	2025-11-04 05:42:48.276563
873	20	planejamento	Novo aluno cadastrado: Italo. Vincule-o a uma turma!	\N	f	2025-11-04 05:42:48.276563
874	21	planejamento	Novo aluno cadastrado: Italo. Vincule-o a uma turma!	\N	f	2025-11-04 05:42:48.276563
881	11	planejamento	Novo aluno cadastrado: Marina. Vincule-o a uma turma!	\N	f	2025-11-04 05:43:34.303422
882	12	planejamento	Novo aluno cadastrado: Marina. Vincule-o a uma turma!	\N	f	2025-11-04 05:43:34.303422
883	13	planejamento	Novo aluno cadastrado: Marina. Vincule-o a uma turma!	\N	f	2025-11-04 05:43:34.303422
884	14	planejamento	Novo aluno cadastrado: Marina. Vincule-o a uma turma!	\N	f	2025-11-04 05:43:34.303422
885	15	planejamento	Novo aluno cadastrado: Marina. Vincule-o a uma turma!	\N	f	2025-11-04 05:43:34.303422
886	16	planejamento	Novo aluno cadastrado: Marina. Vincule-o a uma turma!	\N	f	2025-11-04 05:43:34.303422
887	17	planejamento	Novo aluno cadastrado: Marina. Vincule-o a uma turma!	\N	f	2025-11-04 05:43:34.303422
888	18	planejamento	Novo aluno cadastrado: Marina. Vincule-o a uma turma!	\N	f	2025-11-04 05:43:34.303422
889	19	planejamento	Novo aluno cadastrado: Marina. Vincule-o a uma turma!	\N	f	2025-11-04 05:43:34.303422
890	20	planejamento	Novo aluno cadastrado: Marina. Vincule-o a uma turma!	\N	f	2025-11-04 05:43:34.303422
891	21	planejamento	Novo aluno cadastrado: Marina. Vincule-o a uma turma!	\N	f	2025-11-04 05:43:34.303422
895	11	planejamento	Novo aluno cadastrado: Matheus Bomfati Lemes. Vincule-o a uma turma!	\N	f	2025-11-04 06:53:49.790421
896	12	planejamento	Novo aluno cadastrado: Matheus Bomfati Lemes. Vincule-o a uma turma!	\N	f	2025-11-04 06:53:49.790421
897	13	planejamento	Novo aluno cadastrado: Matheus Bomfati Lemes. Vincule-o a uma turma!	\N	f	2025-11-04 06:53:49.790421
898	14	planejamento	Novo aluno cadastrado: Matheus Bomfati Lemes. Vincule-o a uma turma!	\N	f	2025-11-04 06:53:49.790421
899	15	planejamento	Novo aluno cadastrado: Matheus Bomfati Lemes. Vincule-o a uma turma!	\N	f	2025-11-04 06:53:49.790421
900	16	planejamento	Novo aluno cadastrado: Matheus Bomfati Lemes. Vincule-o a uma turma!	\N	f	2025-11-04 06:53:49.790421
901	17	planejamento	Novo aluno cadastrado: Matheus Bomfati Lemes. Vincule-o a uma turma!	\N	f	2025-11-04 06:53:49.790421
902	18	planejamento	Novo aluno cadastrado: Matheus Bomfati Lemes. Vincule-o a uma turma!	\N	f	2025-11-04 06:53:49.790421
903	19	planejamento	Novo aluno cadastrado: Matheus Bomfati Lemes. Vincule-o a uma turma!	\N	f	2025-11-04 06:53:49.790421
904	20	planejamento	Novo aluno cadastrado: Matheus Bomfati Lemes. Vincule-o a uma turma!	\N	f	2025-11-04 06:53:49.790421
905	21	planejamento	Novo aluno cadastrado: Matheus Bomfati Lemes. Vincule-o a uma turma!	\N	f	2025-11-04 06:53:49.790421
\.

COPY public.planejamento_anexos (id_anexo, planejamento_id, nome_arquivo, path_arquivo, data_upload) FROM stdin;
11	195	comp-end.pdf	uploads\\1768387506577-comp-end.pdf	2026-01-14 07:45:06.721512-03
12	195	comp-end.pdf	uploads\\1768483088857-comp-end.pdf	2026-01-15 10:18:08.863991-03
\.

COPY public.planejamento_comentarios (id_comentario, planejamento_id, usuario_id, texto_comentario, data_comentario) FROM stdin;
51	195	5	aaaa	2026-01-14 07:44:54.411553-03
52	195	5	aaaa	2026-01-14 07:44:57.165133-03
53	196	5	aaaaaaaa	2026-01-14 07:46:41.81237-03
54	196	5	aaaaaaaa	2026-01-14 07:51:23.847603-03
55	196	5	aaaa	2026-01-14 07:51:40.066775-03
56	195	5	aa	2026-01-14 08:06:01.739467-03
57	203	5	aaaaaaaaaaa	2026-01-14 12:28:14.240874-03
58	200	5	aaaaaaaaaaaaa	2026-01-14 12:32:28.010277-03
59	195	21	aaaaaaaa	2026-01-15 10:18:13.480723-03
\.

COPY public.planejamentos (id_planejamento, turma_id, ano, mes, status, data_criacao, data_modificacao, usuario_id) FROM stdin;
203	30	2026	6	Pendente	2026-01-14 12:28:12.049853-03	2026-01-14 12:28:12.049853-03	5
202	30	2026	3	Reprovado	2026-01-14 12:26:06.965569-03	2026-01-14 12:29:24.721042-03	5
196	29	2026	2	Pendente	2026-01-14 07:44:47.438409-03	2026-01-14 07:44:47.438409-03	5
195	29	2026	1	Reprovado	2026-01-14 07:44:17.299043-03	2026-01-14 07:52:00.918652-03	5
197	29	2026	6	Pendente	2026-01-14 08:05:45.661613-03	2026-01-14 08:05:45.661613-03	5
198	30	2026	5	Pendente	2026-01-14 11:14:27.091662-03	2026-01-14 11:14:27.091662-03	5
199	30	2026	1	Pendente	2026-01-14 11:35:38.789209-03	2026-01-14 11:35:38.789209-03	5
200	30	2026	2	Pendente	2026-01-14 11:37:37.920412-03	2026-01-14 11:37:37.920412-03	5
\.

COPY public.presencas (id_presenca, aluno_id, turma_id, data_aula, status_presenca, observacao) FROM stdin;
40	48	29	2026-01-14	P	
41	46	34	2026-01-15	P	
42	71	34	2026-01-15	P	
\.

COPY public.relatorios (id, nome_arquivo, nome_original, tipo_mime, tamanho_bytes, data_upload, tipo_destino, destino_id, caminho_arquivo) FROM stdin;
\.

COPY public.turma_alunos (id, aluno_id, turma_id, data_matricula) FROM stdin;
90	86	30	2026-01-14 08:56:28.822112-03
91	47	30	2026-01-14 08:56:28.822112-03
92	48	30	2026-01-14 08:56:28.822112-03
93	45	30	2026-01-14 08:56:28.822112-03
103	71	34	2026-01-15 08:43:48.455368-03
104	97	29	2026-01-15 09:20:19.576045-03
105	98	29	2026-01-15 09:20:19.576045-03
94	97	32	2026-01-14 10:57:01.194717-03
95	98	32	2026-01-14 10:57:05.327635-03
97	86	29	2026-01-14 11:48:38.334172-03
98	47	29	2026-01-14 11:48:38.334172-03
99	48	29	2026-01-14 11:48:38.334172-03
100	45	29	2026-01-14 11:48:38.334172-03
88	46	34	2026-01-14 08:56:28.822112-03
\.

COPY public.turma_professores (turma_id, usuario_id) FROM stdin;
29	21
30	16
32	21
34	21
\.

COPY public.turmas (id, nome_turma, ano_letivo, created_at, periodo, nivel) FROM stdin;
29	dale	2026	2026-01-14 04:15:19.494188-03	tarde	maternal
30	aaaaaaa	2026	2026-01-14 08:18:14.609143-03	manha	maternal
32	daleffun	2026	2026-01-14 10:55:27.402396-03	manha	fundamental
34	tchurma	2026	2026-01-15 08:29:00.818935-03	manha	fundamental
\.

COPY public.usuarios (id, nome, email, senha, cargo, created_at, foto_perfil) FROM stdin;
11	Emanuely	emanuely@gmail.com	$2b$10$4GWXNfjTSgSD8liMXQX6MOzmer4eU6blthAit9z1kh0T9QL9mks26	Professor	2025-11-04 04:56:15.175999-03	\N
12	Natasha	natasha@gmail.com	$2b$10$2XKphnbs5H6eFfsEmUG5VeHzD.MiaClOHDw6YNGGCU8z2iW92j.NG	Professor	2025-11-04 04:57:02.224798-03	\N
13	Samantha	samatha@gmail.com	$2b$10$bDI6s2I.mltIV93GtIUo/etBr7qH9XapO12ems3EzaJs6i/pMaEdy	Professor	2025-11-04 04:57:21.557755-03	\N
14	Pamella	pamella@gmail.com	$2b$10$w87DdftbAoGYu3ZSixPiSON7WJpxEOeIBJuLOzJYZn7UejNP5gcHG	Professor	2025-11-04 04:57:33.594057-03	\N
15	Jaqueline	jaqueline@gmail.com	$2b$10$OfDPMwMM5DWTkbRaGGWgauBqnlTwKPPg2OUX6REL5ykaY4BRgkU3q	Professor	2025-11-04 04:57:48.733879-03	\N
16	Rhauane	rhauane@gmail.com	$2b$10$DeSVdQJkPhUr3k4OKRU.u.9vlpKHwJGdjjMUCB2hdsxby2pTOr.QG	Professor	2025-11-04 04:58:00.235344-03	\N
17	Heloisa	heloisa@gmail.com	$2b$10$s4Xw7MTDuVn6QT8uMJ0c..WEwCtT82P9FOQisQycPEinlThxGV.5W	Professor	2025-11-04 04:58:13.565103-03	\N
18	Michelle	michelle@gmail.com	$2b$10$yPUiL5ibUjuivDGYhkf8xe5COjyKl56TkQYau.acDdNZyCDQUAwr.	Professor	2025-11-04 04:58:40.82993-03	\N
19	Karla	karla@gmail.com	$2b$10$.U5.332QpvLL02r.MmvQf.HYJc.DXPuNxraCR4xZy5Xfm8Oj.2U7G	Professor	2025-11-04 04:58:59.746554-03	\N
20	Bruna	bruna@gmail.com	$2b$10$Ob0uPYiMTmDROewG/6QD3OqwbPEM0xhMNMKixBz8nkos5M/2NoLsy	Professor	2025-11-04 04:59:33.918034-03	\N
21	Andriely	andriely@gmail.com	$2b$10$v9sO9izH7.bsxYgTVJ0aUO5WE4fcMVIFMyZLShk7Mt6rAJ3pHRAWq	Professor	2025-11-04 04:59:44.314899-03	\N
5	Matheus Bomfati	matheusbomfati10@gmail.com	$2b$10$vdeMUa9EkFreaRUcDaBzxuszJDxCDOYn4T3bqlhJixq3Wt3jkQQtO	Administrador Geral	2025-08-20 14:02:11.515809-03	/uploads/image/profile_5_1768484616277.avif
\.

SELECT pg_catalog.setval('public.aluno_anexos_id_seq', 2, true);

SELECT pg_catalog.setval('public.alunos_id_seq', 100, true);

SELECT pg_catalog.setval('public.familias_id_seq', 99, true);

SELECT pg_catalog.setval('public.interessados_id_seq', 43, true);

SELECT pg_catalog.setval('public.notificacoes_id_seq', 990, true);

SELECT pg_catalog.setval('public.planejamento_anexos_id_anexo_seq', 12, true);

SELECT pg_catalog.setval('public.planejamento_comentarios_id_comentario_seq', 59, true);

SELECT pg_catalog.setval('public.planejamentos_id_planejamento_seq', 203, true);

SELECT pg_catalog.setval('public.presencas_id_presenca_seq', 42, true);

SELECT pg_catalog.setval('public.relatorios_id_seq', 1, true);

SELECT pg_catalog.setval('public.turma_alunos_id_seq', 105, true);

SELECT pg_catalog.setval('public.turmas_id_seq', 34, true);

SELECT pg_catalog.setval('public.usuarios_id_seq', 24, true);

ALTER TABLE ONLY public.aluno_anexos
    ADD CONSTRAINT aluno_anexos_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.alunos
    ADD CONSTRAINT alunos_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.familias
    ADD CONSTRAINT familias_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.interessados
    ADD CONSTRAINT interessados_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.notificacoes
    ADD CONSTRAINT notificacoes_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.planejamento_anexos
    ADD CONSTRAINT planejamento_anexos_pkey PRIMARY KEY (id_anexo);

ALTER TABLE ONLY public.planejamento_comentarios
    ADD CONSTRAINT planejamento_comentarios_pkey PRIMARY KEY (id_comentario);

ALTER TABLE ONLY public.planejamentos
    ADD CONSTRAINT planejamentos_pkey PRIMARY KEY (id_planejamento);

ALTER TABLE ONLY public.presencas
    ADD CONSTRAINT presencas_aluno_turma_data_unicos UNIQUE (aluno_id, turma_id, data_aula);

ALTER TABLE ONLY public.presencas
    ADD CONSTRAINT presencas_pkey PRIMARY KEY (id_presenca);

ALTER TABLE ONLY public.relatorios
    ADD CONSTRAINT relatorios_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.turma_alunos
    ADD CONSTRAINT turma_alunos_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.turma_alunos
    ADD CONSTRAINT turma_alunos_turma_aluno_unique UNIQUE (turma_id, aluno_id);

COMMENT ON CONSTRAINT turma_alunos_turma_aluno_unique ON public.turma_alunos IS 'Permite que um aluno esteja em múltiplas turmas (diferentes anos letivos), mas não duplicado na mesma turma';

ALTER TABLE ONLY public.turma_professores
    ADD CONSTRAINT turma_professores_pkey PRIMARY KEY (turma_id, usuario_id);

ALTER TABLE ONLY public.turmas
    ADD CONSTRAINT turmas_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.familias
    ADD CONSTRAINT uk_familias_cpf UNIQUE (cpf);

ALTER TABLE ONLY public.planejamentos
    ADD CONSTRAINT uk_planejamento_mensal UNIQUE (turma_id, ano, mes);

COMMENT ON CONSTRAINT uk_planejamento_mensal ON public.planejamentos IS 'Garante apenas um planejamento por turma/ano/mês';

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key UNIQUE (email);

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);

CREATE INDEX idx_aluno_anexos_aluno_id ON public.aluno_anexos USING btree (aluno_id);

CREATE INDEX idx_familias_cidade ON public.familias USING btree (cidade);

CREATE INDEX idx_familias_cpf ON public.familias USING btree (cpf);

CREATE INDEX idx_familias_cpf_normalizado ON public.familias USING btree (cpf_normalizado);

CREATE INDEX idx_familias_email ON public.familias USING btree (email) WHERE ((email IS NOT NULL) AND ((email)::text <> ''::text));

CREATE INDEX idx_notificacoes_created_at ON public.notificacoes USING btree (created_at DESC);

CREATE INDEX idx_notificacoes_lida ON public.notificacoes USING btree (lida);

CREATE INDEX idx_notificacoes_usuario_id ON public.notificacoes USING btree (usuario_id);

CREATE INDEX idx_planejamentos_ano_mes ON public.planejamentos USING btree (ano, mes);

CREATE INDEX idx_planejamentos_status ON public.planejamentos USING btree (status);

CREATE INDEX idx_planejamentos_turma_id ON public.planejamentos USING btree (turma_id);

CREATE INDEX idx_planejamentos_usuario_id ON public.planejamentos USING btree (usuario_id);

CREATE INDEX idx_relatorios_data_upload ON public.relatorios USING btree (data_upload);

CREATE INDEX idx_relatorios_destino_id ON public.relatorios USING btree (destino_id);

CREATE INDEX idx_relatorios_tipo_destino ON public.relatorios USING btree (tipo_destino);

CREATE INDEX idx_turma_alunos_aluno_id ON public.turma_alunos USING btree (aluno_id);

CREATE INDEX idx_turma_alunos_turma_id ON public.turma_alunos USING btree (turma_id);

CREATE UNIQUE INDEX ux_familias_cpf_normalizado ON public.familias USING btree (cpf_normalizado) WHERE ((cpf_normalizado IS NOT NULL) AND (cpf_normalizado <> ''::text));

CREATE TRIGGER trigger_atualizar_data_modificacao BEFORE UPDATE ON public.planejamentos FOR EACH ROW EXECUTE FUNCTION public.atualizar_data_modificacao();

ALTER TABLE ONLY public.alunos
    ADD CONSTRAINT alunos_familia_id_fkey FOREIGN KEY (familia_id) REFERENCES public.familias(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.aluno_anexos
    ADD CONSTRAINT fk_aluno_anexos_aluno FOREIGN KEY (aluno_id) REFERENCES public.alunos(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.planejamento_comentarios
    ADD CONSTRAINT fk_comentarios_usuarios FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);

ALTER TABLE ONLY public.planejamentos
    ADD CONSTRAINT fk_planejamento_turma FOREIGN KEY (turma_id) REFERENCES public.turmas(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.planejamentos
    ADD CONSTRAINT fk_planejamento_usuario FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.planejamentos
    ADD CONSTRAINT fk_planejamentos_usuario FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);

ALTER TABLE ONLY public.notificacoes
    ADD CONSTRAINT notificacoes_planejamento_id_fkey FOREIGN KEY (planejamento_id) REFERENCES public.planejamentos(id_planejamento) ON DELETE CASCADE;

ALTER TABLE ONLY public.notificacoes
    ADD CONSTRAINT notificacoes_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.planejamento_anexos
    ADD CONSTRAINT planejamento_anexos_planejamento_id_fkey FOREIGN KEY (planejamento_id) REFERENCES public.planejamentos(id_planejamento) ON DELETE CASCADE;

ALTER TABLE ONLY public.planejamento_comentarios
    ADD CONSTRAINT planejamento_comentarios_planejamento_id_fkey FOREIGN KEY (planejamento_id) REFERENCES public.planejamentos(id_planejamento) ON DELETE CASCADE;

ALTER TABLE ONLY public.planejamento_comentarios
    ADD CONSTRAINT planejamento_comentarios_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);

ALTER TABLE ONLY public.presencas
    ADD CONSTRAINT presencas_aluno_id_fkey FOREIGN KEY (aluno_id) REFERENCES public.alunos(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.presencas
    ADD CONSTRAINT presencas_turma_id_fkey FOREIGN KEY (turma_id) REFERENCES public.turmas(id);

ALTER TABLE ONLY public.turma_alunos
    ADD CONSTRAINT turma_alunos_aluno_id_fkey FOREIGN KEY (aluno_id) REFERENCES public.alunos(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.turma_alunos
    ADD CONSTRAINT turma_alunos_turma_id_fkey FOREIGN KEY (turma_id) REFERENCES public.turmas(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.turma_professores
    ADD CONSTRAINT turma_professores_turma_id_fkey FOREIGN KEY (turma_id) REFERENCES public.turmas(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.turma_professores
    ADD CONSTRAINT turma_professores_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;
