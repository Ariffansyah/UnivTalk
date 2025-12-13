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
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!form.university.trim() || selectedUniv) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(async () => {
      setLoadingUniv(true);
      try {
        const result = await fetchUniversitySuggestions(form.university);
        setSuggestions(result);
        setShowSuggestions(true);
      } catch (err) {
        setSuggestions([]);
        setShowSuggestions(true);
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
    setFieldErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleUniversityInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedUniv(false);
    setForm((prev) => ({ ...prev, university: e.target.value }));
    setFieldErrors((prev) => ({ ...prev, university: "" }));
  };

  const handleSuggestionClick = (univ: string) => {
    setForm((prev) => ({ ...prev, university: univ }));
    setSelectedUniv(true);
    setShowSuggestions(false);
    setFieldErrors((prev) => ({ ...prev, university: "" }));
  };

  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    let errObj: { [key: string]: string } = {};

    if (!form.firstName || form.firstName.length < 2)
      errObj.firstName = "First name is required (at least 2 characters).";
    if (!form.lastName || form.lastName.length < 2)
      errObj.lastName = "Last name is required (at least 2 characters).";
    if (!form.username || form.username.length < 8)
      errObj.username =
        "Username must be at least 8 characters (letters/numbers only, no spaces).";
    if (!validateEmail(form.email))
      errObj.email = "Please enter a valid email address.";
    if (!form.password || form.password.length < 8)
      errObj.password = "Password must be at least 8 characters.";
    else if (!/[A-Z]/.test(form.password))
      errObj.password = "Password must contain at least one uppercase letter.";
    else if (!/[a-z]/.test(form.password))
      errObj.password = "Password must contain at least one lowercase letter.";
    else if (!/\d/.test(form.password))
      errObj.password = "Password must contain at least one number.";
    else if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]+/.test(form.password))
      errObj.password =
        "Password must contain at least one special character (e.g. @#$%).";
    if (form.password !== form.confirmPassword)
      errObj.confirmPassword = "Passwords do not match.";
    if (
      !selectedUniv &&
      !suggestions.some(
        (s) => s.toLowerCase() === form.university.toLowerCase(),
      )
    ) {
      errObj.university = "Please select your university from the suggestions.";
    }

    setFieldErrors(errObj);

    if (Object.keys(errObj).length > 0) {
      setErrorMsg("Please review the highlighted fields below.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");
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
      setErrorMsg(err.message || "Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-blue-600">
      <div
        className="absolute inset-0 -z-10"
        style={{
          backgroundColor: "#fef9c3",
          opacity: 0.28,
        }}
      ></div>
      <form
        onSubmit={handleSubmit}
        className="w-full bg-white rounded-xl shadow-lg border border-gray-200 py-8 px-4 sm:px-10 md:px-14 max-w-md md:max-w-xl lg:max-w-2xl mx-auto"
        style={{ position: "relative" }}
        noValidate
      >
        <div
          className="text-center mb-8 select-none"
          style={{ userSelect: "none" }}
        >
          <img
            src={logo}
            alt="UnivTalk Logo"
            className="w-32 mx-auto"
            draggable={false}
          />
          <h2 className="text-2xl font-semibold text-gray-700">
            Create Account
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Join our university community
          </p>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                First Name
              </label>
              <input
                type="text"
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${fieldErrors.firstName ? "border-red-400" : "border-gray-300"}`}
                minLength={2}
                placeholder="e.g. John"
              />
              <p className="text-xs text-gray-400 mt-1">
                At least 2 characters, letters and spaces only.
              </p>
              {fieldErrors.firstName && (
                <p className="text-xs text-red-500">{fieldErrors.firstName}</p>
              )}
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
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${fieldErrors.lastName ? "border-red-400" : "border-gray-300"}`}
                minLength={2}
                placeholder="e.g. Doe"
              />
              <p className="text-xs text-gray-400 mt-1">
                At least 2 characters, letters and spaces only.
              </p>
              {fieldErrors.lastName && (
                <p className="text-xs text-red-500">{fieldErrors.lastName}</p>
              )}
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
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${fieldErrors.username ? "border-red-400" : "border-gray-300"}`}
              minLength={8}
              placeholder="At least 8 characters"
            />
            <p className="text-xs text-gray-400 mt-1">
              At least 8 characters (letters and numbers only, no spaces).
            </p>
            {fieldErrors.username && (
              <p className="text-xs text-red-500">{fieldErrors.username}</p>
            )}
          </div>
          <div className="mb-5">
            <label className="block text-gray-700 font-semibold mb-2">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${fieldErrors.email ? "border-red-400" : "border-gray-300"}`}
              placeholder="name@university.edu"
            />
            <p className="text-xs text-gray-400 mt-1">
              Use your valid student email address (e.g. name@student.univ.edu).
            </p>
            {fieldErrors.email && (
              <p className="text-xs text-red-500">{fieldErrors.email}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
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
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${fieldErrors.password ? "border-red-400" : "border-gray-300"}`}
                  minLength={8}
                  placeholder="Min. 8 chars w/ upper, lower, number, symbol"
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
              <p className="text-xs text-gray-400 mt-1">
                At least 8 characters, includes uppercase and lowercase letters,
                a number, and a symbol.
              </p>
              {fieldErrors.password && (
                <p className="text-xs text-red-500">{fieldErrors.password}</p>
              )}
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
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${fieldErrors.confirmPassword ? "border-red-400" : "border-gray-300"}`}
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
              {fieldErrors.confirmPassword && (
                <p className="text-xs text-red-500">
                  {fieldErrors.confirmPassword}
                </p>
              )}
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
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${fieldErrors.university ? "border-red-400" : "border-gray-300"}`}
              placeholder="Type university, pick from suggestions"
            />
            {fieldErrors.university && (
              <p className="text-xs text-red-500">{fieldErrors.university}</p>
            )}
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
          <div className="mt-6 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-center gap-2 animate-pulse font-bold">
            {errorMsg}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full mt-8 bg-blue-600 text-white font-bold py-3 rounded-lg transition-all shadow-md ${
            isSubmitting
              ? "opacity-70 cursor-not-allowed pointer-events-none"
              : "hover:bg-blue-700 cursor-pointer"
          }`}
          style={
            isSubmitting
              ? { cursor: "not-allowed", pointerEvents: "none" }
              : { cursor: "pointer" }
          }
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
