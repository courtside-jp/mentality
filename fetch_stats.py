import urllib.request
import json
import time
import unicodedata

def fetch(url, extra_headers=False):
    req = urllib.request.Request(url)
    req.add_header('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
    if extra_headers:
        req.add_header('Referer', 'https://www.nba.com/')
        req.add_header('x-nba-stats-origin', 'stats')
        req.add_header('x-nba-stats-token', 'true')
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())

def norm(s):
    return unicodedata.normalize('NFD', s).encode('ascii', 'ignore').decode('ascii').lower()

data = {}

# NBAスタッツリーダー
BASE = "https://stats.nba.com/stats/leagueleaders?LeagueID=00&PerMode=PerGame&Scope=S&Season=2025-26"
BASE_TOT = "https://stats.nba.com/stats/leagueleaders?LeagueID=00&PerMode=Totals&Scope=S&Season=2025-26"

for stat, key in [('PTS','pts'),('AST','ast'),('REB','reb'),('STL','stl'),('BLK','blk'),('TOV','to'),('MIN','min'),('FG3M','fg3m')]:
    try:
        data[key] = fetch(f"{BASE}&SeasonType=Regular+Season&StatCategory={stat}", True)
        data[key+'_tot'] = fetch(f"{BASE_TOT}&SeasonType=Regular+Season&StatCategory={stat}", True)
        print(f"OK: {key}")
    except Exception as e:
        print(f"NG: {key} - {e}")

try:
    data['po_pts'] = fetch(f"{BASE}&SeasonType=Playoffs&StatCategory=PTS", True)
    print("OK: po_pts")
except Exception as e:
    print(f"NG: po_pts - {e}")

try:
    pts_tot = fetch(f"{BASE_TOT}&SeasonType=Regular+Season&StatCategory=PTS", True)
    rs_tot = pts_tot['resultSet']
    headers_tot = rs_tot['headers']
    for pct_key, col, att_col, min_att in [('fg','FG_PCT','FGA',300),('fg3','FG3_PCT','FG3A',82),('ft','FT_PCT','FTA',125)]:
        col_idx = headers_tot.index(col)
        att_idx = headers_tot.index(att_col)
        filtered = [r for r in rs_tot['rowSet'] if r[att_idx] >= min_att]
        data[pct_key] = {'resultSet': {'headers': headers_tot, 'rowSet': sorted(filtered, key=lambda r: r[col_idx], reverse=True)}}
        print(f"OK: {pct_key} ({len(filtered)}人)")
except Exception as e:
    print(f"NG: pct - {e}")

# ESPNロスター（全選手・身長・生年・ポジション）
team_fix = {'GS':'GSW','NY':'NYK','NO':'NOP','SA':'SAS','UTAH':'UTA','WSH':'WAS'}
espnid_map = {}
roster = {}

for tid in range(1, 31):
    try:
        url = f"https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/{tid}/roster"
        d = fetch(url)
        team = d.get('team',{}).get('abbreviation','')
        team = team_fix.get(team, team)
        for a in d.get('athletes', []):
            name = f"{a.get('firstName','')} {a.get('lastName','')}".strip()
            pid = a.get('id','')
            if name and pid:
                espnid_map[name] = pid
                roster[name] = {
                    'id': pid,
                    'team': team,
                    'height': a.get('displayHeight',''),
                    'weight': a.get('displayWeight',''),
                    'dob': a.get('dateOfBirth','')[:10] if a.get('dateOfBirth') else '',
                    'pos': a.get('position',{}).get('abbreviation',''),
                    'experience': a.get('experience',{}).get('years',0),
                }
        time.sleep(0.2)
        print(f"Team {tid} ({team}): OK")
    except Exception as e:
        print(f"Team {tid}: NG - {e}")

data['espnid_map'] = espnid_map
data['roster'] = roster

# 全選手スタッツ：このスクリプトが直前で取得したNBA公式のリーグリーダーデータ
# (pts/fg/fg3/stl/blk/min/to)から選手名で引けるマップを作る。
# 旧バージョンは外部の無料API(nbaapi.com)に毎回問い合わせていたが、
# このAPIは今シーズンのデータをまだ持っておらず、得点・リバウンド・アシストの
# 3項目しか取れていなかった。このAPIへの依存はもう無い。
#
# 重要: このスクリプトは6時間ごとに動き、毎回all_playersを作り直す。
# scripts/update_stats.py(深夜のジョブ)が追加したスティール・ブロック・FG%・3P%・
# 出場試合・出場時間は、ここで作り直さないと数時間後に消えてしまう
# (実際に発生していた不具合)。ここで最初から全項目を埋めることで解決する。
def build_name_to_stats(data):
    sources = ['pts', 'fg', 'fg3', 'stl', 'blk', 'min', 'to']
    out = {}
    for src in sources:
        rs = data.get(src, {}).get('resultSet', {})
        headers = rs.get('headers', [])
        rows = rs.get('rowSet', [])
        if not headers or not rows or 'PLAYER' not in headers:
            continue
        idx = {h: i for i, h in enumerate(headers)}
        for row in rows:
            key = norm(row[idx['PLAYER']])
            if key in out:
                continue
            entry = {}
            if 'PTS' in idx: entry['pts'] = row[idx['PTS']]
            if 'REB' in idx: entry['reb'] = row[idx['REB']]
            if 'AST' in idx: entry['ast'] = row[idx['AST']]
            if 'STL' in idx: entry['stl'] = row[idx['STL']]
            if 'BLK' in idx: entry['blk'] = row[idx['BLK']]
            if 'GP' in idx: entry['gp'] = row[idx['GP']]
            if 'MIN' in idx: entry['min'] = row[idx['MIN']]
            if 'FG_PCT' in idx: entry['fg'] = round(row[idx['FG_PCT']] * 100, 1)
            if 'FG3_PCT' in idx: entry['fg3'] = round(row[idx['FG3_PCT']] * 100, 1)
            out[key] = entry
    return out

stats_by_name = build_name_to_stats(data)
print(f"OK: all_stats ({len(stats_by_name)}人)")

# all_players生成
all_players = []
for name, info in roster.items():
    s = stats_by_name.get(norm(name), {})
    entry = {
        'name': name,
        'team': info['team'],
        'pos': info['pos'],
        'height': info['height'],
        'weight': info['weight'],
        'dob': info['dob'],
        'experience': info['experience'],
        'id': info['id'],
        'pts': s.get('pts', 0),
        'reb': s.get('reb', 0),
        'ast': s.get('ast', 0),
    }
    for k in ['stl', 'blk', 'gp', 'min', 'fg', 'fg3']:
        if k in s:
            entry[k] = s[k]
    all_players.append(entry)

all_players.sort(key=lambda x: float(x['pts']) if x['pts'] else 0, reverse=True)
data['all_players'] = all_players

with open('data.json', 'w') as f:
    json.dump(data, f)

has_pts = sum(1 for p in all_players if p['pts'] > 0)
print(f"done: all_players={len(all_players)}人 (pts有り:{has_pts}人)")
