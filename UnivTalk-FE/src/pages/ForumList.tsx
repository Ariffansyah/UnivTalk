import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

type Forum = {
  id: string;
  name: string;
  description?: string;
  members_count?: number;
};

const ForumList: React.FC = () => {
  const [forums, setForums] = useState<Forum[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchForums = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("token") || "";
        const res = await fetch(`${import.meta.env.VITE_API_URL}/forums/`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(txt || "Failed to fetch forums");
        }
        const data = await res.json();
        // Assume API returns array under `forums` or directly
        const list = Array.isArray(data) ? data : data.forums || data.data || [];
        setForums(
          list.map((f: any) => ({
            id: f.id || f.fid || f.uuid || f.forum_id || String(f.id),
            name: f.name || f.title || f.forum_name || "Untitled",
            description: f.description || f.desc || "",
            members_count: f.members_count || f.member_count || f.members || 0,
          })),
        );
      } catch (err: any) {
        setError(err.message || "Error fetching forums");
      } finally {
        setLoading(false);
      }
    };

    fetchForums();
  }, []);

  return (
    <div className="max-w-3xl mx-auto mt-8 p-4">
      <h1 className="text-2xl font-bold mb-4">Forums</h1>

      {loading && <div className="text-gray-600">Loading forums...</div>}
      {error && (
        <div className="text-red-600 mb-4 bg-red-50 p-3 rounded">{error}</div>
      )}

      {!loading && forums.length === 0 && (
        <div className="text-gray-600">No forums available.</div>
      )}

      <ul className="space-y-3">
        {forums.map((f) => (
          <li key={f.id} className="border p-3 rounded hover:shadow">
            <Link to={`/forums/${f.id}`} className="text-lg font-semibold text-blue-600">
              {f.name}
            </Link>
            {f.description && <p className="text-sm text-gray-600">{f.description}</p>}
            <div className="text-xs text-gray-500">Members: {f.members_count ?? 0}</div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ForumList;
