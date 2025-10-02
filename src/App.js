import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/navbar";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/home";
import About from "./pages/about";
import ChurchPage from "./pages/church";
import Profile from "./pages/profile";
import Login from "./pages/login";
import EditProfile from "./pages/editProfile";
import TeamMembers from "./pages/teamMembers";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        {/* Navbar is always shown, reacts to login/logout */}
        <Navbar />

        <Routes>
          {/* Public route */}
          <Route path="/login" element={<Login />} />

          {/* All other routes are protected */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/home" element={<Home />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/church/:churchName" element={<ChurchPage />} />
                  <Route path="/profile" element={<Profile />} />

                  {/* Redirect unknown paths to home */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                  <Route path="/editProfile" element={
                      <ProtectedRoute>
                        <EditProfile />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/team-members"
                    element={
                      <ProtectedRoute>
                        <TeamMembers />
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
