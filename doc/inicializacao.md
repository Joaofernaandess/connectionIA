# Como Inicializar o SommusBLiP em Desenvolvimento

- [Inicio](./../README.md)

## Índice
- [Como Inicializar o SommusBLiP em Desenvolvimento](#como-inicializar-o-sommusblip-em-desenvolvimento)
  - [Índice](#índice)
  - [Primeiros passos](#primeiros-passos)
  - [Preparando ambiente](#preparando-ambiente)
    - [SommusGestor](#sommusgestor)
    - [Banco de Dados](#banco-de-dados)
  - [Acesso ao sistema](#acesso-ao-sistema)
  - [Rodando o sistema em homologação](#rodando-o-sistema-em-homologação)
  - [Iniciando a aplicação como serviço do Windows](#iniciando-a-aplicação-como-serviço-do-windows)

---

## Primeiros passos
[Topo dá página](#como-inicializar-o-sommusblip)

Para iniciar o **SommusBLiP** primeiro é preciso garantir que a máquina tenha instalada uma versão do **NodeJS**,
o instalador pode ser baixado do [site oficial](https://nodejs.org/en/) do **NodeJS**.

Com o **NodeJS** instalado abra o terminal na pasta raiz do projeto e rode o comando para instalar as dependências do projeto:

 ```bash
 npm install
 ```

Para iniciar o aplicativo como um serviço do Windows também será necessário instalar um pacote específico chamado `node-windows` utilizando o commando:

 ```bash
 npm install -g node-windows
 ```
 
 Esse comando que instalará o módulo de forma global na máquina. 
 
 Após a instalação do módulo é necessário linkar o mesmo ao projeto, para isso vá até a pasta onde o projeto esta instalado e rode o comando:

 ```bash
 npm link node-windows
 ```

 ---

 ## Preparando ambiente
[Topo dá página](#como-inicializar-o-sommusblip)

### SommusGestor

 Para iniciar uma instância funcional do **SommusBLiP** será necessário preparar o ambiente de desenvolvimento.

 Primeiro será necessário ter uma instância da API do **SommusGestor** rodando na máquina na porta `8080` para rodar o sistema em ambiente de homologação.

 > *Para rodar o SommusGestor na máquina de forma local siga as instruções disponíveis na documentação do mesmo.*

### Banco de Dados

Agora, também será necessário a existência de um servidor do **MySQL** rodando na porta `3307` para rodar o sistema em homologação. Esse banco precisa se chamar `sommusblip` e o script para criação do mesmo pode ser encontrado em `sql\sommusblip.sql` a partir da raiz do projeto.

> *Uma outra opção para iniciar um banco com mais informações pré-preenchidas é utilizar uma cópia do banco de produção, para isso peça a mesma a seu líder direto caso necessário.*

> *É possível utilizar um banco rodando em containers Docker, desde que esteja acessível na porta `3307`*

---

## Acesso ao sistema
[Topo dá página](#como-inicializar-o-sommusblip)

Após preparar o ambiente básico para iniciar o **SommusBLiP** ainda pode existir uma configuração a ser feita para acessar o sistema, caso o desenvolvedor tenha clonado o banco de produção e não tenha um acesso de um colaborador cadastrado no **SommusBLiP**, é possível criar uma novo registro no banco do **SommusBLiP** na tabela `atendente`, indicando o ID e e-mail de acesso de uma conta do **SommusGestor** mais o nome que deseja que apareça na barra de navegação. 

> *Para um usuário acessar o SommusBLiP é necessário que o ele também exista no SommusGestor.*

---

## Rodando o sistema em homologação
[Topo dá página](#como-inicializar-o-sommusblip)

Para iniciar o sistema, abra o terminal na pasta raiz do projeto e digite o commando:

```bash
npm run start
```

Esse comando iniciará o `nodemon` e o sistema pode ser acessado em homologação no endereço `localhost:8090`.

---

## Iniciando a aplicação como serviço do Windows
[Topo dá página](#como-inicializar-o-sommusblip)

Para iniciar a aplicação como serviço do Windows garanta que a máquina tenha o **NodeJS** e o `node-windows` instalados.

Abra o terminal na pasta raiz do projeto e insira o comando abaixo:


```bash
node service
```

Esse comando rodará o arquivo `service.js` na raiz do projeto que instalará uma instância da aplicação SommusBLiP como um serviço do Windows rodando no background.

Quando for necessário desinstalar o serviço execute o comando no terminal que rode o arquivo `service_uninstall.js`.

```bash
node service_uninstall
```

