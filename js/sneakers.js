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
let _snkModalReturnTo = null; // { type: 'ranking', id } or null — enables the 戻る button in openSnkModal

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
  const thumb = (s.images && s.images[0]) || s.img || '';
  return `
  <div onclick="_snkModalReturnTo=null;openSnkModal('${s.id}')" style="background:var(--card);border:0.5px solid var(--bd);border-radius:10px;padding:8px 10px;cursor:pointer;">
    <div style="display:flex;align-items:center;gap:5px;margin-bottom:4px;">
      <span style="font-size:8px;font-weight:700;color:#C9082A;background:rgba(201,8,42,0.08);padding:2px 6px;border-radius:4px;">${(s.brand||'').toUpperCase()}</span>
      <span style="font-size:9px;color:var(--tx3);">${s.date||''}</span>
      ${s.badge ? `<span style="font-size:8px;font-weight:700;color:#e63946;background:rgba(230,57,70,0.08);padding:2px 6px;border-radius:4px;">${s.badge}</span>` : ''}
    </div>
    <div style="display:flex;gap:9px;">
      ${thumb ? `<img src="${thumb}" style="width:54px;height:54px;object-fit:cover;border-radius:8px;flex-shrink:0;">` : `<div style="width:54px;height:54px;background:var(--bg3);border-radius:8px;flex-shrink:0;display:flex;align-items:center;justify-content:center;"><span style="font-size:22px;">👟</span></div>`}
      <div style="flex:1;min-width:0;">
        <div style="font-size:12.5px;font-weight:700;color:var(--tx);line-height:1.25;margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${s.model||''}</div>
        <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:3px;">
          <span style="font-size:15px;font-weight:800;color:${scoreColor};">${score}<span style="font-size:8px;color:var(--tx3);font-weight:500;">/100</span></span>
          ${s.price ? `<span style="font-size:11.5px;font-weight:700;color:#C9082A;">${s.price}</span>` : ''}
        </div>
        ${s.desc ? `<div style="font-size:10px;color:var(--tx3);line-height:1.4;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;">${s.desc}</div>` : ''}
      </div>
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
  wrap.style.cssText = 'display:grid;grid-template-columns:1fr;gap:8px;padding:0;';
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
  wrap.style.cssText = 'display:grid;grid-template-columns:1fr;gap:8px;padding:0;';
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

async function openSnkModal(id) {
  const modal = document.getElementById('snkModal');
  const body = document.getElementById('snkModalBody');
  if (!modal || !body) return;
  let s = (_allSneakers || []).find(x => x.id === id);
  if (!s) {
    // ホームフィードなど _allSneakers が未取得の状態から開かれた場合はFirebaseから直接取得
    try {
      const res = await fetch(`${FB_SNEAKERS}/${id}.json`);
      const d = await res.json();
      if (!d) return;
      s = { id, ...d };
    } catch(e) { return; }
  }
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
      <summary style="font-size:12px;color:var(--tx3);cursor:pointer;padding:6px 0;">📷 他の写真を見る（${imgs.length-1}枚）▼</summary>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px;margin-top:8px;">
        ${imgs.slice(1).map(img => `<img src="${img}" style="width:100%;height:90px;object-fit:cover;border-radius:6px;">`).join('')}
      </div>
    </details>` : ''}` : '';

  const shopsHtml = shops.length ? `
    <table style="width:100%;border-collapse:collapse;">
      ${shops.map(sh => `
      <tr style="border-bottom:0.5px solid var(--bd);">
        <td style="padding:10px 6px;">
          <div style="font-size:13px;font-weight:500;color:var(--tx);">${sh.name}</div>
          ${sh.lowest?'<span style="font-size:9px;color:#bf6000;background:#fff3e0;padding:1px 5px;border-radius:3px;">最安値</span>':''}
        </td>
        <td style="padding:10px 6px;text-align:right;padding-right:8px;">
          <div style="font-size:16px;font-weight:500;color:var(--tx);">${sh.price||'確認する'}</div>
        </td>
        <td style="padding:10px 6px;width:70px;">
          <button onclick="window.open('${sh.url}','_blank')" style="width:100%;padding:8px 10px;border-radius:7px;border:none;font-size:12px;font-weight:500;cursor:pointer;background:${sh.color||'#333'};color:${sh.textColor||'#fff'};">買う</button>
        </td>
      </tr>`).join('')}
    </table>` : '';

  const infoTags = [
    s.player ? `着用選手：${s.player}` : '',
    s.sizeFeel ? `サイズ感：${s.sizeFeel}` : '',
    s.position ? `おすすめポジション：${s.position}` : ''
  ].filter(Boolean);

  const tocHtml = (s.review && typeof generateTOC === 'function') ? generateTOC(s.review) : '';

  const reviewHtml = s.review ? `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
      <div style="font-size:13px;font-weight:500;color:var(--tx);">レビュー</div>
      <div style="display:flex;align-items:center;gap:.3rem;">
        <span style="font-size:10px;color:var(--tx3);margin-right:2px;">文字サイズ</span>
        <button onclick="setArticleFontSize('s')" data-fontsize-btn="s" style="width:24px;height:24px;border-radius:6px;border:1px solid var(--bd);background:var(--bg3);font-size:10px;cursor:pointer;color:var(--tx2);">A</button>
        <button onclick="setArticleFontSize('m')" data-fontsize-btn="m" style="width:24px;height:24px;border-radius:6px;border:1px solid var(--bd);background:var(--bg3);font-size:12px;cursor:pointer;color:var(--tx2);">A</button>
        <button onclick="setArticleFontSize('l')" data-fontsize-btn="l" style="width:24px;height:24px;border-radius:6px;border:1px solid var(--bd);background:var(--bg3);font-size:14px;cursor:pointer;color:var(--tx2);">A</button>
      </div>
    </div>
    <div id="snkReviewBodyDiv" style="font-size:12.5px;color:var(--tx2);line-height:1.8;margin-bottom:16px;">
      ${typeof renderBody === 'function' ? renderBody(s.review) : `<div style="white-space:pre-wrap;">${s.review}</div>`}
    </div>` : '';

  const divider = '<div style="height:1px;background:var(--bd);margin:16px 0;"></div>';

  body.innerHTML = `
    <button onclick="snkModalGoBack()" style="display:block;background:var(--bg3);border:1px solid var(--bd);color:var(--tx);padding:.5rem 1rem;border-radius:8px;font-size:.8rem;cursor:pointer;margin-bottom:1.2rem;">← 戻る</button>
    <div style="margin-bottom:14px;">
      <div style="font-size:10px;color:var(--tx3);margin-bottom:2px;">${s.brand||''}</div>
      <div style="font-size:17px;font-weight:500;color:var(--tx);">${s.model||''}</div>
    </div>
    ${tocHtml}
    ${imgGallery}
    ${infoTags.length ? `<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px;">${infoTags.map(t => `<span style="font-size:11px;color:var(--tx2);background:var(--bg3);padding:4px 10px;border-radius:12px;">${t}</span>`).join('')}${s.gymOk ? `<span style="font-size:11px;color:#27ae60;background:rgba(39,174,96,0.08);padding:4px 10px;border-radius:12px;">ジム・トレーニング用にもおすすめ</span>` : ''}</div>` : ''}
    ${s.desc ? `<div style="font-size:13px;color:var(--tx2);line-height:1.7;margin-bottom:14px;">${s.desc}</div>` : ''}
    ${divider}
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;padding:12px;background:var(--bg3);border-radius:10px;">
      <div style="font-size:40px;font-weight:500;color:${scoreColor};">${score}</div>
      <div style="font-size:12px;color:var(--tx3);">総合スコア / 100</div>
    </div>
    <div style="font-size:13px;font-weight:500;color:var(--tx);margin-bottom:10px;">パフォーマンス スコア</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
      ${scoreItems.map(i => `
      <div style="background:var(--bg3);border-radius:8px;padding:10px 12px;">
        <div style="font-size:11px;color:var(--tx3);margin-bottom:6px;">${i.lbl}</div>
        <div style="height:6px;background:var(--bd);border-radius:3px;overflow:hidden;margin-bottom:5px;">
          <div style="height:100%;background:${snkScoreColor(i.val)};border-radius:3px;width:${i.val}%"></div>
        </div>
        <div style="font-size:16px;font-weight:500;color:${snkScoreColor(i.val)};">${i.val}<span style="font-size:10px;color:var(--tx3);">/100</span></div>
      </div>`).join('')}
    </div>
    ${s.review ? divider : ''}
    ${reviewHtml}
    ${shops.length ? `${divider}<div style="font-size:13px;font-weight:500;color:var(--tx);margin-bottom:10px;">価格比較・購入</div>${shopsHtml}` : ''}
  `;
  modal.style.display = 'block';
  document.body.style.overflow = 'hidden';
  if (typeof applyArticleFontSize === 'function') applyArticleFontSize();
  const fixedAd = document.getElementById('fixedAdBanner');
  if (fixedAd) { fixedAd.dataset.wasVisible = fixedAd.style.display !== 'none' ? '1' : '0'; fixedAd.style.display = 'none'; }
}
function closeSnkModal() {
  const modal = document.getElementById('snkModal');
  if (modal) modal.style.display = 'none';
  document.title = 'COURTSIDE - NBA速報・まとめ';
  _snkModalReturnTo = null;
  const fixedAd = document.getElementById('fixedAdBanner');
  if (fixedAd && fixedAd.dataset.wasVisible === '1') fixedAd.style.display = 'block';
}

function snkModalGoBack() {
  if (_snkModalReturnTo && _snkModalReturnTo.type === 'ranking') {
    const rid = _snkModalReturnTo.id;
    _snkModalReturnTo = null;
    openSnkRankingModal(rid);
  } else {
    closeSnkModal();
  }
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
    loadRankingPicker();
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
let _rankingSelectedIds = [];

async function loadRankingPicker() {
  try {
    const res = await fetch(FB_SNEAKERS + '.json');
    const data = await res.json();
    _allSneakers = data ? Object.entries(data).map(([id,s]) => ({id,...s})).sort((a,b) => (b.ts||0)-(a.ts||0)) : [];
  } catch(e) { /* keep whatever _allSneakers currently has */ }
  renderRankingPickerList();
  renderRankingSelectedList();
}

function filterRankingPicker() {
  renderRankingPickerList();
}

function renderRankingPickerList() {
  const wrap = document.getElementById('rankingPickerList');
  if (!wrap) return;
  const q = (document.getElementById('rankingSearchInput')?.value || '').trim().toLowerCase();
  const list = (_allSneakers || []).filter(s => {
    if (!q) return true;
    return `${s.brand||''} ${s.model||''}`.toLowerCase().includes(q);
  });
  if (!list.length) {
    wrap.innerHTML = '<div style="font-size:11px;color:#999;text-align:center;padding:10px;">該当するソロ投稿がありません。先に「1つだけ紹介」で商品を投稿してください</div>';
    return;
  }
  wrap.innerHTML = list.map(s => {
    const picked = _rankingSelectedIds.includes(s.id);
    return `
    <div style="display:flex;align-items:center;gap:8px;padding:6px;border-radius:6px;${picked ? 'opacity:0.4;' : ''}">
      ${s.img ? `<img src="${s.img}" style="width:36px;height:36px;object-fit:cover;border-radius:6px;flex-shrink:0;">` : `<div style="width:36px;height:36px;background:#f0f0f0;border-radius:6px;flex-shrink:0;"></div>`}
      <div style="flex:1;min-width:0;font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
        <span style="color:#999;">${s.brand||''}</span> ${s.model||''}
      </div>
      <button type="button" ${picked ? 'disabled' : ''} onclick="addRankingPick('${s.id}')" style="padding:5px 10px;border-radius:6px;border:none;font-size:11px;font-weight:700;flex-shrink:0;cursor:${picked ? 'default' : 'pointer'};background:${picked ? '#eee' : '#C9082A'};color:${picked ? '#999' : '#fff'};">${picked ? '追加済み' : '追加'}</button>
    </div>`;
  }).join('');
}

function addRankingPick(id) {
  if (_rankingSelectedIds.includes(id)) return;
  _rankingSelectedIds.push(id);
  renderRankingPickerList();
  renderRankingSelectedList();
}

function removeRankingPick(id) {
  _rankingSelectedIds = _rankingSelectedIds.filter(x => x !== id);
  renderRankingPickerList();
  renderRankingSelectedList();
}

function moveRankingPick(id, dir) {
  const i = _rankingSelectedIds.indexOf(id);
  if (i < 0) return;
  const j = i + dir;
  if (j < 0 || j >= _rankingSelectedIds.length) return;
  const tmp = _rankingSelectedIds[i];
  _rankingSelectedIds[i] = _rankingSelectedIds[j];
  _rankingSelectedIds[j] = tmp;
  renderRankingSelectedList();
}

const CIRCLED_NUMS = ['①','②','③','④','⑤','⑥','⑦','⑧','⑨','⑩'];

function renderRankingSelectedList() {
  const wrap = document.getElementById('rankingSelectedList');
  if (!wrap) return;
  if (!_rankingSelectedIds.length) {
    wrap.innerHTML = '<div style="font-size:11px;color:#999;text-align:center;padding:10px;">上のリストから商品を追加してください</div>';
    return;
  }
  wrap.innerHTML = _rankingSelectedIds.map((id, i) => {
    const s = (_allSneakers || []).find(x => x.id === id);
    if (!s) return '';
    return `
    <div style="display:flex;align-items:center;gap:8px;background:#fafafa;border:1px solid #eee;border-radius:8px;padding:8px;">
      <span class="ranking-item-badge" style="font-size:12px;font-weight:700;color:#C9082A;background:rgba(201,8,42,0.08);padding:3px 8px;border-radius:10px;flex-shrink:0;">商品${CIRCLED_NUMS[i] || (i + 1)}</span>
      ${s.img ? `<img src="${s.img}" style="width:36px;height:36px;object-fit:cover;border-radius:6px;flex-shrink:0;">` : ''}
      <div style="flex:1;min-width:0;font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
        <span style="color:#999;">${s.brand||''}</span> ${s.model||''}
      </div>
      <div style="display:flex;gap:4px;flex-shrink:0;">
        <button type="button" onclick="moveRankingPick('${id}',-1)" ${i === 0 ? 'disabled' : ''} style="width:24px;height:24px;border:1px solid #eee;background:#fff;border-radius:5px;cursor:pointer;font-size:11px;">▲</button>
        <button type="button" onclick="moveRankingPick('${id}',1)" ${i === _rankingSelectedIds.length - 1 ? 'disabled' : ''} style="width:24px;height:24px;border:1px solid #eee;background:#fff;border-radius:5px;cursor:pointer;font-size:11px;">▼</button>
        <button type="button" onclick="removeRankingPick('${id}')" style="width:24px;height:24px;border:1px solid #eee;background:#fff;border-radius:5px;cursor:pointer;font-size:11px;color:#C9082A;">✕</button>
      </div>
    </div>`;
  }).join('');
}

function cancelSneakerRanking() {
  document.getElementById('sneakerRankingForm').style.display = 'none';
  document.getElementById('rankingTitle').value = '';
  if (document.getElementById('rankingThumb')) document.getElementById('rankingThumb').value = '';
  if (document.getElementById('rankingSearchInput')) document.getElementById('rankingSearchInput').value = '';
  _rankingSelectedIds = [];
}

async function submitSneakerRanking() {
  const title = document.getElementById('rankingTitle').value.trim();
  if (!title) { alert('ランキングタイトルを入力してください'); return; }
  if (!_rankingSelectedIds.length) { alert('商品を1つ以上選んでください'); return; }
  const mall = document.getElementById('rankingMall').value;
  const thumb = document.getElementById('rankingThumb') ? document.getElementById('rankingThumb').value.trim() : '';
  const firstItem = (_allSneakers || []).find(s => s.id === _rankingSelectedIds[0]);
  const img = thumb || (firstItem && firstItem.img) || '';

  const btn = document.getElementById('rankingSubmitBtn');
  if (btn) { btn.disabled = true; btn.textContent = '投稿中...'; }
  try {
    await fetch(FB_SNEAKER_RANKINGS + '.json', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ title, mall, img, itemIds: _rankingSelectedIds.slice(), date: new Date().toISOString().slice(0,10), ts: Date.now() })
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

function snkResolveRankingItems(r) {
  if (Array.isArray(r.itemIds) && r.itemIds.length) {
    return r.itemIds.map(id => (_allSneakers || []).find(s => s.id === id)).filter(Boolean);
  }
  // 旧データ（フルコピー方式）の後方互換
  return r.items || [];
}

function renderSneakerRankingCard(r) {
  const items = snkResolveRankingItems(r);
  const thumb = r.img || (items[0] && items[0].img) || '';
  const top = items[0];
  return `
  <div onclick="openSnkRankingModal('${r.id}')" style="background:var(--card);border:0.5px solid var(--bd);border-radius:10px;padding:8px 10px;cursor:pointer;">
    <div style="display:flex;align-items:center;gap:5px;margin-bottom:4px;">
      <span style="font-size:8px;font-weight:700;color:#c9720a;background:#fff3e0;padding:2px 6px;border-radius:4px;">🏆 ランキング</span>
      <span style="font-size:9px;color:var(--tx3);">${r.mall||''}・${items.length}アイテム</span>
    </div>
    <div style="display:flex;gap:9px;">
      ${thumb ? `<img src="${thumb}" style="width:54px;height:54px;object-fit:cover;border-radius:8px;flex-shrink:0;">` : `<div style="width:54px;height:54px;background:var(--bg3);border-radius:8px;flex-shrink:0;"></div>`}
      <div style="flex:1;min-width:0;">
        <div style="font-size:12.5px;font-weight:700;color:var(--tx);line-height:1.25;margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${r.title||''}</div>
        <div style="font-size:10.5px;color:var(--tx3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${top ? `1位：${top.brand||''} ${top.model||''}` : ''}</div>
      </div>
    </div>
  </div>`;
}

async function openSnkRankingModal(id) {
  const modal = document.getElementById('snkModal');
  const body = document.getElementById('snkModalBody');
  if (!modal || !body) return;
  let r = (_allSneakerRankings || []).find(x => x.id === id);
  if (!r) {
    try {
      const res = await fetch(`${FB_SNEAKER_RANKINGS}/${id}.json`);
      const d = await res.json();
      if (!d) return;
      r = { id, ...d };
    } catch(e) { return; }
  }
  if (!_allSneakers.length) {
    try {
      const snkRes = await fetch(`${FB_SNEAKERS}.json`);
      const snkData = await snkRes.json();
      _allSneakers = snkData ? Object.entries(snkData).map(([sid,s]) => ({id:sid,...s})) : [];
    } catch(e) {}
  }
  const items = snkResolveRankingItems(r);

  body.innerHTML = `
    <button onclick="closeSnkModal()" style="display:block;background:var(--bg3);border:1px solid var(--bd);color:var(--tx);padding:.5rem 1rem;border-radius:8px;font-size:.8rem;cursor:pointer;margin-bottom:1.2rem;">← 戻る</button>
    <div style="margin-bottom:14px;">
      <div style="font-size:10px;color:var(--tx3);margin-bottom:2px;">${r.mall||''}ランキング</div>
      <div style="font-size:17px;font-weight:500;color:var(--tx);">${r.title||''}</div>
    </div>
    <div style="display:flex;flex-direction:column;gap:10px;">
      ${items.map((it, i) => {
        const score = calcSneakerScore(it);
        const scoreColor = snkScoreColor(score);
        return `
        <div onclick="_snkModalReturnTo={type:'ranking',id:'${r.id}'};openSnkModal('${it.id}')" style="background:var(--bg3);border-radius:10px;padding:12px;display:flex;gap:10px;cursor:pointer;">
          <div style="position:relative;flex-shrink:0;">
            ${it.img ? `<img src="${it.img}" style="width:64px;height:64px;object-fit:cover;border-radius:8px;">` : `<div style="width:64px;height:64px;background:var(--card);border-radius:8px;"></div>`}
            <div style="position:absolute;top:-6px;left:-6px;background:#C9082A;color:#fff;font-size:11px;font-weight:700;width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;">${i+1}</div>
          </div>
          <div style="flex:1;min-width:0;">
            <div style="font-size:10px;color:var(--tx3);">${it.brand||''}</div>
            <div style="font-size:13px;font-weight:500;color:var(--tx);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${it.model||''}</div>
            <div style="display:flex;align-items:center;justify-content:space-between;margin-top:6px;">
              <span style="font-size:11px;font-weight:700;color:${scoreColor};">総合${score}</span>
              <span style="font-size:12px;font-weight:500;color:var(--tx);">${it.price||''}</span>
            </div>
          </div>
        </div>`;
      }).join('')}
    </div>
  `;
  modal.style.display = 'block';
  document.body.style.overflow = 'hidden';
  const fixedAd = document.getElementById('fixedAdBanner');
  if (fixedAd) { fixedAd.dataset.wasVisible = fixedAd.style.display !== 'none' ? '1' : '0'; fixedAd.style.display = 'none'; }
}
