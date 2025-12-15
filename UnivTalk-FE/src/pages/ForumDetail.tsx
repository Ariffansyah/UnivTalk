import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getForumById,
  joinForum,
  leaveForum,
  deleteForum,
  getForumMembers,
  getCategories,
  updateForum,
  type Forum,
  type Category,
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
type SortOption = "newest" | "day" | "week" | "month" | "alltime";

const POSTS_PER_PAGE = 10;

const ForumDetail: React.FC = () => {
  const { forumId } = useParams<{ forumId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast, showConfirm } = useAlert();

  const [forum, setForum] = useState<Forum | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [posts, setPosts] = useState<PostWithVote[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<PostWithVote[]>([]);
  const [displayedPosts, setDisplayedPosts] = useState<PostWithVote[]>([]);
  const [realMemberCount, setRealMemberCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [myRole, setMyRole] = useState<string | null>(null);
  const [joinLoading, setJoinLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [visibleCount, setVisibleCount] = useState(POSTS_PER_PAGE);

  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategoryId, setEditCategoryId] = useState<number | null>(null);
  const [editLoading, setEditLoading] = useState(false);

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
    } catch (err: any) {
      setError("Failed to fetch posts:   " + (err.message || "Unknown error"));
      showToast("Failed to fetch posts", "error");
    }
  };

  const fetchForumData = async () => {
    if (!forumId) return;
    const forumRes = await getForumById(forumId);
    if (forumRes && forumRes.forum) {
      setForum(forumRes.forum);
      setEditTitle(forumRes.forum.title);
      setEditDescription(forumRes.forum.description);
      setEditCategoryId(forumRes.forum.category_id ?? null);
    } else {
      setError("Forum not found");
    }
  };

  useEffect(() => {
    if (!forumId) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        await fetchForumData();
        await fetchPosts();
        try {
          const catRes = await getCategories();
          if (catRes && catRes.data) {
            setCategories(catRes.data);
          }
        } catch (err: any) {
          setError(
            "Failed to fetch categories: " + (err.message || "Unknown error"),
          );
        }
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
        } catch (err: any) {
          setError(
            "Failed to fetch forum members: " +
              (err.message || "Unknown error"),
          );
        }
      } catch (err: any) {
        setError("Failed to load data: " + (err.message || "Unknown error"));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [forumId, user]);

  useEffect(() => {
    let sorted = [...posts];
    const now = new Date();

    if (sortBy === "newest") {
      sorted.sort((a, b) => {
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      });
    } else if (sortBy === "day") {
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      sorted = sorted.filter(
        (p) => new Date(p.created_at).getTime() >= oneDayAgo.getTime(),
      );
      sorted.sort((a, b) => {
        const sa = (a.upvotes || 0) - (a.downvotes || 0);
        const sb = (b.upvotes || 0) - (b.downvotes || 0);
        if (sb !== sa) return sb - sa;
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      });
    } else if (sortBy === "week") {
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      sorted = sorted.filter(
        (p) => new Date(p.created_at).getTime() >= oneWeekAgo.getTime(),
      );
      sorted.sort((a, b) => {
        const sa = (a.upvotes || 0) - (a.downvotes || 0);
        const sb = (b.upvotes || 0) - (b.downvotes || 0);
        if (sb !== sa) return sb - sa;
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      });
    } else if (sortBy === "month") {
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      sorted = sorted.filter(
        (p) => new Date(p.created_at).getTime() >= oneMonthAgo.getTime(),
      );
      sorted.sort((a, b) => {
        const sa = (a.upvotes || 0) - (a.downvotes || 0);
        const sb = (b.upvotes || 0) - (b.downvotes || 0);
        if (sb !== sa) return sb - sa;
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      });
    } else if (sortBy === "alltime") {
      sorted.sort((a, b) => {
        const sa = (a.upvotes || 0) - (a.downvotes || 0);
        const sb = (b.upvotes || 0) - (b.downvotes || 0);
        if (sb !== sa) return sb - sa;
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      });
    }

    setFilteredPosts(sorted);
    setVisibleCount(POSTS_PER_PAGE);
  }, [posts, sortBy]);

  useEffect(() => {
    setDisplayedPosts(filteredPosts.slice(0, visibleCount));
  }, [filteredPosts, visibleCount]);

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + POSTS_PER_PAGE);
  };

  const hasAdminPower = user?.is_admin || myRole === "admin";
  const isForumOwner = user && forum && forum.user_id === user.user_id;
  const canEditForum = myRole === "admin" || isForumOwner;

  const categoryName = forum
    ? categories.find((c) => c.id === forum.category_id)?.name
    : undefined;

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
    } catch (err: any) {
      setError(
        "Failed to update membership: " + (err.message || "Unknown error"),
      );
      showToast("Failed to update membership.   Please try again.", "error");
    } finally {
      setJoinLoading(false);
    }
  };

  const handleEditForum = () => {
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!forumId || !editTitle.trim() || !editDescription.trim()) {
      showToast("Title and description are required.", "warning");
      return;
    }

    if (!editCategoryId) {
      showToast("Please select a category.", "warning");
      return;
    }

    setEditLoading(true);
    try {
      const updateData: any = {
        title: editTitle.trim(),
        description: editDescription.trim(),
        category_id: editCategoryId,
        updated_at: new Date().toISOString(),
      };

      await updateForum(forumId, updateData);

      await fetchForumData();
      setIsEditModalOpen(false);
      showToast("Forum updated successfully!", "success");
    } catch (err: any) {
      console.error("Update error:", err);
      showToast("Failed to update forum.  Please try again.", "error");
    } finally {
      setEditLoading(false);
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
    } catch (err: any) {
      setError("Failed to vote: " + (err.message || "Unknown error"));
      await fetchPosts();
      showToast("Failed to vote.   Please try again.", "error");
    }
  };

  const handleDeleteForum = async () => {
    if (!forumId) return;
    const ok = await showConfirm("DANGER: Delete this forum? ");
    if (!ok) return;
    try {
      await deleteForum(forumId);
      showToast("Forum deleted.", "success");
      navigate("/forums");
    } catch (err: any) {
      setError("Failed to delete forum: " + (err.message || "Unknown error"));
      showToast("Failed to delete forum", "error");
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
  if (error)
    return (
      <div className="p-10 text-center text-red-600 bg-red-50 rounded font-bold border border-red-200">
        {error}
      </div>
    );
  if (!forum)
    return (
      <div className="p-10 text-center text-red-600 bg-red-50 rounded font-bold border border-red-200">
        Forum not found.
      </div>
    );

  const forumCreatedAt = forum.created_at || (forum as any).CreatedAt;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-10">
        <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-6 mb-8 relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
            <div className="flex items-end gap-5">
              <div
                className="w-20 h-20 sm:w-28 sm:h-28 bg-white rounded-xl p-1 shadow-md select-none"
                style={{ userSelect: "none" }}
              >
                <div className="w-full h-full bg-blue-50 rounded-lg flex items-center justify-center text-3xl sm:text-5xl font-bold text-blue-600">
                  {forum.title.charAt(0).toUpperCase()}
                </div>
              </div>
              <div className="mb-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {forum.title}
                </h1>
                <p className="text-gray-500 font-medium">Forum</p>
              </div>
            </div>
            {user && (
              <div className="flex flex-wrap items-center gap-3">
                {hasAdminPower ? (
                  <>
                    <div className="px-4 py-2 bg-yellow-50 text-yellow-700 font-bold rounded-lg border border-yellow-200 flex items-center gap-2 cursor-default select-none">
                      <span>👑</span>{" "}
                      {user.is_admin ? "System Admin" : "Forum Admin"}
                    </div>
                    {canEditForum && (
                      <button
                        onClick={handleEditForum}
                        className="px-4 sm:px-6 py-2 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition shadow-sm cursor-pointer"
                      >
                        Edit Forum
                      </button>
                    )}
                    <button
                      onClick={handleDeleteForum}
                      className="px-4 sm:px-6 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition shadow-sm cursor-pointer"
                    >
                      Delete Forum
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleJoinLeave}
                    disabled={joinLoading}
                    className={`px-6 sm:px-8 py-2. 5 rounded-lg font-semibold transition shadow-sm ${
                      isMember
                        ? "bg-white border-2 border-red-500 text-red-500 hover:bg-red-50"
                        : "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md"
                    } ${joinLoading ? "opacity-70 cursor-not-allowed" : "cursor-pointer"}`}
                    style={joinLoading ? { pointerEvents: "none" } : {}}
                  >
                    {joinLoading
                      ? "Processing..."
                      : isMember
                        ? "Leave Forum"
                        : "Join Forum"}
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="mt-6 pt-6 border-t border-blue-100 flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex items-center gap-6 text-sm text-gray-600 flex-wrap">
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
              {categoryName && (
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                    {categoryName}
                  </span>
                </div>
              )}
            </div>
            <p className="text-gray-600 flex-1 md:text-right italic min-w-0 warp-break-words">
              "{forum.description}"
            </p>
          </div>
        </div>

        <div className="md:hidden w-full pb-4">
          {user && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full text-center bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition shadow cursor-pointer"
            >
              + New Post
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-10">
          <div className="md:col-span-2 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <h2 className="text-lg font-bold text-blue-800">Posts</h2>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="px-4 py-2 pr-10 bg-blue-50 text-blue-700 font-bold text-sm rounded-lg border border-blue-200 hover:bg-blue-100 transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                >
                  <option value="newest">Newest</option>
                  <option value="day">Top Today</option>
                  <option value="week">Top This Week</option>
                  <option value="month">Top This Month</option>
                  <option value="alltime">All-Time Top</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-blue-700">
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
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>
            {displayedPosts.length === 0 ? (
              <div className="bg-white p-12 rounded-xl border border-blue-100 shadow-sm text-center">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  No posts found
                </h3>
                <p className="text-gray-500">
                  {posts.length === 0
                    ? "Be the first to start a conversation."
                    : "Try a different filter. "}
                </p>
              </div>
            ) : (
              <>
                {displayedPosts.map((post) => {
                  const postDate = post.created_at || (post as any).CreatedAt;
                  const authorUsername =
                    (post as any).user?.username || "Anonymous User";
                  const voteCount = (post.upvotes || 0) - (post.downvotes || 0);
                  const upActive = post.my_vote === 1;
                  const downActive = post.my_vote === -1;

                  return (
                    <div
                      key={post.id}
                      className="bg-white p-6 rounded-xl border border-blue-100 shadow-sm hover:shadow-lg hover:border-blue-300 hover:bg-blue-50 transition"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div
                          className="w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center text-[10px] text-blue-700 font-bold uppercase select-none"
                          style={{ userSelect: "none" }}
                        >
                          {authorUsername.charAt(0)}
                        </div>
                        <span
                          className="text-sm font-semibold text-gray-700 hover:text-blue-600 hover:underline cursor-pointer"
                          onClick={() => navigate(`/profile/${post.user_id}`)}
                          style={{
                            userSelect:
                              authorUsername === "Anonymous User"
                                ? "none"
                                : undefined,
                          }}
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
                        <div className="mb-4 rounded-lg overflow-hidden border border-blue-100 bg-black">
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
                      <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center bg-blue-50 rounded-lg border border-blue-100 overflow-hidden">
                          <button
                            onClick={() =>
                              handleVote(post.id as number, "upvote")
                            }
                            className={`px-3 py-1.5 hover:bg-blue-200 transition font-bold cursor-pointer ${upActive ? "text-blue-600" : "text-blue-400 hover:text-blue-700"}`}
                            title={upActive ? "Remove upvote" : "Upvote"}
                          >
                            ▲
                          </button>
                          <span className="text-sm font-bold text-blue-900 px-1 select-none">
                            {voteCount}
                          </span>
                          <button
                            onClick={() =>
                              handleVote(post.id as number, "downvote")
                            }
                            className={`px-3 py-1.5 hover:bg-blue-200 transition font-bold cursor-pointer ${downActive ? "text-red-500" : "text-blue-400 hover:text-red-500"}`}
                            title={downActive ? "Remove downvote" : "Downvote"}
                          >
                            ▼
                          </button>
                        </div>
                        <button
                          className="flex items-center gap-2 px-3 py-1. 5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                          onClick={() => navigate(`/posts/${post.id}`)}
                        >
                          <span>💬</span> <span>Comment</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
                {visibleCount < filteredPosts.length && (
                  <div className="text-center pt-6">
                    <button
                      onClick={handleLoadMore}
                      className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition shadow cursor-pointer"
                    >
                      Load More
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
          <div className="hidden md:block">
            <div className="bg-white p-6 rounded-xl border border-blue-100 shadow-sm sticky top-6">
              {user && (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="block w-full text-center bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition shadow cursor-pointer"
                >
                  + New Post
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center backdrop-blur-sm justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-blue-100">
              <h2 className="text-2xl font-bold text-gray-900">Edit Forum</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-4 py-3 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Forum title"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus: ring-blue-500 resize-none"
                  placeholder="Forum description"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category
                </label>
                <div className="relative">
                  <select
                    value={editCategoryId || ""}
                    onChange={(e) => setEditCategoryId(Number(e.target.value))}
                    className="w-full px-4 py-3 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
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
            </div>
            <div className="p-6 border-t border-blue-100 flex justify-end gap-3">
              <button
                onClick={() => setIsEditModalOpen(false)}
                disabled={editLoading}
                className="px-6 py-2. 5 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={editLoading}
                className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editLoading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

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
