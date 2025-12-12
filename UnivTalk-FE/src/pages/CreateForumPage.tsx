import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const CreateForumPage: React.FC = () => {
  const token = localStorage.getItem("token") || "";
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    description: "",
    category_id: "",
  });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!form.name.trim()) {
      setError("Forum name is required");
      return;
    }

    if (form.name.length < 3) {
      setError("Forum name must be at least 3 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/forums/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          category_id: form.category_id || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create forum");
      }

      const data = await res.json();
      const forumId = data.forum_id || data.id || data.fid;
      navigate(`/forums/${forumId}`);
    } catch (err: any) {
      setError(err.message || "Error creating forum");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    navigate("/signin");
    return null;
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md mt-10"
    >
      <h2 className="text-2xl font-bold mb-6 text-center">Create Forum</h2>

      <div className="mb-4">
        <label className="block mb-1 font-medium">
          Forum Name:
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            className="w-full mt-1 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Enter forum name"
            minLength={3}
          />
        </label>
      </div>

      <div className="mb-4">
        <label className="block mb-1 font-medium">
          Description:
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            className="w-full mt-1 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400 h-24"
            placeholder="Describe your forum (optional)"
          />
        </label>
      </div>

      <div className="mb-6">
        <label className="block mb-1 font-medium">
          Category ID (optional):
          <input
            type="text"
            name="category_id"
            value={form.category_id}
            onChange={handleChange}
            className="w-full mt-1 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Leave empty if no category"
          />
        </label>
      </div>

      {error && (
        <div className="mb-4 text-red-600 rounded px-4 py-2 bg-red-50 border border-red-200">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white font-semibold py-2 rounded hover:bg-blue-700 transition disabled:opacity-60"
      >
        {loading ? "Creating..." : "Create Forum"}
      </button>
    </form>
  );
};

export default CreateForumPage;
