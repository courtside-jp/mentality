// 広告管理 ads.js v1
const FB_ADS = FB_URL + '/ads';

let _allAds = [];

// 広告データ読み込み
async function loadAds() {
  const res = await fetch(FB_ADS + '.json');
  const data = await res.json();
  _allAds = data ? Object.entries(data).map(([id, v]) => ({ id, ...v })) : [];
  return _allAds;
}

// アクティブな広告をランダムに1件返す
function getActiveAd() {
  const active = _allAds.filter(a => a.active !== false);
  if (!active.length) return null;
  return active[Math.floor(Math.random() * active.length)];
}

// ページ内の広告枠をレンダリング
function renderAdBanner() {
  const slots = document.querySelectorAll('.ad-banner-slot');
  if (!slots.length) return;
  const ad = getActiveAd();
  slots.forEach(slot => {
    if (!ad) { slot.style.display = 'none'; return; }
    slot.style.display = 'block';
    slot.innerHTML =
      '<div style="border:0.5px solid #e0e0e0;border-radius:12px;overflow:hidden;margin:16px 0;">' +
        '<div style="padding:4px 12px;background:#f5f5f5;border-bottom:0.5px solid #e0e0e0;">' +
          '<span style="font-size:10px;color:#999;">PR</span>' +
        '</div>' +
        '<a href="' + ad.link + '" target="_blank" rel="noopener sponsored" style="display:flex;align-items:center;gap:12px;padding:12px;text-decoration:none;">' +
          (ad.img ? '<img src="' + ad.img + '" style="width:64px;height:64px;object-fit:cover;border-radius:8px;flex-shrink:0;">' :
            '<div style="width:64px;height:64px;border-radius:8px;background:#f0f0f0;flex-shrink:0;"></div>') +
          '<div style="flex:1;min-width:0;">' +
            '<p style="margin:0 0 3px;font-size:13px;font-weight:700;color:#111;">' + (ad.title || '') + '</p>' +
            (ad.desc ? '<p style="margin:0 0 5px;font-size:11px;color:#666;line-height:1.4;">' + ad.desc + '</p>' : '') +
            '<span style="font-size:11px;color:#C9082A;font-weight:700;">詳しく見る →</span>' +
          '</div>' +
        '</a>' +
      '</div>';
  });
}

// 広告データ初期化（ページ読み込み時に呼ぶ）
async function initAds() {
  await loadAds();
  renderAdBanner();
}

// ---- 管理画面 ----
async function loadAdminAds() {
  await loadAds();
  const wrap = document.getElementById('adminAdList');
  if (!wrap) return;
  if (!_allAds.length) { wrap.innerHTML = '<p style="text-align:center;color:#999;padding:20px;">広告なし</p>'; return; }
  wrap.innerHTML = _allAds.map(a => `
    <div style="border:0.5px solid #eee;border-radius:10px;padding:10px;margin-bottom:8px;display:flex;gap:10px;align-items:center;${a.active === false ? 'opacity:0.5;' : ''}">
      ${a.img ? '<img src="' + a.img + '" style="width:44px;height:44px;object-fit:cover;border-radius:6px;flex-shrink:0;">' :
        '<div style="width:44px;height:44px;border-radius:6px;background:#f0f0f0;flex-shrink:0;"></div>'}
      <div style="flex:1;min-width:0;">
        <p style="margin:0;font-size:12px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${a.title || '(タイトルなし)'}</p>
        <p style="margin:2px 0 0;font-size:10px;color:#999;">${a.active === false ? '停止中' : '表示中'}</p>
      </div>
      <div style="display:flex;gap:6px;flex-shrink:0;">
        <button onclick="editAd('${a.id}')" style="padding:4px 8px;font-size:11px;border:0.5px solid #ddd;border-radius:6px;background:#fff;cursor:pointer;">編集</button>
        <button onclick="toggleAd('${a.id}',${a.active === false})" style="padding:4px 8px;font-size:11px;border:0.5px solid #ddd;border-radius:6px;background:${a.active === false ? '#e8f5e9' : '#fff'};color:${a.active === false ? '#2e7d32' : '#333'};cursor:pointer;">${a.active === false ? '再開' : '停止'}</button>
        <button onclick="deleteAd('${a.id}')" style="padding:4px 8px;font-size:11px;border:0.5px solid #ddd;border-radius:6px;background:#fff;color:#C9082A;cursor:pointer;">削除</button>
      </div>
    </div>
  `).join('');
}

function openNewAd() {
  document.getElementById('adForm').style.display = 'block';
  document.getElementById('adEditId').value = '';
  document.getElementById('adTitle').value = '';
  document.getElementById('adDesc').value = '';
  document.getElementById('adImg').value = '';
  document.getElementById('adLink').value = '';
  document.getElementById('adSubmitBtn').textContent = '保存する';
}

function cancelAdEdit() {
  document.getElementById('adForm').style.display = 'none';
}

async function editAd(id) {
  const res = await fetch(FB_ADS + '/' + id + '.json');
  const d = await res.json();
  document.getElementById('adForm').style.display = 'block';
  document.getElementById('adEditId').value = id;
  document.getElementById('adTitle').value = d.title || '';
  document.getElementById('adDesc').value = d.desc || '';
  document.getElementById('adImg').value = d.img || '';
  document.getElementById('adLink').value = d.link || '';
  document.getElementById('adSubmitBtn').textContent = '上書き保存';
}

async function submitAd() {
  const title = document.getElementById('adTitle').value.trim();
  const desc  = document.getElementById('adDesc').value.trim();
  const img   = document.getElementById('adImg').value.trim();
  const link  = document.getElementById('adLink').value.trim();
  const editId = document.getElementById('adEditId').value;
  if (!title || !link) { alert('タイトルとリンクURLは必須です'); return; }
  const btn = document.getElementById('adSubmitBtn');
  btn.textContent = '保存中...'; btn.disabled = true;
  const payload = { title, desc, img, link, active: true, ts: Date.now() };
  const method = editId ? 'PUT' : 'POST';
  const url = editId ? FB_ADS + '/' + editId + '.json' : FB_ADS + '.json';
  await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  btn.textContent = '保存する'; btn.disabled = false;
  document.getElementById('adForm').style.display = 'none';
  loadAdminAds();
}

async function toggleAd(id, toActive) {
  await fetch(FB_ADS + '/' + id + '.json', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ active: toActive })
  });
  loadAdminAds();
}

async function deleteAd(id) {
  if (!confirm('この広告を削除しますか？')) return;
  await fetch(FB_ADS + '/' + id + '.json', { method: 'DELETE' });
  loadAdminAds();
}
