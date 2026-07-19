// チームカタカナ名マップ
const TEAM_JP = {
  'ATL':'ホークス','BOS':'セルティックス','BKN':'ネッツ','CHA':'ホーネッツ',
  'CHI':'ブルズ','CLE':'キャバリアーズ','DAL':'マーベリックス','DEN':'ナゲッツ',
  'DET':'ピストンズ','GSW':'ウォリアーズ','HOU':'ロケッツ','IND':'ペイサーズ',
  'LAC':'クリッパーズ','LAL':'レイカーズ','MEM':'グリズリーズ','MIA':'ヒート',
  'MIL':'バックス','MIN':'ティンバーウルブズ','NOP':'ペリカンズ','NYK':'ニックス',
  'OKC':'サンダー','ORL':'マジック','PHI':'76ers','PHX':'サンズ',
  'POR':'トレイルブレイザーズ','SAC':'キングス','SAS':'スパーズ','TOR':'ラプターズ',
  'UTA':'ジャズ','WAS':'ウィザーズ','NY':'ニックス','SA':'スパーズ'
};


const KATAKANA_MAP = {
  'Victor Wembanyama': 'ビクター・ウェンバンヤマ',
  'Jalen Brunson': 'ジェイレン・ブランソン',
  'Karl-Anthony Towns': 'カール・アンソニー・タウンズ',
  'Mikal Bridges': 'ミケル・ブリッジズ',
  'OG Anunoby': 'OG・アヌノビー',
  'Josh Hart': 'ジョシュ・ハート',
  'Stephon Castle': 'ステフォン・キャッスル',
  "De'Aaron Fox": 'ディアロン・フォックス',
  'Devin Vassell': 'デビン・バセル',
  'Julian Champagnie': 'ジュリアン・シャンペニー',
  'Dylan Harper': 'ディラン・ハーパー',
  'Keldon Johnson': 'ケルドン・ジョンソン',
  'Landry Shamet': 'ランドリー・シャメット',
  'Mitchell Robinson': 'ミッチェル・ロビンソン',
  'Luke Kornet': 'ルーク・コーネット',
};
function toKatakana(name) { return KATAKANA_MAP[name] || name; }
function restoreNotifyBtns() {}
// loadLiveChat stub
function loadLiveChat(id) { console.log("chat:", id); }
// schedule.js — 試合情報・スコア・詳細パネル
// 読み込み順: data.js → utils.js → app.js → 各機能JS

// schedule.js — 試合情報・スコア・詳細パネル
//
// 【このファイルだけで完結する機能】
//   - ESPN APIからスコアを取得
//   - 試合カードを描画
//   - タップで詳細パネルを開く
//   - 選手スタッツを取得・表示
//   - ライブ試合のタイマーカウントダウン
//
// 【他のファイルへの影響】
//   なし。このファイルだけ修正しても他は壊れない
//
// 【修正したいときの場所】
//   スコア取得    → loadESPNScoreboard()
//   試合カード    → gcHTML()
//   詳細パネル    → buildDetail()
//   選手スタッツ  → loadESPNPlayerStats()
// ============================================================

// ============================================================
// ダミーデータ（ESPN APIが失敗したときのバックアップ）
// ============================================================
const GAMES = {
  '-2': [{ id:'d2a', status:'final',
    home:{ abbr:'MIL', city:'MILWAUKEE', score:118 },
    away:{ abbr:'IND', city:'INDIANA',   score:112 },
    qh:[28,34,28,28], qa:[26,28,30,28],
    note:'ヤニス38得点の怪物パフォ', plays:[], hpl:[
      {num:34, name:'Giannis', pos:'C', pts:38, ast:7, reb:12, pm:'+10', on:false, hot:true}
    ], apl:[
      {num:0, name:'Haliburton', pos:'PG', pts:18, ast:14, reb:3, pm:'-5', on:false, hot:false}
    ]
  }],
  '-1': [{ id:'d1a', status:'final',
    home:{ abbr:'MIN', city:'MINNESOTA', score:122 },
    away:{ abbr:'UTA', city:'UTAH',      score:97  },
    qh:[30,32,30,30], qa:[24,24,25,24],
    note:'ミネソタ圧勝25点差', plays:[], hpl:[], apl:[]
  }],
  '0': [], // 今日の試合はESPN APIから取得（ダミーデータは廃止）
  '1': [{ id:'m0', status:'pre', startTime:'10:00',
    home:{ abbr:'ATL', city:'ATLANTA', score:0 },
    away:{ abbr:'ORL', city:'ORLANDO', score:0 },
    note:'イースト8位争い', plays:[], hpl:[], apl:[]
  }],
};

// ============================================================
// 状態管理
// ============================================================
let dateOff = 0;
let selId   = null;

// ============================================================
// シーズンフェーズ切り替え（レギュラー/プレーイン/プレーオフ）
// ============================================================
let currentPhase = 'season';

const PHASE_LABELS = {
  season:  { label:'レギュラーシーズン', badge:'REGULAR',  badgeClass:'badge-season' },
  playin:  { label:'プレーイン',          badge:'PLAY-IN',  badgeClass:'badge-playin' },
  playoff: { label:'プレーオフ',          badge:'PLAYOFFS', badgeClass:'badge-playoff' },
};

function switchPhase(btn, phase) {
  document.querySelectorAll('#pg-schedule .conf-row .conf-btn').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  currentPhase = phase;

  // バッジを更新
  const info   = PHASE_LABELS[phase];
  const badge  = document.getElementById('schedulePhaseLabel');
  if (badge) {
    badge.textContent  = info.badge;
    badge.className    = `pg-badge ${info.badgeClass}`;
  }

  // 日付をリセットして再取得
  dateOff = 0;
  selId   = null;
  loadESPNScoreboard();
}

// ============================================================
// 日付バー操作（前日・翌日ボタン）
// ============================================================
function moveDate(d) {
  const next = dateOff + d;
  if (next < -3 || next > 3) return;
  dateOff = next;
  selId   = null;

  const base = getNBABaseDate(); // utils.js
  const dt   = new Date(base);
  dt.setDate(dt.getDate() + dateOff);

  // 日付ラベル更新
  document.getElementById('dbDate').innerHTML = toJPDateLabel(dt); // utils.js
  const sub = document.getElementById('dbSub');
  if (dateOff === 0) {
    sub.innerHTML = 'TODAY<span class="db-today">今日</span>';
  } else if (dateOff < 0) {
    sub.textContent = Math.abs(dateOff) + '日前';
  } else {
    sub.textContent = dateOff + '日後';
  }

  // ESPN APIで指定日の試合を取得
  const dateStr = toDateStr(dt); // utils.js
  loadGamesForDate(dateStr);
}

// ============================================================
// 試合カード一覧を描画
// ============================================================
async function renderGames() {
  const games = GAMES[String(dateOff)] || [];
  const wrap  = document.getElementById('gameWrap');
  if (!games.length) {
    wrap.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--tx3);font-size:.78rem;font-family:\'Barlow Condensed\',sans-serif;letter-spacing:.06em;">この日の試合情報はありません</div>';
    return;
  }
  let ADS = [];
  try {
    const adRes = await fetch(FB_URL + '/adslots.json');
    const adData = await adRes.json() || {};
    ADS = ['schedule_1','schedule_2'].map(k => adData[k]).filter(a => a && a.url && a.enabled !== false);
  } catch(e) {}

  const adHTML = (ad) => `
    <a href="${ad.url}" target="_blank" style="display:block;text-decoration:none;margin:.5rem 0;background:var(--card);border:1px solid var(--bd);border-radius:10px;padding:.7rem .8rem;">
      <div style="display:flex;align-items:center;gap:.5rem;">
        ${ad.img ? `<img src="${ad.img}" style="width:48px;height:48px;border-radius:8px;object-fit:cover;flex-shrink:0;" onerror="this.style.display='none'">` : '<div style="width:48px;height:48px;border-radius:8px;background:var(--bg3);flex-shrink:0;"></div>'}
        <div style="flex:1;min-width:0;">
          <div style="margin-bottom:.2rem;"><span style="font-size:.5rem;background:rgba(255,90,0,.15);color:var(--or);padding:.1rem .4rem;border-radius:10px;font-weight:700;">PR</span></div>
          <div style="font-size:.72rem;font-weight:700;color:var(--tx);margin-bottom:.15rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${ad.title}</div>
        </div>
        <div style="color:var(--tx3);font-size:.8rem;">›</div>
      </div>
    </a>`;

  wrap.innerHTML = games.map((g, i) => `
    <div id="gc-wrap-${g.id}">
      ${gcHTML(g)}
      <div class="detail-panel" id="dp-${g.id}"></div>
    </div>
    ${i === Math.floor(games.length/2)-1 && ADS[0] ? adHTML(ADS[0]) : ''}
    ${i === games.length-1 && ADS[1] ? adHTML(ADS[1]) : ''}
  `).join('');

  // ライブ試合を自動選択
  const first = games.find(g => g.status === 'live') || games[0];
  if (first) selectGame(first.id);
}

// ============================================================
// 試合カード 1枚のHTML生成
// ============================================================
function gcHTML(g) {
  const isL = g.status === 'live';
  const isF = g.status === 'final';
  const isP = g.status === 'pre';
  const hl  = g.home.score > g.away.score;
  const m   = g.timeLeft ? Math.floor(g.timeLeft / 60) : 0;
  const s   = g.timeLeft ? String(g.timeLeft % 60).padStart(2, '0') : '00';
  const sel = selId === g.id;
  const clockRaw = g.clock || (m + ':' + s);
  const clockDisp = (clockRaw === '0:00') ? '' : clockRaw;

  const stHtml = isL
    ? `<span class="gc-status live">● LIVE</span>`
    : isF
    ? `<span class="gc-status fin">✓ FINAL</span>`
    : `<span class="gc-status pre">UPCOMING</span>`;

  const noteHtml = g.note ? `<span class="gc-note">▸ ${g.note}</span>` : '';

  const updHtml = isL
    ? `<span class="gc-upd" id="upd-${g.id}">--:--</span>`
    : isF
    ? `<span class="gc-upd">終了</span>`
    : `<span class="gc-upd">${g.startTime}〜</span>`;

  const midHtml = isL
    ? `<div class="gc-q">${g.q}${clockDisp && clockDisp !== '0:00' ? ' ' + clockDisp : ''}</div>`
    : isF
    ? `<div class="gc-end">FINAL</div>`
    : `<div class="gc-vs">VS</div><div class="gc-st">${g.startTime}</div>`;

  const ac = isL ? 'accent-live' : isF ? 'accent-fin' : 'accent-pre';

  // プレーオフ勝利数表示（currentPhaseがplayoffの場合）
  const poSeriesHome = g.poWinsHome !== undefined ? `<div style="font-family:'Barlow Condensed',sans-serif;font-size:.52rem;color:var(--or);letter-spacing:.04em;">${g.poWinsHome}勝</div>` : '';
  const poSeriesAway = g.poWinsAway !== undefined ? `<div style="font-family:'Barlow Condensed',sans-serif;font-size:.52rem;color:var(--or);letter-spacing:.04em;">${g.poWinsAway}勝</div>` : '';
  const poSeriesBadge = (g.poWinsHome !== undefined && currentPhase === 'playoff')
    ? `<div style="font-family:'Barlow Condensed',sans-serif;font-size:.6rem;font-weight:700;color:var(--go);letter-spacing:.04em;text-align:center;">${g.poWinsHome}-${g.poWinsAway} シリーズ</div>`
    : '';

  // チームロゴ（NBA公式CDN）
  const hLogoId = TEAM_CDN_IDS[g.home.abbr];
  const aLogoId = TEAM_CDN_IDS[g.away.abbr];
  const hLogo = hLogoId
    ? `<img src="${NBA_CDN_LOGO(hLogoId)}" style="width:36px;height:36px;object-fit:contain;margin-bottom:2px;" onerror="this.style.display='none';">`
    : `<span style="font-size:1.4rem;">${g.home.abbr}</span>`;
  const aLogo = aLogoId
    ? `<img src="${NBA_CDN_LOGO(aLogoId)}" style="width:36px;height:36px;object-fit:contain;margin-bottom:2px;" onerror="this.style.display='none';">`
    : `<span style="font-size:1.4rem;">${g.away.abbr}</span>`;

  return `<div class="gc${isL ? ' live' : ''}${sel ? ' selected' : ''}" id="gc-${g.id}" onclick="selectGame('${g.id}')">
    <div class="gc-accent ${ac}"></div>
    <div class="gc-head">${stHtml}${noteHtml}${updHtml}</div>
    ${poSeriesBadge ? `<div style="padding:.2rem .75rem;background:rgba(212,144,10,.08);border-bottom:1px solid rgba(212,144,10,.15);">${poSeriesBadge}</div>` : ''}
    <div class="gc-body">
      <div class="gc-team">
        <div class="gc-name-row"><span class="gc-abbr-inline">${g.home.abbr}</span><span class="gc-nickname-inline">${g.home.name||''}</span></div>
        <div class="gc-score${hl && !isP ? ' gc-win' : ''}" id="hs-${g.id}">${isP ? '—' : g.home.score}</div>
        ${poSeriesHome}
      </div>
      <div class="gc-mid">${midHtml}</div>
      <div class="gc-team r">
        <div class="gc-name-row"><span class="gc-abbr-inline">${g.away.abbr}</span><span class="gc-nickname-inline">${g.away.name||''}</span></div>
        <div class="gc-score${!hl && !isP ? ' gc-win' : ''}" id="as-${g.id}">${isP ? '—' : g.away.score}</div>
        ${poSeriesAway}
      </div>
    </div>
  </div>`;
}

// ============================================================
// 試合カードをタップ → 詳細パネルを開く
// ============================================================
async function selectGame(id) {
  // 同じカードをタップしたら閉じる
  if (selId === id) {
    selId = null;
    document.querySelectorAll('.gc').forEach(c => c.classList.remove('selected'));
    document.querySelectorAll('.detail-panel').forEach(p => p.classList.remove('open'));
    return;
  }
  selId = id;
  document.querySelectorAll('.gc').forEach(c => c.classList.toggle('selected', c.id === 'gc-' + id));
  document.querySelectorAll('.detail-panel').forEach(p => p.classList.remove('open'));

  const panel = document.getElementById('dp-' + id);
  if (!panel) return;
  const games = GAMES[String(dateOff)] || [];
  const g = games.find(x => x.id === id);
  if (!g) return;

  panel.innerHTML = buildDetail(g);
  panel.classList.add('open');

  // ヒーローエリアを更新
  const hw = document.getElementById('hero-wrap');
  if (hw) {
    hw.style.display = 'block';
    const isL = g.status === 'live';
    const isF = g.status === 'final';
    const hl = g.home.score > g.away.score;
    document.getElementById('hero-label').textContent = isL ? '🔴 LIVE' : isF ? '✓ 試合終了' : '📅 試合予定';
    document.getElementById('hero-status').innerHTML = isL
      ? '<div style="width:6px;height:6px;border-radius:50%;background:#fff;"></div>LIVE配信中'
      : isF ? '✓ FINAL' : '▸ まもなく開始';
    document.getElementById('hero-clock').textContent = isL ? (g.q + ' ' + g.clock) : '';
    document.getElementById('hero-home-city').textContent = g.home.city;
    document.getElementById('hero-home-abbr').textContent = g.home.abbr;
    document.getElementById('hero-home-score').textContent = g.home.score || '–';
    document.getElementById('hero-home-score').className = 'team-score' + (hl && isF ? ' win' : '');
    document.getElementById('hero-away-city').textContent = g.away.city;
    document.getElementById('hero-away-abbr').textContent = g.away.abbr;
    document.getElementById('hero-away-score').textContent = g.away.score || '–';
    document.getElementById('hero-away-score').className = 'team-score' + (!hl && isF ? ' win' : '');
    hw.scrollIntoView({behavior: 'smooth', block: 'start'});
  }

  // Lv5: 実況チャットを読み込む
  setTimeout(() => {
    if (document.getElementById(`lc-msgs-${id}`)) {
      loadLiveChat(id);
    }
    restoreNotifyBtns();
  }, 100);

  // ESPN APIで選手スタッツ取得
  const espnId = id.replace('espn-', '');
  if (id.startsWith('espn-')) {
    await loadESPNPlayerStats(g, espnId, panel);
  }

  // カードが見えるようにスクロール
  const card = document.getElementById('gc-' + id);
  if (card) {
    setTimeout(() => {
      document.getElementById('mainScroll').scrollTo({
        top: card.offsetTop - 52 - 40 - 8,
        behavior: 'smooth'
      });
    }, 30);
  }
}

// ============================================================
// 詳細パネルのHTML生成
// ============================================================
function buildDetail(g) {
  const isL = g.status === 'live';
  const isF = g.status === 'final';
  const isP = g.status === 'pre';
  const hl  = g.home.score > g.away.score;

  // クォータースコア表
  const quarterTableHTML = `<div class="ls-wrap">
      <div class="ls-row ls-head-row">
        <div class="ls-name-cell"></div>
        <div class="ls-q-cell">Q1</div>
        <div class="ls-q-cell">Q2</div>
        <div class="ls-q-cell">Q3</div>
        <div class="ls-q-cell">Q4</div>
        <div class="ls-q-cell ls-tot-cell">TOT</div>
      </div>
      <div class="ls-row">
        <div class="ls-name-cell">${g.home.abbr}</div>
        ${g.qh.map((v,i)=>`<div class="ls-q-cell${isL&&i===g.qh.length-1?' ls-cur':''}">${v}</div>`).join('')}
        ${'<div class="ls-q-cell">-</div>'.repeat(Math.max(0,4-g.qh.length))}
        <div class="ls-q-cell ls-tot-cell" style="color:${hl?'#C9082A':'#000'}">${isP?'—':g.home.score}</div>
      </div>
      <div class="ls-row">
        <div class="ls-name-cell">${g.away.abbr}</div>
        ${g.qa.map((v,i)=>`<div class="ls-q-cell${isL&&i===g.qa.length-1?' ls-cur':''}">${v}</div>`).join('')}
        ${'<div class="ls-q-cell">-</div>'.repeat(Math.max(0,4-g.qa.length))}
        <div class="ls-q-cell ls-tot-cell" style="color:${!hl&&!isP?'#C9082A':'#000'}">${isP?'—':g.away.score}</div>
      </div>
    </div>`;

  // チーム比較バー（ESPNデータ取得後にloadESPNPlayerStatsが置き換える）
  const cmpHTML = isP
    ? `<div class="no-stats cmp-area">試合開始後にチーム比較が表示されます</div>`
    : `<div class="no-stats cmp-area">📊 比較データ取得中...</div>`;

  // 選手カード（ESPN以外のデモデータ用フォールバック表示）
  const rPl = (pl) => pl.map(p => {
    const oc  = p.on && isL;
    const cls = `pcrd${p.hot ? ' hot' : oc ? ' on-c' : !p.on && isL ? ' bench' : ''}`;
    const nc  = `p-nm${p.hot ? ' hc' : oc ? ' oc' : ''}`;
    const dot  = oc ? `<span class="cdot"></span>` : '';
    const fire = p.hot ? `<span class="pf">🔥</span>` : '';
    const pc   = p.pm && p.pm.startsWith('+') ? 'sv pos' : p.pm && p.pm.startsWith('-') ? 'sv neg' : 'sv';
    return `<div class="${cls}">
      <div class="p-top">
        <span class="p-num">${p.num}</span>
        <div><div class="${nc}">${dot}${p.name.split(' ').slice(-1)[0]}</div><div class="p-pos">${p.pos}</div></div>
        ${fire}
      </div>
      <div class="p-sts">
        <div><div class="${p.pts >= 20 ? 'sv hi' : 'sv'}">${p.pts}</div><div class="sl">PTS</div></div>
        <div><div class="sv">${p.ast}</div><div class="sl">AST</div></div>
        <div><div class="sv">${p.reb}</div><div class="sl">REB</div></div>
        <div><div class="${pc}">${p.pm}</div><div class="sl">±</div></div>
      </div>
    </div>`;
  }).join('');

  const statsHTML = (g.hpl && g.hpl.length)
    ? `<div class="stats-area">
        <div class="area-label">選手スタッツ${isL ? `<span class="on-legend"><span class="on-dot"></span>出場中</span>` : ''}</div>
        <div class="p2col">
          <div><div class="col-hdr col-h">${g.home.abbr}</div>${rPl(g.hpl)}</div>
          <div><div class="col-hdr col-a">${g.away.abbr}</div>${rPl(g.apl)}</div>
        </div>
      </div>`
    : isP
    ? `<div class="no-stats">試合開始後にスタッツが表示されます</div>`
    : `<div class="no-stats">📊 スタッツ取得中...</div>`;

  return `
    <div style="display:flex;background:var(--card);border-bottom:1px solid var(--bd);">
      <div id="dtab-matchup-${g.id}" onclick="showDetailTab('${g.id}','matchup')" style="flex:1;text-align:center;padding:10px 8px;font-family:'Barlow Condensed',sans-serif;font-size:13px;font-weight:700;color:#C9082A;border-bottom:2px solid #C9082A;cursor:pointer;">対戦</div>
      <div id="dtab-box-${g.id}" onclick="showDetailTab('${g.id}','box')" style="flex:1;text-align:center;padding:10px 8px;font-family:'Barlow Condensed',sans-serif;font-size:13px;font-weight:700;color:var(--tx3);border-bottom:2px solid transparent;cursor:pointer;">ボックススコア</div>
    </div>
    <div id="dc-matchup-${g.id}">
      ${quarterTableHTML}
      ${cmpHTML}
    </div>
    <div id="dc-box-${g.id}" style="display:none;">
      ${statsHTML}
    </div>`;
}

// ============================================================
// 対戦／ボックススコア タブ切り替え
// ============================================================
function showDetailTab(id, tab) {
  const mEl  = document.getElementById('dc-matchup-' + id);
  const bEl  = document.getElementById('dc-box-' + id);
  const mTab = document.getElementById('dtab-matchup-' + id);
  const bTab = document.getElementById('dtab-box-' + id);
  if (mEl) mEl.style.display = tab === 'matchup' ? 'block' : 'none';
  if (bEl) bEl.style.display = tab === 'box' ? 'block' : 'none';
  if (mTab) { mTab.style.color = tab === 'matchup' ? '#C9082A' : 'var(--tx3)'; mTab.style.borderBottomColor = tab === 'matchup' ? '#C9082A' : 'transparent'; }
  if (bTab) { bTab.style.color = tab === 'box' ? '#C9082A' : 'var(--tx3)'; bTab.style.borderBottomColor = tab === 'box' ? '#C9082A' : 'transparent'; }
}

// ============================================================
// チーム比較バー（FG%・3P%・FT%・リバウンドなど）
// ============================================================
function statVal(arr, name) {
  const s = (arr || []).find(x => x.name === name);
  return s ? s.displayValue : null;
}
function pctFromMadeAtt(str) {
  if (!str || str.indexOf('-') === -1) return null;
  const parts = str.split('-').map(Number);
  const made = parts[0], att = parts[1];
  if (!att) return 0;
  return (made / att * 100);
}
function buildComparisonPanel(hArr, aArr, hAbbr, aAbbr) {
  const metrics = [
    { key:'fieldGoalsMade-fieldGoalsAttempted', label:'フィールドゴール', type:'pct' },
    { key:'threePointFieldGoalsMade-threePointFieldGoalsAttempted', label:'3ポイント', type:'pct' },
    { key:'freeThrowsMade-freeThrowsAttempted', label:'フリースロー', type:'pct' },
    { key:'totalRebounds', label:'総リバウンド数', type:'num' },
    { key:'offensiveRebounds', label:'オフェンスリバウンド', type:'num' },
  ];
  const rows = metrics.map(m => {
    let hNum, aNum, hDisp, aDisp;
    if (m.type === 'pct') {
      hNum = pctFromMadeAtt(statVal(hArr, m.key));
      aNum = pctFromMadeAtt(statVal(aArr, m.key));
      if (hNum === null || aNum === null) return '';
      hDisp = hNum.toFixed(1) + '%';
      aDisp = aNum.toFixed(1) + '%';
    } else {
      hNum = parseFloat(statVal(hArr, m.key)) || 0;
      aNum = parseFloat(statVal(aArr, m.key)) || 0;
      hDisp = String(hNum);
      aDisp = String(aNum);
    }
    const total = hNum + aNum;
    const lp = total > 0 ? (hNum / total * 100) : 50;
    return `
      <div style="padding:.55rem .9rem .1rem;display:flex;align-items:baseline;justify-content:space-between;gap:.5rem;">
        <span style="font-size:.8rem;font-weight:800;color:var(--tx);min-width:44px;">${hDisp}</span>
        <span style="font-size:.66rem;color:var(--tx3);font-weight:700;flex:1;text-align:center;">${m.label}</span>
        <span style="font-size:.8rem;font-weight:800;color:var(--tx);min-width:44px;text-align:right;">${aDisp}</span>
      </div>
      <div style="padding:0 .9rem .6rem;">
        <div style="display:flex;height:5px;border-radius:3px;overflow:hidden;background:var(--bg3);">
          <div style="width:${lp}%;background:#C9082A;"></div>
          <div style="width:${100 - lp}%;background:#1d4ed8;"></div>
        </div>
      </div>`;
  }).join('');
  if (!rows) return `<div class="no-stats cmp-area">比較データを取得できませんでした</div>`;
  return `<div class="cmp-area" style="margin:0 14px 14px;background:var(--card);border:1px solid var(--bd);border-radius:10px;overflow:hidden;">
    <div style="padding:.6rem .9rem;font-family:'Barlow Condensed',sans-serif;font-size:12px;font-weight:700;color:var(--tx);text-align:center;border-bottom:1px solid var(--bd);">⚖️ チーム比較</div>
    ${rows}
  </div>`;
}

// ============================================================
// ボックススコア表（チーム切り替えタブ付き）
// ============================================================
function photoHTML(p) {
  return p.photoUrl
    ? `<img src="${p.photoUrl}" style="width:30px;height:30px;border-radius:50%;object-fit:cover;flex-shrink:0;background:var(--bg3);" onerror="this.style.display='none'">`
    : `<div style="width:30px;height:30px;border-radius:50%;background:var(--bg3);flex-shrink:0;"></div>`;
}
function playerRowHTML(p) {
  if (p.didNotPlay || p._sec === 0) {
    return `<div style="display:flex;align-items:center;gap:.5rem;padding:.4rem .6rem;border-bottom:1px solid var(--bd);opacity:.4;">
      ${photoHTML(p)}
      <div style="flex:1;min-width:0;font-size:.74rem;font-weight:700;color:var(--tx);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${p.lastName}</div>
      <div style="font-size:.62rem;color:var(--tx3);">DNP</div>
    </div>`;
  }
  return `<div style="display:flex;align-items:center;gap:.5rem;padding:.4rem .6rem;border-bottom:1px solid var(--bd);">
    ${photoHTML(p)}
    <div style="flex:1;min-width:0;">
      <div style="font-size:.5rem;color:var(--tx3);font-weight:700;">${p.jerseyNum ? '#' + p.jerseyNum + ' ' : ''}${p.pos}</div>
      <div style="font-size:.76rem;font-weight:700;color:var(--tx);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${p.lastName}</div>
    </div>
    <div style="width:34px;text-align:center;font-size:.66rem;color:var(--tx2);">${p.min}</div>
    <div style="width:30px;text-align:center;font-size:.82rem;font-weight:800;color:${p.pts >= 20 ? '#C9082A' : 'var(--tx)'};">${p.pts}</div>
    <div style="width:30px;text-align:center;font-size:.78rem;font-weight:700;color:var(--tx);">${p.reb}</div>
    <div style="width:30px;text-align:center;font-size:.78rem;font-weight:700;color:var(--tx);">${p.ast}</div>
  </div>`;
}
function buildTeamTable(players) {
  const starters = players.filter(p => !p.didNotPlay && p._sec > 0 && p.starter);
  const bench    = players.filter(p => !p.didNotPlay && p._sec > 0 && !p.starter);
  const dnp      = players.filter(p => p.didNotPlay || p._sec === 0);
  const secHdr = (label) => `<div style="padding:.3rem .6rem;font-size:.6rem;font-weight:700;color:var(--tx3);background:var(--bg3);border-bottom:1px solid var(--bd);">${label}</div>`;
  const headHTML = `<div style="display:flex;align-items:center;gap:.5rem;padding:.35rem .6rem;border-bottom:1px solid var(--bd);">
    <div style="width:30px;"></div>
    <div style="flex:1;font-size:.58rem;font-weight:700;color:var(--tx3);">PLAYER</div>
    <div style="width:34px;text-align:center;font-size:.58rem;font-weight:700;color:var(--tx3);">MIN</div>
    <div style="width:30px;text-align:center;font-size:.58rem;font-weight:700;color:var(--tx3);">PTS</div>
    <div style="width:30px;text-align:center;font-size:.58rem;font-weight:700;color:var(--tx3);">REB</div>
    <div style="width:30px;text-align:center;font-size:.58rem;font-weight:700;color:var(--tx3);">AST</div>
  </div>`;
  return `<div style="border:1px solid var(--bd);border-radius:8px;overflow:hidden;background:var(--card);">
    ${headHTML}
    ${starters.length ? secHdr('STARTERS') + starters.map(playerRowHTML).join('') : ''}
    ${bench.length ? secHdr('BENCH') + bench.map(playerRowHTML).join('') : ''}
    ${dnp.length ? secHdr('DNP') + dnp.map(playerRowHTML).join('') : ''}
  </div>`;
}
function buildBoxArea(g, homePlayers, awayPlayers) {
  return `<div class="stats-area" style="margin:0 14px 14px;">
    <div style="display:flex;background:var(--bg3);border-radius:100px;padding:3px;margin-bottom:.6rem;">
      <div id="bxtab-home-${g.id}" onclick="showBoxTeam('${g.id}','home')" style="flex:1;text-align:center;padding:.45rem 0;border-radius:100px;font-size:.78rem;font-weight:700;background:var(--card);box-shadow:0 1px 3px rgba(0,0,0,.12);color:var(--tx);">${g.home.abbr}</div>
      <div id="bxtab-away-${g.id}" onclick="showBoxTeam('${g.id}','away')" style="flex:1;text-align:center;padding:.45rem 0;border-radius:100px;font-size:.78rem;font-weight:700;color:var(--tx3);">${g.away.abbr}</div>
    </div>
    <div id="bx-home-${g.id}">${buildTeamTable(homePlayers)}</div>
    <div id="bx-away-${g.id}" style="display:none;">${buildTeamTable(awayPlayers)}</div>
  </div>`;
}
function showBoxTeam(id, side) {
  const hWrap = document.getElementById('bx-home-' + id);
  const aWrap = document.getElementById('bx-away-' + id);
  const hTab  = document.getElementById('bxtab-home-' + id);
  const aTab  = document.getElementById('bxtab-away-' + id);
  if (hWrap) hWrap.style.display = side === 'home' ? 'block' : 'none';
  if (aWrap) aWrap.style.display = side === 'away' ? 'block' : 'none';
  if (hTab) { hTab.style.background = side === 'home' ? 'var(--card)' : 'transparent'; hTab.style.boxShadow = side === 'home' ? '0 1px 3px rgba(0,0,0,.12)' : 'none'; hTab.style.color = side === 'home' ? 'var(--tx)' : 'var(--tx3)'; }
  if (aTab) { aTab.style.background = side === 'away' ? 'var(--card)' : 'transparent'; aTab.style.boxShadow = side === 'away' ? '0 1px 3px rgba(0,0,0,.12)' : 'none'; aTab.style.color = side === 'away' ? 'var(--tx)' : 'var(--tx3)'; }
}

// ============================================================
// ESPN APIから選手スタッツを取得
// ============================================================
async function loadESPNPlayerStats(g, espnId, panel) {
  try {
    const res = await fetchWithTimeout( // utils.js
      `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary?event=${espnId}`
    );
    if (!res.ok) throw new Error('ESPN ' + res.status);
    const data = await res.json();

    const bp       = data.boxscore?.players || [];
    const homeData = bp.find(p => p.homeAway === 'home') || bp[1] || bp[0];
    const awayData = bp.find(p => p.homeAway === 'away') || bp[0];

    const parsePlayers = (teamData) => {
      if (!teamData?.statistics) return [];
      const seen = new Set();
      const result = [];
      for (const sg of teamData.statistics) {
        if (!sg?.athletes) continue;
        const names  = sg.names || [];
        const idx    = (label) => names.findIndex(n => (n||'').toUpperCase() === label.toUpperCase());
        const minIdx = idx('MIN'), ptsIdx = idx('PTS'), rebIdx = idx('REB'), astIdx = idx('AST');
        const stlIdx = idx('STL'), blkIdx = idx('BLK'), toIdx  = idx('TO'),  pfIdx  = idx('PF');
        const fgIdx  = idx('FG'),  fg3Idx = idx('3PT'), ftIdx  = idx('FT'),  pmIdx  = idx('+/-');

        for (const a of sg.athletes) {
          const ath = a.athlete || {};
          if (seen.has(ath.id)) continue;
          seen.add(ath.id);
          const st  = a.stats || [];
          const gN  = (i) => parseInt(st[i] || 0) || 0;
          const gS  = (i) => st[i] !== undefined ? String(st[i]) : '-';
          const pmN = parseInt(st[pmIdx] || 0) || 0;
          const sec = (() => {
            const v = st[minIdx];
            if (!v && v !== 0) return 0;
            if (typeof v === 'number') return v * 60;
            const p = String(v).split(':');
            return parseInt(p[0]||0)*60 + parseInt(p[1]||0);
          })();
          result.push({
            name: toKatakana(ath.displayName || '?'),
            lastName: (ath.shortName || ath.displayName || '?').split(' ').slice(-1)[0],
            jerseyNum: ath.jersey || '',
            pos: (ath.position?.abbreviation || '').toUpperCase(),
            min: st[minIdx] !== undefined ? String(st[minIdx]) : '-',
            pts: gN(ptsIdx), reb: gN(rebIdx), ast: gN(astIdx),
            stl: gN(stlIdx), blk: gN(blkIdx), to: gN(toIdx), pf: gN(pfIdx),
            fg: gS(fgIdx), fg3: gS(fg3Idx), ft: gS(ftIdx),
            pm: (pmN > 0 ? '+' : '') + pmN,
            photoUrl: ath.id ? ESPN_HEADSHOT(ath.id) : '', // config.js
            starter: a.starter || false,
            didNotPlay: a.didNotPlay || false,
            _sec: sec,
          });
        }
      }
      const played = result.filter(p => !p.didNotPlay && p._sec > 0).sort((a,b) => b._sec - a._sec);
      const dnp    = result.filter(p => p.didNotPlay || p._sec === 0);
      return [...played, ...dnp];
    };

    const homePlayers = parsePlayers(homeData);
    const awayPlayers = parsePlayers(awayData);

    // ボックススコア（チーム切り替えタブ付きの新デザイン）
    const newHTML = buildBoxArea(g, homePlayers, awayPlayers);
    const statsArea = panel.querySelector('.stats-area, .no-stats');
    if (statsArea) statsArea.outerHTML = newHTML;
    console.log('✅ 選手スタッツ取得成功');

    // チーム比較バー（FG%・3P%・FT%・リバウンド）
    const teams = data.boxscore?.teams || [];
    const hTeam = teams.find(t => t.homeAway === 'home');
    const aTeam = teams.find(t => t.homeAway === 'away');
    const cmpArea = panel.querySelector('.cmp-area');
    if (cmpArea && hTeam?.statistics && aTeam?.statistics) {
      cmpArea.outerHTML = buildComparisonPanel(hTeam.statistics, aTeam.statistics, g.home.abbr, g.away.abbr);
    }

  } catch(e) {
    console.warn('スタッツ取得失敗:', e.message);
  }
}

// ============================================================
// ESPN APIでスコアボードを取得
// ============================================================
async function loadESPNScoreboard() {
  const wrap = document.getElementById('gameWrap');
  if (wrap) wrap.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--tx3);font-family:\'Barlow Condensed\',sans-serif;">🏀 試合情報を取得中...</div>';

  try {
    // 今日・前日・翌日の3日分を試す
    const jp      = getJPDate();
    const dates   = [0, -1, 1].map(offset => {
      const d = new Date(jp);
      d.setDate(d.getDate() + offset - 1); // UTC基準のため-1
      return toDateStr(d);
    });

    let events = [];
    let usedDate = dates[0];

    for (const dateStr of dates) {
      const res = await fetch(`${ESPN_SCOREBOARD}?dates=${dateStr}&limit=20`);
      if (!res.ok) continue;
      const data = await res.json();
      events = data.events || [];
      if (events.length) { usedDate = dateStr; break; }
    }

    // それでも取得できない場合はプレーオフエンドポイントを試す
    if (false && !events.length) {
      const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?seasontype=3&limit=20`);
      if (res.ok) {
        const data = await res.json();
        events = data.events || [];
      }
    }

    if (!events.length) {
      GAMES['0'] = [];
      if (wrap) wrap.innerHTML = '<div style="text-align:center;color:var(--tx3);padding:1.4rem 0 2rem;"><div style="font-size:1.8rem;line-height:1;margin-bottom:.6rem;opacity:.5;">🏀</div><div style="font-size:.95rem;font-weight:700;color:var(--tx2);">本日の試合はありません</div><div style="font-size:.75rem;margin-top:.4rem;">次の試合をお待ちください</div></div>';
      return;
    }

    GAMES['0'] = parseESPNGames(events);

    const dateEl = document.getElementById('dbDate');
    if (dateEl) dateEl.innerHTML = toJPDateLabel(jp);
    const subEl = document.getElementById('dbSub');
    if (subEl) subEl.innerHTML = 'TODAY<span class="db-today">今日</span>';

    const isFirst = !document.getElementById('gameWrap').querySelector('.gc');
    if (isFirst) {
      renderGames();
      const first = GAMES['0'].find(g => g.status === 'live') || GAMES['0'][0];
      if (first) setTimeout(() => selectGame(first.id), 200);
    } else {
      GAMES['0'].forEach(g => {
        const hs = document.getElementById('hs-' + g.id);
        const as = document.getElementById('as-' + g.id);
        if (hs) hs.textContent = g.home.score;
        if (as) as.textContent = g.away.score;
      });
    }
    console.log('✅ ESPN試合取得成功:', events.length, '試合', usedDate);

  } catch(e) {
    console.warn('ESPN失敗:', e.message);
    GAMES['0'] = [];
    if (wrap) wrap.innerHTML = '<div style="text-align:center;color:var(--tx3);padding:1.4rem 0 2rem;"><div style="font-size:.85rem;">試合情報の取得に失敗しました。しばらくしてから再度お試しください。</div></div>';
  }
}

// ============================================================
// 指定日の試合を取得
// ============================================================
async function loadGamesForDate(dateStr) {
  const wrap = document.getElementById('gameWrap');
  if (wrap) wrap.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--tx3);">🏀 試合情報を取得中...</div>';

  try {
    const res = await fetch(`${ESPN_SCOREBOARD}?dates=${dateStr}`);
    if (!res.ok) throw new Error('ESPN ' + res.status);
    const data   = await res.json();
    const events = data.events || [];

    if (!events.length) {
      if (wrap) wrap.innerHTML = '<div style="text-align:center;color:var(--tx3);padding:1.4rem 0 2rem;"><div style="font-size:1.8rem;line-height:1;margin-bottom:.6rem;opacity:.5;">🏀</div><div style="font-size:.95rem;font-weight:700;color:var(--tx2);">この日の試合はありません</div></div>';
      return;
    }

    GAMES[String(dateOff)] = parseESPNGames(events);
    renderGames();
    const first = GAMES[String(dateOff)].find(g => g.status === 'live') || GAMES[String(dateOff)][0];
    if (first) setTimeout(() => selectGame(first.id), 200);

  } catch(e) {
    console.warn('ESPN日付別失敗:', e.message);
    renderGames();
  }
}

// ============================================================
// ESPN APIレスポンスを内部フォーマットに変換
// ============================================================
function parseESPNGames(events) {
  return events.map(ev => {
    const comp  = ev.competitions[0];
    const home  = comp.competitors.find(c => c.homeAway === 'home') || comp.competitors[0];
    const away  = comp.competitors.find(c => c.homeAway === 'away') || comp.competitors[1];
    const state = ev.status.type.state;
    const period = ev.status.period || 0;
    const clock  = ev.status.displayClock || '';
    let status   = 'pre';
    if (state === 'in')   status = 'live';
    if (state === 'post') status = 'final';
    let startTime = '--:--';
    try {
      // 日本時間で開始時刻を表示
      startTime = new Date(ev.date).toLocaleTimeString('ja-JP', {
        hour: '2-digit', minute: '2-digit', timeZone: 'America/New_York'
      });
    } catch(e) {}
    const qh   = (home.linescores || []).map(q => parseInt(q.value) || 0);
    const qa   = (away.linescores || []).map(q => parseInt(q.value) || 0);
    const clockLabel = (clock === '0:00' || !clock) ? '' : 'Q' + period + ' ' + clock;
    const note = status === 'live'  ? clockLabel
               : status === 'final' ? 'FINAL'
               : '🇯🇵 日本時間 ' + startTime + '〜';
    return {
      id: 'espn-' + ev.id, status, q: period > 0 ? 'Q' + period : '',
      timeLeft: 0, clock,
      home: { abbr:(home.team.abbreviation||'HOME').toUpperCase(), city:(home.team.location||'').toUpperCase(), score:parseInt(home.score)||0, name:TEAM_JP[(home.team.abbreviation||'').toUpperCase()]||'' },
      away: { abbr:(away.team.abbreviation||'AWAY').toUpperCase(), city:(away.team.location||'').toUpperCase(), score:parseInt(away.score)||0, name:TEAM_JP[(away.team.abbreviation||'').toUpperCase()]||'' },
      // プレーオフシリーズ勝利数
      poWinsHome: home.wins !== undefined ? home.wins : undefined,
      poWinsAway: away.wins !== undefined ? away.wins : undefined,
      qh, qa, note, plays:[], hpl:[], apl:[], startTime
    };
  });
}

// ============================================================
// ライブ試合のタイマー（1秒ごとに更新）
// ============================================================
setInterval(() => {
  const gs  = GAMES['0'] || [];
  const now = new Date();
  const upd = now.getHours() + ':' + String(now.getMinutes()).padStart(2, '0');

  gs.forEach(g => {
    if (g.status !== 'live') return;
    g.timeLeft = Math.max(0, g.timeLeft - 1);
    const m = Math.floor(g.timeLeft / 60);
    const s = String(g.timeLeft % 60).padStart(2, '0');
    const te  = document.getElementById('gt-' + g.id);
    const ue  = document.getElementById('upd-' + g.id);
    const te2 = document.getElementById('sd-t-' + g.id);
    if (te)  te.textContent  = m + ':' + s;
    if (ue)  ue.textContent  = upd;
    if (te2) te2.textContent = m + ':' + s;
  });
}, 1000);

// ============================================================
// 起動処理
// ============================================================
loadESPNScoreboard();

// 30秒ごとにスコアを自動更新
setInterval(() => {
  if (document.getElementById('pg-schedule').classList.contains('show')) {
    loadESPNScoreboard();
  }
}, POLL_INTERVAL_MS); // config.js で定義
// ============================================================
