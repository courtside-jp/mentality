// search.js — legal・その他・初期化処理
// 読み込み順: data.js → utils.js → app.js → 各機能JS

// legal.js — 特定商取引法・プライバシーポリシー・利用規約・お問い合わせ
// ============================================================

const LEGAL_PAGES = {

  tokusho: {
    title: '特定商取引法に基づく表記',
    content: `
      <div style="margin-bottom:1.5rem;">
        <p style="font-size:.72rem;color:var(--tx3);margin-bottom:1rem;">
          特定商取引法に基づき、以下の事項を記載します。
        </p>

        <table style="width:100%;border-collapse:collapse;font-size:.78rem;">
          ${[
            ['販売業者', 'MENTALITY'],
            ['運営責任者', 'MENTALITY'],
            ['所在地', '諸事情により、請求があった場合は遅滞なく開示します'],
            ['電話番号', '諸事情により、請求があった場合は遅滞なく開示します'],
            ['メールアドレス', 'mentalitybrand0824@gmail.com'],
            ['サイトURL', 'https://reliable-kitsune-62166e.netlify.app'],
            ['販売価格', '各商品・サービスのページに記載'],
            ['支払方法', '各アフィリエイト先・広告主の規定に準じます'],
            ['商品の引渡時期', '各商品・サービスのページに記載'],
            ['返品・キャンセル', '各商品・サービスの規定に準じます'],
          ].map(([k, v]) => `
            <tr style="border-bottom:1px solid var(--bd);">
              <td style="padding:.65rem .5rem;color:var(--tx3);white-space:nowrap;vertical-align:top;width:38%;font-weight:600;">${k}</td>
              <td style="padding:.65rem .5rem;color:var(--tx);">${v}</td>
            </tr>
          `).join('')}
        </table>
      </div>
    `
  },

  privacy: {
    title: 'プライバシーポリシー',
    content: `
      <p style="margin-bottom:1rem;">MENTALITY（以下「当サイト」）は、ユーザーの個人情報の保護を重要と考え、以下のプライバシーポリシーを定めます。</p>

      <h3 style="font-size:.85rem;font-weight:700;color:var(--tx);margin:1.2rem 0 .4rem;">1. 収集する情報</h3>
      <p>当サイトでは、以下の情報を収集する場合があります。</p>
      <ul style="margin:.5rem 0 .5rem 1rem;line-height:2;">
        <li>アクセスログ（IPアドレス・ブラウザ情報）</li>
        <li>Cookieによる閲覧履歴</li>
        <li>チャット機能を利用する際のニックネーム</li>
      </ul>

      <h3 style="font-size:.85rem;font-weight:700;color:var(--tx);margin:1.2rem 0 .4rem;">2. 情報の利用目的</h3>
      <ul style="margin:.5rem 0 .5rem 1rem;line-height:2;">
        <li>サービスの提供・改善</li>
        <li>アクセス解析</li>
        <li>広告配信の最適化</li>
        <li>メールアドレス（任意）：サービスに関するお知らせの配信。第三者への提供は行いません。</li>
      </ul>

      <h3 style="font-size:.85rem;font-weight:700;color:var(--tx);margin:1.2rem 0 .4rem;">3. Google Analytics・広告について</h3>
      <p>当サイトはGoogle AnalyticsおよびGoogle AdSenseを使用しています。これらのサービスはCookieを使用してデータを収集します。詳細はGoogleのプライバシーポリシーをご確認ください。</p>

      <h3 style="font-size:.85rem;font-weight:700;color:var(--tx);margin:1.2rem 0 .4rem;">4. Amazonアソシエイトについて</h3>
      <p>当サイトはAmazon.co.jpを宣伝しAmazonアソシエイトとして適格販売により収入を得ています。</p>

      <h3 style="font-size:.85rem;font-weight:700;color:var(--tx);margin:1.2rem 0 .4rem;">5. 第三者への提供</h3>
      <p>法令に基づく場合を除き、収集した個人情報を第三者に提供することはありません。</p>

      <h3 style="font-size:.85rem;font-weight:700;color:var(--tx);margin:1.2rem 0 .4rem;">6. お問い合わせ</h3>
      <p>プライバシーポリシーに関するお問い合わせは以下までご連絡ください。<br>
      <a href="mailto:mentalitybrand0824@gmail.com" style="color:var(--or);">mentalitybrand0824@gmail.com</a></p>

      <p style="margin-top:1.2rem;color:var(--tx3);font-size:.72rem;">制定日：2026年5月</p>
    `
  },

  terms: {
    title: '利用規約',
    content: `
      <p style="margin-bottom:1rem;">MENTALITY（以下「当サイト」）をご利用いただく前に、以下の利用規約をお読みください。</p>

      <h3 style="font-size:.85rem;font-weight:700;color:var(--tx);margin:1.2rem 0 .4rem;">1. サービス概要</h3>
      <p>当サイトはNBAに関する情報提供・コミュニティサービスです。</p>

      <h3 style="font-size:.85rem;font-weight:700;color:var(--tx);margin:1.2rem 0 .4rem;">2. 禁止事項</h3>
      <ul style="margin:.5rem 0 .5rem 1rem;line-height:2;">
        <li>他のユーザーへの誹謗中傷・ハラスメント</li>
        <li>差別的・暴力的な発言</li>
        <li>スパム・宣伝目的の投稿</li>
        <li>著作権を侵害するコンテンツの投稿</li>
        <li>虚偽の情報の意図的な拡散</li>
        <li>法令に違反する行為</li>
      </ul>

      <h3 style="font-size:.85rem;font-weight:700;color:var(--tx);margin:1.2rem 0 .4rem;">3. 免責事項</h3>
      <p>当サイトに掲載する情報の正確性には万全を期しますが、内容の正確性・最新性を保証するものではありません。当サイトの利用により生じた損害について、当サイトは一切の責任を負いません。</p>

      <h3 style="font-size:.85rem;font-weight:700;color:var(--tx);margin:1.2rem 0 .4rem;">4. 著作権</h3>
      <p>当サイトのコンテンツの著作権はMENTALITYに帰属します。無断転載・複製を禁じます。</p>

      <h3 style="font-size:.85rem;font-weight:700;color:var(--tx);margin:1.2rem 0 .4rem;">5. 規約の変更</h3>
      <p>当サイトは予告なく利用規約を変更できるものとします。変更後も当サイトを利用した場合、変更後の規約に同意したものとみなします。</p>

      <p style="margin-top:1.2rem;color:var(--tx3);font-size:.72rem;">制定日：2026年5月</p>
    `
  },

  contact: {
    title: 'お問い合わせ',
    content: `
      <p style="margin-bottom:1.2rem;">ご意見・ご要望・不具合報告などは以下からお気軽にご連絡ください。</p>

      <div style="background:var(--bg3);border:1px solid var(--bd);border-radius:8px;padding:1rem;margin-bottom:1rem;">
        <div style="font-size:.72rem;color:var(--tx3);margin-bottom:.3rem;">メールアドレス</div>
        <a href="mailto:mentalitybrand0824@gmail.com"
          style="font-size:.88rem;font-weight:600;color:var(--or);word-break:break-all;">
          mentalitybrand0824@gmail.com
        </a>
      </div>

      <div style="background:var(--bg3);border:1px solid var(--bd);border-radius:8px;padding:1rem;margin-bottom:1.5rem;">
        <div style="font-size:.72rem;color:var(--tx3);margin-bottom:.3rem;">運営</div>
        <div style="font-size:.85rem;font-weight:600;color:var(--tx);">MENTALITY</div>
      </div>

      <div style="background:rgba(255,90,0,.06);border:1px solid rgba(255,90,0,.2);border-radius:8px;padding:.85rem;">
        <div style="font-size:.75rem;font-weight:700;color:var(--or);margin-bottom:.3rem;">📝 お問い合わせの際はこちらを参考に</div>
        <ul style="font-size:.72rem;color:var(--tx2);line-height:2;margin-left:1rem;">
          <li>不具合報告：画面名・操作内容・デバイスをご記載ください</li>
          <li>広告・スポンサー：件名に「広告掲載希望」とご記載ください</li>
          <li>その他：内容を詳しくご記載いただけると幸いです</li>
        </ul>
      </div>

      <p style="margin-top:1rem;font-size:.72rem;color:var(--tx3);">
        ※ お問い合わせへの返信は2〜5営業日以内を目安としています。
      </p>
    `
  }
};

// ============================================================
// モーダルを開く・閉じる
// ============================================================
function openLegal(page) {
  const data  = LEGAL_PAGES[page];
  if (!data) return;
  document.getElementById('legalTitle').textContent  = data.title;
  document.getElementById('legalContent').innerHTML  = data.content;
  document.getElementById('legalModal').style.display = 'block';
  document.getElementById('legalModal').scrollTop     = 0;
  document.getElementById('mainScroll').style.overflow = 'hidden';
}

function closeLegal() {
  document.getElementById('legalModal').style.display = 'none';
  document.getElementById('mainScroll').style.overflow = '';
}

// ============================================================
// Lv2: 試合前 勝敗予想・投票
// ============================================================
async function castVote(gameId, side, homeAbbr, awayAbbr, btn) {
  const voteKey = `vote_${gameId}`;
  if (localStorage.getItem(voteKey)) return; // 投票済みチェック

  localStorage.setItem(voteKey, side);

  // Firebaseに票を追加
  try {
    const url = `${FB_URL}/votes/${gameId}/${side}.json`;
    const res  = await fetch(url);
    const cur  = (await res.json()) || 0;
    await fetch(url, { method: 'PUT', body: JSON.stringify(cur + 1) });
  } catch(e) {}

  // UI更新
  btn.closest('.vote-row').querySelectorAll('.vote-btn').forEach(b => {
    b.disabled = true;
    b.classList.remove('voted-pick');
  });
  btn.classList.add('voted-pick');
  showVoteResult(gameId);
}

async function showVoteResult(gameId) {
  const panel = document.getElementById(`vr-${gameId}`);
  if (!panel) return;
  try {
    const res  = await fetch(`${FB_URL}/votes/${gameId}.json`);
    const data = (await res.json()) || {};
    const h = data.home || 0;
    const a = data.away || 0;
    const total = h + a || 1;
    const hp = Math.round(h / total * 100);
    const ap = 100 - hp;
    document.getElementById(`vbh-${gameId}`).style.width = hp + '%';
    document.getElementById(`vba-${gameId}`).style.width = ap + '%';
    document.getElementById(`vpc-home-${gameId}`).textContent = hp + '%';
    document.getElementById(`vpc-away-${gameId}`).textContent = ap + '%';
    panel.style.display = 'block';
  } catch(e) {}
}

// ============================================================
// Lv1: 日本人選手 応援コメント
// ============================================================
async function sendJpComment(player) {
  const input = document.getElementById(`cinput-${player}`);
  const text  = input.value.trim();
  if (!text) return;
  input.value = '';

  const nick = localStorage.getItem('nick') || 'ゲスト';
  const comment = { text, nick, ts: Date.now() };

  // Firebaseに保存
  try {
    await fetch(`${FB_URL}/jp_comments/${player}.json`, {
      method: 'POST',
      body: JSON.stringify(comment)
    });
  } catch(e) {}

  // 即座にUI反映
  appendJpComment(player, comment);
}

function appendJpComment(player, comment) {
  const list = document.getElementById(`comments-${player}`);
  if (!list) return;
  const div = document.createElement('div');
  div.className = 'jp-comment-item';
  div.textContent = `${comment.nick}：${comment.text}`;
  list.appendChild(div);
  // 最大5件表示
  while (list.children.length > 5) list.removeChild(list.firstChild);
}

async function loadJpComments() {
  const players = ['kawamura', 'hachimura'];
  for (const p of players) {
    try {
      const res  = await fetch(`${FB_URL}/jp_comments/${p}.json?orderBy="ts"&limitToLast=5`);
      const data = await res.json();
      if (data) {
        Object.values(data)
          .sort((a, b) => a.ts - b.ts)
          .forEach(c => appendJpComment(p, c));
      }
    } catch(e) {}
  }
}

// ============================================================
// Lv3: 週間MVP投票
// ============================================================
const MVP_PLAYERS = ['kawamura', 'hachimura'];

// 今週のキー（月曜起点）
function getMvpWeekKey() {
  const now = new Date();
  const day = now.getDay(); // 0=日
  const diff = (day === 0 ? -6 : 1 - day);
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  return `mvp_${monday.getFullYear()}_${monday.getMonth()+1}_${monday.getDate()}`;
}

async function votePlayer(player) {
  const weekKey = getMvpWeekKey();
  const storageKey = `${weekKey}_voted`;
  if (localStorage.getItem(storageKey)) {
    alert('今週はすでに投票済みです！');
    return;
  }
  localStorage.setItem(storageKey, player);

  // Firebaseに保存
  try {
    const url = `${FB_URL}/${weekKey}/${player}.json`;
    const res  = await fetch(url);
    const cur  = (await res.json()) || 0;
    await fetch(url, { method: 'PUT', body: JSON.stringify(cur + 1) });
  } catch(e) {}

  // ボタン更新
  document.getElementById(`btn-${player}`).classList.add('voted');
  document.getElementById(`btn-${player}`).textContent = '✓ 投票済み';
  MVP_PLAYERS.forEach(p => {
    const b = document.getElementById(`btn-${p}`);
    if (b) b.disabled = true;
  });

  await loadMvpVotes();
}

async function loadMvpVotes() {
  const weekKey = getMvpWeekKey();
  try {
    const res  = await fetch(`${FB_URL}/${weekKey}.json`);
    const data = (await res.json()) || {};
    const totals = MVP_PLAYERS.map(p => data[p] || 0);
    const total  = totals.reduce((a, b) => a + b, 0) || 1;

    MVP_PLAYERS.forEach((p, i) => {
      const pct = Math.round(totals[i] / total * 100);
      const cnt = document.getElementById(`cnt-${p}`);
      const bar = document.getElementById(`bar-${p}`);
      if (cnt) cnt.textContent = `${totals[i]}票`;
      if (bar) bar.style.width = pct + '%';
    });

    // 投票済みならボタン状態を復元
    const voted = localStorage.getItem(getMvpWeekKey() + '_voted');
    if (voted) {
      MVP_PLAYERS.forEach(p => {
        const b = document.getElementById(`btn-${p}`);
        if (!b) return;
        b.disabled = true;
        if (p === voted) { b.classList.add('voted'); b.textContent = '✓ 投票済み'; }
      });
    }
  } catch(e) {}
}

function shareMvpResult() {
  const weekKey = getMvpWeekKey();
  fetch(`${FB_URL}/${weekKey}.json`)
    .then(r => r.json())
    .then(data => {
      const d = data || {};
      const names = { kawamura: '河村勇輝', hachimura: '八村塁' };
      const top = MVP_PLAYERS
        .map(p => ({ name: names[p], votes: d[p] || 0 }))
        .sort((a, b) => b.votes - a.votes)[0];
      const text = `🏀 今週の日本人選手MVP投票結果\n1位：${top.name}（${top.votes}票）\n\nあなたも投票してみて！\nhttps://reliable-kitsune-62166e.netlify.app\n\n#MENTALITY #NBA #河村勇輝 #八村塁`;
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`);
    })
    .catch(() => {
      const text = `🏀 今週の日本人選手MVP投票中！\nhttps://reliable-kitsune-62166e.netlify.app\n#MENTALITY #NBA #河村勇輝 #八村塁`;
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`);
    });
}

// ============================================================
// Lv4: 推しチーム通知機能 (Web Push)
// ============================================================
function toggleNotify(homeAbbr, awayAbbr, btn) {
  const teams = [homeAbbr, awayAbbr];
  const notifiedTeams = JSON.parse(localStorage.getItem('notifyTeams') || '[]');
  const alreadyOn = teams.some(t => notifiedTeams.includes(t));

  if (alreadyOn) {
    // 通知OFF
    const updated = notifiedTeams.filter(t => !teams.includes(t));
    localStorage.setItem('notifyTeams', JSON.stringify(updated));
    btn.textContent = '通知ON';
    btn.classList.remove('on');
    btn.classList.add('off');
    return;
  }

  // 通知許可をリクエスト
  if (!('Notification' in window)) {
    alert('このブラウザはプッシュ通知に対応していません');
    return;
  }

  Notification.requestPermission().then(perm => {
    if (perm === 'granted') {
      const updated = [...new Set([...notifiedTeams, ...teams])];
      localStorage.setItem('notifyTeams', JSON.stringify(updated));
      btn.textContent = '通知ON ✓';
      btn.classList.add('on');
      btn.classList.remove('off');
      // 確認通知を表示
      new Notification('MENTALITY 通知設定完了 🏀', {
        body: `${homeAbbr} と ${awayAbbr} の試合開始をお知らせします`,
        icon: '/favicon.ico'
      });
    } else {
      alert('通知の許可が必要です。ブラウザの設定から許可してください。');
    }
  });
}

// 通知ボタンの状態を復元
function restoreNotifyBtns() {
  const notifiedTeams = JSON.parse(localStorage.getItem('notifyTeams') || '[]');
  document.querySelectorAll('[id^="notify-btn-"]').forEach(btn => {
    const bar = btn.closest('.notify-bar');
    if (!bar) return;
    const text = bar.querySelector('.notify-bar-text').textContent;
    const match = text.match(/([A-Z]{2,3}) or ([A-Z]{2,3})/);
    if (match && (notifiedTeams.includes(match[1]) || notifiedTeams.includes(match[2]))) {
      btn.textContent = '通知ON ✓';
      btn.classList.add('on');
    }
  });
}

// ============================================================
// Lv5: リアルタイム実況チャット
// ============================================================
const lcListeners = {}; // ゲームIDごとのポーリング管理

async function sendLiveChat(gameId, sendBtn) {
  const input = document.getElementById(`lc-input-${gameId}`);
  const text  = input.value.trim();
  if (!text) return;
  input.value = '';

  const nick = localStorage.getItem('nick') || 'ゲスト';
  const msg  = { text, nick, ts: Date.now() };

  try {
    await fetch(`${FB_URL}/live_chat/${gameId}.json`, {
      method: 'POST',
      body: JSON.stringify(msg)
    });
  } catch(e) {}

  appendLiveChatMsg(gameId, msg);
}

function appendLiveChatMsg(gameId, msg) {
  const container = document.getElementById(`lc-msgs-${gameId}`);
  if (!container) return;
  const div = document.createElement('div');
  div.className = 'live-chat-msg';
  const time = new Date(msg.ts).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
  div.innerHTML = `<span class="lc-nick">${msg.nick}</span>${msg.text} <span style="font-size:.6rem;color:var(--tx3);">${time}</span>`;
  container.appendChild(div);
  // 最大30件
  while (container.children.length > 30) container.removeChild(container.firstChild);
  container.scrollTop = container.scrollHeight;
}

async function loadLiveChat(gameId) {
  try {
    const res  = await fetch(`${FB_URL}/live_chat/${gameId}.json?orderBy="ts"&limitToLast=20`);
    const data = await res.json();
    if (!data) return;
    Object.values(data)
      .sort((a, b) => a.ts - b.ts)
      .forEach(m => appendLiveChatMsg(gameId, m));
  } catch(e) {}
}

// selectGame時に実況チャットを読み込む（goPage内で呼ぶ）
const _origSelectGame = typeof selectGame === 'function' ? selectGame : null;

// ============================================================
// Lv6: ESPN RSS 日本語速報
// ============================================================
const RSS_SOURCES = [
  { name: 'Yahoo Sports', url: 'https://sports.yahoo.com/nba/rss.xml' },
  { name: 'The Guardian', url: 'https://www.theguardian.com/sport/nba/rss' },
  { name: 'BBC Sports',   url: 'https://feeds.bbci.co.uk/sport/basketball/rss.xml' },
];
const RSS_PROXY = 'https://api.rss2json.com/v1/api.json?rss_url=';
const TRANSLATE_API = 'https://api.mymemory.translated.net/get?langpair=en|ja&q=';

let rssLoaded = false;

async function translateText(text) {
  if (!text) return '';
  try {
    const res  = await fetch(`${TRANSLATE_API}${encodeURIComponent(text.slice(0, 400))}`);
    const data = await res.json();
    return data?.responseData?.translatedText || text;
  } catch(e) {
    return text;
  }
}

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000 / 60;
  if (diff < 60)   return `${Math.floor(diff)}分前`;
  if (diff < 1440) return `${Math.floor(diff/60)}時間前`;
  return `${Math.floor(diff/1440)}日前`;
}

async function loadRSSNews() {
  if (rssLoaded) return;
  const feed = document.getElementById('rssFeed');
  if (!feed) return;
  feed.innerHTML = '<div class="rss-loading">📡 取得中...</div>';

  const allItems = [];

  for (const src of RSS_SOURCES) {
    try {
      const res  = await fetch(`${RSS_PROXY}${encodeURIComponent(src.url)}`);
      const data = await res.json();
      if (data.status === 'ok' && data.items) {
        data.items.slice(0, 5).forEach(item => {
          allItems.push({ ...item, sourceName: src.name });
        });
      }
    } catch(e) {}
  }

  if (!allItems.length) {
    feed.innerHTML = '<div class="rss-loading">⚠️ ニュースを取得できませんでした</div>';
    return;
  }

  // 日付順に並べる
  allItems.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

  feed.innerHTML = '<div class="rss-loading">🌐 日本語に翻訳中...</div>';

  const items = allItems.slice(0, 8);
  const translated = await Promise.all(
    items.map(async item => {
      const jaTitle = await translateText(item.title);
      const jaDesc  = item.description
        ? await translateText(item.description.replace(/<[^>]+>/g, '').slice(0, 200))
        : '';
      return { ...item, jaTitle, jaDesc };
    })
  );

  feed.innerHTML = translated.map(item => `
    <a class="rss-item" href="${item.link}" target="_blank" rel="noopener">
      <div class="rss-item-source">${item.sourceName} <span class="rss-badge">自動翻訳</span></div>
      <div class="rss-item-title">${item.jaTitle}</div>
      ${item.jaDesc ? `<div class="rss-item-ja">${item.jaDesc}</div>` : ''}
      <div class="rss-item-time">${timeAgo(item.pubDate)}</div>
    </a>
  `).join('');

  rssLoaded = true;
}

// ============================================================
// goPage拡張: news/japan/liveチャット対応
// ============================================================
// 起動時に投票済み試合の結果を表示
document.addEventListener('DOMContentLoaded', () => {
  try {
    const allGames = typeof GAMES !== 'undefined'
      ? Object.values(GAMES).flat()
      : [];
    allGames.forEach(g => {
      if (g && localStorage.getItem(`vote_${g.id}`)) {
        setTimeout(() => showVoteResult(g.id), 600);
      }
    });
  } catch(e) {}
});



// ==================== 検索機能修正 (2026-07-30) ====================
// 元のhandleSearch()はダミーの固定リスト（5件程度のサンプルデータ）のみを
// 検索対象としており、実際のFirebase記事データと連動していなかったため、
// 「レブロン」等、実際には該当記事が存在するキーワードで検索しても
// 「検索結果なし」と表示される不具合があった。
// index.html側の元関数はそのまま残し、この関数でwindow.handleSearchを
// 上書きし、実際のarticles / sneakersデータを検索対象にする。
let _fixedSearchArticles = null;
let _fixedSearchSneakers = null;

async function _fixedLoadSearchData() {
  if (_fixedSearchArticles === null) {
    try {
      const r = await fetch('https://mentality-nba-default-rtdb.firebaseio.com/articles.json');
      const data = (await r.json()) || {};
      _fixedSearchArticles = Object.keys(data)
        .map(id => ({ id, ...data[id] }))
        .filter(a => !a.archived && a.title);
    } catch (e) {
      _fixedSearchArticles = [];
    }
  }
  if (_fixedSearchSneakers === null) {
    try {
      const r = await fetch('https://mentality-nba-default-rtdb.firebaseio.com/sneakers.json');
      const data = (await r.json()) || {};
      _fixedSearchSneakers = Object.keys(data)
        .map(id => ({ id, ...data[id] }))
        .filter(s => !s.archived && s.model);
    } catch (e) {
      _fixedSearchSneakers = [];
    }
  }
}

window.handleSearch = async function (val) {
  if (val === 'kobe0824') {
    closeSearch();
    goPage('admin');
    showAdminPage('admin-menu'); // kobe0824だけで管理メニューを開く（DB書き込みは認証不要に変更済み）
    return;
  }
  const results = document.getElementById('search-results');
  if (!results) return;
  if (val.length === 0) { results.innerHTML = ''; return; }

  await _fixedLoadSearchData();

  const q = val.trim().toLowerCase();
  const rowStyle = 'display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid #1a1a1a;cursor:pointer;';
  const iconStyle = 'width:36px;height:36px;border-radius:8px;background:#1a1a1a;display:flex;align-items:center;justify-content:center;font-size:10px;color:#888;font-weight:700;';

  const articleItems = _fixedSearchArticles
    .filter(a => (a.title || '').toLowerCase().includes(q) || (a.category || '').toLowerCase().includes(q))
    .slice(0, 15)
    .map(a => `<div onclick="closeSearch();openArticle('${a.id}')" style="${rowStyle}"><div style="${iconStyle}">記事</div><div><div style="font-size:13px;font-weight:700;color:#fff;">${a.title}</div><div style="font-size:11px;color:#666;">${a.category || ''}</div></div></div>`);

  const sneakerItems = _fixedSearchSneakers
    .filter(s => (s.model || '').toLowerCase().includes(q) || (s.player || '').toLowerCase().includes(q) || (s.brand || '').toLowerCase().includes(q))
    .slice(0, 10)
    .map(s => `<div onclick="closeSearch();openSnkModal('${s.id}')" style="${rowStyle}"><div style="${iconStyle}">バッシュ</div><div><div style="font-size:13px;font-weight:700;color:#fff;">${s.model}</div><div style="font-size:11px;color:#666;">${s.player || s.brand || ''}</div></div></div>`);

  const items = [...articleItems, ...sneakerItems];

  results.innerHTML = items.length
    ? items.join('')
    : `<div style="text-align:center;color:#555;padding:40px 0;font-size:13px;">「${q}」の検索結果なし</div>`;
};
