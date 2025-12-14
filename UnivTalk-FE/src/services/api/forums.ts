import { apiRequest } from "./client";

export interface Forum {
  fid: string;
  user_id: string;
  title: string;
  description: string;
  member_count: number;
  created_at: string;
  category_id?: number;
}

export interface CreateForumInput {
  title: string;
  description: string;
  category_id: number;
}

export interface Category {
  id: number;
  name: string;
}

export async function getForums() {
  return apiRequest<{ forums: Forum[] }>("/forums/", { method: "GET" });
}

export async function getForumById(forumId: string) {
  return apiRequest<{ forum: Forum }>(`/forums/${forumId}`, { method: "GET" });
}

export async function createForum(data: CreateForumInput) {
  return apiRequest<{ message: string; data: Forum }>("/forums/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateForum(
  forumId: string,
  data: Partial<CreateForumInput>,
) {
  return apiRequest<{ message: string }>(`/forums/${forumId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteForum(forumId: string) {
  return apiRequest<{ message: string }>(`/forums/${forumId}`, {
    method: "DELETE",
  });
}

export async function joinForum(forumId: string) {
  return apiRequest<{ message: string }>(`/forums/${forumId}/join`, {
    method: "POST",
  });
}

export async function leaveForum(forumId: string) {
  return apiRequest<{ message: string }>(`/forums/${forumId}/leave`, {
    method: "POST",
  });
}

export async function getForumMembers(forumId: string) {
  return apiRequest<{ forum_members: any[] }>(`/forums/${forumId}/members`, {
    method: "GET",
  });
}

export async function getCategories() {
  return apiRequest<{ data: Category[] }>("/categories", { method: "GET" });
}

export async function getUserForums(userId: string) {
  return apiRequest<{ forums: Forum[] }>(`/forums/user/${userId}`, {
    method: "GET",
  });
}
