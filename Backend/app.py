import base64
from io import BytesIO
import os
import shutil
import cv2
from fastapi import FastAPI, File, UploadFile
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from main import predict_and_visualize

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

@app.get("/test")
async def test_endpoint():
    return {"message": "API is working!"}


@app.post("/predict")
async def predict_endpoint(file: UploadFile = File(...)):
    try:
        # Save the uploaded file temporarily
        temp_file_path = f"temp_{file.filename}"
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Call your prediction function
        predict_and_visualize(temp_file_path, conf_threshold=0.5, show_details=True)

        # Optionally, delete the temp file after processing
        os.remove(temp_file_path)

        return JSONResponse(content={"message": "Prediction done, check your function’s output"})
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.post("/predict2")
async def predict_endpoint(file: UploadFile = File(...)):
    try:
        # Save the uploaded file temporarily
        temp_file_path = f"temp_{file.filename}"
        with open(temp_file_path, "wb") as buffer:
            buffer.write(await file.read())

        # Call your prediction function
        # It returns a NumPy array (OpenCV image)
        result = predict_and_visualize(
            temp_file_path, conf_threshold=0.5, show_details=True
        )

        # Since result is a dict like {"output_image": annotated_image}
        output_image = result["output_image"]
        detection_details = result["detections"]

        # Delete temp file
        os.remove(temp_file_path)

        # Convert NumPy array to JPEG bytes
        success, encoded_image = cv2.imencode('.jpg', output_image)
        if not success:
            return JSONResponse(content={"error": "Failed to encode image"}, status_code=500)

        # Convert bytes to Base64 string
        img_str = base64.b64encode(encoded_image.tobytes()).decode("utf-8")

        # Return as JSON
        return JSONResponse(content={"detections": detection_details,"image_base64": img_str})

    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)