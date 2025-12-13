import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getForums,
  getCategories,
  type Forum,
  type Category,
} from "../services/api/forums";
import {
  getGlobalPosts,
  getPostVotes,
  getPostVoters,
  votePost,
  type Post,
} from "../services/api/posts";

type PostWithVote = Post & { my_vote?: number | null };

const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [forums, setForums] = useState<Forum[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [posts, setPosts] = useState<PostWithVote[]>([]);
  const [loading, setLoading] = useState(true);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? "" : date.toLocaleDateString();
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

  const fetchPostsWithVotes = async () => {
    const postRes = await getGlobalPosts();
    const rawPosts = (postRes as any).posts ?? [];
    const enriched: PostWithVote[] = await Promise.all(
      rawPosts.map(async (p: any) => {
        let upvotes = p.upvotes ?? 0;
        let downvotes = p.downvotes ?? 0;
        let myVote: number | null = p.my_vote ?? null;
        try {
          const counts = await getPostVotes(p.id);
          upvotes = counts.up_votes ?? upvotes ?? 0;
          downvotes = counts.down_votes ?? downvotes ?? 0;
        } catch {}
        if (user) {
          try {
            const voters = await getPostVoters(p.id);
            const me = voters.voters?.find((v) => v.user_id === user.user_id);
            myVote = me?.value ?? myVote ?? null;
          } catch {}
        }
        return { ...p, upvotes, downvotes, my_vote: myVote } as PostWithVote;
      }),
    );
    enriched.sort((a, b) => {
      const sa = (a.upvotes || 0) - (a.downvotes || 0);
      const sb = (b.upvotes || 0) - (b.downvotes || 0);
      if (sb !== sa) return sb - sa;
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });
    setPosts(enriched);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [forumRes, catRes] = await Promise.all([
          getForums(),
          getCategories(),
        ]);
        if (forumRes && (forumRes as any).forums) {
          setForums((forumRes as any).forums);
        }
        if (catRes && (catRes as any).data) {
          setCategories((catRes as any).data);
        }
        await fetchPostsWithVotes();
      } catch {
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const handleVote = async (postId: number, type: "upvote" | "downvote") => {
    if (!user) {
      alert("Please sign in to vote.");
      return;
    }
    const target = posts.find((p) => p.id === postId);
    const currentVote = target?.my_vote ?? null;
    let action: "upvote" | "downvote" | "remove" = type;
    if (type === "upvote" && currentVote === 1) action = "remove";
    else if (type === "downvote" && currentVote === -1) action = "remove";

    setPosts((prev) =>
      prev
        .map((p) => {
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
        })
        .sort((a, b) => {
          const sa = (a.upvotes || 0) - (a.downvotes || 0);
          const sb = (b.upvotes || 0) - (b.downvotes || 0);
          if (sb !== sa) return sb - sa;
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        }),
    );

    try {
      await votePost(postId, action);
      await fetchPostsWithVotes();
    } catch {
      await fetchPostsWithVotes();
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-800">
      <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <aside className="lg:col-span-3 space-y-6 order-2 lg:order-1">
            <div className="bg-white rounded-xl shadow border border-blue-200 overflow-hidden sticky top-24">
              <div className="p-4 bg-blue-50 border-b border-blue-100 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600 mr-1"></span>
                <h2 className="font-bold text-blue-700 tracking-wide text-sm">
                  Forums
                </h2>
              </div>
              <div className="divide-y divide-blue-50 max-h-[60vh] overflow-y-auto custom-scrollbar">
                {forums.map((forum) => (
                  <Link
                    key={forum.fid}
                    to={`/forums/${forum.fid}`}
                    className="flex items-center gap-3 p-4 hover:bg-blue-50 transition group"
                  >
                    <div className="shrink-0 w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center text-white text-base font-semibold shadow group-hover:bg-blue-600 transition uppercase">
                      {forum.title.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-800 truncate">
                          {forum.title}
                        </p>
                        {forum.category_id && (
                          <span className="text-[10px] text-blue-800 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                            {
                              categories.find((c) => c.id === forum.category_id)
                                ?.name
                            }
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              <Link
                to="/forums"
                className="block text-center py-3 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border-t border-blue-100 transition"
              >
                View All Forums
              </Link>
            </div>
          </aside>
          <main className="lg:col-span-6 space-y-4 order-1 lg:order-2">
            <div className="flex items-center gap-2 mb-4 px-1">
              <h2 className="text-xl font-bold text-blue-800 tracking-tight">
                Newest Discussions
              </h2>
            </div>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-36 bg-blue-50 rounded-xl border border-blue-100 animate-pulse"
                  ></div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="bg-white p-10 rounded-xl border-2 border-yellow-100 text-center shadow">
                <div className="text-4xl mb-2">🚀</div>
                <p className="text-gray-500 font-medium">
                  No posts yet. Start the first conversation!
                </p>
              </div>
            ) : (
              posts.map((post) => {
                const authorUsername =
                  (post as any).user?.username || "Anonymous";
                const voteCount = (post.upvotes || 0) - (post.downvotes || 0);
                const upActive = post.my_vote === 1;
                const downActive = post.my_vote === -1;
                const forumMeta = forums.find((f) => f.fid === post.forum_id);

                return (
                  <div
                    key={post.id}
                    onClick={() => navigate(`/posts/${post.id}`)}
                    className="bg-white p-6 rounded-xl border border-blue-100 shadow hover:shadow-lg hover:border-blue-300 hover:bg-blue-50 transition cursor-pointer group relative"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-[12px] text-blue-700 font-semibold">
                        <div className="w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center font-bold text-blue-600 uppercase border border-blue-100">
                          {authorUsername.charAt(0)}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/profile/${post.user_id}`);
                          }}
                          className="hover:underline underline-offset-2"
                          title="View profile"
                        >
                          @{authorUsername}
                        </button>
                        <span className="text-blue-400 font-normal">•</span>
                        <span className="font-medium text-gray-400">
                          {formatDate(post.created_at)}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/forums/${post.forum_id}`);
                        }}
                        className="px-2 py-1.5 text-[11px] font-bold rounded bg-yellow-100 text-yellow-800 border border-yellow-200 hover:bg-yellow-200 transition"
                        title="View forum"
                      >
                        {forumMeta?.title ?? "Forum"}
                      </button>
                    </div>
                    <h3 className="text-base font-bold text-blue-900 group-hover:text-blue-700 transition mb-1">
                      {post.title}
                    </h3>
                    <p className="text-sm text-gray-700 line-clamp-3 mb-3 leading-relaxed whitespace-pre-wrap">
                      {post.body}
                    </p>
                    {post.media_url && (
                      <div className="mb-3 rounded-lg overflow-hidden bg-black border border-blue-100">
                        {isVideo(post.media_type) ? (
                          <video
                            src={getMediaUrl(post.media_url)}
                            controls
                            playsInline
                            preload="metadata"
                            className="w-full max-h-52 rounded"
                          />
                        ) : (
                          <img
                            src={getMediaUrl(post.media_url)}
                            alt={post.title}
                            loading="lazy"
                            className="w-full max-h-52 object-contain"
                          />
                        )}
                      </div>
                    )}
                    <div className="flex flex-wrap items-center gap-4 border-t pt-2 border-blue-50">
                      <div className="flex items-center bg-blue-50 rounded-lg border border-blue-100 overflow-hidden">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVote(post.id as number, "upvote");
                          }}
                          className={`px-3 py-1.5 hover:bg-blue-200 transition font-bold ${upActive ? "text-blue-600" : "text-blue-400 hover:text-blue-700"}`}
                          title={upActive ? "Remove upvote" : "Upvote"}
                        >
                          ▲
                        </button>
                        <span className="text-sm font-bold text-blue-900 px-1">
                          {voteCount}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVote(post.id as number, "downvote");
                          }}
                          className={`px-3 py-1.5 hover:bg-blue-200 transition font-bold ${downActive ? "text-red-500" : "text-blue-400 hover:text-red-500"}`}
                          title={downActive ? "Remove downvote" : "Downvote"}
                        >
                          ▼
                        </button>
                      </div>
                      <button
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        onClick={() => navigate(`/posts/${post.id}`)}
                      >
                        <span>💬</span> <span>Comment</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </main>
          <aside className="lg:col-span-3 space-y-6 order-3">
            <div className="bg-white p-6 rounded-xl border border-blue-200 shadow sticky top-24">
              {user ? (
                <>
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100 mb-6 shadow">
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold uppercase text-lg border border-blue-100">
                      {user.username.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-blue-700 font-bold">
                        Logged in as
                      </p>
                      <p className="text-base font-bold text-gray-800 truncate">
                        @{user.username}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <button
                      onClick={() => navigate("/forums/new")}
                      className="block w-full text-center bg-blue-600 text-white text-sm font-bold py-3 rounded-lg hover:bg-blue-800 transition shadow"
                    >
                      + Create Forum
                    </button>
                    <Link
                      to="/profile"
                      className="block w-full text-center border border-blue-200 text-blue-700 text-sm font-bold py-3 rounded-lg hover:bg-blue-50 transition"
                    >
                      My Profile
                    </Link>
                  </div>
                </>
              ) : (
                <div className="space-y-4 text-center">
                  <div className="w-11 h-11 bg-yellow-200 rounded-xl flex items-center justify-center mx-auto text-blue-900 text-lg font-bold mb-2 shadow">
                    UT
                  </div>
                  <p className="text-sm text-gray-700 font-medium">
                    Join UnivTalk to start discussing with fellow students.
                  </p>
                  <Link
                    to="/signup"
                    className="block w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition shadow"
                  >
                    Sign Up
                  </Link>
                  <Link
                    to="/signin"
                    className="block text-sm text-blue-600 font-bold hover:underline transition"
                  >
                    Already have an account? Sign in
                  </Link>
                </div>
              )}
              <div className="mt-8 pt-6 border-t border-blue-100">
                <h3 className="text-[11px] font-extrabold text-blue-500 uppercase tracking-widest mb-4">
                  UnivTalk Rules
                </h3>
                <ul className="text-[13px] space-y-3 text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 font-bold">1.</span>
                    Be respectful to fellow students.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 font-bold">2.</span>
                    No spam or excessive self-promotion.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 font-bold">3.</span>
                    Post in relevant categories.
                  </li>
                </ul>
              </div>
            </div>
            <div className="rounded-xl bg-yellow-50 px-6 py-4 text-yellow-800 text-center font-semibold border border-yellow-100 shadow text-sm">
              <svg
                className="w-6 h-6 mx-auto mb-2 text-yellow-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <circle cx="12" cy="12" r="10" strokeWidth="2" />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 15s1.5-2 4-2 4 2 4 2M12 13v.01"
                />
              </svg>
              Your university community is more fun when you contribute.{" "}
              <span className="font-bold">Post, Vote, Discuss!</span>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
