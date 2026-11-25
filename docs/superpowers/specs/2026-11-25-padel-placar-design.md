# App Campeonato de Padel — Design

**Data:** 2026-11-25
**Status:** Aprovado

## Objetivo

Aplicação web simples para gerenciar um campeonato amistoso de padel entre 4 duplas de amigos, com 6 jogos no formato todos-contra-todos (round-robin). O site é hospedado no GitHub Pages e os resultados são atualizados editando-se um arquivo `data.json` versionado no repositório.

## Formato do Campeonato

### Duplas
1. Vlacir & Rodrigo
2. Erson & Carlos
3. Wellington & Cassio
4. Vinicius & Jonas

### Jogos (6, round-robin — cada dupla joga 3x)
| Jogo | Dupla A | Dupla B |
|------|---------|---------|
| 1 | Vlacir & Rodrigo | Erson & Carlos |
| 2 | Wellington & Cassio | Vinicius & Jonas |
| 3 | Vlacir & Rodrigo | Wellington & Cassio |
| 4 | Erson & Carlos | Vinicius & Jonas |
| 5 | Vlacir & Rodrigo | Vinicius & Jonas |
| 6 | Erson & Carlos | Wellington & Cassio |

### Regras de pontuação
- Cada jogo é decidido em **1 set único**.
- O set vai até **6 games**; em caso de empate em 6×6, o desempate pode ir **até 9**.
- **Vitória vale 3 pontos**, derrota vale 0. Não há empate — sempre há um vencedor.
- **Pontuação total** de uma dupla = 3 × (número de vitórias).

### Classificação (ordem dos critérios de desempate)
1. Mais vitórias
2. Maior saldo de games (games feitos − games sofridos)
3. Mais games feitos
4. Confronto direto (resultado do jogo entre as duplas empatadas)

## Arquitetura

### Visão geral
Site **100% estático** (HTML + CSS + JavaScript puro, sem framework, sem Node.js em produção). Hospedado no **GitHub Pages**. O estado do campeonato vive num arquivo `data.json` versionado no repositório, que o site carrega via `fetch` ao abrir a página.

Não há servidor, banco de dados, autenticação nem persistência no navegador. A fonte da verdade é o `data.json` no repositório.

### Por que estático
- GitHub Pages só serve arquivos estáticos (não roda Node.js).
- Dados centralizados e versionados: todo visitante vê o mesmo estado ao recarregar.
- Sem custo, sem credenciais, sem manutenção de infraestrutura.

### Estrutura de arquivos
```
padel-placar/
├── index.html      # página única
├── style.css       # visual moderno, responsivo
├── app.js          # carrega data.json, monta UI, calcula classificação
├── data.json       # estado do campeonato (source of truth, versionado)
└── package.json    # metadados do projeto
```

## Modelo de Dados (`data.json`)

```json
{
  "duplas": [
    { "id": 1, "nome": "Vlacir & Rodrigo",   "jogadores": ["Vlacir", "Rodrigo"] },
    { "id": 2, "nome": "Erson & Carlos",      "jogadores": ["Erson", "Carlos"] },
    { "id": 3, "nome": "Wellington & Cassio", "jogadores": ["Wellington", "Cassio"] },
    { "id": 4, "nome": "Vinicius & Jonas",    "jogadores": ["Vinicius", "Jonas"] }
  ],
  "jogos": [
    { "id": 1, "duplaA": 1, "duplaB": 2, "gamesA": null, "gamesB": null },
    { "id": 2, "duplaA": 3, "duplaB": 4, "gamesA": null, "gamesB": null },
    { "id": 3, "duplaA": 1, "duplaB": 3, "gamesA": null, "gamesB": null },
    { "id": 4, "duplaA": 2, "duplaB": 4, "gamesA": null, "gamesB": null },
    { "id": 5, "duplaA": 1, "duplaB": 4, "gamesA": null, "gamesB": null },
    { "id": 6, "duplaA": 2, "duplaB": 3, "gamesA": null, "gamesB": null }
  ]
}
```

- `gamesA` / `gamesB` com valor `null` indicam jogo ainda não disputado.
- Após um jogo, o organizador edita os campos `gamesA`/`gamesB` com os games de cada dupla, faz commit e push.

## Componentes da Interface

### 1. Tabela de Classificação
- Colunas: posição, dupla, jogos disputados, vitórias (V), derrotas (D), games feitos (GF), games sofridos (GC), saldo de games (SG), pontos.
- Ordenada pelos critérios de classificação definidos acima.
- Pódio visualmente destacado no topo: 1º (ouro), 2º (prata), 3º (bronze).
- A 4ª colocação aparece abaixo, sem destaque de pódio.

### 2. Lista de Jogos
- Cada jogo exibido em um card mostrando:
  - Dupla A (nome + jogadores) × Dupla B (nome + jogadores)
  - Placar preenchido (ex.: 6 × 3) ou "A definir" se `gamesA`/`gamesB` forem `null`.
  - Indicação visual do vencedor (destaque no card da dupla que ganhou).

## Validação dos Placares

A validação é **lenient** (permisiva): o site exibe o placar que estiver no `data.json` e determina o vencedor como a dupla com mais games. Isso evita rejeitar placares que os jogadores considerem válidos nas regras informais deles (ex.: 6×5). Apenas casos claramente impossíveis são marcados com um aviso visual, sem quebrar a página.

### Determinação do vencedor
- Vencedor = dupla cujo `gamesA`/`gamesB` é maior.
- Empate em games não é permitido (sempre há vencedor).

### Casos marcados como inválidos (aviso na UI, não quebra a página)
- `gamesA` e `gamesB` iguais e não nulos (ex.: 6×6) — não há vencedor.
- Games negativos.
- Games não numéricos no JSON.

### Observação sobre as regras do set
As regras oficiais do campeonato (set até 6, desempate a partir de 6×6 podendo ir a 9) são de conhecimento dos jogadores e não aplicadas estritamente pelo site. O site confia no placar digitado pelo organizador e apenas determina quem venceu pela contagem de games.

## Fluxo de Uso

### Visitante (qualquer pessoa com o link)
1. Abre o site no GitHub Pages.
2. O JavaScript faz `fetch('data.json')` e carrega o estado atual.
3. O site monta a tabela de classificação e a lista de jogos (somente leitura).

### Organizador (após uma rodada)
1. Edita o `data.json` localmente, preenchendo `gamesA`/`gamesB` dos jogos disputados.
2. `git add data.json && git commit && git push`.
3. O GitHub Pages publica a nova versão automaticamente.
4. Quem recarregar a página vê a atualização.

## Visual (UI)

- HTML semântico + CSS puro (sem frameworks).
- Design moderno: cards com sombras suaves, cantos arredondados, tipografia limpa.
- Paleta sóbria com destaque para o pódio (gradientes sutis de ouro/prata/bronze).
- Responsivo: funciona bem no celular durante o jogo e no desktop.
- Sem dependências externas de runtime (sem CDN, sem bibliotecas JS).

## Considerações Técnicas

- **Sem Node.js em produção**: o `package.json` contém apenas metadados do projeto.
- **Sem build step**: os arquivos são servidos como estão.
- **GitHub Pages**: habilitado nas configurações do repositório (branch main, pasta raiz). Não há workflow de CI necessário.
- **Fetch local**: o `fetch('data.json')` funciona normalmente no GitHub Pages e também ao abrir o `index.html` via servidor local simples (`npx serve` ou similar) durante o desenvolvimento.

## Fora de Escopo (YAGNI)

- Persistência no navegador (localStorage).
- Editor/exportador de JSON no site (o organizador edita o `data.json` manualmente).
- Autenticação / multiusuário.
- Backend / servidor / banco de dados.
- Suporte a mais de 4 duplas ou jogos além dos 6 definidos (formato fixo deste campeonato).
- Estatísticas avançadas (sequência de vitórias, etc.).
