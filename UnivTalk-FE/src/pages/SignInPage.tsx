import React, { useState } from "react";
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
    }
  };

  return (
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
