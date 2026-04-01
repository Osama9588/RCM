import React, { useState } from "react";
import { useRCM } from "../context/RCMContext";

const ClaimsHistory = ({ onClose }) => {
  const { claims, patients } = useRCM();
  const [activeTab, setActiveTab] = useState("claims");
  const [selectedClaim, setSelectedClaim] = useState(null);

  const approved = claims.filter((c) => c.status === "Approved");
  const denied = claims.filter((c) => c.status === "Denied");

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📋</span>
          <div>
            <h2 className="text-xl font-bold text-white">Claims History</h2>
            <p className="text-gray-400 text-sm mt-0.5">
              All processed claims and registered patients
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-sm px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-xl transition-all"
        >
          ✕ Close
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Total Claims",
            value: claims.length,
            color: "text-blue-400",
            bg: "bg-blue-900/20 border-blue-800",
            icon: "📊",
          },
          {
            label: "Approved",
            value: approved.length,
            color: "text-green-400",
            bg: "bg-green-900/20 border-green-800",
            icon: "✅",
          },
          {
            label: "Denied",
            value: denied.length,
            color: "text-red-400",
            bg: "bg-red-900/20 border-red-800",
            icon: "❌",
          },
          {
            label: "Patients Registered",
            value: patients.length,
            color: "text-purple-400",
            bg: "bg-purple-900/20 border-purple-800",
            icon: "👥",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`rounded-2xl p-5 border ${stat.bg} flex items-center gap-4`}
          >
            <span className="text-3xl">{stat.icon}</span>
            <div>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-gray-900 p-1.5 rounded-xl border border-gray-700 w-fit">
        {[
          { key: "claims", label: "📊 All Claims" },
          { key: "approved", label: "✅ Approved" },
          { key: "denied", label: "❌ Denied" },
          { key: "patients", label: "👥 Patients" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key
                ? "bg-blue-600 text-white"
                : "text-gray-400 hover:text-white hover:bg-gray-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Claims Table */}
      {activeTab !== "patients" && (
        <div className="bg-gray-900 rounded-2xl border border-gray-700 overflow-hidden">
          {(activeTab === "claims"
            ? claims
            : activeTab === "approved"
            ? approved
            : denied
          ).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <span className="text-4xl mb-3">🗂️</span>
              <p className="text-sm">No claims found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700 bg-gray-800">
                    {[
                      "Patient",
                      "Provider",
                      "Condition",
                      "ICD-10",
                      "CPT",
                      "Total",
                      "Insurance Pays",
                      "Patient Owes",
                      "Status",
                      "Date",
                      "",
                    ].map((col) => (
                      <th
                        key={col}
                        className="text-left text-xs text-gray-400 uppercase tracking-wider px-4 py-3 font-semibold"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {(activeTab === "claims"
                    ? claims
                    : activeTab === "approved"
                    ? approved
                    : denied
                  ).map((claim, index) => (
                    <tr
                      key={claim.id}
                      className="hover:bg-gray-800 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-white whitespace-nowrap">
                        {claim.summary?.patient_name || "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-300 whitespace-nowrap">
                        {claim.summary?.provider || "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-300 whitespace-nowrap">
                        {claim.summary?.condition || "—"}
                      </td>
                      <td className="px-4 py-3 font-mono text-blue-300 whitespace-nowrap">
                        {claim.summary?.icd_10 || "—"}
                      </td>
                      <td className="px-4 py-3 font-mono text-purple-300 whitespace-nowrap">
                        {claim.summary?.cpt_code || "—"}
                      </td>
                      <td className="px-4 py-3 font-mono text-white whitespace-nowrap">
                        ${claim.financials?.total_charge?.toLocaleString() || "—"}
                      </td>
                      <td className="px-4 py-3 font-mono text-green-400 whitespace-nowrap">
                        ${claim.financials?.insurance_payment?.toFixed(2) || "—"}
                      </td>
                      <td className="px-4 py-3 font-mono text-yellow-400 whitespace-nowrap">
                        ${claim.financials?.patient_balance?.toFixed(2) || "—"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            claim.status === "Approved"
                              ? "bg-green-900 text-green-300"
                              : "bg-red-900 text-red-300"
                          }`}
                        >
                          {claim.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                        {claim.timestamp}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() =>
                            setSelectedClaim(
                              selectedClaim?.id === claim.id ? null : claim
                            )
                          }
                          className="text-xs text-blue-400 hover:text-blue-300 underline"
                        >
                          {selectedClaim?.id === claim.id ? "Hide" : "Details"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Expanded Claim Detail */}
      {selectedClaim && (
        <div className="bg-gray-900 rounded-2xl border border-blue-700 p-6 space-y-4">
          <h3 className="font-bold text-white text-lg">
            🔎 Claim Detail — {selectedClaim.summary?.patient_name}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Insurance ID", value: selectedClaim.summary?.insurance_id },
              { label: "Provider", value: selectedClaim.summary?.provider },
              { label: "Condition", value: selectedClaim.summary?.condition },
              { label: "ICD-10", value: selectedClaim.summary?.icd_10 },
              { label: "CPT Code", value: selectedClaim.summary?.cpt_code },
              { label: "Admission Type", value: selectedClaim.summary?.admission_type },
              { label: "Total Charge", value: `$${selectedClaim.financials?.total_charge?.toLocaleString()}` },
              {
                label: "Coverage Rate",
                value: `${((selectedClaim.financials?.coverage_rate || 0) * 100).toFixed(0)}%`,
              },
              {
                label: "Insurance Pays",
                value: `$${selectedClaim.financials?.insurance_payment?.toFixed(2)}`,
              },
              {
                label: "Patient Owes",
                value: `$${selectedClaim.financials?.patient_balance?.toFixed(2)}`,
              },
              { label: "Status", value: selectedClaim.status },
              { label: "Processed At", value: selectedClaim.timestamp },
            ].map((item) => (
              <div key={item.label} className="bg-gray-800 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-1">{item.label}</p>
                <p className="text-sm font-semibold text-white font-mono">
                  {item.value || "—"}
                </p>
              </div>
            ))}
          </div>

          {/* Coverage Bar */}
          <div className="bg-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-3">Coverage Breakdown</p>
            <div className="flex rounded-full overflow-hidden h-4">
              <div
                className="bg-green-500"
                style={{
                  width: `${(selectedClaim.financials?.coverage_rate || 0) * 100}%`,
                }}
              />
              <div
                className="bg-yellow-500"
                style={{
                  width: `${(1 - (selectedClaim.financials?.coverage_rate || 0)) * 100}%`,
                }}
              />
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-xs text-green-400">
                Insurance ({((selectedClaim.financials?.coverage_rate || 0) * 100).toFixed(0)}%)
              </span>
              <span className="text-xs text-yellow-400">
                Patient ({((1 - (selectedClaim.financials?.coverage_rate || 0)) * 100).toFixed(0)}%)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Patients Table */}
      {activeTab === "patients" && (
        <div className="bg-gray-900 rounded-2xl border border-gray-700 overflow-hidden">
          {patients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <span className="text-4xl mb-3">👥</span>
              <p className="text-sm">No patients registered yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700 bg-gray-800">
                    {[
                      "Name",
                      "Age",
                      "Gender",
                      "Blood Type",
                      "Condition",
                      "Insurance ID",
                      "Provider",
                      "Billing Amount",
                      "Registered At",
                    ].map((col) => (
                      <th
                        key={col}
                        className="text-left text-xs text-gray-400 uppercase tracking-wider px-4 py-3 font-semibold"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {patients.map((p, index) => (
                    <tr key={index} className="hover:bg-gray-800 transition-colors">
                      <td className="px-4 py-3 font-medium text-white whitespace-nowrap">
                        {p.name || "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-300">{p.age || "—"}</td>
                      <td className="px-4 py-3 text-gray-300">{p.gender || "—"}</td>
                      <td className="px-4 py-3 text-gray-300">{p.bloodType || "—"}</td>
                      <td className="px-4 py-3 text-gray-300 whitespace-nowrap">
                        {p.condition || "—"}
                      </td>
                      <td className="px-4 py-3 font-mono text-blue-300 whitespace-nowrap">
                        {p.insuranceId || "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-300 whitespace-nowrap">
                        {p.provider || "—"}
                      </td>
                      <td className="px-4 py-3 font-mono text-green-400 whitespace-nowrap">
                        ${parseFloat(p.billingAmount || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                        {p.timestamp || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ClaimsHistory;