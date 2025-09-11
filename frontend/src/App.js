import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/navbar.jsx";

// Pages
import Home from "./pages/home";
import About from "./pages/about";
import Database from "./pages/database";
import Profile from "./pages/profile";
import Login from "./pages/login";

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
