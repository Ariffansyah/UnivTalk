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
      } catch (err) {
        console.error("Failed to fetch categories", err);
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
      console.error(err);
      setError(err.message || "Failed to create forum");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center py-10 px-4">
      <div className="w-full max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 pb-4 border-b border-gray-300">
          Create a Forum
        </h1>

        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded shadow space-y-6"
        >
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded text-sm border border-red-200">
              {error}
            </div>
          )}

          <div>
            <label className="block text-lg font-medium text-gray-900 mb-1">
              Name
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Forum names including capitalization cannot be changed.
            </p>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={21}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Forum name"
            />
            <div className="text-xs text-gray-400 mt-1 text-right">
              {21 - name.length} Characters remaining
            </div>
          </div>

          <div>
            <label className="block text-lg font-medium text-gray-900 mb-1">
              Category
            </label>
            <select
              value={categoryId || ""}
              onChange={(e) => setCategoryId(Number(e.target.value))}
              className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
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
          </div>

          <div>
            <label className="block text-lg font-medium text-gray-900 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full p-3 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="What is this forum about?"
            ></textarea>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 border border-blue-600 text-blue-600 font-bold rounded-full hover:bg-blue-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-2 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-700 transition ${
                loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {loading ? "Creating..." : "Create Forum"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateForumPage;
