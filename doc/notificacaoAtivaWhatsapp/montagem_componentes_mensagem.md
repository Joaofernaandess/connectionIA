# Montagem dos Componentes da Mensagem

## Função getComponents

A função `getComponents` recebe três parâmetros opcionais: `headerParameters`, `bodyParameters` e `buttonsParameters`. A função retorna um array de objetos que representam os componentes de uma interface de usuário. Cada componente é um objeto com uma propriedade `type` e uma propriedade `parameters`.

A variável `header` é criada mapeando o array `headerParameters` e criando um objeto para cada elemento com base em sua propriedade `tipo`. Se a propriedade `tipo` for `'image'`, `'video'` ou `'document'`, o objeto correspondente terá uma propriedade `type` com o mesmo valor e um objeto aninhado com uma propriedade `link`. Se a propriedade `tipo` for `'document'`, o objeto aninhado também terá uma propriedade `filename`.

A variável `body` é criada mapeando o array `bodyParameters` e criando um objeto para cada elemento com uma propriedade `type` de `'text'` e um objeto aninhado com uma propriedade `text`.

A variável `buttons` é criada mapeando o array `buttonsParameters` e criando um objeto para cada elemento com uma propriedade `tipo` de `'button'`. Esses objetos têm uma propriedade `type` de `'button'`, uma propriedade `sub_type` de `'quick_reply'`, uma propriedade `index` e um array aninhado de objetos representando os parâmetros do botão.

O resultado final, armazenado na variável `components`, é um array contendo os valores espalhados das variáveis truthy entre `header`, `body` e `buttons`. Se todas essas variáveis forem falsy, então `components` será `null`.

O resultado da chamada desta função depende dos valores passados como argumentos.

## Exemplo 1

```javascript
const bodyParameters = [{ parametro: 'nome', tipo: 'text', text: 'Meu nome' }];
const buttonsParameters = [{ parametro: 'botao1', tipo: 'button', subtipo: 'quick_reply', text: 'Continuar', index: 0}];
const headerParameters = [{ parametro: 'imagem1', tipo: 'image', link: 'https://blablabla.com/imagem1'}];

const result = getComponents(headerParameters, bodyParameters, buttonsParameters);

console.log(result);
```

Isso produziria o seguinte array:

```javascript
[
  {
    "type": "header",
    "parameters": [
      {
        "type": "image",
        "image": {
          "link": "https://blablabla.com/imagem1"
        }
      }
    ]
  },
  {
    "type": "body",
    "parameters": [
      {
        "type": "text",
        "text": "Meu nome"
      }
    ]
  },
  {
    "type": "button",
    "sub_type": "quick_reply",
    "index": 0,
    "parameters": [
      {
        "type": "payload",
        "payload": "Continuar"
      }
    ]
  }
]
```

## Exemplo 2
```javascript
const bodyParameters = [{ parametro: 'nome', tipo: 'text', text: 'Meu nome' }, { parametro: 'cidade', tipo: 'text', text: 'Minha cidade' }];
const buttonsParameters = [{ parametro: 'botao1', tipo: 'button', subtipo: 'quick_reply', text: 'Continuar', index: 0}];
const headerParameters = null;

const result = getComponents(headerParameters, bodyParameters, buttonsParameters);

console.log(result);
```

Isso produziria o seguinte array:

```javascript
[
  {
    "type": "body",
    "parameters": [
      {
        "type": "text",
        "text": "Meu nome"
      },
      {
        "type": "text",
        "text": "Minha cidade"
      }
    ]
  },
  {
    "type": "button",
    "sub_type": "quick_reply",
    "index": 0,
    "parameters": [
      {
        "type": "payload",
        "payload": "Continuar"
      }
    ]
  }
]
```