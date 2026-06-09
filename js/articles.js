// articles.js — 記事投稿・一覧・詳細

const FB_ARTICLES = `${FB_URL}/articles`;
const ADMIN_PASSWORD = '3579';

// ============================================================
// 本文レンダリング（URL自動判別）
// ============================================================
function renderBody(body) {
  if (!body) return '';
  return body.split('\n').map(line => {
    const t = line.trim();
    const yt = t.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (yt) return '<div style="margin:.8rem 0;"><iframe width="100%" height="200" src="https://www.youtube.com/embed/' + yt[1] + '" frameborder="0" allowfullscreen style="border-radius:10px;"></iframe></div>';
    if (t.includes('tiktok.com')) return '<div style="margin:.8rem 0;text-align:center;"><blockquote class="tiktok-embed" cite="' + t + '" data-video-id="' + (t.match(/video\/(\d+)/)||[])[1] + '"><a href="' + t + '">TikTok動画</a></blockquote><script async src="https://www.tiktok.com/embed.js"><\/script></div>';
    if (t.includes('instagram.com')) return '<div style="margin:.8rem 0;"><blockquote class="instagram-media" data-instgrm-permalink="' + t + '"><a href="' + t + '">Instagram投稿</a></blockquote><script async src="//www.instagram.com/embed.js"><\/script></div>';
    if (t.includes('twitter.com') || t.includes('x.com')) return '<div style="margin:.8rem 0;"><blockquote class="twitter-tweet"><a href="' + t + '">ツイート</a></blockquote><script async src="https://platform.twitter.com/widgets.js"><\/script></div>';
    if (t.match(/\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i)) return '<div style="margin:.8rem 0;"><img src="' + t + '" style="width:100%;border-radius:10px;" onerror="this.style.display=\'none\'"></div>';
    const productMatch = t.match(/\[product name="([^"]*)" price="([^"]*)" url="([^"]*)"\]/);
    if (productMatch) {
      const [, pName, pPrice, pUrl] = productMatch;
      return '<a href="' + pUrl + '" target="_blank" style="display:block;text-decoration:none;margin:.8rem 0;background:var(--bg3);border:1px solid var(--bd);border-radius:12px;padding:.8rem;"><div style="display:flex;align-items:center;gap:.6rem;"><div style="font-size:1.5rem;">🛒</div><div style="flex:1;min-width:0;"><div style="font-size:.82rem;font-weight:700;color:var(--tx);margin-bottom:.2rem;">' + pName + '</div>' + (pPrice ? '<div style="font-size:.85rem;font-weight:700;color:var(--or);">' + pPrice + '</div>' : '') + '</div><div style="background:var(--or);color:#fff;padding:.4rem .8rem;border-radius:8px;font-size:.72rem;font-weight:700;flex-shrink:0;">購入する →</div></div></a>';
    }
    return t ? '<p style="margin:.4rem 0;">' + t + '</p>' : '<br>';
  }).join('');
}

// ============================================================
// 画像アップロード（ImgBB）
// ============================================================
async function uploadArticleImage(input) {
  const file = input.files[0];
  if (!file) return;
  
  const btn = input.parentElement;
  btn.textContent = '⏳ アップロード中...';
  
  try {
    const base64 = await new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result.split(',')[1]);
      r.onerror = rej;
      r.readAsDataURL(file);
    });
    
    const form = new FormData();
    form.append('image', base64);
    
    const resp = await fetch('https://api.imgbb.com/1/upload?key=7a3e4b2c1d5f6e8a9b0c3d4e5f6a7b8c', {
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
      btn.innerHTML = '📷 画像選択<input type="file" accept="image/*" onchange="uploadArticleImage(this)" style="display:none;">';
    } else {
      throw new Error('アップロード失敗');
    }
  } catch(e) {
    // ImgBBが失敗したらbase64をそのまま使う
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
    btn.innerHTML = '📷 画像選択<input type="file" accept="image/*" onchange="uploadArticleImage(this)" style="display:none;">';
  }
}

// ============================================================
// 記事一覧を表示
// ============================================================
async function loadArticles() {
  const wrap = document.getElementById('articlesWrap');
  if (!wrap) return;
  wrap.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--tx3);font-size:.75rem;">記事を取得中...</div>';

  try {
    const res = await fetch(FB_ARTICLES + '.json');
    const data = await res.json();
    // 広告取得
    let articleAds = [];
    try {
      const ar = await fetch(FB_URL + '/adslots.json');
      const ad = await ar.json() || {};
      articleAds = ['articles_1'].map(k => ad[k]).filter(a => a && a.url && a.enabled !== false);
    } catch(e) {}

    if (!data) {
      wrap.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--tx3);">まだ記事がありません</div>';
      return;
    }

    const articles = Object.entries(data).map(([id, a]) => ({id, ...a})).filter(a => !a.archived).sort((a,b) => b.ts - a.ts);
    console.log('記事数:', articles.length, articles.map(a=>a.title));
    if (window._directArticleId) {
      const target = articles.find(a => a.id === window._directArticleId);
      if (target) {
        window._directArticleId = null;
        setTimeout(() => openArticle(target.id), 300);
        return;
      }
    }

    wrap.innerHTML = articles.map(a => '<div onclick="openArticle(\'' + a.id + '\')" style="background:var(--card);border:1px solid var(--bd);border-radius:10px;padding:.8rem;margin-bottom:.6rem;cursor:pointer;">' +
      '<div style="width:100%;height:160px;border-radius:8px;margin-bottom:.6rem;overflow:hidden;background:#111;display:flex;align-items:center;justify-content:center;">' +
      (a.img ? '<img src="' + a.img + '" style="width:100%;height:100%;object-fit:cover;">' : '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#111;font-family:Bebas Neue,sans-serif;font-size:28px;color:#C9082A;letter-spacing:2px;">COURTSIDE</div>') +
      '</div>' +
      '<div style="display:flex;gap:.4rem;align-items:center;margin-bottom:.35rem;">' +
      '<span style="font-size:.55rem;background:var(--or);color:#fff;padding:.1rem .4rem;border-radius:6px;">' + (a.category||'NBA') + '</span>' +
      '<span style="font-size:.55rem;color:var(--tx3);">' + new Date(a.ts).toLocaleDateString('ja-JP') + '</span>' +
      '</div>' +
      '<div style="font-size:.85rem;font-weight:700;color:var(--tx);margin-bottom:.3rem;line-height:1.4;">' + a.title + '</div>' +
      '<div style="font-size:.7rem;color:var(--tx3);line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">' + a.body + '</div>' +
      '</div>'
    ).join('') + (articleAds[0] ? `<a href="${articleAds[0].url}" target="_blank" style="display:block;text-decoration:none;margin:.5rem 0;background:var(--card);border:1px solid var(--bd);border-radius:10px;padding:.7rem .8rem;"><div style="display:flex;align-items:center;gap:.5rem;">${articleAds[0].img ? `<img src="${articleAds[0].img}" style="width:48px;height:48px;border-radius:8px;object-fit:cover;flex-shrink:0;">` : ''}<div style="flex:1;min-width:0;"><span style="font-size:.5rem;background:rgba(255,90,0,.15);color:var(--or);padding:.1rem .4rem;border-radius:10px;font-weight:700;">PR</span><div style="font-size:.72rem;font-weight:700;color:var(--tx);">${articleAds[0].title}</div></div><div style="color:var(--tx3);font-size:.8rem;">›</div></div></a>` : '');
  } catch(e) {
    wrap.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--tx3);">取得に失敗しました</div>';
  }
}

// ============================================================
// 記事詳細モーダル
// ============================================================
async function openArticle(id) {
  const modal = document.getElementById('articleModal');
  const body = document.getElementById('articleModalBody');
  if (!modal || !body) return;
  modal.style.display = 'block';
  body.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--tx3);">読み込み中...</div>';

  try {
    const res = await fetch(FB_ARTICLES + '/' + id + '.json');
    const a = await res.json();
    body.innerHTML = '<div style="padding:1rem;">' +
      '<button onclick="closeArticleModal()" style="display:block;background:var(--bg3);border:1px solid var(--bd);color:var(--tx);padding:.5rem 1rem;border-radius:8px;font-size:.8rem;cursor:pointer;margin-bottom:1.2rem;">← 戻る</button>' +
      (a.img ? '<img src="' + a.img + '" style="width:100%;border-radius:10px;margin-bottom:1rem;" onerror="this.style.display=\'none\'">' : '') +
      '<div style="display:flex;gap:.4rem;align-items:center;margin-bottom:.5rem;">' +
      '<span style="font-size:.58rem;background:var(--or);color:#fff;padding:.15rem .5rem;border-radius:6px;">' + (a.category||'NBA') + '</span>' +
      '<span style="font-size:.58rem;color:var(--tx3);">' + new Date(a.ts).toLocaleDateString('ja-JP') + '</span>' +
      '</div>' +
      '<div style="font-size:1rem;font-weight:700;color:var(--tx);line-height:1.5;margin-bottom:.8rem;">' + a.title + '</div>' +
      '<div style="font-size:.78rem;color:var(--tx2);line-height:1.8;">' + renderBody(a.body) + '</div>' +
      '<div style="margin-top:1rem;padding-top:.8rem;border-top:1px solid var(--bd);text-align:center;">' +
      '<a href="' + 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(a.title + ' #COURTSIDE #NBA https://courtside-jp.github.io/mentality/?article=' + id) + '" target="_blank" style="display:inline-flex;align-items:center;gap:.4rem;background:#000;color:#fff;padding:.6rem 1.2rem;border-radius:10px;font-size:.8rem;font-weight:700;text-decoration:none;">X この記事をシェア</a></div>' +
      '</div>';
  } catch(e) {
    body.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--tx3);">取得に失敗しました</div>';
  }
}

function closeArticleModal() {
  const modal = document.getElementById('articleModal');
  if (modal) modal.style.display = 'none';
}

// ============================================================
// 管理者ページ
// ============================================================
function openAdminPage() {
  const pw = prompt('パスワードを入力してください');
  if (pw !== ADMIN_PASSWORD) { alert('パスワードが違います'); return; }
  const m = document.getElementById('adminSelectModal'); if (m) m.style.display = 'block';
}

function closeAdminModal() {
  const modal = document.getElementById('adminModal');
  if (modal) modal.style.display = 'none';
}

async function submitArticle() {
  const title    = document.getElementById('adminTitle').value.trim();
  const body     = document.getElementById('adminBody').value.trim();
  const img      = document.getElementById('adminImg').value.trim();
  const category = document.getElementById('adminCategory').value;

  if (!title || !body) { alert('タイトルと本文は必須です'); return; }

  const btn = document.getElementById('adminSubmitBtn');
  btn.textContent = '投稿中...';
  btn.disabled = true;

  const editId = document.getElementById('adminEditId')?.value;
  try {
    if (editId) {
      await fetch(`${FB_ARTICLES}/${editId}.json`, {
        method: 'PATCH',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ title, body, img, category })
      });
      alert('更新しました！');
      document.getElementById('adminEditId').value = '';
      const btn = document.getElementById('adminSubmitBtn');
      if (btn) btn.textContent = '投稿する';
    } else {
      await fetch(FB_ARTICLES + '.json', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ title, body, img, category, ts: Date.now() })
      });
      alert('投稿しました！');
    }
    document.getElementById('adminTitle').value = '';
    document.getElementById('adminBody').value = '';
    document.getElementById('adminImg').value = '';
    closeAdminModal();
    loadArticles();
  } catch(e) {
    alert('投稿に失敗しました');
  } finally {
    btn.textContent = '投稿する';
    btn.disabled = false;
  }
}

// ============================================================
// エディタ補助関数
// ============================================================
function insertToBody(type) {
  const textarea = document.getElementById('adminBody');
  const prompts = {
    image: null,
    youtube: 'YouTubeのURLを入力してください',
    tiktok: 'TikTokのURLを入力してください',
    instagram: 'InstagramのURLを入力してください',
    twitter: 'X(Twitter)のURLを入力してください',
    quote: null,
  };
  if (type === 'quote') {
    const source = prompt('引用元を入力してください（例：@StephenCurry30 / X）');
    if (!source) return;
    const template = '\n[画像をここに挿入]\n引用元：' + source + '\n';
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
        if (btn) btn.textContent = 'アップロード中...';
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
          alert('アップロードに失敗しました');
        }
      } catch(e) {
        alert('エラーが発生しました');
      } finally {
        const btn = document.querySelector('[onclick*="insertToBody(\'image\')"]');
        if (btn) btn.textContent = '画像';
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
}

// ============================================================
// 広告管理
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
    const pw = prompt('パスワードを入力してください');
    if (pw !== ADMIN_PASSWORD) { alert('パスワードが違います'); return; }
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
  wrap.innerHTML = '<div style="text-align:center;padding:1rem;color:var(--tx3);font-size:.75rem;">読み込み中...</div>';
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
        <input id="ad_title_${slotId}" type="text" placeholder="タイトル" value="${slot.title||''}" style="width:100%;padding:.4rem;border-radius:6px;border:1px solid var(--bd);background:var(--bg);color:var(--tx);font-size:.75rem;box-sizing:border-box;margin-bottom:.4rem;">
        <input id="ad_url_${slotId}" type="text" placeholder="リンクURL" value="${slot.url||''}" style="width:100%;padding:.4rem;border-radius:6px;border:1px solid var(--bd);background:var(--bg);color:var(--tx);font-size:.75rem;box-sizing:border-box;margin-bottom:.4rem;">
        <input id="ad_img_${slotId}" type="text" placeholder="画像URL（任意）" value="${slot.img||''}" style="width:100%;padding:.4rem;border-radius:6px;border:1px solid var(--bd);background:var(--bg);color:var(--tx);font-size:.75rem;box-sizing:border-box;margin-bottom:.5rem;">
        <button onclick="saveSlot('${slotId}')" style="width:100%;padding:.5rem;background:var(--or);border:none;color:#fff;border-radius:8px;font-size:.75rem;font-weight:700;cursor:pointer;">保存する</button>
      </div>
    `).join('');
  } catch(e) {
    wrap.innerHTML = '<div style="text-align:center;padding:1rem;color:var(--tx3);">取得失敗</div>';
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
  alert('保存しました！');
}


async function submitAd() {
  const title = document.getElementById('adTitle').value.trim();
  const desc  = document.getElementById('adDesc').value.trim();
  const price = document.getElementById('adPrice').value.trim();
  const tag   = document.getElementById('adTag').value.trim();
  const url   = document.getElementById('adUrl').value.trim();
  const icon  = document.getElementById('adIcon').value.trim();
  const color = document.getElementById('adColor').value;

  const places = []; if (document.getElementById('adPlaceSchedule')?.checked) places.push('schedule'); if (document.getElementById('adPlaceNews')?.checked) places.push('news'); if (document.getElementById('adPlaceArticles')?.checked) places.push('articles'); if (document.getElementById('adPlacePlayers')?.checked) places.push('players'); if (!title || !url) { alert('タイトルとURLは必須です'); return; }

  const btn = document.getElementById('adSubmitBtn');
  btn.textContent = '保存中...'; btn.disabled = true;

  await fetch(FB_ADS + '.json', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ title, desc, price, tag, url, icon, color, places, ts: Date.now() })
  });

  alert('広告を追加しました！');
  document.getElementById('adTitle').value = '';
  document.getElementById('adDesc').value = '';
  document.getElementById('adPrice').value = '';
  document.getElementById('adTag').value = '';
  document.getElementById('adUrl').value = '';
  document.getElementById('adIcon').value = '';
  btn.textContent = '追加する'; btn.disabled = false;
  renderAdManager();
}

async function deleteAd(id) {
  if (!confirm('この広告を削除しますか？')) return;
  await fetch(`${FB_ADS}/${id}.json`, { method: 'DELETE' });
  renderAdManager();
}
// cache bust 2026年 5月29日 金曜日 15時10分29秒 JST

// 管理者用記事一覧
async function loadAdminArticles() {
  const wrap = document.getElementById('adminArticleList');
  if (!wrap) return;
  wrap.innerHTML = '<div style="font-size:.7rem;color:var(--tx3);">読み込み中...</div>';
  try {
    const res = await fetch(FB_ARTICLES + '.json');
    const data = await res.json();
    if (!data) { wrap.innerHTML = '<div style="font-size:.7rem;color:var(--tx3);">記事がありません</div>'; return; }
    const articles = Object.entries(data).map(([id,a]) => ({id,...a})).sort((a,b) => b.ts - a.ts);
    wrap.innerHTML = articles.map(a => `
      <div style="background:var(--bg3);border-radius:8px;padding:.6rem;margin-bottom:.4rem;display:flex;align-items:center;gap:.5rem;">
        <div style="flex:1;min-width:0;">
          <div style="font-size:.72rem;font-weight:700;color:var(--tx);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${a.title}</div>
          <div style="font-size:.58rem;color:var(--tx3);">${a.category||'NBA'} · ${new Date(a.ts).toLocaleDateString('ja-JP')}</div>
        </div>
        <button onclick="editArticle('${a.id}')" style="background:rgba(0,150,255,.15);border:none;color:#0096ff;padding:.3rem .5rem;border-radius:6px;font-size:.65rem;cursor:pointer;flex-shrink:0;margin-right:.3rem;">編集</button><button onclick="deleteArticle('${a.id}')" style="background:rgba(255,50,50,.15);border:none;color:#ff5555;padding:.3rem .5rem;border-radius:6px;font-size:.65rem;cursor:pointer;flex-shrink:0;">削除</button>
      </div>
    `).join('');
  } catch(e) {
    wrap.innerHTML = '<div style="font-size:.7rem;color:var(--tx3);">取得失敗</div>';
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
  if (!confirm('この記事を削除しますか？')) return;
  await fetch(`${FB_ARTICLES}/${id}.json`, { method: 'DELETE' });
  loadAdminArticles();
  loadArticles();
}

// 商品リンク挿入
function insertProductLink(targetId) {
  const name  = prompt('商品名を入力してください');
  if (!name) return;
  const price = prompt('価格を入力してください（例：¥22,000）') || '';
  const url   = prompt('購入URLを入力してください');
  if (!url) return;

  const card = `\n[product name="${name}" price="${price}" url="${url}"]\n`;
  const ta = document.getElementById(targetId);
  if (!ta) return;
  const pos = ta.selectionStart;
  ta.value = ta.value.slice(0, pos) + card + ta.value.slice(pos);
  ta.dispatchEvent(new Event('input'));
}

// 下書き保存
const FB_DRAFTS = `${FB_URL}/drafts`;

async function saveDraft() {
  const title    = document.getElementById('adminTitle').value.trim();
  const body     = document.getElementById('adminBody').value.trim();
  const category = document.getElementById('adminCategory').value;
  const thumb    = document.getElementById('adminThumb')?.value.trim() || '';

  if (!title && !body) { alert('タイトルか本文を入力してください'); return; }

  await fetch(FB_DRAFTS + '.json', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ title, body, category, thumb, ts: Date.now() })
  });

  alert('下書きを保存しました！');
  loadDrafts();
}

async function loadDrafts() {
  const wrap = document.getElementById('draftList');
  if (!wrap) return;
  try {
    const res = await fetch(FB_DRAFTS + '.json');
    const data = await res.json();
    if (!data) { wrap.innerHTML = '<div style="font-size:.7rem;color:var(--tx3);">下書きがありません</div>'; return; }
    const drafts = Object.entries(data).map(([id,d]) => ({id,...d})).sort((a,b) => b.ts - a.ts);
    wrap.innerHTML = drafts.map(d => `
      <div style="background:var(--bg3);border-radius:8px;padding:.6rem;margin-bottom:.4rem;display:flex;align-items:center;gap:.5rem;">
        <div style="flex:1;min-width:0;">
          <div style="font-size:.72rem;font-weight:700;color:var(--tx);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${d.title || '無題'}</div>
          <div style="font-size:.58rem;color:var(--tx3);">${new Date(d.ts).toLocaleDateString('ja-JP')}</div>
        </div>
        <button onclick="loadDraft('${d.id}')" style="background:rgba(0,150,255,.15);border:none;color:#0096ff;padding:.3rem .5rem;border-radius:6px;font-size:.65rem;cursor:pointer;">編集</button>
        <button onclick="deleteDraft('${d.id}')" style="background:rgba(255,50,50,.15);border:none;color:#ff5555;padding:.3rem .5rem;border-radius:6px;font-size:.65rem;cursor:pointer;">削除</button>
      </div>
    `).join('');
  } catch(e) {
    wrap.innerHTML = '<div style="font-size:.7rem;color:var(--tx3);">取得失敗</div>';
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
  alert('下書きを読み込みました！編集後に投稿するか再保存してください。');
}

async function deleteDraft(id) {
  if (!confirm('この下書きを削除しますか？')) return;
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
    btn.textContent = 'アップロード中...';
    const formData = new FormData();
    formData.append('image', file);
    formData.append('key', '6b317240ded356635338f7ce9c45ec05');
    try {
      const res = await fetch('https://api.imgbb.com/1/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        document.getElementById('adminImg').value = data.data.url;
      } else {
        alert('アップロードに失敗しました');
      }
    } catch(e) {
      alert('エラーが発生しました');
    } finally {
      btn.textContent = '画像を選ぶ';
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

// URLパラメータで記事を直接開く
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
  const cat = document.getElementById('adminCategory');
  if (cat) cat.value = a.category || 'NBA';
  const editId = document.getElementById('adminEditId');
  if (editId) editId.value = id;
  updatePreview();
  document.getElementById('adminTitle').scrollIntoView({behavior:'smooth'});
  const submitBtn = document.getElementById('adminSubmitBtn');
  if (submitBtn) submitBtn.textContent = '上書き保存';
  const preview = document.getElementById('articlePreview');
  if (preview) preview.innerHTML = '';
  updatePreview();
}

// 管理画面：記事一覧読み込み
async function loadAdminArticles() {
  const list = document.getElementById('adminArticleList');
  if (!list) return;
  list.innerHTML = '<div style="text-align:center;padding:1rem;color:#999;font-size:12px;">読み込み中...</div>';
  try {
    const res = await fetch(FB_ARTICLES + '.json?orderBy="$key"&limitToLast=200');
    const data = await res.json();
    if (!data) { list.innerHTML = '<div style="text-align:center;padding:1rem;color:#999;">記事なし</div>'; return; }
    const articles = Object.entries(data).reverse();
    list.innerHTML = articles.map(([id, a]) => `
      <div style="background:#fff;border-bottom:1px solid #f0f0f0;padding:12px 14px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
          <div style="font-size:9px;color:#C9082A;font-weight:700;background:rgba(201,8,42,0.08);padding:2px 6px;border-radius:4px;">${a.category||'未分類'}</div>
          <div style="font-size:9px;color:#999;">${a.date||''}</div>
        </div>
        <div style="font-size:13px;font-weight:700;color:#000;line-height:1.4;margin-bottom:8px;">${a.title||'無題'}</div>
        <div style="display:flex;gap:6px;">
          <button onclick="editArticle('${id}')" style="flex:1;padding:6px;background:#f5f5f5;border:1px solid #eee;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;">編集</button>
          <button onclick="archiveArticle('${id}', ${a.archived ? 'false' : 'true'})" style="flex:1;padding:6px;background:${a.archived ? 'rgba(0,150,0,0.08)' : 'rgba(100,100,100,0.08)'};border:1px solid ${a.archived ? 'rgba(0,150,0,0.2)' : '#ddd'};border-radius:6px;font-size:11px;font-weight:700;color:${a.archived ? 'green' : '#666'};cursor:pointer;">${a.archived ? '公開に戻す' : 'アーカイブ'}</button>
          <button onclick="deleteArticle('${id}')" style="flex:1;padding:6px;background:rgba(201,8,42,0.08);border:1px solid rgba(201,8,42,0.2);border-radius:6px;font-size:11px;font-weight:700;color:#C9082A;cursor:pointer;">削除</button>
        </div>
      </div>
    `).join('');
  } catch(e) {
    list.innerHTML = '<div style="text-align:center;padding:1rem;color:#999;">取得失敗</div>';
  }
}

function openNewArticle() {
  document.getElementById('articleForm').style.display = 'block';
  document.getElementById('adminEditId').value = '';
  document.getElementById('adminTitle').value = '';
  document.getElementById('adminBody').value = '';
  document.getElementById('adminImg').value = '';
  document.getElementById('adminSubmitBtn').textContent = '投稿する';
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
  if (!confirm('削除しますか？')) return;
  await fetch(FB_ARTICLES + '/' + id + '.json', {method: 'DELETE'});
  loadAdminArticles();
}

async function editArticle(id) {
  const res = await fetch(FB_ARTICLES + '/' + id + '.json');
  const d = await res.json();
  document.getElementById('articleForm').style.display = 'block';
  document.getElementById('adminEditId').value = id;
  document.getElementById('adminTitle').value = d.title || '';
  document.getElementById('adminBody').value = d.body || '';
  document.getElementById('adminImg').value = d.img || '';
  document.getElementById('adminCategory').value = d.category || 'NBAファイナル';
  document.getElementById('adminSubmitBtn').textContent = '上書き保存';
}
