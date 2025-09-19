import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/navbar.jsx";

// Pages
import Home from "./pages/home.jsx";
import About from "./pages/about.jsx";
import Database from "./pages/database.jsx";
import TestCard from "./pages/database.jsx";
import Profile from "./pages/profile.jsx";
import Login from "./pages/login.jsx";

function App() {
  return (
    <Router>
      {/* Navbar will show on all pages */}
      <Navbar />

      {/* Page content */}
      <div className="p-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/database" element={<Database />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
