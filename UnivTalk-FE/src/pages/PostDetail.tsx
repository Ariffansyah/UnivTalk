import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getPostById,
  getPostComments,
  votePost,
  type Post,
  getCommentVotes,
  voteComment,
  deletePost as apiDeletePost,
  updateComment,
  deleteComment as apiDeleteComment,
} from "../services/api/posts";
import { getForumById, type Forum } from "../services/api/forums";
import { useAlert } from "../context/AlertContext";

type Comment = {
  id: number;
  post_id: number;
  user_id: string;
  body: string;
  parent_comment_id: number | null;
  created_at: string;
  user?: { username: string; uid?: string };
  User?: { username: string; uid?: string };
};

type CommentWithVote = Comment & {
  upvotes?: number;
  downvotes?: number;
  my_vote?: number | null;
};
type PostWithVote = Post & { my_vote?: number | null };

const PostDetail: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { showToast, showConfirm } = useAlert();

  const [post, setPost] = useState<PostWithVote | null>(null);
  const [forum, setForum] = useState<Forum | null>(null);
  const [comments, setComments] = useState<CommentWithVote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentBody, setCommentBody] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [activeReplyId, setActiveReplyId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pendingCommentVotes, setPendingCommentVotes] = useState<
    Record<number, boolean>
  >({});
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");

  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingCommentBody, setEditingCommentBody] = useState("");

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? "N/A" : date.toLocaleString();
  };

  const getMediaUrl = (path?: string) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    return `${import.meta.env.VITE_API_URL}${path}`;
  };

  const isVideo = (type?: string) => {
    if (!type) return false;
    return type.toLowerCase().includes("video");
  };

  const fetchPostAndComments = async () => {
    try {
      const [postRes, commRes] = await Promise.all([
        getPostById(postId!),
        getPostComments(Number(postId)),
      ]);
      const p = (postRes as any).post as PostWithVote;
      const normalizedPost: PostWithVote = {
        ...p,
        upvotes: p.upvotes ?? 0,
        downvotes: p.downvotes ?? 0,
        my_vote: p.my_vote ?? null,
        created_at: (p as any).created_at ?? (p as any).CreatedAt,
      };
      setPost(normalizedPost);
      setEditTitle(normalizedPost.title);
      setEditBody(normalizedPost.body);

      const rawComments: Comment[] = ((commRes as any).comments ??
        []) as Comment[];
      const withCounts: CommentWithVote[] = await Promise.all(
        rawComments.map(async (c) => {
          try {
            const counts = await getCommentVotes(c.id);
            return {
              ...c,
              upvotes: counts.up_votes ?? 0,
              downvotes: counts.down_votes ?? 0,
              my_vote:
                typeof counts.my_vote === "number" ? counts.my_vote : null,
            };
          } catch {
            return { ...c, upvotes: 0, downvotes: 0, my_vote: null };
          }
        }),
      );
      withCounts.sort((a, b) => {
        const sa = (a.upvotes || 0) - (a.downvotes || 0);
        const sb = (b.upvotes || 0) - (b.downvotes || 0);
        if (sb !== sa) return sb - sa;
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      });
      setComments(withCounts);

      if (normalizedPost.forum_id) {
        const forumRes = await getForumById(String(normalizedPost.forum_id));
        if (forumRes && (forumRes as any).forum) {
          setForum((forumRes as any).forum as Forum);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to load post");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (postId) fetchPostAndComments();
  }, [postId]);

  const handlePostComment = async (
    e: React.FormEvent,
    parentId: number | null = null,
  ) => {
    e.preventDefault();
    const body = parentId === null ? commentBody : replyBody;
    if (!body.trim() || !postId) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/comments/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          post_id: parseInt(postId),
          parent_comment_id: parentId,
          body,
        }),
      });
      if (res.ok) {
        setCommentBody("");
        setReplyBody("");
        setActiveReplyId(null);
        fetchPostAndComments();
      } else {
        throw new Error("Failed to post comment");
      }
    } catch (err) {
      console.error("Failed to post comment:", err);
      showToast("Failed to post comment", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVotePost = async (type: "upvote" | "downvote") => {
    if (!currentUser || !post) {
      showToast("Please sign in to vote.", "warning");
      return;
    }
    const currentVote = post.my_vote ?? null;
    let action: "upvote" | "downvote" | "remove" = type;
    if (type === "upvote" && currentVote === 1) action = "remove";
    else if (type === "downvote" && currentVote === -1) action = "remove";
    setPost((prev) => {
      if (!prev) return prev;
      if (action === "remove") {
        if (currentVote === 1)
          return {
            ...prev,
            upvotes: Math.max(0, (prev.upvotes || 0) - 1),
            my_vote: null,
          };
        if (currentVote === -1)
          return {
            ...prev,
            downvotes: Math.max(0, (prev.downvotes || 0) - 1),
            my_vote: null,
          };
        return prev;
      }
      if (action === "upvote") {
        if (currentVote === -1)
          return {
            ...prev,
            upvotes: (prev.upvotes || 0) + 1,
            downvotes: Math.max(0, (prev.downvotes || 0) - 1),
            my_vote: 1,
          };
        return { ...prev, upvotes: (prev.upvotes || 0) + 1, my_vote: 1 };
      }
      if (action === "downvote") {
        if (currentVote === 1)
          return {
            ...prev,
            downvotes: (prev.downvotes || 0) + 1,
            upvotes: Math.max(0, (prev.upvotes || 0) - 1),
            my_vote: -1,
          };
        return { ...prev, downvotes: (prev.downvotes || 0) + 1, my_vote: -1 };
      }
      return prev;
    });
    try {
      await votePost(Number(post.id), action);
      const refreshed = await getPostById(String(post.id));
      const p = (refreshed as any).post as PostWithVote;
      setPost({
        ...p,
        upvotes: p.upvotes ?? 0,
        downvotes: p.downvotes ?? 0,
        my_vote: p.my_vote ?? null,
        created_at: (p as any).created_at ?? (p as any).CreatedAt,
      });
    } catch (err) {
      console.error("Vote post failed:", err);
      await fetchPostAndComments();
      showToast("Failed to vote. Please try again.", "error");
    }
  };

  const handleVoteComment = async (
    commentId: number,
    type: "upvote" | "downvote",
  ) => {
    if (!currentUser) {
      showToast("Please sign in to vote.", "warning");
      return;
    }
    if (pendingCommentVotes[commentId]) return;
    setPendingCommentVotes((prev) => ({ ...prev, [commentId]: true }));
    const target = comments.find((c) => c.id === commentId);
    const currentVote = target?.my_vote ?? null;
    let action: "upvote" | "downvote" | "remove" = type;
    if (type === "upvote" && currentVote === 1) action = "remove";
    else if (type === "downvote" && currentVote === -1) action = "remove";
    setComments((prev) =>
      prev.map((c) => {
        if (c.id !== commentId) return c;
        if (action === "remove") {
          if (currentVote === 1)
            return {
              ...c,
              upvotes: Math.max(0, (c.upvotes || 0) - 1),
              my_vote: null,
            };
          if (currentVote === -1)
            return {
              ...c,
              downvotes: Math.max(0, (c.downvotes || 0) - 1),
              my_vote: null,
            };
          return c;
        }
        if (action === "upvote") {
          if (currentVote === -1)
            return {
              ...c,
              upvotes: (c.upvotes || 0) + 1,
              downvotes: Math.max(0, (c.downvotes || 0) - 1),
              my_vote: 1,
            };
          return { ...c, upvotes: (c.upvotes || 0) + 1, my_vote: 1 };
        }
        if (action === "downvote") {
          if (currentVote === 1)
            return {
              ...c,
              downvotes: (c.downvotes || 0) + 1,
              upvotes: Math.max(0, (c.upvotes || 0) - 1),
              my_vote: -1,
            };
          return { ...c, downvotes: (c.downvotes || 0) + 1, my_vote: -1 };
        }
        return c;
      }),
    );
    try {
      await voteComment(commentId, action);
      const counts = await getCommentVotes(commentId);
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? {
                ...c,
                upvotes: counts.up_votes ?? c.upvotes ?? 0,
                downvotes: counts.down_votes ?? c.downvotes ?? 0,
                my_vote:
                  typeof counts.my_vote === "number"
                    ? counts.my_vote
                    : action === "remove"
                      ? null
                      : action === "upvote"
                        ? 1
                        : -1,
              }
            : c,
        ),
      );
    } catch (err) {
      console.error("Vote comment failed:", err);
      await fetchPostAndComments();
      showToast("Failed to vote. Please try again.", "error");
    } finally {
      setPendingCommentVotes((prev) => ({ ...prev, [commentId]: false }));
    }
  };

  const handleOpenEdit = () => {
    if (!post) return;
    setEditTitle(post.title);
    setEditBody(post.body);
    setIsEditOpen(true);
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postId) return;
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/posts/${postId}`,
        {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: editTitle, body: editBody }),
        },
      );
      if (!res.ok) throw new Error("Failed to update post");
      setIsEditOpen(false);
      await fetchPostAndComments();
    } catch (err) {
      console.error("Update post failed:", err);
      showToast("Failed to update post", "error");
    }
  };

  const handleDeletePost = async () => {
    if (!postId) return;
    const ok = await showConfirm("Delete this post permanently?");
    if (!ok) return;
    try {
      await apiDeletePost(postId);
      showToast("Post deleted.", "success");
      navigate(-1);
    } catch (err) {
      console.error("Delete post failed:", err);
      showToast("Failed to delete post", "error");
    }
  };

  const startEditComment = (commentId: number, body: string) => {
    setEditingCommentId(commentId);
    setEditingCommentBody(body);
  };

  const submitEditComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCommentId) return;
    try {
      await updateComment(editingCommentId, editingCommentBody);
      setEditingCommentId(null);
      setEditingCommentBody("");
      await fetchPostAndComments();
    } catch (err) {
      console.error("Update comment failed:", err);
      showToast("Failed to update comment", "error");
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    const ok = await showConfirm("Delete this comment?");
    if (!ok) return;
    try {
      await apiDeleteComment(commentId);
      await fetchPostAndComments();
      showToast("Comment deleted.", "success");
    } catch (err) {
      console.error("Delete comment failed:", err);
      showToast("Failed to delete comment", "error");
    }
  };

  if (loading)
    return (
      <div className="p-10 text-center text-gray-500">
        Loading discussion...
      </div>
    );
  if (error || !post)
    return (
      <div className="p-10 text-center text-red-500">
        {error || "Post not found"}
      </div>
    );

  const parentComments = comments.filter(
    (c) => !c.parent_comment_id || c.parent_comment_id === 0,
  );
  const sortedParents = [...parentComments].sort((a, b) => {
    const sa = (a.upvotes || 0) - (a.downvotes || 0);
    const sb = (b.upvotes || 0) - (b.downvotes || 0);
    if (sb !== sa) return sb - sa;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
  const getReplies = (parentId: number) =>
    comments
      .filter((c) => c.parent_comment_id === parentId)
      .sort((a, b) => {
        const sa = (a.upvotes || 0) - (a.downvotes || 0);
        const sb = (b.upvotes || 0) - (b.downvotes || 0);
        if (sb !== sa) return sb - sa;
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      });

  const postAuthor =
    post.user?.username || (post as any).User?.username || "Anonymous";
  const postAuthorUid =
    post.user?.uid || (post as any).User?.uid || post.user_id;
  const voteCount = (post.upvotes || 0) - (post.downvotes || 0);
  const upActive = post.my_vote === 1;
  const downActive = post.my_vote === -1;
  const isOwner = currentUser?.user_id === post.user_id;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 flex items-center gap-2 text-sm font-bold text-blue-600 hover:underline transition"
        >
          ← Back
        </button>

        <article className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-linear-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold uppercase">
                  {postAuthor.charAt(0)}
                </div>
                <div>
                  <button
                    onClick={() => navigate(`/profile/${postAuthorUid}`)}
                    className="font-bold text-gray-900 hover:text-blue-600 underline-offset-2 hover:underline"
                    title="View profile"
                  >
                    @{postAuthor}
                  </button>
                  <p className="text-xs text-gray-400">
                    {formatDate(post.created_at)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {forum && (
                  <button
                    onClick={() => navigate(`/forums/${forum.fid}`)}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100 transition"
                    title="View forum"
                  >
                    {forum.title}
                  </button>
                )}
                {isOwner && (
                  <>
                    <button
                      onClick={handleOpenEdit}
                      className="px-3 py-1.5 text-xs font-bold rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition"
                      title="Edit post"
                    >
                      Edit
                    </button>
                    <button
                      onClick={handleDeletePost}
                      className="px-3 py-1.5 text-xs font-bold rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
                      title="Delete post"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              {post.title}
            </h1>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap mb-6">
              {post.body}
            </p>

            {post.media_url && (
              <div className="mb-6 rounded-xl overflow-hidden bg-black border border-gray-100">
                {isVideo(post.media_type) ? (
                  <video
                    src={getMediaUrl(post.media_url)}
                    controls
                    className="w-full max-h-[500px]"
                  />
                ) : (
                  <img
                    src={getMediaUrl(post.media_url)}
                    alt="Post content"
                    className="w-full max-h-[500px] object-contain mx-auto"
                  />
                )}
              </div>
            )}

            <div className="flex items-center gap-4 pt-4 border-t border-gray-50">
              <div className="flex items-center bg-gray-50 rounded-lg border border-gray-100">
                <button
                  onClick={() => handleVotePost("upvote")}
                  className={`px-4 py-2 transition font-bold ${upActive ? "text-blue-600 hover:bg-gray-200" : "text-gray-500 hover:text-blue-600 hover:bg-gray-200"}`}
                  title={upActive ? "Remove upvote" : "Upvote"}
                >
                  ▲
                </button>
                <span className="px-2 font-bold text-gray-700">
                  {voteCount}
                </span>
                <button
                  onClick={() => handleVotePost("downvote")}
                  className={`px-4 py-2 transition font-bold ${downActive ? "text-red-500 hover:bg-gray-200" : "text-gray-500 hover:text-red-500 hover:bg-gray-200"}`}
                  title={downActive ? "Remove downvote" : "Downvote"}
                >
                  ▼
                </button>
              </div>
            </div>
          </div>
        </article>

        {isEditOpen && (
          <form
            onSubmit={handleSubmitEdit}
            className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-8"
          >
            <h3 className="text-sm font-bold text-gray-800 mb-3">Edit Post</h3>
            <input
              className="w-full p-2 mb-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-400"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Title"
            />
            <textarea
              className="w-full p-2 mb-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-400"
              rows={5}
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              placeholder="Body"
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="text-xs font-bold text-gray-500"
              >
                Cancel
              </button>
              <button className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700">
                Save
              </button>
            </div>
          </form>
        )}

        <section>
          <h2 className="text-xl font-bold text-gray-800 mb-4">Comments</h2>

          {currentUser && (
            <form
              onSubmit={(e) => handlePostComment(e, null)}
              className="mb-8 bg-white p-4 rounded-xl border border-gray-100 shadow-sm"
            >
              <textarea
                className="w-full p-3 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none h-20 transition"
                placeholder="Add a comment..."
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
              />
              <div className="flex justify-end mt-2">
                <button
                  disabled={submitting || !commentBody.trim()}
                  className="bg-blue-600 text-white px-6 py-1.5 rounded-full font-bold hover:bg-blue-700 transition text-sm disabled:opacity-50"
                >
                  Post
                </button>
              </div>
            </form>
          )}

          <div className="space-y-6">
            {sortedParents.map((comment) => {
              const commentAuthor =
                comment.user?.username || comment.User?.username || "Anonymous";
              const commentAuthorUid =
                comment.user?.uid || comment.User?.uid || comment.user_id;
              const cVoteCount =
                (comment.upvotes || 0) - (comment.downvotes || 0);
              const cUpActive = comment.my_vote === 1;
              const cDownActive = comment.my_vote === -1;
              const disabled = pendingCommentVotes[comment.id] === true;
              const isCommentOwner = currentUser?.user_id === comment.user_id;

              return (
                <div key={comment.id}>
                  <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600 uppercase">
                          {commentAuthor.charAt(0)}
                        </div>
                        <button
                          onClick={() =>
                            navigate(`/profile/${commentAuthorUid}`)
                          }
                          className="font-bold text-sm text-gray-800 hover:text-blue-600 underline-offset-2 hover:underline"
                          title="View profile"
                        >
                          @{commentAuthor}
                        </button>
                        <span className="text-[10px] text-gray-400">
                          {formatDate(comment.created_at)}
                        </span>
                      </div>
                      {isCommentOwner && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              startEditComment(comment.id, comment.body)
                            }
                            className="px-2 py-1 text-[10px] font-bold rounded bg-gray-900 text-white hover:bg-gray-800"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="px-2 py-1 text-[10px] font-bold rounded bg-red-600 text-white hover:bg-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>

                    {editingCommentId === comment.id ? (
                      <form onSubmit={submitEditComment} className="mb-3">
                        <textarea
                          className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-400"
                          rows={3}
                          value={editingCommentBody}
                          onChange={(e) =>
                            setEditingCommentBody(e.target.value)
                          }
                        />
                        <div className="flex gap-2 justify-end mt-2">
                          <button
                            type="button"
                            onClick={() => setEditingCommentId(null)}
                            className="text-xs font-bold text-gray-500"
                          >
                            Cancel
                          </button>
                          <button className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700">
                            Save
                          </button>
                        </div>
                      </form>
                    ) : (
                      <p className="text-gray-700 text-sm mb-3 leading-relaxed">
                        {comment.body}
                      </p>
                    )}

                    <div className="flex items-center gap-3">
                      <div className="flex items-center bg-gray-50 rounded-lg border border-gray-100">
                        <button
                          disabled={disabled}
                          onClick={() =>
                            handleVoteComment(comment.id, "upvote")
                          }
                          className={`px-3 py-1.5 transition font-bold text-xs ${
                            cUpActive
                              ? "text-blue-600 hover:bg-gray-200"
                              : "text-gray-600 hover:text-blue-600 hover:bg-gray-200"
                          } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
                          title={cUpActive ? "Remove upvote" : "Upvote"}
                        >
                          ▲
                        </button>
                        <span className="text-xs font-bold text-gray-700 px-2">
                          {cVoteCount}
                        </span>
                        <button
                          disabled={disabled}
                          onClick={() =>
                            handleVoteComment(comment.id, "downvote")
                          }
                          className={`px-3 py-1.5 transition font-bold text-xs ${
                            cDownActive
                              ? "text-red-500 hover:bg-gray-200"
                              : "text-gray-600 hover:text-red-500 hover:bg-gray-200"
                          } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
                          title={cDownActive ? "Remove downvote" : "Downvote"}
                        >
                          ▼
                        </button>
                      </div>
                      {currentUser && (
                        <button
                          onClick={() =>
                            setActiveReplyId(
                              activeReplyId === comment.id ? null : comment.id,
                            )
                          }
                          className="text-xs font-bold text-blue-600 hover:underline"
                        >
                          Reply
                        </button>
                      )}
                    </div>
                  </div>

                  {activeReplyId === comment.id && (
                    <form
                      onSubmit={(e) => handlePostComment(e, comment.id)}
                      className="ml-10 mt-3 flex flex-col gap-2"
                    >
                      <input
                        className="w-full p-2 bg-white border border-blue-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-400"
                        placeholder="Write a reply..."
                        autoFocus
                        value={replyBody}
                        onChange={(e) => setReplyBody(e.target.value)}
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => setActiveReplyId(null)}
                          className="text-xs font-bold text-gray-400"
                        >
                          Cancel
                        </button>
                        <button
                          disabled={!replyBody.trim()}
                          className="bg-blue-600 text-white px-4 py-1 rounded-full text-xs font-bold"
                        >
                          Reply
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="ml-10 mt-3 space-y-3 border-l-2 border-gray-100 pl-4">
                    {getReplies(comment.id).map((reply) => {
                      const replyAuthor =
                        reply.user?.username ||
                        reply.User?.username ||
                        "Anonymous";
                      const replyAuthorUid =
                        reply.user?.uid || reply.User?.uid || reply.user_id;
                      const rVoteCount =
                        (reply.upvotes || 0) - (reply.downvotes || 0);
                      const rUpActive = reply.my_vote === 1;
                      const rDownActive = reply.my_vote === -1;
                      const rDisabled = pendingCommentVotes[reply.id] === true;
                      const isReplyOwner =
                        currentUser?.user_id === reply.user_id;

                      return (
                        <div
                          key={reply.id}
                          className="bg-gray-50 p-3 rounded-lg border border-gray-100"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() =>
                                  navigate(`/profile/${replyAuthorUid}`)
                                }
                                className="font-bold text-xs text-gray-700 hover:text-blue-600 underline-offset-2 hover:underline"
                                title="View profile"
                              >
                                @{replyAuthor}
                              </button>
                              <span className="text-[9px] text-gray-400">
                                {formatDate(reply.created_at)}
                              </span>
                            </div>
                            {isReplyOwner && (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() =>
                                    startEditComment(reply.id, reply.body)
                                  }
                                  className="px-2 py-1 text-[10px] font-bold rounded bg-gray-900 text-white hover:bg-gray-800"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteComment(reply.id)}
                                  className="px-2 py-1 text-[10px] font-bold rounded bg-red-600 text-white hover:bg-red-700"
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>

                          {editingCommentId === reply.id ? (
                            <form onSubmit={submitEditComment} className="mb-3">
                              <textarea
                                className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-400"
                                rows={3}
                                value={editingCommentBody}
                                onChange={(e) =>
                                  setEditingCommentBody(e.target.value)
                                }
                              />
                              <div className="flex gap-2 justify-end mt-2">
                                <button
                                  type="button"
                                  onClick={() => setEditingCommentId(null)}
                                  className="text-xs font-bold text-gray-500"
                                >
                                  Cancel
                                </button>
                                <button className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700">
                                  Save
                                </button>
                              </div>
                            </form>
                          ) : (
                            <p className="text-gray-600 text-sm mb-3">
                              {reply.body}
                            </p>
                          )}

                          <div className="flex items-center bg-gray-50 rounded-lg border border-gray-100 w-fit">
                            <button
                              disabled={rDisabled}
                              onClick={() =>
                                handleVoteComment(reply.id, "upvote")
                              }
                              className={`px-2 py-1.5 transition font-bold text-xs ${rUpActive ? "text-blue-600 hover:bg-gray-200" : "text-gray-600 hover:text-blue-600 hover:bg-gray-200"} ${rDisabled ? "opacity-60 cursor-not-allowed" : ""}`}
                              title={rUpActive ? "Remove upvote" : "Upvote"}
                            >
                              ▲
                            </button>
                            <span className="text-xs font-bold text-gray-700 px-2">
                              {rVoteCount}
                            </span>
                            <button
                              disabled={rDisabled}
                              onClick={() =>
                                handleVoteComment(reply.id, "downvote")
                              }
                              className={`px-2 py-1.5 transition font-bold text-xs ${rDownActive ? "text-red-500 hover:bg-gray-200" : "text-gray-600 hover:text-red-500 hover:bg-gray-200"} ${rDisabled ? "opacity-60 cursor-not-allowed" : ""}`}
                              title={
                                rDownActive ? "Remove downvote" : "Downvote"
                              }
                            >
                              ▼
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};

export default PostDetail;