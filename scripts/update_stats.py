# 選手プロフィールの「シーズン平均」を埋めるスクリプト。
# 旧バージョンは外部の無料API(nbaapi.com)から取得していたが、
# そのAPIが今シーズン(2025-26)のデータをまだ持っておらず(season=2026を指定しても去年のデータが返る)、
# 出場時間(MIN)を計算するコードも元々存在せず、名前マッチングの過程で
# 一部の選手(例:ケビン・デュラント)が完全に抜け落ちる不具合があった。
#
# 新バージョンは、サイトが毎日取得しているNBA公式データ(data.json内の
# pts/ast/reb/stl/blk/fg/fg3/min/to。fetch-nba-data.ymlが取得)を直接使う。
# 外部APIへの通信は一切行わないため、安定していて今シーズンの実データになる。

import json, unicodedata

def normalize(s):
    return unicodedata.normalize("NFD", s).encode("ascii", "ignore").decode("ascii").lower().strip()

def clean_name(s):
    return normalize(s.replace(" III", "").replace(" II", "").replace(" Jr.", ""))

with open("data.json") as f:
    d = json.load(f)

SOURCES = ["pts", "fg", "fg3", "stl", "blk", "min", "to"]

name_to_stats = {}
for src in SOURCES:
    rs = d.get(src, {}).get("resultSet", {})
    headers = rs.get("headers", [])
    rows = rs.get("rowSet", [])
    if not headers or not rows or "PLAYER" not in headers:
        continue
    idx = {h: i for i, h in enumerate(headers)}
    for row in rows:
        key = normalize(row[idx["PLAYER"]])
        if key in name_to_stats:
            continue
        entry = {}
        if "PTS" in idx: entry["pts"] = row[idx["PTS"]]
        if "REB" in idx: entry["reb"] = row[idx["REB"]]
        if "AST" in idx: entry["ast"] = row[idx["AST"]]
        if "STL" in idx: entry["stl"] = row[idx["STL"]]
        if "BLK" in idx: entry["blk"] = row[idx["BLK"]]
        if "GP" in idx: entry["gp"] = row[idx["GP"]]
        if "MIN" in idx: entry["min"] = row[idx["MIN"]]
        if "FG_PCT" in idx: entry["fg"] = round(row[idx["FG_PCT"]] * 100, 1)
        if "FG3_PCT" in idx: entry["fg3"] = round(row[idx["FG3_PCT"]] * 100, 1)
        name_to_stats[key] = entry

players = d.get("all_players", [])
updated = 0
for p in players:
    key = normalize(p.get("name", ""))
    ck = clean_name(p.get("name", ""))
    if key in name_to_stats:
        p.update(name_to_stats[key]); updated += 1
    elif ck in name_to_stats:
        p.update(name_to_stats[ck]); updated += 1

print(f"更新: {updated}人 / {len(players)}人")

with open("data.json", "w") as f:
    json.dump(d, f)
print("完了")
