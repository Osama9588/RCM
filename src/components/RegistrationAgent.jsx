import React, { useState } from "react";
import { useRCM } from "../context/RCMContext";
import { analyzeImageWithGroq } from "../utils/groqClient";

const RegistrationAgent = () => {
  const { insuranceData, setCurrentPatient, addPatient, setActiveStep } = useRCM();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [manualMode, setManualMode] = useState(false);
  const [manualId, setManualId] = useState("");

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setResult(null);
    setError(null);
  };

  const toBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const findPatientById = (id) => {
    if (!id) return null;
    const cleaned = id.trim().toUpperCase();
    return insuranceData.find(
      (row) => row["insurance_id"]?.trim().toUpperCase() === cleaned
    );
  };

  const fuzzyMatch = (extractedId) => {
    if (!extractedId) return null;
    const cleaned = extractedId.trim().toUpperCase();
    let bestMatch = null;
    let bestScore = 0;

    insuranceData.forEach((row) => {
      const dbId = row["insurance_id"]?.trim().toUpperCase() || "";
      let matches = 0;
      const minLen = Math.min(cleaned.length, dbId.length);
      for (let i = 0; i < minLen; i++) {
        if (cleaned[i] === dbId[i]) matches++;
      }
      const score = matches / Math.max(cleaned.length, dbId.length);
      if (score > bestScore && score >= 0.8) {
        bestScore = score;
        bestMatch = row;
      }
    });

    return bestMatch;
  };

  const handleProcess = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const base64 = await toBase64(file);

      const prompt = `You are a Medical Data Parser. Look at this patient registration form image and extract the following fields.
OCR often confuses '0' with 'O' and '7' with 'Z' so account for that.
Return ONLY a raw JSON object with no markdown, no explanation, no backticks. Just the JSON.
Format:
{
  "Patient": {
    "Name": "",
    "Age": "",
    "Gender": "",
    "BloodType": "",
    "MedicalCondition": ""
  },
  "Insurance": {
    "Provider": "",
    "ID": ""
  }
}`;

      const parsed = await analyzeImageWithGroq(base64, file.type, prompt);

      const extractedId = parsed?.Insurance?.ID || "";
      let matchedRecord = findPatientById(extractedId) || fuzzyMatch(extractedId);

      if (matchedRecord) {
        const patientData = {
          name: matchedRecord["Name"],
          age: matchedRecord["Age"],
          gender: matchedRecord["Gender"],
          bloodType: matchedRecord["Blood Type"],
          condition: matchedRecord["Medical Condition"],
          insuranceId: matchedRecord["insurance_id"],
          provider: matchedRecord["Insurance Provider"],
          billingAmount: matchedRecord["Billing Amount"],
          accessGranted: true,
          verificationStatus: "Verified",
          timestamp: new Date().toLocaleString(),
        };
        setResult({ ...patientData, raw: parsed });
        setCurrentPatient(patientData);
        addPatient(patientData);
      } else {
        setResult({
          accessGranted: false,
          verificationStatus: "Not Found",
          extractedId,
          raw: parsed,
        });
      }
    } catch (err) {
      console.error("Agent Error:", err);
      setError("Failed to process image. Please try again or use manual entry.");
    } finally {
      setLoading(false);
    }
  };

  const handleManualLookup = () => {
    const record = findPatientById(manualId);
    if (record) {
      const patientData = {
        name: record["Name"],
        age: record["Age"],
        gender: record["Gender"],
        bloodType: record["Blood Type"],
        condition: record["Medical Condition"],
        insuranceId: record["insurance_id"],
        provider: record["Insurance Provider"],
        billingAmount: record["Billing Amount"],
        accessGranted: true,
        verificationStatus: "Verified (Manual)",
        timestamp: new Date().toLocaleString(),
      };
      setResult({ ...patientData });
      setCurrentPatient(patientData);
      addPatient(patientData);
      setError(null);
    } else {
      setError("Insurance ID not found in database.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-700">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-2xl">🔍</span>
          <h2 className="text-xl font-bold text-white">Agent 1 — Registration</h2>
        </div>
        <p className="text-gray-400 text-sm ml-11">
          Upload the patient registration form. The AI will extract and verify their identity against the insurance database.
        </p>
      </div>

      {/* Upload + Manual Toggle */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Upload Card */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-700 space-y-4">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-widest">
            Upload Registration Form
          </h3>

          <label className="block w-full cursor-pointer">
            <div className="border-2 border-dashed border-gray-600 hover:border-blue-500 rounded-xl p-6 text-center transition-all">
              {preview ? (
                <img
                  src={preview}
                  alt="Preview"
                  className="max-h-48 mx-auto rounded-lg object-contain"
                />
              ) : (
                <>
                  <div className="text-4xl mb-2">📄</div>
                  <p className="text-sm text-gray-400">
                    Click to upload or drag & drop
                  </p>
                  <p className="text-xs text-gray-600 mt-1">PNG, JPG supported</p>
                </>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>

          {file && (
            <button
              onClick={handleProcess}
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900 disabled:text-blue-400 rounded-xl font-semibold text-sm transition-all"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⚙️</span> Processing...
                </span>
              ) : (
                "🚀 Run Registration Agent"
              )}
            </button>
          )}
        </div>

        {/* Manual Entry */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-700 space-y-4">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-widest">
            Manual ID Lookup
          </h3>
          <p className="text-xs text-gray-500">
            If OCR fails, enter the Insurance ID manually to look up the patient directly from the database.
          </p>
          <input
            type="text"
            placeholder="Enter Insurance ID (e.g. INS-001)"
            value={manualId}
            onChange={(e) => setManualId(e.target.value)}
            className="w-full bg-gray-800 text-white text-sm px-4 py-3 rounded-xl border border-gray-600 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={handleManualLookup}
            disabled={!manualId}
            className="w-full py-3 bg-purple-700 hover:bg-purple-600 disabled:bg-gray-800 disabled:text-gray-500 rounded-xl font-semibold text-sm transition-all"
          >
            🔎 Lookup Patient
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 text-red-300 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div
          className={`rounded-2xl p-6 border space-y-4 ${
            result.accessGranted
              ? "bg-green-900/20 border-green-700"
              : "bg-red-900/20 border-red-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg">
              {result.accessGranted ? "✅ Patient Verified" : "❌ Verification Failed"}
            </h3>
            <span
              className={`text-xs px-3 py-1 rounded-full font-semibold ${
                result.accessGranted
                  ? "bg-green-800 text-green-300"
                  : "bg-red-800 text-red-300"
              }`}
            >
              {result.verificationStatus}
            </span>
          </div>

          {result.accessGranted ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { label: "Name", value: result.name },
                  { label: "Age", value: result.age },
                  { label: "Gender", value: result.gender },
                  { label: "Blood Type", value: result.bloodType },
                  { label: "Insurance ID", value: result.insuranceId },
                  { label: "Provider", value: result.provider },
                  { label: "Condition", value: result.condition },
                  {
                    label: "Billing Amount",
                    value: `$${parseFloat(result.billingAmount || 0).toLocaleString()}`,
                  },
                ].map((item) => (
                  <div key={item.label} className="bg-gray-800 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-1">{item.label}</p>
                    <p className="text-sm font-semibold text-white">{item.value || "—"}</p>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setActiveStep(2)}
                className="w-full py-3 bg-green-600 hover:bg-green-500 rounded-xl font-bold text-sm transition-all"
              >
                ➡️ Proceed to Medical Coding
              </button>
            </>
          ) : (
            <div className="text-sm text-red-300 space-y-1">
              <p>Extracted ID: <span className="font-mono">{result.extractedId}</span></p>
              <p>No matching record found in the insurance database.</p>
              <p className="text-gray-400">Try manual lookup or upload a clearer image.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RegistrationAgent;