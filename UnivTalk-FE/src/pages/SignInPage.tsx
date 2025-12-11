import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const SignInPage: React.FC = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const body: Record<string, string> = { password };
    if (identifier.includes("@")) {
      body.email = identifier;
    } else {
      body.username = identifier;
    }

    try {
      const res = await fetch("https://api.arpthef.my.id/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || data.message || "Login failed");
        return;
      }

      if (data.accessToken) {
        localStorage.setItem("accessToken", data.accessToken);
        navigate("/home");
      } else {
        setError("Login berhasil tetapi token tidak dikembalikan oleh server.");
      }
    } catch (err) {
      setError("Terjadi kesalahan jaringan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md mt-10">
      <h2 className="text-2xl font-bold mb-6 text-center">Sign In</h2>
      {error && <div className="mb-4 text-red-600">{error}</div>}

      <form onSubmit={handleSubmit}>
        <label className="block mb-4">
          Email or Username:
          <input
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            className="w-full mt-1 p-2 border rounded"
            placeholder="Email or username"
          />
        </label>

        <label className="block mb-4">
          Password:
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full mt-1 p-2 border rounded"
            placeholder="Your password"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>

        <p className="text-center mt-4 text-sm text-gray-600">
          Don't have an account?{" "}
          <span
            onClick={() => navigate("/signup")}
            className="text-blue-600 hover:underline cursor-pointer"
          >
            Sign Up
          </span>
        </p>
      </form>
    </div>
  );
};

export default SignInPage;