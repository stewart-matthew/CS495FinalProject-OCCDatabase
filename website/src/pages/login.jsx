export default function Login() {
  return (
    <div className="max-w-md mx-auto mt-10 p-6 border rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Login</h1>
      <input className="w-full p-2 border mb-4 rounded" type="text" placeholder="Username" />
      <input className="w-full p-2 border mb-4 rounded" type="password" placeholder="Password" />
      <button className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600">Login</button>
    </div>
  );
}
