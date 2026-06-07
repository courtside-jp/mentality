// players.js — 選手一覧・検索・詳細モーダル・日本人選手
// 読み込み順: data.js → utils.js → app.js → 各機能JS

// players.js — 選手一覧・検索・詳細モーダル
//
// 【このファイルだけで完結する機能】
//   - 選手一覧（NBA API から取得）
//   - 名前検索（日本語・英語両対応）
//   - チームフィルター
//   - 選手詳細モーダル（スタッツ・過去シーズン・受賞歴）
//
// 【修正したいときの場所】
//   選手追加  → PLAYERS 配列（ダミーデータ）
//   受賞歴    → AWARDS_MAP オブジェクト
//   APIエンドポイント → loadPlayersFromAPI()
// ============================================================

// ============================================================
// 選手写真URL（NBA公式CDN）
// ============================================================
const PLAYER_PHOTOS = {
  kawamura: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1642355.png',
  hachimura:'https://cdn.nba.com/headshots/nba/latest/1040x760/1629060.png',
  lebron:   'https://cdn.nba.com/headshots/nba/latest/1040x760/2544.png',
  curry:    'https://cdn.nba.com/headshots/nba/latest/1040x760/201939.png',
  tatum:    'https://cdn.nba.com/headshots/nba/latest/1040x760/1628369.png',
  giannis:  'https://cdn.nba.com/headshots/nba/latest/1040x760/203507.png',
  davis:    'https://cdn.nba.com/headshots/nba/latest/1040x760/203076.png',
  brunson:  'https://cdn.nba.com/headshots/nba/latest/1040x760/1628384.png',
};

// ============================================================
// 受賞歴データ
// 選手の受賞歴を追加したい場合はここに追記する
// ============================================================
const AWARDS_MAP = {
  'LeBron James':           ['🏆 NBA優勝4回', '🏅 MVP4回', '📊 通算得点王'],
  'Stephen Curry':          ['🏆 NBA優勝4回', '🏅 MVP2回', '⭐ 3P歴代1位'],
  'Giannis Antetokounmpo':  ['🏆 2021 NBA優勝・Finals MVP', '🏅 MVP2回'],
  'Jayson Tatum':           ['🏆 2024 NBA優勝', '🏅 2024 Finals MVP'],
  'Nikola Jokic':           ['🏆 2023 NBA優勝・Finals MVP', '🏅 MVP3回'],
  'Yuki Kawamura':          ['🏅 2025 All-Rookie Second Team'],
  'Rui Hachimura':          ['🏅 2020 All-Rookie Second Team'],
};

// ============================================================
// ダミー選手データ（API失敗時のバックアップ）
// ============================================================
const PLAYERS = [
  { id:'kawamura',  ja:'河村 勇輝',          en:'Yuki Kawamura',          team:'LAL', pos:'PG', num:8,  jp:true,  pts:12.4, ast:6.2, reb:2.1 },
  { id:'hachimura', ja:'八村 塁',            en:'Rui Hachimura',          team:'LAL', pos:'PF', num:28, jp:true,  pts:14.2, ast:1.8, reb:5.4 },
  { id:'lebron',    ja:'レブロン・ジェームズ', en:'LeBron James',          team:'LAL', pos:'SF', num:23, jp:false, pts:25.8, ast:8.2, reb:7.4 },
  { id:'curry',     ja:'ステフィン・カリー',  en:'Stephen Curry',          team:'GSW', pos:'PG', num:30, jp:false, pts:26.4, ast:5.1, reb:4.2 },
  { id:'tatum',     ja:'ジェイソン・テイタム', en:'Jayson Tatum',          team:'BOS', pos:'SF', num:0,  jp:false, pts:28.4, ast:5.0, reb:8.6 },
  { id:'giannis',   ja:'ヤニス・アデトクンボ', en:'Giannis Antetokounmpo', team:'MIL', pos:'C',  num:34, jp:false, pts:30.2, ast:6.5, reb:12.1 },
  { id:'davis',     ja:'アンソニー・デイビス', en:'Anthony Davis',          team:'LAL', pos:'C',  num:3,  jp:false, pts:18.2, ast:2.4, reb:11.8 },
  { id:'brunson',   ja:'ジェイレン・ブランソン',en:'Jalen Brunson',        team:'NYK', pos:'PG', num:11, jp:false, pts:27.8, ast:7.9, reb:3.3 },
];

// ============================================================
// 状態管理
// ============================================================
let pTeam    = 'all';
let pSearch  = '';

// ============================================================
// 選手ページ初期化
// ============================================================
function initPlayers() {
  const teams = ['all','LAL','GSW','BOS','NYK','MIL','OKC','DEN','MIN','PHX','MIA','PHI','CLE','IND','DAL','HOU','SAC','ATL','NOP','UTA','POR','ORL','DET','TOR','CHI','SAS','MEM','CHA','WAS','BKN','LAC'];
  const filterEl = document.getElementById('playerFilter');
  if (filterEl) {
    filterEl.innerHTML = teams.map(t =>
      `<button class="pf-btn${t === pTeam ? ' on' : ''}" onclick="setPTeam(this,'${t}')">${t === 'all' ? 'ALL' : t}</button>`
    ).join('');
  }
  loadPlayersFromAPI();
}

// チームフィルター切り替え
function setPTeam(btn, t) {
  pTeam = t;
  document.querySelectorAll('.pf-btn').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  loadPlayersFromAPI();
}

// 名前検索
function filterPlayers(q) {
  if (q.trim() === "3579") {
    document.getElementById("playerSearchInput").value="";
    pSearch = "";
    setTimeout(()=>{
      const pw = prompt("パスワードを入力してください");
      if (pw !== "3579") { alert("パスワードが違います"); return; }
      document.getElementById("adminSelectModal").style.display="block"; return;
    }, 100);
    return;
  }
  pSearch = q;
  renderPlayerCards(window._cachedPlayers || PLAYERS);
}

// ============================================================
// ESPN APIから選手データを取得
// ============================================================
async function loadPlayersFromAPI() {
  const grid = document.getElementById('playerGrid');
  if (!grid) return;

  // まずダミーデータをすぐ表示
  window._cachedPlayers = PLAYERS.map(p => ({
    playerName: p.en, espnId: '', team: p.team,
    pts: p.pts, reb: p.reb, ast: p.ast,
  }));
  renderPlayerCards(window._cachedPlayers);

  try {
    // ESPN スタッツリーダーAPIから得点順で選手を取得
    const url = `https://courtside-jp.github.io/mentality/data.json?v=1779410136`;
    const res = await fetchWithTimeout(url, {}, 8000);
    if (!res.ok) throw new Error('ESPN Error ' + res.status);
    const data = await res.json();

    const allPlayers = data.all_players;
    if (!allPlayers?.length) throw new Error("データなし");

    window._cachedPlayers = allPlayers.map(p => ({
      playerName: p.name || "",
      espnId:     p.id || "",
      team:       p.team || "",
      pts:        parseFloat(p.pts) || 0,
      reb:        parseFloat(p.reb) || 0,
      ast:        parseFloat(p.ast) || 0,
      height:     p.height || "",
      dob:        p.dob || "",
      pos:        p.pos || "",
      debutYear:  p.debutYear || "",
      weight:     p.weight || "",
    }));

    const filtered = pTeam !== 'all'
      ? window._cachedPlayers.filter(p => p.team === pTeam)
      : window._cachedPlayers;

    renderPlayerCards(filtered);
    console.log('✅ ESPN選手データ取得成功:', window._cachedPlayers.length, '人');

  } catch(e) {
    console.warn('選手APIエラー:', e.message, '→ ダミーデータ継続');
    // ダミーデータはすでに表示済みなので何もしない
  }
}

// ============================================================
// 選手カード一覧を描画
// ============================================================
async function renderPlayerCards(players) {
  const grid = document.getElementById('playerGrid');
  if (!grid) return;
  const q = pSearch.toLowerCase();

  const filtered = players.filter(p => {
    const name   = (p.playerName || '').toLowerCase();
    const jaName = (JA_NAME_MAP[p.playerName] || '').toLowerCase();
    return !q || name.includes(q) || jaName.includes(q);
  });

  if (!filtered.length) {
    grid.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--tx3);font-size:.75rem;">選手が見つかりませんでした</div>';
    return;
  }

  // 広告取得
  let playersAds = [];
  try {
    const ar = await fetch(FB_URL + '/adslots.json');
    const ad = await ar.json() || {};
    playersAds = ['players_1'].map(k => ad[k]).filter(a => a && a.url && a.enabled !== false);
  } catch(e) {}

  grid.innerHTML = filtered.map(p => {
    const name    = p.playerName || '';
    const jaName  = JA_NAME_MAP[name] || name;
    const team    = p.team || '';
    const pts = p.pts ? Number(p.pts).toFixed(1) : '-';
    const reb = p.reb ? Number(p.reb).toFixed(1) : '-';
    const ast = p.ast ? Number(p.ast).toFixed(1) : '-';
    const isJP    = name === 'Yuki Kawamura' || name === 'Rui Hachimura';

    // ESPN IDから顔写真取得・ポジション取得
    const normName = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const espnId   = p.espnId || '';
    const pos      = (window._espnIdMap || {})[`_pos_${normName}`] || '';
    const photoUrl = espnId
      ? ''
      : '';

    return `<div onclick="openPlayerDetail('${name.replace(/'/g,"\\'")}','${team}','${espnId}')"
      style="background:var(--card);border:1px solid ${isJP ? 'rgba(255,90,0,.3)' : 'var(--bd)'};border-radius:8px;padding:.55rem .7rem;display:flex;align-items:center;gap:.6rem;cursor:pointer;">
      <div style="width:44px;height:34px;border-radius:6px;overflow:hidden;background:var(--bg3);flex-shrink:0;">
        ${photoUrl ? `<img src="${photoUrl}" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none'">` : ''}
      </div>
      <div style="flex:1;min-width:0;">
        <div style="font-size:.78rem;font-weight:700;color:var(--tx);margin-bottom:.06rem;">${jaName}${isJP ? ' 🇯🇵' : ''}</div>
        <div style="font-family:'Barlow Condensed',sans-serif;font-size:.62rem;color:var(--tx3);letter-spacing:.04em;">${name}</div>
        <div style="font-family:'Barlow Condensed',sans-serif;font-size:.58rem;color:var(--tx3);">${pos ? pos + ' · ' : ''}${team}</div>
      </div>
      <div style="display:flex;gap:.6rem;text-align:center;flex-shrink:0;">
        <div><div style="font-size:.75rem;font-weight:700;color:var(--or);">${pts}</div><div style="font-size:.42rem;color:var(--tx3);">PTS</div></div>
        <div><div style="font-size:.75rem;font-weight:700;color:var(--tx);">${reb}</div><div style="font-size:.42rem;color:var(--tx3);">REB</div></div>
        <div><div style="font-size:.75rem;font-weight:700;color:var(--tx);">${ast}</div><div style="font-size:.42rem;color:var(--tx3);">AST</div></div>
      </div>
      <div style="color:var(--tx3);font-size:.7rem;">›</div>
    </div>`;
  }).join('') + (playersAds[0] ? `<a href="${playersAds[0].url}" target="_blank" style="display:block;text-decoration:none;margin:.5rem 0;background:var(--card);border:1px solid var(--bd);border-radius:10px;padding:.7rem .8rem;"><div style="display:flex;align-items:center;gap:.5rem;">${playersAds[0].img ? `<img src="${playersAds[0].img}" style="width:48px;height:48px;border-radius:8px;object-fit:cover;flex-shrink:0;">` : ''}<div style="flex:1;min-width:0;"><span style="font-size:.5rem;background:rgba(255,90,0,.15);color:var(--or);padding:.1rem .4rem;border-radius:10px;font-weight:700;">PR</span><div style="font-size:.72rem;font-weight:700;color:var(--tx);">${playersAds[0].title}</div></div><div style="color:var(--tx3);font-size:.8rem;">›</div></div></a>` : '');
}

// ============================================================
// 選手詳細モーダルを開く
// ============================================================
async function openPlayerDetail(name, team) {
  const modal   = document.getElementById('playerDetailModal');
  const content = document.getElementById('playerDetailContent');
  if (!modal || !content) return;
  modal.style.display = 'block';

  const jaName = JA_NAME_MAP[name] || name;
  const rosterInfo = (window._cachedPlayers||[]).find(p=>p.playerName===name)||{};
  const heightRaw = rosterInfo.height||"";
  const height = heightRaw ? (()=>{ const m=heightRaw.match(/([0-9]+).*?([0-9]+)/); return m ? Math.round((parseInt(m[1])*12+parseInt(m[2]))*2.54)+"cm" : heightRaw; })() : "";
  const weightRaw = rosterInfo.weight||"";
  const weight = weightRaw ? (()=>{ const m=weightRaw.match(/([0-9]+)/); return m ? Math.round(parseInt(m[1])*0.453592)+"kg" : weightRaw; })() : "";
  const dob = rosterInfo.dob||"";
  const birthYear = dob ? dob.slice(0,4) : "";
  const experience = rosterInfo.experience!=null ? rosterInfo.experience : "";
  const debutYear = rosterInfo.debutYear||"";
  const norm   = (s) => (s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const _emap = window._espnIdMap || {};
  let espnId   = _emap[name];
  if (!espnId) {
    const ln = norm(name.split(' ').slice(-1)[0]);
    for (const [key, val] of Object.entries(_emap)) {
      if (norm(key.split(' ').slice(-1)[0]) === ln) { espnId = val; break; }
    }
  }
  const photoUrl = espnId ? ESPN_HEADSHOT(espnId) : ''; // config.js

  content.innerHTML = `
    <div style="background:linear-gradient(135deg,#0a1628,#1d428a);padding:max(env(safe-area-inset-top),80px) 1rem .6rem;">
      <div style="display:flex;align-items:center;gap:.6rem;">
        <button onclick="closePlayerDetail()" style="background:rgba(255,255,255,.15);border:none;color:#fff;padding:.25rem .5rem;border-radius:10px;font-size:.7rem;cursor:pointer;flex-shrink:0;">← 戻る</button>
        <div style="width:44px;height:44px;border-radius:50%;overflow:hidden;background:rgba(255,255,255,.1);flex-shrink:0;">
          ${photoUrl ? `<img src="${photoUrl}" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none'">` : ''}
        </div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:.55rem;color:rgba(255,255,255,.6);">${jaName}</div>
          <div style="font-size:.95rem;font-weight:700;color:#fff;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${name}</div>
          <div style="font-size:.58rem;color:rgba(255,255,255,.5);">${team}</div>
        </div>
        <button onclick="closePlayerDetail()" style="background:rgba(255,255,255,.15);border:none;color:#fff;width:26px;height:26px;border-radius:50%;font-size:.75rem;cursor:pointer;flex-shrink:0;">✕</button>
      </div>
      <div style="display:flex;gap:.35rem;margin-top:.4rem;flex-wrap:wrap;">
        ${height ? `<span style="font-size:.55rem;color:rgba(255,255,255,.7);background:rgba(255,255,255,.1);padding:.1rem .35rem;border-radius:6px;">${height}</span>` : ''}
        ${weight ? `<span style="font-size:.55rem;color:rgba(255,255,255,.7);background:rgba(255,255,255,.1);padding:.1rem .35rem;border-radius:6px;">${weight}</span>` : ''}
        ${birthYear ? `<span style="font-size:.55rem;color:rgba(255,255,255,.7);background:rgba(255,255,255,.1);padding:.1rem .35rem;border-radius:6px;">${birthYear}年生</span>` : ''}
        ${debutYear ? `<span style="font-size:.55rem;color:rgba(255,255,255,.7);background:rgba(255,255,255,.1);padding:.1rem .35rem;border-radius:6px;">${debutYear}年デビュー</span>` : ''}
      </div>
    </div>
    <div id="playerDetailBody" style="padding:.85rem;overflow-y:auto;flex:1;">
      <div style="text-align:center;padding:2rem;color:var(--tx3);font-size:.75rem;">📊 データ取得中...</div>
    </div>`;

  try {
    const seasons = ['2026','2025','2024'];
    const results = await Promise.all(seasons.map(async yr => {
      const r = await fetchWithTimeout(
        `https://api.server.nbaapi.com/api/playertotals?page=1&pageSize=500&sortBy=points&ascending=false&season=${yr}&isPlayoff=false`,
        {}, 6000
      );
      if (!r.ok) return null;
      const d = await r.json();
      const normName = name.normalize("NFD").replace(/[\u0300-\u036f]/g,""); return (d.data || []).find(p => p.playerName.normalize("NFD").replace(/[\u0300-\u036f]/g,"") === normName) || null;
    }));

    const cur = results[0];
    if (!cur) throw new Error('データなし');
    const g   = cur.games || 1;
    const fmt = (v) => v !== undefined ? (v / g).toFixed(1) : '-';
    const pct = (v) => v !== undefined ? (v * 100).toFixed(1) + '%' : '-';

    const statsItems = [
      {k:'GP',  v:cur.games},           {k:'MIN', v:cur.minutesPg&&cur.games?(cur.minutesPg/cur.games).toFixed(1):'-'},
      {k:'PTS', v:fmt(cur.points)},     {k:'REB', v:fmt(cur.totalRb)},
      {k:'AST', v:fmt(cur.assists)},    {k:'STL', v:fmt(cur.steals)},
      {k:'BLK', v:fmt(cur.blocks)},     {k:'TO',  v:fmt(cur.turnovers)},
      {k:'FG%', v:pct(cur.fieldPercent)},{k:'3P%', v:pct(cur.threePercent)},
      {k:'FT%', v:pct(cur.ftPercent)},  {k:'PF',  v:fmt(cur.personalFouls)},
    ];

    const histRows = results.map((r, i) => {
      if (!r) return '';
      const yr = ['25-26','24-25','23-24'][i];
      const gg = r.games || 1;
      const isNow = i === 0;
      const stats = [
        {k:'PTS', v:(r.points/gg).toFixed(1)},
        {k:'REB', v:(r.totalRb/gg).toFixed(1)},
        {k:'AST', v:(r.assists/gg).toFixed(1)},
        {k:'STL', v:r.steals?(r.steals/gg).toFixed(1):'-'},
        {k:'BLK', v:r.blocks?(r.blocks/gg).toFixed(1):'-'},
        {k:'FG%', v:r.fieldPercent?(r.fieldPercent*100).toFixed(1)+'%':'-'},
        {k:'3P%', v:r.threePercent?(r.threePercent*100).toFixed(1)+'%':'-'},
        {k:'FT%', v:r.ftPercent?(r.ftPercent*100).toFixed(1)+'%':'-'},
      ];
      return `<div style="border-bottom:1px solid var(--bd);padding:.5rem .4rem;${isNow?'background:rgba(255,90,0,.04);':''}">
        <div style="display:flex;align-items:center;gap:.3rem;margin-bottom:.3rem;">
          <span style="font-size:.65rem;font-weight:700;color:${isNow?'var(--or)':'var(--tx)'};">${yr}</span>
          <span style="font-size:.58rem;color:var(--tx3);">${r.team||''}</span>
          <span style="font-size:.62rem;font-weight:600;color:var(--tx2);">${r.games}G</span>
        </div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:.25rem;">
          ${stats.map(s=>`<div style="text-align:center;padding:.2rem 0;">
            <div style="font-size:.48rem;color:var(--tx3);margin-bottom:.1rem;">${s.k}</div>
            <div style="font-size:.7rem;font-weight:700;color:var(--tx);">${s.v}</div>
          </div>`).join('')}
        </div>
      </div>`;
    }).join('');

    const awardsData = AWARDS_MAP[name] || [];
    const awardsHTML = awardsData.length
      ? `<div style="margin-top:.8rem;border-top:1px solid var(--bd);padding-top:.6rem;">
          <div style="font-size:.7rem;font-weight:700;color:var(--tx2);margin-bottom:.4rem;">🏆 受賞歴・タイトル</div>
          ${awardsData.map(a => `<div style="display:flex;align-items:center;gap:.5rem;padding:.3rem .4rem;background:var(--bg3);border-radius:6px;margin-bottom:.25rem;">
            <span style="font-size:.85rem;">🏅</span>
            <div style="font-size:.68rem;color:var(--tx);">${a}</div>
          </div>`).join('')}
        </div>` : '';

    document.getElementById('playerDetailBody').innerHTML = `
      <div style="font-size:.7rem;font-weight:700;color:var(--tx2);margin-bottom:.5rem;">スタッツ（2025-26）</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:.35rem;margin-bottom:.8rem;">
        ${statsItems.map(s => `<div style="background:var(--bg3);border-radius:6px;padding:.45rem .3rem;text-align:center;">
          <div style="font-size:.55rem;color:var(--tx3);margin-bottom:.15rem;">${s.k}</div>
          <div style="font-size:.9rem;font-weight:700;color:var(--tx);">${s.v||'-'}</div>
        </div>`).join('')}
      </div>
      <div style="font-size:.7rem;font-weight:700;color:var(--tx2);margin-bottom:.4rem;">過去シーズン</div>
      <div style="border-radius:6px;border:1px solid var(--bd);margin-bottom:.6rem;overflow:hidden;">
        ${histRows}
      </div>
      ${awardsHTML}`;

  } catch(e) {
    document.getElementById('playerDetailBody').innerHTML =
      `<div style="color:var(--tx3);font-size:.72rem;text-align:center;padding:2rem;">データ取得に失敗しました</div>`;
  }
}

function closePlayerDetail() {
  const modal = document.getElementById('playerDetailModal');
  if (modal) modal.style.display = 'none';
}

// ============================================================
// 起動処理
// ============================================================
initPlayers();
// ============================================================
// v2
