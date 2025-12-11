import React, { useState } from "react";
<<<<<<< HEAD
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
=======
import { signIn } from "../services/api/signIn"; // pastikan path API sesuai
import { useNavigate } from "react-router-dom";

const SignInPage: React.FC = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [errorMsg, setErrorMsg] = useState<string>("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg("");

    if (!validateEmail(form.email)) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    if (form.password.length < 8) {
      setErrorMsg("Password must be at least 8 characters.");
      return;
    }

    try {
      const response = await signIn(form.email, form.password);
      if (response.success) {
        alert("Login successful!");
        navigate("/home");
      } else {
        if (response?.details?.code === "401") {
          setErrorMsg("Incorrect email or password.");
        } else {
          setErrorMsg("Login failed. Please try again.");
        }
      }
    } catch (error) {
      setErrorMsg("An unexpected error occurred. Please try again.");
>>>>>>> 1ad313555744c197f19b7a04134339de4f496da0
    }
  };

  return (
<<<<<<< HEAD
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
=======
    <form
      onSubmit={handleSubmit}
      className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md mt-10"
    >
      <h2 className="text-2xl font-bold mb-6 text-center">Sign In</h2>

      {/* Email */}
      <div className="mb-4">
        <label className="block mb-1 font-medium">
          Email:
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            className="w-full mt-1 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Enter your email"
          />
        </label>
      </div>

      {/* Password */}
      <div className="mb-4">
        <label className="block mb-1 font-medium">
          Password:
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            minLength={8}
            className="w-full mt-1 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Enter your password"
          />
        </label>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="mb-4 text-red-600 rounded px-4 py-2 bg-red-50 border border-red-200">
          {errorMsg}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        className="w-full bg-blue-600 text-white font-semibold py-2 rounded hover:bg-blue-700 transition"
      >
        Login
      </button>

      {/* Link to Sign Up */}
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
  );
};

export default SignInPage;
>>>>>>> 1ad313555744c197f19b7a04134339de4f496da0
