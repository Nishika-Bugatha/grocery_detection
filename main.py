import cv2
import numpy as np
from ultralytics import YOLO
import matplotlib.pyplot as plt
from PIL import Image
import os
import random

# Load your trained model
model_path = "best_final.pt"
model = YOLO(model_path)

# Class names
class_names = ['OLEEV 5L BOT', 'SAF ACT 1L PCH', 'SAF ACT 5L BOT', 'SAF GOLD 5L BOT', 'SAFF GOLD PCH 1LTR', 'SUN 1L PCH', 'SUN 5L PCH']

# Define colors for each class (BGR format)
colors = [
    (255, 0, 0),    # Red
    (0, 255, 0),    # Green
    (0, 0, 255),    # Blue
    (255, 255, 0),  # Cyan
    (255, 0, 255),  # Magenta
    (0, 255, 255),  # Yellow
    (128, 0, 128),  # Purple
]

def predict_and_visualize(image_path, conf_threshold=0.5, show_details=True):
    """
    Run prediction on uploaded image and show visualizations
    """
    print(f"Running inference on: {os.path.basename(image_path)}")
    print(f"Confidence threshold: {conf_threshold}")

    # Load and prepare image
    image = cv2.imread(image_path)
    if image is None:
        print("Could not load image!")
        return

    original_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

    # Run inference
    results = model(image_path, conf=conf_threshold, verbose=False)
    result = results[0]

    # Get predictions
    boxes = result.boxes

    if boxes is not None and len(boxes) > 0:
        print(f"Found {len(boxes)} objects")

        # Create annotated image
        annotated_image = original_image.copy()

        # Detection summary
        class_counts = {}
        detection_details = []

        for i, box in enumerate(boxes):
            x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
            confidence = box.conf[0].cpu().numpy()
            class_id = int(box.cls[0].cpu().numpy())

            class_name = class_names[class_id] if class_id < len(class_names) else f"Class_{class_id}"
            color = colors[class_id % len(colors)]

            class_counts[class_name] = class_counts.get(class_name, 0) + 1

            detection_details.append({
                'class': class_name,
                'confidence': confidence,
                'bbox': (x1, y1, x2, y2)
            })

            cv2.rectangle(annotated_image, (int(x1), int(y1)), (int(x2), int(y2)), color, 3)

            label = f"{class_name}: {confidence:.2f}"
            font = cv2.FONT_HERSHEY_SIMPLEX
            font_scale = 0.7
            thickness = 2
            (text_width, text_height), _ = cv2.getTextSize(label, font, font_scale, thickness)

            cv2.rectangle(annotated_image,
                         (int(x1), int(y1) - text_height - 10),
                         (int(x1) + text_width, int(y1)),
                         color, -1)

            cv2.putText(annotated_image, label,
                       (int(x1), int(y1) - 5),
                       font, font_scale, (255, 255, 255), thickness)

            cv2.circle(annotated_image, (int(x1) + 15, int(y1) + 15), 12, color, -1)
            cv2.putText(annotated_image, str(i+1),
                       (int(x1) + 10, int(y1) + 20),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)

        # Display results
        plt.figure(figsize=(20, 10))

        plt.subplot(1, 2, 1)
        plt.imshow(original_image)
        plt.title("Original Image", fontsize=16, fontweight='bold')
        plt.axis('off')

        plt.subplot(1, 2, 2)
        plt.imshow(annotated_image)
        plt.title(f"Predictions ({len(boxes)} detections)", fontsize=16, fontweight='bold')
        plt.axis('off')

        plt.tight_layout()
       
        if show_details:
            print("\n" + "="*60)
            print("DETECTION SUMMARY")
            print("="*60)

            for class_name, count in class_counts.items():
                print(f"{class_name}: {count} detected")

            print(f"\nTotal objects detected: {len(boxes)}")
            print(f"Average confidence: {np.mean([d['confidence'] for d in detection_details]):.3f}")

            print("\n" + "="*60)
            print("DETAILED DETECTIONS")
            print("="*60)

            for i, detail in enumerate(detection_details, 1):
                x1, y1, x2, y2 = detail['bbox']
                width = x2 - x1
                height = y2 - y1
                print(f"{i:2d}. {detail['class']:20s} | Conf: {detail['confidence']:.3f} | Size: {width:.0f}x{height:.0f}")

    else:
        print("No objects detected")
         
    output_path = "annotated_output.jpg"
    cv2.imwrite(output_path, cv2.cvtColor(annotated_image, cv2.COLOR_RGB2BGR))
    print(f"Saved annotated image at: {output_path}")
    return annotated_image
