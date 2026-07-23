import requests, os, re, html
from datetime import datetime, timezone, timedelta

FB_URL = 'https://mentality-nba-default-rtdb.firebaseio.com'
SITE_URL = 'https://courtside-jp.github.io/mentality'
JST = timezone(timedelta(hours=9))

os.makedirs('articles', exist_ok=True)
os.makedirs('sneakers', exist_ok=True)


def apply_inline_bold(escaped_text):
    return re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', escaped_text)


def render_body_html(body):
    """記事本文（プレーンテキスト）を簡易HTMLに変換する。
    js/articles.js の renderBody() と同じルールを踏襲（■見出し・【】小見出し・太字・画像URL・段落）。
    検索エンジン向けに本文をそのままページ内に出すためのシンプル版。
    """
    if not body:
        return ''
    lines = body.split('\n')
    out = []
    for line in lines:
        t = line.strip()
        if not t:
            continue
        plain = re.sub(r'<[^>]+>', '', t).strip()
        # ■ / ▪ → 大見出し
        if plain and ord(plain[0]) in (0x25A0, 0x25AA):
            out.append(f'<h2>{apply_inline_bold(html.escape(plain))}</h2>')
            continue
        # 【...】→ 小見出し
        if plain.startswith('【') and '】' in plain:
            out.append(f'<h3>{apply_inline_bold(html.escape(plain))}</h3>')
            continue
        # 画像URL
        if re.search(r'\.(jpg|jpeg|png|gif|webp)(\?.*)?$', t, re.IGNORECASE):
            out.append(f'<img src="{html.escape(t)}" alt="">')
            continue
        # YouTube / SNS等のURL単体行はリンクとして表示（埋め込みはSPA側のみ）
        if t.startswith('http://') or t.startswith('https://'):
            out.append(f'<p><a href="{html.escape(t)}" target="_blank" rel="noopener">{html.escape(t)}</a></p>')
            continue
        # 商品リンク [product name="..." price="..." url="..."]
        product_match = re.match(r'^\[product name="([^"]*)" price="([^"]*)" url="([^"]*)"\]$', t)
        if product_match:
            p_name, p_price, p_url = product_match.groups()
            price_html = f' <strong>{html.escape(p_price)}</strong>' if p_price else ''
            out.append(
                f'<p><a href="{html.escape(p_url)}" target="_blank" rel="noopener sponsored" '
                f'style="display:block;text-decoration:none;background:#f5f5f5;border-radius:10px;padding:.8rem;">'
                f'🛒 {html.escape(p_name)}{price_html}</a></p>'
            )
            continue
        out.append(f'<p>{apply_inline_bold(t)}</p>')
    return ''.join(out)


sitemap_urls = [
    {'loc': f'{SITE_URL}/', 'priority': '1.0', 'changefreq': 'daily'},
]

# ==================== 記事（articles）====================
res = requests.get(f'{FB_URL}/articles.json')
articles = res.json()

article_count = 0
if articles:
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
        affiliate_link = a.get('affiliateLink', '')
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
.aff{{display:flex;align-items:center;gap:.5rem;text-decoration:none;margin-top:1.4rem;padding:.8rem 1rem;background:#f5f5f5;border:1px solid #eee;border-radius:12px;color:#e63946;font-weight:700;font-size:.9rem;}}
</style>
</head>
<body>
<p><a class="back" href="{SITE_URL}/">← COURTSIDE トップへ</a></p>
<img class="top-img" src="{img}" alt="" onerror="this.style.display='none'">
<h1>{title_esc}</h1>
<div class="meta"><span>{html.escape(category)}</span>{date_str}</div>
{body_html}
{f'<a class="aff" href="{affiliate_link}" rel="sponsored">🛒 商品を見る</a>' if affiliate_link else ''}
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
        article_count += 1
        print(f'記事生成: {article_id} - {title}')
else:
    print('記事なし')

# ==================== バッシュ（sneakers）====================
res = requests.get(f'{FB_URL}/sneakers.json')
sneakers = res.json()

sneaker_count = 0
if sneakers:
    for sneaker_id, s in sneakers.items():
        if not isinstance(s, dict):
            continue

        brand = s.get('brand', '')
        model = s.get('model', '')
        title = f'{brand} {model}'.strip() or 'COURTSIDE バッシュ詳細'
        img = (s.get('images') or [None])[0] or s.get('img') or f'{SITE_URL}/assets/ogp.png'
        desc = (s.get('desc') or (s.get('detail') or {}).get('summary') or f'{title} のレビュー・スコア・購入情報をCOURTSIDEでチェック。')
        desc = re.sub(r'<[^>]+>', '', desc)[:110].replace('\n', ' ').strip()
        player = s.get('player', '')
        player_role_label = 'シグネイチャーモデル' if s.get('playerRole') == 'signature' else '着用選手'
        ts = s.get('ts')
        date_str = datetime.fromtimestamp(ts / 1000, JST).strftime('%Y年%m月%d日') if ts else ''

        title_esc = html.escape(title)
        desc_esc = html.escape(desc)
        sneaker_url = f'{SITE_URL}/?sneaker={sneaker_id}'

        html_out = f'''<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title_esc} | COURTSIDE</title>
<meta name="description" content="{desc_esc}">
<link rel="canonical" href="{sneaker_url}">
<meta property="og:type" content="product">
<meta property="og:title" content="{title_esc}">
<meta property="og:description" content="{desc_esc}">
<meta property="og:image" content="{img}">
<meta property="og:url" content="{sneaker_url}">
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
p{{margin:.6em 0;font-size:.92rem;}}
.top-img{{width:100%;border-radius:12px;margin-bottom:1rem;}}
.cta{{display:block;text-align:center;background:#000;color:#fff;text-decoration:none;padding:14px;border-radius:10px;font-weight:700;margin:2.2rem 0 1rem;font-size:.9rem;}}
</style>
</head>
<body>
<p><a class="back" href="{SITE_URL}/">← COURTSIDE トップへ</a></p>
<img class="top-img" src="{img}" alt="" onerror="this.style.display='none'">
<h1>{title_esc}</h1>
<div class="meta">{f'<span>{html.escape(player_role_label)}</span>' if player else ''}{html.escape(player) if player else ''}{(' ・ ' + date_str) if player and date_str else date_str}</div>
<p>{desc_esc}</p>
<a class="cta" href="{sneaker_url}">COURTSIDEアプリで詳細を見る・シェアする →</a>
</body>
</html>'''

        with open(f'sneakers/{sneaker_id}.html', 'w', encoding='utf-8') as f:
            f.write(html_out)
        sitemap_urls.append({
            'loc': f'{SITE_URL}/sneakers/{sneaker_id}.html',
            'priority': '0.8',
            'changefreq': 'weekly',
        })
        sneaker_count += 1
        print(f'バッシュ生成: {sneaker_id} - {title}')
else:
    print('バッシュなし')

# sitemap.xml も同時に更新（実在するページのURLのみを列挙）
sitemap_xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
for u in sitemap_urls:
    sitemap_xml += f"  <url>\n    <loc>{u['loc']}</loc>\n    <changefreq>{u['changefreq']}</changefreq>\n    <priority>{u['priority']}</priority>\n  </url>\n"
sitemap_xml += '</urlset>\n'

with open('sitemap.xml', 'w', encoding='utf-8') as f:
    f.write(sitemap_xml)

# ワークフロー側のyml（git add articles/）を編集しなくても済むように、
# sneakers/ もこのスクリプト自身でgit stagingに追加する（ワークフローのPAT権限に workflow scope が無くてもOK）。
# このスクリプト自身でsitemap.xmlをgit stagingに追加しておく。
# 後続のワークフローの commit ステップがそのままsitemap.xmlも一緒にコミットしてくれる。
import subprocess
try:
    subprocess.run(['git', 'add', 'sitemap.xml', 'sneakers/'], check=True)
    print('sitemap.xml / sneakers/ を git add しました')
except Exception as e:
    print(f'git add に失敗（無視して続行）: {e}')

print(f'完了: {article_count}記事 + {sneaker_count}バッシュ + sitemap.xml更新（{len(sitemap_urls)}URL）')
