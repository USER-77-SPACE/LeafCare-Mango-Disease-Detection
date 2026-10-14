import urllib.request
import zipfile
import os

url = "https://github.com/spMohanty/PlantVillage-Dataset/archive/refs/heads/master.zip"
base = r"C:\Users\tarun\Plant-Disease-Detection\backend\dataset"
zip_path = os.path.join(base, "plantvillage.zip")

os.makedirs(base, exist_ok=True)

print("Downloading PlantVillage dataset...")
urllib.request.urlretrieve(url, zip_path)
print("Download complete.")

classes = [
    "Tomato___Bacterial_spot",
    "Tomato___Early_blight",
    "Tomato___Late_blight",
    "Tomato___Leaf_Mold",
    "Tomato___Septoria_leaf_spot",
    "Tomato___Spider_mites Two-spotted_spider_mite",
    "Tomato___Target_Spot",
    "Tomato___Tomato_Yellow_Leaf_Curl_Virus",
    "Tomato___Tomato_mosaic_virus",
    "Tomato___healthy",
]

with zipfile.ZipFile(zip_path, "r") as z:
    names = z.namelist()
    roots = sorted({n.split("/")[0] for n in names if "/" in n})
    print("Archive root folders:", roots)

    image_count = 0
    for name in names:
        normalized = name.replace("\\", "/")
        if not normalized.lower().endswith((".jpg", ".jpeg", ".png")):
            continue

        parts = normalized.split("/")
        class_name = next((c for c in classes if c in parts), None)
        if class_name is None:
            continue

        # Extract just the selected image into its class folder.
        output_dir = os.path.join(base, class_name)
        os.makedirs(output_dir, exist_ok=True)
        output_path = os.path.join(output_dir, os.path.basename(normalized))

        if not os.path.exists(output_path):
            with z.open(name) as src, open(output_path, "wb") as dst:
                dst.write(src.read())
            image_count += 1

print(f"Extracted {image_count} images.")
print("Dataset folders:")
for c in classes:
    folder = os.path.join(base, c)
    count = len([
        f for f in os.listdir(folder)
        if f.lower().endswith((".jpg", ".jpeg", ".png"))
    ]) if os.path.isdir(folder) else 0
    print(f"{c}: {count}")

os.remove(zip_path)
print("Temporary archive removed.")
