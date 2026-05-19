import random

import pandas as pd

FIRST_NAMES = [
    "Ravi",
    "Priya",
    "Arjun",
    "Meera",
    "Suresh",
    "Divya",
    "Karan",
    "Neha",
    "Vikram",
    "Ananya",
]
LAST_NAMES = [
    "Kumar",
    "Sharma",
    "Reddy",
    "Nair",
    "Iyer",
    "Verma",
    "Gupta",
    "Patel",
    "Singh",
    "Menon",
]
CITIES = ["Chennai", "Bangalore", "Mumbai", "Delhi", "Hyderabad"]
STREETS = ["MG Road", "Anna Nagar Street", "Park Street", "Link Road", "Temple Road"]


def _swap_adjacent(text):
    if len(text) < 2:
        return text
    idx = random.randint(0, len(text) - 2)
    chars = list(text)
    chars[idx], chars[idx + 1] = chars[idx + 1], chars[idx]
    return "".join(chars)


def _shorten_name(name):
    parts = str(name).split()
    if len(parts) < 2:
        return name
    return f"{parts[0][0]}. {parts[-1]}"


def _format_phone(raw_digits):
    digits = "".join(ch for ch in str(raw_digits) if ch.isdigit())[-10:]
    if len(digits) != 10:
        return raw_digits

    style = random.choice([0, 1, 2])
    if style == 0:
        return f"+91-{digits[:5]}-{digits[5:]}"
    if style == 1:
        return f"(0{digits[:2]}) {digits[2:6]}-{digits[6:]}"
    return digits


def generate_dirty_data(df, cols):
    df_copy = df.copy()
    name_col, address_col, phone_col, city_col, email_col = cols

    for i in range(len(df_copy)):
        if name_col and random.random() < 0.30:
            df_copy.at[i, name_col] = _swap_adjacent(str(df_copy.at[i, name_col]))
        if name_col and random.random() < 0.20:
            suffix = random.choice([" Pvt Ltd", " Ltd"])
            df_copy.at[i, name_col] = str(df_copy.at[i, name_col]) + suffix
        if name_col and random.random() < 0.15:
            df_copy.at[i, name_col] = _shorten_name(df_copy.at[i, name_col])

        if phone_col:
            df_copy.at[i, phone_col] = _format_phone(df_copy.at[i, phone_col])

        if address_col and random.random() < 0.40:
            address = str(df_copy.at[i, address_col])
            address = address.replace("Street", "St")
            address = address.replace("Road", "Rd")
            address = address.replace("Nagar", "Ngr")
            df_copy.at[i, address_col] = address

        if city_col and random.random() < 0.10:
            df_copy.at[i, city_col] = str(df_copy.at[i, city_col]).replace("Bangalore", "Bengaluru")

        if email_col and random.random() < 0.10:
            email = str(df_copy.at[i, email_col])
            df_copy.at[i, email_col] = email.replace(".com", ".in") if ".com" in email else email

    return df_copy


def generate_synthetic_dataset(n=200):
    clean_rows = []
    for i in range(n):
        first = random.choice(FIRST_NAMES)
        last = random.choice(LAST_NAMES)
        city = random.choice(CITIES)
        street = random.choice(STREETS)
        cluster = f"c_{i:04d}"
        phone = f"9{random.randint(100000000, 999999999)}"
        company = f"{last} Technologies"

        clean_rows.append(
            {
                "name": f"{first} {last}",
                "address": f"{random.randint(1, 300)}, {street}, {city}",
                "phone": phone,
                "city": city,
                "email": f"{first.lower()}.{last.lower()}{i}@example.com",
                "company": company,
                "cluster": cluster,
            }
        )

    clean_df = pd.DataFrame(clean_rows)
    cols = ("name", "address", "phone", "city", "email")
    dirty_df = generate_dirty_data(clean_df.copy(), cols)
    dirty_df["cluster"] = clean_df["cluster"]

    return pd.concat([clean_df, dirty_df], ignore_index=True)
