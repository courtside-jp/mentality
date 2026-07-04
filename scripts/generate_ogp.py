import requests, os, re, html
from datetime import datetime, timezone, timedelta

FB_URL = 'https://mentality-nba-default-rtdb.firebaseio.com'
SITE_URL = 'https://courtside-jp.github.io/mentality'
JST = timezone(timedelta(hours=9))

# Firebaseから記事取得
res = requests.get(f'{FB_URL}/articles.json')
articles = res.json()

if not articles:
    print('記事なし')
    exit()

os.makedirs('articles', exist_ok=True)


def render_body_html(body):
    """記事本文（プレーンテキスト）を簡易HTMLに変換する。
    js/articles.js の renderBody() と同じルールを踏襲（■見出し・【】小見出し・画像URL・段落）。
    検索エンジン向けに本文をそのままページ内に出すためのシンプル版。
    """
    if not body:
        return ''
    lines = body.split('\n')
    out = []
    for line in lines:
        t = line.strip()
        if not t:
            out.append('<br>')
            continue
        plain = re.sub(r'<[^>]+>', '', t).strip()
        # ■ / ▪ → 大見出し
        if plain and ord(plain[0]) in (0x25A0, 0x25AA):
            out.append(f'<h2>{html.escape(plain)}</h2>')
            continue
        # 【...】→ 小見出し
        if plain.startswith('【') and '】' in plain:
            out.append(f'<h3>{html.escape(plain)}</h3>')
            continue
        # 画像URL
        if re.search(r'\.(jpg|jpeg|png|gif|webp)(\?.*)?$', t, re.IGNORECASE):
            out.append(f'<img src="{html.escape(t)}" alt="">')
            continue
        # YouTube / SNS等のURL単体行はリンクとして表示（埋め込みはSPA側のみ）
        if t.startswith('http://') or t.startswith('https://'):
            out.append(f'<p><a href="{html.escape(t)}" target="_blank" rel="noopener">{html.escape(t)}</a></p>')
            continue
        out.append(f'<p>{html.escape(t)}</p>')
    return ''.join(out)


sitemap_urls = [
    {'loc': f'{SITE_URL}/', 'priority': '1.0', 'changefreq': 'daily'},
]

count = 0
for article_id, a in articles.items():
    if not isinstance(a, dict):
        continue
    if a.get('status') == 'archived':
        continue
    publish_at = a.get('publishAt')
    if publish_at and publish_at > datetime.now().timestamp() * 1000:
        continue  # 予約投稿はまだ公開しない

    title = a.get('title', 'COURTSIDE')
    img = a.get('img') or f'{SITE_URL}/assets/ogp.png'
    body = a.get('body', '')
    category = a.get('category', 'NBA')
    ts = a.get('ts')
    date_str = datetime.fromtimestamp(ts / 1000, JST).strftime('%Y年%m月%d日') if ts else ''

    desc = re.sub(r'<[^>]+>', '', body)[:110].replace('\n', ' ').strip()
    title_esc = html.escape(title)
    desc_esc = html.escape(desc)
    body_html = render_body_html(body)
    article_url = f'{SITE_URL}/?article={article_id}'

    html_out = f'''<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title_esc} | COURTSIDE</title>
<meta name="description" content="{desc_esc}">
<link rel="canonical" href="{article_url}">
<meta property="og:type" content="article">
<meta property="og:title" content="{title_esc}">
<meta property="og:description" content="{desc_esc}">
<meta property="og:image" content="{img}">
<meta property="og:url" content="{article_url}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{title_esc}">
<meta name="twitter:description" content="{desc_esc}">
<meta name="twitter:image" content="{img}">
<style>
body{{font-family:-apple-system,BlinkMacSystemFont,"Hiragino Kaku Gothic ProN","Hiragino Sans",sans-serif;max-width:680px;margin:0 auto;padding:20px 16px 60px;line-height:1.85;color:#222;}}
.back{{color:#e63946;text-decoration:none;font-size:.85rem;font-weight:700;}}
h1{{font-size:1.35rem;font-weight:800;margin:1rem 0 .3rem;line-height:1.4;}}
.meta{{color:#888;font-size:.78rem;margin-bottom:1.2rem;}}
.meta span{{background:#e63946;color:#fff;padding:.15rem .6rem;border-radius:6px;font-size:.68rem;margin-right:.5rem;}}
h2{{font-size:1.05rem;font-weight:800;margin:1.7em 0 .5em;color:#111;border-left:4px solid #e63946;padding-left:.5em;}}
h3{{font-size:.95rem;font-weight:700;margin:1.4em 0 .5em;}}
p{{margin:.6em 0;font-size:.92rem;}}
img{{max-width:100%;border-radius:10px;display:block;margin:.8em 0;}}
.top-img{{width:100%;border-radius:12px;margin-bottom:1rem;}}
.cta{{display:block;text-align:center;background:#000;color:#fff;text-decoration:none;padding:14px;border-radius:10px;font-weight:700;margin:2.2rem 0 1rem;font-size:.9rem;}}
</style>
</head>
<body>
<p><a class="back" href="{SITE_URL}/">← COURTSIDE トップへ</a></p>
<img class="top-img" src="{img}" alt="" onerror="this.style.display='none'">
<h1>{title_esc}</h1>
<div class="meta"><span>{html.escape(category)}</span>{date_str}</div>
{body_html}
<a class="cta" href="{article_url}">COURTSIDEアプリで読む・シェアする →</a>
</body>
</html>'''

    with open(f'articles/{article_id}.html', 'w', encoding='utf-8') as f:
        f.write(html_out)
    sitemap_urls.append({
        'loc': f'{SITE_URL}/articles/{article_id}.html',
        'priority': '0.8',
        'changefreq': 'weekly',
    })
    count += 1
    print(f'生成: {article_id} - {title}')

# sitemap.xml も同時に更新（実在するページのURLのみを列挙）
sitemap_xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
for u in sitemap_urls:
    sitemap_xml += f"  <url>\n    <loc>{u['loc']}</loc>\n    <changefreq>{u['changefreq']}</changefreq>\n    <priority>{u['priority']}</priority>\n  </url>\n"
sitemap_xml += '</urlset>\n'

with open('sitemap.xml', 'w', encoding='utf-8') as f:
    f.write(sitemap_xml)

print(f'完了: {count}記事 + sitemap.xml更新（{len(sitemap_urls)}URL）')
