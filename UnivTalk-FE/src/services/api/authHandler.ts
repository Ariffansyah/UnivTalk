export async function signUp(
  username: string,
  first_name: string,
  last_name: string,
  email: string,
  password: string,
  university: string,
  status: string,
): Promise<{ success: boolean; message: string; details?: any }> {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username,
      first_name,
      last_name,
      email,
      password,
      university,
      status,
    }),
  });

  let data;
  try {
    data = await res.json();
  } catch {
    data = {};
  }

  if (!res.ok) {
    return {
      success: false,
      message: "Network response was not ok.",
      details: data.detail,
    };
  }

  return {
    success: true,
    message: data.message || "User signed up successfully.",
  };
}

export async function signIn(
  username: string,
  password: string,
): Promise<{
  success: boolean;
  message: string;
  token?: string;
  details?: any;
}> {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/signin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  let data;
  try {
    data = await res.json();
  } catch {
    data = {};
  }

  if (!res.ok) {
    return {
      success: false,
      message: "Network response was not ok.",
      details: data.detail,
    };
  }

  return {
    success: true,
    message: data.message || "User signed in successfully.",
    token: data.token,
  };
}

export async function getUserProfile(token: string): Promise<{
  success: boolean;
  message: string;
  profile?: any;
  details?: any;
}> {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/profile`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });

  let data;
  try {
    data = await res.json();
  } catch {
    data = {};
  }

  if (!res.ok) {
    return {
      success: false,
      message: "Network response was not ok.",
      details: data.detail,
    };
  }

  return {
    success: true,
    message: data.message || "User profile fetched successfully.",
    profile: data.profile,
  };
}
