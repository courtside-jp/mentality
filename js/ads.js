const FB_ADS = 'https://mentality-nba-default-rtdb.firebaseio.com/ads';
let _allAds = [];

// 広告を読み込んで表示
async function loadAds() {
  try {
    const res = await fetch(`${FB_ADS}.json`);
    const data = await res.json();
    if (!data) { _allAds = []; return; }
    _allAds = Object.entries(data).map(([id, v]) => ({ id, ...v }));
  } catch(e) { _allAds = []; }
}

// 広告枠をレンダリング（アクティブな広告をランダムに1件表示）
function renderAdBanner(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const active = _allAds.filter(a => a.active !== false);
  if (!active.length) { container.innerHTML = ''; return; }
  const ad = active[Math.floor(Math.random() * active.length)];
  container.innerHTML = `
    <div style="margin:16px 0;border:0.5px solid #eee;border-radius:12px;overflow:hidden;">
      <div style="background:#f5f5f5;padding:4px 12px;border-bottom:0.5px solid #eee;">
        <span style="font-size:10px;color:#999;">PR</span>
      </div>
      <a href="${ad.link}" target="_blank" rel="noopener sponsored"
        style="display:flex;align-items:center;gap:12px;padding:12px;text-decoration:none;background:#fff;">
        ${ad.img
          ? `<img src="${ad.img}" style="width:64px;height:64px;object-fit:cover;border-radius:8px;flex-shrink:0;" alt="${ad.title||''}">`
          : `<div style="width:64px;height:64px;border-radius:8px;background:#eee;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:24px;">📢</div>`
        }
        <div style="flex:1;min-width:0;">
          <div style="font-size:13px;font-weight:700;color:#111;margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${ad.title||''}</div>
          ${ad.desc ? `<div style="font-size:11px;color:#666;margin-bottom:5px;">${ad.desc}</div>` : ''}
          <span style="font-size:11px;color:#C9082A;font-weight:700;">${ad.cta||'詳しくはこちら →'}</span>
        </div>
      </a>
    </div>`;
}

// 全ページの広告枠を更新
async function refreshAllAdBanners() {
  await loadAds();
  ['adBannerSneaker','adBannerItem','adBannerArticle'].forEach(id => renderAdBanner(id));
}

// ========== 管理画面 ==========
async function loadAdminAds() {
  await loadAds();
  const list = document.getElementById('adminAdList');
  if (!list) return;
  if (!_allAds.length) { list.innerHTML = '<div style="text-align:center;color:#999;padding:20px;font-size:13px;">広告なし</div>'; return; }
  list.innerHTML = _allAds.map(a => `
    <div style="border:1px solid #eee;border-radius:10px;padding:10px 12px;margin-bottom:8px;display:flex;align-items:center;gap:10px;${a.active===false?'opacity:0.5':''}">
      ${a.img
        ? `<img src="${a.img}" style="width:44px;height:44px;object-fit:cover;border-radius:8px;flex-shrink:0;">`
        : `<div style="width:44px;height:44px;border-radius:8px;background:#eee;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:20px;">📢</div>`
      }
      <div style="flex:1;min-width:0;">
        <div style="font-size:12px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${a.title||'(タイトルなし)'}</div>
        <div style="font-size:10px;color:#999;">${a.active===false?'停止中':'表示中'}</div>
      </div>
      <div style="display:flex;gap:6px;flex-shrink:0;">
        <button onclick="editAd('${a.id}')" style="padding:5px 10px;border:1px solid #ddd;border-radius:6px;font-size:11px;background:#fff;cursor:pointer;">編集</button>
        <button onclick="toggleAd('${a.id}',${a.active===false})"
          style="padding:5px 10px;border:1px solid #ddd;border-radius:6px;font-size:11px;background:#fff;cursor:pointer;color:${a.active===false?'#0a7c3e':'#C9082A'};">
          ${a.active===false?'再開':'停止'}
        </button>
        <button onclick="deleteAd('${a.id}')" style="padding:5px 10px;border:1px solid #ddd;border-radius:6px;font-size:11px;background:#fff;cursor:pointer;">削除</button>
      </div>
    </div>`).join('');
}

function openNewAd() {
  document.getElementById('adForm').style.display = 'block';
  document.getElementById('adEditId').value = '';
  document.getElementById('adTitle').value = '';
  document.getElementById('adDesc').value = '';
  document.getElementById('adCta').value = '';
  document.getElementById('adImg').value = '';
  document.getElementById('adLink').value = '';
  document.getElementById('adSubmitBtn').textContent = '保存する';
}

function cancelAdEdit() {
  document.getElementById('adForm').style.display = 'none';
}

async function submitAd() {
  const title = document.getElementById('adTitle').value.trim();
  const desc  = document.getElementById('adDesc').value.trim();
  const cta   = document.getElementById('adCta').value.trim();
  const img   = document.getElementById('adImg').value.trim();
  const link  = document.getElementById('adLink').value.trim();
  const editId = document.getElementById('adEditId').value;
  if (!title || !link) { alert('タイトルとリンクURLは必須です'); return; }
  const btn = document.getElementById('adSubmitBtn');
  btn.textContent = '保存中...'; btn.disabled = true;
  const payload = { title, desc, cta, img, link, active: true, ts: Date.now() };
  try {
    if (editId) {
      await fetch(`${FB_ADS}/${editId}.json`, { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) });
    } else {
      await fetch(`${FB_ADS}.json`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) });
    }
    document.getElementById('adForm').style.display = 'none';
    loadAdminAds();
  } catch(e) { alert('保存に失敗しました'); }
  btn.textContent = '保存する'; btn.disabled = false;
}

async function editAd(id) {
  const res = await fetch(`${FB_ADS}/${id}.json`);
  const d = await res.json();
  document.getElementById('adForm').style.display = 'block';
  document.getElementById('adEditId').value = id;
  document.getElementById('adTitle').value = d.title || '';
  document.getElementById('adDesc').value = d.desc || '';
  document.getElementById('adCta').value = d.cta || '';
  document.getElementById('adImg').value = d.img || '';
  document.getElementById('adLink').value = d.link || '';
  document.getElementById('adSubmitBtn').textContent = '上書き保存';
}

async function toggleAd(id, currentlyInactive) {
  await fetch(`${FB_ADS}/${id}.json`, { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ active: currentlyInactive }) });
  loadAdminAds();
}

async function deleteAd(id) {
  if (!confirm('この広告を削除しますか？')) return;
  await fetch(`${FB_ADS}/${id}.json`, { method: 'DELETE' });
  loadAdminAds();
}
