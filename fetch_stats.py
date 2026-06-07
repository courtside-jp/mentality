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

# 全選手スタッツ（600人）
try:
    url = 'https://api.server.nbaapi.com/api/playertotals?page=1&pageSize=600&sortBy=games&ascending=false&season=2026&isPlayoff=false'
    sd = fetch(url)
    stats600 = {}
    for p in sd.get('data', []):
        g = p.get('games') or 1
        stats600[norm(p.get('playerName',''))] = {
            'pts': round(p['points']/g, 1),
            'reb': round(p['totalRb']/g, 1),
            'ast': round(p['assists']/g, 1),
        }
    print(f"OK: all_stats ({len(stats600)}人)")
except Exception as e:
    print(f"NG: all_stats - {e}")
    stats600 = {}

# all_players生成
all_players = []
for name, info in roster.items():
    s = stats600.get(norm(name), {})
    all_players.append({
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
    })

all_players.sort(key=lambda x: float(x['pts']) if x['pts'] else 0, reverse=True)
data['all_players'] = all_players

with open('data.json', 'w') as f:
    json.dump(data, f)

has_pts = sum(1 for p in all_players if p['pts'] > 0)
print(f"done: all_players={len(all_players)}人 (pts有り:{has_pts}人)")
