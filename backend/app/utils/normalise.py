import re

import pandas as pd


def clean_name(value: str) -> str:
    return " ".join((value or "").strip().lower().split())


def clean_address(value: str) -> str:
    compact = re.sub(r"\s+", " ", (value or "").strip().lower())
    compact = compact.replace("street", "st").replace("road", "rd")
    return compact


def clean_phone(value: str) -> str:
    digits = re.sub(r"\D", "", value or "")
    return digits[-10:] if len(digits) >= 10 else digits


COLUMN_MAP = {
    "name": ["name", "restaurant_name", "business_name", "company_name", "vendor_name"],
    "address": ["address", "street_address", "addr", "location", "full_address"],
    "phone": ["phone", "phone_number", "mobile", "contact", "contact_number"],
    "city": ["city", "town", "district", "locality"],
    "email": ["email", "email_id", "mail", "contact_email"],
}


def harmonise_columns(dfs):
    harmonised = []
    for df in dfs:
        if df is None or df.empty:
            harmonised.append(df)
            continue

        work = df.copy()
        lower_map = {str(c).strip().lower(): c for c in work.columns}
        rename_map = {}
        for standard, aliases in COLUMN_MAP.items():
            for alias in aliases:
                if alias in lower_map:
                    rename_map[lower_map[alias]] = standard
                    break

        if rename_map:
            work = work.rename(columns=rename_map)
        harmonised.append(work)

    return harmonised
