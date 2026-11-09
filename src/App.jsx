import { Routes, Route, Navigate } from "react-router-dom";

import Auth from "./pages/Auth.jsx";
import Hub from "./pages/Hub.jsx";
import Chat from "./pages/Chat.jsx";
import Pitch from "./pages/Pitch.jsx";
import Management from "./pages/Management.jsx";
import { getAuthToken } from "./api/chat.js";

// Protected Route wrapper for routes requiring FastAPI auth
function ProtectedRoute({ children }) {
  const token = getAuthToken();
  if (!token) {
    return <Navigate to="/" replace />;
  }
  return children;
}

export default function App() {
  const isAuthenticated = Boolean(getAuthToken());

  return (
    <Routes>
      {/* Root Route: Auth if not logged in, Hub if logged in */}
      <Route
        path="/"
        element={isAuthenticated ? <Hub /> : <Auth />}
      />

      <Route path="/auth" element={<Auth />} />

      <Route
        path="/hub"
        element={
          <ProtectedRoute>
            <Hub />
          </ProtectedRoute>
        }
      />

      {/* Option 1: Personalized Chat */}
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <Chat />
          </ProtectedRoute>
        }
      />

      {/* Option 2: Pitch Report Chat */}
      <Route
        path="/pitch"
        element={
          <ProtectedRoute>
            <Pitch />
          </ProtectedRoute>
        }
      />

      {/* Option 3: EMS (Employee Management System) */}
      <Route
        path="/manage"
        element={
          <ProtectedRoute>
            <Management />
          </ProtectedRoute>
        }
      />

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
