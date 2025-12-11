import React, { useEffect, useState } from "react";
import { getForums, getForumPosts, createPost, votePost } from "../services/api/forums";
import PostCard from "../components/PostCard";
import { useNavigate } from "react-router-dom";

type Forum = {
  id: number | string;
  name: string;
  description?: string;
};

type Post = {
  id: number | string;
  title: string;
  body?: string;
  author?: string;
  votes?: number;
  created_at?: string;
};

const HomePage: React.FC = () => {
  const [forums, setForums] = useState<Forum[]>([]);
  const [selectedForum, setSelectedForum] = useState<Forum | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingForums, setLoadingForums] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const navigate = useNavigate();

  // token: string | undefined (bukan null)
  const token: string | undefined =
    typeof window !== "undefined" ? (localStorage.getItem("accessToken") ?? undefined) : undefined;

  useEffect(() => {
    if (!token) return;
    setLoadingForums(true);
    getForums(token)
      .then((res) => {
        setForums(res || []);
        if (res && res.length > 0) {
          setSelectedForum(res[0]);
        }
      })
      .catch((e) => {
        console.error(e);
        setError("Gagal memuat forum. Pastikan token valid.");
      })
      .finally(() => setLoadingForums(false));
  }, [token]);

  useEffect(() => {
    if (!token || !selectedForum) {
      setPosts([]);
      return;
    }
    setLoadingPosts(true);
    getForumPosts(selectedForum.id, token)
      .then((res) => setPosts(res || []))
      .catch((e) => {
        console.error(e);
        setError("Gagal memuat posting.");
      })
      .finally(() => setLoadingPosts(false));
  }, [selectedForum, token]);

  const handleCreatePost = async () => {
    if (!selectedForum) return;
    if (!newTitle.trim()) {
      alert("Judul dibutuhkan");
      return;
    }

    try {
      const created = await createPost(selectedForum.id, { title: newTitle, body: newBody }, token);
      if (created) {
        setPosts((p) => [created, ...p]);
        setNewTitle("");
        setNewBody("");
        setShowCreate(false);
      } else {
        const refreshed = await getForumPosts(selectedForum.id, token);
        setPosts(refreshed || []);
        setShowCreate(false);
      }
    } catch (err) {
      console.error(err);
      alert("Gagal membuat post. Cek console untuk detail.");
    }
  };

  const handleVote = async (postId: number | string, delta: number) => {
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, votes: (p.votes || 0) + delta } : p)));

    try {
      await votePost(postId, delta, token);
    } catch (err) {
      console.error("Vote failed:", err);
      // rollback
      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, votes: (p.votes || 0) - delta } : p)));
    }
  };

  // Single root element guaranteed
  if (!token) {
    return (
      <div className="max-w-4xl mx-auto mt-16 p-6">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <p className="font-medium">Anda belum login</p>
          <p className="text-sm">
            Silakan{" "}
            <button className="text-blue-600 underline" onClick={() => navigate("/signin")}>
              sign in
            </button>{" "}
            untuk melihat feed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-4 gap-6 mt-8 px-4">
      {/* Sidebar */}
      <aside className="col-span-1 bg-white p-4 rounded shadow">
        <h3 className="font-bold text-lg mb-3">Forums</h3>
        {loadingForums && <div>Loading forums...</div>}
        {error && <div className="text-red-600">{error}</div>}
        <ul>
          {forums.map((forum) => {
            const isSelected = selectedForum ? String(selectedForum.id) === String(forum.id) : false;
            return (
              <li
  key={String(forum.id)}
  onClick={() => setSelectedForum(forum)}
  className={`p-2 rounded cursor-pointer mb-2 ${
    isSelected
      ? "bg-blue-50 border-l-4 border-blue-400"
      : "hover:bg-gray-50"
  }`}
>
  <div className="font-medium">{forum.name}</div>
  {forum.description && (
    <div className="text-sm text-gray-500">{forum.description}</div>
  )}
</li>
            );
          })}
        </ul>
        <button className="mt-4 w-full bg-blue-600 text-white py-2 rounded" onClick={() => setShowCreate(true)}>
          Create Post
        </button>
      </aside>

      {/* Main feed */}
      <main className="col-span-3">
        <div className="bg-white p-4 rounded shadow mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">{selectedForum?.name ?? "Pilih forum"}</h2>
            {selectedForum?.description && <p className="text-sm text-gray-500">{selectedForum.description}</p>}
          </div>
          <div>
            <button className="bg-gray-100 px-3 py-1 rounded mr-2" onClick={() => window.location.reload()}>
              Refresh
            </button>
            <button className="bg-green-600 text-white px-3 py-1 rounded" onClick={() => navigate("/profile")}>
              Profile
            </button>
          </div>
        </div>

        {loadingPosts && <div>Loading posts...</div>}
        {!loadingPosts && posts.length === 0 && <div className="bg-white p-6 rounded shadow">Tidak ada posting di forum ini.</div>}
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={String(post.id)} post={post} onVote={(delta) => handleVote(post.id, delta)} />
          ))}
        </div>
      </main>

      {/* Create post modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-2xl p-6 rounded">
            <h3 className="text-lg font-bold mb-3">Create New Post in {selectedForum?.name ?? ""}</h3>
            <label className="block mb-2">
              Title
              <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="w-full mt-1 p-2 border rounded" />
            </label>
            <label className="block mb-4">
              Body
              <textarea value={newBody} onChange={(e) => setNewBody(e.target.value)} className="w-full mt-1 p-2 border rounded" rows={6} />
            </label>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded border">
                Cancel
              </button>
              <button onClick={handleCreatePost} className="px-4 py-2 rounded bg-blue-600 text-white">
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;