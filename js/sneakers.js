// ===== \u30d0\u30c3\u30b7\u30e5\u30ec\u30d3\u30e5\u30fc\u30c6\u30f3\u30d7\u30ec\u30fc\u30c8 =====
window.SNK_REVIEW_TEMPLATE = `■ 基本情報
ブランド：
着用NBA選手：
価格：
発売日：
日本発売：あり / なし

【① 部活生（中高生）視点】
■ 価格
親を説得できる価格帯か？同価格帯の他モデルとの比較。

■ 耐久性
毎日2時間の練習で何ヶ月もつか。消耗しやすい箇所は？

■ グリップ
体育館の床での滑りにくさ。急停止・切り返しの安心感。

■ 足幅・フィット感
日本人の足幅に合うか。ハーフサイズ上げが必要か。

■ コスパ
価格に対してのパフォーマンス評価。

部活生おすすめ度：★★★☆☆

【② NBA層（社会人）視点】
■ なぜこの選手はこのバッシュを選んだのか
プレースタイルとシューズの設計思想のつながり。

■ 実際の試合での使われ方
NBAの試合映像から見えるプレーとの親和性。

■ 街履きとしての評価
アスレジャーとして私服に合わせられるか。

■ ストーリー・哲学
このバッシュが持つブランドのメンタリティとは何か。

NBA層おすすめ度：★★★★☆

■ 最安値情報
・Nike/adidas公式：円
・Amazon：円
・楽天：円
→ 一番安く買えるのはここ（リンク）

■ まとめ
買うべき人：
見送るべき人：`;

// sneakers.js — バッシュ情報

const FB_SNEAKERS = `${FB_URL}/sneakers`;
let _allSneakers = [];

const BRANDS = {
  nike: 'Nike', jordan: 'Jordan', adidas: 'Adidas',
  underarmour: 'Under Armour', puma: 'Puma',
  newbalance: 'New Balance', anta: 'Anta', lining: 'Li-Ning', on: 'On Running'
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


function snkScoreColor(score) {
  if (score >= 95) return '#f0a500';
  if (score >= 90) return '#27ae60';
  return '#e63946';
}
function renderSneakers(list) {
  const wrap = document.getElementById('sneakersWrap');
  if (!wrap) return;
  if (!list || !list.length) {
    wrap.innerHTML = '<div style="text-align:center;padding:40px;color:#999;font-size:13px;">バッシュがまだ登録されていません</div>';
    return;
  }
  // スマホ：1列、タブレット以上：2列
  wrap.style.cssText = 'display:grid;grid-template-columns:1fr;gap:14px;padding:0;';
  wrap.innerHTML = list.map(s => {
    const score = calcSneakerScore(s);
    const scoreColor = snkScoreColor(score);
    const shops = s.shops || [];
    const scoreItems = [
      {lbl:'クッション', val:s.cushion||0},
      {lbl:'グリップ', val:s.traction||0},
      {lbl:'軽量性', val:s.weight||0},
      {lbl:'コスパ', val:s.cost||0}
    ];
    const imgs = s.images || [];
    const imgHtml = imgs.length
      ? `<div style="width:100%;background:var(--surface-1);border-radius:10px 10px 0 0;overflow:hidden;position:relative;">
          <img src="${imgs[0]}" style="width:100%;height:200px;object-fit:cover;">
          ${imgs.length > 1 ? `<details style="background:rgba(0,0,0,0.7);padding:0;position:absolute;bottom:0;left:0;right:0;">
            <summary style="padding:8px 12px;color:#fff;font-size:11px;cursor:pointer;list-style:none;display:flex;align-items:center;justify-content:space-between;">
              <span>📷 全${imgs.length}枚を見る</span><span>▼</span>
            </summary>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:2px;padding:2px;">
              ${imgs.slice(1).map(img => `<img src="${img}" style="width:100%;height:80px;object-fit:cover;">`).join('')}
            </div>
          </details>` : ''}
          ${s.badge ? `<span style="position:absolute;top:10px;left:10px;background:#e63946;color:#fff;font-size:10px;font-weight:500;padding:3px 8px;border-radius:5px;">${s.badge}</span>` : ''}
        </div>`
      : `<div style="width:100%;height:140px;background:var(--surface-1);border-radius:10px 10px 0 0;display:flex;align-items:center;justify-content:center;position:relative;">
          <i class="ti ti-shoe" style="font-size:56px;color:var(--text-muted);"></i>
          ${s.badge ? `<span style="position:absolute;top:10px;left:10px;background:#e63946;color:#fff;font-size:10px;font-weight:500;padding:3px 8px;border-radius:5px;">${s.badge}</span>` : ''}
        </div>`;

    const shopsHtml = shops.length ? `
      <table style="width:100%;border-collapse:collapse;margin-bottom:12px;">
        ${shops.map(sh => `
        <tr style="border-bottom:0.5px solid var(--border);">
          <td style="padding:7px 4px;font-size:12px;font-weight:500;color:var(--text-secondary);white-space:nowrap;">${sh.icon||''} ${sh.name}</td>
          <td style="padding:7px 4px;text-align:center;">${sh.lowest?'<span style="background:#fff3e0;color:#bf6000;font-size:9px;font-weight:500;padding:2px 5px;border-radius:3px;">最安値</span>':''}</td>
          <td style="padding:7px 4px;font-size:13px;font-weight:500;color:var(--text-primary);text-align:right;white-space:nowrap;">${sh.price||'確認する'}</td>
          <td style="padding:7px 4px 7px 8px;"><button onclick="event.stopPropagation();window.open('${sh.url}','_blank')" style="padding:5px 12px;border-radius:6px;border:0.5px solid var(--border-strong);background:var(--surface-1);color:var(--text-primary);font-size:11px;font-weight:500;cursor:pointer;">買う</button></td>
        </tr>`).join('')}
      </table>` : '';

    return `
    <div onclick="openSnkModal('${s.id}')" style="background:var(--surface-2);border:0.5px solid var(--border);border-radius:12px;overflow:hidden;cursor:pointer;">
      ${imgHtml}
      <div style="padding:14px;">
        <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px;">${s.brand||''}</div>
        <div style="font-size:15px;font-weight:500;color:var(--text-primary);margin-bottom:12px;">${s.model||''}</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:12px;">
          ${scoreItems.map(i => `
          <div style="background:var(--surface-1);border-radius:8px;padding:8px 10px;">
            <div style="font-size:10px;color:var(--text-muted);margin-bottom:4px;">${i.lbl}</div>
            <div style="height:5px;background:var(--border);border-radius:3px;overflow:hidden;margin-bottom:4px;">
              <div style="height:100%;background:${snkScoreColor(i.val)};border-radius:3px;width:${i.val}%"></div>
            </div>
            <div style="font-size:13px;font-weight:500;color:${snkScoreColor(i.val)};">${i.val}</div>
          </div>`).join('')}
        </div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;padding:10px;background:var(--surface-1);border-radius:8px;">
          <div style="font-size:32px;font-weight:500;color:${scoreColor};">${score}</div>
          <div>
            <div style="font-size:11px;color:var(--text-muted);">総合スコア / 100</div>
            ${score>=95?'<div style="font-size:10px;color:#f0a500;font-weight:500;">🏆 プレミアム</div>':score>=90?'<div style="font-size:10px;color:#27ae60;font-weight:500;">✅ おすすめ</div>':''}
          </div>
        </div>
        ${shopsHtml}
        <button onclick="event.stopPropagation();openSnkModal('${s.id}')" style="width:100%;padding:10px 0;border-radius:8px;border:none;font-size:12px;font-weight:500;cursor:pointer;background:var(--surface-1);color:var(--text-primary);border:0.5px solid var(--border-strong);">📊 詳細スコアを見る</button>
      </div>
    </div>`;
  }).join('');
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
      review: document.getElementById('sneakerReview')?.value || '',
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
  const s = (_allSneakers || []).find(x => x.id === id);
  if (!s) return;
  const score = calcSneakerScore(s);
  const scoreColor = snkScoreColor(score);
  const shops = s.shops || [];
  const imgs = s.images || [];
  const scoreItems = [
    {lbl:'クッション', val:s.cushion||0},
    {lbl:'グリップ', val:s.traction||0},
    {lbl:'軽量性', val:s.weight||0},
    {lbl:'コスパ', val:s.cost||0},
    {lbl:'サポート', val:s.support||0},
    {lbl:'耐久性', val:s.durability||0}
  ];

  const imgGallery = imgs.length ? `
    <img src="${imgs[0]}" style="width:100%;height:200px;object-fit:cover;border-radius:10px;margin-bottom:12px;">
    ${imgs.length > 1 ? `<details style="margin-bottom:12px;">
      <summary style="font-size:12px;color:var(--text-muted);cursor:pointer;padding:6px 0;">📷 他の写真を見る（${imgs.length-1}枚）▼</summary>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px;margin-top:8px;">
        ${imgs.slice(1).map(img => `<img src="${img}" style="width:100%;height:90px;object-fit:cover;border-radius:6px;">`).join('')}
      </div>
    </details>` : ''}` : '';

  const shopsHtml = shops.length ? `
    <table style="width:100%;border-collapse:collapse;">
      ${shops.map(sh => `
      <tr style="border-bottom:0.5px solid var(--border);">
        <td style="padding:10px 6px;width:36px;">
          <div style="width:34px;height:34px;border-radius:8px;background:var(--surface-1);display:flex;align-items:center;justify-content:center;font-size:18px;">${sh.icon||'🛒'}</div>
        </td>
        <td style="padding:10px 6px;">
          <div style="font-size:13px;font-weight:500;color:var(--text-primary);">${sh.name}</div>
          ${sh.lowest?'<span style="font-size:9px;color:#bf6000;background:#fff3e0;padding:1px 5px;border-radius:3px;">最安値</span>':''}
        </td>
        <td style="padding:10px 6px;text-align:right;padding-right:8px;">
          <div style="font-size:16px;font-weight:500;color:var(--text-primary);">${sh.price||'確認する'}</div>
        </td>
        <td style="padding:10px 6px;width:70px;">
          <button onclick="window.open('${sh.url}','_blank')" style="width:100%;padding:8px 10px;border-radius:7px;border:none;font-size:12px;font-weight:500;cursor:pointer;background:${sh.color||'#333'};color:${sh.textColor||'#fff'};">買う</button>
        </td>
      </tr>`).join('')}
    </table>` : '';

  body.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
      <div>
        <div style="font-size:10px;color:var(--text-muted);margin-bottom:2px;">${s.brand||''}</div>
        <div style="font-size:17px;font-weight:500;color:var(--text-primary);">${s.model||''}</div>
      </div>
      <button onclick="closeSnkModal()" style="background:var(--surface-1);border:none;border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--text-secondary);font-size:18px;"><i class="ti ti-x"></i></button>
    </div>
    ${imgGallery}
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;padding:12px;background:var(--surface-1);border-radius:10px;">
      <div style="font-size:40px;font-weight:500;color:${scoreColor};">${score}</div>
      <div>
        <div style="font-size:12px;color:var(--text-muted);">総合スコア / 100</div>
        ${score>=95?'<div style="font-size:11px;color:#f0a500;font-weight:500;">🏆 プレミアム</div>':score>=90?'<div style="font-size:11px;color:#27ae60;font-weight:500;">✅ おすすめ</div>':'<div style="font-size:11px;color:#e63946;font-weight:500;">📊 標準</div>'}
      </div>
    </div>
    <div style="font-size:13px;font-weight:500;color:var(--text-primary);margin-bottom:10px;">パフォーマンス スコア</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px;">
      ${scoreItems.map(i => `
      <div style="background:var(--surface-1);border-radius:8px;padding:10px 12px;">
        <div style="font-size:11px;color:var(--text-muted);margin-bottom:6px;">${i.lbl}</div>
        <div style="height:6px;background:var(--border);border-radius:3px;overflow:hidden;margin-bottom:5px;">
          <div style="height:100%;background:${snkScoreColor(i.val)};border-radius:3px;width:${i.val}%"></div>
        </div>
        <div style="font-size:16px;font-weight:500;color:${snkScoreColor(i.val)};">${i.val}<span style="font-size:10px;color:var(--text-muted);">/100</span></div>
      </div>`).join('')}
    </div>
    ${shops.length ? `<div style="font-size:13px;font-weight:500;color:var(--text-primary);margin-bottom:10px;">価格比較・購入</div>${shopsHtml}` : ''}
  `;
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}
function closeSnkModal() {
  const modal = document.getElementById('snkModal');
  if (modal) modal.style.display = 'none';
  document.title = 'COURTSIDE - NBA速報・まとめ';
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
  document.getElementById('sneakerScoreCushion').value = '';
  document.getElementById('sneakerScoreHold').value = '';
  document.getElementById('sneakerScoreTraction').value = '';
  document.getElementById('sneakerScoreWeight').value = '';
  document.getElementById('sneakerSizeFeel').value = '';
  document.getElementById('sneakerPosition').value = '';
  document.getElementById('sneakerGymOk').checked = false;
  document.getElementById('sneakerPrice').value = '';
  document.getElementById('sneakerImg').value = '';
  document.getElementById('sneakerImg2').value = '';
  document.getElementById('sneakerImg3').value = '';
  document.getElementById('sneakerImg4').value = '';
  document.getElementById('sneakerLinkAmazon').value = '';
  document.getElementById('sneakerLinkRakuten').value = '';
  document.getElementById('sneakerLinkStockx').value = '';
  document.getElementById('sneakerLinkSnkrdunk').value = '';
  const rv = document.getElementById('sneakerReview');
  if (rv) rv.value = '';
  document.getElementById('sneakerSubmitBtn').textContent = '\u6295\u7a3f\u3059\u308b';
  setTimeout(() => {
    const rv2 = document.getElementById('sneakerReview');
    if (rv2 && !rv2.value) {
      rv2.value = window.SNK_REVIEW_TEMPLATE || '';
    }
  }, 200);
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
