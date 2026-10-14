
from pathlib import Path
from io import BytesIO

import pandas as pd
from PIL import Image
from huggingface_hub import hf_hub_download

# Dataset labels provided in the official README
LABELS = {
    0: "Anthracnose",
    1: "Bacterial_Canker",
    2: "Cutting_Weevil",
    3: "Die_Back",
    4: "Gall_Midge",
    5: "Healthy",
    6: "Powdery_Mildew",
    7: "Sooty_Mould",
}

BASE_DIR = Path(__file__).resolve().parent
DATASET_DIR = BASE_DIR / "dataset"

print("Downloading or locating the mango dataset...")

parquet_path = hf_hub_download(
    repo_id="Project-AgML/MangoLeafBD_disease_classification",
    filename="data/train-00000-of-00001.parquet",
    repo_type="dataset",
)

df = pd.read_parquet(parquet_path)

print(f"Total images found: {len(df)}")
print("Extracting images into class folders...")

for label, class_name in LABELS.items():
    (DATASET_DIR / class_name).mkdir(parents=True, exist_ok=True)

# Stop if the dataset contains labels we do not recognize.
found_labels = set(df["label"].unique())
if found_labels != set(LABELS):
    raise ValueError(f"Unexpected labels found: {found_labels}")

for index, row in df.iterrows():
    label = int(row["label"])
    class_name = LABELS[label]
    image_data = row["image"]

    # Parquet image cells contain encoded image bytes.
    if isinstance(image_data, dict):
        image_bytes = image_data["bytes"]
    else:
        image_bytes = image_data

    output_path = DATASET_DIR / class_name / f"mango_{index:04d}.jpg"

    with Image.open(BytesIO(image_bytes)) as img:
        img.convert("RGB").save(output_path, format="JPEG", quality=95)

    if (index + 1) % 500 == 0:
        print(f"Extracted {index + 1}/{len(df)} images")

print("\nExtraction complete!")
print("\nImage counts by class:")

for class_name in LABELS.values():
    folder = DATASET_DIR / class_name
    count = len(list(folder.glob("*.jpg")))
    print(f"{class_name}: {count}")

print(f"\nDataset location: {DATASET_DIR}")
