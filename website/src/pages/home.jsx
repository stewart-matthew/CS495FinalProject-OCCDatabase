import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const [churches, setChurches] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    async function getChurches() {
      const { data, error } = await supabase
        .from("individuals")
        .select("church_affiliation");

      if (error) {
        console.error(error);
      } else {
        const uniqueChurches = [...new Set(data.map(row => row.church_affiliation))];
        setChurches(uniqueChurches);
      }
    }

    getChurches();
  }, []);

  return (
    <div className="max-w-6xl mx-auto mt-10 p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">Welcome to OCC Database</h1>
      <p className="text-gray-600 text-center mb-10">
        Explore churches and their members.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {churches.map((church, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
          >
            <div className="bg-gray-100 h-32 flex items-center justify-center">
              <span className="text-2xl font-bold text-gray-700">{church}</span>
            </div>
            <div className="p-4">
              <p className="text-gray-600 text-sm mb-4">
                Learn more about {church}.
              </p>
              <button
                onClick={() => navigate(`/church/${church}`)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Go to page
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
