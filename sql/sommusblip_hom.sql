-- MySQL dump 10.13  Distrib 5.7.41, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: sommusblip
-- ------------------------------------------------------
-- Server version	5.7.41

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `atendente`
--

DROP TABLE IF EXISTS `atendente`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `atendente` (
  `atendente_id` int(11) NOT NULL AUTO_INCREMENT,
  `sommusgestor_atendente_id` int(11) NOT NULL DEFAULT '0',
  `nome` varchar(100) NOT NULL DEFAULT '',
  `email` varchar(50) NOT NULL DEFAULT '',
  `url_foto` varchar(500) NOT NULL DEFAULT '',
  `excluido` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`atendente_id`) USING BTREE,
  UNIQUE KEY `uk_atendente_1` (`sommusgestor_atendente_id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=82 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `atendente`
--

/*!40000 ALTER TABLE `atendente` DISABLE KEYS */;
INSERT INTO `atendente` VALUES (1,1,'SommusGestor','sommusgestor@sommusgestor.com','',0);
/*!40000 ALTER TABLE `atendente` ENABLE KEYS */;

--
-- Table structure for table `atendimento`
--

DROP TABLE IF EXISTS `atendimento`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `atendimento` (
  `atendimento_id` int(11) NOT NULL AUTO_INCREMENT,
  `blip_atendimento_id` varchar(100) NOT NULL DEFAULT '',
  `contato_id` int(11) NOT NULL DEFAULT '0',
  `atendente_id` int(11) DEFAULT NULL,
  `equipe_id` int(11) DEFAULT NULL,
  `departamento_id` int(11) DEFAULT NULL,
  `data_hora` datetime NOT NULL DEFAULT '0001-01-01 00:00:00',
  `status` int(1) NOT NULL DEFAULT '0',
  `nota` int(2) DEFAULT NULL,
  PRIMARY KEY (`atendimento_id`),
  UNIQUE KEY `uk_atendimento_1` (`blip_atendimento_id`),
  KEY `k_atendimento_1` (`contato_id`),
  KEY `k_atendimento_2` (`atendente_id`),
  KEY `k_atendimento_3` (`equipe_id`),
  KEY `k_atendimento_4` (`departamento_id`),
  CONSTRAINT `fk_atendimento_1` FOREIGN KEY (`contato_id`) REFERENCES `contato` (`contato_id`),
  CONSTRAINT `fk_atendimento_2` FOREIGN KEY (`atendente_id`) REFERENCES `atendente` (`atendente_id`),
  CONSTRAINT `fk_atendimento_3` FOREIGN KEY (`equipe_id`) REFERENCES `equipe` (`equipe_id`),
  CONSTRAINT `fk_atendimento_4` FOREIGN KEY (`departamento_id`) REFERENCES `departamento` (`departamento_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `atendimento`
--

/*!40000 ALTER TABLE `atendimento` DISABLE KEYS */;
/*!40000 ALTER TABLE `atendimento` ENABLE KEYS */;

--
-- Table structure for table `atendimento_atividade`
--

DROP TABLE IF EXISTS `atendimento_atividade`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `atendimento_atividade` (
  `atendimento_atividade_id` int(11) NOT NULL AUTO_INCREMENT,
  `atendimento_id` int(11) NOT NULL DEFAULT '0',
  `atendente_id` int(11) NOT NULL DEFAULT '0',
  `data_hora` datetime NOT NULL DEFAULT '0001-01-01 00:00:00',
  `atividade` int(1) NOT NULL DEFAULT '0',
  `transferencia_atendente_id` int(11) DEFAULT NULL,
  `transferencia_equipe_id` int(11) DEFAULT NULL,
  `transferencia_departamento_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`atendimento_atividade_id`),
  KEY `k_atendimento_atividade_1` (`atendimento_id`),
  KEY `k_atendimento_atividade_2` (`atendente_id`),
  KEY `k_atendimento_atividade_3` (`transferencia_atendente_id`),
  KEY `k_atendimento_atividade_4` (`transferencia_equipe_id`),
  KEY `k_atendimento_atividade_5` (`transferencia_departamento_id`),
  CONSTRAINT `fk_atendimento_atividade_1` FOREIGN KEY (`atendimento_id`) REFERENCES `atendimento` (`atendimento_id`),
  CONSTRAINT `fk_atendimento_atividade_2` FOREIGN KEY (`atendente_id`) REFERENCES `atendente` (`atendente_id`),
  CONSTRAINT `fk_atendimento_atividade_3` FOREIGN KEY (`transferencia_atendente_id`) REFERENCES `atendente` (`atendente_id`),
  CONSTRAINT `fk_atendimento_atividade_4` FOREIGN KEY (`transferencia_equipe_id`) REFERENCES `equipe` (`equipe_id`),
  CONSTRAINT `fk_atendimento_atividade_5` FOREIGN KEY (`transferencia_departamento_id`) REFERENCES `departamento` (`departamento_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `atendimento_atividade`
--

/*!40000 ALTER TABLE `atendimento_atividade` DISABLE KEYS */;
/*!40000 ALTER TABLE `atendimento_atividade` ENABLE KEYS */;

--
-- Table structure for table `atendimento_mensagem`
--

DROP TABLE IF EXISTS `atendimento_mensagem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `atendimento_mensagem` (
  `atendimento_mensagem_id` int(11) NOT NULL AUTO_INCREMENT,
  `blip_mensagem_id` varchar(200) NOT NULL DEFAULT '',
  `atendimento_id` int(11) NOT NULL DEFAULT '0',
  `atendente_id` int(11) DEFAULT NULL,
  `equipe_id` int(11) DEFAULT NULL,
  `departamento_id` int(11) DEFAULT NULL,
  `data_hora` datetime NOT NULL DEFAULT '0001-01-01 00:00:00',
  `enviada_recebida` char(1) NOT NULL DEFAULT '',
  `formato` int(1) NOT NULL DEFAULT '0',
  `conteudo` text NOT NULL,
  PRIMARY KEY (`atendimento_mensagem_id`),
  UNIQUE KEY `uk_atendimento_mensagem_1` (`blip_mensagem_id`),
  KEY `k_atendimento_mensagem_1` (`atendimento_id`),
  KEY `k_atendimento_mensagem_2` (`atendente_id`),
  KEY `k_atendimento_mensagem_3` (`equipe_id`),
  KEY `k_atendimento_mensagem_4` (`departamento_id`),
  CONSTRAINT `fk_atendimento_mensagem_1` FOREIGN KEY (`atendimento_id`) REFERENCES `atendimento` (`atendimento_id`),
  CONSTRAINT `fk_atendimento_mensagem_2` FOREIGN KEY (`atendente_id`) REFERENCES `atendente` (`atendente_id`),
  CONSTRAINT `fk_atendimento_mensagem_3` FOREIGN KEY (`equipe_id`) REFERENCES `equipe` (`equipe_id`),
  CONSTRAINT `fk_atendimento_mensagem_4` FOREIGN KEY (`departamento_id`) REFERENCES `departamento` (`departamento_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `atendimento_mensagem`
--

/*!40000 ALTER TABLE `atendimento_mensagem` DISABLE KEYS */;
/*!40000 ALTER TABLE `atendimento_mensagem` ENABLE KEYS */;

--
-- Table structure for table `contato`
--

DROP TABLE IF EXISTS `contato`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `contato` (
  `contato_id` int(11) NOT NULL AUTO_INCREMENT,
  `blip_contato_id` varchar(200) NOT NULL DEFAULT '',
  `blip_contato_roteador_id` varchar(200) NOT NULL DEFAULT '',
  `nome` varchar(100) NOT NULL DEFAULT '',
  `cidade` varchar(50) NOT NULL DEFAULT '',
  `telefone` varchar(20) NOT NULL DEFAULT '',
  `whatsapp` varchar(20) NOT NULL DEFAULT '',
  `email` varchar(50) NOT NULL DEFAULT '',
  `empresa` varchar(100) NOT NULL DEFAULT '',
  `canal` int(1) NOT NULL DEFAULT '0',
  `url_foto` varchar(500) NOT NULL DEFAULT '',
  PRIMARY KEY (`contato_id`),
  UNIQUE KEY `uk_contato_1` (`blip_contato_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contato`
--

/*!40000 ALTER TABLE `contato` DISABLE KEYS */;
/*!40000 ALTER TABLE `contato` ENABLE KEYS */;

--
-- Table structure for table `departamento`
--

DROP TABLE IF EXISTS `departamento`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `departamento` (
  `departamento_id` int(11) NOT NULL AUTO_INCREMENT,
  `sommusgestor_departamento_id` int(11) NOT NULL DEFAULT '0',
  `nome` varchar(50) NOT NULL DEFAULT '',
  `excluido` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`departamento_id`) USING BTREE,
  UNIQUE KEY `uk_departamento_1` (`sommusgestor_departamento_id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `departamento`
--

/*!40000 ALTER TABLE `departamento` DISABLE KEYS */;
INSERT INTO `departamento` VALUES (1,1,'Desenvolvimento',0),(2,2,'Suporte',0),(3,3,'Comercial',0),(4,4,'Administrativo',0);
/*!40000 ALTER TABLE `departamento` ENABLE KEYS */;

--
-- Table structure for table `departamento_atendente`
--

DROP TABLE IF EXISTS `departamento_atendente`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `departamento_atendente` (
  `departamento_id` int(11) NOT NULL DEFAULT '0',
  `atendente_id` int(11) NOT NULL DEFAULT '0',
  `principal` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`departamento_id`,`atendente_id`) USING BTREE,
  KEY `k_departamento_atendente_1` (`departamento_id`) USING BTREE,
  KEY `k_departamento_atendente_2` (`atendente_id`) USING BTREE,
  CONSTRAINT `fk_departamento_atendente_1` FOREIGN KEY (`departamento_id`) REFERENCES `departamento` (`departamento_id`),
  CONSTRAINT `fk_departamento_atendente_2` FOREIGN KEY (`atendente_id`) REFERENCES `atendente` (`atendente_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `departamento_atendente`
--

/*!40000 ALTER TABLE `departamento_atendente` DISABLE KEYS */;
INSERT INTO `departamento_atendente` VALUES (1,1,1),(2,1,1),(3,1,1),(4,1,1);
/*!40000 ALTER TABLE `departamento_atendente` ENABLE KEYS */;

--
-- Table structure for table `equipe`
--

DROP TABLE IF EXISTS `equipe`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `equipe` (
  `equipe_id` int(11) NOT NULL AUTO_INCREMENT,
  `sommusgestor_equipe_id` int(11) NOT NULL DEFAULT '0',
  `nome` varchar(50) NOT NULL DEFAULT '',
  `departamento_id` int(11) DEFAULT NULL,
  `excluido` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`equipe_id`) USING BTREE,
  UNIQUE KEY `uk_equipe_1` (`sommusgestor_equipe_id`) USING BTREE,
  KEY `k_equipe_1` (`departamento_id`) USING BTREE,
  CONSTRAINT `fk_equipe_1` FOREIGN KEY (`departamento_id`) REFERENCES `departamento` (`departamento_id`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `equipe`
--

/*!40000 ALTER TABLE `equipe` DISABLE KEYS */;
INSERT INTO `equipe` VALUES (1,6,'Implantação',2,0),(2,4,'Serviços rápidos',2,0),(3,9,'Financeiro',4,0),(4,1,'Inovação',1,0),(5,11,'TI',NULL,0),(6,13,'SommusGestor : Produto',NULL,1),(7,2,'Sustentação',1,0),(8,7,'Marketing',3,0),(9,10,'RH',4,0),(10,5,'Serviços consultivos',2,0),(11,8,'Vendas',3,0),(12,12,'Plantão',NULL,0),(13,3,'Diagnósticos de serviços',2,0),(14,14,'SommusGestor : CS',NULL,1),(15,15,'Produto',NULL,0),(16,16,'W2',2,1);
/*!40000 ALTER TABLE `equipe` ENABLE KEYS */;

--
-- Table structure for table `equipe_atendente`
--

DROP TABLE IF EXISTS `equipe_atendente`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `equipe_atendente` (
  `equipe_id` int(11) NOT NULL DEFAULT '0',
  `atendente_id` int(11) NOT NULL DEFAULT '0',
  `principal` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`equipe_id`,`atendente_id`) USING BTREE,
  KEY `k_equipe_atendente_1` (`equipe_id`) USING BTREE,
  KEY `k_equipe_atendente_2` (`atendente_id`) USING BTREE,
  CONSTRAINT `fk_equipe_atendente_1` FOREIGN KEY (`equipe_id`) REFERENCES `equipe` (`equipe_id`),
  CONSTRAINT `fk_equipe_atendente_2` FOREIGN KEY (`atendente_id`) REFERENCES `atendente` (`atendente_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `equipe_atendente`
--

/*!40000 ALTER TABLE `equipe_atendente` DISABLE KEYS */;
INSERT INTO `equipe_atendente` VALUES (1,1,1),(2,1,1),(3,1,1),(4,1,1),(5,1,1),(6,1,1),(7,1,1),(8,1,1),(9,1,1),(10,1,1),(11,1,1),(12,1,1),(13,1,1),(14,1,1),(15,1,1),(16,1,1);
/*!40000 ALTER TABLE `equipe_atendente` ENABLE KEYS */;

--
-- Table structure for table `redirecionamento`
--

DROP TABLE IF EXISTS `redirecionamento`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `redirecionamento` (
  `redirecionamento_id` int(11) NOT NULL AUTO_INCREMENT,
  `mensagem` text NOT NULL,
  `atendente_id` int(11) DEFAULT NULL,
  `equipe_id` int(11) DEFAULT NULL,
  `departamento_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`redirecionamento_id`) USING BTREE,
  KEY `fk_redirecionamento_1` (`atendente_id`) USING BTREE,
  KEY `fk_redirecionamento_2` (`equipe_id`) USING BTREE,
  KEY `fk_redirecionamento_3` (`departamento_id`) USING BTREE,
  CONSTRAINT `fk_redirecionamento_1` FOREIGN KEY (`atendente_id`) REFERENCES `atendente` (`atendente_id`),
  CONSTRAINT `fk_redirecionamento_2` FOREIGN KEY (`equipe_id`) REFERENCES `equipe` (`equipe_id`),
  CONSTRAINT `fk_redirecionamento_3` FOREIGN KEY (`departamento_id`) REFERENCES `departamento` (`departamento_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `redirecionamento`
--

/*!40000 ALTER TABLE `redirecionamento` DISABLE KEYS */;
INSERT INTO `redirecionamento` VALUES (1,'Olá, quero mais informações sobre o programa de parceria exclusivo para contadores.',1,11,3),(2,'Olá, gostaria de saber mais informações sobre o Autosys.',1,11,3),(3,'Olá, Preciso de ajuda com o SommusGestor.',1,11,3),(4,'Oi, gostaria de saber mais informações sobre o SommusGestor',1,11,3),(5,'https://fb.me/3edgsgMny',1,11,3),(6,'Oi, quero garantir 03 meses de carência no SommusGestor.',1,11,3),(7,'https://fb.me/3gvFao3LZ',1,11,3),(8,'Oi! Quero saber mais informações sobre documentos fiscais.',1,11,3);
/*!40000 ALTER TABLE `redirecionamento` ENABLE KEYS */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2023-04-11 11:06:01
