import json
from typing import Any, Dict, List, Optional


def _as_json(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, default=str)


def insert_session(conn, upload_id, user_email, name, file_count, filenames):
    try:
        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO sessions (upload_id, user_email, name, file_count, filenames, status)
            VALUES (%s, %s, %s, %s, %s, 'uploading')
            """,
            (upload_id, user_email, name, int(file_count), ",".join(filenames or [])),
        )
        cur.execute(
            """
            INSERT INTO audit_log (upload_id, event_type, description, metadata)
            VALUES (%s, 'upload_started', %s, %s)
            """,
            (upload_id, "Upload batch received", _as_json({"file_count": file_count, "filenames": filenames or []})),
        )
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        cur.close()


def update_session_status(conn, upload_id, status, summary=None):
    try:
        cur = conn.cursor()
        if summary is None:
            cur.execute("UPDATE sessions SET status=%s WHERE upload_id=%s", (status, upload_id))
        else:
            cur.execute(
                "UPDATE sessions SET status=%s, summary=%s WHERE upload_id=%s",
                (status, _as_json(summary), upload_id),
            )
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        cur.close()


def insert_records_bulk(conn, upload_id, df):
    try:
        cur = conn.cursor()
        rows = []
        for _, row in df.iterrows():
            payload = row.to_dict()
            rows.append(
                (
                    upload_id,
                    payload.get("name"),
                    payload.get("address"),
                    payload.get("phone"),
                    payload.get("city"),
                    payload.get("email"),
                    payload.get("source"),
                    _as_json(payload),
                )
            )

        if rows:
            cur.executemany(
                """
                INSERT INTO records (upload_id, name, address, phone, city, email, source, raw_data)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """,
                rows,
            )
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        cur.close()


def insert_golden_records(conn, upload_id, golden_records_list):
    try:
        cur = conn.cursor()
        rows = []
        for rec in golden_records_list:
            rows.append(
                (
                    upload_id,
                    rec.get("name"),
                    rec.get("address"),
                    rec.get("phone"),
                    rec.get("city"),
                    rec.get("email"),
                    rec.get("matching_score"),
                    rec.get("duplicate_count", 0),
                    rec.get("source_files"),
                    rec.get("confidence"),
                    _as_json(rec),
                )
            )

        if rows:
            cur.executemany(
                """
                INSERT INTO golden_records (
                    upload_id, name, address, phone, city, email,
                    matching_score, duplicate_count, source_files, confidence, raw_data
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                rows,
            )

        cur.execute("SELECT COUNT(*) FROM records WHERE upload_id=%s", (upload_id,))
        original_count = int(cur.fetchone()[0])
        cur.execute(
            """
            INSERT INTO audit_log (upload_id, event_type, description, metadata)
            VALUES (%s, 'resolution_complete', %s, %s)
            """,
            (
                upload_id,
                "Resolution completed",
                _as_json({"golden_count": len(golden_records_list), "original_count": original_count}),
            ),
        )
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        cur.close()


def insert_duplicate_groups(conn, upload_id, groups_list):
    try:
        cur = conn.cursor()
        rows = []
        for group in groups_list:
            members = group.get("records", [])
            indices = [int(item.get("row_index", -1)) for item in members if int(item.get("row_index", -1)) >= 0]
            rows.append(
                (
                    group.get("group_id"),
                    upload_id,
                    float(group.get("confidence", 0.0)),
                    _as_json(indices),
                    _as_json(group.get("evidence", {})),
                )
            )

        if rows:
            cur.executemany(
                """
                INSERT INTO duplicate_groups (group_id, upload_id, confidence, record_indices, evidence)
                VALUES (%s, %s, %s, %s, %s)
                """,
                rows,
            )
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        cur.close()


def get_golden_records(conn, upload_id):
    try:
        cur = conn.cursor(dictionary=True)
        cur.execute(
            """
            SELECT id, upload_id, name, address, phone, city, email, matching_score,
                   duplicate_count, source_files, confidence, raw_data, created_at
            FROM golden_records
            WHERE upload_id=%s
            ORDER BY id ASC
            """,
            (upload_id,),
        )
        rows = cur.fetchall()
        for row in rows:
            row["raw_data"] = json.loads(row["raw_data"]) if row.get("raw_data") else {}
        conn.commit()
        return rows
    except Exception:
        conn.rollback()
        raise
    finally:
        cur.close()


def get_duplicate_groups(conn, upload_id):
    try:
        cur = conn.cursor(dictionary=True)
        cur.execute(
            """
            SELECT group_id, upload_id, confidence, record_indices, evidence, status, created_at
            FROM duplicate_groups
            WHERE upload_id=%s
            ORDER BY id ASC
            """,
            (upload_id,),
        )
        groups = cur.fetchall()

        cur.execute(
            """
            SELECT id, name, address, phone, city, email, source, raw_data
            FROM records
            WHERE upload_id=%s
            ORDER BY id ASC
            """,
            (upload_id,),
        )
        all_records = cur.fetchall()

        output = []
        for group in groups:
            record_indices = json.loads(group.get("record_indices") or "[]")
            evidence = json.loads(group.get("evidence") or "{}")
            members = []
            for idx in record_indices:
                if 0 <= idx < len(all_records):
                    rec = dict(all_records[idx])
                    raw = rec.get("raw_data")
                    if raw:
                        parsed = json.loads(raw)
                        rec.update(parsed)
                    rec["row_index"] = idx
                    members.append(rec)
            output.append(
                {
                    "group_id": group.get("group_id"),
                    "confidence": float(group.get("confidence") or 0.0),
                    "records": members,
                    "evidence": evidence,
                    "status": group.get("status"),
                }
            )
        conn.commit()
        return output
    except Exception:
        conn.rollback()
        raise
    finally:
        cur.close()


def insert_feedback(conn, group_id, upload_id, decision, notes, reviewer):
    try:
        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO feedback (group_id, upload_id, decision, notes, reviewer)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (group_id, upload_id, decision, notes, reviewer),
        )

        status_map = {
            "approve": "approved",
            "reject": "rejected",
            "split": "split",
            "skip": "skipped",
        }
        mapped_status = status_map.get(decision, "pending")
        cur.execute(
            "UPDATE duplicate_groups SET status=%s WHERE upload_id=%s AND group_id=%s",
            (mapped_status, upload_id, group_id),
        )

        cur.execute(
            """
            INSERT INTO audit_log (upload_id, event_type, description, metadata)
            VALUES (%s, 'review_decision', %s, %s)
            """,
            (
                upload_id,
                f"Decision recorded for group {group_id}",
                _as_json({"decision": decision, "group_id": group_id}),
            ),
        )
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        cur.close()


def get_audit_log(conn, upload_id):
    try:
        cur = conn.cursor(dictionary=True)
        cur.execute(
            """
            SELECT id, upload_id, event_type, description, metadata, created_at
            FROM audit_log
            WHERE upload_id=%s
            ORDER BY created_at DESC
            """,
            (upload_id,),
        )
        rows = cur.fetchall()
        for row in rows:
            row["metadata"] = json.loads(row["metadata"]) if row.get("metadata") else {}
        conn.commit()
        return rows
    except Exception:
        conn.rollback()
        raise
    finally:
        cur.close()


def get_sessions_by_user(conn, user_email):
    try:
        cur = conn.cursor(dictionary=True)
        cur.execute(
            """
            SELECT upload_id, user_email, name, status, file_count, filenames, summary, created_at, updated_at
            FROM sessions
            WHERE user_email=%s
            ORDER BY created_at DESC
            LIMIT 10
            """,
            (user_email,),
        )
        rows = cur.fetchall()
        for row in rows:
            row["filenames"] = [f for f in (row.get("filenames") or "").split(",") if f]
            summary = row.get("summary")
            row["summary"] = json.loads(summary) if summary else {}
        conn.commit()
        return rows
    except Exception:
        conn.rollback()
        raise
    finally:
        cur.close()


def get_session_summary(conn, upload_id):
    try:
        cur = conn.cursor(dictionary=True)
        cur.execute(
            "SELECT upload_id, status, summary, file_count, filenames, created_at, updated_at FROM sessions WHERE upload_id=%s LIMIT 1",
            (upload_id,),
        )
        row = cur.fetchone()
        if not row:
            conn.commit()
            return None
        row["filenames"] = [f for f in (row.get("filenames") or "").split(",") if f]
        summary = row.get("summary")
        row["summary"] = json.loads(summary) if summary else {}
        conn.commit()
        return row
    except Exception:
        conn.rollback()
        raise
    finally:
        cur.close()


def insert_user(conn, name, email, password_hash):
    try:
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO users (name, email, password_hash) VALUES (%s, %s, %s)",
            (name, email, password_hash),
        )
        user_id = cur.lastrowid
        conn.commit()
        return user_id
    except Exception as exc:
        conn.rollback()
        if "Duplicate entry" in str(exc):
            raise ValueError("Email already registered") from exc
        raise
    finally:
        cur.close()


def get_user_by_email(conn, email):
    try:
        cur = conn.cursor(dictionary=True)
        cur.execute(
            "SELECT id, name, email, password_hash, plan, created_at FROM users WHERE email=%s LIMIT 1",
            (email,),
        )
        row = cur.fetchone()
        conn.commit()
        return row
    except Exception:
        conn.rollback()
        raise
    finally:
        cur.close()


def delete_session_cascade(conn, upload_id):
    try:
        cur = conn.cursor()
        cur.execute("DELETE FROM feedback WHERE upload_id=%s", (upload_id,))
        cur.execute("DELETE FROM duplicate_groups WHERE upload_id=%s", (upload_id,))
        cur.execute("DELETE FROM golden_records WHERE upload_id=%s", (upload_id,))
        cur.execute("DELETE FROM records WHERE upload_id=%s", (upload_id,))
        cur.execute("DELETE FROM audit_log WHERE upload_id=%s", (upload_id,))
        cur.execute("DELETE FROM sessions WHERE upload_id=%s", (upload_id,))
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        cur.close()
