import { apiRequest } from "./client";

export interface Post {
  id: number;
  forum_id: string;
  user_id: string;
  title: string;
  body: string;
  media_url?: string;
  media_type?: string;
  upvotes?: number;
  downvotes?: number;
  my_vote?: number | null;
  created_at: string;
  user?: {
    username: string;
    uid: string;
  };
}

export async function getPostsByForum(forumId: string) {
  return apiRequest<{ posts: Post[] }>(`/forums/${forumId}/posts`, {
    method: "GET",
  });
}

export async function getPostById(postId: number | string) {
  return apiRequest<{ post: Post }>(`/posts/${postId}`, { method: "GET" });
}

export async function getGlobalPosts() {
  return apiRequest<{ posts: Post[] }>("/posts/feed", { method: "GET" });
}

export async function getPostsByUserId(userId: string) {
  return apiRequest<{ posts: Post[] }>(`/posts/user/${userId}`, {
    method: "GET",
  });
}

export async function createPost(formData: FormData) {
  return apiRequest<{ message: string; post: Post }>("/posts/", {
    method: "POST",
    body: formData,
  });
}

export async function updatePost(
  postId: number | string,
  data: { title?: string; body?: string },
) {
  return apiRequest<{ message: string }>(`/posts/${postId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deletePost(postId: number | string) {
  return apiRequest<{ message: string }>(`/posts/${postId}`, {
    method: "DELETE",
  });
}

export async function votePost(
  postId: number | string,
  type: "upvote" | "downvote" | "remove",
) {
  if (type === "remove") {
    return apiRequest<{ message: string }>(`/posts/${postId}/vote`, {
      method: "DELETE",
    });
  }
  return apiRequest<{ message: string }>(`/posts/${postId}/${type}`, {
    method: "POST",
  });
}

export async function getPostVotes(postId: number | string) {
  return apiRequest<{
    up_votes: number;
    down_votes: number;
    my_vote?: number | null;
  }>(`/posts/${postId}/vote`, { method: "GET" });
}

export async function voteComment(
  commentId: number,
  type: "upvote" | "downvote" | "remove",
) {
  if (type === "remove") {
    return apiRequest<{ message: string }>(`/comments/${commentId}/vote`, {
      method: "DELETE",
    });
  }
  return apiRequest<{ message: string }>(`/comments/${commentId}/${type}`, {
    method: "POST",
  });
}

export async function getCommentVotes(commentId: number) {
  return apiRequest<{
    up_votes: number;
    down_votes: number;
    my_vote?: number | null;
  }>(`/comments/${commentId}/vote`, { method: "GET" });
}

export async function getPostVoters(postId: number | string) {
  return apiRequest<{
    voters: { user_id: string; username: string; value: number }[];
  }>(`/posts/${postId}/voters`, { method: "GET" });
}

export async function getPostComments(postId: number | string) {
  return apiRequest<{ comments: any[] }>(`/posts/${postId}/comments`, {
    method: "GET",
  });
}

export async function updateComment(commentId: number, body: string) {
  return apiRequest<{ message: string }>(`/comments/${commentId}`, {
    method: "PUT",
    body: JSON.stringify({ body }),
  });
}

export async function deleteComment(commentId: number) {
  return apiRequest<{ message: string }>(`/comments/${commentId}`, {
    method: "DELETE",
  });
}
