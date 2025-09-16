import logo from "../assets/OCClogo.png";

function Home() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <img src={logo} alt="Logo" className="w-40 h-40 mb-6" />
      <h1 className="text-3xl font-bold">Homepage</h1>
      <p className="text-gray-600 mt-2">This is the homepage</p>
    </div>
  );
}

export default Home;
