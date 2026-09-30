from ultralytics import YOLO
import os

def train_road_damage_model():
    print("Initializing YOLOv8 training for RDD2022 Dataset...")
    
    # Load a pre-trained YOLOv8 model (yolov8n.pt is the nano version, good for speed/laptops)
    # For higher accuracy, you can use 'yolov8s.pt' (small) or 'yolov8m.pt' (medium)
    model = YOLO("yolov8n.pt") 

    # To train this, you need a data.yaml file that points to your RDD2022 image folders
    # Example data.yaml structure:
    # 
    # train: ./RDD2022/India/train/images
    # val: ./RDD2022/India/val/images
    # nc: 4
    # names: ['D00', 'D10', 'D20', 'D40']

    yaml_path = "data.yaml" # Ensure this file exists and points to your dataset
    
    if not os.path.exists(yaml_path):
        print(f"Error: {yaml_path} not found. Please create it and download the dataset.")
        return

    # Train the model
    # epochs=50 is a good starting point. Batch size depends on your GPU RAM.
    results = model.train(
        data=yaml_path,
        epochs=50,
        imgsz=640,
        batch=16,
        name="road_damage_rdd2022",
        device="0"  # Use 'cpu' if you don't have an Nvidia GPU
    )

    print("\nTraining Complete!")
    print("Your trained model weights are saved in 'runs/detect/road_damage_rdd2022/weights/best.pt'")
    print("Copy 'best.pt' into your backend folder to use it in the web app!")
    
    # You can view the accuracy (mAP50 and mAP50-95) inside the results object
    metrics = model.val()
    print(f"Final Model mAP50 (Accuracy): {metrics.box.map50 * 100:.2f}%")

if __name__ == "__main__":
    train_road_damage_model()
