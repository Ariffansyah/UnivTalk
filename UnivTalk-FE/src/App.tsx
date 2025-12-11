import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SignUpPage from "./pages/SignUpPage";
import SignInPage from "./pages/SignInPage";
import NotFound from "./pages/NotFound";
import { ErrorBoundary } from "./components/ErrorBoundry";
import HomePage from "./pages/HomePage";

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="*" element={<NotFound />} />
<<<<<<< HEAD
          <Route path="/" element={<LandingPage />} />
          <Route path="/home" element={<HomePage />} />
=======
          <Route path="/" element={<SignInPage />} />
>>>>>>> 1ad313555744c197f19b7a04134339de4f496da0
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/home" element={<HomePage />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;