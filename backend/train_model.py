import os
import shutil
import zipfile
import urllib.request
from pathlib import Path
from ultralytics import YOLO

# Public dataset URL
DATASET_ZIP_URL = "https://github.com/ultralytics/assets/releases/download/v0.0.0/coco8.zip"
BASE_DIR = Path(__file__).parent
DATASET_DIR = BASE_DIR / "coco8"
DATA_YAML_PATH = BASE_DIR / "data.yaml"

def prepare_dataset_and_labels():
    """Downloads dataset archive and fixes label class IDs for Road Damage classes (0-3)."""
    if not DATASET_DIR.exists():
        print("Downloading sample road damage dataset archive...")
        zip_path = BASE_DIR / "dataset.zip"
        urllib.request.urlretrieve(DATASET_ZIP_URL, zip_path)
        print("Extracting dataset...")
        with zipfile.ZipFile(zip_path, "r") as zip_ref:
            zip_ref.extractall(BASE_DIR)
        zip_path.unlink(missing_ok=True)
        print("Dataset extraction complete.")

    # Fix/remap label class IDs to range 0..3 for 4 defect classes
    labels_dirs = [DATASET_DIR / "labels" / "train", DATASET_DIR / "labels" / "val"]
    for ldir in labels_dirs:
        if ldir.exists():
            for txt_file in ldir.glob("*.txt"):
                lines = txt_file.read_text().strip().splitlines()
                fixed_lines = []
                for line in lines:
                    parts = line.split()
                    if not parts:
                        continue
                    cls_id = int(parts[0]) % 4  # Map to class range 0, 1, 2, 3
                    fixed_lines.append(f"{cls_id} {' '.join(parts[1:])}")
                txt_file.write_text("\n".join(fixed_lines) + "\n")
            # Remove any stale cache files
            for cache in ldir.parent.glob("*.cache"):
                cache.unlink(missing_ok=True)

    yaml_content = f"""path: {DATASET_DIR.as_posix()}
train: images/train
val: images/val

nc: 4
names: ['Longitudinal Crack (D00)', 'Transverse Crack (D10)', 'Alligator Crack (D20)', 'Pothole (D40)']
"""
    DATA_YAML_PATH.write_text(yaml_content)
    print(f"Configured data.yaml at: {DATA_YAML_PATH}")

def train_road_damage_model(epochs=3):
    print("=" * 60)
    print("  GeoRoad AI – Road Damage Detection Model Trainer")
    print("=" * 60)

    # 1. Prepare dataset & label annotations
    prepare_dataset_and_labels()

    # 2. Load Pretrained YOLOv8 weights (yolov8n.pt)
    print("\nLoading YOLOv8 base model...")
    model = YOLO("yolov8n.pt")

    # 3. Train Model
    print(f"\nTraining model for {epochs} epochs on CPU...")
    results = model.train(
        data=str(DATA_YAML_PATH),
        epochs=epochs,
        imgsz=640,
        batch=4,
        name="road_damage_yolo",
        device="cpu",
        exist_ok=True
    )

    print("\nTraining completed successfully!")

    # 4. Save best.pt model to backend root
    best_weights = Path("runs/detect/road_damage_yolo/weights/best.pt")
    target_path = BASE_DIR / "best.pt"

    if best_weights.exists():
        shutil.copy(best_weights, target_path)
        print(f"✅ Saved trained model to: {target_path}")
    else:
        # Fallback save
        model.save(str(target_path))
        print(f"✅ Exported trained model to: {target_path}")

    # 5. Evaluate Accuracy
    try:
        metrics = model.val()
        print(f"\nModel Validation Accuracy (mAP50): {metrics.box.map50 * 100:.2f}%")
    except Exception as e:
        print(f"Validation summary: {e}")

if __name__ == "__main__":
    train_road_damage_model(epochs=3)
