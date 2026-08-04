function isHeadingLine(t) {
  // Ã£ÂÂ¿Ã£ÂÂ°Ã£ÂÂÃ©ÂÂ¤Ã¥ÂÂ»Ã£ÂÂÃ£ÂÂ¦Ã£ÂÂÃ£ÂÂ§Ã£ÂÂÃ£ÂÂ¯
  const plain = t.replace(/<[^>]+>/g, '').trim();
  if (!plain) return false;
  const c = plain.charCodeAt(0);
  return c === 9632 || c === 9642; // Ã¢ÂÂ  or Ã¢ÂÂª
}
// === Ã§ÂÂ®Ã¦Â¬Â¡Ã§ÂÂÃ¦ÂÂ ===
function generateTOC(body) {
  if (!body) return '';
  function _isH(t) { const p = t.replace(/<[^>]+>/g,'').trim(); return p && (p.charCodeAt(0) === 9632 || p.charCodeAt(0) === 9642); }
  const lines = body.split('\n');
  const headings = [];
  lines.forEach((line, i) => {
    const t = line.trim();
    if (t && _isH(t)) {
      headings.push({ text: t, idx: i });
    }
  });
  if (headings.length < 2) return '';
  const items = headings.map((h, i) => {
    const label = h.text.replace(/<[^>]+>/g, '').replace(/^[\u25a0\u25aa]\s*/, '').trim();
    return `<li style="margin:3px 0;"><a href="#toc-${i}" onclick="event.preventDefault();const el=document.getElementById('toc-${i}');if(el)el.scrollIntoView({behavior:'smooth'});" style="color:#111;text-decoration:underline;font-size:12px;line-height:1.7;">${label}</a></li>`;
  }).join('');
  const uid = 'toc-' + Math.random().toString(36).slice(2,7);
  return `<details style="background:#f8f8f8;border:1px solid #eee;border-radius:10px;margin:0 0 20px;overflow:hidden;">
    <summary style="padding:12px 16px;cursor:pointer;font-size:12px;font-weight:800;color:#555;letter-spacing:.08em;list-style:none;display:flex;align-items:center;gap:6px;user-select:none;">
      \u76ee\u6b21 <span style="font-size:10px;color:#999;margin-left:4px;">Ã¢ÂÂ¼</span>
    </summary>
    <div style="padding:1px 8px 6px;font-size:.76rem;">
      <ol style="margin:0;padding-left:20px;">${items}</ol>
    </div>
  </details>`;
}

// articles.js Ã¢ÂÂ Ã¨Â¨ÂÃ¤ÂºÂÃ¦ÂÂÃ§Â¨Â¿Ã£ÂÂ»Ã¤Â¸ÂÃ¨Â¦Â§Ã£ÂÂ»Ã¨Â©Â³Ã§Â´Â°

const FB_ARTICLES = `${FB_URL}/articles`;
const ADMIN_PASSWORD = 'kobe0824';
function msToDatetimeLocal(ms) {
  if (!ms) return '';
  const dt = new Date(ms);
  const off = dt.getTimezoneOffset() * 60000;
  return new Date(dt.getTime() - off).toISOString().slice(0, 16);
}
function articlePublicUrl(id) {
  return `https://courtside-jp.github.io/mentality/articles/${id}.html`;
}
function showAdminArticleUrl(id) {
  const wrap = document.getElementById('adminArticleUrlWrap');
  const input = document.getElementById('adminArticleUrl');
  if (!wrap || !input) return;
  if (!id) { wrap.style.display = 'none'; input.value = ''; return; }
  wrap.style.display = 'block';
  input.value = articlePublicUrl(id);
}
function copyAdminArticleUrl() {
  const el = document.getElementById('adminArticleUrl');
  if (!el || !el.value) return;
  const done = () => { el.select(); };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(el.value).then(() => { alert('URLÃ£ÂÂÃ£ÂÂ³Ã£ÂÂÃ£ÂÂ¼Ã£ÂÂÃ£ÂÂ¾Ã£ÂÂÃ£ÂÂ'); }).catch(() => {
      el.select(); document.execCommand('copy'); alert('URLÃ£ÂÂÃ£ÂÂ³Ã£ÂÂÃ£ÂÂ¼Ã£ÂÂÃ£ÂÂ¾Ã£ÂÂÃ£ÂÂ');
    });
  } else {
    el.select(); document.execCommand('copy'); alert('URLÃ£ÂÂÃ£ÂÂ³Ã£ÂÂÃ£ÂÂ¼Ã£ÂÂÃ£ÂÂ¾Ã£ÂÂÃ£ÂÂ');
  }
}

// ============================================================
// Ã©ÂÂ¢Ã©ÂÂ£Ã¨Â¨ÂÃ¤ÂºÂÃ¯Â¼ÂÃ¨Â¨ÂÃ¤ÂºÂÃ¤Â¸ÂÃ£ÂÂ«Ã¨Â¡Â¨Ã§Â¤ÂºÃ£ÂÂÃ¥ÂÂÃ©ÂÂÃ§ÂÂÃ£ÂÂ¢Ã£ÂÂÃ£ÂÂÃ§ÂÂ¨Ã¯Â¼Â
// ============================================================
async function renderRelatedArticles(currentId, category) {
  const wrap = document.getElementById('relatedArticlesWrap');
  if (!wrap) return;
  try {
    const res = await fetch(FB_ARTICLES + '.json');
    const data = await res.json();
    if (!data) { wrap.innerHTML = ''; return; }
    const now = Date.now();
    let list = Object.entries(data)
      .map(([id, a]) => ({ id, ...a }))
      .filter(a => a.id !== currentId)
      .filter(a => a.status !== 'archived')
      .filter(a => !a.publishAt || a.publishAt <= now);

    // Ã¥ÂÂÃ£ÂÂÃ£ÂÂ«Ã£ÂÂÃ£ÂÂ´Ã£ÂÂªÃ£ÂÂÃ¥ÂÂªÃ¥ÂÂÃ£ÂÂÃ£ÂÂÃ¨Â¶Â³Ã£ÂÂÃ£ÂÂªÃ£ÂÂÃ¥ÂÂÃ£ÂÂ¯Ã¦ÂÂ°Ã§ÂÂÃ£ÂÂ§Ã¨Â£ÂÃ£ÂÂ
    const sameCategory = list.filter(a => a.category === category).sort((a,b) => (b.ts||0) - (a.ts||0));
    const others = list.filter(a => a.category !== category).sort((a,b) => (b.ts||0) - (a.ts||0));
    const picked = [...sameCategory, ...others].slice(0, 4);

    if (!picked.length) { wrap.innerHTML = ''; return; }

    wrap.innerHTML = '<div style="font-family:\'Barlow Condensed\',sans-serif;font-size:.85rem;font-weight:700;color:var(--tx);letter-spacing:1px;margin-bottom:.6rem;">Ã©ÂÂ¢Ã©ÂÂ£Ã¨Â¨ÂÃ¤ÂºÂ</div>' +
      '<div style="display:flex;flex-direction:column;gap:.6rem;">' +
      picked.map(a => `
        <div onclick="openArticle('${a.id}')" style="display:flex;gap:.7rem;align-items:center;cursor:pointer;background:var(--bg3);border:1px solid var(--bd);border-radius:10px;padding:.5rem;">
          ${a.img ? `<img loading="lazy" decoding="async" src="${a.img}" style="width:64px;height:48px;object-fit:cover;border-radius:6px;flex-shrink:0;" onerror="this.style.display='none'">` : ''}
          <div style="min-width:0;">
            <div style="font-size:.55rem;color:var(--or);font-weight:700;margin-bottom:.2rem;">${a.category||'NBA'}</div>
            <div style="font-size:.78rem;color:var(--tx);line-height:1.4;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;">${a.title||''}</div>
          </div>
        </div>
      `).join('') +
      '</div>';
  } catch(e) {
    wrap.innerHTML = '';
  }
}

// ============================================================
// Ã¦ÂÂ¬Ã¦ÂÂÃ£ÂÂ¬Ã£ÂÂ³Ã£ÂÂÃ£ÂÂªÃ£ÂÂ³Ã£ÂÂ°Ã¯Â¼ÂURLÃ¨ÂÂªÃ¥ÂÂÃ¥ÂÂ¤Ã¥ÂÂ¥Ã¯Â¼Â
// ============================================================
function showProductImage(url) {
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:9999;display:flex;align-items:center;justify-content:center;padding:24px;';
  overlay.onclick = function() { overlay.remove(); };
  overlay.innerHTML = '<img loading="lazy" decoding="async" src="' + url + '" style="max-width:100%;max-height:100%;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,.5);">' +
    '<div style="position:absolute;top:18px;right:20px;color:#fff;font-size:1.8rem;cursor:pointer;">&times;</div>';
  document.body.appendChild(overlay);
}

function applyInlineBold(text) {
  return text.replace(/\*\*(.+?)\*\*/g, '<strong style="font-weight:800;">$1</strong>');
}

function renderBody(body) {
  if (!body) return '';
  const lines = body.split('\n');
  const html = lines.map(line => {
    const t = line.trim();
    const yt = t.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (yt) return '<div style="margin:.8rem 0;"><iframe width="100%" height="200" src="https://www.youtube.com/embed/' + yt[1] + '" frameborder="0" allowfullscreen style="border-radius:10px;"></iframe></div>';
    if (t.includes('tiktok.com')) return '<div style="margin:.8rem 0;text-align:center;"><blockquote class="tiktok-embed" cite="' + t + '" data-video-id="' + (t.match(/video\/(\d+)/)||[])[1] + '"><a href="' + t + '">TikTokÃ¥ÂÂÃ§ÂÂ»</a></blockquote><script async src="https://www.tiktok.com/embed.js"><\/script></div>';
    if (t.includes('instagram.com')) return '<div style="margin:.8rem 0;"><blockquote class="instagram-media" data-instgrm-permalink="' + t + '"><a href="' + t + '">InstagramÃ¦ÂÂÃ§Â¨Â¿</a></blockquote><script async src="//www.instagram.com/embed.js"><\/script></div>';
    if ((t.includes('twitter.com') || t.includes('x.com')) && !t.startsWith('[quote')) return '<div class="tweet-embed-safe" style="margin:.8rem 0;max-height:700px;overflow-y:auto;-webkit-overflow-scrolling:touch;"><blockquote class="twitter-tweet"><a href="' + t + '"></a></blockquote></div>';
    if (t.match(/\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i)) return '<div style="margin:.8rem 0;"><img loading="lazy" decoding="async" src="' + t + '" style="width:100%;border-radius:10px;" onerror="this.style.display=\'none\'"></div>';
    const productMatch = t.match(/\[product name="([^"]*)" price="([^"]*)" url="([^"]*)"(?: img="([^"]*)")?\]/);
    if (productMatch) {
      const [, pName, pPrice, pUrl, pImg] = productMatch;
      const iconHtml = pImg
        ? '<img loading="lazy" decoding="async" src="' + pImg + '" style="width:44px;height:44px;object-fit:cover;border-radius:8px;flex-shrink:0;background:#fff;" onerror="this.style.display=\'none\'">'
        : '<div style="font-size:1.5rem;">Ã°ÂÂÂ</div>';
      return '<a href="' + pUrl + '" target="_blank" style="display:block;text-decoration:none;margin:.8rem 0;background:var(--bg3);border:1px solid var(--bd);border-radius:12px;padding:.8rem;"><div style="display:flex;align-items:center;gap:.6rem;">' + iconHtml + '<div style="flex:1;min-width:0;"><div style="font-size:.82rem;font-weight:700;color:var(--tx);margin-bottom:.2rem;">' + pName + '</div>' + (pPrice ? '<div style="font-size:.85rem;font-weight:700;color:var(--or);">' + pPrice + '</div>' : '') + '</div><div style="background:var(--or);color:#fff;padding:.4rem .8rem;border-radius:8px;font-size:.72rem;font-weight:700;flex-shrink:0;">Ã¨Â³Â¼Ã¥ÂÂ¥Ã£ÂÂÃ£ÂÂ</div></div></a>';
    }
    const quoteMatch = t.match(/\[quote text="([^"]*)" name="([^"]*)" source="([^"]*)" url="([^"]*)"\]/);
    if (quoteMatch) {
      const [, qText, qName, qSource, qUrl] = quoteMatch;
      return '<div style="margin:1rem 0;padding:1rem 1.1rem;background:var(--bg3);border-left:4px solid var(--accent,#e63946);border-radius:0 10px 10px 0;">' +
        '<div style="font-size:.92rem;font-style:italic;color:var(--tx);line-height:1.75;">' + applyInlineBold(qText) + '</div>' +
        (qName ? '<div style="margin-top:.5rem;font-size:.75rem;font-weight:700;color:var(--tx2);">Ã¢ÂÂ ' + qName + '</div>' : '') +
        (qUrl ? '<a href="' + qUrl + '" target="_blank" style="display:inline-block;margin-top:.4rem;font-size:.65rem;color:var(--tx3);text-decoration:underline;">Ã¥Â¼ÂÃ§ÂÂ¨Ã¥ÂÂÃ¯Â¼Â' + (qSource || 'Ã£ÂÂªÃ£ÂÂ³Ã£ÂÂ¯') + '</a>' : (qSource ? '<div style="margin-top:.4rem;font-size:.65rem;color:var(--tx3);">Ã¥Â¼ÂÃ§ÂÂ¨Ã¥ÂÂÃ¯Â¼Â' + qSource + '</div>' : '')) +
        '</div>';
    }
    const shopcardMatch = t.match(/\[shopcard name="([^"]*)" img="([^"]*)" rakuten="([^"]*)" rakutenPrice="([^"]*)" amazon="([^"]*)" amazonPrice="([^"]*)"\]/);
    if (shopcardMatch) {
      const [, scName, scImg, scRakuten, scRakutenPrice, scAmazon, scAmazonPrice] = shopcardMatch;
      const activeStyle = 'background:#e63946;color:#fff;';
      const inactiveStyle = 'background:var(--bg2,#eee);color:var(--tx3);cursor:default;';
      const rakutenBtn = scRakuten
        ? '<a href="' + scRakuten + '" target="_blank" style="flex:1;text-align:center;text-decoration:none;padding:.5rem .3rem;border-radius:9px;font-size:.68rem;font-weight:700;line-height:1.5;' + activeStyle + '">Ã¦Â¥Â½Ã¥Â¤Â©' + (scRakutenPrice ? '<br>' + scRakutenPrice : '') + '</a>'
        : '<span style="flex:1;text-align:center;padding:.5rem .3rem;border-radius:9px;font-size:.68rem;font-weight:700;line-height:1.5;' + inactiveStyle + '">Ã¦Â¥Â½Ã¥Â¤Â©<br>Ã¥ÂÂÃ¦ÂÂ±Ã£ÂÂªÃ£ÂÂ</span>';
      const amazonBtn = scAmazon
        ? '<a href="' + scAmazon + '" target="_blank" style="flex:1;text-align:center;text-decoration:none;padding:.5rem .3rem;border-radius:9px;font-size:.68rem;font-weight:700;line-height:1.5;' + activeStyle + '">Amazon' + (scAmazonPrice ? '<br>' + scAmazonPrice : '') + '</a>'
        : '<span style="flex:1;text-align:center;padding:.5rem .3rem;border-radius:9px;font-size:.68rem;font-weight:700;line-height:1.5;' + inactiveStyle + '">Amazon<br>Ã¥ÂÂÃ¦ÂÂ±Ã£ÂÂªÃ£ÂÂ</span>';
      return '<div style="display:flex;gap:.7rem;align-items:center;background:var(--bg3);border:1px solid var(--bd);border-radius:12px;padding:.7rem;margin:.7rem 0;">' +
        '<img loading="lazy" decoding="async" src="' + scImg + '" onclick="showProductImage(\'' + scImg + '\')" style="width:52px;height:52px;object-fit:cover;border-radius:8px;flex-shrink:0;background:#fff;cursor:pointer;" onerror="this.style.display=\'none\'">' +
        '<div style="flex:1;min-width:0;">' +
        '<div style="font-size:.78rem;font-weight:700;color:var(--tx);margin-bottom:.45rem;line-height:1.4;">' + scName + '</div>' +
        '<div style="display:flex;gap:.4rem;">' + rakutenBtn + amazonBtn + '</div>' +
        '</div></div>';
    }
    // Ã¢ÂÂ  Ã¢ÂÂ Ã¥Â¤Â§Ã¨Â¦ÂÃ¥ÂÂºÃ£ÂÂÃ¯Â¼ÂÃ§ÂÂ®Ã¦Â¬Â¡Ã¥Â¯Â¾Ã¥Â¿ÂÃ£ÂÂ»Ã¨ÂµÂ¤Ã£ÂÂÃ§ÂÂ®Ã§Â«ÂÃ£ÂÂ¤Ã£ÂÂ¹Ã£ÂÂ¿Ã£ÂÂ¤Ã£ÂÂ«Ã¯Â¼Â
    if (t && (function(x){const p=x.replace(/<[^>]+>/g,'').trim();return p&&(p.charCodeAt(0)===9632||p.charCodeAt(0)===9642);})(t)) {
      const hIdx = (() => { let cnt = 0; for (let i = 0; i < lines.indexOf(line); i++) { const lt = lines[i].trim(); if (lt && (function(x){const p=x.replace(/<[^>]+>/g,'').trim();return p&&(p.charCodeAt(0)===9632||p.charCodeAt(0)===9642);})(lt)) cnt++; } return cnt; })();
      const label = applyInlineBold(t.replace(/<[^>]+>/g, '').trim());
      return `<h2 id="toc-${hIdx}" style="font-size:1rem;font-weight:800;margin:1.6em 0 .4em;padding-top:1.2em;border-top:1px solid var(--bd,#eee);color:#111;">${label}</h2>`;
    }
    // Ã£ÂÂÃ£ÂÂÃ¢ÂÂ Ã¥Â°ÂÃ¨Â¦ÂÃ¥ÂÂºÃ£ÂÂÃ¯Â¼ÂÃ¦ÂÂ§Ã£ÂÂÃ£ÂÂÃ£ÂÂ¹Ã£ÂÂ¿Ã£ÂÂ¤Ã£ÂÂ«Ã£ÂÂÃ§ÂÂ®Ã¦Â¬Â¡Ã£ÂÂªÃ£ÂÂÃ¯Â¼Â
    if (t && t.charCodeAt(0) === 12304 && t.includes(String.fromCharCode(12305))) {
      return `<h3 style="font-size:.88rem;font-weight:700;margin:1.4em 0 .5em;padding:7px 12px;background:linear-gradient(90deg,rgba(230,57,70,.07),transparent);border-left:3px solid var(--accent,#e63946);border-radius:0 6px 6px 0;">${applyInlineBold(t)}</h3>`;
    }
    return t ? '<p style="margin:.4rem 0;">' + applyInlineBold(t) + '</p>' : '';
  }).join('');
  return wrapCollapsibleSections(html);

  function wrapCollapsibleSections(html) {
    const collapsibleTitles = ['Ã¥ÂÂºÃ¥ÂÂ¸', 'Ã£ÂÂ½Ã£ÂÂ¼Ã£ÂÂ¹Ã¥ÂÂ', 'Ã§ÂÂ»Ã¥ÂÂÃ£ÂÂ¯Ã£ÂÂ¬Ã£ÂÂ¸Ã£ÂÂÃ£ÂÂ'];
    const h2Regex = /<h2 id="toc-\d+"[^>]*>([\s\S]*?)<\/h2>/g;
    const matches = [...html.matchAll(h2Regex)];
    if (!matches.length) return html;
    let result = '';
    let cursor = 0;
    for (let i = 0; i < matches.length; i++) {
      const m = matches[i];
      const labelText = m[1].replace(/<[^>]+>/g, '').trim().replace(/^[\u25a0\u25aa]\s*/, '');
      const sectionStart = m.index;
      const sectionContentStart = m.index + m[0].length;
      const sectionEnd = (i + 1 < matches.length) ? matches[i + 1].index : html.length;
      if (collapsibleTitles.includes(labelText)) {
        result += html.slice(cursor, sectionStart);
        let bodyHtml = html.slice(sectionContentStart, sectionEnd);
        bodyHtml = bodyHtml.replace(/<h3 style="[^"]*">/g, '<h3 style="font-size:.8rem;font-weight:400;color:#888;margin:.5em 0;padding:0;background:none;border-left:none;border-radius:0;">');
        result += '<details style="background:#f8f8f8;border:1px solid #eee;border-radius:6px;margin:.4em 0 .3em;overflow:hidden;">' +
          '<summary style="padding:3px 8px;cursor:pointer;font-size:.7rem;font-weight:600;color:#777;list-style:none;display:flex;align-items:center;gap:4px;user-select:none;line-height:1.3;">' +
          labelText + ' <span style="font-size:10px;color:#999;margin-left:4px;">Ã¢ÂÂ¼</span>' +
          '</summary>' +
          '<div style="padding:4px 16px 14px;">' + bodyHtml + '</div>' +
          '</details>';
        cursor = sectionEnd;
      }
    }
    result += html.slice(cursor);
    return result;
  }
}

// ============================================================
// Ã§ÂÂ»Ã¥ÂÂÃ£ÂÂ¢Ã£ÂÂÃ£ÂÂÃ£ÂÂ­Ã£ÂÂ¼Ã£ÂÂÃ¯Â¼ÂImgBBÃ¯Â¼Â
// ============================================================
// Ã¨Â¨ÂÃ¤ÂºÂÃ£ÂÂªÃ£ÂÂ³Ã£ÂÂ¯Ã¦ÂÂ¿Ã¥ÂÂ¥
async function insertArticleLink() {
  // FirebaseÃ£ÂÂÃ£ÂÂÃ¨Â¨ÂÃ¤ÂºÂÃ¤Â¸ÂÃ¨Â¦Â§Ã£ÂÂÃ¥ÂÂÃ¥Â¾ÂÃ£ÂÂÃ£ÂÂ¦Ã©ÂÂ¸Ã¦ÂÂÃ£ÂÂ¢Ã£ÂÂ¼Ã£ÂÂÃ£ÂÂ«Ã£ÂÂÃ¨Â¡Â¨Ã§Â¤Âº
  const res = await fetch(FB_ARTICLES + '.json');
  const data = await res.json();
  if (!data) return;
  
  const articles = Object.entries(data)
    .map(([id, a]) => ({id, ...a}))
    .filter(a => a.status !== 'archived')
    .sort((a, b) => (b.ts||0) - (a.ts||0))
    .filter(a => { const p = a.publishAt; return !p || p <= Date.now(); })
    .slice(0, 20);

  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:300;overflow-y:auto;padding:16px;';
  overlay.innerHTML = `
    <div style="background:#fff;border-radius:12px;max-width:480px;margin:0 auto;overflow:hidden;">
      <div style="background:#000;padding:12px 16px;display:flex;align-items:center;justify-content:space-between;">
        <span style="color:#fff;font-weight:700;font-size:14px;">Ã¨Â¨ÂÃ¤ÂºÂÃ£ÂÂÃ©ÂÂ¸Ã¦ÂÂ</span>
        <span onclick="this.closest('div[style*=fixed]').remove()" style="color:#fff;cursor:pointer;font-size:20px;">ÃÂ</span>
      </div>
      <div style="padding:8px;">
        ${articles.map(a => `
          <div onclick="doInsertArticleLink('${a.id}','${(a.title||'').replace(/'/g,'')}','${a.img||''}');this.closest('div[style*=fixed]').remove();"
            style="display:flex;gap:10px;padding:10px;border-bottom:1px solid #f0f0f0;cursor:pointer;">
            ${a.img ? `<img loading="lazy" decoding="async" src="${a.img}" style="width:60px;height:45px;object-fit:cover;border-radius:6px;flex-shrink:0;">` : '<div style="width:60px;height:45px;background:#f0f0f0;border-radius:6px;flex-shrink:0;"></div>'}
            <div style="font-size:12px;font-weight:700;color:#000;">${a.title||''}</div>
          </div>`).join('')}
      </div>
    </div>`;
  document.body.appendChild(overlay);
}

function doInsertArticleLink(id, title, img) {
  const card = `<div class="article-link-card" data-id="${id}" style="display:flex;gap:10px;padding:10px;border:1px solid #eee;border-radius:8px;margin:8px 0;cursor:pointer;" onclick="openArticle('${id}')">` +
    (img ? `<img loading="lazy" decoding="async" src="${img}" style="width:80px;height:60px;object-fit:cover;border-radius:6px;flex-shrink:0;">` : '') +
    `<div style="font-size:12px;font-weight:700;">${title}</div></div>`;
  insertHtmlAtCursor('<div>' + card + '</div><div><br></div>');
}

// URLÃ£ÂÂªÃ£ÂÂ³Ã£ÂÂ¯Ã¦ÂÂ¿Ã¥ÂÂ¥
function insertTextLink() {
  const url = prompt('URLÃ£ÂÂÃ¥ÂÂ¥Ã¥ÂÂ:');
  if (!url) return;
  const isImage = confirm('Ã§ÂÂ»Ã¥ÂÂÃ£ÂÂ¨Ã£ÂÂÃ£ÂÂ¦Ã¨Â¡Â¨Ã§Â¤ÂºÃ£ÂÂÃ£ÂÂ¾Ã£ÂÂÃ£ÂÂÃ¯Â¼Â\n\nOK Ã¢ÂÂ Ã§ÂÂ»Ã¥ÂÂÃ¨Â¡Â¨Ã§Â¤Âº\nÃ£ÂÂ­Ã£ÂÂ£Ã£ÂÂ³Ã£ÂÂ»Ã£ÂÂ« Ã¢ÂÂ Ã£ÂÂªÃ£ÂÂ³Ã£ÂÂ¯Ã£ÂÂ¨Ã£ÂÂÃ£ÂÂ¦Ã¦ÂÂ¿Ã¥ÂÂ¥');
  if (isImage) {
    insertHtmlAtCursor(`<div><img loading="lazy" decoding="async" src="${url}" style="width:100%;border-radius:8px;margin:8px 0;"></div><div><br></div>`);
  } else {
    showLinkModal(url);
  }
}

async function insertBodyImage(input) {
  const file = input.files[0];
  if (!file) return;
  const label = input.parentElement;
  label.textContent = 'Ã¢ÂÂ³ Ã£ÂÂ¢Ã£ÂÂÃ£ÂÂÃ£ÂÂ­Ã£ÂÂ¼Ã£ÂÂÃ¤Â¸Â­...';
  
  const reader = new FileReader();
  reader.onload = async (ev) => {
    const base64 = ev.target.result.split(',')[1];
    let url = ev.target.result; // fallback: base64
    
    try {
      const form = new FormData();
      form.append('image', base64);
      const resp = await fetch('https://api.imgbb.com/1/upload?key=6b317240ded356635338f7ce9c45ec05', {
        method: 'POST', body: form
      });
      const data = await resp.json();
      if (data.success) url = data.data.url;
    } catch(e) {}
    
    insertHtmlAtCursor(`<div><img loading="lazy" decoding="async" src="${url}" style="width:100%;border-radius:8px;margin:8px 0;"></div><div><br></div>`);
    
    label.innerHTML = 'Ã°ÂÂÂ· Ã§ÂÂ»Ã¥ÂÂÃ¦ÂÂ¿Ã¥ÂÂ¥<input type="file" accept="image/*" onchange="insertBodyImage(this)" style="display:none;">';
  };
  reader.readAsDataURL(file);
}

// Ã¨Â¨ÂÃ¤ÂºÂÃ£ÂÂªÃ£ÂÂ³Ã£ÂÂ¯Ã¦ÂÂ¿Ã¥ÂÂ¥
async function insertArticleLink() {
  // FirebaseÃ£ÂÂÃ£ÂÂÃ¨Â¨ÂÃ¤ÂºÂÃ¤Â¸ÂÃ¨Â¦Â§Ã£ÂÂÃ¥ÂÂÃ¥Â¾ÂÃ£ÂÂÃ£ÂÂ¦Ã©ÂÂ¸Ã¦ÂÂÃ£ÂÂ¢Ã£ÂÂ¼Ã£ÂÂÃ£ÂÂ«Ã£ÂÂÃ¨Â¡Â¨Ã§Â¤Âº
  const res = await fetch(FB_ARTICLES + '.json');
  const data = await res.json();
  if (!data) return;
  
  const articles = Object.entries(data)
    .map(([id, a]) => ({id, ...a}))
    .filter(a => a.status !== 'archived')
    .sort((a, b) => (b.ts||0) - (a.ts||0))
    .slice(0, 20);

  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:300;overflow-y:auto;padding:16px;';
  overlay.innerHTML = `
    <div style="background:#fff;border-radius:12px;max-width:480px;margin:0 auto;overflow:hidden;">
      <div style="background:#000;padding:12px 16px;display:flex;align-items:center;justify-content:space-between;">
        <span style="color:#fff;font-weight:700;font-size:14px;">Ã¨Â¨ÂÃ¤ÂºÂÃ£ÂÂÃ©ÂÂ¸Ã¦ÂÂ</span>
        <span onclick="this.closest('div[style*=fixed]').remove()" style="color:#fff;cursor:pointer;font-size:20px;">ÃÂ</span>
      </div>
      <div style="padding:8px;">
        ${articles.map(a => `
          <div onclick="doInsertArticleLink('${a.id}','${(a.title||'').replace(/'/g,'')}','${a.img||''}');this.closest('div[style*=fixed]').remove();"
            style="display:flex;gap:10px;padding:10px;border-bottom:1px solid #f0f0f0;cursor:pointer;">
            ${a.img ? `<img loading="lazy" decoding="async" src="${a.img}" style="width:60px;height:45px;object-fit:cover;border-radius:6px;flex-shrink:0;">` : '<div style="width:60px;height:45px;background:#f0f0f0;border-radius:6px;flex-shrink:0;"></div>'}
            <div style="font-size:12px;font-weight:700;color:#000;">${a.title||''}</div>
          </div>`).join('')}
      </div>
    </div>`;
  document.body.appendChild(overlay);
}

function doInsertArticleLink(id, title, img) {
  const card = `<div class="article-link-card" data-id="${id}" style="display:flex;gap:10px;padding:10px;border:1px solid #eee;border-radius:8px;margin:8px 0;cursor:pointer;" onclick="openArticle('${id}')">` +
    (img ? `<img loading="lazy" decoding="async" src="${img}" style="width:80px;height:60px;object-fit:cover;border-radius:6px;flex-shrink:0;">` : '') +
    `<div style="font-size:12px;font-weight:700;">${title}</div></div>`;
  insertHtmlAtCursor('<div>' + card + '</div><div><br></div>');
}

// URLÃ£ÂÂªÃ£ÂÂ³Ã£ÂÂ¯Ã¦ÂÂ¿Ã¥ÂÂ¥
function insertTextLink() {
  const url = prompt('URLÃ£ÂÂÃ¥ÂÂ¥Ã¥ÂÂ:');
  if (!url) return;
  const isImage = confirm('Ã§ÂÂ»Ã¥ÂÂÃ£ÂÂ¨Ã£ÂÂÃ£ÂÂ¦Ã¨Â¡Â¨Ã§Â¤ÂºÃ£ÂÂÃ£ÂÂ¾Ã£ÂÂÃ£ÂÂÃ¯Â¼Â\n\nOK Ã¢ÂÂ Ã§ÂÂ»Ã¥ÂÂÃ¨Â¡Â¨Ã§Â¤Âº\nÃ£ÂÂ­Ã£ÂÂ£Ã£ÂÂ³Ã£ÂÂ»Ã£ÂÂ« Ã¢ÂÂ Ã£ÂÂªÃ£ÂÂ³Ã£ÂÂ¯Ã£ÂÂ¨Ã£ÂÂÃ£ÂÂ¦Ã¦ÂÂ¿Ã¥ÂÂ¥');
  if (isImage) {
    insertHtmlAtCursor(`<div><img loading="lazy" decoding="async" src="${url}" style="width:100%;border-radius:8px;margin:8px 0;"></div><div><br></div>`);
  } else {
    showLinkModal(url);
  }
}

async function insertBodyImage(input) {
  const file = input.files[0];
  if (!file) return;
  const label = input.parentElement;
  label.textContent = 'Ã¢ÂÂ³ Ã£ÂÂ¢Ã£ÂÂÃ£ÂÂÃ£ÂÂ­Ã£ÂÂ¼Ã£ÂÂÃ¤Â¸Â­...';
  
  const reader = new FileReader();
  reader.onload = async (ev) => {
    const base64 = ev.target.result.split(',')[1];
    let url = ev.target.result; // fallback: base64
    
    try {
      const form = new FormData();
      form.append('image', base64);
      const resp = await fetch('https://api.imgbb.com/1/upload?key=6b317240ded356635338f7ce9c45ec05', {
        method: 'POST', body: form
      });
      const data = await resp.json();
      if (data.success) url = data.data.url;
    } catch(e) {}
    
    insertHtmlAtCursor(`<div><img loading="lazy" decoding="async" src="${url}" style="width:100%;border-radius:8px;margin:8px 0;"></div><div><br></div>`);
    
    label.innerHTML = 'Ã°ÂÂÂ· Ã§ÂÂ»Ã¥ÂÂÃ¦ÂÂ¿Ã¥ÂÂ¥<input type="file" accept="image/*" onchange="insertBodyImage(this)" style="display:none;">';
  };
  reader.readAsDataURL(file);
}

async function uploadArticleImage(input) {
  const file = input.files[0];
  if (!file) return;
  
  const btn = input.parentElement;
  btn.textContent = 'Ã¢ÂÂ³ Ã£ÂÂ¢Ã£ÂÂÃ£ÂÂÃ£ÂÂ­Ã£ÂÂ¼Ã£ÂÂÃ¤Â¸Â­...';
  
  try {
    const base64 = await new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result.split(',')[1]);
      r.onerror = rej;
      r.readAsDataURL(file);
    });
    
    const form = new FormData();
    form.append('image', base64);
    
    const resp = await fetch('https://api.imgbb.com/1/upload?key=6b317240ded356635338f7ce9c45ec05', {
      method: 'POST', body: form
    });
    const data = await resp.json();
    
    if (data.success) {
      const url = data.data.url;
      document.getElementById('adminImg').value = url;
      const preview = document.getElementById('adminImgPreview');
      const img = document.getElementById('adminImgPreviewImg');
      img.src = url;
      preview.style.display = 'block';
      btn.innerHTML = 'Ã°ÂÂÂ· Ã§ÂÂ»Ã¥ÂÂÃ©ÂÂ¸Ã¦ÂÂ<input type="file" accept="image/*" onchange="uploadArticleImage(this)" style="display:none;">';
    } else {
      throw new Error('Ã£ÂÂ¢Ã£ÂÂÃ£ÂÂÃ£ÂÂ­Ã£ÂÂ¼Ã£ÂÂÃ¥Â¤Â±Ã¦ÂÂ');
    }
  } catch(e) {
    // ImgBBÃ£ÂÂÃ¥Â¤Â±Ã¦ÂÂÃ£ÂÂÃ£ÂÂÃ£ÂÂbase64Ã£ÂÂÃ£ÂÂÃ£ÂÂ®Ã£ÂÂ¾Ã£ÂÂ¾Ã¤Â½Â¿Ã£ÂÂ
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target.result;
      document.getElementById('adminImg').value = url;
      const preview = document.getElementById('adminImgPreview');
      const img = document.getElementById('adminImgPreviewImg');
      img.src = url;
      preview.style.display = 'block';
    };
    reader.readAsDataURL(file);
    btn.innerHTML = 'Ã°ÂÂÂ· Ã§ÂÂ»Ã¥ÂÂÃ©ÂÂ¸Ã¦ÂÂ<input type="file" accept="image/*" onchange="uploadArticleImage(this)" style="display:none;">';
  }
}

// ============================================================
// Ã¨Â¨ÂÃ¤ÂºÂÃ¤Â¸ÂÃ¨Â¦Â§Ã£ÂÂÃ¨Â¡Â¨Ã§Â¤Âº
// ============================================================
async function loadArticles() {
  const wrap = document.getElementById('articlesWrap');
  if (!wrap) return;
  wrap.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--tx3);font-size:.75rem;">Ã¨Â¨ÂÃ¤ÂºÂÃ£ÂÂÃ¥ÂÂÃ¥Â¾ÂÃ¤Â¸Â­...</div>';

  try {
    const res = await fetch(FB_ARTICLES + '.json');
    const data = await res.json();

    if (!data) {
      wrap.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--tx3);">Ã£ÂÂ¾Ã£ÂÂ Ã¨Â¨ÂÃ¤ÂºÂÃ£ÂÂÃ£ÂÂÃ£ÂÂÃ£ÂÂ¾Ã£ÂÂÃ£ÂÂ</div>';
      return;
    }

    const articles = Object.entries(data).map(([id, a]) => ({id, ...a})).filter(a => !a.archived).sort((a,b) => b.ts - a.ts)
    .filter(a => { const p = a.publishAt; return !p || p <= Date.now(); });
    console.log('Ã¨Â¨ÂÃ¤ÂºÂÃ¦ÂÂ°:', articles.length, articles.map(a=>a.title));
    if (window._directArticleId) {
      const target = articles.find(a => a.id === window._directArticleId);
      if (target) {
        window._directArticleId = null;
        setTimeout(() => openArticle(target.id), 300);
        return;
      }
    }

    window._allArticlesCache = articles;
    renderArticleList();
  } catch(e) {
    wrap.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--tx3);">Ã¥ÂÂÃ¥Â¾ÂÃ£ÂÂ«Ã¥Â¤Â±Ã¦ÂÂÃ£ÂÂÃ£ÂÂ¾Ã£ÂÂÃ£ÂÂ</div>';
  }
}

function setArticleSortMode(mode) {
  window._articleSortMode = mode;
  renderArticleList();
}

function renderArticleList() {
  const wrap = document.getElementById('articlesWrap');
  if (!wrap || !window._allArticlesCache) return;
  const mode = window._articleSortMode || 'newest';
  const articles = window._allArticlesCache.slice().sort((a,b) => mode === 'oldest' ? a.ts - b.ts : b.ts - a.ts);
  const sortBtn = (key, label) => '<button onclick="setArticleSortMode(\'' + key + '\')" style="padding:.35rem .8rem;border-radius:20px;border:1px solid var(--bd);background:' + (mode===key?'var(--tx)':'var(--card)') + ';color:' + (mode===key?'#fff':'var(--tx)') + ';font-size:.65rem;font-weight:700;cursor:pointer;white-space:nowrap;">' + label + '</button>';
  const sortBar = '<div style="display:flex;gap:.4rem;margin-bottom:.6rem;">' + sortBtn('newest','Ã¦ÂÂ°Ã§ÂÂÃ©Â Â') + sortBtn('oldest','Ã¥ÂÂ¤Ã£ÂÂÃ©Â Â') + '</div>';
  wrap.innerHTML = sortBar + articles.map(a => '<div onclick="openArticle(\'' + a.id + '\')" style="background:var(--card);border:1px solid var(--bd);border-radius:10px;padding:.8rem;margin-bottom:.6rem;cursor:pointer;">' +
      '<div style="width:100%;height:160px;border-radius:8px;margin-bottom:.6rem;overflow:hidden;background:#111;display:flex;align-items:center;justify-content:center;">' +
      (a.img ? '<img src="' + a.img + '" style="width:100%;height:100%;object-fit:cover;" loading="lazy">' : '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#111;font-family:Bebas Neue,sans-serif;font-size:28px;color:#C9082A;letter-spacing:2px;">COURTSIDE</div>') +
      '</div>' +
      '<div style="display:flex;gap:.4rem;align-items:center;margin-bottom:.35rem;">' +
      '<span style="font-size:.55rem;background:var(--or);color:#fff;padding:.1rem .4rem;border-radius:6px;">' + (a.category||'NBA') + '</span>' +
      '<span style="font-size:.55rem;color:var(--tx3);">' + new Date(a.ts).toLocaleDateString('ja-JP') + '</span>' +
      '</div>' +
      '<div style="font-size:.85rem;font-weight:700;color:var(--tx);margin-bottom:.3rem;line-height:1.4;">' + a.title + '</div>' +
      '<div style="font-size:.7rem;color:var(--tx3);line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">' + a.body + '</div>' +
      '</div>'
    ).join('');
}

// ============================================================
// Ã¨Â¨ÂÃ¤ÂºÂÃ¨Â©Â³Ã§Â´Â°Ã£ÂÂ¢Ã£ÂÂ¼Ã£ÂÂÃ£ÂÂ«
// ============================================================
// ============================================================
// Ã¨Â¨ÂÃ¤ÂºÂÃ£ÂÂ®Ã¦ÂÂÃ¥Â­ÂÃ£ÂÂµÃ£ÂÂ¤Ã£ÂÂºÃ¥ÂÂÃ£ÂÂÃ¦ÂÂ¿Ã£ÂÂÃ¯Â¼ÂÃ¨ÂªÂ­Ã¨ÂÂÃ£ÂÂ®Ã¥Â¥Â½Ã£ÂÂ¿Ã£ÂÂ«Ã¥ÂÂÃ£ÂÂÃ£ÂÂÃ£ÂÂ¦Ã©ÂÂ¸Ã£ÂÂ¹Ã£ÂÂÃ¯Â¼Â
// ============================================================
const ARTICLE_FONT_SIZES = { s: '.82rem', m: '.95rem', l: '1.1rem' };

function setArticleFontSize(size) {
  if (!ARTICLE_FONT_SIZES[size]) return;
  try { localStorage.setItem('courtside_fontsize', size); } catch(e) {}
  applyArticleFontSize();
}

function applyArticleFontSize() {
  let size = 'm';
  try { size = localStorage.getItem('courtside_fontsize') || 'm'; } catch(e) {}
  const bodyDiv = document.getElementById('articleBodyDiv');
  if (bodyDiv) bodyDiv.style.fontSize = ARTICLE_FONT_SIZES[size];
  const snkBodyDiv = document.getElementById('snkReviewBodyDiv');
  if (snkBodyDiv) snkBodyDiv.style.fontSize = ARTICLE_FONT_SIZES[size];
  document.querySelectorAll('[data-fontsize-btn]').forEach(btn => {
    const active = btn.dataset.fontsizeBtn === size;
    btn.style.background = active ? 'var(--or)' : 'var(--bg3)';
    btn.style.color = active ? '#fff' : 'var(--tx2)';
    btn.style.borderColor = active ? 'var(--or)' : 'var(--bd)';
  });
}

function closeArticleModal() {
  const modal = document.getElementById('articleModal');
  if (modal) modal.style.display = 'none';
  const fixedAd = document.getElementById('fixedAdBanner');
  if (fixedAd && fixedAd.dataset.wasVisible === '1') fixedAd.style.display = 'block';
}

async function openArticle(id) {
  const modal = document.getElementById('articleModal');
  const body = document.getElementById('articleModalBody');
  if (!modal || !body) return;
  modal.style.display = 'block';
  const fixedAd = document.getElementById('fixedAdBanner');
  if (fixedAd) { fixedAd.dataset.wasVisible = fixedAd.style.display !== 'none' ? '1' : '0'; fixedAd.style.display = 'none'; }
  modal.scrollTop = 0;
  body.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--tx3);">Ã¨ÂªÂ­Ã£ÂÂ¿Ã¨Â¾Â¼Ã£ÂÂ¿Ã¤Â¸Â­...</div>';

  try {
    const res = await fetch(FB_ARTICLES + '/' + id + '.json');
    const a = await res.json();
    window.__currentArticle = a;
    // SEO: Ã¨Â¨ÂÃ¤ÂºÂÃ£ÂÂ¿Ã£ÂÂ¤Ã£ÂÂÃ£ÂÂ«Ã£ÂÂÃ¥ÂÂÃ§ÂÂÃ£ÂÂ«Ã£ÂÂ»Ã£ÂÂÃ£ÂÂÃ¯Â¼ÂÃ£ÂÂÃ£ÂÂ§Ã£ÂÂÃ£ÂÂÃ§ÂÂ´Ã¥Â¾ÂÃ£ÂÂ®Ã¦ÂÂÃ¦ÂÂ°Ã£ÂÂÃ£ÂÂ¼Ã£ÂÂ¿Ã£ÂÂ§Ã¦ÂÂ´Ã¦ÂÂ°Ã¯Â¼Â
    if (a && a.title) {
      document.title = a.title + ' | COURTSIDE';
      const md = document.querySelector('meta[name="description"]');
      if (md) md.setAttribute('content', a.title + ' - COURTSIDE NBAÃ¥Â°ÂÃ©ÂÂÃ£ÂÂ¡Ã£ÂÂÃ£ÂÂ£Ã£ÂÂ¢Ã£ÂÂ' + (a.desc || ''));
    }
    // GA4: SPAÃ¥ÂÂÃ£ÂÂ®Ã¨Â¨ÂÃ¤ÂºÂÃ©ÂÂ²Ã¨Â¦Â§Ã£ÂÂÃ¤Â»Â®Ã¦ÂÂ³Ã£ÂÂÃ£ÂÂ¼Ã£ÂÂ¸Ã£ÂÂÃ£ÂÂ¥Ã£ÂÂ¼Ã£ÂÂ¨Ã£ÂÂÃ£ÂÂ¦Ã¨Â¨ÂÃ¦Â¸Â¬Ã¯Â¼ÂÃ¥ÂÂÃ¥ÂÂ¥Ã¨Â¨ÂÃ¤ÂºÂÃ£ÂÂ®PVÃ£ÂÂÃ¥ÂÂ¯Ã¨Â¦ÂÃ¥ÂÂÃ£ÂÂÃ£ÂÂÃ£ÂÂÃ£ÂÂÃ¯Â¼Â
    if (typeof gtag === 'function' && a && a.title) {
      const articleUrl = 'https://courtside-jp.github.io/mentality/articles/' + id + '.html';
      gtag('event', 'page_view', {
        page_title: a.title + ' | COURTSIDE',
        page_location: articleUrl,
        page_path: '/mentality/articles/' + id + '.html',
        content_category: a.category || 'NBA'
      });
    }
    body.innerHTML = '<div style="padding:1rem;">' +
      '<button onclick="closeArticleModal()" style="display:block;background:var(--bg3);border:1px solid var(--bd);color:var(--tx);padding:.5rem 1rem;border-radius:8px;font-size:.8rem;cursor:pointer;margin-bottom:1.2rem;">Ã¢ÂÂ Ã¦ÂÂ»Ã£ÂÂ</button>' +
      (a.img ? '<img loading="lazy" decoding="async" src="' + a.img + '" style="width:100%;border-radius:10px;margin-bottom:1rem;" onerror="this.style.display=\'none\'">' : '') +
      '<div style="display:flex;gap:.4rem;align-items:center;margin-bottom:.5rem;">' +
      '<span style="font-size:.58rem;background:var(--or);color:#fff;padding:.15rem .5rem;border-radius:6px;">' + (a.category||'NBA') + '</span>' +
      '<span style="font-size:.58rem;color:var(--tx3);">' + new Date(a.ts).toLocaleDateString('ja-JP') + '</span>' +
      '</div>' +
      '<div style="font-size:1rem;font-weight:700;color:var(--tx);line-height:1.5;margin-bottom:.6rem;">' + a.title + '</div>' +
      '<div style="display:flex;align-items:center;justify-content:flex-end;gap:.3rem;margin-bottom:.6rem;">' +
      '<span style="font-size:.65rem;color:var(--tx3);margin-right:.2rem;">Ã¦ÂÂÃ¥Â­ÂÃ£ÂÂµÃ£ÂÂ¤Ã£ÂÂº</span>' +
      '<button onclick="setArticleFontSize(\'s\')" data-fontsize-btn="s" style="width:26px;height:26px;border-radius:6px;border:1px solid var(--bd);background:var(--bg3);font-size:.65rem;cursor:pointer;color:var(--tx2);">A</button>' +
      '<button onclick="setArticleFontSize(\'m\')" data-fontsize-btn="m" style="width:26px;height:26px;border-radius:6px;border:1px solid var(--bd);background:var(--bg3);font-size:.8rem;cursor:pointer;color:var(--tx2);">A</button>' +
      '<button onclick="setArticleFontSize(\'l\')" data-fontsize-btn="l" style="width:26px;height:26px;border-radius:6px;border:1px solid var(--bd);background:var(--bg3);font-size:.95rem;cursor:pointer;color:var(--tx2);">A</button>' +
      '</div>' +
      '<div id="articleBodyDiv" style="font-size:.95rem;color:var(--tx2);line-height:1.85;">' + generateTOC(a.body) + renderBody(a.body) + '</div>' +
      (a.affiliateLink ? '<a href="' + a.affiliateLink + '" target="_blank" rel="noopener sponsored" style="display:flex;align-items:center;gap:.5rem;text-decoration:none;margin-top:1.2rem;padding:.8rem 1rem;background:var(--bg3);border:1px solid var(--bd);border-radius:12px;"><span style="font-size:1.2rem;">Ã°ÂÂÂ</span><span style="color:var(--or);font-weight:700;font-size:.85rem;">Ã¥ÂÂÃ¥ÂÂÃ£ÂÂÃ¨Â¦ÂÃ£ÂÂ</span></a>' : '') +
      '<div style="margin-top:1rem;padding-top:.8rem;border-top:1px solid var(--bd);text-align:center;">' +
      '<a href="' + 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(a.title + ' #COURTSIDE #NBA https://courtside-jp.github.io/mentality/articles/' + id + '.html') + '" target="_blank" style="display:inline-flex;align-items:center;gap:.4rem;background:#000;color:#fff;padding:.6rem 1.2rem;border-radius:10px;font-size:.8rem;font-weight:700;text-decoration:none;">X Ã£ÂÂÃ£ÂÂ®Ã¨Â¨ÂÃ¤ÂºÂÃ£ÂÂÃ£ÂÂ·Ã£ÂÂ§Ã£ÂÂ¢</a></div>' +
      '<div id="relatedArticlesWrap" style="margin-top:1.4rem;padding-top:1rem;border-top:1px solid var(--bd);"></div>' +
      '</div>';
  } catch(e) {
    body.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--tx3);">Ã¥ÂÂÃ¥Â¾ÂÃ£ÂÂ«Ã¥Â¤Â±Ã¦ÂÂÃ£ÂÂÃ£ÂÂ¾Ã£ÂÂÃ£ÂÂ</div>';
  }
  if (window.__currentArticle) {
    renderRelatedArticles(id, window.__currentArticle.category);
  }
  applyArticleFontSize();
  // XÃ¥ÂÂÃ£ÂÂÃ¨Â¾Â¼Ã£ÂÂ¿Ã£ÂÂÃ¥ÂÂ¦Ã§ÂÂÃ¯Â¼ÂÃ¨Â¨ÂÃ¤ÂºÂÃ¦ÂÂ¬Ã¦ÂÂÃ¤Â¸Â­Ã£ÂÂ®Ã¥Â®ÂÃ©ÂÂÃ£ÂÂ® .twitter-tweet Ã£ÂÂÃ¥ÂÂÃ£ÂÂ¹Ã£ÂÂ­Ã£ÂÂ£Ã£ÂÂ³Ã£ÂÂÃ£ÂÂ¦Ã¦ÂÂÃ§ÂÂ»Ã¯Â¼Â
  setTimeout(function() {
    const bodyDiv = document.getElementById('articleBodyDiv');
    if (typeof twttr !== 'undefined' && twttr.widgets) {
      twttr.widgets.load(bodyDiv);
    } else {
      var s = document.createElement('script');
      s.src = 'https://platform.twitter.com/widgets.js';
      s.onload = function() { if (typeof twttr !== 'undefined' && twttr.widgets) twttr.widgets.load(bodyDiv); };
      document.body.appendChild(s);
      setTimeout(function() { document.querySelectorAll('.tweet-embed-safe').forEach(function(el) { if (!el.querySelector('iframe')) { var a = el.querySelector('blockquote.twitter-tweet a'); var href = a ? a.href : ''; if (href) { el.style.maxHeight = 'none'; el.innerHTML = '<a href="' + href + '" target="_blank" rel="noopener" style="display:block;padding:12px;border:1px solid #444;border-radius:8px;color:#1d9bf0;text-decoration:none;">XÃ£ÂÂ§Ã£ÂÂÃ£ÂÂ®Ã¦ÂÂÃ§Â¨Â¿Ã£ÂÂÃ¨Â¦ÂÃ£ÂÂ Ã¢ÂÂ</a>'; } } }); }, 5000);
    }
    if (typeof window.instgrm !== 'undefined' && window.instgrm.Embeds) window.instgrm.Embeds.process();
  }, 300);
}

// ============================================================
// Ã§Â®Â¡Ã§ÂÂÃ¨ÂÂÃ£ÂÂÃ£ÂÂ¼Ã£ÂÂ¸
// ============================================================
function openAdminPage() {
  const pw = prompt('Ã£ÂÂÃ£ÂÂ¹Ã£ÂÂ¯Ã£ÂÂ¼Ã£ÂÂÃ£ÂÂÃ¥ÂÂ¥Ã¥ÂÂÃ£ÂÂÃ£ÂÂ¦Ã£ÂÂÃ£ÂÂ Ã£ÂÂÃ£ÂÂ');
  if (pw !== ADMIN_PASSWORD) { alert('Ã£ÂÂÃ£ÂÂ¹Ã£ÂÂ¯Ã£ÂÂ¼Ã£ÂÂÃ£ÂÂÃ©ÂÂÃ£ÂÂÃ£ÂÂ¾Ã£ÂÂ'); return; }
  const m = document.getElementById('adminSelectModal'); if (m) m.style.display = 'block';
}

function closeAdminModal() {
  const modal = document.getElementById('adminModal');
  if (modal) modal.style.display = 'none';
}

async function submitArticle() {
  const title    = document.getElementById('adminTitle').value.trim();
  const sourceTextEl = document.getElementById('adminSourceText');
  const imageCreditEl = document.getElementById('adminImageCredit');
  const sourceText = sourceTextEl ? sourceTextEl.value.trim() : '';
  const imageCredit = imageCreditEl ? imageCreditEl.value.trim() : '';
  const rawBody = getAdminBodyValue().trim();
  const { cleanBody } = extractArticleMetaSections(rawBody);
  const body = (cleanBody + buildArticleMetaSections(sourceText, imageCredit)).trim();
  const img      = document.getElementById('adminImg').value.trim();
  const category = document.getElementById('adminCategory').value;
  const affiliateLink = document.getElementById('adminAffiliateLink') ? document.getElementById('adminAffiliateLink').value.trim() : '';

  if (!title || !cleanBody) { alert('Ã£ÂÂ¿Ã£ÂÂ¤Ã£ÂÂÃ£ÂÂ«Ã£ÂÂ¨Ã¦ÂÂ¬Ã¦ÂÂÃ£ÂÂ¯Ã¥Â¿ÂÃ©Â ÂÃ£ÂÂ§Ã£ÂÂ'); return; }
  if (!sourceText || !imageCredit) { alert('Ã£ÂÂ½Ã£ÂÂ¼Ã£ÂÂ¹Ã¥ÂÂÃ£ÂÂ¨Ã§ÂÂ»Ã¥ÂÂÃ£ÂÂ¯Ã£ÂÂ¬Ã£ÂÂ¸Ã£ÂÂÃ£ÂÂÃ£ÂÂ¯Ã¥Â¿ÂÃ©Â ÂÃ£ÂÂ§Ã£ÂÂ'); return; }

  const btn = document.getElementById('adminSubmitBtn');
  btn.textContent = 'Ã¦ÂÂÃ§Â¨Â¿Ã¤Â¸Â­...';
  btn.disabled = true;

  const editId = document.getElementById('adminEditId')?.value;
  try {
    if (editId) {
      await fetch(`${FB_ARTICLES}/${editId}.json`, {
        method: 'PATCH',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({
          title, body, img, category, affiliateLink,
          ts: Date.now(),
          archived: false,
          publishAt: (function(){
            const el = document.getElementById('adminPublishAt');
            if (!el || !el.value) return null;
            return new Date(el.value).getTime();
          })()
        })
      });
      alert('Ã¦ÂÂ´Ã¦ÂÂ°Ã£ÂÂÃ£ÂÂ¾Ã£ÂÂÃ£ÂÂÃ¯Â¼Â');
      document.getElementById('adminEditId').value = '';
  const paEl = document.getElementById('adminPublishAt'); if(paEl) paEl.value = '';
      const btn = document.getElementById('adminSubmitBtn');
      if (btn) btn.textContent = 'Ã¦ÂÂÃ§Â¨Â¿Ã£ÂÂÃ£ÂÂ';
      document.getElementById('adminTitle').value = '';
      setAdminBodyValue('');
      document.getElementById('adminImg').value = '';
      if (document.getElementById('adminAffiliateLink')) document.getElementById('adminAffiliateLink').value = '';
      if (sourceTextEl) sourceTextEl.value = '';
      if (imageCreditEl) imageCreditEl.value = '';
      showAdminArticleUrl(null);
      closeAdminModal();
      loadArticles();
      loadAdminArticles();
    } else {
      const createRes = await fetch(FB_ARTICLES + '.json', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ title, body, img, category, affiliateLink, ts: Date.now(), archived: true })
      });
      const createData = await createRes.json();
      document.getElementById('adminTitle').value = '';
      setAdminBodyValue('');
      document.getElementById('adminImg').value = '';
      if (document.getElementById('adminAffiliateLink')) document.getElementById('adminAffiliateLink').value = '';
      if (sourceTextEl) sourceTextEl.value = '';
      if (imageCreditEl) imageCreditEl.value = '';
      if (createData && createData.name) {
        showAdminArticleUrl(createData.name);
        alert('Ã¤Â¸ÂÃ¦ÂÂ¸Ã£ÂÂÃ¯Â¼ÂÃ£ÂÂ¢Ã£ÂÂ¼Ã£ÂÂ«Ã£ÂÂ¤Ã£ÂÂÃ¯Â¼ÂÃ£ÂÂ¨Ã£ÂÂÃ£ÂÂ¦Ã¦ÂÂÃ§Â¨Â¿Ã£ÂÂÃ£ÂÂ¾Ã£ÂÂÃ£ÂÂÃ£ÂÂÃ£ÂÂÃ£ÂÂ®Ã£ÂÂ¾Ã£ÂÂ¾URLÃ£ÂÂÃ£ÂÂ³Ã£ÂÂÃ£ÂÂ¼Ã£ÂÂ§Ã£ÂÂÃ£ÂÂ¾Ã£ÂÂÃ£ÂÂÃ¥ÂÂ¬Ã©ÂÂÃ£ÂÂÃ£ÂÂÃ¥Â Â´Ã¥ÂÂÃ£ÂÂ¯Ã¨Â¨ÂÃ¤ÂºÂÃ¤Â¸ÂÃ¨Â¦Â§Ã£ÂÂ®Ã£ÂÂÃ¥ÂÂ¬Ã©ÂÂÃ£ÂÂ«Ã¦ÂÂ»Ã£ÂÂÃ£ÂÂÃ£ÂÂ¾Ã£ÂÂÃ£ÂÂ¯Ã§Â·Â¨Ã©ÂÂÃ§ÂÂ»Ã©ÂÂ¢Ã£ÂÂ®Ã¥ÂÂ¬Ã©ÂÂÃ¦ÂÂ¥Ã¦ÂÂÃ£ÂÂÃ£ÂÂÃ¨Â¨Â­Ã¥Â®ÂÃ£ÂÂÃ£ÂÂ¦Ã£ÂÂÃ£ÂÂ Ã£ÂÂÃ£ÂÂÃ£ÂÂ');
      } else {
        alert('Ã¦ÂÂÃ§Â¨Â¿Ã£ÂÂÃ£ÂÂ¾Ã£ÂÂÃ£ÂÂÃ¯Â¼Â');
      }
      loadArticles();
      loadAdminArticles();
    }
  } catch(e) {
    alert('Ã¦ÂÂÃ§Â¨Â¿Ã£ÂÂ«Ã¥Â¤Â±Ã¦ÂÂÃ£ÂÂÃ£ÂÂ¾Ã£ÂÂÃ£ÂÂ');
  } finally {
    btn.textContent = 'Ã¦ÂÂÃ§Â¨Â¿Ã£ÂÂÃ£ÂÂ';
    btn.disabled = false;
  }
}

function insertToBody(type) {
  const textarea = document.getElementById('adminBody');
  const prompts = {
    image: null,
    youtube: 'YouTubeÃ£ÂÂ®URLÃ£ÂÂÃ¥ÂÂ¥Ã¥ÂÂÃ£ÂÂÃ£ÂÂ¦Ã£ÂÂÃ£ÂÂ Ã£ÂÂÃ£ÂÂ',
    tiktok: 'TikTokÃ£ÂÂ®URLÃ£ÂÂÃ¥ÂÂ¥Ã¥ÂÂÃ£ÂÂÃ£ÂÂ¦Ã£ÂÂÃ£ÂÂ Ã£ÂÂÃ£ÂÂ',
    instagram: 'InstagramÃ£ÂÂ®URLÃ£ÂÂÃ¥ÂÂ¥Ã¥ÂÂÃ£ÂÂÃ£ÂÂ¦Ã£ÂÂÃ£ÂÂ Ã£ÂÂÃ£ÂÂ',
    twitter: 'X(Twitter)Ã£ÂÂ®URLÃ£ÂÂÃ¥ÂÂ¥Ã¥ÂÂÃ£ÂÂÃ£ÂÂ¦Ã£ÂÂÃ£ÂÂ Ã£ÂÂÃ£ÂÂ',
    quote: null,
  };
  if (type === 'quote') {
    const source = prompt('Ã¥Â¼ÂÃ§ÂÂ¨Ã¥ÂÂÃ£ÂÂÃ¥ÂÂ¥Ã¥ÂÂÃ£ÂÂÃ£ÂÂ¦Ã£ÂÂÃ£ÂÂ Ã£ÂÂÃ£ÂÂÃ¯Â¼ÂÃ¤Â¾ÂÃ¯Â¼Â@StephenCurry30 / XÃ¯Â¼Â');
    if (!source) return;
    const template = '\n[Ã§ÂÂ»Ã¥ÂÂÃ£ÂÂÃ£ÂÂÃ£ÂÂÃ£ÂÂ«Ã¦ÂÂ¿Ã¥ÂÂ¥]\nÃ¥Â¼ÂÃ§ÂÂ¨Ã¥ÂÂÃ¯Â¼Â' + source + '\n';
    const pos = textarea.selectionStart;
    const before = textarea.value.substring(0, pos);
    const after = textarea.value.substring(pos);
    textarea.value = before + template + after;
    updatePreview();
    return;
  }
  if (type === 'image') {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const formData = new FormData();
      formData.append('image', file);
      formData.append('key', '6b317240ded356635338f7ce9c45ec05');
      try {
        const btn = document.querySelector('[onclick*="insertToBody(\'image\')"]');
        if (btn) btn.textContent = 'Ã£ÂÂ¢Ã£ÂÂÃ£ÂÂÃ£ÂÂ­Ã£ÂÂ¼Ã£ÂÂÃ¤Â¸Â­...';
        const res = await fetch('https://api.imgbb.com/1/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if (data.success) {
          const imgUrl = data.data.url;
          const pos = textarea.selectionStart;
          const before = textarea.value.substring(0, pos);
          const after = textarea.value.substring(pos);
          textarea.value = before + '\n' + imgUrl + '\n' + after;
          updatePreview();
        } else {
          alert('Ã£ÂÂ¢Ã£ÂÂÃ£ÂÂÃ£ÂÂ­Ã£ÂÂ¼Ã£ÂÂÃ£ÂÂ«Ã¥Â¤Â±Ã¦ÂÂÃ£ÂÂÃ£ÂÂ¾Ã£ÂÂÃ£ÂÂ');
        }
      } catch(e) {
        alert('Ã£ÂÂ¨Ã£ÂÂ©Ã£ÂÂ¼Ã£ÂÂÃ§ÂÂºÃ§ÂÂÃ£ÂÂÃ£ÂÂ¾Ã£ÂÂÃ£ÂÂ');
      } finally {
        const btn = document.querySelector('[onclick*="insertToBody(\'image\')"]');
        if (btn) btn.textContent = 'Ã§ÂÂ»Ã¥ÂÂ';
      }
    };
    input.click();
    return;
  }
  const url = prompt(prompts[type]);
  if (!url) return;
  const pos = textarea.selectionStart;
  const before = textarea.value.substring(0, pos);
  const after = textarea.value.substring(pos);
  textarea.value = before + '\n' + url + '\n' + after;
  updatePreview();
}

function updatePreview() {
  const body = document.getElementById('adminBody').value;
  const preview = document.getElementById('adminPreview');
  if (preview) preview.innerHTML = renderBody(body);
  // XÃ¥ÂÂÃ£ÂÂÃ¨Â¾Â¼Ã£ÂÂ¿Ã£ÂÂÃ¥ÂÂÃ£ÂÂ¬Ã£ÂÂ³Ã£ÂÂÃ£ÂÂªÃ£ÂÂ³Ã£ÂÂ°
  if (typeof twttr !== 'undefined' && twttr.widgets) {
    twttr.widgets.load();
  }
}

// ============================================================
// Ã¥ÂºÂÃ¥ÂÂÃ§Â®Â¡Ã§ÂÂ
// ============================================================
const FB_ADS = `${FB_URL}/ads`;

async function loadAds() {
  const res = await fetch(FB_ADS + '.json');
  const data = await res.json();
  if (!data) return [];
  return Object.entries(data).map(([id, a]) => ({id, ...a}));
}

function openAdManager(skipAuth) {
  if (!skipAuth) {
    const pw = prompt('Ã£ÂÂÃ£ÂÂ¹Ã£ÂÂ¯Ã£ÂÂ¼Ã£ÂÂÃ£ÂÂÃ¥ÂÂ¥Ã¥ÂÂÃ£ÂÂÃ£ÂÂ¦Ã£ÂÂÃ£ÂÂ Ã£ÂÂÃ£ÂÂ');
    if (pw !== ADMIN_PASSWORD) { alert('Ã£ÂÂÃ£ÂÂ¹Ã£ÂÂ¯Ã£ÂÂ¼Ã£ÂÂÃ£ÂÂÃ©ÂÂÃ£ÂÂÃ£ÂÂ¾Ã£ÂÂ'); return; }
  }
  const modal = document.getElementById('adManagerModal');
  if (modal) { modal.style.display = 'block'; renderAdManager(); }
}

function closeAdManager() {
  const modal = document.getElementById('adManagerModal');
  if (modal) modal.style.display = 'none';
}

async function renderAdManager() {
  const wrap = document.getElementById('adManagerList');
  if (!wrap) return;
  wrap.innerHTML = '<div style="text-align:center;padding:1rem;color:var(--tx3);font-size:.75rem;">Ã¨ÂªÂ­Ã£ÂÂ¿Ã¨Â¾Â¼Ã£ÂÂ¿Ã¤Â¸Â­...</div>';
  try {
    const res = await fetch(FB_URL + '/adslots.json');
    const slots = await res.json() || {};
    wrap.innerHTML = Object.entries(slots).map(([slotId, slot]) => `
      <div style="background:var(--bg3);border-radius:10px;padding:.8rem;margin-bottom:.7rem;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.5rem;">
          <div style="font-size:.72rem;font-weight:700;color:var(--or);">${slot.label}</div>
          <label style="display:flex;align-items:center;gap:.4rem;cursor:pointer;">
            <span style="font-size:.65rem;color:var(--tx3);">${slot.enabled === false ? 'OFF' : 'ON'}</span>
            <div onclick="toggleSlot('${slotId}', ${slot.enabled === false})" style="width:36px;height:20px;border-radius:10px;background:${slot.enabled === false ? 'var(--bd)' : 'var(--or)'};position:relative;cursor:pointer;transition:background .2s;">
              <div style="width:16px;height:16px;border-radius:50%;background:#fff;position:absolute;top:2px;${slot.enabled === false ? 'left:2px' : 'left:18px'};transition:left .2s;"></div>
            </div>
          </label>
        </div>
        <input id="ad_title_${slotId}" type="text" placeholder="Ã£ÂÂ¿Ã£ÂÂ¤Ã£ÂÂÃ£ÂÂ«" value="${slot.title||''}" style="width:100%;padding:.4rem;border-radius:6px;border:1px solid var(--bd);background:var(--bg);color:var(--tx);font-size:.75rem;box-sizing:border-box;margin-bottom:.4rem;">
        <input id="ad_url_${slotId}" type="text" placeholder="Ã£ÂÂªÃ£ÂÂ³Ã£ÂÂ¯URL" value="${slot.url||''}" style="width:100%;padding:.4rem;border-radius:6px;border:1px solid var(--bd);background:var(--bg);color:var(--tx);font-size:.75rem;box-sizing:border-box;margin-bottom:.4rem;">
        <input id="ad_img_${slotId}" type="text" placeholder="Ã§ÂÂ»Ã¥ÂÂURLÃ¯Â¼ÂÃ¤Â»Â»Ã¦ÂÂÃ¯Â¼Â" value="${slot.img||''}" style="width:100%;padding:.4rem;border-radius:6px;border:1px solid var(--bd);background:var(--bg);color:var(--tx);font-size:.75rem;box-sizing:border-box;margin-bottom:.5rem;">
        <button onclick="saveSlot('${slotId}')" style="width:100%;padding:.5rem;background:var(--or);border:none;color:#fff;border-radius:8px;font-size:.75rem;font-weight:700;cursor:pointer;">Ã¤Â¿ÂÃ¥Â­ÂÃ£ÂÂÃ£ÂÂ</button>
      </div>
    `).join('');
  } catch(e) {
    wrap.innerHTML = '<div style="text-align:center;padding:1rem;color:var(--tx3);">Ã¥ÂÂÃ¥Â¾ÂÃ¥Â¤Â±Ã¦ÂÂ</div>';
  }
}

async function saveSlot(slotId) {
  const title = document.getElementById('ad_title_' + slotId).value.trim();
  const url   = document.getElementById('ad_url_' + slotId).value.trim();
  const img   = document.getElementById('ad_img_' + slotId).value.trim();
  await fetch(FB_URL + '/adslots/' + slotId + '.json', {
    method: 'PATCH',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ title, url, img })
  });
  alert('Ã¤Â¿ÂÃ¥Â­ÂÃ£ÂÂÃ£ÂÂ¾Ã£ÂÂÃ£ÂÂÃ¯Â¼Â');
}


async function submitAd() {
  const title = document.getElementById('adTitle').value.trim();
  const desc  = document.getElementById('adDesc').value.trim();
  const price = document.getElementById('adPrice').value.trim();
  const tag   = document.getElementById('adTag').value.trim();
  const url   = document.getElementById('adUrl').value.trim();
  const icon  = document.getElementById('adIcon').value.trim();
  const color = document.getElementById('adColor').value;

  const places = []; if (document.getElementById('adPlaceSchedule')?.checked) places.push('schedule'); if (document.getElementById('adPlaceNews')?.checked) places.push('news'); if (document.getElementById('adPlaceArticles')?.checked) places.push('articles'); if (document.getElementById('adPlacePlayers')?.checked) places.push('players'); if (!title || !url) { alert('Ã£ÂÂ¿Ã£ÂÂ¤Ã£ÂÂÃ£ÂÂ«Ã£ÂÂ¨URLÃ£ÂÂ¯Ã¥Â¿ÂÃ©Â ÂÃ£ÂÂ§Ã£ÂÂ'); return; }

  const btn = document.getElementById('adSubmitBtn');
  btn.textContent = 'Ã¤Â¿ÂÃ¥Â­ÂÃ¤Â¸Â­...'; btn.disabled = true;

  await fetch(FB_ADS + '.json', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ title, desc, price, tag, url, icon, color, places, ts: Date.now() })
  });

  alert('Ã¥ÂºÂÃ¥ÂÂÃ£ÂÂÃ¨Â¿Â½Ã¥ÂÂ Ã£ÂÂÃ£ÂÂ¾Ã£ÂÂÃ£ÂÂÃ¯Â¼Â');
  document.getElementById('adTitle').value = '';
  document.getElementById('adDesc').value = '';
  document.getElementById('adPrice').value = '';
  document.getElementById('adTag').value = '';
  document.getElementById('adUrl').value = '';
  document.getElementById('adIcon').value = '';
  btn.textContent = 'Ã¨Â¿Â½Ã¥ÂÂ Ã£ÂÂÃ£ÂÂ'; btn.disabled = false;
  renderAdManager();
}

async function deleteAd(id) {
  if (!confirm('Ã£ÂÂÃ£ÂÂ®Ã¥ÂºÂÃ¥ÂÂÃ£ÂÂÃ¥ÂÂÃ©ÂÂ¤Ã£ÂÂÃ£ÂÂ¾Ã£ÂÂÃ£ÂÂÃ¯Â¼Â')) return;
  await fetch(`${FB_ADS}/${id}.json`, { method: 'DELETE' });
  renderAdManager();
}
// cache bust 2026Ã¥Â¹Â´ 5Ã¦ÂÂ29Ã¦ÂÂ¥ Ã©ÂÂÃ¦ÂÂÃ¦ÂÂ¥ 15Ã¦ÂÂ10Ã¥ÂÂ29Ã§Â§Â JST

// Ã§Â®Â¡Ã§ÂÂÃ¨ÂÂÃ§ÂÂ¨Ã¨Â¨ÂÃ¤ÂºÂÃ¤Â¸ÂÃ¨Â¦Â§
async function loadAdminArticles() {
  const wrap = document.getElementById('adminArticleList');
  if (!wrap) return;
  wrap.innerHTML = '<div style="font-size:.7rem;color:var(--tx3);">Ã¨ÂªÂ­Ã£ÂÂ¿Ã¨Â¾Â¼Ã£ÂÂ¿Ã¤Â¸Â­...</div>';
  try {
    const res = await fetch(FB_ARTICLES + '.json');
    const data = await res.json();
    if (!data) { wrap.innerHTML = '<div style="font-size:.7rem;color:var(--tx3);">Ã¨Â¨ÂÃ¤ÂºÂÃ£ÂÂÃ£ÂÂÃ£ÂÂÃ£ÂÂ¾Ã£ÂÂÃ£ÂÂ</div>'; return; }
    const articles = Object.entries(data).map(([id,a]) => ({id,...a})).sort((a,b) => b.ts - a.ts);
    wrap.innerHTML = articles.map(a => `
      <div style="background:var(--bg3);border-radius:8px;padding:.6rem;margin-bottom:.4rem;display:flex;align-items:center;gap:.5rem;">
        <div style="flex:1;min-width:0;">
          <div style="font-size:.72rem;font-weight:700;color:var(--tx);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${a.title}${a.publishAt && a.publishAt > Date.now() ? '<span style="background:#f59e0b;color:#fff;font-size:9px;padding:2px 6px;border-radius:4px;margin-left:6px;font-weight:700;">Ã¤ÂºÂÃ§Â´ÂÃ¤Â¸Â­</span>' : ''}</div>
          <div style="font-size:.58rem;color:var(--tx3);">${a.category||'NBA'} ÃÂ· ${new Date(a.ts).toLocaleDateString('ja-JP')}</div>
        </div>
        <button onclick="editArticle('${a.id}')" style="background:rgba(0,150,255,.15);border:none;color:#0096ff;padding:.3rem .5rem;border-radius:6px;font-size:.65rem;cursor:pointer;flex-shrink:0;margin-right:.3rem;">Ã§Â·Â¨Ã©ÂÂ</button><button onclick="deleteArticle('${a.id}')" style="background:rgba(255,50,50,.15);border:none;color:#ff5555;padding:.3rem .5rem;border-radius:6px;font-size:.65rem;cursor:pointer;flex-shrink:0;">Ã¥ÂÂÃ©ÂÂ¤</button>
      </div>
    `).join('');
  } catch(e) {
    wrap.innerHTML = '<div style="font-size:.7rem;color:var(--tx3);">Ã¥ÂÂÃ¥Â¾ÂÃ¥Â¤Â±Ã¦ÂÂ</div>';
  }
}

async function archiveArticle(id, archive) {
  await fetch(FB_ARTICLES + '/' + id + '.json', {
    method: 'PATCH',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ archived: archive })
  });
  loadAdminArticles();
}

async function deleteArticle(id) {
  if (!confirm('Ã£ÂÂÃ£ÂÂ®Ã¨Â¨ÂÃ¤ÂºÂÃ£ÂÂÃ¥ÂÂÃ©ÂÂ¤Ã£ÂÂÃ£ÂÂ¾Ã£ÂÂÃ£ÂÂÃ¯Â¼Â')) return;
  await fetch(`${FB_ARTICLES}/${id}.json`, { method: 'DELETE' });
  loadAdminArticles();
  loadArticles();
}

// Ã¥ÂÂÃ¥ÂÂÃ£ÂÂªÃ£ÂÂ³Ã£ÂÂ¯Ã¦ÂÂ¿Ã¥ÂÂ¥
function insertProductLink() {
  const name  = prompt('Ã¥ÂÂÃ¥ÂÂÃ¥ÂÂÃ£ÂÂÃ¥ÂÂ¥Ã¥ÂÂÃ£ÂÂÃ£ÂÂ¦Ã£ÂÂÃ£ÂÂ Ã£ÂÂÃ£ÂÂ');
  if (!name) return;
  const price = prompt('Ã¤Â¾Â¡Ã¦Â Â¼Ã£ÂÂÃ¥ÂÂ¥Ã¥ÂÂÃ£ÂÂÃ£ÂÂ¦Ã£ÂÂÃ£ÂÂ Ã£ÂÂÃ£ÂÂÃ¯Â¼ÂÃ¤Â¾ÂÃ¯Â¼ÂÃÂ¥22,000Ã¯Â¼Â') || '';
  const url   = prompt('Ã¨Â³Â¼Ã¥ÂÂ¥URLÃ£ÂÂÃ¥ÂÂ¥Ã¥ÂÂÃ£ÂÂÃ£ÂÂ¦Ã£ÂÂÃ£ÂÂ Ã£ÂÂÃ£ÂÂ');
  if (!url) return;
  const card = `[product name="${name}" price="${price}" url="${url}"]`;
  const chip = createEmbedChip('product', card, `${name} ${price ? '(' + price + ')' : ''}`);
  insertNodeAtCursor(chip);
}

function insertShopCard() {
  const name = prompt('Ã¥ÂÂÃ¥ÂÂÃ¥ÂÂÃ£ÂÂÃ¥ÂÂ¥Ã¥ÂÂÃ£ÂÂÃ£ÂÂ¦Ã£ÂÂÃ£ÂÂ Ã£ÂÂÃ£ÂÂ');
  if (!name) return;
  const img = prompt('Ã¥ÂÂÃ¥ÂÂÃ§ÂÂ»Ã¥ÂÂÃ£ÂÂ®URLÃ£ÂÂÃ¥ÂÂ¥Ã¥ÂÂÃ£ÂÂÃ£ÂÂ¦Ã£ÂÂÃ£ÂÂ Ã£ÂÂÃ£ÂÂÃ¯Â¼ÂÃ¤Â»Â»Ã¦ÂÂÃ¯Â¼Â') || '';
  const rakuten = prompt('Ã¦Â¥Â½Ã¥Â¤Â©Ã£ÂÂ®Ã¨Â³Â¼Ã¥ÂÂ¥URLÃ£ÂÂÃ¥ÂÂ¥Ã¥ÂÂÃ£ÂÂÃ£ÂÂ¦Ã£ÂÂÃ£ÂÂ Ã£ÂÂÃ£ÂÂÃ¯Â¼ÂÃ¥ÂÂÃ£ÂÂÃ¦ÂÂ±Ã£ÂÂÃ£ÂÂÃ£ÂÂªÃ£ÂÂÃ£ÂÂÃ£ÂÂ°Ã§Â©ÂºÃ¦Â¬ÂÃ£ÂÂ§OKÃ¯Â¼Â') || '';
  const rakutenPrice = rakuten ? (prompt('Ã¦Â¥Â½Ã¥Â¤Â©Ã£ÂÂ®Ã¤Â¾Â¡Ã¦Â Â¼Ã£ÂÂÃ¥ÂÂ¥Ã¥ÂÂÃ£ÂÂÃ£ÂÂ¦Ã£ÂÂÃ£ÂÂ Ã£ÂÂÃ£ÂÂÃ¯Â¼ÂÃ¤Â¾ÂÃ¯Â¼Â15,180Ã¥ÂÂÃ¯Â¼Â') || '') : '';
  const amazon = prompt('AmazonÃ£ÂÂ®URLÃ£ÂÂÃ¥ÂÂ¥Ã¥ÂÂÃ£ÂÂÃ£ÂÂ¦Ã£ÂÂÃ£ÂÂ Ã£ÂÂÃ£ÂÂÃ¯Â¼ÂÃ¥ÂÂÃ£ÂÂÃ¦ÂÂ±Ã£ÂÂÃ£ÂÂÃ£ÂÂªÃ£ÂÂÃ£ÂÂÃ£ÂÂ°Ã§Â©ÂºÃ¦Â¬ÂÃ£ÂÂ§OKÃ¯Â¼Â') || '';
  const amazonPrice = amazon ? (prompt('AmazonÃ£ÂÂ®Ã¤Â¾Â¡Ã¦Â Â¼Ã£ÂÂÃ¥ÂÂ¥Ã¥ÂÂÃ£ÂÂÃ£ÂÂ¦Ã£ÂÂÃ£ÂÂ Ã£ÂÂÃ£ÂÂÃ¯Â¼ÂÃ¤Â¾ÂÃ¯Â¼Â15,180Ã¥ÂÂÃ¯Â¼Â') || '') : '';
  const card = `[shopcard name="${name}" img="${img}" rakuten="${rakuten}" rakutenPrice="${rakutenPrice}" amazon="${amazon}" amazonPrice="${amazonPrice}"]`;
  const shops = [];
  if (rakuten) shops.push('Ã¦Â¥Â½Ã¥Â¤Â©');
  if (amazon) shops.push('Amazon');
  const chip = createEmbedChip('shopcard', card, `${name} ${shops.length ? '[' + shops.join('/') + ']' : ''}`);
  insertNodeAtCursor(chip);
}

function insertQuoteBlock() {
  const text = prompt('Ã¥Â¼ÂÃ§ÂÂ¨Ã£ÂÂÃ£ÂÂÃ£ÂÂ³Ã£ÂÂ¡Ã£ÂÂ³Ã£ÂÂÃ¦ÂÂ¬Ã¦ÂÂÃ£ÂÂÃ¥ÂÂ¥Ã¥ÂÂÃ£ÂÂÃ£ÂÂ¦Ã£ÂÂÃ£ÂÂ Ã£ÂÂÃ£ÂÂ');
  if (!text) return;
  const name = prompt('Ã§ÂÂºÃ¨Â¨ÂÃ¨ÂÂÃ¥ÂÂÃ£ÂÂÃ¥ÂÂ¥Ã¥ÂÂÃ£ÂÂÃ£ÂÂ¦Ã£ÂÂÃ£ÂÂ Ã£ÂÂÃ£ÂÂÃ¯Â¼ÂÃ¤Â¾ÂÃ¯Â¼ÂÃ£ÂÂÃ£ÂÂ¯Ã£ÂÂ¿Ã£ÂÂ¼Ã£ÂÂ»Ã£ÂÂ¦Ã£ÂÂ§Ã£ÂÂ³Ã£ÂÂÃ£ÂÂ³Ã£ÂÂ¤Ã£ÂÂÃ¯Â¼Â') || '';
  const source = prompt('Ã¥Â¼ÂÃ§ÂÂ¨Ã¥ÂÂÃ£ÂÂ¡Ã£ÂÂÃ£ÂÂ£Ã£ÂÂ¢Ã¥ÂÂÃ£ÂÂÃ¥ÂÂ¥Ã¥ÂÂÃ£ÂÂÃ£ÂÂ¦Ã£ÂÂÃ£ÂÂ Ã£ÂÂÃ£ÂÂÃ¯Â¼ÂÃ¤Â¾ÂÃ¯Â¼Â2KÃ£ÂÂ¸Ã£ÂÂ£Ã£ÂÂÃ£ÂÂ³Ã¥ÂÂ¬Ã¥Â¼ÂÃ£ÂÂµÃ£ÂÂ¤Ã£ÂÂÃ¯Â¼Â') || '';
  const url = prompt('Ã¥Â¼ÂÃ§ÂÂ¨Ã¥ÂÂÃ£ÂÂ®URLÃ£ÂÂÃ¥ÂÂ¥Ã¥ÂÂÃ£ÂÂÃ£ÂÂ¦Ã£ÂÂÃ£ÂÂ Ã£ÂÂÃ£ÂÂÃ¯Â¼ÂÃ¤Â»Â»Ã¦ÂÂÃ¯Â¼Â') || '';
  const card = `[quote text="${text}" name="${name}" source="${source}" url="${url}"]`;
  const chip = createEmbedChip('quote', card, `${source || 'Ã¥Â¼ÂÃ§ÂÂ¨'}Ã¯Â¼Â${text.slice(0, 20)}...`);
  insertNodeAtCursor(chip);
}

function extractArticleMetaSections(body) {
  const lines = (body || '').split('\n');
  const sourceLines = [];
  let imageCredit = '';
  const keep = [];
  let i = 0;
  while (i < lines.length) {
    const t = lines[i].trim();
    if (t === 'Ã¢ÂÂ Ã£ÂÂ½Ã£ÂÂ¼Ã£ÂÂ¹Ã¥ÂÂ') {
      i++;
      while (i < lines.length && lines[i].trim() !== '' && !lines[i].trim().startsWith('Ã¢ÂÂ ')) {
        sourceLines.push(lines[i].trim());
        i++;
      }
      if (i < lines.length && lines[i].trim() === '') i++;
      continue;
    }
    if (t === 'Ã¢ÂÂ Ã§ÂÂ»Ã¥ÂÂÃ£ÂÂ¯Ã£ÂÂ¬Ã£ÂÂ¸Ã£ÂÂÃ£ÂÂ') {
      i++;
      if (i < lines.length && lines[i].trim() !== '' && !lines[i].trim().startsWith('Ã¢ÂÂ ')) {
        imageCredit = lines[i].trim();
        i++;
      }
      if (i < lines.length && lines[i].trim() === '') i++;
      continue;
    }
    keep.push(lines[i]);
    i++;
  }
  while (keep.length && keep[keep.length - 1].trim() === '') keep.pop();
  return { cleanBody: keep.join('\n'), sourceText: sourceLines.join('\n'), imageCredit };
}

function buildArticleMetaSections(sourceText, imageCredit) {
  const sourceLines = (sourceText || '').split('\n').map(l => l.trim()).filter(Boolean);
  let out = '';
  if (sourceLines.length) {
    out += '\n\nÃ¢ÂÂ Ã£ÂÂ½Ã£ÂÂ¼Ã£ÂÂ¹Ã¥ÂÂ\n' + sourceLines.join('\n');
  }
  if (imageCredit && imageCredit.trim()) {
    out += '\n\nÃ¢ÂÂ Ã§ÂÂ»Ã¥ÂÂÃ£ÂÂ¯Ã£ÂÂ¬Ã£ÂÂ¸Ã£ÂÂÃ£ÂÂ\n' + imageCredit.trim();
  }
  return out;
}

// Ã¤Â¸ÂÃ¦ÂÂ¸Ã£ÂÂÃ¤Â¿ÂÃ¥Â­Â
const FB_DRAFTS = `${FB_URL}/drafts`;

async function saveDraft() {
  const title    = document.getElementById('adminTitle').value.trim();
  const body     = document.getElementById('adminBody').value.trim();
  const category = document.getElementById('adminCategory').value;
  const thumb    = document.getElementById('adminThumb')?.value.trim() || '';

  if (!title && !body) { alert('Ã£ÂÂ¿Ã£ÂÂ¤Ã£ÂÂÃ£ÂÂ«Ã£ÂÂÃ¦ÂÂ¬Ã¦ÂÂÃ£ÂÂÃ¥ÂÂ¥Ã¥ÂÂÃ£ÂÂÃ£ÂÂ¦Ã£ÂÂÃ£ÂÂ Ã£ÂÂÃ£ÂÂ'); return; }

  await fetch(FB_DRAFTS + '.json', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ title, body, category, thumb, ts: Date.now() })
  });

  alert('Ã¤Â¸ÂÃ¦ÂÂ¸Ã£ÂÂÃ£ÂÂÃ¤Â¿ÂÃ¥Â­ÂÃ£ÂÂÃ£ÂÂ¾Ã£ÂÂÃ£ÂÂÃ¯Â¼Â');
  loadDrafts();
}

async function loadDrafts() {
  const wrap = document.getElementById('draftList');
  if (!wrap) return;
  try {
    const res = await fetch(FB_DRAFTS + '.json');
    const data = await res.json();
    if (!data) { wrap.innerHTML = '<div style="font-size:.7rem;color:var(--tx3);">Ã¤Â¸ÂÃ¦ÂÂ¸Ã£ÂÂÃ£ÂÂÃ£ÂÂÃ£ÂÂÃ£ÂÂ¾Ã£ÂÂÃ£ÂÂ</div>'; return; }
    const drafts = Object.entries(data).map(([id,d]) => ({id,...d})).sort((a,b) => b.ts - a.ts);
    wrap.innerHTML = drafts.map(d => `
      <div style="background:var(--bg3);border-radius:8px;padding:.6rem;margin-bottom:.4rem;display:flex;align-items:center;gap:.5rem;">
        <div style="flex:1;min-width:0;">
          <div style="font-size:.72rem;font-weight:700;color:var(--tx);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${d.title || 'Ã§ÂÂ¡Ã©Â¡Â'}</div>
          <div style="font-size:.58rem;color:var(--tx3);">${new Date(d.ts).toLocaleDateString('ja-JP')}</div>
        </div>
        <button onclick="loadDraft('${d.id}')" style="background:rgba(0,150,255,.15);border:none;color:#0096ff;padding:.3rem .5rem;border-radius:6px;font-size:.65rem;cursor:pointer;">Ã§Â·Â¨Ã©ÂÂ</button>
        <button onclick="deleteDraft('${d.id}')" style="background:rgba(255,50,50,.15);border:none;color:#ff5555;padding:.3rem .5rem;border-radius:6px;font-size:.65rem;cursor:pointer;">Ã¥ÂÂÃ©ÂÂ¤</button>
      </div>
    `).join('');
  } catch(e) {
    wrap.innerHTML = '<div style="font-size:.7rem;color:var(--tx3);">Ã¥ÂÂÃ¥Â¾ÂÃ¥Â¤Â±Ã¦ÂÂ</div>';
  }
}

async function loadDraft(id) {
  const res = await fetch(`${FB_DRAFTS}/${id}.json`);
  const d = await res.json();
  if (!d) return;
  document.getElementById('adminTitle').value    = d.title || '';
  document.getElementById('adminBody').value     = d.body || '';
  document.getElementById('adminCategory').value = d.category || 'NBA';
  document.getElementById('adminThumb').value    = d.thumb || '';
  updatePreview();
  alert('Ã¤Â¸ÂÃ¦ÂÂ¸Ã£ÂÂÃ£ÂÂÃ¨ÂªÂ­Ã£ÂÂ¿Ã¨Â¾Â¼Ã£ÂÂ¿Ã£ÂÂ¾Ã£ÂÂÃ£ÂÂÃ¯Â¼ÂÃ§Â·Â¨Ã©ÂÂÃ¥Â¾ÂÃ£ÂÂ«Ã¦ÂÂÃ§Â¨Â¿Ã£ÂÂÃ£ÂÂÃ£ÂÂÃ¥ÂÂÃ¤Â¿ÂÃ¥Â­ÂÃ£ÂÂÃ£ÂÂ¦Ã£ÂÂÃ£ÂÂ Ã£ÂÂÃ£ÂÂÃ£ÂÂ');
}

async function deleteDraft(id) {
  if (!confirm('Ã£ÂÂÃ£ÂÂ®Ã¤Â¸ÂÃ¦ÂÂ¸Ã£ÂÂÃ£ÂÂÃ¥ÂÂÃ©ÂÂ¤Ã£ÂÂÃ£ÂÂ¾Ã£ÂÂÃ£ÂÂÃ¯Â¼Â')) return;
  await fetch(`${FB_DRAFTS}/${id}.json`, { method: 'DELETE' });
  loadDrafts();
}
// draft fix v2

async function toggleSlot(slotId, currentlyOff) {
  await fetch(FB_URL + '/adslots/' + slotId + '.json', {
    method: 'PATCH',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ enabled: currentlyOff })
  });
  renderAdManager();
}

async function uploadThumbImage() {
  const input = document.getElementById('adminImgFile');
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const btn = document.getElementById('adminImgUploadBtn');
    btn.textContent = 'Ã£ÂÂ¢Ã£ÂÂÃ£ÂÂÃ£ÂÂ­Ã£ÂÂ¼Ã£ÂÂÃ¤Â¸Â­...';
    const formData = new FormData();
    formData.append('image', file);
    formData.append('key', '6b317240ded356635338f7ce9c45ec05');
    try {
      const res = await fetch('https://api.imgbb.com/1/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        document.getElementById('adminImg').value = data.data.url;
      } else {
        alert('Ã£ÂÂ¢Ã£ÂÂÃ£ÂÂÃ£ÂÂ­Ã£ÂÂ¼Ã£ÂÂÃ£ÂÂ«Ã¥Â¤Â±Ã¦ÂÂÃ£ÂÂÃ£ÂÂ¾Ã£ÂÂÃ£ÂÂ');
      }
    } catch(e) {
      alert('Ã£ÂÂ¨Ã£ÂÂ©Ã£ÂÂ¼Ã£ÂÂÃ§ÂÂºÃ§ÂÂÃ£ÂÂÃ£ÂÂ¾Ã£ÂÂÃ£ÂÂ');
    } finally {
      btn.textContent = 'Ã§ÂÂ»Ã¥ÂÂÃ£ÂÂÃ©ÂÂ¸Ã£ÂÂ¶';
    }
  };
  input.click();
}

function resetArticleForm() {
  document.getElementById('adminTitle').value = '';
  document.getElementById('adminBody').value = '';
  document.getElementById('adminImg').value = '';
  const cat = document.getElementById('adminCategory');
  if (cat) cat.value = 'NBA';
  const preview = document.getElementById('articlePreview');
  if (preview) preview.innerHTML = '';
  const editId = document.getElementById('adminEditId');
  if (editId) editId.value = '';
}

// URLÃ£ÂÂÃ£ÂÂ©Ã£ÂÂ¡Ã£ÂÂ¼Ã£ÂÂ¿Ã£ÂÂ§Ã¨Â¨ÂÃ¤ÂºÂÃ£ÂÂÃ§ÂÂ´Ã¦ÂÂ¥Ã©ÂÂÃ£ÂÂ
(function() {
  const params = new URLSearchParams(window.location.search);
  const articleId = params.get('article');
  if (!articleId) return;
  window._directArticleId = articleId;
  window.addEventListener('load', () => {
    setTimeout(() => {
      const btn = document.getElementById('sn-articles');
      if (btn && typeof goPage === 'function') {
        goPage('articles', btn);
      } else if (btn) {
        btn.click();
      }
    }, 800);
  });
})();

async function editArticle(id) {
  const res = await fetch(`${FB_ARTICLES}/${id}.json`);
  const a = await res.json();
  if (!a) return;
  document.getElementById('adminTitle').value = a.title || '';
  document.getElementById('adminBody').value = a.body || '';
  document.getElementById('adminImg').value = a.img || '';
  {
    const _p = document.getElementById('adminImgPreview');
    const _pi = document.getElementById('adminImgPreviewImg');
    if (_p && _pi) {
      if (a.img) { _pi.src = a.img; _p.style.display = 'block'; }
      else { _pi.src = ''; _p.style.display = 'none'; }
    }
  }
  const cat = document.getElementById('adminCategory');
  if (cat) cat.value = a.category || 'NBA';
  const editId = document.getElementById('adminEditId');
  if (editId) editId.value = id;
  const paEl1 = document.getElementById('adminPublishAt');
  if (paEl1) paEl1.value = msToDatetimeLocal(a.publishAt);
  showAdminArticleUrl(id);
  updatePreview();
  document.getElementById('adminTitle').scrollIntoView({behavior:'smooth'});
  const submitBtn = document.getElementById('adminSubmitBtn');
  if (submitBtn) submitBtn.textContent = 'Ã¤Â¸ÂÃ¦ÂÂ¸Ã£ÂÂÃ¤Â¿ÂÃ¥Â­Â';
  const preview = document.getElementById('articlePreview');
  if (preview) preview.innerHTML = '';
  updatePreview();
}

// Ã§Â®Â¡Ã§ÂÂÃ§ÂÂ»Ã©ÂÂ¢Ã¯Â¼ÂÃ¨Â¨ÂÃ¤ÂºÂÃ¤Â¸ÂÃ¨Â¦Â§Ã¨ÂªÂ­Ã£ÂÂ¿Ã¨Â¾Â¼Ã£ÂÂ¿
async function loadAdminArticles() {
  const list = document.getElementById('adminArticleList');
  if (!list) return;
  list.innerHTML = '<div style="text-align:center;padding:1rem;color:#999;font-size:12px;">Ã¨ÂªÂ­Ã£ÂÂ¿Ã¨Â¾Â¼Ã£ÂÂ¿Ã¤Â¸Â­...</div>';
  try {
    const res = await fetch(FB_ARTICLES + '.json?orderBy="$key"&limitToLast=200');
    const data = await res.json();
    if (!data) { list.innerHTML = '<div style="text-align:center;padding:1rem;color:#999;">Ã¨Â¨ÂÃ¤ÂºÂÃ£ÂÂªÃ£ÂÂ</div>'; return; }
    const articles = Object.entries(data).reverse();
    list.innerHTML = articles.map(([id, a]) => `
      <div style="background:#fff;border-bottom:1px solid #f0f0f0;padding:12px 14px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
          <div style="font-size:9px;color:#C9082A;font-weight:700;background:rgba(201,8,42,0.08);padding:2px 6px;border-radius:4px;">${a.category||'Ã¦ÂÂªÃ¥ÂÂÃ©Â¡Â'}</div>
          <div style="font-size:9px;color:#999;">${a.date||''}</div>
        </div>
        <div style="font-size:13px;font-weight:700;color:#000;line-height:1.4;margin-bottom:8px;">${a.title||'Ã§ÂÂ¡Ã©Â¡Â'}</div>
        <div style="display:flex;gap:6px;">
          <button onclick="editArticle('${id}')" style="flex:1;padding:6px;background:#f5f5f5;border:1px solid #eee;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;">Ã§Â·Â¨Ã©ÂÂ</button>
          <button onclick="archiveArticle('${id}', ${a.archived ? 'false' : 'true'})" style="flex:1;padding:6px;background:${a.archived ? 'rgba(0,150,0,0.08)' : 'rgba(100,100,100,0.08)'};border:1px solid ${a.archived ? 'rgba(0,150,0,0.2)' : '#ddd'};border-radius:6px;font-size:11px;font-weight:700;color:${a.archived ? 'green' : '#666'};cursor:pointer;">${a.archived ? 'Ã¥ÂÂ¬Ã©ÂÂÃ£ÂÂ«Ã¦ÂÂ»Ã£ÂÂ' : 'Ã£ÂÂ¢Ã£ÂÂ¼Ã£ÂÂ«Ã£ÂÂ¤Ã£ÂÂ'}</button>
          <button onclick="deleteArticle('${id}')" style="flex:1;padding:6px;background:rgba(201,8,42,0.08);border:1px solid rgba(201,8,42,0.2);border-radius:6px;font-size:11px;font-weight:700;color:#C9082A;cursor:pointer;">Ã¥ÂÂÃ©ÂÂ¤</button>
        </div>
      </div>
    `).join('');
  } catch(e) {
    list.innerHTML = '<div style="text-align:center;padding:1rem;color:#999;">Ã¥ÂÂÃ¥Â¾ÂÃ¥Â¤Â±Ã¦ÂÂ</div>';
  }
}

function openNewArticle() {
  document.getElementById('articleForm').style.display = 'block';
  document.getElementById('adminEditId').value = '';
  document.getElementById('adminTitle').value = '';
  setAdminBodyValue('');
  if (document.getElementById('adminSourceText')) document.getElementById('adminSourceText').value = '';
  if (document.getElementById('adminImageCredit')) document.getElementById('adminImageCredit').value = '';
  document.getElementById('adminImg').value = '';
  {
    const _p = document.getElementById('adminImgPreview');
    const _pi = document.getElementById('adminImgPreviewImg');
    if (_p && _pi) { _pi.src = ''; _p.style.display = 'none'; }
  }
  if (document.getElementById('adminAffiliateLink')) document.getElementById('adminAffiliateLink').value = '';
  const paEl = document.getElementById('adminPublishAt'); if (paEl) paEl.value = '';
  showAdminArticleUrl(null);
  document.getElementById('adminSubmitBtn').textContent = 'Ã¦ÂÂÃ§Â¨Â¿Ã£ÂÂÃ£ÂÂ';
  _bodyUndoStack = [];
}

function cancelArticleEdit() {
  document.getElementById('articleForm').style.display = 'none';
}

async function archiveArticle(id, archive) {
  await fetch(FB_ARTICLES + '/' + id + '.json', {
    method: 'PATCH',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ archived: archive })
  });
  loadAdminArticles();
}

async function deleteArticle(id) {
  if (!confirm('Ã¥ÂÂÃ©ÂÂ¤Ã£ÂÂÃ£ÂÂ¾Ã£ÂÂÃ£ÂÂÃ¯Â¼Â')) return;
  await fetch(FB_ARTICLES + '/' + id + '.json', {method: 'DELETE'});
  loadAdminArticles();
}

async function editArticle(id) {
  const res = await fetch(FB_ARTICLES + '/' + id + '.json');
  const d = await res.json();
  document.getElementById('articleForm').style.display = 'block';
  document.getElementById('adminEditId').value = id;
  document.getElementById('adminTitle').value = d.title || '';
  const meta = extractArticleMetaSections(d.body || '');
  setAdminBodyValue(meta.cleanBody);
  if (document.getElementById('adminSourceText')) document.getElementById('adminSourceText').value = meta.sourceText || '';
  if (document.getElementById('adminImageCredit')) document.getElementById('adminImageCredit').value = meta.imageCredit || '';
  document.getElementById('adminCategory').value = d.category || 'NBAÃ£ÂÂÃ£ÂÂ¡Ã£ÂÂ¤Ã£ÂÂÃ£ÂÂ«';
  if (document.getElementById('adminImg')) document.getElementById('adminImg').value = d.img || '';
  {
    const _p = document.getElementById('adminImgPreview');
    const _pi = document.getElementById('adminImgPreviewImg');
    if (_p && _pi) {
      if (d.img) { _pi.src = d.img; _p.style.display = 'block'; }
      else { _pi.src = ''; _p.style.display = 'none'; }
    }
  }
  if (document.getElementById('adminAffiliateLink')) document.getElementById('adminAffiliateLink').value = d.affiliateLink || '';
  const paEl2 = document.getElementById('adminPublishAt');
  if (paEl2) paEl2.value = msToDatetimeLocal(d.publishAt);
  showAdminArticleUrl(id);
  document.getElementById('adminSubmitBtn').textContent = 'Ã¤Â¸ÂÃ¦ÂÂ¸Ã£ÂÂÃ¤Â¿ÂÃ¥Â­Â';
  _bodyUndoStack = [];
}

function snapshotBodyHistory() {
  const el = document.getElementById('adminBody');
  if (!el) return;
  const current = el.innerHTML;
  if (_bodyUndoStack.length && _bodyUndoStack[_bodyUndoStack.length - 1] === current) return;
  _bodyUndoStack.push(current);
  if (_bodyUndoStack.length > 30) _bodyUndoStack.shift();
}

function snapshotBodyHistoryDebounced() {
  clearTimeout(_bodyUndoTimer);
  _bodyUndoTimer = setTimeout(snapshotBodyHistory, 600);
}

function undoBodyEdit() {
  const el = document.getElementById('adminBody');
  if (!el || !_bodyUndoStack.length) return;
  el.innerHTML = _bodyUndoStack.pop();
  updateBodyPreview();
}

function getAdminBodyValue() {
  const el = document.getElementById('adminBody');
  if (!el) return '';
  const lines = [];
  el.childNodes.forEach(node => {
    if (node.nodeType === 3) {
      if (node.textContent.trim()) lines.push(node.textContent);
      return;
    }
    if (node.tagName === 'BR') { lines.push(''); return; }
    if (node.dataset && node.dataset.embedLine !== undefined) { lines.push(node.dataset.embedLine); return; }
    lines.push(node.innerHTML.replace(/^<br>$/i, ''));
  });
  return lines.join('\n');
}

// Ã¥ÂÂÃ£ÂÂÃ¨Â¾Â¼Ã£ÂÂ¿Ã§Â³Â»Ã¯Â¼ÂÃ£ÂÂÃ£ÂÂ¤Ã£ÂÂ¼Ã£ÂÂ/Ã¥ÂÂÃ¥ÂÂÃ£ÂÂªÃ£ÂÂ³Ã£ÂÂ¯/Ã£ÂÂªÃ£ÂÂ³Ã£ÂÂ¯Ã¯Â¼ÂÃ£ÂÂÃ§Â·Â¨Ã©ÂÂÃ£ÂÂ¨Ã£ÂÂªÃ£ÂÂ¢Ã¥ÂÂÃ£ÂÂ§
// Ã¦ÂÂ Ã¤Â»ÂÃ£ÂÂÃ£ÂÂ®Ã§ÂÂ®Ã§Â«ÂÃ£ÂÂ¤Ã£ÂÂÃ£ÂÂ­Ã£ÂÂÃ£ÂÂ¯Ã£ÂÂ¨Ã£ÂÂÃ£ÂÂ¦Ã¨Â¡Â¨Ã§Â¤ÂºÃ£ÂÂÃ£ÂÂÃ£ÂÂÃ£ÂÂÃ£ÂÂ®Ã£ÂÂÃ£ÂÂÃ£ÂÂÃ£ÂÂÃ¤Â½ÂÃ£ÂÂ
function createEmbedChip(kind, rawLine, displayHtml) {
  const div = document.createElement('div');
  div.setAttribute('contenteditable', 'false');
  div.dataset.embedLine = rawLine;
  const colors = {
    tweet:    {bg:'#eef4ff', border:'#cfe0ff', icon:'Ã°ÂÂÂ±', label:'Ã£ÂÂÃ£ÂÂ¤Ã£ÂÂ¼Ã£ÂÂ'},
    product:  {bg:'#fff3e0', border:'#ffd9a0', icon:'Ã°ÂÂÂ', label:'Ã¥ÂÂÃ¥ÂÂÃ£ÂÂªÃ£ÂÂ³Ã£ÂÂ¯'},
    shopcard: {bg:'#e8f5e9', border:'#b8e0bb', icon:'Ã°ÂÂÂÃ¯Â¸Â', label:'Ã¥ÂÂÃ¥ÂÂÃ¦Â¯ÂÃ¨Â¼ÂÃ£ÂÂ«Ã£ÂÂ¼Ã£ÂÂ'},
    quote:    {bg:'#fdeeee', border:'#f3c6c6', icon:'Ã°ÂÂÂ¬', label:'Ã¥Â¼ÂÃ§ÂÂ¨Ã£ÂÂ³Ã£ÂÂ¡Ã£ÂÂ³Ã£ÂÂ'},
    link:     {bg:'#f3f3f3', border:'#ddd',    icon:'Ã°ÂÂÂ', label:'Ã£ÂÂªÃ£ÂÂ³Ã£ÂÂ¯'}
  }[kind];
  div.style.cssText = `margin:8px 0;padding:8px 10px;background:${colors.bg};border:1px solid ${colors.border};border-radius:8px;font-size:11px;color:#555;display:flex;align-items:flex-start;gap:6px;`;
  div.innerHTML = `<span style="flex-shrink:0;">${colors.icon}</span><div style="min-width:0;overflow:hidden;"><div style="font-size:9px;font-weight:700;color:#999;margin-bottom:2px;">${colors.label}</div><div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${displayHtml}</div></div>`;
  return div;
}

// Ã¦ÂÂ¬Ã¦ÂÂÃ£ÂÂ®1Ã¨Â¡ÂÃ£ÂÂÃ¥ÂÂÃ£ÂÂÃ¨Â¾Â¼Ã£ÂÂ¿Ã§Â³Â»Ã£ÂÂ®Ã£ÂÂÃ£ÂÂ¿Ã£ÂÂ¼Ã£ÂÂ³Ã£ÂÂ«Ã¤Â¸ÂÃ¨ÂÂ´Ã£ÂÂÃ£ÂÂÃ£ÂÂÃ¨ÂªÂ¿Ã£ÂÂ¹Ã£ÂÂÃ¤Â¸ÂÃ¨ÂÂ´Ã£ÂÂÃ£ÂÂÃ£ÂÂ°Ã£ÂÂÃ£ÂÂÃ£ÂÂÃ¨Â¦ÂÃ§Â´Â Ã£ÂÂÃ¨Â¿ÂÃ£ÂÂ
function tryBuildEmbedChip(line) {
  const t = line.trim();
  if (!t) return null;
  if (t.includes('twitter.com') || t.includes('x.com') || t.includes('instagram.com') || t.includes('tiktok.com')) {
    if (/^https?:\/\//.test(t)) return createEmbedChip('tweet', t, t);
  }
  const productMatch = t.match(/^\[product name="([^"]*)" price="([^"]*)" url="([^"]*)"(?: img="([^"]*)")?\]$/);
  if (productMatch) {
    return createEmbedChip('product', t, `${productMatch[1]} ${productMatch[2] ? '(' + productMatch[2] + ')' : ''}`);
  }
  const quoteChipMatch = t.match(/^\[quote text="([^"]*)" name="([^"]*)" source="([^"]*)" url="([^"]*)"\]$/);
  if (quoteChipMatch) {
    return createEmbedChip('quote', t, `${quoteChipMatch[2] || 'Ã¥Â¼ÂÃ§ÂÂ¨'}Ã¯Â¼Â${quoteChipMatch[1].slice(0, 20)}...`);
  }
  const shopcardMatch = t.match(/^\[shopcard name="([^"]*)" img="([^"]*)" rakuten="([^"]*)" rakutenPrice="([^"]*)" amazon="([^"]*)" amazonPrice="([^"]*)"\]$/);
  if (shopcardMatch) {
    const shops = [];
    if (shopcardMatch[3]) shops.push('Ã¦Â¥Â½Ã¥Â¤Â©' + (shopcardMatch[4] ? '(' + shopcardMatch[4] + ')' : ''));
    if (shopcardMatch[5]) shops.push('Amazon' + (shopcardMatch[6] ? '(' + shopcardMatch[6] + ')' : ''));
    return createEmbedChip('shopcard', t, `${shopcardMatch[1]} ${shops.length ? '[' + shops.join(' / ') + ']' : ''}`);
  }
  const linkMatch = t.match(/^<a href="([^"]*)"[^>]*>([^<]*)<\/a>$/);
  if (linkMatch) {
    return createEmbedChip('link', t, linkMatch[2] || linkMatch[1]);
  }
  return null;
}

function setAdminBodyValue(text) {
  const el = document.getElementById('adminBody');
  if (!el) return;
  if (!text) { el.innerHTML = '<br>'; return; }
  const lines = text.split('\n');
  el.innerHTML = '';
  lines.forEach(l => {
    const chip = tryBuildEmbedChip(l);
    if (chip) { el.appendChild(chip); return; }
    const div = document.createElement('div');
    div.innerHTML = l || '<br>';
    el.appendChild(div);
  });
}

// Ã£ÂÂ«Ã£ÂÂ¼Ã£ÂÂ½Ã£ÂÂ«Ã£ÂÂÃ¤Â»ÂÃ£ÂÂ©Ã£ÂÂ®Ã£ÂÂÃ¨Â¡ÂÃ¯Â¼Â#adminBodyÃ£ÂÂ®Ã§ÂÂ´Ã¤Â¸ÂÃ£ÂÂ®Ã¨Â¦ÂÃ§Â´Â Ã¯Â¼ÂÃ£ÂÂÃ£ÂÂ®Ã¤Â¸Â­Ã£ÂÂ«Ã£ÂÂÃ£ÂÂÃ£ÂÂÃ£ÂÂÃ¦ÂÂ¢Ã£ÂÂ
function getCurrentTopLevelLine() {
  const el = document.getElementById('adminBody');
  const sel = window.getSelection();
  if (!sel.rangeCount) return null;
  let node = sel.getRangeAt(0).commonAncestorContainer;
  if (!el.contains(node)) return null;
  while (node && node.parentElement !== el) node = node.parentElement;
  return node; // elÃ§ÂÂ´Ã¤Â¸ÂÃ£ÂÂ®Ã¨Â¦ÂÃ§Â´Â Ã£ÂÂÃ£ÂÂ¾Ã£ÂÂÃ£ÂÂ¯null
}

function insertNodeAtCursor(node) {
  snapshotBodyHistory();
  const el = document.getElementById('adminBody');
  el.focus();
  const currentLine = getCurrentTopLevelLine();
  const spacer = document.createElement('div');
  spacer.innerHTML = '<br>';
  if (currentLine && currentLine.parentElement === el) {
    // Ã§ÂÂ¾Ã¥ÂÂ¨Ã£ÂÂ®Ã¨Â¡ÂÃ£ÂÂ®"Ã¥Â¤ÂÃ¥ÂÂ´"Ã¯Â¼ÂÃ§ÂÂ´Ã¥Â¾ÂÃ¯Â¼ÂÃ£ÂÂ«Ã¦ÂÂ¿Ã¥ÂÂ¥Ã£ÂÂÃ£ÂÂÃ£ÂÂÃ¨Â¡ÂÃ£ÂÂ®Ã©ÂÂÃ¤Â¸Â­Ã£ÂÂÃ¥Â£ÂÃ£ÂÂÃ£ÂÂªÃ£ÂÂÃ£ÂÂ
    currentLine.after(node, spacer);
  } else {
    el.appendChild(node);
    el.appendChild(spacer);
  }
  const range = document.createRange();
  range.setStartAfter(spacer);
  range.setEndAfter(spacer);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
  updateBodyPreview();
}

function insertHtmlAtCursor(html) {
  snapshotBodyHistory();
  const el = document.getElementById('adminBody');
  el.focus();
  const wrap = document.createElement('div');
  wrap.innerHTML = html;
  const nodes = [...wrap.childNodes];
  if (!nodes.length) return;
  const currentLine = getCurrentTopLevelLine();
  if (currentLine && currentLine.parentElement === el) {
    currentLine.after(...nodes);
  } else {
    nodes.forEach(n => el.appendChild(n));
  }
  const lastNode = nodes[nodes.length - 1];
  const range = document.createRange();
  range.setStartAfter(lastNode);
  range.setEndAfter(lastNode);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
  updateBodyPreview();
}

function getSelectedText() {
  const sel = window.getSelection();
  return sel.rangeCount ? sel.toString() : '';
}

// ============================================================
// Ã£ÂÂÃ£ÂÂ¼Ã£ÂÂ«Ã£ÂÂÃ£ÂÂ¼Ã¦ÂÂ¿Ã¥ÂÂ¥Ã©ÂÂ¢Ã¦ÂÂ°
// ============================================================
function insertBodyTag(type) {
  if (type === 'bold') {
    const sel = window.getSelection();
    if (!sel.rangeCount || sel.isCollapsed) { alert('Ã¥Â¤ÂªÃ¥Â­ÂÃ£ÂÂ«Ã£ÂÂÃ£ÂÂÃ£ÂÂÃ©ÂÂ¨Ã¥ÂÂÃ£ÂÂÃ©ÂÂ¸Ã¦ÂÂÃ£ÂÂÃ£ÂÂ¦Ã£ÂÂÃ£ÂÂ Ã£ÂÂÃ£ÂÂ'); return; }
    snapshotBodyHistory();
    document.getElementById('adminBody').focus();
    document.execCommand('styleWithCSS', false, true);
    document.execCommand('bold');
    updateBodyPreview();
    return;
  }
  const selected = getSelectedText();
  let insert = '';
  switch(type) {
    case 'h2':
      insert = `<div style="font-size:1.1rem;font-weight:700;margin:1rem 0 .5rem;border-left:4px solid #C9082A;padding-left:8px;">${selected || 'Ã¨Â¦ÂÃ¥ÂÂºÃ£ÂÂ'}</div><div><br></div>`;
      break;
    case 'h3':
      insert = `<div style="font-size:.95rem;font-weight:700;margin:.8rem 0 .4rem;">${selected || 'Ã¥Â°ÂÃ¨Â¦ÂÃ¥ÂÂºÃ£ÂÂ'}</div><div><br></div>`;
      break;
    case 'hr':
      insert = `<div><hr style="border:none;border-top:2px solid #ccc;margin:1.2rem 0;"></div><div><br></div>`;
      break;
    case 'quote':
      insert = `<div style="border-left:4px solid #C9082A;padding:.5rem 1rem;margin:.8rem 0;background:#f9f9f9;font-size:.85rem;color:#555;">${selected || 'Ã¥Â¼ÂÃ§ÂÂ¨Ã£ÂÂÃ£ÂÂ­Ã£ÂÂ¹Ã£ÂÂ'}</div><div><br></div>`;
      break;
  }
  insertHtmlAtCursor(insert);
}

// ============================================================
// contenteditableÃ§ÂÂ Ã¦ÂÂ¬Ã¦ÂÂÃ£ÂÂ¨Ã£ÂÂÃ£ÂÂ£Ã£ÂÂ¿Ã§ÂÂ¨Ã£ÂÂÃ£ÂÂ«Ã£ÂÂÃ£ÂÂ¼
// ============================================================
function getAdminBodyValue() {
  const el = document.getElementById('adminBody');
  if (!el) return '';
  const lines = [];
  el.childNodes.forEach(node => {
    if (node.nodeType === 3) {
      if (node.textContent.trim()) lines.push(node.textContent);
      return;
    }
    if (node.tagName === 'BR') { lines.push(''); return; }
    if (node.dataset && node.dataset.embedLine !== undefined) { lines.push(node.dataset.embedLine); return; }
    lines.push(node.innerHTML.replace(/^<br>$/i, ''));
  });
  return lines.join('\n');
}

// Ã¥ÂÂÃ£ÂÂÃ¨Â¾Â¼Ã£ÂÂ¿Ã§Â³Â»Ã¯Â¼ÂÃ£ÂÂÃ£ÂÂ¤Ã£ÂÂ¼Ã£ÂÂ/Ã¥ÂÂÃ¥ÂÂÃ£ÂÂªÃ£ÂÂ³Ã£ÂÂ¯/Ã£ÂÂªÃ£ÂÂ³Ã£ÂÂ¯Ã¯Â¼ÂÃ£ÂÂÃ§Â·Â¨Ã©ÂÂÃ£ÂÂ¨Ã£ÂÂªÃ£ÂÂ¢Ã¥ÂÂÃ£ÂÂ§
// Ã¦ÂÂ Ã¤Â»ÂÃ£ÂÂÃ£ÂÂ®Ã§ÂÂ®Ã§Â«ÂÃ£ÂÂ¤Ã£ÂÂÃ£ÂÂ­Ã£ÂÂÃ£ÂÂ¯Ã£ÂÂ¨Ã£ÂÂÃ£ÂÂ¦Ã¨Â¡Â¨Ã§Â¤ÂºÃ£ÂÂÃ£ÂÂÃ£ÂÂÃ£ÂÂÃ£ÂÂ®Ã£ÂÂÃ£ÂÂÃ£ÂÂÃ£ÂÂÃ¤Â½ÂÃ£ÂÂ
function createEmbedChip(kind, rawLine, displayHtml) {
  const div = document.createElement('div');
  div.setAttribute('contenteditable', 'false');
  div.dataset.embedLine = rawLine;
  const colors = {
    tweet:    {bg:'#eef4ff', border:'#cfe0ff', icon:'Ã°ÂÂÂ±', label:'Ã£ÂÂÃ£ÂÂ¤Ã£ÂÂ¼Ã£ÂÂ'},
    product:  {bg:'#fff3e0', border:'#ffd9a0', icon:'Ã°ÂÂÂ', label:'Ã¥ÂÂÃ¥ÂÂÃ£ÂÂªÃ£ÂÂ³Ã£ÂÂ¯'},
    shopcard: {bg:'#e8f5e9', border:'#b8e0bb', icon:'Ã°ÂÂÂÃ¯Â¸Â', label:'Ã¥ÂÂÃ¥ÂÂÃ¦Â¯ÂÃ¨Â¼ÂÃ£ÂÂ«Ã£ÂÂ¼Ã£ÂÂ'},
    quote:    {bg:'#fdeeee', border:'#f3c6c6', icon:'Ã°ÂÂÂ¬', label:'Ã¥Â¼ÂÃ§ÂÂ¨Ã£ÂÂ³Ã£ÂÂ¡Ã£ÂÂ³Ã£ÂÂ'},
    link:     {bg:'#f3f3f3', border:'#ddd',    icon:'Ã°ÂÂÂ', label:'Ã£ÂÂªÃ£ÂÂ³Ã£ÂÂ¯'}
  }[kind];
  div.style.cssText = `margin:8px 0;padding:8px 10px;background:${colors.bg};border:1px solid ${colors.border};border-radius:8px;font-size:11px;color:#555;display:flex;align-items:flex-start;gap:6px;`;
  div.innerHTML = `<span style="flex-shrink:0;">${colors.icon}</span><div style="min-width:0;overflow:hidden;"><div style="font-size:9px;font-weight:700;color:#999;margin-bottom:2px;">${colors.label}</div><div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${displayHtml}</div></div>`;
  return div;
}

// Ã¦ÂÂ¬Ã¦ÂÂÃ£ÂÂ®1Ã¨Â¡ÂÃ£ÂÂÃ¥ÂÂÃ£ÂÂÃ¨Â¾Â¼Ã£ÂÂ¿Ã§Â³Â»Ã£ÂÂ®Ã£ÂÂÃ£ÂÂ¿Ã£ÂÂ¼Ã£ÂÂ³Ã£ÂÂ«Ã¤Â¸ÂÃ¨ÂÂ´Ã£ÂÂÃ£ÂÂÃ£ÂÂÃ¨ÂªÂ¿Ã£ÂÂ¹Ã£ÂÂÃ¤Â¸ÂÃ¨ÂÂ´Ã£ÂÂÃ£ÂÂÃ£ÂÂ°Ã£ÂÂÃ£ÂÂÃ£ÂÂÃ¨Â¦ÂÃ§Â´Â Ã£ÂÂÃ¨Â¿ÂÃ£ÂÂ
function tryBuildEmbedChip(line) {
  const t = line.trim();
  if (!t) return null;
  if (t.includes('twitter.com') || t.includes('x.com') || t.includes('instagram.com') || t.includes('tiktok.com')) {
    if (/^https?:\/\//.test(t)) return createEmbedChip('tweet', t, t);
  }
  const productMatch = t.match(/^\[product name="([^"]*)" price="([^"]*)" url="([^"]*)"(?: img="([^"]*)")?\]$/);
  if (productMatch) {
    return createEmbedChip('product', t, `${productMatch[1]} ${productMatch[2] ? '(' + productMatch[2] + ')' : ''}`);
  }
  const quoteChipMatch = t.match(/^\[quote text="([^"]*)" name="([^"]*)" source="([^"]*)" url="([^"]*)"\]$/);
  if (quoteChipMatch) {
    return createEmbedChip('quote', t, `${quoteChipMatch[2] || 'Ã¥Â¼ÂÃ§ÂÂ¨'}Ã¯Â¼Â${quoteChipMatch[1].slice(0, 20)}...`);
  }
  const shopcardMatch = t.match(/^\[shopcard name="([^"]*)" img="([^"]*)" rakuten="([^"]*)" rakutenPrice="([^"]*)" amazon="([^"]*)" amazonPrice="([^"]*)"\]$/);
  if (shopcardMatch) {
    const shops = [];
    if (shopcardMatch[3]) shops.push('Ã¦Â¥Â½Ã¥Â¤Â©' + (shopcardMatch[4] ? '(' + shopcardMatch[4] + ')' : ''));
    if (shopcardMatch[5]) shops.push('Amazon' + (shopcardMatch[6] ? '(' + shopcardMatch[6] + ')' : ''));
    return createEmbedChip('shopcard', t, `${shopcardMatch[1]} ${shops.length ? '[' + shops.join(' / ') + ']' : ''}`);
  }
  const linkMatch = t.match(/^<a href="([^"]*)"[^>]*>([^<]*)<\/a>$/);
  if (linkMatch) {
    return createEmbedChip('link', t, linkMatch[2] || linkMatch[1]);
  }
  return null;
}

function setAdminBodyValue(text) {
  const el = document.getElementById('adminBody');
  if (!el) return;
  if (!text) { el.innerHTML = '<br>'; return; }
  const lines = text.split('\n');
  el.innerHTML = '';
  lines.forEach(l => {
    const chip = tryBuildEmbedChip(l);
    if (chip) { el.appendChild(chip); return; }
    const div = document.createElement('div');
    div.innerHTML = l || '<br>';
    el.appendChild(div);
  });
}

// Ã£ÂÂ«Ã£ÂÂ¼Ã£ÂÂ½Ã£ÂÂ«Ã£ÂÂÃ¤Â»ÂÃ£ÂÂ©Ã£ÂÂ®Ã£ÂÂÃ¨Â¡ÂÃ¯Â¼Â#adminBodyÃ£ÂÂ®Ã§ÂÂ´Ã¤Â¸ÂÃ£ÂÂ®Ã¨Â¦ÂÃ§Â´Â Ã¯Â¼ÂÃ£ÂÂÃ£ÂÂ®Ã¤Â¸Â­Ã£ÂÂ«Ã£ÂÂÃ£ÂÂÃ£ÂÂÃ£ÂÂÃ¦ÂÂ¢Ã£ÂÂ
function getCurrentTopLevelLine() {
  const el = document.getElementById('adminBody');
  const sel = window.getSelection();
  if (!sel.rangeCount) return null;
  let node = sel.getRangeAt(0).commonAncestorContainer;
  if (!el.contains(node)) return null;
  while (node && node.parentElement !== el) node = node.parentElement;
  return node; // elÃ§ÂÂ´Ã¤Â¸ÂÃ£ÂÂ®Ã¨Â¦ÂÃ§Â´Â Ã£ÂÂÃ£ÂÂ¾Ã£ÂÂÃ£ÂÂ¯null
}

function insertNodeAtCursor(node) {
  snapshotBodyHistory();
  const el = document.getElementById('adminBody');
  el.focus();
  const currentLine = getCurrentTopLevelLine();
  const spacer = document.createElement('div');
  spacer.innerHTML = '<br>';
  if (currentLine && currentLine.parentElement === el) {
    // Ã§ÂÂ¾Ã¥ÂÂ¨Ã£ÂÂ®Ã¨Â¡ÂÃ£ÂÂ®"Ã¥Â¤ÂÃ¥ÂÂ´"Ã¯Â¼ÂÃ§ÂÂ´Ã¥Â¾ÂÃ¯Â¼ÂÃ£ÂÂ«Ã¦ÂÂ¿Ã¥ÂÂ¥Ã£ÂÂÃ£ÂÂÃ£ÂÂÃ¨Â¡ÂÃ£ÂÂ®Ã©ÂÂÃ¤Â¸Â­Ã£ÂÂÃ¥Â£ÂÃ£ÂÂÃ£ÂÂªÃ£ÂÂÃ£ÂÂ
    currentLine.after(node, spacer);
  } else {
    el.appendChild(node);
    el.appendChild(spacer);
  }
  const range = document.createRange();
  range.setStartAfter(spacer);
  range.setEndAfter(spacer);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
  updateBodyPreview();
}

function insertHtmlAtCursor(html) {
  snapshotBodyHistory();
  const el = document.getElementById('adminBody');
  el.focus();
  const wrap = document.createElement('div');
  wrap.innerHTML = html;
  const nodes = [...wrap.childNodes];
  if (!nodes.length) return;
  const currentLine = getCurrentTopLevelLine();
  if (currentLine && currentLine.parentElement === el) {
    currentLine.after(...nodes);
  } else {
    nodes.forEach(n => el.appendChild(n));
  }
  const lastNode = nodes[nodes.length - 1];
  const range = document.createRange();
  range.setStartAfter(lastNode);
  range.setEndAfter(lastNode);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
  updateBodyPreview();
}

function getSelectedText() {
  const sel = window.getSelection();
  return sel.rangeCount ? sel.toString() : '';
}

// ============================================================
// Ã£ÂÂÃ£ÂÂ¼Ã£ÂÂ«Ã£ÂÂÃ£ÂÂ¼Ã¦ÂÂ¿Ã¥ÂÂ¥Ã©ÂÂ¢Ã¦ÂÂ°
// ============================================================
function insertBodyTag(type) {
  if (type === 'bold') {
    const sel = window.getSelection();
    if (!sel.rangeCount || sel.isCollapsed) { alert('Ã¥Â¤ÂªÃ¥Â­ÂÃ£ÂÂ«Ã£ÂÂÃ£ÂÂÃ£ÂÂÃ©ÂÂ¨Ã¥ÂÂÃ£ÂÂÃ©ÂÂ¸Ã¦ÂÂÃ£ÂÂÃ£ÂÂ¦Ã£ÂÂÃ£ÂÂ Ã£ÂÂÃ£ÂÂ'); return; }
    snapshotBodyHistory();
    document.getElementById('adminBody').focus();
    document.execCommand('styleWithCSS', false, true);
    document.execCommand('bold');
    updateBodyPreview();
    return;
  }
  const selected = getSelectedText();
  let insert = '';
  switch(type) {
    case 'h2':
      insert = `<div style="font-size:1.1rem;font-weight:700;margin:1rem 0 .5rem;border-left:4px solid #C9082A;padding-left:8px;">${selected || 'Ã¨Â¦ÂÃ¥ÂÂºÃ£ÂÂ'}</div><div><br></div>`;
      break;
    case 'h3':
      insert = `<div style="font-size:.95rem;font-weight:700;margin:.8rem 0 .4rem;">${selected || 'Ã¥Â°ÂÃ¨Â¦ÂÃ¥ÂÂºÃ£ÂÂ'}</div><div><br></div>`;
      break;
    case 'hr':
      insert = `<div><hr style="border:none;border-top:2px solid #ccc;margin:1.2rem 0;"></div><div><br></div>`;
      break;
    case 'quote':
      insert = `<div style="border-left:4px solid #C9082A;padding:.5rem 1rem;margin:.8rem 0;background:#f9f9f9;font-size:.85rem;color:#555;">${selected || 'Ã¥Â¼ÂÃ§ÂÂ¨Ã£ÂÂÃ£ÂÂ­Ã£ÂÂ¹Ã£ÂÂ'}</div><div><br></div>`;
      break;
  }
  insertHtmlAtCursor(insert);
}

// ============================================================
// Ã¦ÂÂ¬Ã¦ÂÂÃ£ÂÂ¿Ã£ÂÂÃ¥ÂÂÃ£ÂÂÃ¦ÂÂ¿Ã£ÂÂ
// ============================================================
function switchBodyTab(tab) {
  const ta = document.getElementById('adminBody');
  const preview = document.getElementById('adminBodyPreview');
  const editBtn = document.getElementById('bodyTabEdit');
  const previewBtn = document.getElementById('bodyTabPreview');

  if (tab === 'edit') {
    ta.style.display = '';
    preview.style.display = 'none';
    editBtn.style.background = '#C9082A';
    editBtn.style.color = '#fff';
    previewBtn.style.background = 'transparent';
    previewBtn.style.color = '#999';
  } else {
    updateBodyPreview();
    ta.style.display = 'none';
    preview.style.display = '';
    previewBtn.style.background = '#C9082A';
    previewBtn.style.color = '#fff';
    editBtn.style.background = 'transparent';
    editBtn.style.color = '#999';
  }
}

function updateBodyPreview() {
  const preview = document.getElementById('adminBodyPreview');
  if (!preview) return;
  const val = getAdminBodyValue();
  preview.innerHTML = val ? renderBody(val) : '<span style="color:#ccc;">Ã£ÂÂÃ£ÂÂ¬Ã£ÂÂÃ£ÂÂ¥Ã£ÂÂ¼Ã£ÂÂÃ£ÂÂÃ£ÂÂÃ£ÂÂ«Ã¨Â¡Â¨Ã§Â¤ÂºÃ£ÂÂÃ£ÂÂÃ£ÂÂ¾Ã£ÂÂ</span>';
  if (typeof twttr !== 'undefined' && twttr.widgets) twttr.widgets.load();
  if (typeof window.instgrm !== 'undefined' && window.instgrm.Embeds) window.instgrm.Embeds.process();
}

// SNSÃ¥ÂÂÃ£ÂÂÃ¨Â¾Â¼Ã£ÂÂ¿Ã¦ÂÂ¿Ã¥ÂÂ¥Ã¯Â¼ÂX / Instagram / TikTok Ã¨ÂÂªÃ¥ÂÂÃ¥ÂÂ¤Ã¥ÂÂ¥Ã¯Â¼Â
let _snsEmbedTA = null;
let _savedBodyRange = null;
function saveBodyCursorRange() {
  const el = document.getElementById('adminBody');
  const sel = window.getSelection();
  if (sel.rangeCount && el.contains(sel.getRangeAt(0).commonAncestorContainer)) {
    _savedBodyRange = sel.getRangeAt(0).cloneRange();
  } else {
    _savedBodyRange = null;
  }
}
function insertHtmlAtSavedRange(html) {
  const el = document.getElementById('adminBody');
  el.focus();
  const sel = window.getSelection();
  sel.removeAllRanges();
  if (_savedBodyRange) {
    sel.addRange(_savedBodyRange);
  } else {
    const r = document.createRange();
    r.selectNodeContents(el);
    r.collapse(false);
    sel.addRange(r);
  }
  insertHtmlAtCursor(html);
}

function insertNodeAtSavedRange(node) {
  const el = document.getElementById('adminBody');
  el.focus();
  const sel = window.getSelection();
  sel.removeAllRanges();
  if (_savedBodyRange) {
    sel.addRange(_savedBodyRange);
  } else {
    const r = document.createRange();
    r.selectNodeContents(el);
    r.collapse(false);
    sel.addRange(r);
  }
  insertNodeAtCursor(node);
}

function insertSnsEmbed() {
  saveBodyCursorRange();
  const urlInput = document.getElementById('snsEmbedUrl');
  const detected = document.getElementById('snsEmbedDetected');
  urlInput.value = '';
  detected.textContent = '';
  document.getElementById('snsEmbedModal').style.display = 'flex';
  urlInput.oninput = () => {
    const v = urlInput.value;
    let platform = '';
    if (v.includes('twitter.com') || v.includes('x.com')) platform = 'Ã¢ÂÂ X (Twitter) Ã£ÂÂ®Ã¦ÂÂÃ§Â¨Â¿Ã£ÂÂ¨Ã£ÂÂÃ£ÂÂ¦Ã¨ÂªÂÃ¨Â­ÂÃ£ÂÂÃ£ÂÂ¾Ã£ÂÂÃ£ÂÂ';
    else if (v.includes('instagram.com')) platform = 'Ã¢ÂÂ Instagram Ã£ÂÂ®Ã¦ÂÂÃ§Â¨Â¿Ã£ÂÂ¨Ã£ÂÂÃ£ÂÂ¦Ã¨ÂªÂÃ¨Â­ÂÃ£ÂÂÃ£ÂÂ¾Ã£ÂÂÃ£ÂÂ';
    else if (v.includes('tiktok.com')) platform = 'Ã¢ÂÂ TikTok Ã£ÂÂ®Ã¦ÂÂÃ§Â¨Â¿Ã£ÂÂ¨Ã£ÂÂÃ£ÂÂ¦Ã¨ÂªÂÃ¨Â­ÂÃ£ÂÂÃ£ÂÂ¾Ã£ÂÂÃ£ÂÂ';
    detected.textContent = platform;
  };
  urlInput.focus();
}
function closeSnsEmbedModal() {
  document.getElementById('snsEmbedModal').style.display = 'none';
}
function confirmSnsEmbed() {
  const url = document.getElementById('snsEmbedUrl').value.trim();
  if (!url) return;
  if (!url.includes('twitter.com') && !url.includes('x.com') && !url.includes('instagram.com') && !url.includes('tiktok.com')) {
    alert('X (Twitter) / Instagram / TikTokÃ£ÂÂ®URLÃ£ÂÂÃ¥ÂÂ¥Ã¥ÂÂÃ£ÂÂÃ£ÂÂ¦Ã£ÂÂÃ£ÂÂ Ã£ÂÂÃ£ÂÂ');
    return;
  }
  const chip = createEmbedChip('tweet', url, url);
  insertNodeAtSavedRange(chip);
  closeSnsEmbedModal();
}

// ============================================================
// Ã£ÂÂªÃ£ÂÂ³Ã£ÂÂ¯Ã¦ÂÂ¿Ã¥ÂÂ¥Ã£ÂÂ¢Ã£ÂÂ¼Ã£ÂÂÃ£ÂÂ«
// ============================================================
function showLinkModal(url) {
  saveBodyCursorRange();
  const modal = document.getElementById('linkInsertModal');
  document.getElementById('linkModalUrl').value = url || '';
  document.getElementById('linkModalText').value = '';
  modal.style.display = 'flex';
}

function closeLinkModal() {
  document.getElementById('linkInsertModal').style.display = 'none';
}

function confirmLinkInsert() {
  const url = document.getElementById('linkModalUrl').value.trim();
  const text = document.getElementById('linkModalText').value.trim();
  if (!url) return;
  const rawLine = `<a href="${url}" target="_blank" style="color:#C9082A;font-weight:700;">${text || url}</a>`;
  const chip = createEmbedChip('link', rawLine, text || url);
  insertNodeAtSavedRange(chip);
  closeLinkModal();
}
