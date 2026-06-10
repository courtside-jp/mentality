import requests, json, os, re

FB_URL = 'https://mentality-nba-default-rtdb.firebaseio.com'
SITE_URL = 'https://courtside-jp.github.io/mentality'

# Firebaseから記事取得
res = requests.get(f'{FB_URL}/articles.json')
articles = res.json()

if not articles:
    print('記事なし')
    exit()

os.makedirs('articles', exist_ok=True)

for article_id, a in articles.items():
    if not isinstance(a, dict):
        continue
    title = a.get('title', 'COURTSIDE')
    img = a.get('img', f'{SITE_URL}/assets/ogp.png')
    body = a.get('body', '')
    # 本文から最初の100文字を説明文に
    desc = re.sub(r'<[^>]+>', '', body)[:100].replace('\n', ' ')
    if not img:
        img = f'{SITE_URL}/assets/ogp.png'

    html = f'''<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta property="og:type" content="article">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:image" content="{img}">
<meta property="og:url" content="{SITE_URL}/?article={article_id}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{title}">
<meta name="twitter:description" content="{desc}">
<meta name="twitter:image" content="{img}">
<meta http-equiv="refresh" content="0;url={SITE_URL}/?article={article_id}">
</head>
<body>
<p>リダイレクト中...</p>
</body>
</html>'''

    with open(f'articles/{article_id}.html', 'w') as f:
        f.write(html)
    print(f'生成: {article_id} - {title}')

print(f'完了: {len(articles)}記事')
