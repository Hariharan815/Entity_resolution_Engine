import re
from typing import Any, Dict, List

from jellyfish import jaro_winkler_similarity


def similarity(a, b):
    return float(jaro_winkler_similarity(str(a).lower(), str(b).lower()))


def phone_normalise(s):
    return re.sub(r"\D+", "", str(s or ""))


def email_domain_match(a, b):
    a_text = str(a or "").strip().lower()
    b_text = str(b or "").strip().lower()

    a_domain = a_text.split("@", 1)[1] if "@" in a_text else ""
    b_domain = b_text.split("@", 1)[1] if "@" in b_text else ""

    if not a_domain and not b_domain:
        return 0.5
    if a_domain and b_domain and a_domain == b_domain:
        return 1.0
    return 0.0


def get_val(df, col, i):
    return str(df[col][i]) if col else ""


def build_features(df, i, j, cols):
    name_col, address_col, phone_col, city_col, email_col = cols

    name_sim = similarity(get_val(df, name_col, i), get_val(df, name_col, j))
    addr_sim = similarity(get_val(df, address_col, i), get_val(df, address_col, j))

    left_phone = phone_normalise(get_val(df, phone_col, i))
    right_phone = phone_normalise(get_val(df, phone_col, j))
    phone_match = 1.0 if left_phone and left_phone == right_phone else 0.0

    city_match = 1.0 if get_val(df, city_col, i).strip().lower() == get_val(df, city_col, j).strip().lower() else 0.0

    left_email = get_val(df, email_col, i).strip().lower()
    right_email = get_val(df, email_col, j).strip().lower()
    email_match = 1.0 if left_email and left_email == right_email else 0.0
    domain_match = email_domain_match(left_email, right_email)

    return [name_sim, addr_sim, phone_match, city_match, email_match, domain_match]


def build_feature_vector(left: Dict[str, Any], right: Dict[str, Any]) -> List[float]:
    name_sim = similarity(left.get("name", ""), right.get("name", ""))
    addr_sim = similarity(left.get("address", ""), right.get("address", ""))
    left_phone = phone_normalise(left.get("phone", ""))
    right_phone = phone_normalise(right.get("phone", ""))
    phone_match = 1.0 if left_phone and left_phone == right_phone else 0.0
    city_match = 1.0 if str(left.get("city", "")).strip().lower() == str(right.get("city", "")).strip().lower() else 0.0

    left_email = str(left.get("email", "")).strip().lower()
    right_email = str(right.get("email", "")).strip().lower()
    email_match = 1.0 if left_email and left_email == right_email else 0.0
    domain_match = email_domain_match(left_email, right_email)
    return [name_sim, addr_sim, phone_match, city_match, email_match, domain_match]
