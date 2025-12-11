import React, {useEffect, useState,useRef} from "react";

type ID = number | string;

interface user {
    id:ID;
    name:string;
    avatarUrl?: string;
}

interface Post {
    id:ID;
    author: user;
    content: string;
    createAt: string;
}

interface Thread {
    id:ID;
    title:string;
    author:user;
    excerpt?:string;
    createdAt:string;
    lastActivityAt?:string;
    repliesCount?:number;
    category?:string;
}

interface ThreadRes {
    threads:Thread[];
    total:number;
}

const DEFAULT_PAGE_SIZE = 12;

function formatDate(iso?:string) {
    if(!iso) return "";
    const d =new Date(iso);
    return d.toLocaleString();
}


export default function ForumPage() {
    const [threads, setThreads] =useState<Thread[]>([]);
    const [page, setPage] =useState(1);
    const [total, setTotal] =useState(0);
    const [loading, setLoading] =useState(false);
    const [loadingMore, setLoadingMore] =useState(false);
    const [error, setError] = useState<string | null>(null);

    const [selectedThreadId, setSelectedThreadId] = useState<ID | null>(null);
    const [selectedThreadPosts, setSelectedThreadPosts] = useState<Post[] | null>(null);
    const [selectedThreadDetails, setSelectedThreadDetails] = useState<Thread | null>(null);
    const [threadLoading, setThreadLoading] = useState(false);

    const [creating, setCreating] = useState(false);
    const titleRef = useRef<HTMLInputElement | null>(null);
    const contentRef = useRef<HTMLTextAreaElement | null>(null);
    const categoryRef = useRef<HTMLInputElement | null>(null);

    const [replyContent, setReplyContent] = useState("");
    const [replying, setReplying] = useState(false);

    useEffect(() => {
        fetchThreads(page);
    },[page]);

    async function fetchThreads(pageToLoad=1) {
        try {
            if(pageToLoad ===1) {
                setLoading(true)
            } else{
                setLoadingMore(true)
            }
            setError(null);
            const res = await fetch(`/api/threads?page=${pageToLoad}&limit=${DEFAULT_PAGE_SIZE}`);
            if (!res.ok) throw new Error('Server error (${res.status})');
            const data: ThreadRes = await res.json();
            if(pageToLoad === 1){
                setThreads(data.threads);
            } else {
                setThreads((prev)=>[...prev, ...data.threads]);
            }
            setTotal(data.total);
        } catch (err:any) {
            console.error("Failed to fetch threads", err);
            setError(err?.message ?? "Terjadi kesalahan sata mengambil thread.")
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    } 

    async function openThread(threadId:ID) {
        setSelectedThreadId(threadId);
        setThreadLoading(true);
        setSelectedThreadPosts(null);
        setSelectedThreadDetails(null);

        try {
            const res = await fetch (`/api/threads/${threadId}`);
            if (!res.ok) throw new Error('Server error (${res.status})');
            const payload = await res.json();
            setSelectedThreadDetails(payload.thread);
            setSelectedThreadPosts(payload.posts ?? []);
        } catch (err:any) {
            console.error("Failed to open threads", err);
            setError(err?.message ?? "Gaga memuat detail thread.")
        } finally {
            setThreadLoading(false);
        }
    }

    async function createThread(e?: React.FormEvent) {
        e?.preventDefault();
        const title = titleRef.current?.value?.trim();
        const content = contentRef.current?.value?.trim();
        const category = categoryRef.current?.value?.trim();
        if(!title || !content) {
            setError("Judul dan konten wajib di isi!");
            return;
        }
        setCreating(true);
        setError(null);

        const tempId = 'temp-${Date.now()}';
        const optimisticThread: Thread = {
            id: tempId,
            title,
            author: {id: "me", name: "anda"},
            excerpt:content.slice(0,200),
            createdAt:new Date().toISOString(),
            lastActivityAt:new Date().toISOString(),
            repliesCount: 0,
            category,
        };

        setThreads((prev) => [optimisticThread, ...prev]);
        try {
          const res = await fetch("/api/threads", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title, content, category }),
          });
          if (!res.ok) throw new Error(`Server error (${res.status})`);
          const payload = await res.json();
          const created: Thread = payload.thread;
          setThreads((prev) => prev.map((t) => (t.id === tempId ? created : t)));
          if (titleRef.current) titleRef.current.value = "";
          if (contentRef.current) contentRef.current.value = "";
          if (categoryRef.current) categoryRef.current.value = "";
        } catch (err: any) {
          console.error("Failed to create thread", err);
          setThreads((prev) => prev.filter((t) => t.id !== tempId));
          setError(err?.message ?? "Gagal membuat thread.");
        } finally {
          setCreating(false);
        }
    }

    async function postReply(threadId: ID) {
        const content = replyContent.trim();
        if(!content) {
            setError("Tidak ada reply");
            return;
        }
        setReplying(true);
        setError(null);

        const tempPost: Post = {
            id: `temp-post-${Date.now()}`,
            author: {id: "me", name: "anda"},
            content,
            createAt:new Date().toISOString(),
        };
        setSelectedThreadPosts((prev) => (prev? [...prev, tempPost] : [tempPost]))
        try {
            const res = await fetch (`/api/threads/${threadId}/post`, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({ content}),
            });
            if (!res.ok) throw new Error(`Server error (${res.status})`);
            const payload = await res.json();
            const createdPost: Post = payload.post;
            setSelectedThreadPosts((prev) => 
                prev ? prev.map((p) => (p.id === tempPost.id ? createdPost : p)) : [createdPost]
        );
        setReplyContent("");
        setThreads((prev)=> prev.map((t)=> t.id == threadId ? {
            ...t,
            repliesCount: (t.repliesCount ?? 0) + 1,
            lastActivityAt: createdPost.createAt,
         } : t )
        );
        } catch (err:any) {
            console.error("Failed to post reply", err);
            setSelectedThreadPosts((prev) => (prev ? prev.filter((p)=> p.id !== tempPost.id) : null))
            setError(err?.message ?? "Gagal megirim reply.")
        } finally {
            setReplying(false);
        }
    }

    const canLoadMore = threads.length < total;

    return (
        <div className="forum-page" style={{ padding: 20, maxWidth: 1100, margin: "0 auto" }}>
      <h1>Forum UnivTalk</h1>

      <section
        aria-labelledby="create-thread-heading"
        style={{
          border: "1px solid #e6e6e6",
          padding: 16,
          borderRadius: 8,
          marginBottom: 20,
          background: "#fff",
        }}
      >
        <h2 id="create-thread-heading" style={{ marginTop: 0 }}>
          Buat Thread Baru
        </h2>
        <form onSubmit={createThread}>
          <div style={{ display: "flex", gap: 12, flexDirection: "column" }}>
            <input
              ref={titleRef}
              placeholder="Judul thread"
              aria-label="Judul thread"
              style={{ padding: 8, fontSize: 16 }}
            />
            <textarea
              ref={contentRef}
              placeholder="Tulis isi thread..."
              aria-label="Isi thread"
              rows={6}
              style={{ padding: 8, fontSize: 15 }}
            />
            <input
              ref={categoryRef}
              placeholder="Kategori (opsional)"
              aria-label="Kategori"
              style={{ padding: 8 }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button type="submit" disabled={creating} aria-disabled={creating}>
                {creating ? "Membuat..." : "Buat Thread"}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (titleRef.current) titleRef.current.value = "";
                  if (contentRef.current) contentRef.current.value = "";
                  if (categoryRef.current) categoryRef.current.value = "";
                }}
              >
                Reset
              </button>
            </div>
          </div>
        </form>
      </section>

      <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
        <main style={{ flex: 2 }}>
          <section aria-labelledby="threads-heading">
            <h2 id="threads-heading">Daftar Thread</h2>
            {loading && page === 1 ? (
              <p>Memuat thread...</p>
            ) : error ? (
              <p role="alert" style={{ color: "crimson" }}>
                {error}
              </p>
            ) : (
              <>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {threads.map((t) => (
                    <li
                      key={String(t.id)}
                      style={{
                        border: "1px solid #eee",
                        padding: 12,
                        borderRadius: 6,
                        marginBottom: 10,
                        background: "#fff",
                        cursor: "pointer",
                      }}
                      onClick={() => openThread(t.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") openThread(t.id);
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                        <div>
                          <strong style={{ fontSize: 16 }}>{t.title}</strong>
                          <div style={{ color: "#666", fontSize: 13 }}>
                            oleh {t.author?.name ?? "—"} · {t.category ?? "General"}
                          </div>
                          {t.excerpt && (
                            <p style={{ marginTop: 8, marginBottom: 0, color: "#444" }}>
                              {t.excerpt}
                            </p>
                          )}
                        </div>
                        <div style={{ textAlign: "right", minWidth: 120 }}>
                          <div style={{ fontSize: 13, color: "#666" }}>
                            {t.repliesCount ?? 0} balasan
                          </div>
                          <div style={{ fontSize: 12, color: "#999" }}>
                            {formatDate(t.lastActivityAt ?? t.createdAt)}
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>

                <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center" }}>
                  {canLoadMore && (
                    <button
                      onClick={() => setPage((p) => p + 1)}
                      disabled={loadingMore}
                      aria-disabled={loadingMore}
                    >
                      {loadingMore ? "Memuat..." : "Muat lebih banyak"}
                    </button>
                  )}
                  {!canLoadMore && <div style={{ color: "#666" }}>Tidak ada thread lagi.</div>}
                </div>
              </>
            )}
          </section>
        </main>

        <aside style={{ flex: 1 }}>
          <div
            style={{
              border: "1px solid #eee",
              padding: 12,
              borderRadius: 6,
              background: "#fff",
            }}
          >
            <h3 style={{ marginTop: 0 }}>Rangkuman Thread</h3>
            <p style={{ margin: 0 }}>
              Total thread: <strong>{total}</strong>
            </p>
            <p style={{ marginTop: 8, marginBottom: 0 }}>
              Klik sebuah thread untuk melihat isi dan membalas.
            </p>
          </div>

          {selectedThreadDetails && (
            <div
              style={{
                marginTop: 12,
                border: "1px solid #eee",
                padding: 12,
                borderRadius: 6,
                background: "#fff",
              }}
            >
              <h3 style={{ marginTop: 0 }}>Thread: {selectedThreadDetails.title}</h3>
              <div style={{ color: "#666", fontSize: 13 }}>
                oleh {selectedThreadDetails.author.name} · {formatDate(selectedThreadDetails.createdAt)}
              </div>
              <div style={{ marginTop: 8 }}>
                <strong>Balasan:</strong>
                {threadLoading ? (
                  <p>Memuat balasan...</p>
                ) : selectedThreadPosts ? (
                  <ol style={{ paddingLeft: 18 }}>
                    {selectedThreadPosts.map((p) => (
                      <li key={String(p.id)} style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 13, color: "#333" }}>{p.content}</div>
                        <div style={{ fontSize: 12, color: "#777" }}>
                          — {p.author.name}, {formatDate(p.createAt)}
                        </div>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p>Tidak ada balasan.</p>
                )}
              </div>

              <div style={{ marginTop: 8 }}>
                <h4>Tulis Balasan</h4>
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  rows={4}
                  style={{ width: "100%", padding: 8 }}
                />
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button
                    onClick={() => selectedThreadId && postReply(selectedThreadId)}
                    disabled={replying}
                    aria-disabled={replying}
                  >
                    {replying ? "Mengirim..." : "Kirim Balasan"}
                  </button>
                  <button
                    onClick={() => {
                      setReplyContent("");
                    }}
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
