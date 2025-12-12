import { apiRequest } from "./client";

export type UserStatus = "active" | "inactive";

export interface UserProfile {
  user_id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  university: string;
  status: UserStatus | string;
  is_admin: boolean;
}

const normalizeStatus = (status?: string): UserStatus => {
  const s = String(status || "")
    .toLowerCase()
    .trim();
  return s === "inactive" ? "inactive" : "active";
};

export async function signUp(
  username: string,
  firstName: string,
  lastName: string,
  email: string,
  password: string,
  university: string,
  status: UserStatus | string,
) {
  try {
    await apiRequest("/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        first_name: firstName,
        last_name: lastName,
        email,
        password,
        university,
        status: normalizeStatus(status),
      }),
    });
    return { success: true, message: "Signed up successfully" };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function signInWithUsername(username: string, password: string) {
  try {
    await apiRequest("/signin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    return { success: true, message: "Logged in" };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function signInWithEmail(email: string, password: string) {
  try {
    await apiRequest("/signin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    return { success: true, message: "Logged in" };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function signIn(identifier: string, password: string) {
  const isEmail = identifier.includes("@");
  return isEmail
    ? signInWithEmail(identifier, password)
    : signInWithUsername(identifier, password);
}

export async function updateUserProfile(profileData: {
  first_name?: string;
  last_name?: string;
  username?: string;
  university?: string;
  status?: UserStatus | string;
}) {
  try {
    const payload: Record<string, unknown> = {};
    if (profileData.first_name !== undefined)
      payload.first_name = profileData.first_name;
    if (profileData.last_name !== undefined)
      payload.last_name = profileData.last_name;
    if (profileData.username !== undefined)
      payload.username = profileData.username;
    if (profileData.university !== undefined)
      payload.university = profileData.university;
    if (profileData.status !== undefined)
      payload.status = normalizeStatus(profileData.status as string);

    await apiRequest("/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return { success: true, message: "Profile updated successfully" };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function getUserProfile() {
  try {
    const res = await apiRequest<UserProfile>("/profile", { method: "GET" });
    return { success: true, profile: res };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function signOut() {
  try {
    await apiRequest("/signout", { method: "POST" });
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
) {
  try {
    await apiRequest("/profile/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    });
    return { success: true, message: "Password changed successfully" };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function deleteAccount(password: string) {
  try {
    await apiRequest("/profile", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    return { success: true, message: "Account deleted successfully" };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}
