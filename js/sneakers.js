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
          ${s.gymOk ? '<span style="font-size:.55rem;background:#0a7c3e;color:#fff;padding:.1rem .5rem;border-radius:10px;font-weight:700;">🏋️ ジムにもOK</span>' : ''}
          <span style="font-size:.6rem;background:var(--bg3);color:var(--tx3);padding:.1rem .5rem;border-radius:10px;">${BRANDS[s.brand]||s.brand||''}</span>
          ${s.player ? `<span style="font-size:.6rem;color:var(--tx3);">👤 ${s.player}</span>` : ''}
        </div>
        <div style="font-size:.9rem;font-weight:700;color:var(--tx);margin-bottom:.3rem;">${s.model||s.name||''}</div>
        ${s.score ? `<div style="display:flex;align-items:center;gap:.3rem;margin-bottom:.4rem;"><span style="font-size:.7rem;color:var(--tx3);">評価</span><div style="flex:1;background:var(--bg3);border-radius:10px;height:6px;"><div style="width:${s.score}%;background:${snkScoreColor(s.score)};border-radius:10px;height:6px;"></div></div><span style="font-size:.75rem;font-weight:700;color:${snkScoreColor(s.score)};">${s.score}/100</span></div>` : ''}
        ${s.desc ? `<div style="font-size:.75rem;color:var(--tx2);line-height:1.6;margin-bottom:.5rem;">${s.desc}</div>` : ''}
        <div style="display:flex;align-items:center;justify-content:space-between;">
          ${s.price ? `<span style="font-size:.9rem;font-weight:700;color:var(--or);">${s.price}</span>` : '<span></span>'}
          ${(s.linkAmazon||s.linkRakuten||s.linkStockx||s.linkSnkrdunk||s.link) ? `<a href="${s.linkAmazon||s.linkRakuten||s.linkStockx||s.linkSnkrdunk||s.link}" target="_blank" onclick="event.stopPropagation()" style="background:var(--or);color:#fff;padding:.4rem .9rem;border-radius:8px;font-size:.75rem;font-weight:700;text-decoration:none;">購入する →</a>` : ''}
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
function calcSneakerScore() {
  const vals = ['sneakerScoreCushion','sneakerScoreHold','sneakerScoreTraction','sneakerScoreWeight']
    .map(id => parseInt(document.getElementById(id).value, 10))
    .filter(v => !isNaN(v));
  if (!vals.length) return null;
  return Math.round(vals.reduce((a,b) => a+b, 0) / vals.length);
}

async function uploadSneakerImage(input, fieldId) {
  const file = input.files && input.files[0];
  if (!file) return;
  const field = document.getElementById(fieldId);
  const label = input.parentElement.querySelector('.snkUploadLabel');
  const originalLabel = label ? label.textContent : '';
  if (label) label.textContent = 'アップロード中...';
  try {
    const form = new FormData();
    form.append('image', file);
    const res = await fetch('https://api.imgbb.com/1/upload?key=7a3e4b2c1d5f6e8a9b0c3d4e5f6a7b8c', {
      method: 'POST', body: form
    });
    const data = await res.json();
    if (data && data.data && data.data.url) {
      field.value = data.data.url;
    } else {
      alert('アップロードに失敗しました');
    }
  } catch (e) {
    alert('アップロードに失敗しました: ' + e.message);
  } finally {
    if (label) label.textContent = originalLabel;
    input.value = '';
  }
}

async function submitSneaker() {
  const name   = document.getElementById('sneakerModel').value.trim();
  const brand  = document.getElementById('sneakerBrand').value;
  const player = document.getElementById('sneakerPlayer').value.trim();
  const img    = document.getElementById('sneakerImg').value.trim();
  const img2   = document.getElementById('sneakerImg2').value.trim();
  const img3   = document.getElementById('sneakerImg3').value.trim();
  const img4   = document.getElementById('sneakerImg4').value.trim();
  const price  = document.getElementById('sneakerPrice').value.trim();
  const scoreCushion  = document.getElementById('sneakerScoreCushion').value.trim();
  const scoreHold     = document.getElementById('sneakerScoreHold').value.trim();
  const scoreTraction = document.getElementById('sneakerScoreTraction').value.trim();
  const scoreWeight   = document.getElementById('sneakerScoreWeight').value.trim();
  const sizeFeel  = document.getElementById('sneakerSizeFeel').value.trim();
  const position  = document.getElementById('sneakerPosition').value.trim();
  const linkAmazon    = document.getElementById('sneakerLinkAmazon').value.trim();
  const linkRakuten   = document.getElementById('sneakerLinkRakuten').value.trim();
  const linkStockx    = document.getElementById('sneakerLinkStockx').value.trim();
  const linkSnkrdunk  = document.getElementById('sneakerLinkSnkrdunk').value.trim();
  const gymOk = document.getElementById('sneakerGymOk') ? document.getElementById('sneakerGymOk').checked : false;
  const editId = document.getElementById('sneakerEditId')?.value;

  if (!name) { alert('モデル名は必須です'); return; }

  const btn = document.getElementById('sneakerSubmitBtn');
  btn.textContent = '投稿中...'; btn.disabled = true;

  const score = calcSneakerScore();
  const payload = {
    brand, model: name, player, img, img2, img3, img4, price,
    scoreCushion, scoreHold, scoreTraction, scoreWeight, score,
    sizeFeel, position,
    linkAmazon, linkRakuten, linkStockx, linkSnkrdunk,
    gymOk,
    link: linkAmazon, // 旧フィールドとの互換用
    ts: Date.now()
  };
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

function snkScoreColor(val) {
  const v = parseInt(val, 10);
  if (v >= 95) return '#FFD700';
  if (v >= 90) return '#FF8C00';
  return '#C9082A';
}

function snkScoreBar(label, val) {
  if (val === undefined || val === null || val === '') return '';
  const c = snkScoreColor(val);
  return '<div style="margin-bottom:8px;">' +
    '<div style="display:flex;justify-content:space-between;font-size:11px;color:#666;margin-bottom:3px;"><span>' + label + '</span><span style="font-weight:700;color:' + c + ';">' + val + '/100</span></div>' +
    '<div style="background:#eee;border-radius:10px;height:6px;"><div style="width:' + val + '%;background:' + c + ';border-radius:10px;height:6px;"></div></div>' +
  '</div>';
}

function openSnkModal(id) {
  const modal = document.getElementById('snkModal');
  const body = document.getElementById('snkModalBody');
  if (!modal || !body) return;
  
  const s = (_allSneakers || []).find(s => s.id === id);
  if (!s) return;

  const links = [
    s.linkAmazon   ? {label:'Amazon',         url:s.linkAmazon,   bg:'#ff9900'} : null,
    s.linkRakuten  ? {label:'楽天',            url:s.linkRakuten,  bg:'#bf0000'} : null,
    s.linkStockx   ? {label:'StockX',         url:s.linkStockx,   bg:'#00a651'} : null,
    s.linkSnkrdunk ? {label:'スニーカーダンク', url:s.linkSnkrdunk, bg:'#000'}    : null,
  ].filter(Boolean);
  
  body.innerHTML = 
    (function() {
      const imgs = [s.img, s.img2, s.img3, s.img4].filter(Boolean);
      if (!imgs.length) return '';
      if (imgs.length === 1) {
        return '<img src="' + imgs[0] + '" style="width:100%;height:220px;object-fit:cover;border-radius:8px;margin-bottom:1rem;">';
      }
      return '<div style="display:flex;gap:8px;overflow-x:auto;margin-bottom:1rem;-webkit-overflow-scrolling:touch;scroll-snap-type:x mandatory;">' +
        imgs.map(u => '<img src="' + u + '" style="flex:0 0 85%;scroll-snap-align:start;height:220px;object-fit:cover;border-radius:8px;">').join('') +
      '</div>' +
      '<div style="text-align:center;font-size:10px;color:#999;margin:-8px 0 12px;">← スワイプして他のアングルも見る (' + imgs.length + '枚) →</div>';
    })() +
    '<div style="font-family:Bebas Neue,sans-serif;font-size:11px;color:#C9082A;letter-spacing:1px;">' + (s.brand||'') + '</div>' +
    (s.gymOk ? '<span style="display:inline-block;margin:4px 0;font-size:11px;background:#0a7c3e;color:#fff;padding:.2rem .6rem;border-radius:10px;font-weight:700;">🏋️ ジムにもOK</span>' : '') +
    '<div style="font-size:20px;font-weight:700;margin:4px 0 8px;">' + (s.model||s.name||'') + '</div>' +
    (s.player ? '<div style="font-size:13px;color:#666;margin-bottom:8px;">着用選手: ' + s.player + '</div>' : '') +
    (s.price ? '<div style="font-size:16px;font-weight:700;color:#C9082A;margin-bottom:12px;">' + s.price + '</div>' : '') +
    ((s.scoreCushion || s.scoreHold || s.scoreTraction || s.scoreWeight) ?
      '<div style="background:#fafafa;border:1px solid #eee;border-radius:10px;padding:12px;margin-bottom:12px;">' +
        '<div style="font-size:11px;font-weight:700;color:#999;margin-bottom:8px;">機能スコア</div>' +
        snkScoreBar('クッション性', s.scoreCushion) +
        snkScoreBar('ホールド感', s.scoreHold) +
        snkScoreBar('トラクション', s.scoreTraction) +
        snkScoreBar('軽量性', s.scoreWeight) +
      '</div>' : '') +
    (s.sizeFeel ? '<div style="font-size:12px;color:#333;margin-bottom:6px;"><b>サイズ感：</b>' + s.sizeFeel + '</div>' : '') +
    (s.position ? '<div style="font-size:12px;color:#333;margin-bottom:12px;"><b>おすすめ：</b>' + s.position + '</div>' : '') +
    (links.length ? '<div style="display:flex;flex-direction:column;gap:8px;margin-top:8px;">' +
      links.map(l => '<a href="' + l.url + '" target="_blank" style="display:block;text-align:center;padding:12px;background:' + l.bg + ';color:#fff;border-radius:8px;font-weight:700;text-decoration:none;font-size:13px;">' + l.label + 'で見る →</a>').join('') +
    '</div>' : '');
  
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
  document.getElementById('sneakerImg2').value = '';
  document.getElementById('sneakerImg3').value = '';
  document.getElementById('sneakerImg4').value = '';
  document.getElementById('sneakerScoreCushion').value = '';
  document.getElementById('sneakerScoreHold').value = '';
  document.getElementById('sneakerScoreTraction').value = '';
  document.getElementById('sneakerScoreWeight').value = '';
  document.getElementById('sneakerSizeFeel').value = '';
  document.getElementById('sneakerPosition').value = '';
  document.getElementById('sneakerLinkAmazon').value = '';
  document.getElementById('sneakerLinkRakuten').value = '';
  document.getElementById('sneakerLinkStockx').value = '';
  document.getElementById('sneakerLinkSnkrdunk').value = '';
  if (document.getElementById('sneakerGymOk')) document.getElementById('sneakerGymOk').checked = false;
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
  document.getElementById('sneakerImg2').value = d.img2 || '';
  document.getElementById('sneakerImg3').value = d.img3 || '';
  document.getElementById('sneakerImg4').value = d.img4 || '';
  document.getElementById('sneakerScoreCushion').value = d.scoreCushion || '';
  document.getElementById('sneakerScoreHold').value = d.scoreHold || '';
  document.getElementById('sneakerScoreTraction').value = d.scoreTraction || '';
  document.getElementById('sneakerScoreWeight').value = d.scoreWeight || '';
  document.getElementById('sneakerSizeFeel').value = d.sizeFeel || '';
  document.getElementById('sneakerPosition').value = d.position || '';
  document.getElementById('sneakerLinkAmazon').value = d.linkAmazon || d.link || '';
  document.getElementById('sneakerLinkRakuten').value = d.linkRakuten || '';
  document.getElementById('sneakerLinkStockx').value = d.linkStockx || '';
  document.getElementById('sneakerLinkSnkrdunk').value = d.linkSnkrdunk || '';
  if (document.getElementById('sneakerGymOk')) document.getElementById('sneakerGymOk').checked = !!d.gymOk;
  document.getElementById('sneakerSubmitBtn').textContent = '上書き保存';
}
