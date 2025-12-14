import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  createForum,
  getCategories,
  type Category,
} from "../services/api/forums";

const CreateForumPage: React.FC = () => {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await getCategories();
        if (res && res.data) {
          setCategories(res.data);
        }
      } catch (err: any) {
        setError(
          "Failed to fetch categories:  " + (err.message || "Unknown error"),
        );
      }
    };
    fetchCats();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!name.trim()) {
      setError("Forum name is required");
      setLoading(false);
      return;
    }

    if (!categoryId) {
      setError("Please select a category");
      setLoading(false);
      return;
    }

    try {
      const res = await createForum({
        title: name,
        description,
        category_id: categoryId,
      });

      const newForum = res.data;

      const newId =
        newForum.fid ||
        (newForum as any).FID ||
        (newForum as any).id ||
        (newForum as any).ID;

      if (newId) {
        navigate(`/forums/${newId}`);
      } else {
        setError("Forum created, but failed to retrieve ID for redirect.");
        setTimeout(() => navigate("/forums"), 2000);
      }
    } catch (err: any) {
      setError(err.message || "Failed to create forum");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-blue-50/30 to-indigo-50/30 flex justify-center py-12 px-4 sm:px-6">
      <div className="w-full max-w-2xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-3">
            Create a Forum
          </h1>
          <p className="text-gray-600">
            Start a new discussion space for your community
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white/80 backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-xl border border-gray-100 space-y-6"
        >
          {error && (
            <div className="bg-linear-to-r from-red-50 to-red-100 text-red-700 p-4 rounded-xl text-sm border border-red-200 font-semibold">
              ⚠️ {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              📝 Forum Name
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Forum names including capitalization cannot be changed.
            </p>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={21}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 bg-white hover:border-blue-300"
              placeholder="Enter forum name"
              autoComplete="off"
              aria-label="Forum name"
            />
            <div className="text-xs text-gray-400 mt-2 text-right font-medium">
              {21 - name.length} characters remaining
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              📂 Category
            </label>
            <div className="relative">
              <select
                value={categoryId || ""}
                onChange={(e) => setCategoryId(Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white cursor-pointer transition-all duration-200 hover:border-blue-300 appearance-none"
                aria-label="Select category"
              >
                <option value="" disabled>
                  Select a Category
                </option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                ▼
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              📄 Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 bg-white hover:border-blue-300 resize-none"
              placeholder="What is this forum about?"
              aria-label="Forum description"
            ></textarea>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-8 py-3 bg-linear-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl transition-all duration-200 ${
                loading
                  ? "opacity-50 cursor-not-allowed"
                  : "hover: shadow-lg hover:shadow-blue-500/50 hover:scale-105 cursor-pointer"
              }`}
              style={loading ? { pointerEvents: "none" } : {}}
            >
              {loading ? "⏳ Creating..." : "Create Forum"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateForumPage;
