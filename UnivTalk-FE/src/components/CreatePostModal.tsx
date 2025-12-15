import React, { useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { createPost } from "../services/api/posts";

interface CreatePostModalProps {
  forumId: string;
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: () => void;
}

const MAX_MEDIA_SIZE = 10 * 1024 * 1024;

const CreatePostModal: React.FC<CreatePostModalProps> = ({
  forumId,
  isOpen,
  onClose,
  onPostCreated,
}) => {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [media, setMedia] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValidationError("");
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      if (!file.type.match(/^image\/|^video\//)) {
        setValidationError("Media must be an image or video file.");
        return;
      }
      if (file.size > MAX_MEDIA_SIZE) {
        setValidationError("Media file must be smaller than 10MB.");
        return;
      }
      setMedia(file);
      setMediaPreview(URL.createObjectURL(file));
    }
  };

  const removeMedia = () => {
    setMedia(null);
    setMediaPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const validateForm = () => {
    if (!title.trim()) return "Title is required.";
    if (title.trim().length < 5) return "Title must be at least 5 characters.";
    if (!body.trim()) return "Body is required.";
    if (body.trim().length < 10) return "Body must be at least 10 characters.";
    if (media) {
      if (!media.type.match(/^image\/|^video\//))
        return "Media must be an image or video file.";
      if (media.size > MAX_MEDIA_SIZE)
        return "Media file must be smaller than 10MB.";
    }
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");
    const error = validateForm();
    if (error) {
      setValidationError(error);
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("forum_id", forumId);
      formData.append("title", title.trim());
      formData.append("body", body.trim());
      if (media) {
        formData.append("media", media);
      }
      await createPost(formData);

      setTitle("");
      setBody("");
      removeMedia();
      onPostCreated();
      onClose();
    } catch (error) {
      setValidationError(
        "Failed to create post. Please try again or check your connection.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden transform transition-all scale-100">
        <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100">
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 transition rounded-full p-2 hover:bg-gray-100"
            aria-label="Close create post modal"
            tabIndex={0}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !title.trim() || !body.trim()}
            className={`px-5 py-1.5 rounded-full font-bold text-sm transition ${
              loading || !title.trim() || !body.trim()
                ? "bg-blue-300 text-white cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
            type="button"
            tabIndex={0}
          >
            {loading ? "Posting..." : "Post"}
          </button>
        </div>

        <div className="p-4 flex gap-3">
          <div className="shrink-0">
            <div
              className="w-10 h-10 rounded-full bg-linear-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold"
              style={{ userSelect: "none" }}
            >
              {user?.username.charAt(0).toUpperCase()}
            </div>
          </div>

          <div className="flex-1 space-y-3">
            <input
              type="text"
              placeholder="Title of your discussion"
              className="w-full text-lg font-bold placeholder-gray-400 border-none focus:ring-0 p-0 text-gray-900 outline-none"
              value={title}
              minLength={5}
              maxLength={80}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <textarea
              placeholder="What's happening?"
              className="w-full min-h-[120px] text-gray-600 placeholder-gray-400 border-none focus:ring-0 p-0 resize-none text-base outline-none"
              value={body}
              minLength={10}
              maxLength={4000}
              onChange={(e) => setBody(e.target.value)}
              required
            ></textarea>

            {mediaPreview && (
              <div className="relative mt-2">
                {media?.type.includes("video") ? (
                  <video
                    src={mediaPreview}
                    controls
                    playsInline
                    preload="metadata"
                    className="rounded-xl max-h-64 w-full"
                  />
                ) : (
                  <img
                    src={mediaPreview}
                    alt="Preview"
                    loading="lazy"
                    className="rounded-xl max-h-64 w-full object-contain"
                  />
                )}
                <button
                  onClick={removeMedia}
                  className="absolute top-2 right-2 bg-gray-900 bg-opacity-75 text-white rounded-full p-1 hover:bg-opacity-100 transition"
                  aria-label="Remove attached media"
                  type="button"
                  tabIndex={0}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            )}

            {validationError && (
              <div className="mt-2 text-sm text-red-600 font-semibold bg-red-50 border border-red-200 rounded px-3 py-2">
                {validationError}
              </div>
            )}

            <div className="pt-3 border-t border-gray-100 flex items-center">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-blue-500 hover:bg-blue-50 rounded-full transition"
                title="Add Media"
                tabIndex={0}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*,video/*"
                onChange={handleFileChange}
              />
              <span className="ml-4 text-xs text-gray-400">
                JPG, PNG, MP4, MOV. Max size 10MB.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePostModal;
