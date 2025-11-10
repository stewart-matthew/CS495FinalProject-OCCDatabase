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
import AddMember from "./pages/addMember";
import EditMember from "./pages/editMember";
import AddChurch from "./pages/addChurch";
import EditChurch from "./pages/editChurch";
import TeamMember from "./pages/teamMember";
import Individuals from "./pages/individuals";

function App() {
  return (
    <Router>
      {/* min-h-screen ensures background color spans the viewport */}
      <div className="min-h-screen bg-gray-100">

        {/* Navbar is fixed, so we need top padding for content */}
        <Navbar />

        {/* Add top padding equal to navbar height */}
        <div className="pt-20">
          <Routes>
            {/* Public route */}
            <Route path="/login" element={<Login />} />

            {/* Protected routes */}
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
                    <Route path="/editProfile" element={<EditProfile />} />
                    <Route path="/team-members" element={<TeamMembers />} />
                    <Route path="/team-member/:id" element={<TeamMember />} />
                    <Route path="/individuals" element={<Individuals />} />

                    {/* Add/Edit routes */}
                    <Route path="/add-member" element={<AddMember />} />
                    <Route path="/edit-member/:id" element={<EditMember />} />
                    <Route path="/add-church" element={<AddChurch />} />
                    <Route path="/edit-church/:churchName" element={<EditChurch />} />

                    {/* Redirect unknown paths */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
