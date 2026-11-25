// App Campeonato de Padel
// Carrega data.json, calcula classificação e monta a UI.

const PONTOS_VITORIA = 3;

// ---------- Estado ----------
let state = { duplas: [], jogos: [] };

// ---------- Carregamento ----------
async function carregarEstado() {
  try {
    const resp = await fetch('data.json', { cache: 'no-store' });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    state = await resp.json();
  } catch (e) {
    document.getElementById('erro-carregamento').classList.remove('hidden');
    console.error('Falha ao carregar data.json:', e);
    return false;
  }
  return true;
}

// ---------- Lógica de classificação ----------

// Encontra uma dupla pelo id.
function duplaPorId(id) {
  return state.duplas.find(d => d.id === id);
}

// Encontra o jogo entre duas duplas (em qualquer ordem).
function jogoEntre(idA, idB) {
  return state.jogos.find(j =>
    (j.duplaA === idA && j.duplaB === idB) ||
    (j.duplaA === idB && j.duplaB === idA)
  );
}

// Determina o vencedor de um jogo.
// Retorna: 'A', 'B', 'empate' (inválido) ou null (não disputado).
function resultadoJogo(jogo) {
  if (jogo.gamesA == null || jogo.gamesB == null) return null;
  const a = Number(jogo.gamesA);
  const b = Number(jogo.gamesB);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 'invalido';
  if (a < 0 || b < 0) return 'invalido';
  if (a === b) return 'empate';
  return a > b ? 'A' : 'B';
}

// Verifica se um jogo tem placar inválido (para marcar na UI).
function jogoInvalido(jogo) {
  const r = resultadoJogo(jogo);
  return r === 'invalido' || r === 'empate';
}

// Calcula as estatísticas de cada dupla.
function calcularStats() {
  const stats = state.duplas.map(d => ({
    id: d.id,
    nome: d.nome,
    jogadores: d.jogadores,
    jogos: 0,
    vitorias: 0,
    derrotas: 0,
    gamesFeitos: 0,
    gamesSofridos: 0,
    pontos: 0,
  }));

  const porId = new Map(stats.map(s => [s.id, s]));

  for (const jogo of state.jogos) {
    const r = resultadoJogo(jogo);
    if (r === null || r === 'invalido' || r === 'empate') continue;

    const sa = porId.get(jogo.duplaA);
    const sb = porId.get(jogo.duplaB);
    const ga = Number(jogo.gamesA);
    const gb = Number(jogo.gamesB);

    sa.jogos++;
    sb.jogos++;
    sa.gamesFeitos += ga;
    sa.gamesSofridos += gb;
    sb.gamesFeitos += gb;
    sb.gamesSofridos += ga;

    if (r === 'A') {
      sa.vitorias++;
      sa.pontos += PONTOS_VITORIA;
      sb.derrotas++;
    } else {
      sb.vitorias++;
      sb.pontos += PONTOS_VITORIA;
      sa.derrotas++;
    }
  }

  // Saldo de games.
  stats.forEach(s => { s.saldoGames = s.gamesFeitos - s.gamesSofridos; });

  return stats;
}

// Comparador para ordenação da classificação.
// Critérios: 1) vitórias, 2) saldo de games, 3) games feitos,
// 4) confronto direto.
function compararDuplas(a, b) {
  if (b.vitorias !== a.vitorias) return b.vitorias - a.vitorias;
  if (b.saldoGames !== a.saldoGames) return b.saldoGames - a.saldoGames;
  if (b.gamesFeitos !== a.gamesFeitos) return b.gamesFeitos - a.gamesFeitos;

  // Confronto direto.
  const jogo = jogoEntre(a.id, b.id);
  if (jogo) {
    const r = resultadoJogo(jogo);
    if (r === 'A') {
      // a é duplaA do jogo?
      if (jogo.duplaA === a.id) return -1;
      return 1;
    } else if (r === 'B') {
      if (jogo.duplaB === a.id) return -1;
      return 1;
    }
  }
  return 0;
}

// ---------- Renderização ----------

function renderClassificacao() {
  const stats = calcularStats().sort(compararDuplas);

  // Pódio
  renderPodio(stats);

  // Tabela de classificação
  const tbody = document.getElementById('tbody-classificacao');
  tbody.innerHTML = '';

  stats.forEach((s, i) => {
    const pos = i + 1;
    const tr = document.createElement('tr');
    tr.className = `posicao-${pos}`;
    tr.innerHTML = `
      <td class="td-posicao" data-label="#">${pos}º</td>
      <td class="td-dupla" data-label="Dupla">
        <div class="dupla-nome">${s.nome}</div>
      </td>
      <td class="td-num" data-label="J">${s.jogos}</td>
      <td class="td-num num-vitorias" data-label="V">${s.vitorias}</td>
      <td class="td-num th-oculta-mobile" data-label="D">${s.derrotas}</td>
      <td class="td-num" data-label="GF">${s.gamesFeitos}</td>
      <td class="td-num" data-label="GC">${s.gamesSofridos}</td>
      <td class="td-num ${s.saldoGames > 0 ? 'saldo-positivo' : s.saldoGames < 0 ? 'saldo-negativo' : ''}" data-label="SG">
        ${s.saldoGames > 0 ? '+' : ''}${s.saldoGames}
      </td>
      <td class="td-num num-pontos" data-label="Pts">${s.pontos}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderPodio(stats) {
  const podio = document.getElementById('podio');
  podio.innerHTML = '';
  const classes = ['ouro', 'prata', 'bronze'];
  const top3 = [stats[0], stats[1], stats[2]].filter(Boolean);
  top3.forEach((s) => {
    const posReal = stats.indexOf(s) + 1;
    const div = document.createElement('div');
    div.className = `podio-lugar podio-${classes[posReal - 1]}`;
    div.dataset.posicao = posReal;
    const medalha = posReal === 1 ? '🏆' : posReal === 2 ? '🥈' : '🥉';
    div.innerHTML = `
      <span class="podio-medalha">${medalha}</span>
      <div class="podio-info">
        <div class="podio-nome">${s.nome}</div>
        <div class="podio-pontos">${s.pontos} pts</div>
      </div>
    `;
    podio.appendChild(div);
  });
}

function renderJogos() {
  const container = document.getElementById('lista-jogos');
  container.innerHTML = '';

  state.jogos.forEach(jogo => {
    const dA = duplaPorId(jogo.duplaA);
    const dB = duplaPorId(jogo.duplaB);
    const r = resultadoJogo(jogo);
    const disputado = r !== null && r !== 'invalido' && r !== 'empate';
    const invalido = jogoInvalido(jogo);

    const card = document.createElement('div');
    card.className = `jogo-card ${disputado ? 'disputado' : ''} ${invalido ? 'invalido' : ''}`;

    const placarA = disputado
      ? `<span class="games ${r === 'A' ? 'vencedor' : ''}">${jogo.gamesA}</span>`
      : `<span class="games-a-definir">—</span>`;
    const placarB = disputado
      ? `<span class="games ${r === 'B' ? 'vencedor' : ''}">${jogo.gamesB}</span>`
      : `<span class="games-a-definir">—</span>`;

    card.innerHTML = `
      <div class="jogo-numero">Jogo ${jogo.id}</div>
      <div class="jogo-confronto">
        <div class="jogo-lado ${disputado && r === 'A' ? 'lado-vencedor' : ''}">
          <div class="lado-nome">${dA.nome}</div>
        </div>
        <div class="jogo-placar">
          ${placarA}
          <span class="jogo-x">×</span>
          ${placarB}
        </div>
        <div class="jogo-lado ${disputado && r === 'B' ? 'lado-vencedor' : ''}">
          <div class="lado-nome">${dB.nome}</div>
        </div>
      </div>
      ${invalido ? '<div class="jogo-aviso">⚠️ Placar inválido — verifique o data.json</div>' : ''}
    `;
    container.appendChild(card);
  });
}

function render() {
  renderClassificacao();
  renderJogos();
  document.getElementById('loading').classList.add('hidden');
}

// ---------- Init ----------
(async function init() {
  const ok = await carregarEstado();
  if (ok) render();
})();
