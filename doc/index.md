# O que é o SommusBLiP

## Descrição

O **SommusBLiP** é um sistema desenvolvido em NodeJS para tratar dos atendimentos realizados pela equipe da **Sommus Sistemas**,
ele estabelece uma comunicação com a API da **Take.Blip** por meio de webhooks e sempre que o bot Sofia passa o atendimento
de uma chamada para a fase de atendimento humano o mesmo é transferido para um dos atendentes disponíveis.

---

## Tecnologias

O **SommusBLiP** foi desenvolvido em **NodeJS**, por isso a base da sua construção é **JavaScript**, sendo uma API **Express.js** no back-end
e o front-end sendo gerado por meio de arquivos `.pug`.

---

## Índice

- [Como Inicializar o SommusBLiP](inicializacao.md#como-inicializar-o-sommusblip)
- [Publicando o SommusBLiP](publicacao.md#publicando-o-sommusblip)
- [Notificação em Massa via SommusGestor](notificacaoMassa/index.md) - Documentação da rota `/notificacaoMassa`