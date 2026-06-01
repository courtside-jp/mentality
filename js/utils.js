// utils.js — 共通ユーティリティ関数
// 読み込み順: data.js → utils.js → app.js → 各機能JS

// utils.js — 共通ユーティリティ関数
// どのファイルからも使える便利関数だけをまとめる
// ============================================================

// ---------- 時刻 ----------

/** 現在の日本時間を "HH:MM" で返す */
function ntime() {
  return new Date().toLocaleTimeString('ja-JP', {
    hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tokyo'
  });
}

/** 日本時間の Date オブジェクトを返す */
function getJPDate() {
  return new Date(new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }));
}

/** NBA基準日を返す（日本時間14時前は前日扱い） */
function getNBABaseDate() {
  // NBA基準日：日本時間から1日戻す（ETとの時差対応）
  const jp = new Date(new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }));
  jp.setDate(jp.getDate() - 1);
  return jp;
}

/** Date を "YYYYMMDD" 文字列に変換（日本時間基準） */
function toDateStr(date) {
  // 日本時間で年月日を取得
  const jp = new Date(date.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }));
  return jp.getFullYear()
    + String(jp.getMonth() + 1).padStart(2, '0')
    + String(jp.getDate()).padStart(2, '0');
}

/** 曜日配列 */
const DAYS = ['日', '月', '火', '水', '木', '金', '土'];

/** Date を "M月D日（曜）" 形式に変換（日本時間基準） */
function toJPDateLabel(date) {
  const jp = new Date(date.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }));
  const et = new Date(date.toLocaleString('ja-JP', { timeZone: 'America/New_York' }));
  const jpLabel = `${jp.getMonth() + 1}月${jp.getDate()}日（${DAYS[jp.getDay()]}）`;
  const etLabel = `ET ${et.getMonth() + 1}/${et.getDate()}（${DAYS[et.getDay()]}）`;
  return `${jpLabel} <span style="font-size:.65rem;color:var(--tx3);font-weight:400;">${etLabel}</span>`;
}

// ---------- 文字列 ----------

/** HTML エスケープ（XSS対策） */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** 検索キーワードをハイライト */
function highlight(text, query) {
  if (!query) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.replace(new RegExp(escaped, 'gi'), m => `<mark>${m}</mark>`);
}

// ---------- DOM ----------

/** id で要素を取得（見つからなければ null） */
const $ = (id) => document.getElementById(id);

/** セレクタで複数要素取得 */
const $$ = (sel, parent = document) => [...parent.querySelectorAll(sel)];

/** ローディング用シマーHTMLを返す */
function shimmerHTML(rows = 3) {
  return Array.from({ length: rows }, () =>
    `<div style="height:60px;border-radius:8px;background:linear-gradient(90deg,var(--bg3) 25%,var(--bd) 50%,var(--bg3) 75%);background-size:200% 100%;animation:shimmer 1.2s infinite;margin-bottom:.45rem;"></div>`
  ).join('');
}

// ---------- ローカルストレージ ----------

/** ローカルストレージに安全に保存 */
function lsSet(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch(e) {}
}

/** ローカルストレージから安全に取得（失敗時は fallback） */
function lsGet(key, fallback = null) {
  try {
    const v = localStorage.getItem(key);
    return v !== null ? JSON.parse(v) : fallback;
  } catch(e) { return fallback; }
}

// ---------- ネットワーク ----------

/** fetch のタイムアウト付きラッパー（デフォルト 8秒） */
async function fetchWithTimeout(url, options = {}, ms = 8000) {
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(tid);
    return res;
  } catch(e) {
    clearTimeout(tid);
    throw e;
  }
}

// ---------- SNS シェア ----------

/** X（Twitter）でシェアするURLを開く */
function shareX(text) {
  const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text + '\n\nhttps://reliable-kitsune-62166e.netlify.app')}`;
  window.open(url, '_blank');
}

/** テキストをクリップボードにコピー */
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast('コピーしました！');
  } catch(e) {
    showToast('コピーに失敗しました');
  }
}

// ---------- トースト通知 ----------

let _toastTimer = null;

/** 画面下部にトースト通知を表示 */
function showToast(msg, ms = 2000) {
  let el = $('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.style.cssText = [
      'position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(8px)',
      'background:#111;color:#fff;font-size:.75rem;font-weight:500',
      'padding:.55rem 1.1rem;border-radius:100px',
      'opacity:0;z-index:999;transition:all .22s;pointer-events:none',
      'white-space:nowrap;box-shadow:0 4px 20px rgba(0,0,0,.3)',
      "font-family:'Barlow Condensed',sans-serif;letter-spacing:.06em",
    ].join(';');
    document.body.appendChild(el);
  }
  el.textContent = msg;
  clearTimeout(_toastTimer);
  requestAnimationFrame(() => {
    el.style.opacity = '1';
    el.style.transform = 'translateX(-50%) translateY(0)';
  });
  _toastTimer = setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateX(-50%) translateY(8px)';
  }, ms);
}

// ---------- 選手写真キャッシュ ----------
const _photoCache = {};

/** 選手名から ESPN 顔写真 URL を取得（キャッシュあり） */
async function getPlayerPhoto(playerName) {
  if (_photoCache[playerName] !== undefined) return _photoCache[playerName];
  try {
    const q   = encodeURIComponent(playerName);
    const res = await fetchWithTimeout(
      `${ESPN_BASE}/athletes?limit=3&search=${q}`, {}, 5000
    );
    if (!res.ok) throw new Error('no');
    const data    = await res.json();
    const athlete = (data.athletes || [])[0];
    if (!athlete) throw new Error('no');
    const url = ESPN_HEADSHOT(athlete.id);
    _photoCache[playerName] = url;
    return url;
  } catch(e) {
    _photoCache[playerName] = '';
    return '';
  }
}
// ============================================================
