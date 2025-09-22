import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const [churches, setChurches] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function getChurches() {
      const { data, error } = await supabase
        .from("church")
        .select("church_name, physical_city, physical_state");
      console.log("Supabase data:", data, "Error:", error);
      if (error) {
        console.error(error);
      } else {
        setChurches(data);
      }
      setLoading(false);
    }

    getChurches();
  }, []);

  if (loading) return <p>Loading...</p>;
  if (churches.length === 0) return <p>No churches found.</p>;

  return (
    <div className="max-w-6xl mx-auto mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {churches.map((church) => (
        <div
          key={church.church_name}
          className="bg-white shadow-md rounded-lg p-6 flex flex-col justify-between"
        >
          <div>
            <h2 className="text-xl font-bold mb-2">{church.church_name}</h2>
            <p className="text-gray-700">
              {church.physical_city}, {church.physical_state}
            </p>
          </div>
          <button
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            onClick={() =>
              navigate(`/church/${encodeURIComponent(church.church_name)}`)
            }
          >
            Go to page
          </button>
        </div>
      ))}
    </div>
  );
}
