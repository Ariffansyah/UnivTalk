import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { getForums, getCategories, type Forum } from "../services/api/forums";

const getValidDate = (dateString?: string) => {
  if (!dateString) return new Date();
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? new Date() : date;
};

const getYear = (dateString?: string) => {
  return getValidDate(dateString).getFullYear();
};

const ForumList: React.FC = () => {
  const [forums, setForums] = useState<Forum[]>([]);
  const [filteredForums, setFilteredForums] = useState<Forum[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState<{ id: number; name: string }[]>(
    [],
  );
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [displayLimit, setDisplayLimit] = useState(10);

  useEffect(() => {
    const fetchForumsData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [res, catRes] = await Promise.all([getForums(), getCategories()]);
        const list = res && res.forums ? res.forums : [];
        const cats = catRes && (catRes as any).data ? (catRes as any).data : [];
        setCategories(cats);
        setForums(list);
        setFilteredForums(list);
      } catch (err: any) {
        setError(
          err.message
            ? `Failed to load forums: ${err.message}`
            : "Failed to load forums. Please try reloading this page.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchForumsData();
  }, []);

  useEffect(() => {
    const filtered = forums.filter((forum) => {
      const matchesText =
        forum.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        forum.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory
        ? forum.category_id === selectedCategory
        : true;
      return matchesText && matchesCategory;
    });
    setFilteredForums(filtered);
    setDisplayLimit(10);
  }, [searchQuery, forums, selectedCategory]);

  const handleScroll = useCallback(() => {
    if (
      window.innerHeight + document.documentElement.scrollTop + 50 >=
      document.documentElement.offsetHeight
    ) {
      setDisplayLimit((prev) => prev + 10);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  if (loading && forums.length === 0) {
    return (
      <div className="max-w-4xl mx-auto mt-10 p-6 text-center">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-xl w-full"></div>
          ))}
        </div>
      </div>
    );
  }

  const forumsToShow = filteredForums.slice(0, displayLimit);

  return (
    <div className="max-w-4xl mx-auto py-10 px-2 sm:px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Forums</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Discover and join student forums
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[170px] md:w-64">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search forums..."
              className="block w-full pl-10 pr-3 py-2 border border-blue-100 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-sm transition"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search forums"
            />
          </div>

          <div>
            <select
              value={selectedCategory ?? ""}
              onChange={(e) =>
                setSelectedCategory(
                  e.target.value ? Number(e.target.value) : null,
                )
              }
              className="py-2 px-3 border border-blue-100 rounded-lg bg-white text-sm cursor-pointer"
              aria-label="Filter by category"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          {selectedCategory && (
            <button
              onClick={() => setSelectedCategory(null)}
              className="text-sm text-gray-500 px-3 py-2 border border-blue-100 rounded-lg bg-white hover:bg-blue-50 transition cursor-pointer"
              aria-label="Clear category filter"
              type="button"
            >
              Clear
            </button>
          )}

          <Link
            to="/forums/new"
            className="whitespace-nowrap bg-blue-600 text-white px-5 py-2 rounded-lg font-bold hover:bg-blue-700 transition shadow-md flex items-center gap-2 cursor-pointer"
          >
            <span>+</span> Create
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded mb-6 font-bold">
          {error}
        </div>
      )}

      {forumsToShow.length === 0 && !loading && !error ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-blue-100">
          <h3 className="text-lg font-bold text-gray-800">No forums found</h3>
          <p className="text-gray-500">
            {searchQuery || selectedCategory
              ? "Try adjusting your search or category."
              : "No forums have been created yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {forumsToShow.map((forum) => {
            const createdAt = forum.created_at || (forum as any).CreatedAt;
            return (
              <div
                key={forum.fid}
                className="bg-white border border-blue-100 p-6 rounded-2xl shadow-sm hover:shadow-lg hover:border-blue-300 hover:bg-blue-50 transition group"
              >
                <Link
                  to={`/forums/${forum.fid}`}
                  className="flex items-start gap-5 focus:outline-none focus:ring-2 focus:ring-blue-300 rounded-lg"
                  tabIndex={0}
                  aria-label={`Open forum ${forum.title}`}
                >
                  <div
                    className="shrink-0 w-14 h-14 rounded-xl bg-blue-500 flex items-center justify-center text-white text-2xl font-bold shadow-sm uppercase group-hover:bg-blue-600 transition select-none"
                    style={{ userSelect: "none" }}
                  >
                    {forum.title.charAt(0)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <h2 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition truncate">
                        {forum.title}
                      </h2>

                      <div className="flex items-center gap-2 mt-1 sm:mt-0">
                        {categories &&
                          categories.length > 0 &&
                          forum.category_id && (
                            <span
                              onClick={(e) => {
                                e.preventDefault();
                                setSelectedCategory(forum.category_id ?? null);
                              }}
                              role="button"
                              tabIndex={0}
                              className={`text-xs font-bold px-3 py-1 rounded-full cursor-pointer outline-none ${selectedCategory === forum.category_id ? "bg-blue-600 text-white" : "text-blue-700 bg-blue-50 border border-blue-100"} transition`}
                              aria-label={`Filter to category ${
                                categories.find(
                                  (c) => c.id === forum.category_id,
                                )?.name || ""
                              }`}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  setSelectedCategory(
                                    forum.category_id ?? null,
                                  );
                                }
                              }}
                            >
                              {
                                categories.find(
                                  (c) => c.id === forum.category_id,
                                )?.name
                              }
                            </span>
                          )}
                        <span className="shrink-0 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                          View
                        </span>
                      </div>
                    </div>

                    <p className="text-gray-600 mt-1 line-clamp-2 text-sm leading-relaxed">
                      {forum.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-5 mt-4 text-xs text-gray-400 font-bold uppercase tracking-wider">
                      <span>{getYear(createdAt)} Established</span>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {displayLimit < filteredForums.length && (
        <div className="py-8 text-center text-gray-400 animate-pulse font-medium">
          Scrolling for more...
        </div>
      )}
    </div>
  );
};

export default ForumList;
