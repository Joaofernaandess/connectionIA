# Zênite UI Framework

O Zênite UI é um framework front-end moderno, leve e responsivo, focado na simplicidade e na elegância. Construído com HTML5, CSS3 puro e Vanilla JavaScript, foi concebido para acelerar o desenvolvimento de interfaces web de alto padrão.

---

## 1. Diferenciais
- Leveza: Sem dependências externas pesadas, focado em performance.
- Responsividade: Design totalmente adaptável para qualquer dispositivo.
- Modularidade: Estrutura organizada para importação direta via CDN ou via gerenciadores de pacotes.

---

## 2. Instalação e Utilização

Pode utilizar o Zênite UI de duas formas, dependendo da arquitetura do seu projeto:

### Opção A: Importação direta via CDN (Mais rápida)
Ideal para projetos estáticos ou sem processo de *build*. Não é necessária a instalação de pacotes locais. Adicione as referências abaixo diretamente no seu arquivo HTML:

**CSS**

    <link href="https://cdn.jsdelivr.net/npm/zenite-ui@1.5.0/css/zenite.min.css" rel="stylesheet">

**JavaScript**

    <script src="https://cdn.jsdelivr.net/npm/zenite-ui@1.5.0/js/zenite.min.js"></script>


### Opção B: Instalação via NPM (Para Bundlers e Projetos Modernos)
Ideal se estiver utilizando ferramentas como Webpack, Vite, React, etc. Execute o comando abaixo no seu terminal:

    npm install zenite-ui

**Importação via Bundlers:**
Nos seus arquivos principais (ex: `main.js` ou `index.js`), importe o CSS e o JS:

    import 'zenite-ui/css/zenite.min.css';
    import 'zenite-ui';

**Importação em HTML usando node_modules local:**
Se instalou via NPM mas ainda usa HTML estático:

    <link rel="stylesheet" href="./node_modules/zenite-ui/css/zenite.min.css">
    <script src="./node_modules/zenite-ui/js/zenite.min.js"></script>

---

## 3. Estrutura do Projeto
O framework é composto por diversos módulos para facilitar a manutenção e o desenvolvimento:
- Layout: Grid responsivo, Colunas e classes utilitárias.
- Componentes: Buttons, Cards, Modals, Navbars, entre outros.
- Formulários: Inputs estilizados, Checkboxes e Switches.

---

## 4. Licença
Este projeto está sob a licença MIT. Desenvolvido por Zênite Tecnologia LTDA.
https://www.npmjs.com/package/zenite-ui