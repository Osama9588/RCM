import React, { useState } from "react";
import { useRCM } from "../context/RCMContext";

const PAYER_CONTRACTS = {
  "Blue Cross": 0.80,
  "Aetna": 0.75,
  "Medicare": 0.90,
  "UnitedHealthcare": 0.70,
  "Cigna": 0.85,
  "Default": 0.50,
};

const AdjudicationAgent = () => {
  const { currentPatient, currentCoding, addClaim, setActiveStep } = useRCM();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleAdjudicate = async () => {
    if (!currentPatient || !currentCoding) return;
    setLoading(true);
    setError(null);

    try {
      await new Promise((res) => setTimeout(res, 1500));

      const provider = currentPatient.provider || "Default";
      const coverageRate =
        PAYER_CONTRACTS[provider] || PAYER_CONTRACTS["Default"];
      const totalBill = parseFloat(currentPatient.billingAmount || 0);
      const insurancePays = totalBill * coverageRate;
      const patientOwes = totalBill - insurancePays;

      const report = {
        status: "Approved",
        summary: {
          patient_name: currentPatient.name,
          insurance_id: currentPatient.insuranceId,
          provider: provider,
          condition: currentCoding.medical_condition,
          icd_10: currentCoding.icd_10,
          cpt_code: currentCoding.cpt_code,
          admission_type: currentCoding.admission_type,
        },
        financials: {
          total_charge: totalBill,
          coverage_rate: coverageRate,
          insurance_payment: insurancePays,
          patient_balance: patientOwes,
        },
        timestamp: new Date().toLocaleString(),
      };

      setResult(report);
      addClaim(report);
    } catch (err) {
      setError("Adjudication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    if (status === "Approved") return "text-green-400";
    if (status === "Denied") return "text-red-400";
    return "text-yellow-400";
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-700">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-2xl">⚖️</span>
          <h2 className="text-xl font-bold text-white">
            Agent 3 — Adjudication
          </h2>
        </div>
        <p className="text-gray-400 text-sm ml-11">
          Final financial settlement. The system calculates insurance coverage
          and patient balance based on payer contracts.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Patient Summary */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-700 space-y-3">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-widest">
            Patient Info
          </h3>
          {currentPatient ? (
            <div className="space-y-2">
              {[
                { label: "Name", value: currentPatient.name },
                { label: "Insurance ID", value: currentPatient.insuranceId },
                { label: "Provider", value: currentPatient.provider },
                { label: "Age", value: currentPatient.age },
                { label: "Gender", value: currentPatient.gender },
                { label: "Blood Type", value: currentPatient.bloodType },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex justify-between items-center text-sm"
                >
                  <span className="text-gray-400">{item.label}</span>
                  <span className="text-white font-medium">
                    {item.value || "—"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No patient data found.</p>
          )}
        </div>

        {/* Coding Summary */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-700 space-y-3">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-widest">
            Coding Summary
          </h3>
          {currentCoding ? (
            <div className="space-y-2">
              {[
                { label: "Condition", value: currentCoding.medical_condition },
                { label: "ICD-10", value: currentCoding.icd_10 },
                { label: "Admission Type", value: currentCoding.admission_type },
                { label: "CPT Code", value: currentCoding.cpt_code },
                { label: "Doctor", value: currentCoding.doctor_name || "—" },
                { label: "Notes", value: currentCoding.notes || "—" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex justify-between items-center text-sm"
                >
                  <span className="text-gray-400">{item.label}</span>
                  <span className="text-white font-mono font-medium">
                    {item.value || "—"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No coding data found.</p>
          )}
        </div>
      </div>

      {/* Payer Contract Reference */}
      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-700">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-widest mb-4">
          Payer Contract Rates
        </h3>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {Object.entries(PAYER_CONTRACTS).map(([payer, rate]) => (
            <div
              key={payer}
              className={`rounded-xl p-3 text-center border transition-all ${
                currentPatient?.provider === payer
                  ? "bg-blue-900/40 border-blue-600"
                  : "bg-gray-800 border-gray-700"
              }`}
            >
              <p className="text-lg font-bold text-white">
                {(rate * 100).toFixed(0)}%
              </p>
              <p className="text-xs text-gray-400 mt-0.5 leading-tight">
                {payer}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Run Button */}
      {!result && (
        <button
          onClick={handleAdjudicate}
          disabled={loading || !currentPatient || !currentCoding}
          className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-500 rounded-xl font-bold text-base transition-all"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin">⚙️</span> Running Adjudication...
            </span>
          ) : (
            "⚖️ Run Adjudication Agent"
          )}
        </button>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 text-red-300 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Final Report */}
      {result && (
        <div className="bg-gray-900 rounded-2xl p-6 border border-green-700 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">
              🚀 Final RCM Settlement Report
            </h3>
            <span
              className={`text-sm font-bold px-4 py-1.5 rounded-full ${
                result.status === "Approved"
                  ? "bg-green-800 text-green-300"
                  : "bg-red-800 text-red-300"
              }`}
            >
              {result.status}
            </span>
          </div>

          {/* Financial Breakdown */}
          <div className="bg-gray-800 rounded-2xl p-5 space-y-4">
            <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-widest">
              Financial Breakdown
            </h4>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Total Charge</span>
                <span className="text-white font-bold text-lg font-mono">
                  ${result.financials.total_charge.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">
                  Insurance Coverage (
                  {(result.financials.coverage_rate * 100).toFixed(0)}%)
                </span>
                <span className="text-green-400 font-bold text-lg font-mono">
                  -${result.financials.insurance_payment.toFixed(2).toLocaleString()}
                </span>
              </div>

              <div className="h-px bg-gray-700" />

              <div className="flex justify-between items-center">
                <span className="text-white font-semibold text-sm">
                  Patient Balance Due
                </span>
                <span className="text-yellow-400 font-bold text-2xl font-mono">
                  ${result.financials.patient_balance.toFixed(2).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Visual Bar */}
            <div className="mt-2">
              <div className="flex rounded-full overflow-hidden h-3">
                <div
                  className="bg-green-500 transition-all"
                  style={{
                    width: `${result.financials.coverage_rate * 100}%`,
                  }}
                />
                <div
                  className="bg-yellow-500 transition-all"
                  style={{
                    width: `${(1 - result.financials.coverage_rate) * 100}%`,
                  }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs text-green-400">
                  Insurance ({(result.financials.coverage_rate * 100).toFixed(0)}%)
                </span>
                <span className="text-xs text-yellow-400">
                  Patient ({((1 - result.financials.coverage_rate) * 100).toFixed(0)}%)
                </span>
              </div>
            </div>
          </div>

          {/* Claim Details */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { label: "Patient", value: result.summary.patient_name },
              { label: "Provider", value: result.summary.provider },
              { label: "Condition", value: result.summary.condition },
              { label: "ICD-10", value: result.summary.icd_10 },
              { label: "CPT Code", value: result.summary.cpt_code },
              { label: "Processed", value: result.timestamp },
            ].map((item) => (
              <div key={item.label} className="bg-gray-800 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-1">{item.label}</p>
                <p className="text-sm font-semibold text-white font-mono">
                  {item.value || "—"}
                </p>
              </div>
            ))}
          </div>

          <button
            onClick={() => setActiveStep(4)}
            className="w-full py-3 bg-green-600 hover:bg-green-500 rounded-xl font-bold text-sm transition-all"
          >
            ✅ Complete & Finalize Claim
          </button>
        </div>
      )}
    </div>
  );
};

export default AdjudicationAgent;