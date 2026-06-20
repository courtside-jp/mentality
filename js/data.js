const ESPNID_MAP = {};
// data.js — 定数・API設定・固定データ（チーム・選手・試合）
// 読み込み順: data.js → utils.js → app.js → 各機能JS

// ============================================================
// config.js — 定数・API設定
// ここだけ変えれば全ファイルに反映される
// ============================================================

// ---------- Firebase ----------
const FB_URL = 'https://mentality-nba-default-rtdb.firebaseio.com';

// ---------- ESPN API ----------
const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba';
const ESPN_SCOREBOARD = `${ESPN_BASE}/scoreboard`;
const ESPN_STANDINGS  = `${ESPN_BASE}/standings`;

// ---------- NBA API ----------
const NBA_API_BASE = 'https://api.server.nbaapi.com/api';

// ---------- NBA CDN ----------
const NBA_CDN_LOGO    = (id)  => `https://cdn.nba.com/logos/nba/${id}/global/L/logo.svg`;
const NBA_CDN_HEADSHOT= (id)  => `https://cdn.nba.com/headshots/nba/latest/1040x760/${id}.png`;
const ESPN_HEADSHOT   = (id)  => `https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/${id}.png&w=96&h=70&cb=1`;

// ---------- サイト設定 ----------
const SITE_NAME    = 'MENTALITY';
const SITE_VERSION = '2.0.0';
const POLL_INTERVAL_MS = 30000; // スコア自動更新（30秒）
const CHAT_POLL_MS     = 5000;  // チャット自動更新（5秒）

// ---------- チームCDN ID ----------
const TEAM_CDN_IDS = {
  ATL:1610612737, BOS:1610612738, BKN:1610612751, CHA:1610612766,
  CHI:1610612741, CLE:1610612739, DAL:1610612742, DEN:1610612743,
  DET:1610612765, GSW:1610612744, HOU:1610612745, IND:1610612754,
  LAC:1610612746, LAL:1610612747, MEM:1610612763, MIA:1610612748,
  MIL:1610612749, MIN:1610612750, NOP:1610612740, NYK:1610612752,
  OKC:1610612760, ORL:1610612753, PHI:1610612755, PHX:1610612756,
  POR:1610612757, SAC:1610612758, SAS:1610612759, TOR:1610612761,
  UTA:1610612762, WAS:1610612764,
};

// ---------- 選手名 日本語マッピング ----------
const JA_NAME_MAP = {
  'LeBron James'            : 'レブロン・ジェームズ',
  'Stephen Curry'           : 'ステフィン・カリー',
  'Kevin Durant'            : 'ケビン・デュラント',
  'Giannis Antetokounmpo'   : 'ヤニス・アンテトクンポ',
  'Luka Dončić'             : 'ルカ・ドンチッチ',
  'Luka Doncic'             : 'ルカ・ドンチッチ',
  'Nikola Jokić'            : 'ニコラ・ヨキッチ',
  'Nikola Jokic'            : 'ニコラ・ヨキッチ',
  'Lauri Markkanen'         : 'ラウリ・マルカネン',
  'Joel Embiid'             : 'ジョエル・エンビード',
  'Jayson Tatum'            : 'ジェイソン・テイタム',
  'Damian Lillard'          : 'デイミアン・リラード',
  'Ja Morant'               : 'ジャ・モラント',
  'Anthony Davis'           : 'アンソニー・デイビス',
  'Kawhi Leonard'           : 'カワイ・レナード',
  'Devin Booker'            : 'デビン・ブッカー',
  'Donovan Mitchell'        : 'ドノバン・ミッチェル',
  'Trae Young'              : 'トレイ・ヤング',
  'Anthony Edwards'         : 'アンソニー・エドワーズ',
  'Tyrese Haliburton'       : 'タイリース・ハリバートン',
  'Shai Gilgeous-Alexander' : 'シャイ・ギルジャス=アレクサンダー',
  'James Harden'            : 'ジェームズ・ハーデン',
  'Kyrie Irving'            : 'カイリー・アービング',
  'Draymond Green'          : 'ドレイモンド・グリーン',
  'Klay Thompson'           : 'クレイ・トンプソン',
  'Bam Adebayo'             : 'バム・アデバヨ',
  'Jimmy Butler'            : 'ジミー・バトラー',
  'Karl-Anthony Towns'      : 'カール・アンソニー・タウンズ',
  'Jaylen Brown'            : 'ジェイレン・ブラウン',
  'Cade Cunningham'         : 'ケイド・カニングハム',
  'Evan Mobley'             : 'エバン・モブリー',
  'Darius Garland'          : 'ダリアス・ガーランド',
  "De'Aaron Fox"            : 'ダアロン・フォックス',
  'Domantas Sabonis'        : 'ドマンタス・サボニス',
  'Jaren Jackson Jr.'       : 'ジャレン・ジャクソンJr.',
  'Victor Wembanyama'       : 'ウェンバンヤマ',
  'Yuki Kawamura'           : '河村 勇輝',
  'Rui Hachimura'           : '八村 塁',
  'Tyrese Maxey'            : 'タイリース・マクシー',
  'Jalen Brunson'           : 'ジェイレン・ブランソン',
  'Julius Randle'           : 'ジュリアス・ランドル',
  'OG Anunoby'              : 'OGアヌノビー',
  'Paolo Banchero'          : 'パオロ・バンケロ',
  'Franz Wagner'            : 'フランツ・ワグナー',
  'Scottie Barnes'          : 'スコッティ・バーンズ',
  'Jamal Murray'            : 'ジャマール・マレー',
  'Jayson Tatum': 'ジェイソン・テイタム',
  'Austin Reaves': 'オースティン・リーブス',
  'LaMelo Ball': 'ラメロ・ボール',
  'Cooper Flagg': 'クーパー・フラッグ',
  'Chet Holmgren': 'チェット・ホルムグレン',
  'Derrick White': 'デリック・ホワイト',
  'Payton Pritchard': 'ペイトン・プリチャード',
  'Josh Hart': 'ジョシュ・ハート',
  'Mikal Bridges': 'ミカル・ブリッジズ',
  'Myles Turner': 'マイルズ・ターナー',
  'Deni Avdija': 'デニ・アブディヤ',
  'Pascal Siakam': 'パスカル・シアカム',
  'Brandon Ingram': 'ブランドン・イングラム',
  'Zion Williamson': 'ザイオン・ウィリアムソン',
  'Alperen Sengun': 'アルペレン・シェングン',
  'Desmond Bane': 'デズモンド・ベイン',
  'DeMar DeRozan': 'デマー・デローザン',
  'Andrew Wiggins': 'アンドリュー・ウィギンズ',
  'Russell Westbrook': 'ラッセル・ウェストブルック',
  'Kyle Kuzma': 'カイル・クーズマ',
  'Deandre Ayton': 'ディアンドレ・エイトン',
  'Dyson Daniels': 'ダイソン・ダニエルズ',
  'Dylan Harper': 'ディラン・ハーパー',
  'Donovan Clingan': 'ドノバン・クリンガン',
  'Naz Reid': 'ナズ・リード',
  'Bobby Portis': 'ボビー・ポーティス',
  'Stephon Castle': 'ステフォン・キャッスル',
  'Ace Bailey': 'エース・ベイリー',
  'Moses Moody': 'モーゼス・ムーディ',
  'Jabari Smith Jr.': 'ジャバリ・スミスJr.',
  'Jalen Johnson': 'ジェイレン・ジョンソン',
  'Norman Powell': 'ノーマン・パウエル',
  'Devin Vassell': 'デビン・バッセル',
  'Collin Sexton': 'コリン・セクストン',
  'Ayo Dosunmu': 'アヨ・ドスンム',
  'Jaden McDaniels': 'ジェイデン・マクダニエルズ',
  'Jeremiah Fears': 'ジェレマイア・フィアーズ',
};

// ---------- 英語名→カタカナ自動変換 ----------
function autoKana(name) {
  // JA_NAME_MAPに登録済みならそちらを優先
  if (JA_NAME_MAP[name]) return JA_NAME_MAP[name];

  // 名前部分のみ変換（姓を優先）
  const parts = name.split(' ');
  const last = parts[parts.length - 1];

  const map = [
    [/sch/gi,'シュ'],[/tch/gi,'ッチ'],[/ck/gi,'ック'],[/ph/gi,'フ'],
    [/wh/gi,'ホ'],[/th/gi,'ス'],[/sh/gi,'シ'],[/ch/gi,'チ'],
    [/gh/gi,'ッ'],[/ng/gi,'ング'],[/nk/gi,'ンク'],[/nt/gi,'ント'],
    [/nd/gi,'ンド'],[/mb/gi,'ンブ'],[/mp/gi,'ンプ'],
    [/qu/gi,'クウ'],
    [/tion/gi,'ション'],[/sion/gi,'ション'],[/ous/gi,'アス'],
    [/ble/gi,'ブル'],[/ple/gi,'プル'],[/tle/gi,'トル'],[/dle/gi,'ドル'],
    [/fle/gi,'フル'],[/kle/gi,'クル'],[/ngle/gi,'ングル'],
    [/ing/gi,'イング'],[/ling/gi,'リング'],[/ring/gi,'リング'],
    [/man/gi,'マン'],[/son/gi,'ソン'],[/ton/gi,'トン'],[/den/gi,'デン'],
    [/ven/gi,'ベン'],[/ken/gi,'ケン'],[/ren/gi,'レン'],[/len/gi,'レン'],
    [/ian/gi,'イアン'],[/ean/gi,'イーン'],[/aan/gi,'アーン'],
    [/oor/gi,'アー'],[/our/gi,'アー'],[/air/gi,'エア'],[/ear/gi,'イア'],
    [/ier/gi,'イア'],[/eer/gi,'イア'],
    [/oo/gi,'ウー'],[/ee/gi,'イー'],[/ea/gi,'イー'],[/ai/gi,'エイ'],
    [/au/gi,'オー'],[/aw/gi,'オー'],[/oi/gi,'オイ'],[/ou/gi,'アウ'],
    [/ow/gi,'オウ'],[/ew/gi,'ュー'],[/ue/gi,'ュー'],[/ui/gi,'ウィ'],
    [/ie/gi,'イー'],[/oe/gi,'オー'],
    [/ba/gi,'バ'],[/be/gi,'ベ'],[/bi/gi,'ビ'],[/bo/gi,'ボ'],[/bu/gi,'ブ'],
    [/ca/gi,'カ'],[/ce/gi,'ス'],[/ci/gi,'シ'],[/co/gi,'コ'],[/cu/gi,'カ'],
    [/da/gi,'ダ'],[/de/gi,'デ'],[/di/gi,'ディ'],[/do/gi,'ド'],[/du/gi,'デュ'],
    [/fa/gi,'ファ'],[/fe/gi,'フェ'],[/fi/gi,'フィ'],[/fo/gi,'フォ'],[/fu/gi,'フ'],
    [/ga/gi,'ガ'],[/ge/gi,'ジ'],[/gi/gi,'ジ'],[/go/gi,'ゴ'],[/gu/gi,'グ'],
    [/ha/gi,'ハ'],[/he/gi,'ヘ'],[/hi/gi,'ヒ'],[/ho/gi,'ホ'],[/hu/gi,'ハ'],
    [/ja/gi,'ジャ'],[/je/gi,'ジェ'],[/ji/gi,'ジ'],[/jo/gi,'ジョ'],[/ju/gi,'ジュ'],
    [/ka/gi,'カ'],[/ke/gi,'ケ'],[/ki/gi,'キ'],[/ko/gi,'コ'],[/ku/gi,'ク'],
    [/la/gi,'ラ'],[/le/gi,'ル'],[/li/gi,'リ'],[/lo/gi,'ロ'],[/lu/gi,'ル'],
    [/ma/gi,'マ'],[/me/gi,'メ'],[/mi/gi,'ミ'],[/mo/gi,'モ'],[/mu/gi,'ム'],
    [/na/gi,'ナ'],[/ne/gi,'ネ'],[/ni/gi,'ニ'],[/no/gi,'ノ'],[/nu/gi,'ヌ'],
    [/pa/gi,'パ'],[/pe/gi,'ペ'],[/pi/gi,'ピ'],[/po/gi,'ポ'],[/pu/gi,'プ'],
    [/ra/gi,'ラ'],[/re/gi,'レ'],[/ri/gi,'リ'],[/ro/gi,'ロ'],[/ru/gi,'ル'],
    [/sa/gi,'サ'],[/se/gi,'セ'],[/si/gi,'シ'],[/so/gi,'ソ'],[/su/gi,'ス'],
    [/ta/gi,'タ'],[/te/gi,'テ'],[/ti/gi,'ティ'],[/to/gi,'ト'],[/tu/gi,'テュ'],
    [/va/gi,'バ'],[/ve/gi,'ベ'],[/vi/gi,'ビ'],[/vo/gi,'ボ'],[/vu/gi,'ブ'],
    [/wa/gi,'ワ'],[/we/gi,'ウェ'],[/wi/gi,'ウィ'],[/wo/gi,'ウォ'],[/wu/gi,'ウ'],
    [/xa/gi,'ザ'],[/xe/gi,'ゼ'],[/xi/gi,'ジ'],[/xo/gi,'ゾ'],
    [/ya/gi,'ヤ'],[/ye/gi,'イェ'],[/yi/gi,'イ'],[/yo/gi,'ヨ'],[/yu/gi,'ユ'],
    [/za/gi,'ザ'],[/ze/gi,'ゼ'],[/zi/gi,'ジ'],[/zo/gi,'ゾ'],[/zu/gi,'ズ'],
    [/a/gi,'ア'],[/e/gi,'エ'],[/i/gi,'イ'],[/o/gi,'オ'],[/u/gi,'ウ'],
    [/b/gi,'ブ'],[/c/gi,'ク'],[/d/gi,'ド'],[/f/gi,'フ'],[/g/gi,'グ'],
    [/h/gi,'ハ'],[/j/gi,'ジ'],[/k/gi,'ク'],[/l/gi,'ル'],[/m/gi,'ム'],
    [/n/gi,'ン'],[/p/gi,'プ'],[/q/gi,'ク'],[/r/gi,'ル'],[/s/gi,'ス'],
    [/t/gi,'ト'],[/v/gi,'ブ'],[/w/gi,'ウ'],[/x/gi,'クス'],[/y/gi,'イ'],
    [/z/gi,'ズ'],
  ];

  let result = last;
  for (const [pat, rep] of map) {
    result = result.replace(pat, rep);
  }
  return result;
}

// ---------- チャット内 広告データ ----------
const TEAM_ADS = {
  lal: { img:'👟', tag:'選手着用バッシュ', title:'ナイキ レブロン22 LALカラー',    old:'¥24,200', price:'¥19,360', url:'https://amzn.to/lebron-shoe' },
  gsw: { img:'👟', tag:'選手着用バッシュ', title:'アンダーアーマー カリー12 GS',   old:'¥22,000', price:'¥18,700', url:'https://amzn.to/curry-shoe'  },
  bos: { img:'🏀', tag:'チームグッズ',     title:'セルティックス ユニフォーム #0', old:'¥18,000', price:'¥14,400', url:'https://amzn.to/celtics'     },
  nyk: { img:'🏀', tag:'チームグッズ',     title:'ニックス ユニフォーム #11',       old:'¥18,000', price:'¥14,400', url:'https://amzn.to/knicks'      },
  default: { img:'🎮', tag:'NBA2K26',      title:'NBA 2K26 PS5版 予約受付中',       old:'¥8,980',  price:'¥7,480',  url:'https://amzn.to/nba2k26'    },
};

// ---------- ダミー試合データ（APIフォールバック用） ----------
const GAMES_DUMMY = {
  '-2':[ { id:'d2a', status:'final',
    home:{ abbr:'MIL', city:'MILWAUKEE',     score:118 },
    away:{ abbr:'IND', city:'INDIANA',       score:112 },
    qh:[28,34,28,28], qa:[26,28,30,28],
    note:'ヤニス38得点の怪物パフォ', plays:[], hpl:[], apl:[] } ],
  '-1':[ { id:'d1a', status:'final',
    home:{ abbr:'MIN', city:'MINNESOTA',     score:122 },
    away:{ abbr:'UTA', city:'UTAH',          score:97  },
    qh:[30,32,30,30], qa:[24,24,25,24],
    note:'ミネソタ圧勝25点差', plays:[], hpl:[], apl:[] } ],
  '0':  [
    { id:'t0', status:'live', timeLeft:263, q:'Q3',
      home:{ abbr:'LAL', city:'LOS ANGELES',   score:89 },
      away:{ abbr:'GSW', city:'GOLDEN STATE',  score:84 },
      qh:[28,31,30], qa:[24,29,31],
      note:'河村12得点6AS🔥',
      plays:[
        { q:'Q3', t:'4:23', txt:'<strong>河村 勇輝</strong> ドライブレイアップ！12得点目🔥', s:true,  sc:'89-84' },
        { q:'Q3', t:'5:41', txt:'<strong>カリー</strong> コーナー3P！GSW3点差に迫る',         s:true,  sc:'87-84' },
      ],
      hpl:[ { num:8,  name:'河村 勇輝', pos:'PG', pts:12, ast:6, reb:2,  pm:'+8', on:true,  hot:true  },
            { num:23, name:'LeBron',    pos:'SF', pts:22, ast:8, reb:7,  pm:'+5', on:true,  hot:false },
            { num:3,  name:'A.Davis',   pos:'C',  pts:18, ast:2, reb:11, pm:'+3', on:true,  hot:false } ],
      apl:[ { num:30, name:'Curry',     pos:'PG', pts:28, ast:5, reb:3,  pm:'-2', on:true,  hot:true  },
            { num:11, name:'Thompson',  pos:'SG', pts:14, ast:1, reb:4,  pm:'-4', on:true,  hot:false } ] },
    { id:'t1', status:'pre', startTime:'12:00',
      home:{ abbr:'BOS', city:'BOSTON',        score:0 },
      away:{ abbr:'NYK', city:'NEW YORK',      score:0 },
      note:'テイタムvsブランソン', plays:[], hpl:[], apl:[] },
  ],
  '1':  [ { id:'m0', status:'pre', startTime:'10:00',
    home:{ abbr:'ATL', city:'ATLANTA',       score:0 },
    away:{ abbr:'ORL', city:'ORLANDO',       score:0 },
    note:'イースト8位争い', plays:[], hpl:[], apl:[] } ],
};
// ============================================================
