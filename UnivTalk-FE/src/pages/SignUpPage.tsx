import React, { useState, useRef, useEffect } from "react";
import { fetchUniversitySuggestions } from "../services/api/uni";
import { signUp } from "../services/api/auth.ts";
import { useNavigate } from "react-router-dom";

const DEBOUNCE_DELAY = 400;

const SignUpPage: React.FC = () => {
  const navigate = useNavigate();
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
        setShowSuggestions(result.length > 0);
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
        alert("Registration successful! Please sign in.");
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
    <div className="min-h-screen bg-gray-100 py-10">
      <form
        onSubmit={handleSubmit}
        className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-lg border border-gray-200"
      >
        <h2 className="text-3xl font-extrabold mb-6 text-center text-gray-800">
          Create Account
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700">
              Username
            </label>
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              required
              className="w-full mt-1 p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="Min. 8 characters"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700">
                First Name
              </label>
              <input
                type="text"
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                required
                className="w-full mt-1 p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700">
                Last Name
              </label>
              <input
                type="text"
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                required
                className="w-full mt-1 p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full mt-1 p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="name@university.edu"
            />
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                className="w-full mt-1 p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                required
                className="w-full mt-1 p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="relative">
            <label className="block text-sm font-semibold text-gray-700">
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
              className="w-full mt-1 p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
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
            <label className="block text-sm font-semibold text-gray-700">
              Student Status
            </label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full mt-1 p-2.5 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
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
      </form>
    </div>
  );
};

export default SignUpPage;
