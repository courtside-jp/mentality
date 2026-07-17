// items.js — アイテム情報（Nike等スポーツブランドのアパレル最新情報）
// sneakers.js と同じ仕組み（Firebase RTDB・投稿編集削除・カード表示・詳細モーダル）

const FB_ITEMS = `${FB_URL}/items`;
let _allItems = [];
let _itemTab = 'general';

const ITEM_BRANDS = {
  mamba: '', nike: 'Nike', jordan: 'Jordan', adidas: 'Adidas',
  underarmour: 'Under Armour', puma: 'Puma',
  newbalance: 'New Balance', anta: 'Anta', lining: 'Li-Ning'
};

function switchItemTab(tab) {
  _itemTab = tab;
  const gEl = document.getElementById('itemTab-general');
  const mEl = document.getElementById('itemTab-mamba');
  const head = document.getElementById('itemsPageHead');
  if (tab === 'mamba') {
    if(mEl){mEl.style.background='var(--black)';mEl.style.color='#fff';}
    if(gEl){gEl.style.background='var(--bg3)';gEl.style.color='var(--tx3)';}
    if(head) head.innerHTML = '<div style="font-family:\'Barlow Condensed\',sans-serif;font-size:15px;font-weight:700;letter-spacing:.5px;"> COLLECTION</div><div style="font-size:11px;color:var(--tx3);margin-top:2px;">eBay取り扱いのブランドアイテムをお届け</div>';
  } else {
    if(gEl){gEl.style.background='var(--black)';gEl.style.color='#fff';}
    if(mEl){mEl.style.background='var(--bg3)';mEl.style.color='var(--tx3)';}
    if(head) head.innerHTML = '<div style="font-family:\'Barlow Condensed\',sans-serif;font-size:15px;font-weight:700;letter-spacing:.5px;">アイテム</div><div style="font-size:11px;color:var(--tx3);margin-top:2px;">NBA関連アパレル・グッズ情報</div>';
  }
  applyItemTabFilter();
}

function applyItemTabFilter() {
  const filtered = _itemTab === 'mamba'
    ? _allItems.filter(s => (s.brand||'').toUpperCase() === '')
    : _allItems.filter(s => (s.brand||'').toUpperCase() !== '');
  renderItems(filtered);
}

async function loadItems() {
  const wrap = document.getElementById('itemsWrap');
  if (!wrap) return;
  wrap.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--tx3);font-size:.75rem;">取得中...</div>';

  try {
    const res = await fetch(FB_ITEMS + '.json');
    const data = await res.json();
    if (!data) { wrap.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--tx3);">まだ情報がありません</div>'; return; }
    _allItems = Object.entries(data).map(([id,s]) => ({id,...s})).sort((a,b) => b.ts - a.ts);
    applyItemTabFilter();
  } catch(e) {
    wrap.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--tx3);">取得に失敗しました</div>';
  }
}

function renderItems(list) {
  const wrap = document.getElementById('itemsWrap');
  if (!wrap) return;
  if (!list.length) { wrap.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--tx3);">該当するアイテムがありません</div>'; return; }

  wrap.innerHTML = list.map(s => `
    <div onclick="openItemModal('${s.id}')" style="background:var(--card);border:1px solid var(--bd);border-radius:12px;margin-bottom:.8rem;overflow:hidden;cursor:pointer;">
      ${s.img ? `<img src="${s.img}" style="width:100%;height:200px;object-fit:cover;" onerror="this.style.display='none'">` : '<div style="width:100%;height:160px;background:var(--bg3);display:flex;align-items:center;justify-content:center;font-size:3rem;">👕</div>'}
      <div style="padding:.8rem;">
        <div style="display:flex;align-items:center;gap:.4rem;margin-bottom:.4rem;">
          ${s.isNew ? '<span style="font-size:.55rem;background:#ff5a00;color:#fff;padding:.1rem .5rem;border-radius:10px;font-weight:700;">NEW</span>' : ''}
          <span style="font-size:.6rem;background:var(--bg3);color:var(--tx3);padding:.1rem .5rem;border-radius:10px;">${ITEM_BRANDS[s.brand]||s.brand||''}</span>
          ${s.player ? `<span style="font-size:.6rem;color:var(--tx3);">👤 ${s.player}</span>` : ''}
        </div>
        <div style="font-size:.9rem;font-weight:700;color:var(--tx);margin-bottom:.3rem;">${s.name}</div>
        ${s.desc ? `<div style="font-size:.75rem;color:var(--tx2);line-height:1.6;margin-bottom:.5rem;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${s.desc}</div>` : ''}
        <div style="display:flex;align-items:center;justify-content:space-between;">
          ${s.price ? `<span style="font-size:.9rem;font-weight:700;color:var(--or);">${s.price}</span>` : '<span></span>'}
          ${s.url ? `<a href="${s.url}" target="_blank" style="background:var(--or);color:#fff;padding:.4rem .9rem;border-radius:8px;font-size:.75rem;font-weight:700;text-decoration:none;">購入する →</a>` : ''}
        <a href="${'https://twitter.com/intent/tweet?text=' + encodeURIComponent((s.name||'') + ' #アイテム #COURTSIDE https://courtside-jp.github.io/mentality/')}" target="_blank" style="background:#000;color:#fff;padding:.4rem .6rem;border-radius:8px;font-size:.75rem;text-decoration:none;">𝕏</a>
        </div>
      </div>
    </div>
  `).join('');
}

function filterItems(btn, brand) {
  document.querySelectorAll('#pg-items .conf-btn').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  const filtered = brand === 'all' ? _allItems : _allItems.filter(s => s.brand === brand);
  renderItems(filtered);
}

function filterItemsDropdown() {
  const brand  = document.getElementById('itmFilterBrand').value;
  const player = document.getElementById('itmFilterPlayer').value;
  const filtered = _allItems.filter(s => {
    const brandOK  = brand  === 'all' || s.brand  === brand;
    const playerOK = player === 'all' || (s.player && s.player.includes(player));
    return brandOK && playerOK;
  });
  renderItems(filtered);
}

async function submitItem() {
  const name   = document.getElementById('itemName').value.trim();
  const brand  = document.getElementById('itemBrand').value;
  const player = document.getElementById('itemPlayer').value.trim();
  const desc   = document.getElementById('itemDesc').value.trim();
  const img    = document.getElementById('itemImg').value.trim();
  const price  = document.getElementById('itemPrice').value.trim();
  const url    = document.getElementById('itemLink').value.trim();
  const xUrl   = document.getElementById('itemXUrl').value.trim();
  const editId = document.getElementById('itemEditId')?.value;

  if (!name) { alert('商品名は必須です'); return; }

  const btn = document.getElementById('itemSubmitBtn');
  btn.textContent = '投稿中...'; btn.disabled = true;

  const payload = { brand, name, player, desc, img, price, link: url, xUrl, ts: Date.now() };
  const now = new Date();
  payload.date = now.getFullYear() + '/' + String(now.getMonth()+1).padStart(2,'0') + '/' + String(now.getDate()).padStart(2,'0');

  if (editId) {
    await fetch(`${FB_ITEMS}/${editId}.json`, {
      method: 'PATCH', headers: {'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
  } else {
    await fetch(FB_ITEMS + '.json', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
  }

  btn.textContent = '投稿する'; btn.disabled = false;
  document.getElementById('itemForm').style.display = 'none';
  loadAdminItems();
  loadItems();
}

async function openItemModal(id) {
  const modal = document.getElementById('itmModal');
  const body = document.getElementById('itmModalBody');
  if (!modal || !body) return;

  let s = (_allItems || []).find(s => s.id === id);
  if (!s) {
    try {
      const res = await fetch(`${FB_ITEMS}/${id}.json`);
      const d = await res.json();
      if (d) s = { id, ...d };
    } catch(e) {}
  }
  if (!s) return;

  body.innerHTML =
    (s.img ? '<img src="' + s.img + '" style="width:100%;height:220px;object-fit:cover;border-radius:8px;margin-bottom:1rem;">' : '') +
    '<div style="font-family:Bebas Neue,sans-serif;font-size:11px;color:#C9082A;letter-spacing:1px;">' + (ITEM_BRANDS[s.brand]||s.brand||'') + '</div>' +
    '<div style="font-size:20px;font-weight:700;margin:4px 0 8px;">' + (s.name||'') + '</div>' +
    (s.player ? '<div style="font-size:13px;color:#666;margin-bottom:8px;">関連選手: ' + s.player + '</div>' : '') +
    (s.desc ? '<div style="font-size:13px;color:#444;line-height:1.7;margin-bottom:12px;">' + s.desc + '</div>' : '') +
    (s.price ? '<div style="font-size:16px;font-weight:700;color:#C9082A;margin-bottom:12px;">' + s.price + '</div>' : '') +
    (s.link ? '<a href="' + s.link + '" target="_blank" style="display:block;text-align:center;padding:12px;background:#C9082A;color:#fff;border-radius:8px;font-weight:700;text-decoration:none;">商品を見る</a>' : '');

  if (s.xUrl) {
    body.innerHTML += '<blockquote class="twitter-tweet"><a href="' + s.xUrl + '"></a></blockquote>';
    setTimeout(function() { if (window.twttr && twttr.widgets) twttr.widgets.load(); }, 50);
  }

  // SEO: アイテムタイトルをセット
  document.title = (s.name||'アイテム') + ' | NBAアパレル | COURTSIDE';
  const md2 = document.querySelector('meta[name="description"]');
  if (md2) md2.setAttribute('content', (s.brand?s.brand+' ':''+(s.name||''))+'。NBAバスケットボール関連アパレル・グッズ情報。'+(s.price?'価格：'+s.price+' ':'')+' | COURTSIDE');

  modal.style.display = 'block';
}

function closeItemModal() {
  const modal = document.getElementById('itmModal');
  if (modal) modal.style.display = 'none';
  document.title = 'COURTSIDE - NBA速報・まとめ';
}

async function loadAdminItems() {
  const wrap = document.getElementById('adminItemList');
  if (!wrap) return;
  wrap.innerHTML = '<div style="text-align:center;padding:1rem;color:#999;font-size:12px;">読み込み中...</div>';
  try {
    const res = await fetch(`${FB_ITEMS}.json?orderBy="$key"&limitToLast=200`);
    const data = await res.json();
    if (!data) { wrap.innerHTML = '<div style="text-align:center;padding:1rem;color:#999;">アイテムなし</div>'; return; }
    const items = Object.entries(data).reverse();
    wrap.innerHTML = items.map(([id, s]) => `
      <div style="background:#fff;border-bottom:1px solid #f0f0f0;padding:12px 14px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
          <div style="font-size:9px;color:#C9082A;font-weight:700;background:rgba(201,8,42,0.08);padding:2px 6px;border-radius:4px;">${s.brand||''}</div>
          <div style="font-size:9px;color:#999;">${s.date||''}</div>
        </div>
        <div style="font-size:13px;font-weight:700;color:#000;margin-bottom:4px;">${s.name||'無題'}</div>
        <div style="font-size:11px;color:#666;margin-bottom:8px;">${s.player||''} ${s.price ? '· ' + s.price : ''}</div>
        <div style="display:flex;gap:6px;">
          <button onclick="editItem('${id}')" style="flex:1;padding:6px;background:#f5f5f5;border:1px solid #eee;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;">編集</button>
          <button onclick="deleteItem('${id}')" style="flex:1;padding:6px;background:rgba(201,8,42,0.08);border:1px solid rgba(201,8,42,0.2);border-radius:6px;font-size:11px;font-weight:700;color:#C9082A;cursor:pointer;">削除</button>
        </div>
      </div>
    `).join('');
  } catch(e) {
    wrap.innerHTML = '<div style="text-align:center;padding:1rem;color:#999;">取得失敗</div>';
  }
}

async function deleteItem(id) {
  if (!confirm('このアイテムを削除しますか？')) return;
  await fetch(`${FB_ITEMS}/${id}.json`, { method: 'DELETE' });
  loadAdminItems();
  loadItems();
}

function openNewItem() {
  document.getElementById('itemForm').style.display = 'block';
  document.getElementById('itemEditId').value = '';
  document.getElementById('itemName').value = '';
  document.getElementById('itemPlayer').value = '';
  document.getElementById('itemDesc').value = '';
  document.getElementById('itemPrice').value = '';
  document.getElementById('itemImg').value = '';
  document.getElementById('itemLink').value = '';
  document.getElementById('itemXUrl').value = '';
  document.getElementById('itemSubmitBtn').textContent = '投稿する';
}

function cancelItemEdit() {
  document.getElementById('itemForm').style.display = 'none';
}

async function editItem(id) {
  const res = await fetch(`${FB_ITEMS}/${id}.json`);
  const d = await res.json();
  document.getElementById('itemForm').style.display = 'block';
  document.getElementById('itemEditId').value = id;
  document.getElementById('itemBrand').value = d.brand || 'nike';
  document.getElementById('itemName').value = d.name || '';
  document.getElementById('itemPlayer').value = d.player || '';
  document.getElementById('itemDesc').value = d.desc || '';
  document.getElementById('itemPrice').value = d.price || '';
  document.getElementById('itemImg').value = d.img || '';
  document.getElementById('itemLink').value = d.link || '';
  document.getElementById('itemXUrl').value = d.xUrl || '';
  document.getElementById('itemSubmitBtn').textContent = '上書き保存';
}
