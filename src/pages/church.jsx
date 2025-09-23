import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function ChurchPage() {
  const { churchName } = useParams();
  const decodedChurchName = decodeURIComponent(churchName); // handle URL encoding
  const [church, setChurch] = useState(null);
  const [individuals, setIndividuals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [individualsLoading, setIndividualsLoading] = useState(true);

  useEffect(() => {
    async function getChurch() {
      const { data, error } = await supabase
        .from("church")
        .select("church_name, physical_city, physical_state, phone_number, physical_zip, shoebox_2025")
        .eq("church_name", decodedChurchName)
        .single();
      if (error) {
        console.error(error);
      } else {
        setChurch(data);
      }
      setLoading(false);
    }

    getChurch();
  }, [decodedChurchName]);

  useEffect(() => {
    async function getIndividuals() {
      const { data, error } = await supabase
        .from("individuals")
        .select("full_name, phone_number, position, church_affiliation")
        .eq("church_affiliation", decodedChurchName);
      if (error) {
        console.error(error);
      } else {
        setIndividuals(data);
      }
      setIndividualsLoading(false);
    }

    getIndividuals();
  }, [decodedChurchName]);

  if (loading) return <p>Loading church info...</p>;
  if (!church) return <p>Church not found.</p>;

  return (
    <div className="max-w-3xl mx-auto mt-10 bg-white rounded-lg shadow-md p-6">
      <h1 className="text-2xl font-bold mb-4">
        {church.church_name.replace(/_/g, " ")}
      </h1>
      <p className="text-gray-700 mb-2">
        <strong>City:</strong> {church.physical_city}
      </p>
      <p className="text-gray-700 mb-2">
        <strong>State:</strong> {church.physical_state}
      </p>
      <p className="text-gray-700 mb-2">
        <strong>Phone:</strong> {church.phone_number}
      </p>
      {church.physical_zip && (
        <p className="text-gray-700 mb-2">
          <strong>Zip Code:</strong> {church.physical_zip}
        </p>
      )}
      {church.shoebox_2025 && (
        <p className="text-gray-700 mb-2">
          <strong>Shoebox 2025:</strong> {church.shoebox_2025}
        </p>
      )}

      <h2 className="text-xl font-semibold mt-6 mb-2">Individuals</h2>
      {individualsLoading ? (
        <p>Loading individuals...</p>
      ) : individuals.length === 0 ? (
        <p>No individuals found.</p>
      ) : (
        <ul className="list-disc pl-5">
          {individuals.map((person) => (
            <li key={person.full_name + person.phone_number}>
              <span className="font-medium">{person.full_name}</span>
              {person.position && (
                <span className="text-gray-600"> — {person.position}</span>
              )}
              {person.phone_number && (
                <span className="text-gray-500"> ({person.phone_number})</span>
              )}
            </li>
          ))}
        </ul>
      )}

      <button
        className="mt-4 bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
        onClick={() => window.history.back()}
      >
        Back
      </button>
    </div>
  );
}
