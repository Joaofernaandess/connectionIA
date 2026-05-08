# Publicando o SommusBLiP

- [Inicio](./../README.md)

A publicação do SommusBLiP não está atrelada a nenhum processo de CI-CD atualmente em uso pela Sommus Sistemas.

## Publicação 1ª Opção (Recomendado)

1. Pare o serviço do SommusBLiP rodando no background.
2. Realize um backup dos atuais arquivos da aplicação que está rodando.
3. Cole os arquivos da versão atualizada na pasta do SommusBLiP.
   - Mantenha os arquivos ou pastas que não fazem parte do repositório (daemon, logs, etc).
   - Não substituir o `package.json` e `.env` a não ser que hajam alterações nos mesmos.
4. Reinicie novamente a aplicação.

---

## Publicação - 2ª Opção (Mais complexa)

1. Pare o serviço do SommusBLiP rodando no background através do Gerenciador de Tarefas.
2. Pare o processo do NodeJS através do Gerenciador de Tarefas.
3. Desinstale o serviço utilizando o comando: 
   ```bash
   node service_uninstall
   ```
4. Realize um backup dos atuais arquivos da aplicação que está rodando.
5. Cole os arquivos da versão atualizada na pasta do SommusBLiP.
   - Mantenha os arquivos ou pastas que não fazem parte do repositório (daemon, logs, etc).
   - Não substituir o `package.json` e `.env` a não ser que hajam alterações nos mesmos.
6. Instale o serviço novamente utilizando o comando: 
   ```bash
   node service
   ```
7.  Verifique que a aplicação iniciou.



## Apoio

- [Primeiros passos para iniciar desenvolvimento/instalação do SommusBLiP](inicializacao.md#primeiros-passos)
- [Como preparar o ambiente para rodar o SommusBLiP](inicializacao.md#preparando-ambiente)
- [Como iniciar o SommusBLiP como serviço do Windows](inicializacao.md#iniciando-a-aplicação-como-serviço-do-windows)