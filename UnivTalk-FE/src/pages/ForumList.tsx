import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { getForums, type Forum } from "../services/api/forums";

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
  const [displayLimit, setDisplayLimit] = useState(10);

  useEffect(() => {
    const fetchForumsData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getForums();
        const list = res && res.forums ? res.forums : [];
        setForums(list);
        setFilteredForums(list);
      } catch (err: any) {
        console.error("Fetch error:", err);
        setError(err.message || "Error fetching forums");
      } finally {
        setLoading(false);
      }
    };

    fetchForumsData();
  }, []);

  useEffect(() => {
    const filtered = forums.filter(
      (forum) =>
        forum.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        forum.description.toLowerCase().includes(searchQuery.toLowerCase()),
    );
    setFilteredForums(filtered);
    setDisplayLimit(10);
  }, [searchQuery, forums]);

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
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Communities</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Discover and join student communities
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 md:w-64">
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
              placeholder="Search communities..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-sm transition"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Link
            to="/forums/new"
            className="whitespace-nowrap bg-blue-600 text-white px-5 py-2 rounded-lg font-bold hover:bg-blue-700 transition shadow-md flex items-center gap-2"
          >
            <span>+</span> Create
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded mb-6">
          {error}
        </div>
      )}

      {forumsToShow.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
          <h3 className="text-lg font-bold text-gray-800">
            No communities found
          </h3>
          <p className="text-gray-500">Try adjusting your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {forumsToShow.map((forum) => {
            const createdAt = forum.created_at || (forum as any).CreatedAt;
            return (
              <div
                key={forum.fid}
                className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-200 transition group"
              >
                <Link
                  to={`/forums/${forum.fid}`}
                  className="flex items-start gap-5"
                >
                  <div className="shrink-0 w-14 h-14 rounded-xl bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-sm uppercase">
                    {forum.title.charAt(0)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition truncate">
                        {forum.title}
                      </h2>
                      <span className="shrink-0 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                        View
                      </span>
                    </div>

                    <p className="text-gray-600 mt-1 line-clamp-2 text-sm leading-relaxed">
                      {forum.description}
                    </p>

                    <div className="flex items-center gap-5 mt-4 text-xs text-gray-400 font-bold uppercase tracking-wider">
                      <span>{forum.member_count} Members</span>
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
