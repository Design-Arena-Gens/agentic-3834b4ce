'use client';

import { useState } from 'react';

export default function Home() {
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string>('');
  const [description, setDescription] = useState('');
  const [text, setText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string>('');
  const [error, setError] = useState('');

  const handleSelfieUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelfieFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelfiePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!selfieFile || !description) {
      setError('Please upload a selfie and provide a description');
      return;
    }

    setIsGenerating(true);
    setError('');
    setGeneratedImage('');

    try {
      const formData = new FormData();
      formData.append('selfie', selfieFile);
      formData.append('description', description);
      formData.append('text', text);

      const response = await fetch('/api/generate', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate thumbnail');
      }

      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);
      setGeneratedImage(imageUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (generatedImage) {
      const a = document.createElement('a');
      a.href = generatedImage;
      a.download = 'thumbnail.png';
      a.click();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2 text-gray-800 dark:text-white">
          Thumbnail Generator
        </h1>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
          Upload your selfie and create custom thumbnails with AI
        </p>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Input Section */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Upload Your Selfie
                </label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center hover:border-purple-500 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleSelfieUpload}
                    className="hidden"
                    id="selfie-upload"
                  />
                  <label
                    htmlFor="selfie-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    {selfiePreview ? (
                      <img
                        src={selfiePreview}
                        alt="Selfie preview"
                        className="max-h-48 rounded-lg mb-2"
                      />
                    ) : (
                      <div className="text-gray-500 dark:text-gray-400">
                        <svg
                          className="mx-auto h-12 w-12 mb-2"
                          stroke="currentColor"
                          fill="none"
                          viewBox="0 0 48 48"
                        >
                          <path
                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <span className="text-sm">Click to upload image</span>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Thumbnail Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the style and mood you want (e.g., 'professional tech tutorial with blue gradient background')"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Text on Thumbnail (Optional)
                </label>
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Enter text to display"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              <button
                onClick={handleGenerate}
                disabled={isGenerating || !selfieFile || !description}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
              >
                {isGenerating ? 'Generating...' : 'Generate Thumbnail'}
              </button>

              {error && (
                <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded">
                  {error}
                </div>
              )}
            </div>

            {/* Output Section */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Generated Thumbnail
                </label>
                <div className="border-2 border-gray-300 dark:border-gray-600 rounded-lg p-4 min-h-[300px] flex items-center justify-center bg-gray-50 dark:bg-gray-700">
                  {isGenerating ? (
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
                      <p className="text-gray-600 dark:text-gray-400">Creating your thumbnail...</p>
                    </div>
                  ) : generatedImage ? (
                    <img
                      src={generatedImage}
                      alt="Generated thumbnail"
                      className="max-w-full rounded-lg"
                    />
                  ) : (
                    <p className="text-gray-400 dark:text-gray-500">
                      Your thumbnail will appear here
                    </p>
                  )}
                </div>
              </div>

              {generatedImage && (
                <button
                  onClick={handleDownload}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                >
                  Download Thumbnail
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
