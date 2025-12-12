import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

type Post = {
  id: number;
  title: string;
  body?: string;
  author_id?: string;
  author_name?: string;
  created_at?: string;
  votes_count?: number;
  user_vote?: "upvote" | "downvote" | null;
};

type Comment = {
  id: number;
  body: string;
  author_name?: string;
  author_id?: string;
  created_at?: string;
  votes_count?: number;
  user_vote?: "upvote" | "downvote" | null;
};

const PostDetail: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const token = localStorage.getItem("token") || "";

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentBody, setCommentBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch post detail
        const postRes = await fetch(
          `${import.meta.env.VITE_API_URL}/posts/${postId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (!postRes.ok) throw new Error("Failed to fetch post");
        const postData = await postRes.json();
        setPost({
          id: postData.id,
          title: postData.title || "Untitled",
          body: postData.body || postData.content || "",
          author_name: postData.author_name || postData.username || "Anonymous",
          created_at: postData.created_at || "",
          votes_count: postData.votes_count || 0,
          user_vote: postData.user_vote || null,
        });

        // Fetch comments
        const commentsRes = await fetch(
          `${import.meta.env.VITE_API_URL}/posts/${postId}/comments`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (!commentsRes.ok) throw new Error("Failed to fetch comments");
        const commentsData = await commentsRes.json();
        const commentsList = Array.isArray(commentsData)
          ? commentsData
          : commentsData.comments || [];
        setComments(
          commentsList.map((c: any) => ({
            id: c.id,
            body: c.body || c.content || "",
            author_name: c.author_name || c.username || "Anonymous",
            created_at: c.created_at || "",
            votes_count: c.votes_count || 0,
            user_vote: c.user_vote || null,
          })),
        );
      } catch (err: any) {
        setError(err.message || "Error loading post");
      } finally {
        setLoading(false);
      }
    };

    if (postId && token) {
      fetchData();
    }
  }, [postId, token]);

  const handleCreateComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentBody.trim()) {
      alert("Comment cannot be empty");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/comments/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          post_id: postId,
          body: commentBody,
        }),
      });
      if (!res.ok) throw new Error("Failed to create comment");
      setCommentBody("");
      
      // Refresh comments
      const commentsRes = await fetch(
        `${import.meta.env.VITE_API_URL}/posts/${postId}/comments`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const commentsData = await commentsRes.json();
      const commentsList = Array.isArray(commentsData)
        ? commentsData
        : commentsData.comments || [];
      setComments(
        commentsList.map((c: any) => ({
          id: c.id,
          body: c.body || "",
          author_name: c.author_name || "Anonymous",
          created_at: c.created_at || "",
          votes_count: c.votes_count || 0,
        })),
      );
    } catch (err: any) {
      alert(err.message || "Error creating comment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVotePost = async (voteType: "upvote" | "downvote") => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/posts/${postId}/${voteType}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!res.ok) throw new Error(`Failed to ${voteType}`);
      setPost((prev) =>
        prev
          ? {
              ...prev,
              votes_count:
                prev.user_vote === voteType
                  ? (prev.votes_count ?? 0) - 1
                  : prev.user_vote === (voteType === "upvote" ? "downvote" : "upvote")
                    ? (prev.votes_count ?? 0) + 2
                    : (prev.votes_count ?? 0) + 1,
              user_vote: prev.user_vote === voteType ? null : voteType,
            }
          : null,
      );
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleVoteComment = async (
    commentId: number,
    voteType: "upvote" | "downvote",
  ) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/comments/${commentId}/${voteType}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!res.ok) throw new Error(`Failed to ${voteType}`);
      setComments(
        comments.map((c) =>
          c.id === commentId
            ? {
                ...c,
                votes_count:
                  c.user_vote === voteType
                    ? (c.votes_count ?? 0) - 1
                    : c.user_vote === (voteType === "upvote" ? "downvote" : "upvote")
                      ? (c.votes_count ?? 0) + 2
                      : (c.votes_count ?? 0) + 1,
                user_vote: c.user_vote === voteType ? null : voteType,
              }
            : c,
        ),
      );
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading)
    return (
      <div className="max-w-2xl mx-auto p-4 mt-8 text-gray-600">
        Loading...
      </div>
    );

  if (!post)
    return (
      <div className="max-w-2xl mx-auto p-4 mt-8 text-red-600">
        Post not found
      </div>
    );

  return (
    <div className="max-w-2xl mx-auto p-4 mt-8">
      {error && (
        <div className="text-red-600 mb-4 bg-red-50 p-3 rounded">{error}</div>
      )}

      <article className="border p-6 rounded mb-6">
        <h1 className="text-3xl font-bold mb-2">{post.title}</h1>
        <div className="text-sm text-gray-600 mb-4">
          By {post.author_name} • {post.created_at}
        </div>
        {post.body && <p className="text-gray-700 mb-4">{post.body}</p>}

        <div className="flex gap-3 items-center border-t pt-4">
          <button
            onClick={() => handleVotePost("upvote")}
            className={`px-3 py-1 rounded text-sm ${
              post.user_vote === "upvote"
                ? "bg-green-200 text-green-700"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            👍 {post.votes_count}
          </button>
          <button
            onClick={() => handleVotePost("downvote")}
            className={`px-3 py-1 rounded text-sm ${
              post.user_vote === "downvote"
                ? "bg-red-200 text-red-700"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            👎
          </button>
        </div>
      </article>

      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Comments ({comments.length})</h2>

        <form
          onSubmit={handleCreateComment}
          className="bg-white border p-4 rounded mb-6"
        >
          <textarea
            placeholder="Write a comment..."
            value={commentBody}
            onChange={(e) => setCommentBody(e.target.value)}
            required
            className="w-full p-2 border rounded mb-3 h-20 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            type="submit"
            disabled={submitting}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-60"
          >
            {submitting ? "Posting..." : "Post Comment"}
          </button>
        </form>

        <div className="space-y-4">
          {comments.length === 0 ? (
            <p className="text-gray-600">No comments yet.</p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="border p-4 rounded">
                <div className="text-sm text-gray-600 mb-2">
                  {comment.author_name} • {comment.created_at}
                </div>
                <p className="text-gray-700 mb-3">{comment.body}</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleVoteComment(comment.id, "upvote")}
                    className={`px-3 py-1 rounded text-sm ${
                      comment.user_vote === "upvote"
                        ? "bg-green-200 text-green-700"
                        : "bg-gray-200 hover:bg-gray-300"
                    }`}
                  >
                    👍 {comment.votes_count}
                  </button>
                  <button
                    onClick={() => handleVoteComment(comment.id, "downvote")}
                    className={`px-3 py-1 rounded text-sm ${
                      comment.user_vote === "downvote"
                        ? "bg-red-200 text-red-700"
                        : "bg-gray-200 hover:bg-gray-300"
                    }`}
                  >
                    👎
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PostDetail;
