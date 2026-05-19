from pathlib import Path
from pprint import pprint

from app.ml.data_gen import generate_synthetic_dataset
from app.ml.predict import run_prediction
from app.ml.train import train_models


def _detect_cols(df):
    columns = [str(c).strip().lower() for c in df.columns]
    name_col = next((c for c in columns if "name" in c), None)
    address_col = next((c for c in columns if "address" in c), None)
    phone_col = next((c for c in columns if "phone" in c), None)
    city_col = next((c for c in columns if "city" in c), None)
    email_col = next((c for c in columns if "email" in c), None)
    return (name_col, address_col, phone_col, city_col, email_col)


def main():
    root = Path(__file__).resolve().parent
    data_dir = root / "data"
    models_dir = data_dir / "models"
    data_dir.mkdir(parents=True, exist_ok=True)
    models_dir.mkdir(parents=True, exist_ok=True)

    restaurants_csv = data_dir / "restaurants.csv"
    dataset = generate_synthetic_dataset(n=200)
    dataset.to_csv(restaurants_csv, index=False)
    print(f"Synthetic dataset written: {restaurants_csv}")

    train_result = train_models(str(restaurants_csv))
    print("Training complete:", train_result)

    sample = dataset.head(5).copy()
    sample.columns = sample.columns.str.lower()
    cols = _detect_cols(sample)
    groups = run_prediction(sample, cols)
    print("\nSample prediction groups:")
    pprint(groups)

    model_path = Path(train_result["model_path"])
    if model_path.exists():
        print(f"\nModel saved successfully at: {model_path}")
    else:
        raise FileNotFoundError(f"Model was not saved: {model_path}")


if __name__ == "__main__":
    main()
