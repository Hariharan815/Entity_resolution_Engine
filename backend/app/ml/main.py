import os
import sqlite3
from pathlib import Path

import pandas as pd

from app.ml.predict import run_prediction

BASE_DIR = Path(__file__).resolve().parent
PROJECT_DIR = BASE_DIR.parent.parent
DATA_DIR = PROJECT_DIR / "data"
OUTPUT_DIR = PROJECT_DIR / "output"
SQLITE_DB = DATA_DIR / "database.db"
CLUSTERED_PATH = OUTPUT_DIR / "clustered_dataset.csv"
FINAL_CSV = OUTPUT_DIR / "final_golden_record.csv"
FINAL_XLSX = OUTPUT_DIR / "final_golden_record.xlsx"


def _load_sqlite_records() -> pd.DataFrame:
    if not SQLITE_DB.exists():
        return pd.DataFrame()

    conn = sqlite3.connect(SQLITE_DB)
    try:
        df_sql = pd.read_sql_query("SELECT * FROM records", conn)
    except Exception:
        df_sql = pd.DataFrame()
    finally:
        conn.close()

    if not df_sql.empty and "source" not in df_sql.columns:
        df_sql["source"] = "sqlite"
    return df_sql


def _load_csv_records() -> pd.DataFrame:
    dfs = []
    if not DATA_DIR.exists():
        return pd.DataFrame()

    for file in os.listdir(DATA_DIR):
        file_path = DATA_DIR / file
        if not file_path.is_file():
            continue
        if not file.lower().endswith(".csv"):
            continue
        if file.startswith("final_") or file.startswith("clustered_"):
            continue

        try:
            df_temp = pd.read_csv(file_path)
            if "source" not in df_temp.columns:
                df_temp["source"] = file
            else:
                df_temp["source"] = df_temp["source"].fillna(file)
            dfs.append(df_temp)
        except Exception:
            continue

    if not dfs:
        return pd.DataFrame()
    return pd.concat(dfs, ignore_index=True)


def main():
    df_sql = _load_sqlite_records()
    df_csv = _load_csv_records()

    if df_sql.empty and df_csv.empty:
        raise ValueError("No data available from SQLite records table or data/*.csv files")

    df = pd.concat([df_sql, df_csv], ignore_index=True)
    df.columns = df.columns.str.lower()
    columns = df.columns

    name_col = next((c for c in columns if "name" in c), None)
    address_col = next((c for c in columns if "address" in c), None)
    phone_col = next((c for c in columns if "phone" in c), None)
    city_col = next((c for c in columns if "city" in c), None)
    email_col = next((c for c in columns if "email" in c), None)

    cols = (name_col, address_col, phone_col, city_col, email_col)
    groups = run_prediction(df, cols)

    print("\n Phase 1 — Generating clusters...")

    cluster_ids = [-1] * len(df)

    for group in groups:
        gid = int(group["group_id"])
        for record in group["records"]:
            idx = int(record["row_index"])
            if 0 <= idx < len(cluster_ids):
                cluster_ids[idx] = gid

    df["cluster_id"] = cluster_ids

    total_clusters = df[df["cluster_id"] != -1]["cluster_id"].nunique()
    singleton_count = len(df[df["cluster_id"] == -1])
    duplicate_rows = len(df[df["cluster_id"] != -1])

    print(f"   Clusters found    : {total_clusters}")
    print(f"   Duplicate rows    : {duplicate_rows}")
    print(f"   Singleton rows    : {singleton_count}")

    os.makedirs("output", exist_ok=True)
    df.to_csv(CLUSTERED_PATH, index=False)
    print(f"   Clustered file saved → output/clustered_dataset.csv ({len(df)} rows)")
    print(" Phase 1 complete.\n")

    # Phase separation: stop using raw dataframe after writing clustered output.
    del df

    print(" Phase 2 — Building golden records from clustered file...")

    df_clustered = pd.read_csv(CLUSTERED_PATH)
    print(f"   Loaded clustered file: {len(df_clustered)} rows, {df_clustered['cluster_id'].nunique()} unique cluster IDs")

    if "cluster_id" not in df_clustered.columns:
        raise ValueError(" cluster_id column missing from clustered file. Phase 1 may have failed.")

    golden_records = []

    # --- Duplicate clusters: merge rows within each cluster_id group ---
    duplicate_df = df_clustered[df_clustered["cluster_id"] != -1]
    cluster_groups = duplicate_df.groupby("cluster_id")

    for cluster_id, group_df in cluster_groups:
        matching_group = next(
            (g for g in groups if int(g["group_id"]) == int(cluster_id)),
            None,
        )
        scores = [r["score"] for r in matching_group["records"]] if matching_group else [1.0]
        avg_score = round(sum(scores) / len(scores), 4)

        golden = {}
        for col in df_clustered.columns:
            if col == "cluster_id":
                continue
            values = group_df[col].dropna()
            if len(values) == 0:
                golden[col] = None
            else:
                mode_val = values.mode()
                golden[col] = mode_val.iloc[0] if not mode_val.empty else values.iloc[0]

        golden["cluster_id"] = int(cluster_id)
        golden["matching_score"] = avg_score
        golden["record_count"] = len(group_df)
        golden["source_files"] = ", ".join(
            group_df["source"].dropna().unique().tolist()
        ) if "source" in group_df.columns else "unknown"
        golden["source"] = "merged"
        golden_records.append(golden)

    print(f"   Duplicate clusters merged : {len(golden_records)} golden records built")

    # --- Singleton rows: each becomes its own golden record unchanged ---
    singleton_df = df_clustered[df_clustered["cluster_id"] == -1].copy()
    singleton_count_phase2 = len(singleton_df)

    for _, row in singleton_df.iterrows():
        singleton = row.to_dict()
        singleton["matching_score"] = 1.0
        singleton["record_count"] = 1
        singleton["source_files"] = str(row.get("source", "unknown"))
        singleton["source"] = "original"
        golden_records.append(singleton)

    print(f"   Singleton rows kept       : {singleton_count_phase2}")
    print(f"   Total golden records      : {len(golden_records)}")

    df_output = pd.DataFrame(golden_records)

    # CSV
    df_output.to_csv(FINAL_CSV, index=False)
    print("   Saved → output/final_golden_record.csv")

    # Excel
    try:
        df_output.to_excel(FINAL_XLSX, index=False)
        print("   Saved → output/final_golden_record.xlsx")
    except ImportError:
        print("   openpyxl not installed — Excel export skipped")

    # Database
    try:
        conn = sqlite3.connect(DATA_DIR / "database.db")
        df_output.to_sql("golden_records", conn, if_exists="replace", index=False)
        df_clustered.to_sql("clustered_records", conn, if_exists="replace", index=False)
        conn.close()
        print("   Saved → DB tables: golden_records, clustered_records")
    except Exception as e:
        print(f"   DB save failed: {e}")

    print(" Phase 2 complete.\n")

    reduction = round((1 - len(df_output) / len(df_clustered)) * 100, 1) if len(df_clustered) > 0 else 0

    print("=" * 52)
    print(" PIPELINE SUMMARY")
    print("=" * 52)
    print(f"  Phase 1 input rows       : {len(df_clustered)}")
    print(f"  Clusters generated       : {duplicate_df['cluster_id'].nunique()}")
    print(f"  Duplicate rows           : {len(duplicate_df)}")
    print(f"  Singleton rows           : {singleton_count_phase2}")
    print(f"  Phase 2 golden records   : {len(df_output)}")
    print(f"  Reduction                : {reduction}%")
    print("=" * 52)
    print()
    print("  output/clustered_dataset.csv     ← Phase 1 output")
    print("  output/final_golden_record.csv   ← Phase 2 output")
    print("  output/final_golden_record.xlsx  ← Phase 2 output")
    print("=" * 52)


if __name__ == "__main__":
    main()
