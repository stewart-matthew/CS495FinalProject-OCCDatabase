import { Link } from "react-router-dom";
import logo from "../assets/OCClogo.png"; 

export default function Navbar() {
  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-gray-800 text-white shadow-md">
      {/*Operation Christmas Child*/}
      <div className="flex items-center">
        <img src={logo} alt="App Logo" className="h-10 w-auto mr-3" />
        <span className="text-2xl font-bold">Operation Christmas Child</span>
      </div>

      {/* Navigation Links */}
      <div className="flex space-x-6">
        <Link to="/" className="hover:text-gray-300">Home</Link>
        <Link to="/about" className="hover:text-gray-300">About</Link>
        <Link to="/profile" className="hover:text-gray-300">Profile</Link>
        <Link to="/login" className="hover:text-gray-300">Login</Link>
      </div>
    </nav>
  );
}
