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
  if (!nick) { alert('ニックネームを入力してください'); return; }
  chatNick = nick;
  chatEmoji = document.getElementById('regEmoji').value || '🏀';
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
        '<div class="cav ' + avColor + '">' + (m.emoji || s[0].toUpperCase()) + '</div>' +
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
