set foreign_key_checks=0;

create table if not exists contato (
  contato_id int(11) not null auto_increment,
  blip_contato_id varchar(100) not null default '',
  nome varchar(100) not null default '',
  cidade varchar(50) not null default '',
  telefone varchar(20) not null default '',
  whatsapp varchar(20) not null default '',
  email varchar(50) not null default '',
  empresa varchar(100) not null default '',
  canal int(1) not null default '0', -- Canal | 1-WhatsApp, 2-Telegram, 3-Messenger, 4-WebChat, 9-Outro
  url_foto varchar(500) not null default '',
  primary key (contato_id),
  unique key uk_contato_1 (blip_contato_id)
) engine=innodb default charset=latin1;

create table if not exists atendente (
  atendente_id int(11) not null auto_increment,
  sommusgestor_atendente_id int(11) not null default 0,
  nome varchar(100) not null default '',
  email varchar(50) not null default '',
  url_foto varchar(500) not null default '',
  excluido tinyint(1) not null default '0',
  primary key (atendente_id),
  unique key uk_atendente_1 (sommusgestor_atendente_id)
) engine=innodb default charset=latin1;

create table if not exists departamento (
  departamento_id int(11) not null auto_increment,
  sommusgestor_departamento_id int(11) not null default 0,
  nome varchar(50) not null default '',
  excluido tinyint(1) not null default '0',
  primary key (departamento_id),
  unique key uk_departamento_1 (sommusgestor_departamento_id)
) engine=innodb default charset=latin1;

create table if not exists departamento_atendente (
  departamento_id int(11) not null default '0',
  atendente_id int(11) not null default '0',
  principal tinyint(1) not null default '0',
  primary key (departamento_id, atendente_id),
  key k_departamento_atendente_1 (departamento_id),
  key k_departamento_atendente_2 (atendente_id),
  constraint fk_departamento_atendente_1 foreign key (departamento_id) references departamento (departamento_id),
  constraint fk_departamento_atendente_2 foreign key (atendente_id) references atendente (atendente_id)
) engine=innodb default charset=latin1;

create table if not exists equipe (
  equipe_id int(11) not null auto_increment,
  sommusgestor_equipe_id int(11) not null default 0,
  nome varchar(50) not null default '',
  departamento_id int(11) default null,
  excluido tinyint(1) not null default '0',
  primary key (equipe_id),
  unique key uk_equipe_1 (sommusgestor_equipe_id),
  key k_equipe_1 (departamento_id),
  constraint fk_equipe_1 foreign key (departamento_id) references departamento (departamento_id)
) engine=innodb default charset=latin1;

create table if not exists equipe_atendente (
  equipe_id int(11) not null default '0',
  atendente_id int(11) not null default '0',
  principal tinyint(1) not null default '0',
  primary key (equipe_id, atendente_id),
  key k_equipe_atendente_1 (equipe_id),
  key k_equipe_atendente_2 (atendente_id),
  constraint fk_equipe_atendente_1 foreign key (equipe_id) references equipe (equipe_id),
  constraint fk_equipe_atendente_2 foreign key (atendente_id) references atendente (atendente_id)
) engine=innodb default charset=latin1;

create table if not exists atendimento (
  atendimento_id int(11) not null auto_increment,
  blip_atendimento_id varchar(100) not null default '',
  contato_id int(11) not null default '0',
  atendente_id int(11) default null,
  equipe_id int(11) default null,
  departamento_id int(11) default null,
  data_hora datetime not null default '0001-01-01 00:00:00',
  status int(1) not null default '0', -- Status | 1-Aguardando, 2-Atendendo, 3-Finalizado
  nota int(2) default null,
  primary key (atendimento_id),
  unique key uk_atendimento_1 (blip_atendimento_id),
  key k_atendimento_1 (contato_id),
  key k_atendimento_2 (atendente_id),
  key k_atendimento_3 (equipe_id),
  key k_atendimento_4 (departamento_id),
  constraint fk_atendimento_1 foreign key (contato_id) references contato (contato_id),
  constraint fk_atendimento_2 foreign key (atendente_id) references atendente (atendente_id),
  constraint fk_atendimento_3 foreign key (equipe_id) references equipe (equipe_id),
  constraint fk_atendimento_4 foreign key (departamento_id) references departamento (departamento_id)
) engine=innodb default charset=latin1;

create table if not exists atendimento_mensagem (
  atendimento_mensagem_id int(11) not null auto_increment,
  blip_mensagem_id varchar(100) not null default '',
  atendimento_id int(11) not null default '0',
  atendente_id int(11) default null,
  equipe_id int(11) default null,
  departamento_id int(11) default null,
  data_hora datetime not null default '0001-01-01 00:00:00',
  enviada_recebida char(1) not null default '', -- Enviada ou Recebida? | E-Enviada, R-Recebida
  formato int(1) not null default '0', -- Tipo | 1-Texto, 2-Arquivo
  conteudo text not null,
  primary key (atendimento_mensagem_id),
  unique key uk_atendimento_mensagem_1 (blip_mensagem_id),
  key k_atendimento_mensagem_1 (atendimento_id),
  key k_atendimento_mensagem_2 (atendente_id),
  key k_atendimento_mensagem_3 (equipe_id),
  key k_atendimento_mensagem_4 (departamento_id),
  constraint fk_atendimento_mensagem_1 foreign key (atendimento_id) references atendimento (atendimento_id),
  constraint fk_atendimento_mensagem_2 foreign key (atendente_id) references atendente (atendente_id),
  constraint fk_atendimento_mensagem_3 foreign key (equipe_id) references equipe (equipe_id),
  constraint fk_atendimento_mensagem_4 foreign key (departamento_id) references departamento (departamento_id)
) engine=innodb default charset=latin1;

create table if not exists atendimento_atividade (
  atendimento_atividade_id int(11) not null auto_increment,
  atendimento_id int(11) not null default '0',
  atendente_id int(11) not null default '0',
  data_hora datetime not null default '0001-01-01 00:00:00',
  atividade int(1) not null default '0', -- Atividade | 1-Atendeu, 2-Transferiu, 3-Finalizou
  transferencia_atendente_id int(11) default null,
  transferencia_equipe_id int(11) default null,
  transferencia_departamento_id int(11) default null,
  primary key (atendimento_atividade_id),
  key k_atendimento_atividade_1 (atendimento_id),
  key k_atendimento_atividade_2 (atendente_id),
  key k_atendimento_atividade_3 (transferencia_atendente_id),
  key k_atendimento_atividade_4 (transferencia_equipe_id),
  key k_atendimento_atividade_5 (transferencia_departamento_id),
  constraint fk_atendimento_atividade_1 foreign key (atendimento_id) references atendimento (atendimento_id),
  constraint fk_atendimento_atividade_2 foreign key (atendente_id) references atendente (atendente_id),
  constraint fk_atendimento_atividade_3 foreign key (transferencia_atendente_id) references atendente (atendente_id),
  constraint fk_atendimento_atividade_4 foreign key (transferencia_equipe_id) references equipe (equipe_id),
  constraint fk_atendimento_atividade_5 foreign key (transferencia_departamento_id) references departamento (departamento_id)
) engine=innodb default charset=latin1;

create table if not exists redirecionamento (
  redirecionamento_id int(11) not null auto_increment,
  mensagem text not null,
  atendente_id int(11) default null,
  equipe_id int(11) default null,
  departamento_id int(11) default null,
  primary key (redirecionamento_id),
  constraint fk_redirecionamento_1 foreign key (atendente_id) references atendente (atendente_id),
  constraint fk_redirecionamento_2 foreign key (equipe_id) references equipe (equipe_id),
  constraint fk_redirecionamento_3 foreign key (departamento_id) references departamento (departamento_id)
) engine=innodb default charset=latin1;

set foreign_key_checks=1;