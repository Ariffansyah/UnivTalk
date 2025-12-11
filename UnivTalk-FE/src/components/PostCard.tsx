import React from "react";

type Post = {
  id: number | string;
  title: string;
  body?: string;
  author?: string;
  votes?: number;
  created_at?: string;
};

type Props = {
  post: Post;
  onVote?: (delta: number) => void;
};

const PostCard: React.FC<Props> = ({ post, onVote }) => {
  return (
    <div className="bg-white p-4 rounded shadow flex gap-4">
      <div className="w-12 flex flex-col items-center text-sm">
        <button onClick={() => onVote && onVote(1)} className="text-gray-500 hover:text-green-600" aria-label="upvote">▲</button>
        <div className="font-bold">{post.votes ?? 0}</div>
        <button onClick={() => onVote && onVote(-1)} className="text-gray-500 hover:text-red-600" aria-label="downvote">▼</button>
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">{post.title}</h3>
          <div className="text-xs text-gray-400">{post.created_at ? new Date(post.created_at).toLocaleString() : ""}</div>
        </div>
        {post.body && <p className="text-gray-700 mt-2">{post.body}</p>}
        <div className="text-sm text-gray-500 mt-3">by {post.author ?? "unknown"}</div>
      </div>
    </div>
  );
};

export default PostCard;