import { useState, useRef } from "react";

export default function GroceryDetection() {
  const [images, setImages] = useState([]);
  const [results, setResults] = useState([]);
  const fileInputRef = useRef(null);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const totalImages = images.length + files.length;

    if (totalImages > 1) {
      alert("You can only upload 1 image!");
      return;
    }

    const newImages = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setImages((prev) => [...prev, ...newImages]);
    e.target.value = "";
  };

  const handleDeleteImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setResults((prev) => prev.filter((_, i) => i !== index));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (images.length === 0) {
      alert("Please upload at least one image!");
      return;
    }

    const newResults = [];

    for (let img of images) {
      const formData = new FormData();
      formData.append("file", img.file);

      try {
        const response = await fetch(
          "https://dcmsdczm-8000.inc1.devtunnels.ms/predict2",
          {
            method: "POST",
            body: formData,
          }
        );

        if (!response.ok) throw new Error("Failed to upload");

        const data = await response.json();
        // Expecting: { "detections": {...}, "image_base64": "<base64string>" }

        if (data.image_base64) {
          const processedImg = `data:image/png;base64,${data.image_base64}`;
          newResults.push({
            image: processedImg,
            detections: data.detections || {},
          });
        } else {
          newResults.push({ image: null, detections: {} });
        }
      } catch (error) {
        console.error(error);
        newResults.push({ image: null, detections: {} });
      }
    }

    setResults(newResults);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-6 text-green-600">
        Grocery Detection
      </h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-lg rounded-2xl p-6 flex flex-col items-center w-full max-w-3xl"
      >
        <p className="w-full mb-2 text-gray-600 font-medium text-center">
          Select one image
        </p>

        <label
          htmlFor="fileInput"
          className="cursor-pointer bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
        >
          Choose Image
        </label>
        <input
          id="fileInput"
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageChange}
          className="hidden"
          ref={fileInputRef}
        />

        <div className="mt-6 mb-4 w-full flex flex-col items-center gap-8">
          {images.map((img, index) => (
            <div
              key={index}
              className="relative flex flex-col items-center w-full"
            >
              {/* Side by side images */}
              <div className="flex flex-col md:flex-row gap-8 items-center justify-center">
                {/* Original image */}
                <div className="flex flex-col items-center">
                  <h3 className="mb-2 text-gray-600 font-medium">Original</h3>
                  <img
                    src={img.preview}
                    alt={`Original ${index + 1}`}
                    className="rounded-xl shadow-md h-72 w-72 object-cover"
                  />
                </div>

                {/* Processed image */}
                {results[index]?.image && (
                  <div className="flex flex-col items-center">
                    <h3 className="mb-2 text-green-600 font-medium">
                      Processed
                    </h3>
                    <img
                      src={results[index].image}
                      alt={`Processed ${index + 1}`}
                      className="rounded-xl shadow-md h-72 w-72 object-cover border-2 border-green-500"
                    />
                  </div>
                )}
              </div>

              {/* Detections below */}
              {results[index]?.detections &&
                Object.keys(results[index].detections).length > 0 && (
                  <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4 w-full max-w-2xl text-sm text-gray-700 shadow-sm">
                    <h3 className="font-semibold text-green-600 mb-2 text-center">
                      Detections
                    </h3>
                    <ul className="space-y-1">
                      {Object.entries(results[index].detections).map(
                        ([className, count], i) => (
                          <li
                            key={i}
                            className="flex justify-between px-2 py-1"
                          >
                            <span>{className}</span>
                            <span className="font-medium">{count}</span>
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}

              {/* Delete button */}
              <button
                type="button"
                onClick={() => handleDeleteImage(index)}
                className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full px-2 py-1 hover:bg-red-600"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <button
          type="submit"
          className="bg-green-600 text-white px-6 py-2 rounded-xl hover:bg-green-700 transition"
        >
          Submit
        </button>
      </form>
    </div>
  );
}
