// sneakers.js — バッシュ情報

const FB_SNEAKERS = `${FB_URL}/sneakers`;
let _allSneakers = [];

const BRANDS = {
  nike: 'Nike', jordan: 'Jordan', adidas: 'Adidas',
  underarmour: 'Under Armour', puma: 'Puma',
  newbalance: 'New Balance', anta: 'Anta', lining: 'Li-Ning'
};

async function loadSneakers() {
  const wrap = document.getElementById('sneakersWrap');
  if (!wrap) return;
  wrap.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--tx3);font-size:.75rem;">取得中...</div>';

  try {
    const res = await fetch(FB_SNEAKERS + '.json');
    const data = await res.json();
    if (!data) { wrap.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--tx3);">まだ情報がありません</div>'; return; }
    _allSneakers = Object.entries(data).map(([id,s]) => ({id,...s})).sort((a,b) => b.ts - a.ts);
    renderSneakers(_allSneakers);
  } catch(e) {
    wrap.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--tx3);">取得に失敗しました</div>';
  }
}

function renderSneakers(list) {
  const wrap = document.getElementById('sneakersWrap');
  if (!wrap) return;
  if (!list.length) { wrap.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--tx3);">該当するバッシュがありません</div>'; return; }

  wrap.innerHTML = list.map(s => `
    <div onclick="openSnkModal('${s.id}')" style="background:var(--card);border:1px solid var(--bd);border-radius:12px;margin-bottom:.8rem;overflow:hidden;cursor:pointer;">
      ${s.img ? `<img src="${s.img}" style="width:100%;height:200px;object-fit:cover;" onerror="this.style.display='none'">` : '<div style="width:100%;height:160px;background:var(--bg3);display:flex;align-items:center;justify-content:center;font-size:3rem;">👟</div>'}
      <div style="padding:.8rem;">
        <div style="display:flex;align-items:center;gap:.4rem;margin-bottom:.4rem;">
          ${s.isNew ? '<span style="font-size:.55rem;background:#ff5a00;color:#fff;padding:.1rem .5rem;border-radius:10px;font-weight:700;">NEW</span>' : ''}
          <span style="font-size:.6rem;background:var(--bg3);color:var(--tx3);padding:.1rem .5rem;border-radius:10px;">${BRANDS[s.brand]||s.brand||''}</span>
          ${s.player ? `<span style="font-size:.6rem;color:var(--tx3);">👤 ${s.player}</span>` : ''}
        </div>
        <div style="font-size:.9rem;font-weight:700;color:var(--tx);margin-bottom:.3rem;">${s.name}</div>
        ${s.score ? `<div style="display:flex;align-items:center;gap:.3rem;margin-bottom:.4rem;"><span style="font-size:.7rem;color:var(--tx3);">評価</span><div style="flex:1;background:var(--bg3);border-radius:10px;height:6px;"><div style="width:${s.score}%;background:var(--or);border-radius:10px;height:6px;"></div></div><span style="font-size:.75rem;font-weight:700;color:var(--or);">${s.score}/100</span></div>` : ''}
        ${s.desc ? `<div style="font-size:.75rem;color:var(--tx2);line-height:1.6;margin-bottom:.5rem;">${s.desc}</div>` : ''}
        <div style="display:flex;align-items:center;justify-content:space-between;">
          ${s.price ? `<span style="font-size:.9rem;font-weight:700;color:var(--or);">${s.price}</span>` : '<span></span>'}
          ${s.url ? `<a href="${s.url}" target="_blank" style="background:var(--or);color:#fff;padding:.4rem .9rem;border-radius:8px;font-size:.75rem;font-weight:700;text-decoration:none;">購入する →</a>` : ''}
        <a href="${'https://twitter.com/intent/tweet?text=' + encodeURIComponent(s.name + ' #バッシュ #COURTSIDE https://yasukou1202.github.io/mentality/')}" target="_blank" style="background:#000;color:#fff;padding:.4rem .6rem;border-radius:8px;font-size:.75rem;text-decoration:none;">𝕏</a>
        </div>
      </div>
    </div>
  `).join('');
}

function filterSneakers(btn, brand) {
  document.querySelectorAll('#pg-sneakers .conf-btn').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  const filtered = brand === 'all' ? _allSneakers : _allSneakers.filter(s => s.brand === brand);
  renderSneakers(filtered);
}

// 管理画面から投稿
async function submitSneaker() {
  const name   = document.getElementById('sneakerModel').value.trim();
  const brand  = document.getElementById('sneakerBrand').value;
  const player = document.getElementById('sneakerPlayer').value.trim();
  const img    = document.getElementById('sneakerImg').value.trim();
  const price  = document.getElementById('sneakerPrice').value.trim();
  const url    = document.getElementById('sneakerLink').value.trim();
  const editId = document.getElementById('sneakerEditId')?.value;

  if (!name) { alert('モデル名は必須です'); return; }

  const btn = document.getElementById('sneakerSubmitBtn');
  btn.textContent = '投稿中...'; btn.disabled = true;

  const payload = { brand, model: name, player, img, price, link: url, ts: Date.now() };
  const now = new Date();
  payload.date = now.getFullYear() + '/' + String(now.getMonth()+1).padStart(2,'0') + '/' + String(now.getDate()).padStart(2,'0');

  if (editId) {
    await fetch(`${FB_SNEAKERS}/${editId}.json`, {
      method: 'PATCH', headers: {'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
  } else {
    await fetch(FB_SNEAKERS + '.json', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
  }

  btn.textContent = '投稿する'; btn.disabled = false;
  document.getElementById('sneakerForm').style.display = 'none';
  loadAdminSneakers();
  loadSneakers();
}

function openSnkModal(id) {
  const modal = document.getElementById('snkModal');
  const body = document.getElementById('snkModalBody');
  if (!modal || !body) return;
  
  const s = (_allSneakers || []).find(s => s.id === id);
  if (!s) return;
  
  body.innerHTML = 
    (s.img ? '<img src="' + s.img + '" style="width:100%;height:220px;object-fit:cover;border-radius:8px;margin-bottom:1rem;">' : '') +
    '<div style="font-family:Bebas Neue,sans-serif;font-size:11px;color:#C9082A;letter-spacing:1px;">' + (s.brand||'') + '</div>' +
    '<div style="font-size:20px;font-weight:700;margin:4px 0 8px;">' + (s.model||s.name||'') + '</div>' +
    (s.player ? '<div style="font-size:13px;color:#666;margin-bottom:8px;">着用選手: ' + s.player + '</div>' : '') +
    (s.price ? '<div style="font-size:16px;font-weight:700;color:#C9082A;margin-bottom:12px;">' + s.price + '</div>' : '') +
    (s.link ? '<a href="' + s.link + '" target="_blank" style="display:block;text-align:center;padding:12px;background:#C9082A;color:#fff;border-radius:8px;font-weight:700;text-decoration:none;">Amazonで見る</a>' : '');
  
  modal.style.display = 'block';
}

function closeSnkModal() {
  const modal = document.getElementById('snkModal');
  if (modal) modal.style.display = 'none';
}

function filterSneakersDropdown() {
  const brand  = document.getElementById('snkFilterBrand').value;
  const player = document.getElementById('snkFilterPlayer').value;
  const filtered = _allSneakers.filter(s => {
    const brandOK  = brand  === 'all' || s.brand  === brand;
    const playerOK = player === 'all' || (s.player && s.player.includes(player));
    return brandOK && playerOK;
  });
  renderSneakers(filtered);
}

async function loadAdminSneakers() {
  const wrap = document.getElementById('adminSneakerList');
  if (!wrap) return;
  wrap.innerHTML = '<div style="text-align:center;padding:1rem;color:#999;font-size:12px;">読み込み中...</div>';
  try {
    const res = await fetch(`${FB_SNEAKERS}.json?orderBy="$key"&limitToLast=200`);
    const data = await res.json();
    if (!data) { wrap.innerHTML = '<div style="text-align:center;padding:1rem;color:#999;">バッシュなし</div>'; return; }
    const items = Object.entries(data).reverse();
    wrap.innerHTML = items.map(([id, s]) => `
      <div style="background:#fff;border-bottom:1px solid #f0f0f0;padding:12px 14px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
          <div style="font-size:9px;color:#C9082A;font-weight:700;background:rgba(201,8,42,0.08);padding:2px 6px;border-radius:4px;">${s.brand||''}</div>
          <div style="font-size:9px;color:#999;">${s.date||''}</div>
        </div>
        <div style="font-size:13px;font-weight:700;color:#000;margin-bottom:4px;">${s.model||s.name||'無題'}</div>
        <div style="font-size:11px;color:#666;margin-bottom:8px;">${s.player||''} ${s.price ? '· ' + s.price : ''}</div>
        <div style="display:flex;gap:6px;">
          <button onclick="editSneaker('${id}')" style="flex:1;padding:6px;background:#f5f5f5;border:1px solid #eee;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;">編集</button>
          <button onclick="deleteSneaker('${id}')" style="flex:1;padding:6px;background:rgba(201,8,42,0.08);border:1px solid rgba(201,8,42,0.2);border-radius:6px;font-size:11px;font-weight:700;color:#C9082A;cursor:pointer;">削除</button>
        </div>
      </div>
    `).join('');
  } catch(e) {
    wrap.innerHTML = '<div style="text-align:center;padding:1rem;color:#999;">取得失敗</div>';
  }
}

async function deleteSneaker(id) {
  if (!confirm('このバッシュを削除しますか？')) return;
  await fetch(`${FB_SNEAKERS}/${id}.json`, { method: 'DELETE' });
  loadAdminSneakers();
  loadSneakers();
}

function openNewSneaker() {
  document.getElementById('sneakerForm').style.display = 'block';
  document.getElementById('sneakerEditId').value = '';
  document.getElementById('sneakerModel').value = '';
  document.getElementById('sneakerPlayer').value = '';
  document.getElementById('sneakerPrice').value = '';
  document.getElementById('sneakerImg').value = '';
  document.getElementById('sneakerLink').value = '';
  document.getElementById('sneakerSubmitBtn').textContent = '投稿する';
}

function cancelSneakerEdit() {
  document.getElementById('sneakerForm').style.display = 'none';
}

async function editSneaker(id) {
  const res = await fetch(`${FB_SNEAKERS}/${id}.json`);
  const d = await res.json();
  document.getElementById('sneakerForm').style.display = 'block';
  document.getElementById('sneakerEditId').value = id;
  document.getElementById('sneakerBrand').value = d.brand || 'Nike';
  document.getElementById('sneakerModel').value = d.model || '';
  document.getElementById('sneakerPlayer').value = d.player || '';
  document.getElementById('sneakerPrice').value = d.price || '';
  document.getElementById('sneakerImg').value = d.img || '';
  document.getElementById('sneakerLink').value = d.link || '';
  document.getElementById('sneakerSubmitBtn').textContent = '上書き保存';
}
