import { apiRequest } from "./client";

export interface UserProfile {
  user_id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  university: string;
  status: string;
  is_admin: boolean;
}

export async function getUserProfileByID(userId: string) {
  return apiRequest<{ user: UserProfile }>(`/profile/${userId}`, {
    method: "GET",
  });
}
