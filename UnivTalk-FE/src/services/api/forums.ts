// Simple API client untuk forums & posts, disesuaikan dengan base yang dipakai di signUp.ts
const BASE = "https://api.arpthef.my.id"; // konsisten dengan signUp.ts di repo

function buildHeaders(token?: string) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

export async function getForums(token?: string) {
  const res = await fetch(`${BASE}/forums`, {
    method: "GET",
    headers: buildHeaders(token),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to fetch forums: ${text}`);
  }

  const data = await res.json().catch(() => null);

  // Backend bisa mengembalikan {forums: [...]} atau langsung array
  return data?.forums || data || [];
}

export async function getForumPosts(
  forumId: number | string,
  token?: string
) {
  const res = await fetch(`${BASE}/forums/${forumId}/posts`, {
    method: "GET",
    headers: buildHeaders(token),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to fetch posts: ${text}`);
  }

  const data = await res.json().catch(() => null);
  return data?.posts || data || [];
}

export async function createPost(
  forumId: number | string,
  payload: { title: string; body?: string },
  token?: string
) {
  const res = await fetch(`${BASE}/forums/${forumId}/posts`, {
    method: "POST",
    headers: buildHeaders(token),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to create post: ${text}`);
  }

  const data = await res.json().catch(() => null);
  return data?.post || data || null;
}

export async function votePost(
  postId: number | string,
  value: number,
  token?: string
) {
  const res = await fetch(`${BASE}/posts/${postId}/vote`, {
    method: "POST",
    headers: buildHeaders(token),
    body: JSON.stringify({ value }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to vote: ${text}`);
  }

  return res.json().catch(() => null);
}
