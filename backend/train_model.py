
from pathlib import Path
import time

import cv2
import joblib
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC
from sklearn.metrics import accuracy_score, classification_report

BASE_DIR = Path(__file__).resolve().parent
DATASET_DIR = BASE_DIR / "dataset"
MODEL_DIR = BASE_DIR / "model"
MODEL_DIR.mkdir(exist_ok=True)

IMAGE_SIZE = (64, 64)

def extract_features(image_path):
    image = cv2.imread(str(image_path))

    if image is None:
        raise ValueError(f"Could not read image: {image_path}")

    image = cv2.resize(image, IMAGE_SIZE)
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

    # Color features: average and standard deviation per RGB channel
    color_features = []
    for channel in range(3):
        values = image[:, :, channel].astype(np.float32)
        color_features.extend([values.mean(), values.std()])

    # Texture features: grayscale histogram
    gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
    histogram = cv2.calcHist([gray], [0], None, [32], [0, 256])
    histogram = cv2.normalize(histogram, histogram).flatten()

    # Combine color and texture features
    return np.concatenate([
        np.array(color_features, dtype=np.float32),
        histogram.astype(np.float32),
    ])

print("Preparing mango leaf image features...")

features = []
labels = []

class_folders = sorted(
    folder for folder in DATASET_DIR.iterdir()
    if folder.is_dir()
)

if not class_folders:
    raise RuntimeError(f"No class folders found in {DATASET_DIR}")

for folder in class_folders:
    image_paths = [
        path for path in folder.iterdir()
        if path.suffix.lower() in {".jpg", ".jpeg", ".png"}
    ]

    print(f"{folder.name}: {len(image_paths)} images")

    for image_path in image_paths:
        try:
            features.append(extract_features(image_path))
            labels.append(folder.name)
        except Exception as error:
            print(f"Skipping {image_path.name}: {error}")

X = np.asarray(features, dtype=np.float32)
y = np.asarray(labels)

if len(X) == 0:
    raise RuntimeError("No images could be processed.")

print(f"\nTotal usable images: {len(X)}")
print("Splitting data into training and testing sets...")

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y,
)

print(f"Training images: {len(X_train)}")
print(f"Testing images: {len(X_test)}")

model = make_pipeline(
    StandardScaler(),
    SVC(kernel="rbf", C=10, gamma="scale", probability=True),
)

print("\nTraining SVM model...")
start_time = time.time()
model.fit(X_train, y_train)
training_time = time.time() - start_time

predictions = model.predict(X_test)
accuracy = accuracy_score(y_test, predictions)

print(f"\nTest accuracy: {accuracy * 100:.2f}%")
print(f"Training time: {training_time:.2f} seconds")
print("\nClassification report:")
print(classification_report(y_test, predictions, zero_division=0))

model_path = MODEL_DIR / "mango_svm_model.joblib"

joblib.dump({
    "model": model,
    "class_names": sorted(np.unique(y).tolist()),
    "image_size": IMAGE_SIZE,
}, model_path)

print(f"\nModel saved to: {model_path}")
print("Training complete!")
