# Commits semânticos

Commit semântico ou conventional commit, em sua especificação formal, é uma das formas de padronização de commits dentro do projeto.

Essa padronização vai contribuir para que reduzamos o tempo gasto em compreender como e por que algo foi feito apenas olhando pelo histórico do git.

A seguir, os prefixos utilizados para essa padronização:

---
- ```feat:```  utilizado quando se adiciona alguma nova funcionalidade do zero ao código/serviço/projeto.

*Exemplo: adição de um novo endpoint para uma API REST ou um novo consumer para um serviço de mensageria.*

---
- ```fix:```  usado quando existem erros de código que estão causando bugs.

*Exemplo: proteção de uma variável que está gerando um NullPointerException em produção.*

---
- ```refactor:```  utilizado na realização de uma refatoração que não causará impacto direto no código ou em qualquer lógica/regra de negócio.

*Exemplo: melhorias de performance revisadas em um code review.*

---
- ```style:```  utilizado quando são realizadas mudanças no estilo e formatação do código que não irão impactar em nenhuma lógica do código.

*Exemplo: realizar a indentação de um código.*

---
- ```test:```  usado quando se realizam alterações de qualquer tipo nos testes, seja a adição de novos testes ou a refatoração de testes já existentes.

*Exemplo: adição de testes de contrato e modificação de testes unitários.*

---
- ```doc:```  ideal para quando se adiciona ou modifica alguma documentação no código ou do repositório em questão.

*Exemplo: adição de documentação sobre o response de uma API ou adição de um README.md.*

---
- ```env:```  utilizado quando se modifica ou adiciona algum arquivo de CI/CD.

*Exemplo: modificar um comando do Dockerfile ou adicionar um step a um Jenkinsfile.*

---
- ```build:```  usado quando se realiza alguma modificação em arquivos de build e dependências.

*Exemplo: adição de dependências do Apache Kafka.*


