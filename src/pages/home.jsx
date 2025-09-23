import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const [churches, setChurches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    churchName: "",
    zipcode: "",
    shoebox_2025: "",
    sortBy: "",
  });
  const navigate = useNavigate();

  // Fetch churches with optional filters
  async function getChurches(filterValues = filters) {
    setLoading(true);

    let query = supabase.from("church").select("*"); // select all columns

    // Apply filters
    if (filterValues.churchName) {
      query = query.ilike("church_name", `%${filterValues.churchName}%`); // partial match
    }
    if (filterValues.zipcode) {
      query = query.eq("physical_zip", filterValues.zipcode);
    }
    if (filterValues.shoebox_2025) {
      query = query.gte("shoebox_2025", filterValues.shoebox_2025); // AT LEAST
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching churches:", error);
      setChurches([]);
    } else {
      let sortedData = [...data];

      // Apply sort
      if (filterValues.sortBy === "shoebox_desc") {
        sortedData.sort((a, b) => (b.shoebox_2025 || 0) - (a.shoebox_2025 || 0));
      } else if (filterValues.sortBy === "name_asc") {
        sortedData.sort((a, b) => a.church_name.localeCompare(b.church_name));
      } else if (filterValues.sortBy === "name_desc") {
        sortedData.sort((a, b) => b.church_name.localeCompare(a.church_name));
      }

      setChurches(sortedData);
    }

    setLoading(false);
  }

  // Load all churches initially
  useEffect(() => {
    getChurches();
  }, []);

  if (loading) return <p>Loading...</p>;
  if (churches.length === 0) return <p>No churches found.</p>;

  return (
    <div className="max-w-6xl mx-auto mt-10">
      {/* Filter Section */}
      <div className="mb-6 bg-gray-100 p-4 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold mb-3">Filter Churches</h2>
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="Search by church name"
            value={filters.churchName}
            onChange={(e) =>
              setFilters({ ...filters, churchName: e.target.value })
            }
            className="border p-2 rounded w-full md:w-1/3"
          />
          <input
            type="text"
            placeholder="Filter by zipcode"
            value={filters.zipcode}
            onChange={(e) =>
              setFilters({ ...filters, zipcode: e.target.value })
            }
            className="border p-2 rounded w-full md:w-1/3"
          />
          <input
            type="number"
            placeholder="Minimum shoebox 2025"
            value={filters.shoebox_2025}
            onChange={(e) =>
              setFilters({ ...filters, shoebox_2025: e.target.value })
            }
            className="border p-2 rounded w-full md:w-1/3"
          />
        </div>

        {/* Buttons + Sort */}
        <div className="mt-4 flex flex-col md:flex-row md:items-center gap-4">
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            onClick={() => getChurches()} // uses current filters
          >
            Apply Filters
          </button>

          <button
            className="bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400"
            onClick={() => {
              const clearedFilters = {
                churchName: "",
                zipcode: "",
                shoebox_2025: "",
                sortBy: "",
              };
              setFilters(clearedFilters);
              getChurches(clearedFilters); // apply cleared filters immediately
            }}
          >
            Clear Filters
          </button>

          {/* Sort Dropdown */}
          <div className="ml-auto">
            <label className="mr-2 font-medium">Sort by:</label>
            <select
              value={filters.sortBy || ""}
              onChange={(e) => {
                const sortBy = e.target.value;
                const newFilters = { ...filters, sortBy };
                setFilters(newFilters);
                getChurches(newFilters); // apply sort immediately
              }}
              className="border p-2 rounded"
            >
              <option value="">Select...</option>
              <option value="shoebox_desc">Shoebox Count (High → Low)</option>
              <option value="name_asc">Name (A → Z)</option>
              <option value="name_desc">Name (Z → A)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Church Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
              {church.shoebox_2025 !== undefined && (
                <p className="text-gray-700">
                  <strong>Shoebox 2025:</strong> {church.shoebox_2025}
                </p>
              )}
              {church.physical_zip && (
                <p className="text-gray-700">
                  <strong>Zip Code:</strong> {church.physical_zip}
                </p>
              )}
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
    </div>
  );
}
