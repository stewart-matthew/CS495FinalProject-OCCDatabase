import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function ChurchPage() {
  const { churchName } = useParams();
  const [church, setChurch] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getChurch() {
      const { data, error } = await supabase
        .from("church")
        .select("church_name, physical_city, physical_state, phone_number")
        .eq("church_name", churchName)
        .single();
      if (error) {
        console.error(error);
      } else {
        setChurch(data);
      }
      setLoading(false);
    }

    getChurch();
  }, [churchName]);

  if (loading) return <p>Loading...</p>;
  if (!church) return <p>Church not found.</p>;

  return (
    <div className="max-w-3xl mx-auto mt-10 bg-white rounded-lg shadow-md p-6">
      <h1 className="text-2xl font-bold mb-4">{church.church_name}</h1>
      <p className="text-gray-700 mb-2">
        <strong>City:</strong> {church.physical_city}
      </p>
      <p className="text-gray-700 mb-2">
        <strong>State:</strong> {church.physical_state}
      </p>
      <p className="text-gray-700 mb-2">
        <strong>Phone:</strong> {church.phone_number}
      </p>

      <button
        className="mt-4 bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
        onClick={() => window.history.back()}
      >
        Back
      </button>
    </div>
  );
}
