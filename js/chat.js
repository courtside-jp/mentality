// chat.js - フリーチャット
const FB_CHAT = 'https://mentality-nba-default-rtdb.firebaseio.com';
const CHAT_NG = ['セックス','エロ','死ね','殺す','fuck','shit','sex','porn'];
let chatNick = localStorage.getItem('chat_nick') || '';
let chatEmoji = localStorage.getItem('chat_emoji') || '';
let chatPollId = null;

function goChat() {
  if (!chatNick) { openChatReg(); return; }
  loadChatMsgs();
  if (!chatPollId) chatPollId = setInterval(loadChatMsgs, 5000);
  setTimeout(function() {
    var pg = document.getElementById('pg-chat');
    var msgs = document.getElementById('chatMsgs');
    var bar = pg ? pg.querySelector('.chat-input-bar') : null;
    if (pg && msgs && bar) {
      var pgH = pg.offsetHeight;
      var barH = bar.offsetHeight;
      msgs.style.height = (pgH - barH - 40) + 'px';
    }
  }, 100);
}

function openChatReg() {
  document.getElementById('chatRegModal').style.display = 'flex';
}

function closeChatReg() {
  document.getElementById('chatRegModal').style.display = 'none';
}

async function saveChatReg() {
  const nick = document.getElementById('regNick').value.trim();
  const age = document.getElementById('regAge').value;
  const gen = document.getElementById('regGender').value;
  const team = document.getElementById('regTeam').value;
  const player = document.getElementById('regPlayer').value.trim();
  const email = document.getElementById('regEmail') ? document.getElementById('regEmail').value.trim() : '';
  if (!nick) { alert('ニックネームを入力してください'); return; }
  chatNick = nick;
  chatEmoji = '🏀';
  localStorage.setItem('chat_nick', chatNick);
  localStorage.setItem('chat_emoji', chatEmoji);
  await fetch(FB_CHAT + '/chatusers.json', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ nick, age, gender: gen, team, player, email, emoji: chatEmoji, ts: Date.now() })
  }).catch(function() {});
  closeChatReg();
  loadChatMsgs();
  if (!chatPollId) chatPollId = setInterval(loadChatMsgs, 5000);
}

function chatRenderMsg(msg) {
  var esc = msg.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  var yt = msg.match(/https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  if (yt) {
    return '<a href="' + esc + '" target="_blank" style="color:var(--or);word-break:break-all;">' + esc + '</a><div style="margin-top:.4rem;"><iframe width="100%" height="160" src="https://www.youtube.com/embed/' + yt[1] + '" frameborder="0" allowfullscreen></iframe></div>';
  }
  var img = msg.match(/https?:\/\/\S+\.(?:jpg|jpeg|png|gif|webp)(\?\S*)?$/i);
  if (img) {
    return '<img src="' + esc + '" style="max-width:100%;border-radius:8px;" onerror="this.style.display=\'none\'">';
  }
  var url = msg.match(/https?:\/\/\S+/);
  if (url) {
    return esc.replace(url[0], '<a href="' + url[0] + '" target="_blank" style="color:var(--or);word-break:break-all;">' + url[0] + '</a>');
  }
  return esc;
}

async function loadChatMsgs() {
  try {
    var res = await fetch(FB_CHAT + '/freechat.json?orderBy=%22%24key%22&limitToLast=100');
    var data = await res.json();
    var wrap = document.getElementById('chatMsgs');
    if (!wrap) return;
    if (!data) {
      wrap.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--tx3);font-size:.8rem;">まだメッセージがありません</div>';
      return;
    }
    var entries = Object.entries(data).sort(function(a,b){ return a[1].ts - b[1].ts; });
    var msgs = entries.map(function(e){ return Object.assign({_id: e[0]}, e[1]); });
    var colors = ['cao','cat','cap','cag','can'];
    wrap.innerHTML = msgs.map(function(m) {
      var isMine = m.nick === chatNick;
      var h = 0;
      var s = m.nick || '?';
      for (var i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
      var avColor = colors[Math.abs(h) % 5];
      return '<div class="cm' + (isMine ? ' me' : '') + '">' +
        '<div class="cav ' + avColor + '">' + s[0].toUpperCase() + '</div>' +
        '<div class="cbody">' +
        '<div class="cname">' + (m.nick || '匿名') + '</div>' +
        '<div class="cbbl">' + chatRenderMsg(m.msg || '') + '</div>' +
        '<div class="ctime">' + (m.time || '') + (isMine ? ' <button onclick="chatDelete(&#39;' + m._id + '&#39;)" style="background:none;border:none;color:var(--tx3);font-size:.6rem;cursor:pointer;">🗑</button>' : '') + '</div>' +
        '</div></div>';
    }).join('');
    wrap.scrollTop = wrap.scrollHeight;
  } catch(e) {}
}

function chatSend() {
  if (!chatNick) { openChatReg(); return; }
  var inp = document.getElementById('chatField');
  var txt = inp.value.trim();
  if (!txt) return;
  var ng = ['セックス','エロ','死ね','殺す','fuck','shit','sex','porn'];
  for (var i = 0; i < ng.length; i++) {
    if (txt.toLowerCase().indexOf(ng[i].toLowerCase()) >= 0) {
      alert('不適切なワードが含まれています');
      return;
    }
  }
  inp.value = '';
  var now = new Date();
  var time = now.getHours() + ':' + String(now.getMinutes()).padStart(2,'0');
  fetch(FB_CHAT + '/freechat.json', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ nick: chatNick, emoji: chatEmoji, msg: txt, time: time, ts: Date.now() })
  }).then(function(){ loadChatMsgs(); }).catch(function(){});
}

function chatSendImage(input) {
  if (!chatNick) { openChatReg(); return; }
  var file = input.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function(e) {
    var now = new Date();
    var time = now.getHours() + ':' + String(now.getMinutes()).padStart(2,'0');
    fetch(FB_CHAT + '/freechat.json', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ nick: chatNick, emoji: chatEmoji, msg: e.target.result, time: time, ts: Date.now() })
    }).then(function(){ loadChatMsgs(); }).catch(function(){});
  };
  reader.readAsDataURL(file);
  input.value = '';
}

async function chatDelete(msgId) {
  if (!confirm('このメッセージを削除しますか？')) return;
  await fetch(FB_CHAT + '/freechat/' + msgId + '.json', {
    method: 'DELETE'
  }).catch(function(){});
  loadChatMsgs();
}

// ユーザー管理
function openUserModal() {
  const modal = document.getElementById('userModal');
  if (modal) { modal.style.display = 'block'; loadChatUsers(); }
}

function closeUserModal() {
  const modal = document.getElementById('userModal');
  if (modal) modal.style.display = 'none';
}

async function loadChatUsers() {
  const wrap = document.getElementById('userList');
  if (!wrap) return;
  wrap.innerHTML = '<div style="text-align:center;padding:1rem;color:var(--tx3);font-size:.75rem;">読み込み中...</div>';
  try {
    const res = await fetch('https://mentality-nba-default-rtdb.firebaseio.com/chatusers.json');
    const data = await res.json();
    if (!data) { wrap.innerHTML = '<div style="text-align:center;padding:1rem;color:var(--tx3);">ユーザーなし</div>'; return; }
    const entries = Object.entries(data).sort((a,b) => b[1].ts - a[1].ts);
    wrap.innerHTML = '<div style="font-size:.7rem;color:var(--tx3);margin-bottom:.5rem;">登録ユーザー数: ' + entries.length + '人</div>' +
      entries.map(([id, u]) => {
        const date = u.ts ? new Date(u.ts).toLocaleDateString('ja-JP') : '-';
        const gender = u.gender === 'male' ? '男性' : u.gender === 'female' ? '女性' : '-';
        return '<div style="background:var(--bg3);border-radius:8px;padding:.7rem;margin-bottom:.5rem;">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;">' +
          '<div style="font-size:.78rem;font-weight:700;color:var(--tx);">🏀 ' + (u.nick || '匿名') + '</div>' +
          '<button onclick="deleteChatUser('' + id + '', '' + (u.nick||'') + '')" style="background:rgba(201,8,42,.1);border:none;color:#C9082A;font-size:.6rem;padding:.2rem .5rem;border-radius:6px;cursor:pointer;">退出</button>' +
          '</div>' +
          '<div style="font-size:.63rem;color:var(--tx3);margin-top:.3rem;display:grid;grid-template-columns:1fr 1fr;gap:.2rem;">' +
          '<span>年齢: ' + (u.age || '-') + '</span>' +
          '<span>性別: ' + gender + '</span>' +
          '<span>推しチーム: ' + (u.team || '-') + '</span>' +
          '<span>推し選手: ' + (u.player || '-') + '</span>' +
          '<span>登録日: ' + date + '</span>' +
          '</div>' +
          '</div>';
      }).join('');
  } catch(e) {
    wrap.innerHTML = '<div style="text-align:center;padding:1rem;color:var(--tx3);">取得失敗</div>';
  }
}

async function deleteChatUser(id, nick) {
  if (!confirm(nick + ' を退出させますか？')) return;
  try {
    await fetch('https://mentality-nba-default-rtdb.firebaseio.com/chatusers/' + id + '.json', {
      method: 'DELETE'
    });
    alert(nick + ' を退出させました');
    loadChatUsers();
  } catch(e) {
    alert('失敗しました');
  }
}

async function deleteChatUser(id, nick) {
  if (!confirm(nick + ' を退出させますか？')) return;
  try {
    await fetch('https://mentality-nba-default-rtdb.firebaseio.com/chatusers/' + id + '.json', {
      method: 'DELETE'
    });
    alert(nick + ' を退出させました');
    loadChatUsers();
  } catch(e) {
    alert('失敗しました');
  }
}

async function submitChatReg() {
  const nick = document.getElementById('reg-nick').value.trim();
  const age = document.getElementById('reg-age').value;
  const gen = document.getElementById('reg-gender').value;
  const team = document.getElementById('reg-team').value;
  const player = document.getElementById('reg-player').value.trim();

  if (!nick) { alert('ニックネームを入力してください'); return; }
  if (nick.length < 2) { alert('ニックネームは2文字以上にしてください'); return; }

  // 禁止ワードチェック
  const ngWords = ['死','殺','クソ','バカ','アホ','差別','ゴミ'];
  if (ngWords.some(w => nick.includes(w))) { alert('使用できないニックネームです'); return; }

  // 重複チェック
  try {
    const res = await fetch(FB_CHAT + '/chatusers.json');
    const data = await res.json();
    if (data) {
      const existing = Object.values(data).map(u => u.nick);
      if (existing.includes(nick)) { alert('このニックネームはすでに使われています'); return; }
    }
  } catch(e) {}

  chatNick = nick;
  chatEmoji = '🏀';
  localStorage.setItem('chat_nick', chatNick);
  localStorage.setItem('chat_emoji', chatEmoji);

  await fetch(FB_CHAT + '/chatusers.json', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ nick, age, gender: gen, team, player, emoji: chatEmoji, ts: Date.now() })
  }).catch(function() {});

  closeChatReg();
  loadChatMsgs();
  if (!chatPollId) chatPollId = setInterval(loadChatMsgs, 5000);
}
