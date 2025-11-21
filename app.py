from typing import Annotated
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from ultralytics import YOLO

import cv2
import matplotlib.pyplot as plt
import matplotlib.patches as patches

import uuid
import os
from pathlib import Path

app = FastAPI()

origins = [
    "http://localhost:5500",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def load_model():
    model = YOLO("models/best_mc_97mAP50.pt")
    # metrics = model.val()
    # print(metrics.results_dict) 
    return model
model = load_model()

@app.get("/")
def home():
    return {"message": "Hello, FastAPI!"}


UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

@app.post("/upload/")
async def upload(file: UploadFile = File(...)):
    # 1. Create a unique temp filename
    temp_name = f"{uuid.uuid4().hex}_{file.filename}"
    temp_path = UPLOAD_DIR / temp_name

    # 2. Save the uploaded file
    with open(temp_path, "wb") as buffer:
        buffer.write(await file.read())

    try:
        # 3. Run your predict() function on the saved file
        result = predict(str(temp_path))

    finally:
        # 4. Remove temp file no matter what
        if temp_path.exists():
            os.remove(temp_path)

    # 5. Return prediction to frontend
    print(result)
    return {"result": result}

def predict(img_path: str):
    # Split image
    full_img, parts, coords = split_image(img_path, 256)

    # Run model on all the parts
    results = model(parts)

    total_boxes = []
    total_confs = []
    total_classes = []
    for result in results:
        boxes = result.boxes.xyxy.cpu().numpy().tolist()
        confs = result.boxes.conf.cpu().numpy().tolist()
        classes = result.boxes.cls.int().cpu().numpy().tolist()

        total_boxes.append(boxes)
        total_confs.append(confs)
        total_classes.append(classes)

    return {
        "boxes": total_boxes,
        "scores": total_confs,
        "classes": total_classes
    }

def split_image(image_path, dim):
    img = cv2.imread(image_path)
    height, width, _ = img.shape

    parts = []
    coords = []  # store (y_offset, x_offset)

    for y in range(0, height, dim):
        for x in range(0, width, dim):
            part = img[y:y+dim, x:x+dim]
            parts.append(part)
            coords.append((y, x))  # save offsets for later

    return img, parts, coords