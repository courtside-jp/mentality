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
const FB_SNEAKER_RANKINGS = `${FB_URL}/sneakerRankings`;
let _allSneakers = [];
let _allSneakerRankings = [];

const BRANDS = {
  asics: 'Asics', nike: 'Nike', jordan: 'Jordan', adidas: 'Adidas',
  underarmour: 'Under Armour', puma: 'Puma',
  newbalance: 'New Balance', anta: 'Anta', lining: 'Li-Ning', on: 'On Running'
};

// ============================================================
// 媒体ごとの購入リンク＋価格ブロック（1つだけ紹介／複数紹介 共通）
// ============================================================
const SNK_PLATFORMS = [
  { key: 'amazon',   label: 'Amazon',           icon: '🛒', color: '#fff3e0', border: '#ffd9a0' },
  { key: 'rakuten',  label: '楽天',              icon: '🛍️', color: '#ffece8', border: '#ffc2b3' },
  { key: 'stockx',   label: 'StockX',            icon: '📈', color: '#e8f0ff', border: '#b3cdff' },
  { key: 'snkrdunk', label: 'スニーカーダンク',    icon: '👟', color: '#eef8ec', border: '#bfe6b8' },
  { key: 'ebay',     label: 'eBay',              icon: '🌐', color: '#f3eefc', border: '#d3bff5' }
];

function snkShopBlocksHtml(ns) {
  return SNK_PLATFORMS.map(p => `
    <div style="background:${p.color};border:1px solid ${p.border};border-radius:8px;padding:8px;">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
        <input type="checkbox" id="${ns}-enable-${p.key}" onchange="snkToggleShop('${ns}','${p.key}')">
        <label for="${ns}-enable-${p.key}" style="font-size:11px;font-weight:700;">${p.icon} ${p.label}</label>
      </div>
      <div id="${ns}-fields-${p.key}" style="display:none;grid-template-columns:2fr 1fr;gap:6px;">
        <input type="text" id="${ns}-url-${p.key}" placeholder="購入URL" style="padding:7px 9px;border:1px solid #eee;border-radius:6px;font-size:11px;box-sizing:border-box;">
        <input type="text" id="${ns}-price-${p.key}" placeholder="最低価格 例:9790" style="padding:7px 9px;border:1px solid #eee;border-radius:6px;font-size:11px;box-sizing:border-box;">
      </div>
    </div>
  `).join('');
}

function snkToggleShop(ns, key) {
  const el = document.getElementById(`${ns}-fields-${key}`);
  const on = document.getElementById(`${ns}-enable-${key}`).checked;
  if (el) el.style.display = on ? 'grid' : 'none';
}

// フォームの媒体ブロックから shops 配列を組み立てる（最安値に lowest フラグを付与）
function snkCollectShops(ns) {
  const shops = [];
  SNK_PLATFORMS.forEach(p => {
    const enableEl = document.getElementById(`${ns}-enable-${p.key}`);
    if (!enableEl || !enableEl.checked) return;
    const url = (document.getElementById(`${ns}-url-${p.key}`)?.value || '').trim();
    const priceRaw = (document.getElementById(`${ns}-price-${p.key}`)?.value || '').trim();
    if (!url) return;
    const priceNum = parseInt(priceRaw.replace(/[^0-9]/g, ''), 10);
    shops.push({
      name: p.label,
      icon: p.icon,
      url,
      price: priceRaw ? (priceRaw.startsWith('¥') ? priceRaw : '¥' + priceRaw.replace(/[^0-9]/g, '')) : '',
      _priceNum: isNaN(priceNum) ? null : priceNum
    });
  });
  if (shops.length) {
    const withPrice = shops.filter(s => s._priceNum !== null);
    if (withPrice.length) {
      const min = Math.min(...withPrice.map(s => s._priceNum));
      shops.forEach(s => { s.lowest = s._priceNum === min; delete s._priceNum; });
    } else {
      shops.forEach(s => delete s._priceNum);
    }
  }
  return shops;
}

// 既存データの shops 配列をフォームに反映する（編集時）
function snkPopulateShops(ns, shops) {
  SNK_PLATFORMS.forEach(p => {
    const enableEl = document.getElementById(`${ns}-enable-${p.key}`);
    const urlEl = document.getElementById(`${ns}-url-${p.key}`);
    const priceEl = document.getElementById(`${ns}-price-${p.key}`);
    if (enableEl) enableEl.checked = false;
    if (urlEl) urlEl.value = '';
    if (priceEl) priceEl.value = '';
    if (document.getElementById(`${ns}-fields-${p.key}`)) document.getElementById(`${ns}-fields-${p.key}`).style.display = 'none';
  });
  (shops || []).forEach(sh => {
    const match = SNK_PLATFORMS.find(p => p.label === sh.name);
    if (!match) return;
    const enableEl = document.getElementById(`${ns}-enable-${match.key}`);
    if (enableEl) enableEl.checked = true;
    const urlEl = document.getElementById(`${ns}-url-${match.key}`);
    if (urlEl) urlEl.value = sh.url || '';
    const priceEl = document.getElementById(`${ns}-price-${match.key}`);
    if (priceEl) priceEl.value = (sh.price || '').replace(/[^0-9]/g, '');
    snkToggleShop(ns, match.key);
  });
}

function snkCheapestPriceLabel(shops) {
  const withPrice = (shops || []).filter(s => s.price);
  if (!withPrice.length) return '';
  const lowest = withPrice.find(s => s.lowest) || withPrice[0];
  return lowest.price + '〜';
}

async function loadSneakers() {
  const wrap = document.getElementById('sneakersWrap');
  if (!wrap) return;
  wrap.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--tx3);font-size:.75rem;">取得中...</div>';

  try {
    const res = await fetch(FB_SNEAKERS + '.json');
    const data = await res.json();
    _allSneakers = data ? Object.entries(data).map(([id,s]) => ({id,...s})).sort((a,b) => b.ts - a.ts) : [];
    await loadSneakerRankings();
    if (!_allSneakers.length && !_allSneakerRankings.length) {
      wrap.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--tx3);">まだ情報がありません</div>';
      return;
    }
    renderSneakerFeed(_allSneakers, _allSneakerRankings);
  } catch(e) {
    wrap.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--tx3);">取得に失敗しました</div>';
  }
}


function snkScoreColor(score) {
  if (score >= 95) return '#f0a500';
  if (score >= 90) return '#27ae60';
  return '#e63946';
}
function snkSingleCardHtml(s) {
  const score = calcSneakerScore(s);
    const scoreColor = snkScoreColor(score);
    const shops = s.shops || [];
    const scoreItems = [
      {lbl:'クッション', val:s.cushion||0},
      {lbl:'ホールド感', val:s.hold||0},
      {lbl:'グリップ', val:s.traction||0},
      {lbl:'軽量性', val:s.weight||0}
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
}

function renderSneakers(list) {
  const wrap = document.getElementById('sneakersWrap');
  if (!wrap) return;
  if (!list || !list.length) {
    wrap.innerHTML = '<div style="text-align:center;padding:40px;color:#999;font-size:13px;">バッシュがまだ登録されていません</div>';
    return;
  }
  wrap.style.cssText = 'display:grid;grid-template-columns:1fr;gap:14px;padding:0;';
  wrap.innerHTML = list.map(snkSingleCardHtml).join('');
}

function renderSneakerFeed(list, rankings) {
  const wrap = document.getElementById('sneakersWrap');
  if (!wrap) return;
  const singleEntries = (list||[]).map(s => ({ ts: s.ts||0, html: snkSingleCardHtml(s) }));
  const rankEntries = (rankings||[]).map(r => ({ ts: r.ts||0, html: renderSneakerRankingCard(r) }));
  const merged = [...singleEntries, ...rankEntries].sort((a,b) => b.ts - a.ts);
  if (!merged.length) {
    wrap.innerHTML = '<div style="text-align:center;padding:40px;color:#999;font-size:13px;">バッシュがまだ登録されていません</div>';
    return;
  }
  wrap.style.cssText = 'display:grid;grid-template-columns:1fr;gap:14px;padding:0;';
  wrap.innerHTML = merged.map(e => e.html).join('');
}
function filterSneakers(btn, brand) {
  document.querySelectorAll('#pg-sneakers .conf-btn').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  const filtered = brand === 'all' ? _allSneakers : _allSneakers.filter(s => s.brand === brand);
  renderSneakers(filtered);
}

// 管理画面から投稿
function calcSneakerScore(s) {
  // オブジェクト渡しの場合（カードレンダリング用）
  if (s && typeof s === 'object') {
    // 総合値が手動入力されていればそれを優先
    const manual = parseInt(s.overallScore, 10);
    if (!isNaN(manual) && manual > 0) return manual;
    const vals = [s.cushion, s.hold, s.traction, s.weight]
      .map(v => parseInt(v)||0)
      .filter(v => v > 0);
    if (!vals.length) return 0;
    return Math.round(vals.reduce((a,b) => a+b, 0) / vals.length);
  }
  // DOM読み取り（管理画面フォーム用）
  const vals = ['sneakerScoreCushion','sneakerScoreHold','sneakerScoreTraction','sneakerScoreWeight']
    .map(id => parseInt(document.getElementById(id)?.value, 10))
    .filter(v => !isNaN(v));
  if (!vals.length) return null;
  return Math.round(vals.reduce((a,b) => a+b, 0) / vals.length);
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
    {lbl:'ホールド感', val:s.hold||0},
    {lbl:'グリップ', val:s.traction||0},
    {lbl:'軽量性', val:s.weight||0}
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
    ${s.desc ? `<div style="font-size:13px;color:var(--text-secondary);line-height:1.7;margin-bottom:14px;">${s.desc}</div>` : ''}
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
  modal.style.display = 'block';
  document.body.style.overflow = 'hidden';
  const fixedAd = document.getElementById('fixedAdBanner');
  if (fixedAd) { fixedAd.dataset.wasVisible = fixedAd.style.display !== 'none' ? '1' : '0'; fixedAd.style.display = 'none'; }
}
function closeSnkModal() {
  const modal = document.getElementById('snkModal');
  if (modal) modal.style.display = 'none';
  document.title = 'COURTSIDE - NBA速報・まとめ';
  const fixedAd = document.getElementById('fixedAdBanner');
  if (fixedAd && fixedAd.dataset.wasVisible === '1') fixedAd.style.display = 'block';
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

async function submitSneaker() {
  const id = document.getElementById('sneakerEditId').value;
  const model = document.getElementById('sneakerModel').value.trim();
  if (!model) { alert('モデル名を入力してください'); return; }

  const shops = snkCollectShops('s');

  const images = [
    document.getElementById('sneakerImg').value.trim(),
    document.getElementById('sneakerImg2').value.trim(),
    document.getElementById('sneakerImg3').value.trim(),
    document.getElementById('sneakerImg4').value.trim()
  ].filter(Boolean);

  const data = {
    brand: document.getElementById('sneakerBrand').value,
    model,
    player: document.getElementById('sneakerPlayer').value.trim(),
    cushion: parseInt(document.getElementById('sneakerScoreCushion').value, 10) || 0,
    hold: parseInt(document.getElementById('sneakerScoreHold').value, 10) || 0,
    traction: parseInt(document.getElementById('sneakerScoreTraction').value, 10) || 0,
    weight: parseInt(document.getElementById('sneakerScoreWeight').value, 10) || 0,
    overallScore: parseInt(document.getElementById('sneakerOverallScore')?.value, 10) || 0,
    sizeFeel: document.getElementById('sneakerSizeFeel').value.trim(),
    position: document.getElementById('sneakerPosition').value.trim(),
    gymOk: document.getElementById('sneakerGymOk') ? document.getElementById('sneakerGymOk').checked : false,
    desc: document.getElementById('sneakerDesc') ? document.getElementById('sneakerDesc').value.trim() : '',
    price: snkCheapestPriceLabel(shops),
    review: document.getElementById('sneakerReview') ? document.getElementById('sneakerReview').value : '',
    images,
    img: images[0] || '',
    shops,
    date: new Date().toISOString().slice(0,10),
    ts: id ? undefined : Date.now()
  };
  Object.keys(data).forEach(k => data[k] === undefined && delete data[k]);

  const btn = document.getElementById('sneakerSubmitBtn');
  if (btn) { btn.disabled = true; btn.textContent = '保存中...'; }
  try {
    if (id) {
      await fetch(`${FB_SNEAKERS}/${id}.json`, { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify(data) });
    } else {
      await fetch(`${FB_SNEAKERS}.json`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(data) });
    }
    document.getElementById('sneakerForm').style.display = 'none';
    loadAdminSneakers();
    loadSneakers();
  } catch(e) {
    alert('保存に失敗しました');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = id ? '上書き保存' : '投稿する'; }
  }
}

function cancelSneakerEdit() {
  document.getElementById('sneakerForm').style.display = 'none';
}

async function loadAdminSneakers() {
  const wrap = document.getElementById('adminSneakerList');
  if (!wrap) return;
  wrap.innerHTML = '<div style="text-align:center;padding:1rem;color:#999;font-size:12px;">読み込み中...</div>';
  try {
    const [snkRes, rankRes] = await Promise.all([
      fetch(`${FB_SNEAKERS}.json?orderBy="$key"&limitToLast=200`),
      fetch(`${FB_SNEAKER_RANKINGS}.json?orderBy="$key"&limitToLast=200`)
    ]);
    const data = await snkRes.json();
    const rankData = await rankRes.json();
    const singleItems = data ? Object.entries(data).map(([id, s]) => ({ id, s, type: 'single' })) : [];
    const rankItems = rankData ? Object.entries(rankData).map(([id, r]) => ({ id, s: r, type: 'ranking' })) : [];
    const items = [...singleItems, ...rankItems].sort((a, b) => (b.s.ts||0) - (a.s.ts||0));
    if (!items.length) { wrap.innerHTML = '<div style="text-align:center;padding:1rem;color:#999;">バッシュなし</div>'; return; }
    wrap.innerHTML = items.map(({id, s, type}) => type === 'ranking' ? `
      <div style="background:#fff;border-bottom:1px solid #f0f0f0;padding:12px 14px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
          <div style="font-size:9px;color:#c9720a;font-weight:700;background:#fff3e0;padding:2px 6px;border-radius:4px;">ランキング（${(s.items||[]).length}件）</div>
          <div style="font-size:9px;color:#999;">${s.date||''}</div>
        </div>
        <div style="font-size:13px;font-weight:700;color:#000;margin-bottom:8px;">${s.title||'無題'}</div>
        <div style="display:flex;gap:6px;">
          <button onclick="deleteSneakerRanking('${id}')" style="flex:1;padding:6px;background:rgba(201,8,42,0.08);border:1px solid rgba(201,8,42,0.2);border-radius:6px;font-size:11px;font-weight:700;color:#C9082A;cursor:pointer;">削除</button>
        </div>
      </div>
    ` : `
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

async function deleteSneakerRanking(id) {
  if (!confirm('このランキング投稿を削除しますか？')) return;
  await fetch(`${FB_SNEAKER_RANKINGS}/${id}.json`, { method: 'DELETE' });
  loadAdminSneakers();
  loadSneakers();
}

// ============================================================
// 投稿パターン切り替え（1つだけ紹介／複数紹介）
// ============================================================
function switchSneakerPattern(mode) {
  const single = document.getElementById('sneakerForm');
  const multi = document.getElementById('sneakerRankingForm');
  const tabS = document.getElementById('snkTabSingle');
  const tabM = document.getElementById('snkTabMulti');
  if (!single || !multi || !tabS || !tabM) return;
  if (mode === 'single') {
    single.style.display = 'block'; multi.style.display = 'none';
    tabS.style.background = '#000'; tabS.style.color = '#fff'; tabS.style.border = 'none';
    tabM.style.background = '#f5f5f5'; tabM.style.color = '#666'; tabM.style.border = '1px solid #eee';
  } else {
    single.style.display = 'none'; multi.style.display = 'block';
    tabM.style.background = '#000'; tabM.style.color = '#fff'; tabM.style.border = 'none';
    tabS.style.background = '#f5f5f5'; tabS.style.color = '#666'; tabS.style.border = '1px solid #eee';
    if (!document.getElementById('rankingItems').children.length) {
      addRankingItem(); addRankingItem();
    }
  }
}

function openNewSneaker() {
  document.getElementById('sneakerForm').style.display = 'block';
  document.getElementById('sneakerRankingForm').style.display = 'none';
  const tabs = document.getElementById('sneakerPatternTabs');
  if (tabs) tabs.style.display = 'flex';
  switchSneakerPattern('single');
  document.getElementById('sneakerEditId').value = '';
  document.getElementById('sneakerModel').value = '';
  document.getElementById('sneakerPlayer').value = '';
  document.getElementById('sneakerScoreCushion').value = '';
  document.getElementById('sneakerScoreHold').value = '';
  document.getElementById('sneakerScoreTraction').value = '';
  document.getElementById('sneakerScoreWeight').value = '';
  if (document.getElementById('sneakerOverallScore')) document.getElementById('sneakerOverallScore').value = '';
  document.getElementById('sneakerSizeFeel').value = '';
  document.getElementById('sneakerPosition').value = '';
  document.getElementById('sneakerGymOk').checked = false;
  if (document.getElementById('sneakerDesc')) document.getElementById('sneakerDesc').value = '';
  document.getElementById('sneakerImg').value = '';
  document.getElementById('sneakerImg2').value = '';
  document.getElementById('sneakerImg3').value = '';
  document.getElementById('sneakerImg4').value = '';
  const shopWrap = document.getElementById('sneakerShopBlocks');
  if (shopWrap) shopWrap.innerHTML = snkShopBlocksHtml('s');
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
  document.getElementById('sneakerRankingForm').style.display = 'none';
  const tabs = document.getElementById('sneakerPatternTabs');
  if (tabs) tabs.style.display = 'none';
  document.getElementById('sneakerEditId').value = id;
  document.getElementById('sneakerBrand').value = d.brand || 'Nike';
  document.getElementById('sneakerModel').value = d.model || '';
  document.getElementById('sneakerPlayer').value = d.player || '';
  document.getElementById('sneakerImg').value = d.img || '';
  document.getElementById('sneakerImg2').value = d.img2 || '';
  document.getElementById('sneakerImg3').value = d.img3 || '';
  document.getElementById('sneakerImg4').value = d.img4 || '';
  document.getElementById('sneakerScoreCushion').value = d.cushion || '';
  document.getElementById('sneakerScoreHold').value = d.hold || '';
  document.getElementById('sneakerScoreTraction').value = d.traction || '';
  document.getElementById('sneakerScoreWeight').value = d.weight || '';
  if (document.getElementById('sneakerOverallScore')) document.getElementById('sneakerOverallScore').value = d.overallScore || '';
  document.getElementById('sneakerSizeFeel').value = d.sizeFeel || '';
  document.getElementById('sneakerPosition').value = d.position || '';
  if (document.getElementById('sneakerDesc')) document.getElementById('sneakerDesc').value = d.desc || '';
  const shopWrap = document.getElementById('sneakerShopBlocks');
  if (shopWrap) {
    shopWrap.innerHTML = snkShopBlocksHtml('s');
    snkPopulateShops('s', d.shops || []);
  }
  const rv3 = document.getElementById('sneakerReview');
  if (rv3) rv3.value = d.review || '';
  if (document.getElementById('sneakerGymOk')) document.getElementById('sneakerGymOk').checked = !!d.gymOk;
  document.getElementById('sneakerSubmitBtn').textContent = '上書き保存';
}

// ============================================================
// 複数紹介（ランキング）投稿
// ============================================================
let _rankingItemCount = 0;

function addRankingItem() {
  _rankingItemCount++;
  const ns = 'r' + _rankingItemCount;
  const wrap = document.getElementById('rankingItems');
  if (!wrap) return;
  const row = document.createElement('div');
  row.setAttribute('data-ranking-row', ns);
  row.style.cssText = 'background:#fafafa;border:1px solid #eee;border-radius:10px;padding:12px;';
  row.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
      <span class="ranking-item-badge" style="font-size:12px;font-weight:700;color:#C9082A;background:rgba(201,8,42,0.08);padding:3px 10px;border-radius:12px;">商品</span>
      <button type="button" onclick="removeRankingItem('${ns}')" style="border:none;background:none;color:#999;font-size:11px;cursor:pointer;">削除</button>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;">
      <div>
        <div style="font-size:10px;color:#999;margin-bottom:4px;font-weight:700;">ブランド</div>
        <select id="${ns}-brand" style="width:100%;padding:9px 12px;border:1px solid #eee;border-radius:8px;font-size:12px;background:#fff;outline:none;box-sizing:border-box;">
          <option>Asics</option><option>Nike</option><option>Jordan</option><option>Adidas</option><option>Li-Ning</option><option>On Running</option><option>Under Armour</option><option>Puma</option><option>New Balance</option>
        </select>
      </div>
      <div>
        <div style="font-size:10px;color:#999;margin-bottom:4px;font-weight:700;">モデル名</div>
        <input type="text" id="${ns}-model" placeholder="例：Kobe 9 Elite" style="width:100%;padding:9px 12px;border:1px solid #eee;border-radius:8px;font-size:12px;outline:none;box-sizing:border-box;">
      </div>
    </div>
    <div style="margin-bottom:10px;">
      <div style="font-size:10px;color:#999;margin-bottom:4px;font-weight:700;">着用選手</div>
      <input type="text" id="${ns}-player" placeholder="例：ステフィン・カリー" style="width:100%;padding:9px 12px;border:1px solid #eee;border-radius:8px;font-size:12px;outline:none;box-sizing:border-box;">
    </div>
    <div style="margin-bottom:10px;">
      <div style="font-size:10px;color:#999;margin-bottom:4px;font-weight:700;">機能スコア（1〜100）</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;background:#fafafa;border:1px solid #eee;border-radius:8px;padding:10px;">
        <div>
          <div style="font-size:9px;color:#999;margin-bottom:3px;">クッション性</div>
          <input type="number" min="1" max="100" id="${ns}-cushion" placeholder="80" style="width:100%;padding:7px 9px;border:1px solid #ddd;border-radius:6px;font-size:12px;outline:none;box-sizing:border-box;">
        </div>
        <div>
          <div style="font-size:9px;color:#999;margin-bottom:3px;">ホールド感</div>
          <input type="number" min="1" max="100" id="${ns}-hold" placeholder="80" style="width:100%;padding:7px 9px;border:1px solid #ddd;border-radius:6px;font-size:12px;outline:none;box-sizing:border-box;">
        </div>
        <div>
          <div style="font-size:9px;color:#999;margin-bottom:3px;">トラクション</div>
          <input type="number" min="1" max="100" id="${ns}-traction" placeholder="80" style="width:100%;padding:7px 9px;border:1px solid #ddd;border-radius:6px;font-size:12px;outline:none;box-sizing:border-box;">
        </div>
        <div>
          <div style="font-size:9px;color:#999;margin-bottom:3px;">軽量性</div>
          <input type="number" min="1" max="100" id="${ns}-weight" placeholder="80" style="width:100%;padding:7px 9px;border:1px solid #ddd;border-radius:6px;font-size:12px;outline:none;box-sizing:border-box;">
        </div>
      </div>
    </div>
    <div style="margin-bottom:10px;">
      <div style="font-size:10px;color:#999;margin-bottom:4px;font-weight:700;">総合値（任意・空欄なら上の4項目から自動計算）</div>
      <input type="number" min="1" max="100" id="${ns}-overallscore" placeholder="例：92（未入力なら自動平均）" style="width:100%;padding:9px 12px;border:1px solid #eee;border-radius:8px;font-size:12px;outline:none;box-sizing:border-box;">
    </div>
    <div style="margin-bottom:10px;">
      <div style="font-size:10px;color:#999;margin-bottom:4px;font-weight:700;">サイズ感</div>
      <input type="text" id="${ns}-sizefeel" placeholder="例：ジャストサイズ／ハーフアップ推奨" style="width:100%;padding:9px 12px;border:1px solid #eee;border-radius:8px;font-size:12px;outline:none;box-sizing:border-box;">
    </div>
    <div style="margin-bottom:10px;">
      <div style="font-size:10px;color:#999;margin-bottom:4px;font-weight:700;">おすすめポジション/プレースタイル</div>
      <input type="text" id="${ns}-position" placeholder="例：軽量重視のガード向け" style="width:100%;padding:9px 12px;border:1px solid #eee;border-radius:8px;font-size:12px;outline:none;box-sizing:border-box;">
    </div>
    <div style="display:flex;align-items:center;gap:8px;background:#fafafa;border:1px solid #eee;border-radius:8px;padding:10px 12px;margin-bottom:10px;">
      <input id="${ns}-gymok" type="checkbox" style="width:16px;height:16px;">
      <label for="${ns}-gymok" style="font-size:12px;font-weight:700;cursor:pointer;">🏋️ ジム・トレーニング用にもおすすめ</label>
    </div>
    <div style="margin-bottom:10px;">
      <div style="font-size:10px;color:#999;margin-bottom:4px;font-weight:700;">商品説明文</div>
      <textarea id="${ns}-desc" rows="3" placeholder="足幅・向いているプレースタイル・特徴などを記入（カード表示用の短い説明）" style="width:100%;padding:9px 12px;border:1px solid #eee;border-radius:8px;font-size:12px;outline:none;box-sizing:border-box;resize:vertical;"></textarea>
    </div>
    <div style="margin-bottom:10px;">
      <label style="font-size:10px;color:#999;margin-bottom:4px;font-weight:700;">レビュー本文（①部活生視点・②NBA層視点）</label>
      <textarea id="${ns}-review" rows="10" style="width:100%;padding:9px 12px;border:1px solid #eee;border-radius:8px;font-size:12px;outline:none;box-sizing:border-box;resize:vertical;line-height:1.6;" placeholder="テンプレートが自動入力されます"></textarea>
    </div>
    <div style="margin-bottom:10px;">
      <div style="font-size:10px;color:#999;margin-bottom:4px;font-weight:700;">画像URL（複数アングル対応・最大4枚）</div>
      <div style="display:flex;flex-direction:column;gap:6px;">
        <input type="text" id="${ns}-img" placeholder="メイン画像 https://..." style="width:100%;padding:9px 12px;border:1px solid #eee;border-radius:8px;font-size:12px;outline:none;box-sizing:border-box;">
        <input type="text" id="${ns}-img2" placeholder="サイド/別アングル画像2 https://..." style="width:100%;padding:9px 12px;border:1px solid #eee;border-radius:8px;font-size:12px;outline:none;box-sizing:border-box;">
        <input type="text" id="${ns}-img3" placeholder="背面/ソール画像3 https://..." style="width:100%;padding:9px 12px;border:1px solid #eee;border-radius:8px;font-size:12px;outline:none;box-sizing:border-box;">
        <input type="text" id="${ns}-img4" placeholder="着用イメージ画像4 https://..." style="width:100%;padding:9px 12px;border:1px solid #eee;border-radius:8px;font-size:12px;outline:none;box-sizing:border-box;">
      </div>
    </div>
    <div>
      <div style="font-size:10px;color:#999;margin-bottom:4px;font-weight:700;">購入リンク（媒体ごとに最低価格も入力）</div>
      <div id="${ns}-shopblocks" style="display:flex;flex-direction:column;gap:8px;">${snkShopBlocksHtml(ns)}</div>
    </div>
  `;
  wrap.appendChild(row);
  setTimeout(() => {
    const rv = document.getElementById(`${ns}-review`);
    if (rv && !rv.value) rv.value = window.SNK_REVIEW_TEMPLATE || '';
  }, 100);
  renumberRankingItems();
}

const CIRCLED_NUMS = ['①','②','③','④','⑤','⑥','⑦','⑧','⑨','⑩'];
function renumberRankingItems() {
  const rows = document.querySelectorAll('[data-ranking-row]');
  rows.forEach((row, i) => {
    const badge = row.querySelector('.ranking-item-badge');
    if (badge) badge.textContent = '商品' + (CIRCLED_NUMS[i] || (i + 1));
  });
}

function removeRankingItem(ns) {
  const row = document.querySelector(`[data-ranking-row="${ns}"]`);
  if (row) row.remove();
  renumberRankingItems();
}

function cancelSneakerRanking() {
  document.getElementById('sneakerRankingForm').style.display = 'none';
  document.getElementById('rankingItems').innerHTML = '';
  document.getElementById('rankingTitle').value = '';
  if (document.getElementById('rankingThumb')) document.getElementById('rankingThumb').value = '';
  _rankingItemCount = 0;
}

async function submitSneakerRanking() {
  const title = document.getElementById('rankingTitle').value.trim();
  if (!title) { alert('ランキングタイトルを入力してください'); return; }
  const mall = document.getElementById('rankingMall').value;
  const thumb = document.getElementById('rankingThumb') ? document.getElementById('rankingThumb').value.trim() : '';

  const rows = document.querySelectorAll('[data-ranking-row]');
  const items = [];
  rows.forEach(row => {
    const ns = row.getAttribute('data-ranking-row');
    const model = (document.getElementById(`${ns}-model`)?.value || '').trim();
    if (!model) return;
    const shops = snkCollectShops(ns);
    const images = [
      (document.getElementById(`${ns}-img`)?.value || '').trim(),
      (document.getElementById(`${ns}-img2`)?.value || '').trim(),
      (document.getElementById(`${ns}-img3`)?.value || '').trim(),
      (document.getElementById(`${ns}-img4`)?.value || '').trim()
    ].filter(Boolean);
    items.push({
      brand: document.getElementById(`${ns}-brand`)?.value || '',
      model,
      player: (document.getElementById(`${ns}-player`)?.value || '').trim(),
      cushion: parseInt(document.getElementById(`${ns}-cushion`)?.value, 10) || 0,
      hold: parseInt(document.getElementById(`${ns}-hold`)?.value, 10) || 0,
      traction: parseInt(document.getElementById(`${ns}-traction`)?.value, 10) || 0,
      weight: parseInt(document.getElementById(`${ns}-weight`)?.value, 10) || 0,
      overallScore: parseInt(document.getElementById(`${ns}-overallscore`)?.value, 10) || 0,
      sizeFeel: (document.getElementById(`${ns}-sizefeel`)?.value || '').trim(),
      position: (document.getElementById(`${ns}-position`)?.value || '').trim(),
      gymOk: document.getElementById(`${ns}-gymok`) ? document.getElementById(`${ns}-gymok`).checked : false,
      desc: (document.getElementById(`${ns}-desc`)?.value || '').trim(),
      review: document.getElementById(`${ns}-review`) ? document.getElementById(`${ns}-review`).value : '',
      images,
      img: images[0] || '',
      shops,
      price: snkCheapestPriceLabel(shops)
    });
  });

  if (!items.length) { alert('商品を1つ以上入力してください'); return; }

  const btn = document.getElementById('rankingSubmitBtn');
  if (btn) { btn.disabled = true; btn.textContent = '投稿中...'; }
  const img = thumb || items[0]?.img || '';
  try {
    await fetch(FB_SNEAKER_RANKINGS + '.json', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ title, mall, img, items, date: new Date().toISOString().slice(0,10), ts: Date.now() })
    });
    cancelSneakerRanking();
    loadAdminSneakers();
    loadSneakers();
  } catch(e) {
    alert('投稿に失敗しました');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'まとめて投稿する'; }
  }
}

// ============================================================
// バッシュページ表示：単体投稿とランキング投稿を統合表示
// ============================================================
async function loadSneakerRankings() {
  try {
    const res = await fetch(FB_SNEAKER_RANKINGS + '.json');
    const data = await res.json();
    _allSneakerRankings = data ? Object.entries(data).map(([id, r]) => ({ id, ...r })).sort((a,b) => (b.ts||0) - (a.ts||0)) : [];
  } catch(e) {
    _allSneakerRankings = [];
  }
}

function renderSneakerRankingCard(r) {
  const items = r.items || [];
  const thumb = r.img || (items[0] && items[0].img) || '';
  return `
  <div onclick="openSnkRankingModal('${r.id}')" style="background:var(--surface-2);border:0.5px solid var(--border);border-radius:12px;overflow:hidden;cursor:pointer;">
    ${thumb ? `<img src="${thumb}" style="width:100%;height:160px;object-fit:cover;" onerror="this.style.display='none'">` : ''}
    <div style="padding:14px;">
    <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">
      <span style="font-size:9px;font-weight:700;color:#c9720a;background:#fff3e0;padding:2px 8px;border-radius:10px;">ランキング</span>
      <span style="font-size:10px;color:var(--text-muted);">${r.mall||''}・${items.length}アイテム</span>
    </div>
    <div style="font-size:15px;font-weight:500;color:var(--text-primary);margin-bottom:10px;">${r.title||''}</div>
    <div style="display:flex;flex-direction:column;gap:4px;">
      ${items.slice(0,3).map((it,i) => `<div style="font-size:12px;color:var(--text-secondary);">${i+1}. ${it.brand||''} ${it.model||''} ${it.price?('・'+it.price):''}</div>`).join('')}
      ${items.length>3 ? `<div style="font-size:11px;color:var(--text-muted);">他${items.length-3}件</div>` : ''}
    </div>
    <button onclick="event.stopPropagation();openSnkRankingModal('${r.id}')" style="width:100%;margin-top:12px;padding:10px 0;border-radius:8px;border:0.5px solid var(--border-strong);font-size:12px;font-weight:500;cursor:pointer;background:var(--surface-1);color:var(--text-primary);">ランキング全部見る</button>
    </div>
  </div>`;
}

function openSnkRankingModal(id) {
  const modal = document.getElementById('snkModal');
  const body = document.getElementById('snkModalBody');
  if (!modal || !body) return;
  const r = (_allSneakerRankings || []).find(x => x.id === id);
  if (!r) return;
  const items = r.items || [];

  body.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
      <div>
        <div style="font-size:10px;color:var(--text-muted);margin-bottom:2px;">${r.mall||''}ランキング</div>
        <div style="font-size:17px;font-weight:500;color:var(--text-primary);">${r.title||''}</div>
      </div>
      <button onclick="closeSnkModal()" style="background:var(--surface-1);border:none;border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--text-secondary);font-size:18px;"><i class="ti ti-x"></i></button>
    </div>
    <div style="display:flex;flex-direction:column;gap:12px;">
      ${items.map((it, i) => {
        const score = calcSneakerScore(it);
        const scoreColor = snkScoreColor(score);
        const shops = it.shops || [];
        return `
        <div style="background:var(--surface-1);border-radius:10px;padding:12px;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
            <span style="font-size:12px;font-weight:700;color:#C9082A;">${i+1}位</span>
            <span style="font-size:11px;color:var(--text-muted);">${it.brand||''}</span>
          </div>
          <div style="font-size:14px;font-weight:500;color:var(--text-primary);margin-bottom:6px;">${it.model||''}</div>
          ${(it.images && it.images.length) ? `<img src="${it.images[0]}" style="width:100%;height:140px;object-fit:cover;border-radius:8px;margin-bottom:8px;">` : ''}
          ${it.player ? `<div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">👤 ${it.player}</div>` : ''}
          ${(it.sizeFeel || it.position) ? `<div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">${it.sizeFeel ? '📏 '+it.sizeFeel : ''}${it.sizeFeel && it.position ? '　' : ''}${it.position ? '🏀 '+it.position : ''}</div>` : ''}
          ${it.gymOk ? `<div style="font-size:11px;color:#27ae60;margin-bottom:4px;">🏋️ ジム・トレーニング用にもおすすめ</div>` : ''}
          ${it.desc ? `<div style="font-size:12px;color:var(--text-secondary);line-height:1.6;margin-bottom:8px;">${it.desc}</div>` : ''}
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
            <div style="font-size:22px;font-weight:500;color:${scoreColor};">${score}</div>
            <div style="font-size:10px;color:var(--text-muted);">総合スコア/100</div>
          </div>
          ${shops.length ? shops.map(sh => `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-top:0.5px solid var(--border);">
              <span style="font-size:12px;color:var(--text-secondary);">${sh.icon||''} ${sh.name}${sh.lowest?' <span style=\\"font-size:9px;color:#bf6000;background:#fff3e0;padding:1px 5px;border-radius:3px;\\">最安値</span>':''}</span>
              <span style="font-size:12px;font-weight:500;">${sh.price||'確認する'}</span>
              <button onclick="window.open('${sh.url}','_blank')" style="padding:5px 12px;border-radius:6px;border:0.5px solid var(--border-strong);background:var(--surface-2);font-size:11px;cursor:pointer;">買う</button>
            </div>
          `).join('') : ''}
        </div>`;
      }).join('')}
    </div>
  `;
  modal.style.display = 'block';
  document.body.style.overflow = 'hidden';
  const fixedAd = document.getElementById('fixedAdBanner');
  if (fixedAd) { fixedAd.dataset.wasVisible = fixedAd.style.display !== 'none' ? '1' : '0'; fixedAd.style.display = 'none'; }
}
