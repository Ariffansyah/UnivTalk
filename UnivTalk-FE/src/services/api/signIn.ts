export async function signIn(
  email: string,
  password: string
): Promise<{ success: boolean; message: string; details?: any }> {
  const res = await fetch("https://api.arpthef.my.id/signin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password,
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
      message: "Login failed.",
      details: data.detail,
    };
  }

  return {
    success: true,
    message: data.message || "Login successful.",
    details: data,
  };
}