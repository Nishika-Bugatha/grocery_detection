import { useState, useRef } from "react";

export default function GroceryDetection() {
  const [images, setImages] = useState([]);
  const [results, setResults] = useState([]);
  const fileInputRef = useRef(null);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const totalImages = images.length + files.length;

    if (totalImages > 3) {
      alert("You can only upload a maximum of 3 images!");
      return;
    }

    const newImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setImages(prev => [...prev, ...newImages]);
    e.target.value = "";
  };

  const handleDeleteImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setResults(prev => prev.filter((_, i) => i !== index));
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
        const response = await fetch("http://localhost:8000/detect", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) throw new Error("Failed to upload");

        const data = await response.json(); // Expecting: { "image_base64": "<base64string>" }

        if (data.image_base64) {
          const processedImg = `data:image/png;base64,${data.image_base64}`;
          newResults.push(processedImg);
        } else {
          newResults.push(null);
        }
      } catch (error) {
        console.error(error);
        newResults.push(null);
      }
    }

    setResults(newResults);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-6 text-green-600">Grocery Detection</h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-lg rounded-2xl p-6 flex flex-col items-center w-full max-w-md"
      >
        <p className="w-full mb-2 text-gray-600 font-medium text-center">
          Select up to 3 images ({images.length}/3)
        </p>

        <label
          htmlFor="fileInput"
          className="cursor-pointer bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
        >
          Choose Images
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

        <div className="grid grid-cols-1 gap-6 mt-4 mb-4 w-full">
          {images.map((img, index) => (
            <div key={index} className="relative flex flex-col items-center">
              <img
                src={img.preview}
                alt={`Original ${index + 1}`}
                className="rounded-xl shadow-md h-48 w-48 object-cover mb-2"
              />
              {results[index] && (
                <img
                  src={results[index]}
                  alt={`Processed ${index + 1}`}
                  className="rounded-xl shadow-md h-48 w-48 object-cover border-2 border-green-500"
                />
              )}
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
