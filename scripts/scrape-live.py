#!/usr/bin/env python3
"""
Full migration scrape of amrutmaharashtra.org.

1. The 16 category pages list every story in that category (no pagination):
   id, title, excerpt, cover, author, date.
2. Every listed story's news.php page gives the body, summary, images,
   district, publisher, date and time.
3. about_us.php and the family-registration page are saved as raw HTML for
   their own templates.

Output (not committed; rebuilt into the site by scripts/build-data.mjs):
  scrape/categories.json   {catKey: {mr, items:[...]}}
  scrape/articles/<id>.json
  scrape/pages/*.html

    python3 scripts/scrape-live.py            # resumes: skips articles already saved
"""
import html
import json
import re
import sys
import time
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

BASE = 'https://amrutmaharashtra.org/'
OUT = Path(__file__).resolve().parent.parent / 'scrape'
UA = {'User-Agent': 'Mozilla/5.0 (AMRUT redesign migration; contact vyom.vs95@gmail.com)'}

CATS = ['Amrut Events', 'Beneficiary Story', 'Blog', 'Articles', 'Words Amrut', 'Women Power', 'Tourism',
        'Today Special', 'Successful Entrepreneur', 'Spirituality', 'Social Situation', 'Smart Farmer',
        'News', 'Govet_Schemes', 'Capable Student', 'Amrut Service']


def get(url, tries=4):
    for t in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=40) as r:
                return r.read().decode('utf-8', 'ignore')
        except Exception as e:  # noqa: BLE001
            if t == tries - 1:
                print('FAIL', url, e, file=sys.stderr)
                return None
            time.sleep(2 + 3 * t)


def text(s):
    s = re.sub(r'<br\s*/?>', '\n', s)
    s = re.sub(r'<[^>]+>', '', s)
    return html.unescape(s).replace('\xa0', ' ').strip()


def scrape_categories():
    cats = {}
    for key in CATS:
        page = get(BASE + 'category_news.php?category=' + urllib.parse.quote_plus(key))
        mr = ''
        m = re.search(r'<title>([^<]+)</title>', page or '')
        items = []
        for card in re.findall(r'<div class="card h-100[\s\S]*?</small>', page or ''):
            id_ = re.search(r'news\.php\?id=(\d+)', card)
            if not id_:
                continue
            im = re.search(r'<img src="([^"]+)"', card)
            t = re.search(r'card-title[^>]*>([\s\S]*?)</h5>', card)
            x = re.search(r'card-text[^>]*>([\s\S]*?)</p>', card)
            foot = re.search(r'fa-user[^>]*></i>\s*([^|<]*)\|[\s\S]*?fa-calendar-alt[^>]*></i>\s*([^<]*)', card)
            items.append({
                'id': id_.group(1),
                't': text(t.group(1)) if t else '',
                'x': text(x.group(1)) if x else '',
                'im': im.group(1) if im else '',
                'au': text(foot.group(1)) if foot else '',
                'dt': text(foot.group(2)) if foot else '',
            })
        cats[key] = {'mr': mr, 'title': text(m.group(1)) if m else '', 'items': items}
        print(f'{key}: {len(items)}', flush=True)
    return cats


def meta(page, label):
    m = re.search(r'<strong>' + label + r':</strong>\s*<span class="meta-value">([^<]*)</span>', page)
    return text(m.group(1)) if m else ''


def scrape_article(id_):
    f = OUT / 'articles' / f'{id_}.json'
    if f.exists():
        return 'skip'
    page = get(f'{BASE}news.php?id={id_}')
    if not page or 'news-title' not in page:
        return 'missing'
    title = re.search(r'<h1 class="news-title">([\s\S]*?)</h1>', page)
    summ = re.search(r'<div class="news-summary">([\s\S]*?)</div>', page)
    i = page.find('<div class="news-content">')
    j = page.find('<div class="mobile-meta-section">', i)
    content = page[i:j] if i >= 0 else ''
    paras = []
    for p in re.findall(r'<p[^>]*>([\s\S]*?)</p>', content):
        t = text(p)
        if t:
            paras.append(t)
    if not paras and content:
        t = text(content)
        paras = [x.strip() for x in t.split('\n') if x.strip()]
    imgsec = page[page.find('images-section'):i] if i >= 0 else ''
    images = [s for s in re.findall(r'<img src="([^"]+)"', imgsec) if s.startswith('photos/')]
    images += [s for s in re.findall(r'<img[^>]+src="([^"]+)"', content) if s.startswith('photos/') or s.startswith('http')]
    yt = re.findall(r'(?:youtube\.com/embed/|youtu\.be/)([\w-]{11})', page[i:j] if i >= 0 else '')
    art = {
        'id': str(id_),
        'title': text(title.group(1)) if title else '',
        'summary': text(summ.group(1)) if summ else '',
        'body': paras,
        'images': list(dict.fromkeys(images)),
        'youtube': list(dict.fromkeys(yt)),
        'author': meta(page, 'Publisher'),
        'date': meta(page, 'Date'),
        'time': meta(page, 'Time'),
        'district': meta(page, 'District'),
    }
    f.write_text(json.dumps(art, ensure_ascii=False))
    return 'ok'


def main():
    (OUT / 'articles').mkdir(parents=True, exist_ok=True)
    (OUT / 'pages').mkdir(exist_ok=True)
    for name in ['index.php', 'about_us.php', 'amrut_family_registration.php']:
        p = get(BASE + name)
        if p:
            (OUT / 'pages' / name.replace('.php', '.html')).write_text(p)
    cats = scrape_categories()
    (OUT / 'categories.json').write_text(json.dumps(cats, ensure_ascii=False))
    ids = sorted({it['id'] for c in cats.values() for it in c['items']}, key=int, reverse=True)
    print('unique stories:', len(ids), flush=True)
    stats = {}
    with ThreadPoolExecutor(6) as ex:
        for n, r in enumerate(ex.map(scrape_article, ids), 1):
            stats[r] = stats.get(r, 0) + 1
            if n % 200 == 0:
                print(n, stats, flush=True)
    print('done', stats)


if __name__ == '__main__':
    main()
