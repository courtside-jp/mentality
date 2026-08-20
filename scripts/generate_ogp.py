import requests, os, re, html
from datetime import datetime, timezone, timedelta

FB_URL = 'https://mentality-nba-default-rtdb.firebaseio.com'
SITE_URL = 'https://courtside-jp.github.io/mentality'
GA_ID = 'G-J1X9EM56WW'
JST = timezone(timedelta(hours=9))

os.makedirs('articles', exist_ok=True)
os.makedirs('sneakers', exist_ok=True)
os.makedirs('assets/thumbnails', exist_ok=True)


def localize_image(entity_id, img_url):
    """外部ホストの画像をリポジトリ内（assets/thumbnails/）にダウンロードして保存し、
    自前ホストのURLを返す。既に自前ドメインの画像や無効なURLはそのまま返す。
    ダウンロードに失敗した場合も元のURLを返す（フェイルセーフ）。
    """
    if not img_url or not img_url.startswith('http'):
        return img_url
    if img_url.startswith(SITE_URL):
        return img_url
    try:
        local_rel_path = f'assets/thumbnails/{entity_id}.jpg'
        resp = requests.get(img_url, timeout=20, headers={'User-Agent': 'Mozilla/5.0'})
        resp.raise_for_status()
        try:
            from PIL import Image
            import io
            im = Image.open(io.BytesIO(resp.content)).convert('RGB')
            target_ratio = 2.5  # サムネイルは5:2比率に統一
            w, h = im.size
            if w / h > target_ratio:
                new_w = int(h * target_ratio)
                left = (w - new_w) // 2
                im = im.crop((left, 0, left + new_w, h))
            else:
                new_h = int(w / target_ratio)
                top = min(int(h * 0.08), h - new_h)
                im = im.crop((0, top, w, top + new_h))
            im.thumbnail((1200, 480))
            im.save(local_rel_path, 'JPEG', quality=85, optimize=True)
        except Exception as pil_e:
            print(f'PIL圧縮に失敗（元画像をそのまま保存）: {entity_id} - {pil_e}')
            ext = img_url.split('?')[0].rsplit('.', 1)[-1].lower()
            if ext not in ('jpg', 'jpeg', 'png', 'gif', 'webp'):
                ext = 'jpg'
            local_rel_path = f'assets/thumbnails/{entity_id}.{ext}'
            with open(local_rel_path, 'wb') as imgf:
                imgf.write(resp.content)
        print(f'画像を自前ホスト化: {entity_id} -> {local_rel_path}')
        return f'{SITE_URL}/{local_rel_path}'
    except Exception as e:
        print(f'画像の自前ホスト化に失敗（元URLを使用）: {entity_id} - {e}')
        return img_url


def apply_inline_bold(escaped_text):
    return re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', escaped_text)


def is_heading_char(plain):
    return bool(plain) and ord(plain[0]) in (0x25A0, 0x25AA)


def generate_toc(body):
    """js/articles.js の generateTOC() と同じルール（■見出しが2つ以上あれば目次を表示）。"""
    if not body:
        return ''
    headings = []
    for line in body.split('\n'):
        t = line.strip()
        if not t:
            continue
        plain = re.sub(r'<[^>]+>', '', t).strip()
        if is_heading_char(plain):
            headings.append(plain)
    if len(headings) < 2:
        return ''
    items = ''
    for i, h in enumerate(headings):
        label = html.escape(re.sub(r'^[■▪]\s*', '', h))
        items += f'<li style="margin:3px 0;"><a href="#toc-{i}" style="color:#111;text-decoration:underline;font-size:12px;line-height:1.7;">{label}</a></li>'
    return (
        '<details style="background:#f8f8f8;border:1px solid #eee;border-radius:10px;margin:0 0 20px;overflow:hidden;">'
        '<summary style="padding:12px 16px;cursor:pointer;font-size:12px;font-weight:800;color:#555;letter-spacing:.08em;list-style:none;">'
        '目次 <span style="font-size:10px;color:#999;">&#9660;</span></summary>'
        f'<div style="padding:4px 16px 14px;"><ol style="margin:0;padding-left:20px;">{items}</ol></div>'
        '</details>'
    )


def render_body_html(body):
    """記事本文（プレーンテキスト）をHTMLに変換する。
    js/articles.js の renderBody() と同じルールを踏襲（■見出し・【】小見出し・太字・
    画像URL・YouTube/X/TikTok/Instagram埋め込み・商品/引用/ショップカード・段落）。
    独立記事ページ（/articles/{id}.html）で人間の読者にそのまま表示するためのフル版。
    """
    if not body:
        return ''
    out = []
    heading_idx = 0
    for line in body.split('\n'):
        t = line.strip()
        if not t:
            continue

        yt = re.search(r'(?:youtube\.com/(?:watch\?v=|shorts/)|youtu\.be/)([a-zA-Z0-9_-]{11})', t)
        if yt:
            out.append(
                f'<div style="margin:.8rem 0;"><iframe width="100%" height="200" '
                f'src="https://www.youtube.com/embed/{yt.group(1)}" frameborder="0" allowfullscreen '
                f'style="border-radius:10px;"></iframe></div>'
            )
            continue

        if 'tiktok.com' in t:
            vid_m = re.search(r'video/(\d+)', t)
            vid = vid_m.group(1) if vid_m else ''
            out.append(
                f'<div style="margin:.8rem 0;text-align:center;"><blockquote class="tiktok-embed" '
                f'cite="{html.escape(t)}" data-video-id="{vid}"><a href="{html.escape(t)}">TikTok動画</a></blockquote></div>'
            )
            continue

        if 'instagram.com' in t:
            out.append(
                f'<div style="margin:.8rem 0;"><blockquote class="instagram-media" '
                f'data-instgrm-permalink="{html.escape(t)}"><a href="{html.escape(t)}">Instagram投稿</a></blockquote></div>'
            )
            continue

        if 'twitter.com' in t or 'x.com' in t:
            out.append(
                f'<div class="tweet-embed-safe" style="margin:.8rem 0;max-height:700px;overflow-y:auto;'
                f'-webkit-overflow-scrolling:touch;"><blockquote class="twitter-tweet"><a href="{html.escape(t)}"></a></blockquote></div>'
            )
            continue

        if re.search(r'\.(jpg|jpeg|png|gif|webp)(\?.*)?$', t, re.IGNORECASE):
            out.append(
                f'<div style="margin:.8rem 0;"><img loading="lazy" decoding="async" src="{html.escape(t)}" '
                f'style="width:100%;border-radius:10px;" onerror="this.style.display=\'none\'"></div>'
            )
            continue

        product_match = re.match(r'^\[product name="([^"]*)" price="([^"]*)" url="([^"]*)"(?: img="([^"]*)")?\]$', t)
        if product_match:
            p_name, p_price, p_url, p_img = product_match.groups()
            icon_html = (
                f'<img loading="lazy" decoding="async" src="{html.escape(p_img)}" '
                f'style="width:44px;height:44px;object-fit:cover;border-radius:8px;flex-shrink:0;background:#fff;">'
                if p_img else '<div style="font-size:1.5rem;">&#128722;</div>'
            )
            price_html = f'<div style="font-size:.85rem;font-weight:700;color:#e63946;">{html.escape(p_price)}</div>' if p_price else ''
            out.append(
                f'<a href="{html.escape(p_url)}" target="_blank" rel="noopener sponsored" '
                f'style="display:block;text-decoration:none;margin:.8rem 0;background:#f5f5f5;border:1px solid #eee;border-radius:12px;padding:.8rem;">'
                f'<div style="display:flex;align-items:center;gap:.6rem;">{icon_html}'
                f'<div style="flex:1;min-width:0;"><div style="font-size:.82rem;font-weight:700;color:#222;margin-bottom:.2rem;">{html.escape(p_name)}</div>{price_html}</div>'
                f'<div style="background:#e63946;color:#fff;padding:.4rem .8rem;border-radius:8px;font-size:.72rem;font-weight:700;flex-shrink:0;">購入する</div></div></a>'
            )
            continue

        quote_match = re.match(r'^\[quote text="([^"]*)" name="([^"]*)" source="([^"]*)" url="([^"]*)"\]$', t)
        if quote_match:
            q_text, q_name, q_source, q_url = quote_match.groups()
            if q_url:
                src_html = (
                    f'<a href="{html.escape(q_url)}" target="_blank" '
                    f'style="display:inline-block;margin-top:.4rem;font-size:.65rem;color:#888;text-decoration:underline;">'
                    f'引用元：{html.escape(q_source or "リンク")}</a>'
                )
            elif q_source:
                src_html = f'<div style="margin-top:.4rem;font-size:.65rem;color:#888;">引用元：{html.escape(q_source)}</div>'
            else:
                src_html = ''
            name_html = f'<div style="margin-top:.5rem;font-size:.75rem;font-weight:700;color:#555;">— {html.escape(q_name)}</div>' if q_name else ''
            out.append(
                f'<div style="margin:1rem 0;padding:1rem 1.1rem;background:#f5f5f5;border-left:4px solid #e63946;border-radius:0 10px 10px 0;">'
                f'<div style="font-size:.92rem;font-style:italic;color:#222;line-height:1.75;">{apply_inline_bold(html.escape(q_text))}</div>'
                f'{name_html}{src_html}</div>'
            )
            continue

        shopcard_match = re.match(
            r'^\[shopcard name="([^"]*)" img="([^"]*)" rakuten="([^"]*)" rakutenPrice="([^"]*)" amazon="([^"]*)" amazonPrice="([^"]*)"\]$', t
        )
        if shopcard_match:
            sc_name, sc_img, sc_rakuten, sc_rakuten_price, sc_amazon, sc_amazon_price = shopcard_match.groups()
            active = 'background:#e63946;color:#fff;'
            inactive = 'background:#eee;color:#888;'
            if sc_rakuten:
                rakuten_btn = (
                    f'<a href="{html.escape(sc_rakuten)}" target="_blank" '
                    f'style="flex:1;text-align:center;text-decoration:none;padding:.5rem .3rem;border-radius:9px;font-size:.68rem;font-weight:700;line-height:1.5;{active}">'
                    f'楽天{"<br>" + html.escape(sc_rakuten_price) if sc_rakuten_price else ""}</a>'
                )
            else:
                rakuten_btn = f'<span style="flex:1;text-align:center;padding:.5rem .3rem;border-radius:9px;font-size:.68rem;font-weight:700;line-height:1.5;{inactive}">楽天<br>取扱なし</span>'
            if sc_amazon:
                amazon_btn = (
                    f'<a href="{html.escape(sc_amazon)}" target="_blank" '
                    f'style="flex:1;text-align:center;text-decoration:none;padding:.5rem .3rem;border-radius:9px;font-size:.68rem;font-weight:700;line-height:1.5;{active}">'
                    f'Amazon{"<br>" + html.escape(sc_amazon_price) if sc_amazon_price else ""}</a>'
                )
            else:
                amazon_btn = f'<span style="flex:1;text-align:center;padding:.5rem .3rem;border-radius:9px;font-size:.68rem;font-weight:700;line-height:1.5;{inactive}">Amazon<br>取扱なし</span>'
            out.append(
                f'<div style="display:flex;gap:.7rem;align-items:center;background:#f5f5f5;border:1px solid #eee;border-radius:12px;padding:.7rem;margin:.7rem 0;">'
                f'<img loading="lazy" decoding="async" src="{html.escape(sc_img)}" style="width:52px;height:52px;object-fit:cover;border-radius:8px;flex-shrink:0;background:#fff;">'
                f'<div style="flex:1;min-width:0;"><div style="font-size:.78rem;font-weight:700;color:#222;margin-bottom:.45rem;line-height:1.4;">{html.escape(sc_name)}</div>'
                f'<div style="display:flex;gap:.4rem;">{rakuten_btn}{amazon_btn}</div></div></div>'
            )
            continue

        if t.startswith('http://') or t.startswith('https://'):
            out.append(f'<p style="margin:.6em 0;font-size:.92rem;"><a href="{html.escape(t)}" target="_blank" rel="noopener">{html.escape(t)}</a></p>')
            continue

        # ■ / ▪ → 大見出し（目次と連動する id 付き）
        plain = re.sub(r'<[^>]+>', '', t).strip()
        if is_heading_char(plain):
            label = apply_inline_bold(html.escape(plain))
            out.append(
                f'<h2 id="toc-{heading_idx}" style="font-size:1.05rem;font-weight:800;margin:1.7em 0 .5em;'
                f'color:#111;border-left:4px solid #e63946;padding-left:.5em;">{label}</h2>'
            )
            heading_idx += 1
            continue

        # 【...】→ 小見出し
        if plain.startswith('【') and '】' in plain:
            out.append(
                f'<h3 style="font-size:.95rem;font-weight:700;margin:1.4em 0 .5em;padding:7px 12px;'
                f'background:linear-gradient(90deg,rgba(230,57,70,.07),transparent);border-left:3px solid #e63946;'
                f'border-radius:0 6px 6px 0;">{apply_inline_bold(html.escape(plain))}</h3>'
            )
            continue

        out.append(f'<p style="margin:.6em 0;font-size:.92rem;">{apply_inline_bold(t)}</p>')
    return ''.join(out)


def render_related_html(current_id, category, all_articles):
    """js/articles.js の renderRelatedArticles() と同じルール
    （同じカテゴリ優先、足りない分は新着で補完。最大4件）。"""
    if not all_articles:
        return ''
    now_ms = datetime.now().timestamp() * 1000
    lst = []
    for aid, a in all_articles.items():
        if not isinstance(a, dict) or aid == current_id:
            continue
        if a.get('status') == 'archived':
            continue
        pub = a.get('publishAt')
        if pub and pub > now_ms:
            continue
        lst.append({'id': aid, **a})
    same = sorted([a for a in lst if a.get('category') == category], key=lambda a: a.get('ts', 0) or 0, reverse=True)
    others = sorted([a for a in lst if a.get('category') != category], key=lambda a: a.get('ts', 0) or 0, reverse=True)
    picked = (same + others)[:4]
    if not picked:
        return ''
    cards = ''
    for a in picked:
        img = a.get('img') or ''
        img_tag = (
            f'<img loading="lazy" decoding="async" src="{html.escape(img)}" '
            f'style="width:64px;height:48px;object-fit:cover;border-radius:6px;flex-shrink:0;">'
        ) if img else ''
        cards += (
            f'<a href="{SITE_URL}/articles/{a["id"]}.html" style="display:flex;gap:.7rem;align-items:center;'
            f'text-decoration:none;background:#f5f5f5;border:1px solid #eee;border-radius:10px;padding:.5rem;">'
            f'{img_tag}<div style="min-width:0;">'
            f'<div style="font-size:.55rem;color:#e63946;font-weight:700;margin-bottom:.2rem;">{html.escape(a.get("category") or "NBA")}</div>'
            f'<div style="font-size:.78rem;color:#222;line-height:1.4;">{html.escape(a.get("title") or "")}</div>'
            f'</div></a>'
        )
    return (
        '<div style="margin-top:1.4rem;padding-top:1rem;border-top:1px solid #eee;">'
        '<div style="font-weight:700;font-size:.85rem;margin-bottom:.6rem;color:#111;">関連記事</div>'
        f'<div style="display:flex;flex-direction:column;gap:.6rem;">{cards}</div></div>'
    )


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
        img = localize_image(article_id, img)
        body = a.get('body', '')
        category = a.get('category', 'NBA')
        affiliate_link = a.get('affiliateLink', '')
        ts = a.get('ts')
        date_str = datetime.fromtimestamp(ts / 1000, JST).strftime('%Y年%m月%d日') if ts else ''

        desc = re.sub(r'<[^>]+>', '', body)[:110].replace('\n', ' ').strip()
        title_esc = html.escape(title)
        desc_esc = html.escape(desc)
        toc_html = generate_toc(body)
        body_html = render_body_html(body)
        related_html = render_related_html(article_id, category, articles)
        article_url = f'{SITE_URL}/articles/{article_id}.html'
        share_text = f'{title} #COURTSIDE #NBA {article_url}'
        share_url = 'https://twitter.com/intent/tweet?text=' + requests.utils.quote(share_text)

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
<script async src="https://www.googletagmanager.com/gtag/js?id={GA_ID}"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){{dataLayer.push(arguments);}}gtag('js',new Date());gtag('config','{GA_ID}');</script>
<style>
body{{font-family:-apple-system,BlinkMacSystemFont,"Hiragino Kaku Gothic ProN","Hiragino Sans",sans-serif;max-width:680px;margin:0 auto;padding:20px 16px 60px;line-height:1.85;color:#222;}}
.back{{color:#e63946;text-decoration:none;font-size:.85rem;font-weight:700;}}
h1{{font-size:1.35rem;font-weight:800;margin:1rem 0 .3rem;line-height:1.4;}}
.meta{{color:#888;font-size:.78rem;margin-bottom:1.2rem;}}
.meta span{{background:#e63946;color:#fff;padding:.15rem .6rem;border-radius:6px;font-size:.68rem;margin-right:.5rem;}}
img{{max-width:100%;border-radius:10px;display:block;margin:.8em 0;}}
.top-img{{width:100%;border-radius:12px;margin-bottom:1rem;}}
.share{{display:inline-flex;align-items:center;gap:.4rem;background:#000;color:#fff;padding:.6rem 1.2rem;border-radius:10px;font-size:.8rem;font-weight:700;text-decoration:none;}}
.aff{{display:flex;align-items:center;gap:.5rem;text-decoration:none;margin-top:1.4rem;padding:.8rem 1rem;background:#f5f5f5;border:1px solid #eee;border-radius:12px;color:#e63946;font-weight:700;font-size:.9rem;}}
</style>
</head>
<body>
<p><a class="back" href="{SITE_URL}/">&larr; COURTSIDE トップへ</a></p>
<img class="top-img" src="{img}" alt="" onerror="this.style.display='none'">
<h1>{title_esc}</h1>
<div class="meta"><span>{html.escape(category)}</span>{date_str}</div>
{toc_html}
{body_html}
{f'<a class="aff" href="{affiliate_link}" rel="sponsored">&#128722; 商品を見る</a>' if affiliate_link else ''}
<div style="margin-top:1.4rem;padding-top:1rem;border-top:1px solid #eee;text-align:center;">
<a class="share" href="{share_url}" target="_blank">X この記事をシェア</a>
</div>
{related_html}
<script async src="https://platform.twitter.com/widgets.js"></script>
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

# ==================== 孤立ページの自動削除 ====================
# Firebase側で記事が削除された後も、生成済みの静的ページ（articles/*.html）が
# リポジトリに残り続けると、古いページとして放置されてしまう。
# ここで「現在Firebaseに存在する記事IDに対応しない静的ページ」を自動的に削除する。
import glob as _cleanup_glob
_valid_article_ids = set(articles.keys()) if articles else set()
for _existing_path in _cleanup_glob.glob('articles/*.html'):
    _existing_id = os.path.basename(_existing_path)[:-len('.html')]
    if _existing_id not in _valid_article_ids:
        os.remove(_existing_path)
        print(f'孤立ページを削除（Firebase上に記事なし）: {_existing_path}')

# ==================== 自動検証（回帰防止） ====================
# 記事ページは2026年からリダイレクトなしの「独立ページ」方式に変更した。
# 生成後の全記事ページを機械的にチェックし、異常を検知した場合はワークフローを
# 失敗させて壊れたページを公開しないようにする。
import glob as _glob

_validation_errors = []
for _path in sorted(_glob.glob('articles/*.html')):
    with open(_path, encoding='utf-8') as _f:
        _page = _f.read()

    _canon_m = re.search(r'<link rel="canonical" href="([^"]+)">', _page)
    _img_m = re.search(r'<meta property="og:image" content="([^"]+)">', _page)
    _h1_m = re.search(r'<h1>(.*?)</h1>', _page)

    _canon_url = _canon_m.group(1) if _canon_m else None
    _img_url = _img_m.group(1) if _img_m else None

    if not _canon_url:
        _validation_errors.append(f'{_path}: canonical URLが見つかりません')
    _expected_canon = f'{SITE_URL}/{_path}'
    if _canon_url and _canon_url != _expected_canon:
        _validation_errors.append(
            f'{_path}: canonical URLが想定と異なります（期待={{_expected_canon}} 実際={{_canon_url}}）'
        )
    if not _img_url or not _img_url.startswith('http'):
        _validation_errors.append(f'{_path}: og:imageが不正または未設定です（{{_img_url}}）')
    if not _h1_m or not _h1_m.group(1).strip():
        _validation_errors.append(f'{_path}: 記事タイトル(h1)が見つかりません（本文が空の可能性）')

if _validation_errors:
    print('=== 検証エラー: 生成された記事ページに問題が見つかりました ===')
    for _e in _validation_errors:
        print(f'  - {{_e}}')
    raise SystemExit(f'{{len(_validation_errors)}}件の検証エラーのため処理を中断しました')
else:
    print(f'検証OK: {{article_count}}記事のページに異常なし')


# ==================== バッシュ（sneakers）====================
res = requests.get(f'{FB_URL}/sneakers.json')
sneakers = res.json()

sneaker_count = 0
if sneakers:
    for sneaker_id, s in sneakers.items():
        if not isinstance(s, dict):
            continue
        publish_at = s.get('publishAt')
        if publish_at and publish_at > datetime.now().timestamp() * 1000:
            continue  # 予約投稿はまだ公開しない

        brand = s.get('brand', '')
        model = s.get('model', '')
        title = f'{brand} {model}'.strip() or 'COURTSIDE バッシュ詳細'
        img = (s.get('images') or [None])[0] or s.get('img') or f'{SITE_URL}/assets/ogp.png'
        img = localize_image(sneaker_id, img)
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
<script>(function(){{var u=navigator.userAgent||'';if(!/bot|crawl|spider|facebookexternalhit|Twitterbot|Slackbot|LinkedInBot|WhatsApp|Discordbot|TelegramBot|Googlebot|bingbot|Applebot|Baiduspider|Yandex|Pinterest|SkypeUriPreview/i.test(u)){{try{{location.replace('{sneaker_url}');}}catch(e){{}}}}}})();</script>
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
<p><a class="back" href="{SITE_URL}/">&larr; COURTSIDE トップへ</a></p>
<img class="top-img" src="{img}" alt="" onerror="this.style.display='none'">
<h1>{title_esc}</h1>
<div class="meta">{f'<span>{html.escape(player_role_label)}</span>' if player else ''}{html.escape(player) if player else ''}{(' ・ ' + date_str) if player and date_str else date_str}</div>
<p>{desc_esc}</p>
<a class="cta" href="{sneaker_url}">COURTSIDEアプリで詳細を見る・シェアする &rarr;</a>
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
