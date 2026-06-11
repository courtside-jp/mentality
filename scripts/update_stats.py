
import urllib.request, json, time, unicodedata

def normalize(s):
    return unicodedata.normalize("NFD", s).encode("ascii","ignore").decode("ascii").lower().strip()

def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent":"Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read())

all_stats = {}
for season in [2026, 2025]:
    for page in range(1, 25):
        try:
            url = f"https://api.server.nbaapi.com/api/playertotals?page={page}&pageSize=50&sortBy=points&ascending=false&season={season}&isPlayoff=false"
            d = fetch(url)
            rows = d.get("data", [])
            if not rows: break
            for p in rows:
                key = normalize(p.get("playerName",""))
                if key not in all_stats:
                    g = p.get("games",1) or 1
                    all_stats[key] = {
                        "pts": round(p.get("points",0)/g,1),
                        "reb": round(p.get("totalRb",0)/g,1),
                        "ast": round(p.get("assists",0)/g,1),
                        "stl": round(p.get("steals",0)/g,1),
                        "blk": round(p.get("blocks",0)/g,1),
                        "fg":  round(p.get("fieldPercent",0)*100,1),
                        "fg3": round(p.get("threePercent",0)*100,1),
                        "gp":  p.get("games",0),
                    }
            time.sleep(0.3)
        except Exception as e:
            print(f"page {page} NG: {e}")
            break

with open("data.json") as f:
    d = json.load(f)
players = d.get("all_players",[])
updated = 0
for p in players:
    key = normalize(p.get("name",""))
    clean = normalize(p.get("name","").replace(" III","").replace(" II","").replace(" Jr.",""))
    if key in all_stats:
        p.update(all_stats[key]); updated += 1
    elif clean in all_stats:
        p.update(all_stats[clean]); updated += 1

print(f"更新: {updated}人")
with open("data.json","w") as f:
    json.dump(d,f)
print("完了")
