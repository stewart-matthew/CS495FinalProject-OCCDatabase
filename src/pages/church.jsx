import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function ChurchPage() {
  const { churchName } = useParams();
  const [church, setChurch] = useState(null);
  const [individuals, setIndividuals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [individualsLoading, setIndividualsLoading] = useState(true);
  const navigate = useNavigate();
  
  const SHOEBOX_YEAR = 2025; 

  useEffect(() => {
    async function getChurch() {
      const { data, error } = await supabase
        .from("church")
        .select("*")
        .eq("church_name", churchName)
        .single();
      if (error) console.error(error);
      else setChurch(data);
      setLoading(false);
    }
    getChurch();
  }, [churchName]);

  useEffect(() => {
    async function getIndividuals() {
      const { data, error } = await supabase
        .from("individuals")
        .select("*")
        .eq("church_name", churchName);
      if (error) console.error(error);
      else setIndividuals(data);
      setIndividualsLoading(false);
    }
    getIndividuals();
  }, [churchName]);

  const shoeboxFieldName = `shoebox_${SHOEBOX_YEAR}`;

  if (loading) return <p>Loading church...</p>;
  if (!church) return <p>Church not found.</p>;

  return (
    <div className="max-w-4xl mx-auto mt-10">
      <h1 className="text-3xl font-bold mb-4">{church.church_name.replace(/_/g, " ")}</h1>
      <p className="text-gray-700 mb-2">{church.physical_city}, {church.physical_state}</p>
      <p className="text-gray-700 mb-2">{church.physical_county} County</p>
      <p className="text-gray-700 mb-2">Zip: {church.physical_zip}</p>
      {church[shoeboxFieldName] !== undefined && <p className="text-gray-700 mb-2">Shoebox {SHOEBOX_YEAR}: {church[shoeboxFieldName]}</p>}

      <div className="mt-4 flex gap-2">
        <button
          className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
          onClick={() => navigate("/home")}
        >
          Back
        </button>

        <button
          className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
          onClick={() => navigate(`/edit-church/${encodeURIComponent(church.church_name)}`)}
        >
          Edit Church
        </button>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
          onClick={() => navigate(`/edit-shoebox-count/${encodeURIComponent(church.church_name)}`)}
        >
          Edit Shoebox Count
        </button>
      </div>

      <h2 className="text-2xl font-semibold mt-8 mb-4">Individuals</h2>
      {individualsLoading ? (
        <p>Loading individuals...</p>
      ) : individuals.length === 0 ? (
        <p>No individuals found for this church.</p>
      ) : (
        <table className="min-w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-4 py-2">First Name</th>
              <th className="border px-4 py-2">Last Name</th>
              <th className="border px-4 py-2">Role</th>
            </tr>
          </thead>
          <tbody>
            {individuals.map((ind) => (
              <tr key={ind.id} className="hover:bg-gray-50">
                <td className="border px-4 py-2">{ind.first_name}</td>
                <td className="border px-4 py-2">{ind.last_name}</td>
                <td className="border px-4 py-2">{ind.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}