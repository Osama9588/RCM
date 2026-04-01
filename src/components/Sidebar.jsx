import React, { useEffect, useState } from "react";
import { useRCM } from "../context/RCMContext";
import { parseCSVFromUrl } from "../utils/csvparser";

const Sidebar = () => {
  const { insuranceData, setInsuranceData } = useRCM();
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    parseCSVFromUrl("/insurance_data.csv")
      .then((data) => {
        setInsuranceData(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [setInsuranceData]);

  const filtered = insuranceData.filter(
    (row) =>
      row["insurance_id"]?.toLowerCase().includes(search.toLowerCase()) ||
      row["Name"]?.toLowerCase().includes(search.toLowerCase()) ||
      row["Insurance Provider"]?.toLowerCase().includes(search.toLowerCase())
  );

  if (collapsed) {
    return (
      <div className="h-screen w-10 bg-gray-900 flex flex-col items-center pt-4">
        <button
          onClick={() => setCollapsed(false)}
          className="text-white text-xs rotate-90 mt-4 whitespace-nowrap"
        >
          ▶ DB
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen w-80 bg-gray-900 text-white flex flex-col border-r border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-700">
        <div>
          <h2 className="text-sm font-bold text-blue-400 uppercase tracking-widest">
            Insurance DB
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {insuranceData.length} records loaded
          </p>
        </div>
        <button
          onClick={() => setCollapsed(true)}
          className="text-gray-400 hover:text-white text-lg"
        >
          ◀
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-3 border-b border-gray-700">
        <input
          type="text"
          placeholder="Search by name, ID, provider..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-gray-800 text-sm text-white placeholder-gray-500 px-3 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <p className="text-gray-400 text-sm animate-pulse">
              Loading database...
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center h-40">
            <p className="text-gray-500 text-sm">No records found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {filtered.map((row, index) => (
              <div
                key={index}
                className="px-4 py-3 hover:bg-gray-800 transition-colors cursor-default"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-white truncate max-w-[140px]">
                    {row["Name"] || "Unknown"}
                  </span>
                  <span className="text-xs bg-blue-900 text-blue-300 px-2 py-0.5 rounded-full font-mono">
                    {row["insurance_id"] || "N/A"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400 truncate max-w-[120px]">
                    {row["Insurance Provider"] || "—"}
                  </span>
                  <span className="text-xs text-green-400 font-mono">
                    ${parseFloat(row["Billing Amount"] || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex gap-2 mt-1">
                  <span className="text-xs text-gray-500">
                    {row["Age"] ? `Age ${row["Age"]}` : ""}
                  </span>
                  <span className="text-xs text-gray-500">
                    {row["Blood Type"] || ""}
                  </span>
                  <span className="text-xs text-gray-500">
                    {row["Gender"] || ""}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-700 bg-gray-900">
        <p className="text-xs text-gray-500 text-center">
          Showing {filtered.length} of {insuranceData.length} records
        </p>
      </div>
    </div>
  );
};

export default Sidebar;