# 選手プロフィールの「シーズン平均」を埋めるスクリプト。
# 旧バージョンは外部の無料API(nbaapi.com)から取得していたが、
# そのAPIが今シーズン(2025-26)のデータをまだ持っておらず(season=2026を指定しても去年のデータが返る)、
# 出場時間(MIN)を計算するコードも元々存在せず、名前マッチングの過程で
# 一部の選手(例:ケビン・デュラント)が完全に抜け落ちる不具合があった。
#
# 新バージョンは、サイトが毎日取得しているNBA公式データ(data.json内の
# pts/ast/reb/stl/blk/fg/fg3/min/to。fetch-nba-data.ymlが取得)を直接使う。
# 外部APIへの通信は一切行わないため、安定していて今シーズンの実データになる。
#
# 注意: data.json内の fg/fg3 は「合計値」(PerMode=Totals)で取得されている。
# pts/stl/blk/min/to は「1試合平均」(PerMode=PerGame)。同じ列名でも単位が違うので、
# fg/fg3を使うときは試合数(GP)で割って平均に変換する。これを忘れると、
# 1試合平均ランキングに載っていない選手(出場が少ない/負傷中など)が
# 合計値のまま表示される不具合が起きる(例:ギアニスが「993得点」と表示される)。

import json, unicodedata

def normalize(s):
    return unicodedata.normalize("NFD", s).encode("ascii", "ignore").decode("ascii").lower().strip()

def clean_name(s):
    return normalize(s.replace(" III", "").replace(" II", "").replace(" Jr.", ""))

with open("data.json") as f:
    d = json.load(f)

PER_GAME_SOURCES = ["pts", "stl", "blk", "min", "to"]  # 1試合平均
TOTAL_SOURCES = ["fg", "fg3"]  # 合計値。GPで割って平均にする

def build_name_to_stats(d):
    out = {}

    def consume(rows, idx, is_total):
        for row in rows:
            key = normalize(row[idx["PLAYER"]])
            if key in out:
                continue
            g = row[idx["GP"]] if "GP" in idx else 0
            g = g if g else 1

            def val(col):
                v = row[idx[col]]
                return round(v / g, 1) if is_total else v

            entry = {}
            if "PTS" in idx: entry["pts"] = val("PTS")
            if "REB" in idx: entry["reb"] = val("REB")
            if "AST" in idx: entry["ast"] = val("AST")
            if "STL" in idx: entry["stl"] = val("STL")
            if "BLK" in idx: entry["blk"] = val("BLK")
            if "GP" in idx: entry["gp"] = row[idx["GP"]]
            if "MIN" in idx: entry["min"] = val("MIN")
            if "FG_PCT" in idx: entry["fg"] = round(row[idx["FG_PCT"]] * 100, 1)
            if "FG3_PCT" in idx: entry["fg3"] = round(row[idx["FG3_PCT"]] * 100, 1)
            out[key] = entry

    for src in PER_GAME_SOURCES:
        rs = d.get(src, {}).get("resultSet", {})
        headers, rows = rs.get("headers", []), rs.get("rowSet", [])
        if not headers or not rows or "PLAYER" not in headers:
            continue
        idx = {h: i for i, h in enumerate(headers)}
        consume(rows, idx, is_total=False)

    for src in TOTAL_SOURCES:
        rs = d.get(src, {}).get("resultSet", {})
        headers, rows = rs.get("headers", []), rs.get("rowSet", [])
        if not headers or not rows or "PLAYER" not in headers:
            continue
        idx = {h: i for i, h in enumerate(headers)}
        consume(rows, idx, is_total=True)

    return out

name_to_stats = build_name_to_stats(d)

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
