from app.db.connection import get_connection, get_cursor

CREATE_USERS_TABLE = """
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  plan ENUM('Free','Pro') DEFAULT 'Free',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
"""

CREATE_SESSIONS_TABLE = """
CREATE TABLE IF NOT EXISTS sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  upload_id VARCHAR(100) UNIQUE NOT NULL,
  user_email VARCHAR(150),
  name VARCHAR(255),
  status ENUM('uploading','resolving','complete','failed') DEFAULT 'uploading',
  file_count INT DEFAULT 1,
  filenames TEXT,
  summary JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)
"""

CREATE_RECORDS_TABLE = """
CREATE TABLE IF NOT EXISTS records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  upload_id VARCHAR(100) NOT NULL,
  name VARCHAR(255),
  address TEXT,
  phone VARCHAR(50),
  city VARCHAR(100),
  email VARCHAR(150),
  source VARCHAR(255),
  raw_data JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_upload_id (upload_id)
)
"""

CREATE_GOLDEN_TABLE = """
CREATE TABLE IF NOT EXISTS golden_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  upload_id VARCHAR(100) NOT NULL,
  name VARCHAR(255),
  address TEXT,
  phone VARCHAR(50),
  city VARCHAR(100),
  email VARCHAR(150),
  matching_score FLOAT,
  duplicate_count INT DEFAULT 0,
  source_files TEXT,
  confidence FLOAT,
  raw_data JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_upload_id (upload_id)
)
"""

CREATE_DUPLICATE_GROUPS_TABLE = """
CREATE TABLE IF NOT EXISTS duplicate_groups (
  id INT AUTO_INCREMENT PRIMARY KEY,
  group_id VARCHAR(100) NOT NULL,
  upload_id VARCHAR(100) NOT NULL,
  confidence FLOAT,
  record_indices JSON,
  evidence JSON,
  status ENUM('pending','approved','rejected','split','skipped') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_upload_id (upload_id),
  INDEX idx_status (status)
)
"""

CREATE_FEEDBACK_TABLE = """
CREATE TABLE IF NOT EXISTS feedback (
  id INT AUTO_INCREMENT PRIMARY KEY,
  group_id VARCHAR(100),
  upload_id VARCHAR(100),
  decision ENUM('approve','reject','split','skip') NOT NULL,
  notes TEXT,
  reviewer VARCHAR(150),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
"""

CREATE_AUDIT_TABLE = """
CREATE TABLE IF NOT EXISTS audit_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  upload_id VARCHAR(100),
  event_type VARCHAR(100) NOT NULL,
  description TEXT,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_upload_id (upload_id),
  INDEX idx_event_type (event_type)
)
"""


def create_all_tables():
    statements = [
        ("users", CREATE_USERS_TABLE),
        ("sessions", CREATE_SESSIONS_TABLE),
        ("records", CREATE_RECORDS_TABLE),
        ("golden_records", CREATE_GOLDEN_TABLE),
        ("duplicate_groups", CREATE_DUPLICATE_GROUPS_TABLE),
        ("feedback", CREATE_FEEDBACK_TABLE),
        ("audit_log", CREATE_AUDIT_TABLE),
    ]

    conn = get_connection()
    try:
        with get_cursor(conn) as cur:
            for name, sql in statements:
                cur.execute(sql)
                print(f"Ensured table: {name}")
        conn.commit()
    finally:
        conn.close()
