import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { getUserProfile, type UserProfile } from "../services/api/auth";
import { getUserProfileByID } from "../services/api/user";
import {
  getPostsByUserId,
  getPostVotes,
  getPostVoters,
  votePost,
  type Post,
} from "../services/api/posts";
import { getForumById, type Forum } from "../services/api/forums";
import { useAuth } from "../context/AuthContext";
import { changePassword, deleteAccount } from "../services/api/auth";
import { fetchUniversitySuggestions } from "../services/api/uni";
import { useAlert } from "../context/AlertContext";
import { containsBadWords } from "../utils/contentModeration";

type PostWithVote = Post & { my_vote?: number | null };
const DEBOUNCE_DELAY = 400;

const ProfilePage: React.FC = () => {
  const { userId: userIdParam } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast, showConfirm } = useAlert();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userPosts, setUserPosts] = useState<PostWithVote[]>([]);
  const [forumsById, setForumsById] = useState<Map<string, Forum>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editUniversity, setEditUniversity] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  const [uniSuggestions, setUniSuggestions] = useState<string[]>([]);
  const [showUniSuggestions, setShowUniSuggestions] = useState(false);
  const [uniLoading, setUniLoading] = useState(false);
  const [selectedUni, setSelectedUni] = useState(false);
  const uniDebounce = useRef<any>(null);
  const uniInputRef = useRef<HTMLInputElement | null>(null);

  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletePwd, setDeletePwd] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? "N/A" : date.toLocaleDateString();
  };

  const openEditProfile = () => {
    if (!profile) return;
    setEditFirstName(profile.first_name || "");
    setEditLastName(profile.last_name || "");
    setEditUsername(profile.username || "");
    setEditUniversity(profile.university || "");
    setSelectedUni(Boolean(profile.university));
    setEditStatus(profile.status || "");
    setIsEditOpen(true);
    setActionError(null);
    setUniSuggestions([]);
    setShowUniSuggestions(false);
  };

  useEffect(() => {
    if (!isEditOpen) return;
    setActionError(null);
    if (!editUniversity.trim() || selectedUni) {
      setUniSuggestions([]);
      setShowUniSuggestions(false);
      setUniLoading(false);
      if (uniDebounce.current) {
        clearTimeout(uniDebounce.current);
        uniDebounce.current = null;
      }
      return;
    }
    setUniLoading(true);
    if (uniDebounce.current) clearTimeout(uniDebounce.current);
    uniDebounce.current = setTimeout(async () => {
      try {
        const result = await fetchUniversitySuggestions(editUniversity);
        setUniSuggestions(result);
        setShowUniSuggestions(result.length > 0);
      } catch {
        setUniSuggestions([]);
        setShowUniSuggestions(false);
      } finally {
        setUniLoading(false);
      }
    }, DEBOUNCE_DELAY);
    return () => {
      if (uniDebounce.current) clearTimeout(uniDebounce.current);
    };
  }, [editUniversity, selectedUni, isEditOpen]);

  const handleUniversityInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedUni(false);
    setEditUniversity(e.target.value);
  };

  const handleUniSuggestionClick = (univ: string) => {
    setEditUniversity(univ);
    setSelectedUni(true);
    setShowUniSuggestions(false);
  };

  const submitEditProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);

    if (containsBadWords(editFirstName.trim())) {
      setActionError("First name contains inappropriate or offensive language");
      showToast(
        "First name contains inappropriate or offensive language",
        "error",
      );
      return;
    }

    if (containsBadWords(editLastName.trim())) {
      setActionError("Last name contains inappropriate or offensive language");
      showToast(
        "Last name contains inappropriate or offensive language",
        "error",
      );
      return;
    }

    if (containsBadWords(editUsername.trim())) {
      setActionError("Username contains inappropriate or offensive language");
      showToast(
        "Username contains inappropriate or offensive language",
        "error",
      );
      return;
    }

    if (
      !selectedUni &&
      !uniSuggestions.some(
        (s) => s.toLowerCase() === editUniversity.trim().toLowerCase(),
      )
    ) {
      setActionError("Please select a valid university from the suggestions.");
      showToast(
        "Please select a valid university from the suggestions.",
        "warning",
      );
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/profile`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: editFirstName,
          last_name: editLastName,
          username: editUsername,
          university: editUniversity,
          status: editStatus,
        }),
      });
      if (!res.ok) throw new Error("Failed to update profile");
      setIsEditOpen(false);
      setUniSuggestions([]);
      setShowUniSuggestions(false);
      const refreshed = await getUserProfile();
      if (refreshed && refreshed.profile) {
        setProfile(refreshed.profile);
        showToast("Profile updated.", "success");
      }
    } catch (err: any) {
      setActionError("Failed to update profile: " + (err?.message || ""));
      showToast("Failed to update profile", "error");
    }
  };

  useEffect(() => {
    const fetchProfileAndPosts = async () => {
      setLoading(true);
      setError(null);
      setActionError(null);
      try {
        let targetProfile: UserProfile;
        let targetId: string;
        if (userIdParam) {
          const res = await getUserProfileByID(userIdParam);
          if (res && (res as any).user_id) {
            targetProfile = res as unknown as UserProfile;
            targetId = userIdParam;
          } else {
            throw new Error("User not found");
          }
        } else {
          const res = await getUserProfile();
          if (res.success && res.profile) {
            targetProfile = res.profile;
            targetId = res.profile.user_id;
          } else {
            navigate("/signin");
            return;
          }
        }
        setProfile(targetProfile);

        const postsRes = await getPostsByUserId(targetId);
        const rawPosts: Post[] = (postsRes as any).posts ?? [];
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
            if (currentUser) {
              try {
                const voters = await getPostVoters(p.id);
                const me = voters.voters?.find(
                  (v) => v.user_id === currentUser.user_id,
                );
                myVote = me?.value ?? myVote ?? null;
              } catch {}
            }
            return {
              ...p,
              forum_id: String(p.forum_id ?? ""),
              upvotes,
              downvotes,
              my_vote: myVote,
            } as PostWithVote;
          }),
        );
        setUserPosts(enriched);

        const uniqueForumIds = Array.from(
          new Set(enriched.map((p) => String(p.forum_id)).filter(Boolean)),
        );
        const forumPairs: Array<[string, Forum | null]> = await Promise.all(
          uniqueForumIds.map(async (fid) => {
            try {
              const fRes = await getForumById(fid);
              return [fid, (fRes as any).forum as Forum];
            } catch {
              return [fid, null];
            }
          }),
        );
        const map = new Map<string, Forum>();
        forumPairs.forEach(([fid, forum]) => {
          if (forum) map.set(fid, forum);
        });
        setForumsById(map);
      } catch (err: any) {
        setError(err.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    fetchProfileAndPosts();
  }, [userIdParam, location.pathname, navigate, currentUser]);

  const handleVote = async (postId: number, type: "upvote" | "downvote") => {
    setActionError(null);
    if (!currentUser) {
      showToast("Please sign in to vote.", "warning");
      return;
    }
    const target = userPosts.find((p) => p.id === postId);
    const currentVote = target?.my_vote ?? null;
    let action: "upvote" | "downvote" | "remove" = type;
    if (type === "upvote" && currentVote === 1) action = "remove";
    else if (type === "downvote" && currentVote === -1) action = "remove";

    setUserPosts((prev) =>
      prev.map((p) => {
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
      try {
        const counts = await getPostVotes(postId);
        setUserPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  upvotes: counts.up_votes ?? p.upvotes ?? 0,
                  downvotes: counts.down_votes ?? p.downvotes ?? 0,
                  my_vote:
                    action === "remove" ? null : action === "upvote" ? 1 : -1,
                }
              : p,
          ),
        );
      } catch {}
    } catch (err: any) {
      setActionError("Failed to update vote: " + (err.message || ""));
      const targetId = userIdParam || currentUser?.user_id || "";
      const postsRes = await getPostsByUserId(targetId);
      setUserPosts(((postsRes as any).posts ?? []) as PostWithVote[]);
    }
  };

  const submitChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    if (!currentPassword || !newPassword) {
      setActionError("Please fill both password fields.");
      showToast("Please fill both password fields.", "warning");
      return;
    }
    setPwdLoading(true);
    const res = await changePassword(currentPassword, newPassword);
    setPwdLoading(false);
    if (res.success) {
      setIsPasswordOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      showToast("Password changed.", "success");
    } else {
      setActionError(res.message || "Failed to change password");
      showToast(res.message || "Failed to change password", "error");
    }
  };

  const submitDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    if (!deletePwd) {
      setActionError("Please enter your password to confirm.");
      showToast("Please enter your password to confirm.", "warning");
      return;
    }
    const confirm = await showConfirm(
      "This will permanently delete your account.  Continue?",
    );
    if (!confirm) return;
    setDeleteLoading(true);
    const res = await deleteAccount(deletePwd);
    setDeleteLoading(false);
    if (res.success) {
      navigate("/signout");
    } else {
      setActionError(res.message || "Failed to delete account");
      showToast(res.message || "Failed to delete account", "error");
    }
  };

  if (loading)
    return (
      <div className="p-10 text-center text-gray-500 font-medium">
        Loading profile...
      </div>
    );
  if (error || !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="text-6xl mb-4">👤</div>
        <h2 className="text-2xl font-bold text-red-500 mb-2">{error}</h2>
        <button
          onClick={() => navigate("/")}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold shadow-md hover:bg-blue-700 transition"
        >
          Back to Home
        </button>
      </div>
    );
  }

  const isOwnProfile = currentUser?.user_id === profile.user_id;

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-4xl mx-auto px-2 sm:px-4">
        {actionError && (
          <div className="mb-4 p-3 text-center bg-red-50 border border-red-500 rounded text-red-700 font-bold">
            ⚠️ {actionError}
          </div>
        )}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="h-32 bg-linear-to-r from-blue-600 to-indigo-700 shadow-inner"></div>
          <div className="px-4 sm:px-8 pb-8">
            <div className="relative flex flex-col sm:flex-row justify-between items-end -mt-10 sm:-mt-12 mb-6 gap-4">
              <div className="p-1.  5 bg-white rounded-2xl shadow-md border border-gray-100">
                <div
                  className="w-20 h-20 sm:w-32 sm:h-32 bg-blue-50 rounded-xl flex items-center justify-center text-3xl sm:text-5xl font-bold text-blue-600 uppercase border-2 border-blue-100"
                  style={{ userSelect: "none" }}
                >
                  {profile.username.charAt(0)}
                </div>
              </div>
              {isOwnProfile && (
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={openEditProfile}
                    className="px-4 py-2.  5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition shadow-lg cursor-pointer"
                  >
                    Edit Profile
                  </button>
                  <button
                    onClick={() => setIsPasswordOpen(true)}
                    className="px-4 py-2. 5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition shadow-lg cursor-pointer"
                  >
                    Change Password
                  </button>
                  <button
                    onClick={() => setIsDeleteOpen(true)}
                    className="px-4 py-2.5 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 transition shadow-lg cursor-pointer"
                  >
                    Delete Account
                  </button>
                </div>
              )}
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-extrabold text-gray-900">
                {profile.first_name} {profile.last_name}
              </h1>
              <p className="text-gray-500 font-semibold flex items-center gap-1">
                <span className="text-blue-500 opacity-70">@</span>
                {profile.username}
              </p>
            </div>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-gray-100">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  University
                </span>
                <span className="text-gray-800 font-bold leading-tight warp-break-words">
                  {profile.university}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Student Status
                </span>
                <span className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${profile.status === "active" ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-gray-400"}`}
                  ></span>
                  <span className="text-gray-800 font-bold capitalize">
                    {profile.status}
                  </span>
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Role
                </span>
                <span className="text-gray-800 font-bold">
                  {profile.is_admin
                    ? "🛡️ System Administrator"
                    : "🎓 Student Member"}
                </span>
              </div>
            </div>
            {(isOwnProfile || currentUser?.is_admin) && (
              <div className="mt-6 flex items-center gap-2 text-xs font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-full w-fit">
                <span>📧 Verified Email: </span>
                <span className="text-blue-800">{profile.email}</span>
              </div>
            )}
          </div>
        </div>
        {isEditOpen && (
          <form
            onSubmit={submitEditProfile}
            className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mt-8"
          >
            <h3 className="text-sm font-bold text-gray-800 mb-4">
              Edit Profile
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="First name"
                value={editFirstName}
                onChange={(e) => setEditFirstName(e.target.value)}
              />
              <input
                className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:  ring-blue-400"
                placeholder="Last name"
                value={editLastName}
                onChange={(e) => setEditLastName(e.target.value)}
              />
              <input
                className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Username"
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
              />
              <div className="relative">
                <input
                  ref={uniInputRef}
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="University"
                  value={editUniversity}
                  onChange={handleUniversityInput}
                  onBlur={() =>
                    setTimeout(() => setShowUniSuggestions(false), 200)
                  }
                />
                {showUniSuggestions && (
                  <ul className="absolute z-50 bg-white border border-gray-300 w-full rounded-lg shadow-xl mt-1 max-h-48 overflow-y-auto">
                    {uniLoading ? (
                      <li className="px-4 py-3 text-sm text-gray-500 italic">
                        Searching...
                      </li>
                    ) : uniSuggestions.length > 0 ? (
                      uniSuggestions.map((univ) => (
                        <li
                          key={univ}
                          onMouseDown={() => handleUniSuggestionClick(univ)}
                          className="cursor-pointer px-4 py-2.  5 text-sm hover:bg-blue-50 text-gray-700 border-b last:border-none"
                        >
                          {univ}
                        </li>
                      ))
                    ) : (
                      <li className="px-4 py-3 text-sm text-red-500">
                        No universities found
                      </li>
                    )}
                  </ul>
                )}
              </div>
              <select
                className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:  ring-2 focus:ring-blue-400"
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
              >
                <option value="">Select status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button
                type="button"
                onClick={() => {
                  setIsEditOpen(false);
                  setUniSuggestions([]);
                  setShowUniSuggestions(false);
                  setActionError(null);
                }}
                className="px-4 py-2 text-xs font-bold text-gray-500"
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 cursor-pointer"
                type="submit"
              >
                Save
              </button>
            </div>
          </form>
        )}

        {isPasswordOpen && (
          <form
            onSubmit={submitChangePassword}
            className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mt-8"
          >
            <h3 className="text-sm font-bold text-gray-800 mb-4">
              Change Password
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="password"
                className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <input
                type="password"
                className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button
                type="button"
                onClick={() => setIsPasswordOpen(false)}
                className="px-4 py-2 text-xs font-bold text-gray-500"
              >
                Cancel
              </button>
              <button
                disabled={pwdLoading}
                style={
                  pwdLoading
                    ? { cursor: "not-allowed", pointerEvents: "none" }
                    : { cursor: "pointer" }
                }
                className={`px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700
                  ${pwdLoading ? "opacity-60" : ""}`}
              >
                {pwdLoading ? "Changing..." : "Change Password"}
              </button>
            </div>
          </form>
        )}

        {isDeleteOpen && (
          <form
            onSubmit={submitDeleteAccount}
            className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mt-8"
          >
            <h3 className="text-sm font-bold text-red-700 mb-4">
              Delete Account
            </h3>
            <p className="text-xs text-gray-600 mb-3">
              This action cannot be undone. Enter your password to confirm.
            </p>
            <input
              type="password"
              className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-red-400"
              placeholder="Password"
              value={deletePwd}
              onChange={(e) => setDeletePwd(e.target.value)}
            />
            <div className="flex gap-2 justify-end mt-4">
              <button
                type="button"
                onClick={() => setIsDeleteOpen(false)}
                className="px-4 py-2 text-xs font-bold text-gray-500"
              >
                Cancel
              </button>
              <button
                disabled={deleteLoading}
                style={
                  deleteLoading
                    ? { cursor: "not-allowed", pointerEvents: "none" }
                    : { cursor: "pointer" }
                }
                className={`px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 ${
                  deleteLoading ? "opacity-60" : ""
                }`}
              >
                {deleteLoading ? "Deleting..." : "Delete Account"}
              </button>
            </div>
          </form>
        )}

        <div className="mt-8 space-y-4">
          <h3 className="text-lg font-bold text-gray-900 px-2 flex items-center gap-2">
            Recent Activity
            <span className="bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full">
              {userPosts.length}
            </span>
          </h3>

          {userPosts.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-gray-100 shadow-sm text-center">
              <div className="text-4xl mb-3 opacity-20 italic">
                "No public activity recorded yet."
              </div>
              <p className="text-gray-400 text-sm">
                Discussions and posts by this user will appear here.
              </p>
            </div>
          ) : (
            userPosts.map((post) => {
              const voteCount = (post.upvotes || 0) - (post.downvotes || 0);
              const upActive = post.my_vote === 1;
              const downActive = post.my_vote === -1;
              const forumId = String(post.forum_id ?? "");
              const forumMeta = forumsById.get(forumId);
              return (
                <div
                  key={post.id}
                  onClick={() => navigate(`/posts/${post.id}`)}
                  className="bg-white p-6 rounded-2xl border border-blue-100 shadow-sm hover:shadow-md hover:border-blue-300 hover:bg-blue-50 transition cursor-pointer group"
                >
                  <div className="flex flex-col sm:flex-row items-center justify-between mb-3 gap-3">
                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                      {formatDate(post.created_at)}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/forums/${forumId}`);
                      }}
                      className="px-2 py-1.5 text-[10px] font-bold rounded bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100 transition cursor-pointer"
                      title="View forum"
                    >
                      {forumMeta?.title ?? "Forum"}
                    </button>
                  </div>
                  <h4 className="font-bold text-gray-900 text-lg mb-2 group-hover:text-blue-600 transition">
                    {post.title}
                  </h4>
                  <p className="text-gray-600 text-sm line-clamp-2 mb-4 leading-relaxed">
                    {post.body}
                  </p>
                  <div className="flex flex-wrap items-center justify-between">
                    <div className="flex items-center bg-blue-50 rounded-lg border border-blue-100 overflow-hidden">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleVote(post.id as number, "upvote");
                        }}
                        className={`px-3 py-1.5 font-bold text-xs transition ${
                          upActive ? "text-blue-600" : "text-blue-400"
                        } hover:bg-blue-200 ${
                          currentUser
                            ? "hover:text-blue-700 cursor-pointer"
                            : "cursor-not-allowed opacity-60"
                        }`}
                        disabled={!currentUser}
                        style={
                          !currentUser
                            ? { cursor: "not-allowed", pointerEvents: "none" }
                            : { cursor: "pointer" }
                        }
                        title={upActive ? "Remove upvote" : "Upvote"}
                      >
                        ▲
                      </button>
                      <span className="text-xs font-bold text-blue-900 px-2">
                        {voteCount}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleVote(post.id as number, "downvote");
                        }}
                        className={`px-3 py-1.5 font-bold text-xs transition ${
                          downActive ? "text-red-500" : "text-blue-400"
                        } hover:bg-blue-200 ${
                          currentUser
                            ? "hover:text-red-500 cursor-pointer"
                            : "cursor-not-allowed opacity-60"
                        }`}
                        disabled={!currentUser}
                        style={
                          !currentUser
                            ? { cursor: "not-allowed", pointerEvents: "none" }
                            : { cursor: "pointer" }
                        }
                        title={downActive ? "Remove downvote" : "Downvote"}
                      >
                        ▼
                      </button>
                    </div>
                    <div className="text-xs font-medium text-blue-600 mt-2 sm:mt-0">
                      💬 Comment
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
