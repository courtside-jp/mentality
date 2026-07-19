(function() {
  var FB_ADS = 'https://mentality-nba-default-rtdb.firebaseio.com/ads';

  window.loadAds = async function() {
    try {
      var res = await fetch(FB_ADS + '.json');
      var data = await res.json();
      window._allAds = data ? Object.entries(data).map(function(e) { return Object.assign({id: e[0]}, e[1]); }) : [];
    } catch(e) { window._allAds = []; }
  };

  window.renderAdBanner = function(containerId) {
    var container = document.getElementById(containerId);
    if (!container) return;
    var ads = window._allAds || [];
    var active = ads.filter(function(a) { return a.active !== false; });
    if (!active.length) { container.innerHTML = ''; return; }
    var ad = active[Math.floor(Math.random() * active.length)];
    container.innerHTML =
      '<div style="margin:16px 0;border:0.5px solid #eee;border-radius:12px;overflow:hidden;">'
      + '<div style="background:#f5f5f5;padding:4px 12px;border-bottom:0.5px solid #eee;"><span style="font-size:10px;color:#999;">PR</span></div>'
      + '<a href="' + ad.link + '" target="_blank" rel="noopener sponsored" style="display:flex;align-items:center;gap:12px;padding:12px;text-decoration:none;background:#fff;">'
      + (ad.img
        ? '<img src="' + ad.img + '" style="width:64px;height:64px;object-fit:cover;border-radius:8px;flex-shrink:0;" alt="">'
        : '<div style="width:64px;height:64px;border-radius:8px;background:#f0f0f0;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:11px;color:#999;font-weight:700;">PR</div>')
      + '<div style="flex:1;min-width:0;">'
      + '<div style="font-size:13px;font-weight:700;color:#111;margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + (ad.title || '') + '</div>'
      + (ad.desc ? '<div style="font-size:11px;color:#666;margin-bottom:5px;">' + ad.desc + '</div>' : '')
      + '<span style="font-size:11px;color:#C9082A;font-weight:700;">' + (ad.cta || '詳しくはこちら →') + '</span>'
      + '</div></a></div>';
  };

  window.refreshAllAdBanners = async function() {
    await window.loadAds();
    ['adBannerSneaker', 'adBannerItem', 'adBannerArticle'].forEach(function(id) { window.renderAdBanner(id); });
  };

  window.loadAdminAds = async function() {
    await window.loadAds();
    var list = document.getElementById('adminAdList');
    if (!list) return;
    var ads = window._allAds || [];
    if (!ads.length) { list.innerHTML = '<div style="text-align:center;color:#999;padding:20px;font-size:13px;">広告なし</div>'; return; }
    list.innerHTML = ads.map(function(a) {
      return '<div style="border:1px solid #eee;border-radius:10px;padding:10px 12px;margin-bottom:8px;display:flex;align-items:center;gap:10px;' + (a.active === false ? 'opacity:0.5' : '') + '">'
        + (a.img ? '<img src="' + a.img + '" style="width:44px;height:44px;object-fit:cover;border-radius:8px;flex-shrink:0;">' : '<div style="width:44px;height:44px;border-radius:8px;background:#f0f0f0;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:11px;color:#999;">PR</div>')
        + '<div style="flex:1;min-width:0;">'
        + '<div style="font-size:12px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + (a.title || '(タイトルなし)') + '</div>'
        + '<div style="font-size:10px;color:#999;">' + (a.active === false ? '停止中' : '表示中') + '</div>'
        + '</div>'
        + '<div style="display:flex;gap:6px;flex-shrink:0;">'
        + '<button onclick="editAd(\'' + a.id + '\')" style="padding:5px 10px;border:1px solid #ddd;border-radius:6px;font-size:11px;background:#fff;cursor:pointer;">編集</button>'
        + '<button onclick="toggleAd(\'' + a.id + '\',' + (a.active === false) + ')" style="padding:5px 10px;border:1px solid #ddd;border-radius:6px;font-size:11px;background:#fff;cursor:pointer;color:' + (a.active === false ? '#0a7c3e' : '#C9082A') + ';">' + (a.active === false ? '再開' : '停止') + '</button>'
        + '<button onclick="deleteAd(\'' + a.id + '\')" style="padding:5px 10px;border:1px solid #ddd;border-radius:6px;font-size:11px;background:#fff;cursor:pointer;">削除</button>'
        + '</div></div>';
    }).join('');
  };

  window.openNewAd = function() {
    document.getElementById('adForm').style.display = 'block';
    ['adEditId', 'adTitle', 'adDesc', 'adCta', 'adImg', 'adLink'].forEach(function(id) { document.getElementById(id).value = ''; });
    document.getElementById('adSubmitBtn').textContent = '保存する';
  };

  window.cancelAdEdit = function() { document.getElementById('adForm').style.display = 'none'; };

  window.submitAd = async function() {
    var title = document.getElementById('adTitle').value.trim();
    var link  = document.getElementById('adLink').value.trim();
    if (!title || !link) { alert('タイトルとリンクURLは必須です'); return; }
    var btn = document.getElementById('adSubmitBtn');
    btn.textContent = '保存中...'; btn.disabled = true;
    var payload = {
      title: title,
      desc:  document.getElementById('adDesc').value.trim(),
      cta:   document.getElementById('adCta').value.trim(),
      img:   document.getElementById('adImg').value.trim(),
      link:  link, active: true, ts: Date.now()
    };
    var editId = document.getElementById('adEditId').value;
    try {
      if (editId) {
        await fetch(FB_ADS + '/' + editId + '.json', { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) });
      } else {
        await fetch(FB_ADS + '.json', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) });
      }
      document.getElementById('adForm').style.display = 'none';
      window.loadAdminAds();
    } catch(e) { alert('保存に失敗しました'); }
    btn.textContent = '保存する'; btn.disabled = false;
  };

  window.editAd = async function(id) {
    var res = await fetch(FB_ADS + '/' + id + '.json');
    var d = await res.json();
    document.getElementById('adForm').style.display = 'block';
    document.getElementById('adEditId').value = id;
    document.getElementById('adTitle').value = d.title || '';
    document.getElementById('adDesc').value  = d.desc  || '';
    document.getElementById('adCta').value   = d.cta   || '';
    document.getElementById('adImg').value   = d.img   || '';
    document.getElementById('adLink').value  = d.link  || '';
    document.getElementById('adSubmitBtn').textContent = '上書き保存';
  };

  window.toggleAd = async function(id, currentlyInactive) {
    await fetch(FB_ADS + '/' + id + '.json', { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ active: currentlyInactive }) });
    window.loadAdminAds();
  };

  window.deleteAd = async function(id) {
    if (!confirm('この広告を削除しますか？')) return;
    await fetch(FB_ADS + '/' + id + '.json', { method: 'DELETE' });
    window.loadAdminAds();
  };
})();


// === バナー広告管理 ===
async function loadAdminBanners() {
  const wrap = document.getElementById('adminAdList');
  if (!wrap) return;
  const res = await fetch('https://mentality-nba-default-rtdb.firebaseio.com/ads.json');
  const data = await res.json();
  if (!data) { wrap.innerHTML = '<div style="color:#999;font-size:12px;padding:10px;">広告なし</div>'; return; }
  const all = Object.entries(data).filter(([,a]) => a.type === 'banner').sort((a,b) => (b[1].ts||0)-(a[1].ts||0));
  const topAds = all.filter(([,a]) => a.location === '上部バナー');
  const botAds = all.filter(([,a]) => a.location !== '上部バナー');

  function renderCard([id, a]) {
    return `<div style="background:#f9f9f9;border:1px solid #eee;border-radius:10px;padding:10px;margin-bottom:8px;">
      <div style="display:flex;align-items:center;gap:8px;">
        ${a.img ? `<img src="${a.img}" style="width:40px;height:28px;object-fit:contain;border-radius:4px;background:#000;flex-shrink:0;">` : '<div style="width:40px;height:28px;background:#eee;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:9px;color:#999;flex-shrink:0;">画像なし</div>'}
        <div style="flex:1;overflow:hidden;min-width:0;">
          <div style="font-size:12px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${a.title||a.text||''}</div>
          <div style="font-size:10px;color:#999;">${a.active?'表示中':'停止中'}</div>
        </div>
        <div style="display:flex;gap:4px;flex-shrink:0;">
          <button onclick="toggleBannerAd('${id}', ${!a.active})" style="background:${a.active?'#e63946':'#ccc'};color:#fff;border:none;border-radius:6px;padding:3px 8px;font-size:10px;cursor:pointer;">${a.active?'停止':'開始'}</button>
          <button onclick="editBannerAd('${id}')" style="background:#f3f3f3;border:1px solid #ddd;border-radius:6px;padding:3px 8px;font-size:10px;cursor:pointer;">編集</button>
          <button onclick="deleteBannerAd('${id}')" style="background:#fff0f0;border:1px solid #fcc;color:#e63946;border-radius:6px;padding:3px 8px;font-size:10px;cursor:pointer;">削除</button>
        </div>
      </div>
    </div>`;
  }

  wrap.innerHTML = `
    <div style="margin-top:14px;">
      <div style="font-size:11px;font-weight:700;color:#555;padding:6px 10px;background:#f0f4ff;border-radius:6px;margin-bottom:8px;">📺 上部バー（動画配信）</div>
      ${topAds.length ? topAds.map(renderCard).join('') : '<div style="color:#999;font-size:12px;padding:8px;">なし</div>'}
      <div style="font-size:11px;font-weight:700;color:#555;padding:6px 10px;background:#fff3f0;border-radius:6px;margin:10px 0 8px;">🛒 下部バー（商品広告）</div>
      ${botAds.length ? botAds.map(renderCard).join('') : '<div style="color:#999;font-size:12px;padding:8px;">なし</div>'}
    </div>
    <!-- バナー追加・編集フォーム（画面中央のモーダル表示） -->
    <div id="bannerForm" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:500;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;">
      <div style="background:#fff;border-radius:14px;padding:18px;width:100%;max-width:420px;max-height:88vh;overflow-y:auto;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
          <div id="bannerFormTitle" style="font-size:15px;font-weight:700;color:#111;">広告を編集</div>
          <button onclick="document.getElementById('bannerForm').style.display='none'" style="background:#f3f3f3;border:none;border-radius:50%;width:28px;height:28px;font-size:14px;cursor:pointer;color:#666;">×</button>
        </div>
        <input type="hidden" id="bannerEditId">
        <div style="margin-bottom:8px;"><label style="font-size:10px;color:#999;font-weight:700;display:block;margin-bottom:4px;">管理名</label><input id="bannerTitle" type="text" placeholder="例：Amazon バッシュ広告" style="width:100%;padding:8px 10px;border:1px solid #eee;border-radius:8px;font-size:12px;box-sizing:border-box;"></div>
        <div style="margin-bottom:8px;"><label style="font-size:10px;color:#999;font-weight:700;display:block;margin-bottom:4px;">表示テキスト</label><input id="bannerText" type="text" placeholder="例：🛒 Amazonでバッシュをチェック →" style="width:100%;padding:8px 10px;border:1px solid #eee;border-radius:8px;font-size:12px;box-sizing:border-box;"></div>
        <div style="margin-bottom:8px;"><label style="font-size:10px;color:#999;font-weight:700;display:block;margin-bottom:4px;">リンク先URL</label><input id="bannerLink" type="url" placeholder="https://..." style="width:100%;padding:8px 10px;border:1px solid #eee;border-radius:8px;font-size:12px;box-sizing:border-box;"></div>
        <div style="margin-bottom:8px;"><label style="font-size:10px;color:#999;font-weight:700;display:block;margin-bottom:4px;">ラベル</label><input id="bannerLabel" type="text" placeholder="例：Amazon / 楽天" style="width:100%;padding:8px 10px;border:1px solid #eee;border-radius:8px;font-size:12px;box-sizing:border-box;"></div>
        <div style="margin-bottom:8px;"><label style="font-size:10px;color:#999;font-weight:700;display:block;margin-bottom:4px;">🖼 PR画像URL（任意）</label><input id="bannerImg" type="url" placeholder="https://...画像URL" style="width:100%;padding:8px 10px;border:1px solid #eee;border-radius:8px;font-size:12px;box-sizing:border-box;"></div>
        <div style="margin-bottom:12px;"><label style="font-size:10px;color:#999;font-weight:700;display:block;margin-bottom:4px;">📍 表示場所</label><select id="bannerLocation" style="width:100%;padding:8px 10px;border:1px solid #eee;border-radius:8px;font-size:12px;box-sizing:border-box;"><option value="上部バナー">上部バー（動画配信）</option><option value="下部バナー">下部バー（商品広告）</option></select></div>
        <div style="display:flex;gap:8px;">
          <button onclick="submitBanner()" style="flex:1;background:#e63946;color:#fff;border:none;border-radius:8px;padding:10px;font-size:12px;font-weight:700;cursor:pointer;">保存</button>
          <button onclick="document.getElementById('bannerForm').style.display='none'" style="flex:1;background:#f3f3f3;border:1px solid #ddd;border-radius:8px;padding:10px;font-size:12px;cursor:pointer;">キャンセル</button>
        </div>
      </div>
    </div>
  `;
}
async function toggleBannerAd(id, active) {
  await fetch(`https://mentality-nba-default-rtdb.firebaseio.com/ads/${id}.json`, {
    method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ active })
  });
  loadAdminBanners();
}

async function deleteBannerAd(id) {
  if (!confirm('このバナーを削除しますか？')) return;
  await fetch(`https://mentality-nba-default-rtdb.firebaseio.com/ads/${id}.json`, { method: 'DELETE' });
  loadAdminBanners();
}

function editBannerAd(id) {
  fetch(`https://mentality-nba-default-rtdb.firebaseio.com/ads/${id}.json`)
    .then(r => r.json()).then(a => {
      document.getElementById('bannerEditId').value = id;
      document.getElementById('bannerTitle').value = a.title || '';
      document.getElementById('bannerText').value = a.text || '';
      document.getElementById('bannerLink').value = a.link || '';
      document.getElementById('bannerLabel').value = a.label || '';
      const locEl = document.getElementById('bannerLocation');
      if(locEl) locEl.value = a.location || '下部バナー';
      const imgEl = document.getElementById('bannerImg');
      if(imgEl) imgEl.value = a.img || '';
      const titleEl = document.getElementById('bannerFormTitle');
      if(titleEl) titleEl.textContent = '広告を編集';
      document.getElementById('bannerForm').style.display = 'flex';
    });
}

function openNewBanner() {
  document.getElementById('bannerEditId').value = '';
  document.getElementById('bannerTitle').value = '';
  document.getElementById('bannerText').value = '';
  document.getElementById('bannerLink').value = '';
  document.getElementById('bannerLabel').value = '';
  const imgEl = document.getElementById('bannerImg');
  if (imgEl) imgEl.value = '';
  const titleEl = document.getElementById('bannerFormTitle');
  if (titleEl) titleEl.textContent = '新しい広告を追加';
  document.getElementById('bannerForm').style.display = 'flex';
}

async function submitBanner() {
  const id = document.getElementById('bannerEditId').value;
  const data = {
    title: document.getElementById('bannerTitle').value,
    text: document.getElementById('bannerText').value,
    link: document.getElementById('bannerLink').value,
    label: document.getElementById('bannerLabel').value,
    img: document.getElementById('bannerImg')?.value || '',
    location: document.getElementById('bannerLocation')?.value || '下部バナー',
    type: 'banner', active: true, ts: Date.now()
  };
  if (id) {
    await fetch(`https://mentality-nba-default-rtdb.firebaseio.com/ads/${id}.json`, {
      method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify(data)
    });
  } else {
    await fetch('https://mentality-nba-default-rtdb.firebaseio.com/ads.json', {
      method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(data)
    });
  }
  document.getElementById('bannerForm').style.display = 'none';
  loadAdminBanners();
  alert(id ? '更新しました' : '追加しました');
}
