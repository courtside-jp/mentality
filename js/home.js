// home.js — ホーム：今日の試合（軽量）＋ 記事/バッシュ/アイテムの統合フィード

let _homeFeedCache = [];

const HOME_TYPE_LABEL = { article: '記事', sneaker: 'バッシュ', item: 'アイテム', ranking: 'ランキング' };
const HOME_TYPE_COLOR = { article: 'var(--or)', sneaker: '#0a84ff', item: '#8b5cf6', ranking: '#c9720a' };
const HOME_TYPE_EMOJI = { article: '📰', sneaker: '👟', item: '👕', ranking: '🏆' };

// ============================================================
// 上部：今日の試合（軽量ウィジェット）
// schedule2.js の GAMES / loadESPNScoreboard をそのまま再利用
// ============================================================
async function loadHomeGames() {
  const wrap = document.getElementById('homeGamesWrap');
  if (!wrap) return;

  if (typeof loadESPNScoreboard === 'function') {
    try { await loadESPNScoreboard(); } catch(e) {}
  }

  const games = (typeof GAMES !== 'undefined' && GAMES['0']) ? GAMES['0'] : [];
  if (!games.length) {
    wrap.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:.5rem 1rem .3rem;">
      <div style="font-family:'Barlow Condensed',sans-serif;font-size:.8rem;font-weight:700;color:var(--tx3);letter-spacing:1px;">今日の試合</div>
      <div onclick="goPage('schedule', document.getElementById('sn-schedule'))" style="font-size:.7rem;color:var(--or);cursor:pointer;">すべて見る ›</div>
    </div>
    <div style="padding:.6rem 1rem 1rem;text-align:center;color:var(--tx3);font-size:.78rem;">本日は試合なし</div>
    `;
    return;
  }

  wrap.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:.5rem 1rem .3rem;">
      <div style="font-family:'Barlow Condensed',sans-serif;font-size:.8rem;font-weight:700;color:var(--tx3);letter-spacing:1px;">今日の試合</div>
      <div onclick="goPage('schedule', document.getElementById('sn-schedule'))" style="font-size:.7rem;color:var(--or);cursor:pointer;">すべて見る ›</div>
    </div>
    <div style="display:flex;gap:.6rem;overflow-x:auto;padding:0 1rem .4rem;scrollbar-width:none;">
      ${games.map(g => `
        <div onclick="goPage('schedule', document.getElementById('sn-schedule'));setTimeout(function(){if(typeof selectGame==='function')selectGame('${g.id}')},150)" style="flex-shrink:0;width:140px;background:var(--card);border:1px solid var(--bd);border-radius:10px;padding:.5rem .6rem;cursor:pointer;">
          <div style="font-size:.55rem;color:${g.status==='live'?'var(--rd)':'var(--tx3)'};font-weight:700;margin-bottom:.4rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${g.status==='live' ? '● LIVE ' + (g.note||'') : g.status==='final' ? 'FINAL' : (g.note||'')}</div>
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.2rem;">
            <span style="font-size:.7rem;font-weight:700;color:var(--tx);">${g.away.abbr}</span>
            <span style="font-size:.85rem;font-weight:700;color:var(--tx);">${g.status==='pre' ? '' : g.away.score}</span>
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;">
            <span style="font-size:.7rem;font-weight:700;color:var(--tx);">${g.home.abbr}</span>
            <span style="font-size:.85rem;font-weight:700;color:var(--tx);">${g.status==='pre' ? '' : g.home.score}</span>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// ============================================================
// 下部：記事・バッシュ・アイテムを混ぜた新着順フィード
// ============================================================
async function loadHomeFeed() {
  const wrap = document.getElementById('homeFeedWrap');
  if (!wrap) return;
  wrap.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--tx3);font-size:.75rem;">取得中...</div>';

  try {
    const [artRes, snkRes, itmRes, rankRes] = await Promise.all([
      fetch(`${FB_URL}/articles.json`),
      fetch(`${FB_URL}/sneakers.json`),
      fetch(`${FB_URL}/items.json`),
      fetch(`${FB_URL}/sneakerRankings.json`)
    ]);
    const [artData, snkData, itmData, rankData] = await Promise.all([
      artRes.json(), snkRes.json(), itmRes.json(), rankRes.json()
    ]);

    const articles = artData ? Object.entries(artData).map(([id, a]) => ({ ...a, id, _type: 'article' })).filter(a => !a.archived) : [];
    const sneakers = snkData ? Object.entries(snkData).map(([id, s]) => ({ ...s, id, _type: 'sneaker' })) : [];
    const items    = itmData ? Object.entries(itmData).map(([id, s]) => ({ ...s, id, _type: 'item' })) : [];
    const rankings = rankData ? Object.entries(rankData).map(([id, r]) => ({ ...r, id, _type: 'ranking', img: r.img || (r.items && r.items[0] && r.items[0].img) || '' })) : [];

    const now = Date.now();
    _homeFeedCache = [...articles, ...sneakers, ...items, ...rankings]
      .filter(p => !p.publishAt || p.publishAt <= now)
      .sort((a, b) => (b.ts || 0) - (a.ts || 0)).slice(0, 5);

    renderHomeFeed(_homeFeedCache);
  } catch (e) {
    wrap.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--tx3);">取得に失敗しました</div>';
  }
}

function renderHomeFeed(list) {
  const wrap = document.getElementById('homeFeedWrap');
  if (!wrap) return;
  if (!list.length) { wrap.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--tx3);">まだ投稿がありません</div>'; return; }

  wrap.innerHTML = list.map(p => {
    const sneakerName = p._type === 'sneaker' ? [p.brand, p.model].filter(Boolean).join(' ') : '';
    const title = p.title || p.name || (sneakerName ? sneakerName + ' レビューまとめ' : '');
    const img   = p.img || '';
    const onclickFn = p._type === 'article' ? `openArticle('${p.id}')`
                     : p._type === 'sneaker' ? `openSnkModal('${p.id}')`
                     : p._type === 'ranking' ? `goPage('sneakers');setTimeout(()=>openSnkRankingModal('${p.id}'),300)`
                     : `openItemModal('${p.id}')`;
    return `
    <div onclick="${onclickFn}" style="display:flex;gap:.4rem;background:var(--card);border:0;border-bottom:1px solid var(--bd);padding:.4rem;margin-bottom:0;cursor:pointer;">
      ${img
        ? `<img src="${img}" style="width:64px;height:64px;border-radius:8px;object-fit:cover;flex-shrink:0;" onerror="this.style.display='none'">`
        : `<div style="width:64px;height:64px;border-radius:8px;background:var(--bg3);display:flex;align-items:center;justify-content:center;font-size:1.6rem;flex-shrink:0;">${HOME_TYPE_EMOJI[p._type]}</div>`
      }
      <div style="flex:1;min-width:0;">
        <div style="display:flex;align-items:center;gap:.4rem;margin-bottom:.3rem;">
          <span style="font-size:.55rem;background:${HOME_TYPE_COLOR[p._type]};color:#fff;padding:.1rem .45rem;border-radius:6px;font-weight:700;">${HOME_TYPE_LABEL[p._type]}</span>
          <span style="font-size:.58rem;color:var(--tx3);">${p.ts ? new Date(p.ts).toLocaleDateString('ja-JP') : ''}</span>
        </div>
        <div style="font-size:.77rem;font-weight:700;color:var(--tx);line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${title}</div>
      </div>
    </div>`;
  }).join('');
}
