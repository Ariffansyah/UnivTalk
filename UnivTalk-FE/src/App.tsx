import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import SignUpPage from "./pages/SignUpPage";
import SignInPage from "./pages/SignInPage";
import ForumList from "./pages/ForumList";
import ForumDetail from "./pages/ForumDetail";
import PostDetail from "./pages/PostDetail";
import ProfilePage from "./pages/ProfilePage";
import CreateForumPage from "./pages/CreateForumPage";
import NotFound from "./pages/NotFound";
import { ErrorBoundary } from "./components/ErrorBoundry";

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="*" element={<NotFound />} />
          <Route path="/" element={<LandingPage />} />
          <Route path="/forums" element={<ForumList />} />
          <Route path="/forums/:forumId" element={<ForumDetail />} />
          <Route path="/forums/new" element={<CreateForumPage />} />
          <Route path="/posts/:postId" element={<PostDetail />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/signin" element={<SignInPage />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
