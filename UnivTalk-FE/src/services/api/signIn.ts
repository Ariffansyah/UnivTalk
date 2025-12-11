export async function signIn(
  email: string,
  password: string
): Promise<{ success: boolean; message: string; details?: any }> {
  const res = await fetch("https://api.arpthef.my.id/signin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
<<<<<<< HEAD
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
=======
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
>>>>>>> 1ad313555744c197f19b7a04134339de4f496da0
  }

  if (!res.ok) {
    return {
      success: false,
<<<<<<< HEAD
      message: data.message || "Network response was not ok.",
=======
      message: "Login failed.",
>>>>>>> 1ad313555744c197f19b7a04134339de4f496da0
      details: data.detail,
    };
  }

  return {
    success: true,
    message: data.message || "Login successful.",
    details: data,
  };
<<<<<<< HEAD
}
=======
}
>>>>>>> 1ad313555744c197f19b7a04134339de4f496da0
