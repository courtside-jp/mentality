// chat.js — チームチャット・実況チャット・通知
// 読み込み順: data.js → utils.js → app.js → 各機能JS

// chat.js — チームチャット
//
// 【このファイルだけで完結する機能】
//   - 30チームのチャットルーム
//   - Firebase REST APIでリアルタイム同期
//   - ニックネーム設定（localStorage保存）
//   - リアクション絵文字
//   - オンライン人数表示
//
// 【他のファイルへの影響】
//   なし。このファイルだけ修正しても他は壊れない
//
// 【修正したいときの場所】
//   チーム追加・変更  → TEAMS 配列
//   広告変更         → TEAM_ADS オブジェクト
//   メッセージ送信   → cfpSend()
//   Firebase設定     → config.js の FB_URL
// ============================================================

// ============================================================
// チームデータ（全30チーム）
// ============================================================
const TEAMS = [
  // ===== イースト =====
  { id:'bos', name:'ボストン・セルティックス',       abbr:'BOS', conf:'east', logo:'🍀', w:52, l:18, jp:false,
    msgs:[]},
  { id:'bkn', name:'ブルックリン・ネッツ',           abbr:'BKN', conf:'east', logo:'🕸️', w:28, l:42, jp:false,
    msgs:[]},
  { id:'nyk', name:'ニューヨーク・ニックス',         abbr:'NYK', conf:'east', logo:'🗽', w:44, l:26, jp:false,
    msgs:[]},
  { id:'phi', name:'フィラデルフィア・76ers',        abbr:'PHI', conf:'east', logo:'🔔', w:38, l:32, jp:false,
    msgs:[]},
  { id:'tor', name:'トロント・ラプターズ',           abbr:'TOR', conf:'east', logo:'🦖', w:26, l:44, jp:false,
    msgs:[]},
  { id:'chi', name:'シカゴ・ブルズ',                abbr:'CHI', conf:'east', logo:'🐂', w:36, l:34, jp:false,
    msgs:[]},
  { id:'cle', name:'クリーブランド・キャバリアーズ', abbr:'CLE', conf:'east', logo:'⚔️', w:52, l:18, jp:false,
    msgs:[]},
  { id:'det', name:'デトロイト・ピストンズ',         abbr:'DET', conf:'east', logo:'🏎️', w:14, l:56, jp:false,
    msgs:[]},
  { id:'ind', name:'インディアナ・ペイサーズ',       abbr:'IND', conf:'east', logo:'⚡', w:40, l:30, jp:false,
    msgs:[]},
  { id:'mil', name:'ミルウォーキー・バックス',       abbr:'MIL', conf:'east', logo:'🦌', w:46, l:24, jp:false,
    msgs:[]},
  { id:'atl', name:'アトランタ・ホークス',           abbr:'ATL', conf:'east', logo:'🦅', w:32, l:38, jp:false,
    msgs:[]},
  { id:'cha', name:'シャーロット・ホーネッツ',       abbr:'CHA', conf:'east', logo:'🐝', w:18, l:52, jp:false,
    msgs:[]},
  { id:'mia', name:'マイアミ・ヒート',              abbr:'MIA', conf:'east', logo:'🔥', w:38, l:32, jp:false,
    msgs:[]},
  { id:'orl', name:'オーランド・マジック',           abbr:'ORL', conf:'east', logo:'✨', w:36, l:34, jp:false,
    msgs:[]},
  { id:'was', name:'ワシントン・ウィザーズ',         abbr:'WAS', conf:'east', logo:'🧙', w:12, l:58, jp:false,
    msgs:[]},

  // ===== ウェスト =====
  { id:'lal', name:'ロサンゼルス・レイカーズ',       abbr:'LAL', conf:'west', logo:'👑', w:44, l:26, jp:true,
    msgs:[]},
  { id:'lac', name:'ロサンゼルス・クリッパーズ',     abbr:'LAC', conf:'west', logo:'⚓', w:36, l:34, jp:false,
    msgs:[]},
  { id:'gsw', name:'ゴールデンステート・ウォリアーズ',abbr:'GSW', conf:'west', logo:'🎯', w:40, l:30, jp:false,
    msgs:[]},
  { id:'phx', name:'フェニックス・サンズ',           abbr:'PHX', conf:'west', logo:'☀️', w:36, l:34, jp:false,
    msgs:[]},
  { id:'sac', name:'サクラメント・キングス',         abbr:'SAC', conf:'west', logo:'👑', w:38, l:32, jp:false,
    msgs:[]},
  { id:'den', name:'デンバー・ナゲッツ',             abbr:'DEN', conf:'west', logo:'⛰️', w:50, l:20, jp:false,
    msgs:[]},
  { id:'min', name:'ミネソタ・ティンバーウルブズ',   abbr:'MIN', conf:'west', logo:'🐺', w:46, l:24, jp:false,
    msgs:[]},
  { id:'okc', name:'オクラホマシティ・サンダー',     abbr:'OKC', conf:'west', logo:'⚡', w:54, l:16, jp:false,
    msgs:[]},
  { id:'por', name:'ポートランド・トレイルブレイザーズ',abbr:'POR', conf:'west', logo:'🌹', w:22, l:48, jp:false,
    msgs:[]},
  { id:'uta', name:'ユタ・ジャズ',                  abbr:'UTA', conf:'west', logo:'🎵', w:20, l:50, jp:false,
    msgs:[]},
  { id:'dal', name:'ダラス・マーベリックス',         abbr:'DAL', conf:'west', logo:'🤠', w:44, l:26, jp:false,
    msgs:[]},
  { id:'hou', name:'ヒューストン・ロケッツ',         abbr:'HOU', conf:'west', logo:'🚀', w:40, l:30, jp:false,
    msgs:[]},
  { id:'mem', name:'メンフィス・グリズリーズ',       abbr:'MEM', conf:'west', logo:'🐻', w:32, l:38, jp:false,
    msgs:[]},
  { id:'nop', name:'ニューオーリンズ・ペリカンズ',   abbr:'NOP', conf:'west', logo:'🦅', w:34, l:36, jp:false,
    msgs:[]},
  { id:'sas', name:'サンアントニオ・スパーズ',       abbr:'SAS', conf:'west', logo:'⚜️', w:18, l:52, jp:false,
    msgs:[]},
];

// ============================================================
// ※ TEAM_ADS は config.js で定義済み

// ============================================================
// 状態管理
// ============================================================
let teamConf  = 'east';
let cfpTeamId = null;
let cfpPollId = null;
let userNick  = lsGet('mentality_nick', '');  // utils.js
let userEmoji = lsGet('mentality_emoji', '🏀'); // utils.js

// ============================================================
// チーム一覧を描画
// ============================================================
function filterConf(btn, conf) {
  document.querySelectorAll('#pg-teams .conf-btn').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  teamConf = conf;
  renderTeams();
}

async function renderTeams() {
  const filtered = TEAMS.filter(t => teamConf === 'all' || t.conf === teamConf);
  // 全体オンライン数からチームごとの人数を比例配分
  const total = _globalOnlineCount || 12;
  document.getElementById('teamList').innerHTML = filtered.map((t, i) => {
    const cdnId   = TEAM_CDN_IDS[t.abbr] || '';
    const logoHtml = cdnId
      ? `<img src="${NBA_CDN_LOGO(cdnId)}" style="width:34px;height:34px;object-fit:contain;" onerror="this.outerHTML='<span style=\\'font-size:1.3rem;\\'>${t.logo}</span>'">`
      : `<span style="font-size:1.3rem;">${t.logo}</span>`;
    const lastMsg = t.msgs[t.msgs.length - 1];
    const preview = lastMsg ? lastMsg.msg.slice(0, 28) + '…' : 'まだ投稿がありません';
    // チームごとのオンライン数 = 全体の5〜15%をランダムに分配（合計が全体を超えない）
    const teamOnline = Math.max(1, Math.floor(total * (0.05 + Math.random() * 0.1)));
    const unread  = i < 3 ? Math.floor(Math.random() * 8) + 1 : 0;
    return `<div class="team-card${t.jp ? ' jp' : ''}" onclick="openChatFull('${t.id}')">
      <div class="tc-logo">${logoHtml}</div>
      <div class="tc-info">
        <div class="tc-name">${t.abbr}${t.jp ? ' 🇯🇵' : ''}</div>
        <div class="tc-sub"><span class="tc-on">${teamOnline}人オンライン</span></div>
        <div class="tc-note">${preview}</div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:.3rem;flex-shrink:0;">
        <div class="tc-wl">${t.w}-${t.l}</div>
        ${unread ? `<div class="tc-unreads">${unread}</div>` : ''}
      </div>
    </div>`;
  }).join('');

  // チャット広告追加
  try {
    const ar = await fetch(FB_URL + '/adslots.json');
    const ad = await ar.json() || {};
    const chatAds = ['chat_1','chat_2'].map(k => ad[k]).filter(a => a && a.url);
    const el = document.getElementById('teamList');
    const adHTML2 = (ad) => `<a href="${ad.url}" target="_blank" style="display:block;text-decoration:none;margin:.5rem 0;background:var(--card);border:1px solid var(--bd);border-radius:10px;padding:.7rem .8rem;"><div style="display:flex;align-items:center;gap:.5rem;">${ad.img ? `<img src="${ad.img}" style="width:48px;height:48px;border-radius:8px;object-fit:cover;flex-shrink:0;" onerror="this.style.display='none'">` : ''}<div style="flex:1;min-width:0;"><span style="font-size:.5rem;background:rgba(255,90,0,.15);color:var(--or);padding:.1rem .4rem;border-radius:10px;font-weight:700;">PR</span><div style="font-size:.72rem;font-weight:700;color:var(--tx);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${ad.title}</div></div><div style="color:var(--tx3);font-size:.8rem;">›</div></div></a>`;
    const items = el.querySelectorAll('.tc');
    const mid = Math.floor(items.length / 2);
    if (chatAds[0] && items[mid]) items[mid].insertAdjacentHTML('afterend', adHTML2(chatAds[0]));
    if (chatAds[1]) el.innerHTML += adHTML2(chatAds[1]);
  } catch(e) {}
}

// ============================================================
// チャットルームを開く
// ============================================================
function openChatFull(teamId) {
  if (!userNick) {
    showNickModal(teamId);
    return;
  }
  _launchChat(teamId);
}

function _launchChat(teamId) {
  cfpTeamId = teamId;
  const t   = TEAMS.find(x => x.id === teamId);
  if (!t) return;

  // チャット画面を表示
  const cfp = document.getElementById('chatFullPage');
  cfp.style.display = 'flex';
  document.getElementById('mainScroll').style.overflow = 'hidden';

  // ヘッダー設定
  const cdnId    = TEAM_CDN_IDS[t.abbr] || '';
  const logoImg  = document.getElementById('cfpLogo');
  const logoEmoji = document.getElementById('cfpLogoEmoji');
  if (cdnId) {
    logoImg.src           = NBA_CDN_LOGO(cdnId);
    logoImg.style.display = 'block';
    logoEmoji.textContent = '';
  } else {
    logoImg.style.display = 'none';
    logoEmoji.textContent = t.logo;
  }
  document.getElementById('cfpName').textContent    = t.name;
  document.getElementById('cfpOnline').textContent  = t.online + '人オンライン';
  document.getElementById('cfpField').placeholder   = t.abbr + 'について投稿...';

  // 広告設定
  const ad = TEAM_ADS[teamId] || TEAM_ADS.default;
  document.getElementById('cfpAdImg').textContent   = ad.img;
  document.getElementById('cfpAdTag').textContent   = ad.tag;
  document.getElementById('cfpAdTitle').textContent = ad.title;
  document.getElementById('cfpAdOld').textContent   = ad.old;
  document.getElementById('cfpAdPrice').textContent = ad.price;
  document.getElementById('cfpAdBtn').onclick        = () => window.open(ad.url, '_blank');
  document.getElementById('cfpAd').style.display    = 'block';

  // メッセージ描画
  renderCfpMsgs(t.msgs);

  // Firebaseポーリング開始
  startChatPoll(teamId);
}

// ============================================================
// チャットメッセージを描画
// ============================================================
function renderCfpMsgs(msgs) {
  const container = document.getElementById('cfpMsgs');
  const sysHtml   = `<div class="sys-msg">🔒 このチャットは公開されています。礼儀正しく投稿しましょう。</div>`;
  container.innerHTML = sysHtml + msgs.map((m, i) => {
    const adInsert = (i === 3 && msgs.length > 4) ? getChatAdHTML() : '';
    const isMine   = m.n === userNick;
    const colors   = ['cao','cat','cap','cag','can'];
    const avColor  = m.adm ? 'cam' : colors[Math.abs(hashStr(m.n)) % 5];
    return adInsert + `<div class="cm${isMine ? ' me' : ''}">
      <div class="cav ${avColor}">${m.n[0].toUpperCase()}</div>
      <div class="cbody">
        <div class="cname">${escapeHtml(m.n)}${m.adm ? '<span class="cadm">管理人</span>' : ''}</div>
        <div class="cbbl">${escapeHtml(m.msg)}</div>
        <div class="ctime">${m.t}</div>
      </div>
    </div>`;
  }).join('');
  setTimeout(() => { container.scrollTop = container.scrollHeight; }, 50);
}

// チャット内インライン広告HTML
function getChatAdHTML() {
  const ad = TEAM_ADS[cfpTeamId] || TEAM_ADS.default;
  return `<div style="background:var(--card);border:1px solid var(--bd);border-radius:8px;overflow:hidden;margin:.3rem 0;position:relative;cursor:pointer;" onclick="window.open('${ad.url}','_blank')">
    <span style="position:absolute;top:4px;right:6px;font-size:.48rem;color:var(--tx3);opacity:.6;text-transform:uppercase;letter-spacing:.06em;">PR</span>
    <div style="display:flex;align-items:center;gap:.75rem;padding:.6rem .8rem;">
      <div style="width:44px;height:44px;border-radius:8px;background:linear-gradient(135deg,#1a1a2e,#0d0d18);display:flex;align-items:center;justify-content:center;font-size:1.4rem;flex-shrink:0;">${ad.img}</div>
      <div style="flex:1;min-width:0;">
        <div style="font-size:.55rem;font-weight:700;color:var(--or);letter-spacing:.08em;text-transform:uppercase;margin-bottom:.1rem;">${ad.tag}</div>
        <div style="font-size:.72rem;font-weight:600;color:var(--tx);margin-bottom:.15rem;">${ad.title}</div>
        <div style="font-size:.65rem;color:var(--tx2);"><s style="color:var(--tx3);font-size:.6rem;">${ad.old}</s> ${ad.price}</div>
      </div>
      <button style="flex-shrink:0;padding:.32rem .65rem;border-radius:6px;background:var(--or);color:#fff;font-family:'Barlow Condensed',sans-serif;font-size:.65rem;font-weight:700;border:none;cursor:pointer;">Amazon</button>
    </div>
  </div>`;
}

// ============================================================
// メッセージ送信
// ============================================================
function cfpSend() {
  const inp = document.getElementById('cfpField');
  const txt = inp.value.trim();
  if (!txt) return;
  inp.value = '';

  const t = TEAMS.find(x => x.id === cfpTeamId);
  if (!t) return;

  const now    = ntime(); // utils.js
  const newMsg = { n: userNick, msg: txt, t: now };
  t.msgs.push(newMsg);
  renderCfpMsgs(t.msgs);

  // Firebase に書き込み
  fetch(`${FB_URL}/chats/${cfpTeamId}.json`, {
    method: 'POST',
    body: JSON.stringify({ nick: userNick, emoji: userEmoji, msg: txt, t: now, ts: Date.now() })
  }).catch(() => {});

  inp.focus();
}

// リアクション送信
function cfpReact(emoji) {
  const t = TEAMS.find(x => x.id === cfpTeamId);
  if (!t) return;
  const now    = ntime();
  const newMsg = { n: userNick, msg: emoji, t: now };
  t.msgs.push(newMsg);
  renderCfpMsgs(t.msgs);
  fetch(`${FB_URL}/chats/${cfpTeamId}.json`, {
    method: 'POST',
    body: JSON.stringify({ nick: userNick, emoji: userEmoji, msg: emoji, t: now, ts: Date.now() })
  }).catch(() => {});
}

// ============================================================
// チャットルームを閉じる
// ============================================================
function closeChatFull() {
  document.getElementById('chatFullPage').style.display = 'none';
  document.getElementById('mainScroll').style.overflow  = '';
  if (cfpPollId) { clearInterval(cfpPollId); cfpPollId = null; }
  cfpTeamId = null;
}

// ============================================================
// Firebaseポーリング（5秒ごとに他ユーザーの投稿を取得）
// ============================================================
function startChatPoll(teamId) {
  if (cfpPollId) clearInterval(cfpPollId);
  let lastTs = Date.now() - 60000;

  cfpPollId = setInterval(async () => {
    try {
      const res = await fetch(`${FB_URL}/chats/${teamId}.json?orderBy="ts"&startAt=${lastTs}&limitToLast=20`);
      if (!res.ok) return;
      const data = await res.json();
      if (!data) return;
      const t = TEAMS.find(x => x.id === teamId);
      if (!t) return;
      let updated = false;
      Object.values(data).sort((a,b) => (a.ts||0) - (b.ts||0)).forEach(m => {
        if (!m || m.ts <= lastTs || m.nick === userNick) return;
        t.msgs.push({ n: m.nick, msg: escapeHtml(m.msg), t: m.t });
        lastTs  = Math.max(lastTs, m.ts);
        updated = true;
      });
      if (updated) renderCfpMsgs(t.msgs);
    } catch(e) {}
  }, CHAT_POLL_MS); // config.js で定義
}

// ============================================================
// ニックネーム設定モーダル
// ============================================================
const NICK_EMOJIS = ['🏀','👑','🔥','⚡','🎯','💪','🦁','🐺','🦅','🐉','🌟','💯','🎮','😤','🤯'];

function showNickModal(pendingTeamId) {
  const modal = document.getElementById('nickModal');
  modal.style.display   = 'flex';
  modal.dataset.pending = pendingTeamId || '';
  document.getElementById('nickEmojis').innerHTML = NICK_EMOJIS.map(e =>
    `<span class="nick-emoji${e === userEmoji ? ' on' : ''}" onclick="selectEmoji(this,'${e}')">${e}</span>`
  ).join('');
  document.getElementById('nickInp').value = '';
}

function selectEmoji(el, emoji) {
  document.querySelectorAll('.nick-emoji').forEach(e => e.classList.remove('on'));
  el.classList.add('on');
  userEmoji = emoji;
}

async function saveNick(anon = false) {
  if (anon) {
    userNick  = '匿名ファン' + Math.floor(Math.random() * 9000 + 1000);
    userEmoji = '🏀';
  } else {
    const v = document.getElementById('nickInp').value.trim();
    if (!v) { document.getElementById('nickInp').focus(); return; }
    userNick = v.slice(0, 16);
    userEmoji = '🏀';

    // プロフィール情報取得
    const gender  = document.getElementById('nickGender')?.value || '';
    const age     = document.getElementById('nickAge')?.value || '';
    const team    = document.getElementById('nickTeam')?.value || '';
    const player  = document.getElementById('nickPlayer')?.value.trim() || '';
    const history = document.getElementById('nickHistory')?.value || '';

    // Firebaseに保存
    try {
      const uid = lsGet('courtside_uid') || ('u' + Date.now() + Math.random().toString(36).slice(2,6));
      lsSet('courtside_uid', uid);
      await fetch(FB_URL + '/users/' + uid + '.json', {
        method: 'PUT',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ nick: userNick, gender, age, team, player, history, ts: Date.now() })
      });
    } catch(e) {}
  }
  lsSet('mentality_nick',  userNick);
  lsSet('mentality_emoji', userEmoji);
  const pending = document.getElementById('nickModal').dataset.pending;
  document.getElementById('nickModal').style.display = 'none';
  if (pending) _launchChat(pending);
}

// ============================================================
// 共通ユーティリティ（chat.js ローカル）
// ============================================================
function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// ============================================================
// チャットページに必要なHTMLを動的に挿入
// （index.html に書いてない要素をここで追加）
// ============================================================
function initChatUI() {
  // フルスクリーンチャット画面
  if (!document.getElementById('chatFullPage')) {
    document.body.insertAdjacentHTML('beforeend', `
    <div id="chatFullPage" style="display:none;position:fixed;inset:0;z-index:300;background:var(--bg);max-width:480px;margin:0 auto;flex-direction:column;">
      <div style="flex-shrink:0;background:#fff;border-bottom:1px solid var(--bd);padding:.7rem 1rem;display:flex;align-items:center;gap:.6rem;">
        <button onclick="closeChatFull()" style="width:32px;height:32px;border-radius:6px;background:var(--bg3);border:1px solid var(--bd);display:flex;align-items:center;justify-content:center;font-size:.85rem;cursor:pointer;color:var(--tx2);">←</button>
        <img id="cfpLogo" style="width:32px;height:32px;object-fit:contain;flex-shrink:0;display:none;" onerror="this.style.display='none'">
        <span id="cfpLogoEmoji" style="font-size:1.4rem;flex-shrink:0;"></span>
        <div id="cfpName" style="flex:1;font-size:.9rem;font-weight:700;color:var(--tx);"></div>
        <div style="display:flex;align-items:center;gap:.22rem;background:rgba(0,168,85,.1);border:1px solid rgba(0,168,85,.2);padding:.18rem .45rem;border-radius:4px;">
          <span style="width:5px;height:5px;border-radius:50%;background:#00A855;animation:pulse 1.5s infinite;display:block;"></span>
          <span id="cfpOnline" style="font-family:'Barlow Condensed',sans-serif;font-size:.62rem;font-weight:700;color:#00A855;letter-spacing:.04em;">0人</span>
        </div>
      </div>
      <div id="cfpMsgs" style="flex:1;overflow-y:auto;padding:.75rem;display:flex;flex-direction:column;gap:.5rem;-webkit-overflow-scrolling:touch;"></div>
      <div id="cfpAd" style="padding:.4rem .75rem;display:none;">
        <div style="background:var(--card);border:1px solid var(--bd);border-radius:8px;overflow:hidden;position:relative;cursor:pointer;" onclick="">
          <span style="position:absolute;top:4px;right:6px;font-size:.48rem;color:var(--tx3);opacity:.6;text-transform:uppercase;letter-spacing:.06em;">PR</span>
          <div style="display:flex;align-items:center;gap:.75rem;padding:.6rem .8rem;">
            <div id="cfpAdImg" style="width:44px;height:44px;border-radius:8px;background:linear-gradient(135deg,#1a1a2e,#0d0d18);display:flex;align-items:center;justify-content:center;font-size:1.4rem;flex-shrink:0;"></div>
            <div style="flex:1;min-width:0;">
              <div id="cfpAdTag"   style="font-size:.55rem;font-weight:700;color:var(--or);letter-spacing:.08em;text-transform:uppercase;margin-bottom:.1rem;"></div>
              <div id="cfpAdTitle" style="font-size:.72rem;font-weight:600;color:var(--tx);margin-bottom:.15rem;"></div>
              <div style="font-size:.65rem;color:var(--tx2);"><s id="cfpAdOld" style="color:var(--tx3);font-size:.6rem;"></s> <span id="cfpAdPrice"></span></div>
            </div>
            <button id="cfpAdBtn" style="flex-shrink:0;padding:.32rem .65rem;border-radius:6px;background:var(--or);color:#fff;font-family:'Barlow Condensed',sans-serif;font-size:.65rem;font-weight:700;border:none;cursor:pointer;">Amazon</button>
          </div>
        </div>
      </div>
      <div style="flex-shrink:0;background:#fff;border-top:1px solid var(--bd);padding:.5rem .75rem;">
        <div style="display:flex;gap:.35rem;padding:.3rem 0 .45rem;overflow-x:auto;scrollbar-width:none;">
          ${['🔥','👀','💪','🏀','😤','🎯','👑','😭','🤯'].map(e =>
            `<button onclick="cfpReact('${e}')" style="flex-shrink:0;font-size:1.1rem;padding:.15rem .35rem;border-radius:6px;background:var(--bg3);border:1px solid var(--bd);cursor:pointer;">${e}</button>`
          ).join('')}
        </div>
        <div style="display:flex;align-items:center;gap:.4rem;">
          <input id="cfpField" style="flex:1;background:var(--bg3);border:1px solid var(--bd);border-radius:20px;padding:.42rem .75rem;font-size:.78rem;color:var(--tx);outline:none;font-family:'Barlow',sans-serif;" placeholder="メッセージを入力..." onkeydown="if(event.key==='Enter')cfpSend()">
          <button onclick="cfpSend()" style="width:34px;height:34px;border-radius:50%;background:var(--or);border:none;cursor:pointer;font-size:.8rem;color:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(255,90,0,.35);flex-shrink:0;">➤</button>
        </div>
      </div>
    </div>

    <!-- ニックネーム設定モーダル -->
    <div id="nickModal" style="display:none;position:fixed;inset:0;z-index:400;background:rgba(17,17,30,.75);backdrop-filter:blur(12px);display:none;align-items:center;justify-content:center;padding:1rem;">
      <div style="background:var(--card);border-radius:12px;padding:1.5rem 1.25rem;width:100%;max-width:320px;box-shadow:0 24px 64px rgba(0,0,0,.5);max-height:90vh;overflow-y:auto;">
        <div style="font-family:'Bebas Neue',sans-serif;font-size:1.4rem;letter-spacing:.1em;color:var(--tx);margin-bottom:.25rem;">COURTSIDE</div>
        <div style="font-size:.74rem;color:var(--tx2);margin-bottom:1rem;line-height:1.6;">プロフィールを設定してチャットに参加しましょう！</div>
        <input id="nickInp" style="width:100%;padding:.55rem .75rem;border-radius:8px;border:1.5px solid var(--bd);background:var(--bg3);color:var(--tx);font-size:.88rem;outline:none;font-family:'Barlow',sans-serif;margin-bottom:.5rem;box-sizing:border-box;" placeholder="ニックネームを入力（必須）" maxlength="16">
        <select id="nickGender" style="width:100%;padding:.5rem;border-radius:8px;border:1px solid var(--bd);background:var(--bg3);color:var(--tx);font-size:.82rem;margin-bottom:.5rem;">
          <option value="">性別を選択</option>
          <option value="male">男性</option>
          <option value="female">女性</option>
          <option value="other">その他</option>
        </select>
        <input id="nickAge" type="number" min="1" max="100" style="width:100%;padding:.5rem .75rem;border-radius:8px;border:1px solid var(--bd);background:var(--bg3);color:var(--tx);font-size:.82rem;margin-bottom:.5rem;box-sizing:border-box;" placeholder="年齢">
        <select id="nickTeam" style="width:100%;padding:.5rem;border-radius:8px;border:1px solid var(--bd);background:var(--bg3);color:var(--tx);font-size:.82rem;margin-bottom:.5rem;">
          <option value="">推しチームを選択</option>
          <option value="ATL">ATL ホークス</option>
          <option value="BOS">BOS セルティックス</option>
          <option value="BKN">BKN ネッツ</option>
          <option value="CHA">CHA ホーネッツ</option>
          <option value="CHI">CHI ブルズ</option>
          <option value="CLE">CLE キャバリアーズ</option>
          <option value="DAL">DAL マーベリックス</option>
          <option value="DEN">DEN ナゲッツ</option>
          <option value="DET">DET ピストンズ</option>
          <option value="GSW">GSW ウォリアーズ</option>
          <option value="HOU">HOU ロケッツ</option>
          <option value="IND">IND ペイサーズ</option>
          <option value="LAC">LAC クリッパーズ</option>
          <option value="LAL">LAL レイカーズ</option>
          <option value="MEM">MEM グリズリーズ</option>
          <option value="MIA">MIA ヒート</option>
          <option value="MIL">MIL バックス</option>
          <option value="MIN">MIN ティンバーウルブズ</option>
          <option value="NOP">NOP ペリカンズ</option>
          <option value="NYK">NYK ニックス</option>
          <option value="OKC">OKC サンダー</option>
          <option value="ORL">ORL マジック</option>
          <option value="PHI">PHI シクサーズ</option>
          <option value="PHX">PHX サンズ</option>
          <option value="POR">POR トレイルブレイザーズ</option>
          <option value="SAC">SAC キングス</option>
          <option value="SAS">SAS スパーズ</option>
          <option value="TOR">TOR ラプターズ</option>
          <option value="UTA">UTA ジャズ</option>
          <option value="WAS">WAS ウィザーズ</option>
        </select>
        <input id="nickPlayer" style="width:100%;padding:.5rem .75rem;border-radius:8px;border:1px solid var(--bd);background:var(--bg3);color:var(--tx);font-size:.82rem;margin-bottom:.5rem;box-sizing:border-box;" placeholder="推し選手（例：レブロン）" maxlength="30">
        <select id="nickHistory" style="width:100%;padding:.5rem;border-radius:8px;border:1px solid var(--bd);background:var(--bg3);color:var(--tx);font-size:.82rem;margin-bottom:.8rem;">
          <option value="">バスケ好き歴</option>
          <option value="1年未満">1年未満</option>
          <option value="1〜3年">1〜3年</option>
          <option value="3〜5年">3〜5年</option>
          <option value="5〜10年">5〜10年</option>
          <option value="10年以上">10年以上</option>
        </select>
        <button onclick="saveNick()" style="width:100%;padding:.55rem;border-radius:8px;background:var(--or);color:#fff;border:none;font-family:'Barlow Condensed',sans-serif;font-size:.88rem;font-weight:700;letter-spacing:.08em;cursor:pointer;box-shadow:0 4px 12px rgba(255,90,0,.3);">チャットに参加する 🏀</button>
      </div>
    </div>
    `);
  }
}

// ============================================================
// 起動処理
// ============================================================
initChatUI();
renderTeams();
// ============================================================

// ============================================================
// ユーザー管理
// ============================================================
function openUserModal() {
  const modal = document.getElementById('userModal');
  if (modal) { modal.style.display = 'block'; loadUsers(); }
}

function closeUserModal() {
  const modal = document.getElementById('userModal');
  if (modal) modal.style.display = 'none';
}

async function loadUsers() {
  const list  = document.getElementById('userList');
  const stats = document.getElementById('userStats');
  if (!list) return;
  list.innerHTML = '<div style="text-align:center;padding:1rem;color:var(--tx3);font-size:.75rem;">読み込み中...</div>';

  try {
    const res  = await fetch(FB_URL + '/users.json');
    const data = await res.json() || {};
    const users = Object.entries(data).map(([id,u]) => ({id,...u})).sort((a,b) => b.ts - a.ts);

    // 集計
    const total  = users.length;
    const male   = users.filter(u => u.gender === 'male').length;
    const female = users.filter(u => u.gender === 'female').length;
    const avgAge = users.filter(u => u.age).reduce((s,u) => s + Number(u.age), 0) / (users.filter(u => u.age).length || 1);

    stats.innerHTML = `
      <div style="background:var(--bg3);border-radius:8px;padding:.7rem;text-align:center;">
        <div style="font-size:1.2rem;font-weight:700;color:var(--or);">${total}</div>
        <div style="font-size:.65rem;color:var(--tx3);">総ユーザー数</div>
      </div>
      <div style="background:var(--bg3);border-radius:8px;padding:.7rem;text-align:center;">
        <div style="font-size:1.2rem;font-weight:700;color:var(--or);">${Math.round(avgAge)||'-'}</div>
        <div style="font-size:.65rem;color:var(--tx3);">平均年齢</div>
      </div>
      <div style="background:var(--bg3);border-radius:8px;padding:.7rem;text-align:center;">
        <div style="font-size:1.2rem;font-weight:700;color:var(--or);">${male}</div>
        <div style="font-size:.65rem;color:var(--tx3);">男性</div>
      </div>
      <div style="background:var(--bg3);border-radius:8px;padding:.7rem;text-align:center;">
        <div style="font-size:1.2rem;font-weight:700;color:var(--or);">${female}</div>
        <div style="font-size:.65rem;color:var(--tx3);">女性</div>
      </div>
    `;

    list.innerHTML = users.map(u => `
      <div style="background:var(--bg3);border-radius:8px;padding:.6rem;margin-bottom:.4rem;">
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <div style="font-size:.78rem;font-weight:700;color:var(--tx);">${u.nick||'匿名'}</div>
          <div style="font-size:.6rem;color:var(--tx3);">${new Date(u.ts).toLocaleDateString('ja-JP')}</div>
        </div>
        <div style="font-size:.65rem;color:var(--tx3);margin-top:.2rem;">
          ${u.gender==='male'?'男性':u.gender==='female'?'女性':''}${u.age?' · '+u.age+'歳':''}${u.team?' · '+u.team:''}${u.player?' · '+u.player:''}${u.history?' · '+u.history:''}
        </div>
      </div>
    `).join('');
  } catch(e) {
    list.innerHTML = '<div style="text-align:center;padding:1rem;color:var(--tx3);">取得失敗</div>';
  }
}
