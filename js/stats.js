// stats.js — スタッツリーダー・順位表
// 読み込み順: data.js → utils.js → app.js → 各機能JS

// stats.js — スタッツリーダー・順位表
//
// 【このファイルだけで完結する機能】
//   - スタッツリーダー（PTS/AST/REB/STL/BLK/3P%/FG%）
//   - 平均/合計切り替え
//   - レギュラー/プレーオフ切り替え
//   - 順位表（イースト/ウェスト）
//   - NBA API + ESP Nフォールバック
//
// 【修正したいときの場所】
//   スタッツカテゴリ追加 → initStats() の cats 配列
//   順位表データ更新    → STANDINGS オブジェクト
//   APIエンドポイント変更 → loadESPNLeaders()
// ============================================================

// ============================================================
// ダミースタッツデータ（API失敗時のバックアップ）
// ============================================================
const STATS = {
  pts:[
    {name:'ヤニス・アデトクンボ', team:'MIL', val:30.2, unit:'PPG', gp:69},
    {name:'ルカ・ドンチッチ',     team:'DAL', val:29.8, unit:'PPG', gp:72},
    {name:'ジェイソン・テイタム', team:'BOS', val:28.4, unit:'PPG', gp:74},
    {name:'ジェイレン・ブランソン',team:'NYK', val:27.8, unit:'PPG', gp:75},
    {name:'SGA',                  team:'OKC', val:26.8, unit:'PPG', gp:73},
    {name:'ステフィン・カリー',   team:'GSW', val:26.4, unit:'PPG', gp:68},
    {name:'レブロン・ジェームズ', team:'LAL', val:25.8, unit:'PPG', gp:71},
    {name:'アンソニー・エドワーズ',team:'MIN', val:25.2, unit:'PPG', gp:76},
    {name:'ケビン・デュラント',   team:'PHX', val:24.6, unit:'PPG', gp:65},
    {name:'デイミアン・リラード', team:'MIL', val:23.8, unit:'PPG', gp:70},
  ],
  ast:[
    {name:'タイリース・ハリバートン',team:'IND', val:11.2, unit:'APG', gp:71},
    {name:'ニコラ・ヨキッチ',        team:'DEN', val:9.1,  unit:'APG', gp:72},
    {name:'レブロン・ジェームズ',    team:'LAL', val:8.2,  unit:'APG', gp:71},
    {name:'河村 勇輝',               team:'LAL', val:6.2,  unit:'APG', gp:61},
    {name:'SGA',                     team:'OKC', val:7.6,  unit:'APG', gp:73},
  ],
  reb:[
    {name:'ニコラ・ヨキッチ',        team:'DEN', val:14.2, unit:'RPG', gp:72},
    {name:'ヤニス・アデトクンボ',    team:'MIL', val:12.1, unit:'RPG', gp:69},
    {name:'アンソニー・デイビス',    team:'LAL', val:11.8, unit:'RPG', gp:70},
    {name:'ウェンバンヤマ',          team:'SAS', val:10.4, unit:'RPG', gp:68},
  ],
};

// ============================================================
// 順位表データ（ダミー。ESPN APIで更新予定）
// ============================================================
const STANDINGS = {
  east:[
    {r:1,  logo:'⚔️', abbr:'CLE', w:52, l:18, pct:.743, gb:'-',  badge:'po'},
    {r:2,  logo:'🍀', abbr:'BOS', w:50, l:20, pct:.714, gb:'2',  badge:'po'},
    {r:3,  logo:'🦌', abbr:'MIL', w:46, l:24, pct:.657, gb:'6',  badge:'po'},
    {r:4,  logo:'🗽', abbr:'NYK', w:44, l:26, pct:.629, gb:'8',  badge:'po'},
    {r:5,  logo:'⚡', abbr:'IND', w:40, l:30, pct:.571, gb:'12', badge:'po'},
    {r:6,  logo:'🔥', abbr:'MIA', w:38, l:32, pct:.543, gb:'14', badge:'po'},
    {r:7,  logo:'✨', abbr:'ORL', w:36, l:34, pct:.514, gb:'16', badge:'pi'},
    {r:8,  logo:'🔔', abbr:'PHI', w:38, l:32, pct:.543, gb:'14', badge:'pi'},
    {r:9,  logo:'🐂', abbr:'CHI', w:36, l:34, pct:.514, gb:'16', badge:'pi'},
    {r:10, logo:'🦅', abbr:'ATL', w:32, l:38, pct:.457, gb:'20', badge:'pi'},
    {r:11, logo:'🦖', abbr:'TOR', w:26, l:44, pct:.371, gb:'26', badge:''},
    {r:12, logo:'🕸', abbr:'BKN', w:28, l:42, pct:.400, gb:'24', badge:''},
    {r:13, logo:'🏎️',abbr:'DET', w:14, l:56, pct:.200, gb:'38', badge:''},
    {r:14, logo:'🐝', abbr:'CHA', w:18, l:52, pct:.257, gb:'34', badge:''},
    {r:15, logo:'🧙', abbr:'WAS', w:12, l:58, pct:.171, gb:'40', badge:''},
  ],
  west:[
    {r:1,  logo:'⚡', abbr:'OKC', w:54, l:16, pct:.771, gb:'-',  badge:'po'},
    {r:2,  logo:'⛰️',abbr:'DEN', w:50, l:20, pct:.714, gb:'4',  badge:'po'},
    {r:3,  logo:'🐺', abbr:'MIN', w:46, l:24, pct:.657, gb:'8',  badge:'po'},
    {r:4,  logo:'👑', abbr:'LAL', w:44, l:26, pct:.629, gb:'10', badge:'po'},
    {r:5,  logo:'🤠', abbr:'DAL', w:44, l:26, pct:.629, gb:'10', badge:'po'},
    {r:6,  logo:'🚀', abbr:'HOU', w:40, l:30, pct:.571, gb:'14', badge:'po'},
    {r:7,  logo:'🎯', abbr:'GSW', w:40, l:30, pct:.571, gb:'14', badge:'pi'},
    {r:8,  logo:'⚓', abbr:'LAC', w:36, l:34, pct:.514, gb:'18', badge:'pi'},
    {r:9,  logo:'👑', abbr:'SAC', w:38, l:32, pct:.543, gb:'16', badge:'pi'},
    {r:10, logo:'🐻', abbr:'MEM', w:32, l:38, pct:.457, gb:'22', badge:'pi'},
    {r:11, logo:'☀️', abbr:'PHX', w:36, l:34, pct:.514, gb:'18', badge:''},
    {r:12, logo:'🦅', abbr:'NOP', w:34, l:36, pct:.486, gb:'20', badge:''},
    {r:13, logo:'🎵', abbr:'UTA', w:20, l:50, pct:.286, gb:'34', badge:''},
    {r:14, logo:'🌹', abbr:'POR', w:22, l:48, pct:.314, gb:'32', badge:''},
    {r:15, logo:'⚜️', abbr:'SAS', w:18, l:52, pct:.257, gb:'36', badge:''},
  ],
};

// ============================================================
// NBA API ソートキー対応表
// ============================================================
const NBAAPI_SORT_MAP = {
  pts: { sortKey:'points',        label:'PPG', totLabel:'PTS', pct:false },
  ast: { sortKey:'assists',       label:'APG', totLabel:'AST', pct:false },
  reb: { sortKey:'totalRb',       label:'RPG', totLabel:'REB', pct:false },
  stl: { sortKey:'steals',        label:'SPG', totLabel:'STL', pct:false },
  blk: { sortKey:'blocks',        label:'BPG', totLabel:'BLK', pct:false },
  fg3: { sortKey:'threePercent',  label:'3P%', totLabel:'3P%', pct:true  },
  fg:  { sortKey:'fieldPercent',  label:'FG%', totLabel:'FG%', pct:true  },
  ft:  { sortKey:'ftPercent',     label:'FT%', totLabel:'FT%', pct:true  },
  to:  { sortKey:'turnovers',     label:'TPG', totLabel:'TO',  pct:false },
  pf:  { sortKey:'personalFouls', label:'FPG', totLabel:'PF',  pct:false },
  min: { sortKey:'minutesPg',     label:'MPG', totLabel:'MIN', pct:false },
};

// ============================================================
// 状態管理
// ============================================================
let curConf     = 'east';
let curMode     = 'season';
let curStatKey  = 'pts';
let curStatType = 'avg';

// ============================================================
// スタッツページ初期化
// ============================================================
function initStats() {
  const cats = [
    ['pts','PTS'], ['ast','AST'], ['reb','REB'],
    ['stl','STL'], ['blk','BLK'], ['fg3','3P%'], ['fg3m','3PM'], ['fg','FG%'], ['ft','FT%'],
    ['to','TO'], ['min','MIN'],
  ];
  document.getElementById('statCats').innerHTML = cats.map((c, i) =>
    `<button class="scat${i === 0 ? ' on' : ''}" onclick="showStat(this,'${c[0]}')">${c[1]}</button>`
  ).join('');
  loadESPNLeaders('pts', 'season');
  renderStandings();
}

// カテゴリ切り替え
function showStat(btn, stat) {
  document.querySelectorAll('.scat').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  curStatKey = stat;
  loadESPNLeaders(stat, curMode);
}

// シーズン/プレーオフ切り替え
function switchMode(btn, mode) {
  document.querySelectorAll('#btn-season, #btn-playoff').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  curMode = mode;
  loadESPNLeaders(curStatKey, mode);
}

// 平均/合計切り替え
function switchStatType(btn, type) {
  document.querySelectorAll('.stat-type-btn').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  curStatType = type;
  loadESPNLeaders(curStatKey, curMode);
}

// ============================================================
// ESPN APIのスタッツカテゴリ対応表
// ============================================================
const ESPN_STAT_MAP = {
  pts: { espnStat:'points', nbaStatKey:'PTS',       label:'PPG', totLabel:'PTS', pct:false },
  ast: { espnStat:'assists', nbaStatKey:'AST',      label:'APG', totLabel:'AST', pct:false },
  reb: { espnStat:'rebounds', nbaStatKey:'REB',     label:'RPG', totLabel:'REB', pct:false },
  stl: { espnStat:'steals', nbaStatKey:'STL',       label:'SPG', totLabel:'STL', pct:false },
  blk: { espnStat:'blocks', nbaStatKey:'BLK',       label:'BPG', totLabel:'BLK', pct:false },
  fg3: { espnStat:'threePointFieldGoalPct', nbaStatKey:'FG3_PCT', label:'3P%', totLabel:'3P%', pct:true  },
  fg3m: { espnStat:'threePointMade', nbaStatKey:'FG3M', label:'3PM', totLabel:'3PM', pct:false },
  pf:   { espnStat:'personalFouls', nbaStatKey:'PF', label:'FPG', totLabel:'PF', pct:false },
  fg:  { espnStat:'fieldGoalPct', nbaStatKey:'FG_PCT', label:'FG%', totLabel:'FG%', pct:true  },
  ft:  { espnStat:'freeThrowPct', nbaStatKey:'FT_PCT', label:'FT%', totLabel:'FT%', pct:true  },
  to:  { espnStat:'turnoversPerGame', nbaStatKey:'TOV', label:'TPG', totLabel:'TO',  pct:false },
  min: { espnStat:'minutesPerGame', nbaStatKey:'MIN', label:'MPG', totLabel:'MIN', pct:false },
};

// ============================================================
// NBA APIからスタッツリーダーを取得（ESPN API使用）
// ============================================================
async function loadESPNLeaders(stat, mode) {
  const list    = document.getElementById('leaderList');
  const loading = document.getElementById('statsLoading');
  if (!list) return;
  list.innerHTML = '';
  if (loading) loading.style.display = 'block';

  try {
    const statInfo   = ESPN_STAT_MAP[stat] || ESPN_STAT_MAP.pts;
    const seasontype = mode === 'playoff' ? 3 : mode === 'playin' ? 5 : 2;

    // NBA Stats API (data.json)
    const url = `https://courtside-jp.github.io/mentality/data.json`;
    const res = await fetchWithTimeout(url, {}, 8000);
    if (!res.ok) throw new Error('NBA Stats ' + res.status);
    const data = await res.json();

    // data.jsonからカテゴリを選択（平均/合計切り替え）
    const isTotal = typeof curStatType !== 'undefined' && curStatType === 'total';
    const categoryKey = mode === 'playoff' ? 'po_' + stat : (isTotal ? stat + '_tot' : stat);
    const statData = data[categoryKey] || data[stat];
    if (!statData || !statData.resultSet) throw new Error('カテゴリなし');

    const headers = statData.resultSet.headers;
    const rows = statData.resultSet.rowSet.slice(0, 15);
    const nameIdx = headers.indexOf('PLAYER');
    const teamIdx = headers.indexOf('TEAM');
    const valIdx  = headers.indexOf(statInfo.nbaStatKey || 'PTS');

    if (loading) loading.style.display = 'none';
    const medals = ['🥇','🥈','🥉'];

    // adslots取得
    let statsAds = [];
    try {
      const ar = await fetch(FB_URL + '/adslots.json');
      const ad = await ar.json() || {};
      statsAds = ['stats_1','stats_2'].map(k => ad[k]).filter(a => a && a.url && a.enabled !== false);
    } catch(e) {}
    const statsAdHTML = (ad) => `<a href="${ad.url}" target="_blank" style="display:block;text-decoration:none;margin:.3rem 0;background:var(--card);border:1px solid var(--bd);border-radius:10px;padding:.6rem .8rem;"><div style="display:flex;align-items:center;gap:.5rem;">${ad.img ? `<img src="${ad.img}" style="width:40px;height:40px;border-radius:6px;object-fit:cover;flex-shrink:0;" onerror="this.style.display='none'">` : ''}<div style="flex:1;min-width:0;"><span style="font-size:.5rem;background:rgba(255,90,0,.15);color:var(--or);padding:.1rem .4rem;border-radius:10px;font-weight:700;">PR</span><div style="font-size:.7rem;font-weight:700;color:var(--tx);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${ad.title}</div></div><div style="color:var(--tx3);font-size:.8rem;">›</div></div></a>`;

    const midIdx = Math.floor(rows.length / 2);
    list.innerHTML = rows.map((row, i) => {
      const rank    = i + 1;
      const medal   = rank <= 3 ? medals[i] : rank;
      const name    = row[nameIdx] || '';
      const normN   = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const jaName  = JA_NAME_MAP[name] || JA_NAME_MAP[normN] || '';
      const team    = row[teamIdx] || '';
      const rawVal  = parseFloat(row[valIdx]) || 0;
      const isTop3  = rank <= 3;

      let val = '-';
      if (statInfo.pct) {
        val = (rawVal * 100).toFixed(1) + '%';
      } else {
        val = rawVal.toFixed(1);
      }
      const unitLabel = statInfo.label;
      const espnId    = (window._espnIdMap || {})[normN] || (window._espnIdMap || {})[name] || '';
      const displayName = jaName || name;
      const subName = jaName ? name : '';
      const photoUrl  = espnId ? `https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/${espnId}.png&w=96&h=70` : '';

      return `<div class="lc${isTop3 ? ' t' + rank : ''}" onclick="openPlayerModalByName('${name.replace(/'/g,"\\'")}','${team}')">
        <div class="lc-rank r${rank <= 3 ? rank : ''}">${medal}</div>
        <div style="width:42px;height:32px;flex-shrink:0;border-radius:5px;overflow:hidden;background:var(--bg3);">
          ${photoUrl
            ? `<img src="${photoUrl}" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none'">`
            : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:.65rem;font-weight:700;color:var(--tx3);">${name.split(' ').map(w=>w[0]).join('').slice(0,2)}</div>`
          }
        </div>
        <div class="lc-info">
          <div class="lc-name">${jaName || name}</div>
          ${jaName ? `<div class="lc-sub" style="font-size:.6rem;color:var(--tx3);">${name} · ${team}</div>` : `<div class="lc-sub">${team}</div>`}
        </div>
        <div class="lc-val">
          <div class="lc-v${isTop3 ? ' gold' : ''}">${val}</div>
          <div class="lc-u">${unitLabel}</div>
        </div>
      </div>`;
    }).join('') + (statsAds[0] ? statsAdHTML(statsAds[0]) : '');

    console.log('✅ ESPN スタッツ取得成功:', stat, mode);

  } catch(e) {
    console.warn('ESPNスタッツ失敗:', e.message, '→ ダミーデータ');
    if (loading) loading.style.display = 'none';
    showStatFallback(stat);
  }
}

// ダミーデータでスタッツ表示（API失敗時）
function showStatFallback(stat) {
  const list    = document.getElementById('leaderList');
  const data    = STATS[stat] || STATS.pts;
  const medals  = ['🥇','🥈','🥉'];
  list.innerHTML = data.map((p, i) => {
    const rank   = i + 1;
    const isTop3 = rank <= 3;
    return `<div class="lc${isTop3 ? ' t' + rank : ''}">
      <div class="lc-rank r${rank <= 3 ? rank : ''}">${rank <= 3 ? medals[i] : rank}</div>
      <div style="width:42px;height:32px;flex-shrink:0;border-radius:5px;background:var(--bg3);display:flex;align-items:center;justify-content:center;">
        <span style="font-size:.65rem;font-weight:700;color:var(--tx3);">${p.name.slice(0,2)}</span>
      </div>
      <div class="lc-info">
        <div class="lc-name">${p.name}</div>
        <div class="lc-sub">${p.team} · ${p.gp}G</div>
      </div>
      <div class="lc-val">
        <div class="lc-v${isTop3 ? ' gold' : ''}">${p.val}</div>
        <div class="lc-u">${p.unit}</div>
      </div>
    </div>`;
  }).join('');
}

// ============================================================
// 選手モーダルを名前から開く（スタッツページ用）
// ============================================================
async function openPlayerModalByName(name, team) {
  const modal = document.getElementById('playerModal');
  const inner = document.getElementById('playerModalInner');
  if (!modal || !inner) return;
  modal.style.display = 'flex';

  inner.innerHTML = `<div style="padding:2rem;text-align:center;color:var(--tx3);">📊 選手データ取得中...</div>`;

  // ESPN IDを探す
  const norm = (s) => (s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const _emap = window._espnIdMap || {};
  let espnId  = _emap[name];
  if (!espnId) {
    const ln = norm(name.split(' ').slice(-1)[0]);
    for (const [key, val] of Object.entries(_emap)) {
      if (norm(key.split(' ').slice(-1)[0]) === ln) { espnId = val; break; }
    }
  }

  const photoUrl = espnId ? ESPN_HEADSHOT(espnId) : ''; // config.js
  renderPlayerModal(inner, name, team, photoUrl, espnId);
}

// 選手モーダルのHTML描画
async function renderPlayerModal(inner, name, team, photoUrl, espnId) {
  const jaName = JA_NAME_MAP[name] || name;

  inner.innerHTML = `
    <div style="background:linear-gradient(135deg,#0a1628,#1d428a);padding:1rem;position:relative;">
      <button onclick="closePlayerModal()" style="position:fixed;top:80px;right:12px;z-index:400;background:rgba(255,255,255,.15);border:none;color:#fff;width:30px;height:30px;border-radius:50%;font-size:.8rem;cursor:pointer;">✕</button>
      <div style="display:flex;gap:.8rem;align-items:flex-end;">
        <div style="width:80px;height:64px;border-radius:8px;overflow:hidden;background:rgba(255,255,255,.1);flex-shrink:0;">
          ${photoUrl ? `<img src="${photoUrl}" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none'">` : ''}
        </div>
        <div>
          <div style="font-size:.65rem;color:rgba(255,255,255,.6);">${jaName}</div>
          <div style="font-size:1.2rem;font-weight:700;color:#fff;line-height:1.2;">${name}</div>
          <div style="font-size:.62rem;color:rgba(255,255,255,.5);margin-top:.2rem;">${team}</div>
        </div>
      </div>
    </div>
    <div id="pm-body" style="padding:.85rem;">
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
      return (d.data || []).find(p => p.playerName === name) || null;
    }));

    const cur = results[0];
    if (!cur) throw new Error('データなし');
    const g   = cur.games || 1;
    const fmt = (v, div = true) => v !== undefined ? (div ? (v / g).toFixed(1) : v) : '-';
    const pct = (v) => v !== undefined ? (v * 100).toFixed(1) + '%' : '-';

    const statsItems = [
      {k:'GP',  v:cur.games},
      {k:'PTS', v:fmt(cur.points)},
      {k:'REB', v:fmt(cur.totalRb)},
      {k:'AST', v:fmt(cur.assists)},
      {k:'STL', v:fmt(cur.steals)},
      {k:'BLK', v:fmt(cur.blocks)},
      {k:'FG%', v:pct(cur.fieldPercent)},
      {k:'3P%', v:pct(cur.threePercent)},
      {k:'FT%', v:pct(cur.ftPercent)},
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
      return `<div style="border-bottom:1px solid var(--bd);padding:.45rem .5rem;${isNow?'background:rgba(255,90,0,.04);':''}">
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

    document.getElementById('pm-body').innerHTML = `
      <div style="font-size:.7rem;font-weight:700;color:var(--tx2);margin-bottom:.5rem;">スタッツ（2025-26）</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:.35rem;margin-bottom:.8rem;">
        ${statsItems.map(s => `<div style="background:var(--bg3);border-radius:6px;padding:.45rem .3rem;text-align:center;">
          <div style="font-size:.55rem;color:var(--tx3);margin-bottom:.15rem;">${s.k}</div>
          <div style="font-size:.9rem;font-weight:700;color:var(--tx);">${s.v||'-'}</div>
        </div>`).join('')}
      </div>
      <div style="font-size:.7rem;font-weight:700;color:var(--tx2);margin-bottom:.4rem;">過去シーズン</div>
      <div style="border-radius:6px;border:1px solid var(--bd);overflow:hidden;">
        ${histRows}
      </div>`;
  } catch(e) {
    document.getElementById('pm-body').innerHTML = `<div style="color:var(--tx3);font-size:.72rem;text-align:center;padding:2rem;">データ取得に失敗しました</div>`;
  }
}

function closePlayerModal() {
  const modal = document.getElementById('playerModal');
  if (modal) modal.style.display = 'none';
}

// ============================================================
// 順位表 — ESPN APIから取得
// ============================================================
function showConf(btn, conf) {
  document.querySelectorAll('#pg-stats .conf-row:last-of-type .conf-btn').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  curConf = conf;
  renderStandings();
}

async function renderStandings() {
  const wrap = document.getElementById('standingsWrap');
  if (!wrap) return;
  wrap.innerHTML = '<div style="text-align:center;padding:1.5rem;color:var(--tx3);font-size:.75rem;">📊 順位表取得中...</div>';

  try {
    // シーズンタイプをモードに合わせる
    const seasontype = curMode === 'playoff' ? 3 : 2;
    const res = await fetchWithTimeout(
      `https://courtside-jp.github.io/mentality/data.json`,
      {}, 8000
    );
    if (!res.ok) throw new Error('ESPN standings ' + res.status);
    const data = await res.json();

    const groups = (data.standings && data.standings.children) || [];
    const confName = curConf === 'east' ? 'Eastern' : 'Western';
    const group   = groups.find(g => (g.name || '').includes(confName)) || groups[curConf === 'east' ? 0 : 1];
    if (!group) throw new Error('グループなし');

    const standings = (group.standings?.entries || []).sort((a,b)=>{ const wa=(a.stats||[]).find(s=>s.name==='wins')?.value||0; const wb=(b.stats||[]).find(s=>s.name==='wins')?.value||0; return wb-wa; });
    if (!standings.length) throw new Error('データなし');

    let h = `<div class="sw">
      <div class="sw-head">
        <div class="sw-cn">チーム</div>
        <div class="sw-c">W</div>
        <div class="sw-c">L</div>
        <div class="sw-c">PCT</div>
        <div class="sw-c">GB</div>
      </div>`;

    standings.forEach((entry, i) => {
      const team  = entry.team || {};
      const abbrRaw = (team.abbreviation || '').toUpperCase(); const abbrFix={'GS':'GSW','SA':'SAS','NO':'NOP','UTAH':'UTA','WSH':'WAS','NY':'NYK'}; const abbr = abbrFix[abbrRaw]||abbrRaw;
      const stats = entry.stats || [];
      const getStat = (name) => stats.find(s => s.name === name)?.value ?? '-';
      const w    = getStat('wins');
      const l    = getStat('losses');
      const pct  = getStat('winPercent');
      const gb   = getStat('gamesBehind');
      const hw   = getStat('homeWins');
      const hl   = getStat('homeLosses');
      const aw   = getStat('awayWins');
      const al   = getStat('awayLosses');
      const rank = i + 1;

      // プレーオフ圏内判定
      const badge = rank <= 6 ? 'po' : rank <= 10 ? 'pi' : '';
      const cls   = badge === 'po' ? 'sw-row po' : badge === 'pi' ? 'sw-row pi' : 'sw-row';
      const cdnId = TEAM_CDN_IDS[abbr] || '';
      const logo  = cdnId
        ? `<img src="${NBA_CDN_LOGO(cdnId)}" style="width:22px;height:22px;object-fit:contain;" onerror="this.style.display='none'">`
        : `<span style="font-size:.9rem;">🏀</span>`;
      const pctDisp = typeof pct === 'number' ? pct.toFixed(3).replace(/^0/, '') : '-';
      const gbDisp  = gb === 0 ? '-' : (typeof gb === 'number' ? gb.toFixed(1) : gb);

      // ホーム/アウェイ成績をサブテキストで表示
      const recordSub = (hw !== '-' && aw !== '-')
        ? `<div style="font-size:.44rem;color:var(--tx3);">H:${hw}-${hl} A:${aw}-${al}</div>` : '';

      h += `<div class="${cls}">
        <div class="sw-rk">${rank}</div>
        <div class="sw-tm">
          <div class="sw-logo">${logo}</div>
          <div>
            <div class="sw-abbr">${abbr}${badge ? ` <span class="sw-badge b${badge}">${badge.toUpperCase()}</span>` : ''}</div>
            ${recordSub}
          </div>
        </div>
        <div class="sw-n hi">${w}</div>
        <div class="sw-n">${l}</div>
        <div class="sw-n">${pctDisp}</div>
        <div class="sw-n">${gbDisp}</div>
      </div>`;
      if (i === 5) h += `<div class="sw-div1"></div>`;
      if (i === 9) h += `<div class="sw-div2"></div>`;
    });

    h += '</div>';
    wrap.innerHTML = h;
    // 順位表下に広告②追加
    try {
      const ar = await fetch(FB_URL + '/adslots.json');
      const ad = await ar.json() || {};
      const slot = ad['stats_2'];
      if (slot && slot.url) {
        wrap.innerHTML += `<a href="${slot.url}" target="_blank" style="display:block;text-decoration:none;margin:.5rem 0;background:var(--card);border:1px solid var(--bd);border-radius:10px;padding:.7rem .8rem;"><div style="display:flex;align-items:center;gap:.5rem;">${slot.img ? `<img src="${slot.img}" style="width:48px;height:48px;border-radius:8px;object-fit:cover;flex-shrink:0;">` : ''}<div style="flex:1;min-width:0;"><span style="font-size:.5rem;background:rgba(255,90,0,.15);color:var(--or);padding:.1rem .4rem;border-radius:10px;font-weight:700;">PR</span><div style="font-size:.72rem;font-weight:700;color:var(--tx);">${slot.title}</div></div><div style="color:var(--tx3);font-size:.8rem;">›</div></div></a>`;
      }
    } catch(e) {}
    console.log('✅ ESPN順位表取得成功');

  } catch(e) {
    console.warn('ESPN順位表失敗、ダミーデータ:', e.message);
    _renderDummyStandings();
  }
}

// ダミー順位表（API失敗時）
function _renderDummyStandings() {
  const wrap = document.getElementById('standingsWrap');
  if (!wrap) return;
  const data = STANDINGS[curConf];
  let h = `<div class="sw">
    <div class="sw-head">
      <div class="sw-cn">チーム</div>
      <div class="sw-c">W</div><div class="sw-c">L</div>
      <div class="sw-c">PCT</div><div class="sw-c">GB</div>
    </div>`;
  data.forEach((t, i) => {
    const cls   = t.badge === 'po' ? 'sw-row po' : t.badge === 'pi' ? 'sw-row pi' : 'sw-row';
    const cdnId = TEAM_CDN_IDS[t.abbr] || '';
    const logo  = cdnId ? `<img src="${NBA_CDN_LOGO(cdnId)}" style="width:22px;height:22px;object-fit:contain;" onerror="this.outerHTML='<span style=\\'font-size:.9rem;\\'>${t.logo}</span>'">` : `<span style="font-size:.9rem;">${t.logo}</span>`;
    h += `<div class="${cls}">
      <div class="sw-rk">${t.r}</div>
      <div class="sw-tm"><div class="sw-logo">${logo}</div><div class="sw-abbr">${t.abbr}${t.badge ? ` <span class="sw-badge b${t.badge}">${t.badge.toUpperCase()}</span>` : ''}</div></div>
      <div class="sw-n hi">${t.w}</div><div class="sw-n">${t.l}</div>
      <div class="sw-n">${t.pct.toFixed(3).slice(1)}</div><div class="sw-n">${t.gb}</div>
    </div>`;
    if (i === 5) h += `<div class="sw-div1"></div>`;
    if (i === 9) h += `<div class="sw-div2"></div>`;
  });
  h += '</div>';
  wrap.innerHTML = h;
}

// ============================================================
// 起動処理
// ============================================================
initStats();
// ============================================================
