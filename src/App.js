import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/navbar.jsx";

// Pages
import Home from "./pages/home.jsx";
import About from "./pages/about.jsx";
import Database from "./pages/database.jsx";
import Profile from "./pages/profile.jsx";
import Login from "./pages/login.jsx";
import Church from "./pages/church.jsx";

function App() {
  return (
    <Router>
      <Navbar />
      <div className="p-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/database" element={<Database />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/login" element={<Login />} />
          <Route path="/church/:churchName" element={<Church />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
