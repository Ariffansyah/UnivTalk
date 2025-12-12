import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signIn } from "../services/api/authHandler.ts";

const SignInPage: React.FC = () => {
  const [form, setForm] = useState({ username: "", password: "" });
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg("");
    if (!form.username.trim() || !form.password) {
      setErrorMsg("Please enter username and password.");
      return;
    }

    setLoading(true);
    try {
      const res = await signIn(form.username.trim(), form.password);
      if (res.success && res.token) {
        localStorage.setItem("token", res.token);
        navigate("/");
      } else {
        setErrorMsg(res.message || "Sign in failed. Check credentials.");
      }
    } catch (err) {
      setErrorMsg("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md mt-10"
    >
      <h2 className="text-2xl font-bold mb-6 text-center">Sign In</h2>

      <div className="mb-4">
        <label className="block mb-1 font-medium">
          Username:
          <input
            type="text"
            name="username"
            value={form.username}
            onChange={handleChange}
            required
            className="w-full mt-1 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Your username"
          />
        </label>
      </div>

      <div className="mb-6">
        <label className="block mb-1 font-medium">
          Password:
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            className="w-full mt-1 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Your password"
          />
        </label>
      </div>

      {errorMsg && (
        <div className="mb-4 text-red-600 rounded px-4 py-2 bg-red-50 border border-red-200">
          {errorMsg}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white font-semibold py-2 rounded hover:bg-blue-700 transition disabled:opacity-60"
      >
        {loading ? "Signing in..." : "Sign In"}
      </button>

      <div className="mt-4 text-center text-sm text-gray-600">
        Don't have an account? <Link to="/signup" className="text-blue-600">Sign up</Link>
      </div>
    </form>
  );
};

export default SignInPage;
