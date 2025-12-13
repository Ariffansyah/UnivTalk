import React, { useState, useRef, useEffect } from "react";
import { fetchUniversitySuggestions } from "../services/api/uni";
import { signUp } from "../services/api/auth.ts";
import { useNavigate } from "react-router-dom";
import logo from "../assets/LogoUnivTalk.png";
import { useAlert } from "../context/AlertContext";

const DEBOUNCE_DELAY = 400;

const SignUpPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useAlert();

  const [form, setForm] = useState({
    username: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    university: "",
    status: "active",
  });

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingUniv, setLoadingUniv] = useState(false);
  const [selectedUniv, setSelectedUniv] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimer = useRef<any>(null);

  useEffect(() => {
    if (!form.university.trim() || selectedUniv) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setLoadingUniv(true);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(async () => {
      try {
        const result = await fetchUniversitySuggestions(form.university);
        setSuggestions(result);
        setShowSuggestions(true);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingUniv(false);
      }
    }, DEBOUNCE_DELAY);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [form.university, selectedUniv]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errorMsg) setErrorMsg("");
  };

  const handleUniversityInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedUniv(false);
    setForm((prev) => ({ ...prev, university: e.target.value }));
  };

  const handleSuggestionClick = (univ: string) => {
    setForm((prev) => ({ ...prev, university: univ }));
    setSelectedUniv(true);
    setShowSuggestions(false);
  };

  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const specialChars = /[!@#$%^&*(),.?":{}|<>]/;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg("");

    if (form.username.length < 8)
      return setErrorMsg("Username must be at least 8 characters.");
    if (form.firstName.length < 2 || form.lastName.length < 2)
      return setErrorMsg("Name fields must be at least 2 characters.");
    if (!validateEmail(form.email))
      return setErrorMsg("Please enter a valid email address.");
    if (form.password.length < 8)
      return setErrorMsg("Password must be at least 8 characters.");

    if (
      !specialChars.test(form.password) ||
      !/\d/.test(form.password) ||
      !/[A-Z]/.test(form.password)
    ) {
      return setErrorMsg(
        "Password must include an uppercase letter, a number, and a special character.",
      );
    }

    if (form.password !== form.confirmPassword)
      return setErrorMsg("Passwords do not match.");

    if (
      !selectedUniv &&
      !suggestions.some(
        (s) => s.toLowerCase() === form.university.toLowerCase(),
      )
    ) {
      return setErrorMsg(
        "Please select a valid university from the suggestions.",
      );
    }

    setIsSubmitting(true);
    try {
      const response = await signUp(
        form.username,
        form.firstName,
        form.lastName,
        form.email,
        form.password,
        form.university,
        form.status,
      );

      if (response.success) {
        showToast("Registration successful! Please sign in.", "success");
        navigate("/signin");
      } else {
        setErrorMsg(response.message);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: "#2563eb", backgroundImage: "none" }}
    >
      <div
        className="absolute inset-0 -z-10"
        style={{
          backgroundColor: "#fef9c3",
          opacity: 0.28,
        }}
      ></div>
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg  p-8max-w-md mx-auto bg-white p-8 rounded-xl shadow-lg border border-gray-200"
        style={{ position: "relative" }}
      >
        <div className="text-center mb-8">
          <img src={logo} alt="UnivTalk Logo" className="w-32 mx-auto" />
          <h2 className="text-2xl font-semibold text-gray-700">
            Create Account
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Join our university community
          </p>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                First Name
              </label>
              <input
                type="text"
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                minLength={2}
                placeholder="First name"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Last Name
              </label>
              <input
                type="text"
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                minLength={2}
                placeholder="Last name"
              />
            </div>
          </div>

          <div className="mb-5">
            <label className="block text-gray-700 font-semibold mb-2">
              Username
            </label>
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              minLength={8}
              placeholder="At least 8 characters"
            />
          </div>

          <div className="mb-5">
            <label className="block text-gray-700 font-semibold mb-2">
              Email Addres
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="name@university.edu"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  minLength={8}
                  placeholder="At least 8 chars"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <i className="fa-solid fa-eye"></i>
                  ) : (
                    <i className="fa-solid fa-eye-slash"></i>
                  )}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition pr-10"
                  minLength={8}
                  placeholder="Repeat password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? (
                    <i className="fa-solid fa-eye"></i>
                  ) : (
                    <i className="fa-solid fa-eye-slash"></i>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="relative">
            <label className="block text-gray-700 font-semibold mb-2">
              University
            </label>
            <input
              ref={inputRef}
              type="text"
              name="university"
              autoComplete="off"
              value={form.university}
              onChange={handleUniversityInput}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="Search your university..."
            />
            {showSuggestions && (
              <ul className="absolute z-50 bg-white border border-gray-300 w-full rounded-lg shadow-xl mt-1 max-h-48 overflow-y-auto">
                {loadingUniv ? (
                  <li className="px-4 py-3 text-sm text-gray-500 italic">
                    Searching...
                  </li>
                ) : suggestions.length > 0 ? (
                  suggestions.map((univ) => (
                    <li
                      key={univ}
                      onMouseDown={() => handleSuggestionClick(univ)}
                      className="cursor-pointer px-4 py-2.5 text-sm hover:bg-blue-50 text-gray-700 border-b last:border-none"
                    >
                      {univ}
                    </li>
                  ))
                ) : (
                  <li className="px-4 py-3 text-sm text-red-500">
                    No universities found
                  </li>
                )}
              </ul>
            )}
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Student Status
            </label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent transition"
            >
              <option value="active">Active Student</option>
              <option value="inactive">Alumni / Inactive</option>
            </select>
          </div>
        </div>

        {errorMsg && (
          <div className="mt-6 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-center gap-2 animate-pulse">
            <span>⚠️</span> {errorMsg}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full mt-8 bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-all shadow-md ${isSubmitting ? "opacity-70 cursor-not-allowed" : ""}`}
        >
          {isSubmitting ? "Creating Account..." : "Register"}
        </button>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-center text-gray-600">
            Already have an account?{" "}
            <span
              onClick={() => navigate("/signin")}
              className="text-blue-600 font-semibold hover:text-gray-600 cursor-pointer transition-colors duration-300"
            >
              Sign in here
            </span>
          </p>
        </div>
      </form>
    </div>
  );
};

export default SignUpPage;

