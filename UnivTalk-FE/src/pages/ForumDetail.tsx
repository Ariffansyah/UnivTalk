import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Link } from "react-router-dom";

type Forum = {
  id: string;
  name: string;
  description?: string;
  members_count?: number;
  is_member?: boolean;
};

type Post = {
  id: number;
  title: string;
  body?: string;
  author_id?: string;
  author_name?: string;
  created_at?: string;
  votes_count?: number;
  comments_count?: number;
  user_vote?: "upvote" | "downvote" | null;
};

const ForumDetail: React.FC = () => {
  const { forumId } = useParams<{ forumId: string }>();
  const token = localStorage.getItem("token") || "";

  const [forum, setForum] = useState<Forum | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostBody, setNewPostBody] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch forum detail
        const forumRes = await fetch(
          `${import.meta.env.VITE_API_URL}/forums/${forumId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (!forumRes.ok) throw new Error("Failed to fetch forum");
        const forumData = await forumRes.json();
        const forumInfo: Forum = {
          id: forumData.id || forumData.fid || forumId || "",
          name: forumData.name || forumData.title || "Untitled",
          description: forumData.description || "",
          members_count: forumData.members_count || 0,
          is_member: forumData.is_member || false,
        };
        setForum(forumInfo);
        setIsMember(forumInfo.is_member || false);

        // Fetch posts
        const postsRes = await fetch(
          `${import.meta.env.VITE_API_URL}/forums/${forumId}/posts`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (!postsRes.ok) throw new Error("Failed to fetch posts");
        const postsData = await postsRes.json();
        const postsList = Array.isArray(postsData)
          ? postsData
          : postsData.posts || postsData.data || [];
        setPosts(
          postsList.map((p: any) => ({
            id: p.id,
            title: p.title || "Untitled",
            body: p.body || p.content || "",
            author_name: p.author_name || p.username || "Anonymous",
            created_at: p.created_at || "",
            votes_count: p.votes_count || p.vote_count || 0,
            comments_count: p.comments_count || p.comment_count || 0,
            user_vote: p.user_vote || null,
          })),
        );
      } catch (err: any) {
        setError(err.message || "Error loading forum");
      } finally {
        setLoading(false);
      }
    };

    if (forumId && token) {
      fetchData();
    }
  }, [forumId, token]);

  const handleJoinLeave = async () => {
    try {
      const endpoint = isMember ? "leave" : "join";
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/forums/${forumId}/${endpoint}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!res.ok) throw new Error(`Failed to ${endpoint} forum`);
      setIsMember(!isMember);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostTitle.trim()) {
      alert("Post title required");
      return;
    }
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/posts/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          forum_id: forumId,
          title: newPostTitle,
          body: newPostBody,
        }),
      });
      if (!res.ok) throw new Error("Failed to create post");
      setNewPostTitle("");
      setNewPostBody("");
      // Refresh posts
      const postsRes = await fetch(
        `${import.meta.env.VITE_API_URL}/forums/${forumId}/posts`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const postsData = await postsRes.json();
      const postsList = Array.isArray(postsData)
        ? postsData
        : postsData.posts || [];
      setPosts(
        postsList.map((p: any) => ({
          id: p.id,
          title: p.title || "Untitled",
          body: p.body || "",
          author_name: p.author_name || p.username || "Anonymous",
          votes_count: p.votes_count || 0,
          comments_count: p.comments_count || 0,
        })),
      );
    } catch (err: any) {
      alert(err.message || "Error creating post");
    }
  };

  const handleVote = async (postId: number, voteType: "upvote" | "downvote") => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/posts/${postId}/${voteType}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!res.ok) throw new Error(`Failed to ${voteType}`);
      // Update UI
      setPosts(
        posts.map((p) =>
          p.id === postId
            ? {
                ...p,
                votes_count:
                  p.user_vote === voteType
                    ? (p.votes_count ?? 0) - 1
                    : p.user_vote === (voteType === "upvote" ? "downvote" : "upvote")
                      ? (p.votes_count ?? 0) + 2
                      : (p.votes_count ?? 0) + 1,
                user_vote: p.user_vote === voteType ? null : voteType,
              }
            : p,
        ),
      );
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading)
    return (
      <div className="max-w-3xl mx-auto p-4 mt-8 text-gray-600">
        Loading...
      </div>
    );

  if (!forum)
    return (
      <div className="max-w-3xl mx-auto p-4 mt-8 text-red-600">
        Forum not found
      </div>
    );

  return (
    <div className="max-w-3xl mx-auto p-4 mt-8">
      <div className="mb-6 border p-4 rounded">
        <h1 className="text-3xl font-bold mb-2">{forum.name}</h1>
        {forum.description && (
          <p className="text-gray-700 mb-2">{forum.description}</p>
        )}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">
            Members: {forum.members_count}
          </span>
          <button
            onClick={handleJoinLeave}
            className={`px-4 py-2 rounded font-semibold ${
              isMember
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {isMember ? "Leave" : "Join"}
          </button>
        </div>
      </div>

      {error && (
        <div className="text-red-600 mb-4 bg-red-50 p-3 rounded">{error}</div>
      )}

      {isMember && (
        <form
          onSubmit={handleCreatePost}
          className="bg-white border p-4 rounded mb-6"
        >
          <h3 className="text-lg font-semibold mb-3">Create Post</h3>
          <input
            type="text"
            placeholder="Post title"
            value={newPostTitle}
            onChange={(e) => setNewPostTitle(e.target.value)}
            required
            className="w-full p-2 border rounded mb-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <textarea
            placeholder="Post body (optional)"
            value={newPostBody}
            onChange={(e) => setNewPostBody(e.target.value)}
            className="w-full p-2 border rounded mb-3 h-20 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Post
          </button>
        </form>
      )}

      <div className="space-y-4">
        <h2 className="text-xl font-bold">Posts</h2>
        {posts.length === 0 ? (
          <p className="text-gray-600">No posts yet.</p>
        ) : (
          posts.map((post) => (
            <Link
              key={post.id}
              to={`/posts/${post.id}`}
              className="border p-4 rounded hover:shadow transition block"
            >
              <h3 className="font-semibold text-lg text-blue-600 hover:underline">
                {post.title}
              </h3>
              {post.body && (
                <p className="text-gray-700 my-2 line-clamp-2">{post.body}</p>
              )}
              <div className="text-sm text-gray-600 mb-2">
                By {post.author_name} • {post.created_at}
              </div>
              <div className="flex gap-3 items-center">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleVote(post.id, "upvote");
                  }}
                  className={`px-3 py-1 rounded text-sm ${
                    post.user_vote === "upvote"
                      ? "bg-green-200 text-green-700"
                      : "bg-gray-200 hover:bg-gray-300"
                  }`}
                >
                  👍 {post.votes_count}
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleVote(post.id, "downvote");
                  }}
                  className={`px-3 py-1 rounded text-sm ${
                    post.user_vote === "downvote"
                      ? "bg-red-200 text-red-700"
                      : "bg-gray-200 hover:bg-gray-300"
                  }`}
                >
                  👎
                </button>
                <span className="text-xs text-gray-600 ml-2">
                  💬 {post.comments_count} comments
                </span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
};

export default ForumDetail;
