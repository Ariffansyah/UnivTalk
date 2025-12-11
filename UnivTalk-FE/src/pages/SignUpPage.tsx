import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchUniversitySuggestions } from "../services/api/uniList";
import { signUp } from "../services/api/signUp";

const DEBOUNCE_DELAY = 400;

const SignUpPage: React.FC = () => {
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
  const [errorMsg, setErrorMsg] = useState<string>("");

  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!form.university.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      setLoadingUniv(false);
      setSelectedUniv(false);
      return;
    }

    setLoadingUniv(true);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = window.setTimeout(async () => {
      const result = await fetchUniversitySuggestions(form.university);
      setSuggestions(result);
      setLoadingUniv(false);
      setShowSuggestions(true);
    }, DEBOUNCE_DELAY);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [form.university]);

  const handleUniversityInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({
      ...prev,
      university: e.target.value,
    }));
    setSelectedUniv(false);
    setShowSuggestions(true);
  };

  const handleSuggestionClick = (univ: string) => {
    setForm((prev) => ({
      ...prev,
      university: univ,
    }));
    setSelectedUniv(true);
    setShowSuggestions(false);
    if (inputRef.current) inputRef.current.blur();
  };

  const handleBlur = () => {
    setTimeout(() => setShowSuggestions(false), 120);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const characters = /[!@#$%^&*(),.?":{}|<>]/;

  const navigate = useNavigate();

<<<<<<< HEAD
=======

>>>>>>> 1ad313555744c197f19b7a04134339de4f496da0
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg("");

    if (form.username.length < 8) {
      setErrorMsg("Username must be at least 8 characters.");
      return;
    }
    if (form.firstName.length < 2) {
      setErrorMsg("First Name must be at least 2 characters.");
      return;
    }
    if (form.lastName.length < 2) {
      setErrorMsg("Last Name must be at least 2 characters.");
      return;
    }
    if (!validateEmail(form.email)) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }
    if (form.password.length < 8) {
      setErrorMsg("Password must be at least 8 characters.");
      return;
    }
    if (!characters.test(form.password)) {
      setErrorMsg("Password must include at least one special character.");
      return;
    }
    if (!/\d/.test(form.password)) {
      setErrorMsg("Password must include at least one number.");
      return;
    }
    if (!/[A-Z]/.test(form.password)) {
      setErrorMsg("Password must include at least one uppercase letter.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }
    if (!selectedUniv && !suggestions.includes(form.university)) {
      setErrorMsg("Please select a valid university from the list.");
      return;
    }
    setErrorMsg("");
    signUp(
      form.username,
      form.firstName,
      form.lastName,
      form.email,
      form.password,
      form.university,
      form.status,
    )
      .then((response) => {
        if (response.success) {
          alert("Registration successful!");
          navigate("/signin");
        } else {
          if (response.details && response.details.code === "23505") {
            setErrorMsg("Username or email already exists.");
          } else {
            setErrorMsg("Registration failed. Please try again.");
          }
        }
      })
      .catch(() => {
        setErrorMsg("An unexpected error occurred. Please try again.");
      });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md mt-10"
    >
      <h2 className="text-2xl font-bold mb-6 text-center">Sign Up</h2>
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
            minLength={8}
            placeholder="At least 8 characters"
          />
        </label>
      </div>
      <div className="mb-4">
        <label className="block mb-1 font-medium">
          First Name:
          <input
            type="text"
            name="firstName"
            value={form.firstName}
            onChange={handleChange}
            required
            className="w-full mt-1 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            minLength={2}
            placeholder="At least 2 characters"
          />
        </label>
      </div>
      <div className="mb-4">
        <label className="block mb-1 font-medium">
          Last Name:
          <input
            type="text"
            name="lastName"
            value={form.lastName}
            onChange={handleChange}
            required
            className="w-full mt-1 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            minLength={2}
            placeholder="At least 2 characters"
          />
        </label>
      </div>
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
            placeholder="Valid email address"
          />
        </label>
      </div>
      <div className="mb-4">
        <label className="block mb-1 font-medium">
          Password:
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            className="w-full mt-1 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            minLength={8}
            placeholder="At least 8 characters"
          />
        </label>
      </div>
      <div className="mb-4">
        <label className="block mb-1 font-medium">
          Confirm Password:
          <input
            type="password"
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            required
            className="w-full mt-1 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            minLength={8}
            placeholder="Repeat password"
          />
        </label>
      </div>
      <div className="mb-4 relative">
        <label className="block mb-1 font-medium">
          University:
          <input
            ref={inputRef}
            type="text"
            name="university"
            autoComplete="off"
            value={form.university}
            onChange={handleUniversityInput}
            required
            className="w-full mt-1 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Type your university name"
            onFocus={() => setShowSuggestions(suggestions.length > 0)}
            onBlur={handleBlur}
          />
        </label>
        {showSuggestions && (
          <ul
            className="absolute z-50 bg-white border border-gray-200 w-full rounded shadow mt-1 max-h-40 overflow-auto"
            style={{ minHeight: "2.5rem" }}
          >
            {loadingUniv ? (
              <li className="px-4 py-2 text-gray-500">Loading...</li>
            ) : suggestions.length === 0 ? (
              <li className="px-4 py-2 text-red-500">No results found</li>
            ) : (
              suggestions.map((univ) => (
                <li
                  key={univ}
                  className="cursor-pointer px-4 py-2 hover:bg-blue-100"
                  onMouseDown={() => handleSuggestionClick(univ)}
                >
                  {univ}
                </li>
              ))
            )}
          </ul>
        )}
      </div>
      <div className="mb-6">
        <label className="block mb-1 font-medium">
          Student Status:
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="w-full mt-1 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
      </div>
      {errorMsg && (
        <div className="mb-4 text-red-600 rounded px-4 py-2 bg-red-50 border border-red-200">
          {errorMsg}
        </div>
      )}
      <button
        type="submit"
        className="w-full bg-blue-600 text-white font-semibold py-2 rounded hover:bg-blue-700 transition"
      >
        Register
      </button>

      <p className="text-center mt-4 text-sm text-gray-600">
        Already have an account?{" "}
        <span
          onClick={() => navigate("/signin")}
          className="text-blue-600 hover:underline cursor-pointer"
        >
          Sign In
        </span>
      </p>
    </form>
  );
};

export default SignUpPage;
