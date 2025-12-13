import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getForumById,
  joinForum,
  leaveForum,
  getForumMembers,
  deleteForum,
  type Forum,
} from "../services/api/forums";
import { getPostsByForum, votePost, type Post } from "../services/api/posts";
import { useAuth } from "../context/AuthContext";
import CreatePostModal from "../components/CreatePostModal";
import { useAlert } from "../context/AlertContext";

const getValidDate = (dateString?: string) => {
  if (!dateString) return new Date();
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? new Date() : date;
};

const formatDate = (dateString?: string) => {
  return getValidDate(dateString).toLocaleDateString();
};

const getYear = (dateString?: string) => {
  return getValidDate(dateString).getFullYear();
};

type PostWithVote = Post & { my_vote?: number | null };

const ForumDetail: React.FC = () => {
  const { forumId } = useParams<{ forumId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast, showConfirm } = useAlert();

  const [forum, setForum] = useState<Forum | null>(null);
  const [posts, setPosts] = useState<PostWithVote[]>([]);
  const [realMemberCount, setRealMemberCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [myRole, setMyRole] = useState<string | null>(null);
  const [joinLoading, setJoinLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const fetchPosts = async () => {
    if (!forumId) return;
    try {
      const postsRes = await getPostsByForum(forumId);
      const incoming = (postsRes as any).posts ?? postsRes;
      const mapped: PostWithVote[] = (incoming as Post[]).map((p: any) => ({
        ...p,
        upvotes: p.upvotes ?? 0,
        downvotes: p.downvotes ?? 0,
        my_vote: p.my_vote ?? null,
        created_at: p.created_at ?? p.CreatedAt,
      }));
      setPosts(mapped);
    } catch (err) {
      console.error("Failed fetching posts:", err);
      showToast("Failed to fetch posts", "error");
    }
  };

  useEffect(() => {
    if (!forumId) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const forumRes = await getForumById(forumId);
        if (forumRes && forumRes.forum) {
          setForum(forumRes.forum);
          setEditTitle(forumRes.forum.title || "");
          setEditDescription(forumRes.forum.description || "");
        } else {
          setError("Forum not found");
          setLoading(false);
          return;
        }
        await fetchPosts();
        try {
          const membersRes = await getForumMembers(forumId);
          if (membersRes && membersRes.forum_members) {
            setRealMemberCount(membersRes.forum_members.length);
            if (user) {
              const myRecord = membersRes.forum_members.find(
                (member: any) => member.user_id === user.user_id,
              );
              if (myRecord) {
                setIsMember(true);
                setMyRole(myRecord.role);
              } else {
                setIsMember(false);
                setMyRole(null);
              }
            }
          }
        } catch (err) {
          console.error("Failed fetching members:", err);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [forumId, user]);

  const hasAdminPower = user?.is_admin || myRole === "admin";

  const handleJoinLeave = async () => {
    if (!forumId || !user || joinLoading) return;
    if (hasAdminPower) {
      showToast("Admins cannot leave.", "warning");
      return;
    }
    setJoinLoading(true);
    try {
      if (isMember) {
        await leaveForum(forumId);
        setIsMember(false);
        setMyRole(null);
        setRealMemberCount((prev) => Math.max(0, prev - 1));
        showToast("Left community.", "info");
      } else {
        await joinForum(forumId);
        setIsMember(true);
        setMyRole("member");
        setRealMemberCount((prev) => prev + 1);
        showToast("Joined community.", "success");
      }
    } catch (err) {
      console.error("Join/Leave error:", err);
      showToast("Failed to update membership. Please try again.", "error");
    } finally {
      setJoinLoading(false);
    }
  };

  const handleVote = async (postId: number, type: "upvote" | "downvote") => {
    if (!user) {
      showToast("Please sign in to vote.", "warning");
      return;
    }
    const targetPost = posts.find((p) => p.id === postId);
    const currentVote = targetPost?.my_vote ?? null;
    let action: "upvote" | "downvote" | "remove" = type;
    if (type === "upvote" && currentVote === 1) action = "remove";
    else if (type === "downvote" && currentVote === -1) action = "remove";

    setPosts((prevPosts) =>
      prevPosts.map((p) => {
        if (p.id !== postId) return p;
        if (action === "remove") {
          if (currentVote === 1) {
            return {
              ...p,
              upvotes: Math.max(0, (p.upvotes || 0) - 1),
              my_vote: null,
            };
          }
          if (currentVote === -1) {
            return {
              ...p,
              downvotes: Math.max(0, (p.downvotes || 0) - 1),
              my_vote: null,
            };
          }
          return p;
        }
        if (action === "upvote") {
          if (currentVote === -1) {
            return {
              ...p,
              upvotes: (p.upvotes || 0) + 1,
              downvotes: Math.max(0, (p.downvotes || 0) - 1),
              my_vote: 1,
            };
          }
          return { ...p, upvotes: (p.upvotes || 0) + 1, my_vote: 1 };
        }
        if (action === "downvote") {
          if (currentVote === 1) {
            return {
              ...p,
              downvotes: (p.downvotes || 0) + 1,
              upvotes: Math.max(0, (p.upvotes || 0) - 1),
              my_vote: -1,
            };
          }
          return { ...p, downvotes: (p.downvotes || 0) + 1, my_vote: -1 };
        }
        return p;
      }),
    );

    try {
      await votePost(postId, action);
      await fetchPosts();
    } catch (err) {
      console.error("Vote failed:", err);
      await fetchPosts();
      showToast("Failed to vote. Please try again.", "error");
    }
  };

  const handleDeleteForum = async () => {
    if (!forumId) return;
    const ok = await showConfirm("DANGER: Delete this forum?");
    if (!ok) return;
    try {
      await deleteForum(forumId);
      showToast("Forum deleted.", "success");
      navigate("/forums");
    } catch (err) {
      console.error("Delete forum failed:", err);
      showToast("Failed to delete forum", "error");
    }
  };

  const handleOpenEditForum = () => {
    if (!forum) return;
    setEditTitle(forum.title || "");
    setEditDescription(forum.description || "");
    setIsEditOpen(true);
  };

  const handleSubmitEditForum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forumId) return;
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/forums/${forumId}`,
        {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: editTitle,
            description: editDescription,
          }),
        },
      );
      if (!res.ok) throw new Error("Failed to update forum");
      setIsEditOpen(false);
      const forumRes = await getForumById(forumId);
      if (forumRes && forumRes.forum) {
        setForum(forumRes.forum);
        showToast("Forum updated.", "success");
      }
    } catch (err) {
      console.error("Update forum failed:", err);
      showToast("Failed to update forum", "error");
    }
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

  if (loading)
    return <div className="p-10 text-center text-gray-600">Loading...</div>;
  if (error || !forum)
    return (
      <div className="p-10 text-center text-red-500 font-medium">{error}</div>
    );

  const forumCreatedAt = forum.created_at || (forum as any).CreatedAt;
  const sortedPosts = [...posts].sort((a, b) => {
    const sa = (a.upvotes || 0) - (a.downvotes || 0);
    const sb = (b.upvotes || 0) - (b.downvotes || 0);
    if (sb !== sa) return sb - sa;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-linear-to-r from-blue-600 to-indigo-700 h-40 w-full shadow-inner"></div>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8 relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
            <div className="flex items-end gap-5">
              <div className="w-28 h-28 bg-white rounded-xl p-1 shadow-md">
                <div className="w-full h-full bg-blue-50 rounded-lg flex items-center justify-center text-5xl font-bold text-blue-600">
                  {forum.title.charAt(0).toUpperCase()}
                </div>
              </div>
              <div className="mb-1">
                <h1 className="text-3xl font-bold text-gray-900">
                  {forum.title}
                </h1>
                <p className="text-gray-500 font-medium">Community Forum</p>
              </div>
            </div>
            {user && (
              <div className="flex items-center gap-3">
                {hasAdminPower ? (
                  <>
                    <div className="px-4 py-2 bg-yellow-50 text-yellow-700 font-bold rounded-lg border border-yellow-200 flex items-center gap-2 cursor-default">
                      <span>👑</span>{" "}
                      {user.is_admin ? "System Admin" : "Forum Admin"}
                    </div>
                    <button
                      onClick={handleOpenEditForum}
                      className="px-6 py-2 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition shadow-sm"
                    >
                      Edit Forum
                    </button>
                    <button
                      onClick={handleDeleteForum}
                      className="px-6 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition shadow-sm"
                    >
                      Delete Forum
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleJoinLeave}
                    disabled={joinLoading}
                    className={`px-8 py-2.5 rounded-lg font-semibold transition shadow-sm ${
                      isMember
                        ? "bg-white border-2 border-red-500 text-red-500 hover:bg-red-50"
                        : "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md"
                    } ${joinLoading ? "opacity-70 cursor-wait" : ""}`}
                  >
                    {joinLoading
                      ? "Processing..."
                      : isMember
                        ? "Leave Community"
                        : "Join Community"}
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="mt-6 pt-6 border-t border-gray-100 flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <div className="flex flex-col">
                <span className="font-bold text-gray-900 text-lg">
                  {realMemberCount}
                </span>
                <span className="text-xs uppercase tracking-wide text-gray-400">
                  Members
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-gray-900 text-lg">
                  {posts.length}
                </span>
                <span className="text-xs uppercase tracking-wide text-gray-400">
                  Posts
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-gray-900 text-lg">
                  {getYear(forumCreatedAt)}
                </span>
                <span className="text-xs uppercase tracking-wide text-gray-400">
                  Established
                </span>
              </div>
            </div>
            <p className="text-gray-600 flex-1 md:text-right italic">
              "{forum.description}"
            </p>
          </div>
        </div>

        {isEditOpen && (
          <form
            onSubmit={handleSubmitEditForum}
            className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm mb-8"
          >
            <h3 className="text-sm font-bold text-gray-800 mb-3">Edit Forum</h3>
            <input
              className="w-full p-2 mb-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-400"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Title"
            />
            <textarea
              className="w-full p-2 mb-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-400"
              rows={4}
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Description"
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-10">
          <div className="md:col-span-2 space-y-6">
            {sortedPosts.length === 0 ? (
              <div className="bg-white p-12 rounded-xl border border-gray-100 shadow-sm text-center">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  No posts yet
                </h3>
                <p className="text-gray-500">
                  Be the first to start a conversation.
                </p>
              </div>
            ) : (
              sortedPosts.map((post) => {
                const postDate = post.created_at || (post as any).CreatedAt;
                const authorUsername =
                  (post as any).user?.username || "Anonymous User";
                const voteCount = (post.upvotes || 0) - (post.downvotes || 0);
                const upActive = post.my_vote === 1;
                const downActive = post.my_vote === -1;

                return (
                  <div
                    key={post.id}
                    className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 rounded-full bg-linear-to-r from-purple-400 to-pink-400 flex items-center justify-center text-[10px] text-white font-bold uppercase">
                        {authorUsername.charAt(0)}
                      </div>
                      <span
                        className="text-sm font-semibold text-gray-700 hover:text-blue-600 hover:underline cursor-pointer transition"
                        onClick={() => navigate(`/profile/${post.user_id}`)}
                      >
                        {authorUsername}
                      </span>
                      <span className="text-gray-300 text-xs">•</span>
                      <span className="text-xs text-gray-400">
                        {formatDate(postDate)}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2 leading-tight">
                      {post.title}
                    </h3>
                    <p className="text-gray-600 mb-4 line-clamp-3 leading-relaxed whitespace-pre-wrap">
                      {post.body}
                    </p>
                    {post.media_url && (
                      <div className="mb-4 rounded-lg overflow-hidden border border-gray-100 bg-black">
                        {isVideo(post.media_type) ? (
                          <video
                            src={getMediaUrl(post.media_url)}
                            controls
                            className="w-full max-h-96 object-contain mx-auto"
                          />
                        ) : (
                          <img
                            src={getMediaUrl(post.media_url)}
                            alt="Post"
                            className="w-full max-h-96 object-contain mx-auto"
                          />
                        )}
                      </div>
                    )}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center bg-gray-50 rounded-lg border border-gray-100 overflow-hidden">
                        <button
                          onClick={() =>
                            handleVote(post.id as number, "upvote")
                          }
                          className={`px-3 py-1.5 hover:bg-gray-200 transition font-bold ${upActive ? "text-blue-600" : "text-gray-500 hover:text-blue-600"}`}
                          title={upActive ? "Remove upvote" : "Upvote"}
                        >
                          ▲
                        </button>
                        <span className="text-sm font-bold text-gray-700 px-1">
                          {voteCount}
                        </span>
                        <button
                          onClick={() =>
                            handleVote(post.id as number, "downvote")
                          }
                          className={`px-3 py-1.5 hover:bg-gray-200 transition font-bold ${downActive ? "text-red-500" : "text-gray-500 hover:text-red-500"}`}
                          title={downActive ? "Remove downvote" : "Downvote"}
                        >
                          ▼
                        </button>
                      </div>
                      <button
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-50 rounded-lg transition"
                        onClick={() => navigate(`/posts/${post.id}`)}
                      >
                        <span>💬</span> <span>Comment</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div className="hidden md:block">
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm sticky top-6">
              {user && (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="block w-full text-center bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-gray-800 transition shadow-lg shadow-gray-200"
                >
                  + New Post
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      {forumId && (
        <CreatePostModal
          forumId={forumId}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onPostCreated={fetchPosts}
        />
      )}
    </div>
  );
};

export default ForumDetail;