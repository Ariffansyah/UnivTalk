export async function signUp(
  username: string,
  first_name: string,
  last_name: string,
  email: string,
  password: string,
  university: string,
  status: string,
): Promise<{ success: boolean; message: string; details?: any }> {
  const res = await fetch("http://localhost:8080/signup", {
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
