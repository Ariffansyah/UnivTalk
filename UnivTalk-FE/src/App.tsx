import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import { ErrorBoundary } from "./components/ErrorBoundry";

import Layout from "./components/Layout";

import LandingPage from "./pages/LandingPage";
import SignUpPage from "./pages/SignUpPage";
import SignInPage from "./pages/SignInPage";
import ForumList from "./pages/ForumList";
import ForumDetail from "./pages/ForumDetail";
import PostDetail from "./pages/PostDetail";
import ProfilePage from "./pages/ProfilePage";
import CreateForumPage from "./pages/CreateForumPage";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Routes>
            <Route element={<PublicRoute />}>
              <Route path="/signup" element={<SignUpPage />} />
              <Route path="/signin" element={<SignInPage />} />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                {" "}
                <Route path="/" element={<LandingPage />} />
                <Route path="/forums" element={<ForumList />} />
                <Route path="/forums/new" element={<CreateForumPage />} />
                <Route path="/forums/:forumId" element={<ForumDetail />} />
                <Route path="/posts/:postId" element={<PostDetail />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/profile/:userId" element={<ProfilePage />} />
              </Route>
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
