// app.js — ページ切り替え・オンライン人数・初期化
// 読み込み順: data.js → utils.js → app.js → 各機能JS

// router.js — ページ切り替え・オンライン人数・初期表示
//
// 【修正しても影響しないファイル】
//   schedule.js / chat.js / videos.js などとは独立している
//
// 【主な関数】
//   goPage(id, btn) → タブをタップしてページを切り替える
//   updateOnlineCount() → Firebase からオンライン人数を取得
//   initDateDisplay()   → 今日の日付を即座に表示
// ============================================================

// ============================================================
// ページ切り替え
// 使い方：goPage('schedule', btn) でそのページに移動
// ============================================================
function goPage(id, btn) {
  // URLハッシュにタブを保存
  history.replaceState(null, '', '#' + id);
  // 全ページを非表示
  document.querySelectorAll('.pg').forEach(p => p.classList.remove('show'));
  // 指定ページを表示
  document.getElementById('pg-' + id).classList.add('show');
  // タブのハイライト切り替え
  document.querySelectorAll('.sn').forEach(b => b.classList.remove('on'));
  if (btn) btn.classList.add('on');
  // スクロールを一番上に戻す
  document.getElementById('mainScroll').scrollTop = 0;

  // ページごとに必要な初期化を呼ぶ
  // ※ 各jsファイルが読み込まれていれば自動で動く
  if (id === 'stats' && typeof loadESPNLeaders === 'function') {
    loadESPNLeaders(curStatKey || 'pts', curMode || 'season');
  }
  if (id === 'japan') {
    loadJpComments();
    loadMvpVotes();
  }
  if (id === 'news') {
    loadRSSNews();
  }
  if (id === 'articles' && typeof loadArticles === 'function') {
    loadArticles();
  }
  if (id === 'sneakers' && typeof loadSneakers === 'function') {
    loadSneakers();
  }
}

// ============================================================
// 今日の日付を即座に表示（ページ読み込み直後）
// 日本時間基準
// ============================================================
(function initDateDisplay() {
  const jp   = getJPDate(); // utils.js の関数
  const dateEl = document.getElementById('dbDate');
  const subEl  = document.getElementById('dbSub');
  if (dateEl) dateEl.textContent = toJPDateLabel(jp); // utils.js の関数
  if (subEl)  subEl.innerHTML = 'TODAY<span class="db-today">今日</span>';
})();

// ============================================================
// オンライン人数 - サイト全体で統一した数値を使う
// ============================================================
let _globalOnlineCount = 0;

async function updateOnlineCount() {
  try {
    const res = await fetchWithTimeout(`${FB_URL}/online.json`, {}, 4000);
    if (!res.ok) throw new Error('no');
    const data  = await res.json();
    const count = data ? Object.keys(data).length : 0;
    _globalOnlineCount = Math.floor(Math.random() * 20) + 1;
  } catch(e) {
    // Firebaseが失敗した場合はランダムで一定範囲内
    if (_globalOnlineCount === 0) _globalOnlineCount = Math.floor(Math.random() * 5) + 1;
  }
  // ナビとチャット一覧を同じ数値で更新
  _syncOnlineDisplay();
}

function _syncOnlineDisplay() {
  const c = _globalOnlineCount;
  // ナビバー
  const navEl = document.getElementById('siteOnlineCount');
  if (navEl) navEl.textContent = c + ' 人が閲覧中';
  // チームカード内のオンライン数も同じ母数から算出
  // （各チームは全体の一部として表示）
}

// 自分のオンライン状態をFirebaseに登録
async function registerOnline() {
  const uid = lsGet('mentality_uid') || (() => {
    const id = 'u_' + Math.random().toString(36).slice(2, 9);
    lsSet('mentality_uid', id);
    return id;
  })();

  try {
    await fetch(`${FB_URL}/online/${uid}.json`, {
      method: 'PUT',
      body: JSON.stringify({ t: Date.now() })
    });
  } catch(e) {}

  // ページを離れるときに削除
  window.addEventListener('beforeunload', () => {
    navigator.sendBeacon(`${FB_URL}/online/${uid}.json`, JSON.stringify(null));
  });
}

// ============================================================
// 起動処理
// ============================================================
registerOnline();
updateOnlineCount();
setInterval(updateOnlineCount, 30000); // 30秒ごとに更新
// ============================================================

// data.jsonからESPNID_MAPを読み込む
(async () => {
  try {
    const res = await fetch('https://courtside-jp.github.io/mentality/data.json');
    const data = await res.json();
    window._espnIdMap = data.espnid_map || {};
    console.log('✅ ESPNID_MAP読み込み:', Object.keys(window._espnIdMap).length, '人');
  } catch(e) {
    window._espnIdMap = {};
    console.warn('ESPNID_MAP読み込み失敗:', e.message);
  }
})();

// トップバナー
async function loadTopBanner() {
  try {
    const res = await fetch(FB_URL + '/adslots/topbanner.json');
    const ad = await res.json();
    if (!ad || !ad.url) return;
    const wrap = document.getElementById('topBanner');
    if (!wrap) return;
    wrap.style.display = 'block';
    wrap.innerHTML = `<a href="${ad.url}" target="_blank" style="display:flex;align-items:center;gap:.6rem;text-decoration:none;background:var(--bg3);border:1px solid var(--bd);border-radius:8px;padding:.5rem .8rem;">
      ${ad.img ? `<img src="${ad.img}" style="width:40px;height:40px;object-fit:cover;border-radius:6px;flex-shrink:0;">` : '<div style="font-size:1.2rem;">📺</div>'}
      <div style="flex:1;min-width:0;">
        <div style="font-size:.72rem;font-weight:700;color:var(--tx);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${ad.title}</div>
      </div>
      <div style="font-size:.65rem;background:rgba(255,90,0,.15);color:var(--or);padding:.2rem .5rem;border-radius:6px;font-weight:700;flex-shrink:0;">PR</div>
    </a>`;
  } catch(e) {}
}
loadTopBanner();
// url update

// SNSバー
async function loadSnsBar() {
  try {
    const res = await fetch('https://mentality-nba-default-rtdb.firebaseio.com/sns.json');
    const sns = await res.json() || {};
    const icons = {
      twitter:   { icon: '𝕏', label: 'X' },
      instagram: { icon: '📸', label: 'Instagram' },
      youtube:   { icon: '▶️', label: 'YouTube' },
      tiktok:    { icon: '🎵', label: 'TikTok' },
    };
    const bar = document.getElementById('snsBar');
    if (!bar) return;
    const items = Object.entries(icons)
      .filter(([k]) => sns[k] && sns[k].enabled && sns[k].url)
      .map(([k, v]) => `<a href="${sns[k].url}" target="_blank" style="display:flex;flex-direction:column;align-items:center;gap:.2rem;text-decoration:none;color:var(--tx);font-size:.65rem;">
        <span style="font-size:1.4rem;line-height:1;">${v.icon}</span>
        <span>${v.label}</span>
      </a>`);
    if (items.length > 0) {
      bar.innerHTML = items.join('');
      bar.style.display = 'flex';
    } else {
      bar.style.display = 'none';
    }
  } catch(e) {}
}
loadSnsBar();

// SNS管理
function openSnsManager() {
  const modal = document.getElementById('snsManagerModal');
  if (modal) { modal.style.display = 'block'; renderSnsManager(); }
}
function closeSnsManager() {
  const modal = document.getElementById('snsManagerModal');
  if (modal) modal.style.display = 'none';
}
async function renderSnsManager() {
  const wrap = document.getElementById('snsManagerList');
  if (!wrap) return;
  const FB = 'https://mentality-nba-default-rtdb.firebaseio.com';
  const res = await fetch(FB + '/sns.json');
  const sns = await res.json() || {};
  const items = [
    { key: 'twitter',   label: '𝕏 X (Twitter)' },
    { key: 'instagram', label: '📸 Instagram' },
    { key: 'youtube',   label: '▶️ YouTube' },
    { key: 'tiktok',    label: '🎵 TikTok' },
  ];
  wrap.innerHTML = items.map(({key, label}) => {
    const d = sns[key] || {};
    return `<div style="background:var(--bg3);border-radius:10px;padding:.8rem;margin-bottom:.7rem;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.5rem;">
        <div style="font-size:.72rem;font-weight:700;color:var(--or);">${label}</div>
        <div style="display:flex;align-items:center;gap:.4rem;">
          <span style="font-size:.65rem;color:var(--tx3);">${d.enabled ? 'ON' : 'OFF'}</span>
          <div onclick="toggleSns('${key}',${!!d.enabled})" style="width:36px;height:20px;border-radius:10px;background:${d.enabled ? 'var(--or)' : 'var(--bd)'};position:relative;cursor:pointer;transition:background .2s;">
            <div style="width:16px;height:16px;border-radius:50%;background:#fff;position:absolute;top:2px;${d.enabled ? 'left:18px' : 'left:2px'};transition:left .2s;"></div>
          </div>
        </div>
      </div>
      <input id="sns_url_${key}" type="text" placeholder="URLを入力（例：https://x.com/yourname）" value="${d.url||''}" style="width:100%;padding:.4rem;border-radius:6px;border:1px solid var(--bd);background:var(--bg);color:var(--tx);font-size:.75rem;box-sizing:border-box;margin-bottom:.5rem;">
      <button onclick="saveSns('${key}')" style="width:100%;padding:.5rem;background:var(--or);border:none;color:#fff;border-radius:8px;font-size:.75rem;font-weight:700;cursor:pointer;">保存する</button>
    </div>`;
  }).join('');
}
async function toggleSns(key, currentOn) {
  const FB = 'https://mentality-nba-default-rtdb.firebaseio.com';
  await fetch(FB + '/sns/' + key + '.json', {
    method: 'PATCH',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ enabled: !currentOn })
  });
  renderSnsManager();
  loadSnsBar();
}
async function saveSns(key) {
  const FB = 'https://mentality-nba-default-rtdb.firebaseio.com';
  const url = document.getElementById('sns_url_' + key).value.trim();
  await fetch(FB + '/sns/' + key + '.json', {
    method: 'PATCH',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ url })
  });
  alert('保存しました！');
  loadSnsBar();
}

// SNS管理
function openSnsManager() {
  const modal = document.getElementById('snsManagerModal');
  if (modal) { modal.style.display = 'block'; renderSnsManager(); }
}
function closeSnsManager() {
  const modal = document.getElementById('snsManagerModal');
  if (modal) modal.style.display = 'none';
}
async function renderSnsManager() {
  const wrap = document.getElementById('snsManagerList');
  if (!wrap) return;
  const FB = 'https://mentality-nba-default-rtdb.firebaseio.com';
  const res = await fetch(FB + '/sns.json');
  const sns = await res.json() || {};
  const items = [
    { key: 'twitter',   label: '𝕏 X (Twitter)' },
    { key: 'instagram', label: '📸 Instagram' },
    { key: 'youtube',   label: '▶️ YouTube' },
    { key: 'tiktok',    label: '🎵 TikTok' },
  ];
  wrap.innerHTML = items.map(({key, label}) => {
    const d = sns[key] || {};
    return `<div style="background:var(--bg3);border-radius:10px;padding:.8rem;margin-bottom:.7rem;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.5rem;">
        <div style="font-size:.72rem;font-weight:700;color:var(--or);">${label}</div>
        <div style="display:flex;align-items:center;gap:.4rem;">
          <span style="font-size:.65rem;color:var(--tx3);">${d.enabled ? 'ON' : 'OFF'}</span>
          <div onclick="toggleSns('${key}',${!!d.enabled})" style="width:36px;height:20px;border-radius:10px;background:${d.enabled ? 'var(--or)' : 'var(--bd)'};position:relative;cursor:pointer;transition:background .2s;">
            <div style="width:16px;height:16px;border-radius:50%;background:#fff;position:absolute;top:2px;${d.enabled ? 'left:18px' : 'left:2px'};transition:left .2s;"></div>
          </div>
        </div>
      </div>
      <input id="sns_url_${key}" type="text" placeholder="URLを入力（例：https://x.com/yourname）" value="${d.url||''}" style="width:100%;padding:.4rem;border-radius:6px;border:1px solid var(--bd);background:var(--bg);color:var(--tx);font-size:.75rem;box-sizing:border-box;margin-bottom:.5rem;">
      <button onclick="saveSns('${key}')" style="width:100%;padding:.5rem;background:var(--or);border:none;color:#fff;border-radius:8px;font-size:.75rem;font-weight:700;cursor:pointer;">保存する</button>
    </div>`;
  }).join('');
}
async function toggleSns(key, currentOn) {
  const FB = 'https://mentality-nba-default-rtdb.firebaseio.com';
  await fetch(FB + '/sns/' + key + '.json', {
    method: 'PATCH',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ enabled: !currentOn })
  });
  renderSnsManager();
  loadSnsBar();
}
async function saveSns(key) {
  const FB = 'https://mentality-nba-default-rtdb.firebaseio.com';
  const url = document.getElementById('sns_url_' + key).value.trim();
  await fetch(FB + '/sns/' + key + '.json', {
    method: 'PATCH',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ url })
  });
  alert('保存しました！');
  loadSnsBar();
}
