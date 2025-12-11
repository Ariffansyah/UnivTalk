export async function signIn(
  email: string,
  password: string
): Promise<{ success: boolean; message: string; details?: any }> {
  const res = await fetch("https://api.arpthef.my.id/signin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const contentType = res.headers.get("content-type") || "";

  let data: any = null;
  if (contentType.includes("application/json")) {
    data = await res.json();
  } else {
    const text = await res.text();
    return {
      success: false,
      message: "Server returned non-JSON response.",
      details: text.slice(0, 400),
    };
  }

  if (!res.ok) {
    return {
      success: false,
      message: data.message || "Network response was not ok.",
      details: data.detail,
    };
  }

  return {
    success: true,
    message: data.message || "Login successful.",
    details: data,
  };
}
