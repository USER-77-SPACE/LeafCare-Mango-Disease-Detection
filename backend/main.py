
from pathlib import Path
from io import BytesIO

import cv2
import joblib
import numpy as np
from PIL import Image
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "model" / "mango_svm_model.joblib"

if not MODEL_PATH.exists():
    raise FileNotFoundError(
        f"Model not found: {MODEL_PATH}. Run train_model.py first."
    )

saved = joblib.load(MODEL_PATH)
model = saved["model"]
class_names = saved["class_names"]
IMAGE_SIZE = tuple(saved["image_size"])

app = FastAPI(title="LeafCare Mango Disease Detection API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def extract_features(image_bytes):
    with Image.open(BytesIO(image_bytes)) as original:
        image = original.convert("RGB")
        image = image.resize(IMAGE_SIZE)
        image = np.array(image)

    color_features = []
    for channel in range(3):
        values = image[:, :, channel].astype(np.float32)
        color_features.extend([values.mean(), values.std()])

    gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
    histogram = cv2.calcHist([gray], [0], None, [32], [0, 256])
    histogram = cv2.normalize(histogram, histogram).flatten()

    return np.concatenate([
        np.array(color_features, dtype=np.float32),
        histogram.astype(np.float32),
    ]).reshape(1, -1)

@app.get("/")
def home():
    return {
        "message": "LeafCare Mango Disease Detection API is running",
        "classes": class_names,
    }

@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": True}

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if file.content_type not in {
        "image/jpeg", "image/png", "image/webp"
    }:
        raise HTTPException(
            status_code=400,
            detail="Upload a JPG, PNG, or WEBP image.",
        )

    image_bytes = await file.read()

    if not image_bytes:
        raise HTTPException(status_code=400, detail="The uploaded image is empty.")

    if len(image_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Maximum image size is 10 MB.")

    try:
        features = extract_features(image_bytes)
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Could not read this image. Please upload a valid leaf photo.",
        )

    prediction = model.predict(features)[0]

    probabilities = model.predict_proba(features)[0]
    confidence = float(np.max(probabilities)) * 100

    return {
        "prediction": prediction,
        "confidence": round(confidence, 2),
        "message": (
            "This is an educational machine-learning prediction, "
            "not a confirmed agricultural diagnosis."
        ),
    }
