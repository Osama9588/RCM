import React, { useState } from "react";
import { useRCM } from "../context/RCMContext";
import { analyzeImageWithGroq } from "../utils/groqClient";

const ICD_MAP = {
  cancer: { icd: "C80.1", label: "Cancer" },
  diabetes: { icd: "E11.9", label: "Diabetes" },
  arthritis: { icd: "M19.90", label: "Arthritis" },
  asthma: { icd: "J45.909", label: "Asthma" },
  obesity: { icd: "E66.9", label: "Obesity" },
  hypertension: { icd: "I10", label: "Hypertension" },
};

const CPT_MAP = {
  urgent: { cpt: "99214", label: "Urgent Visit" },
  emergency: { cpt: "99284", label: "Emergency Visit" },
  elective: { cpt: "99213", label: "Elective Visit" },
};

const CodingAgent = () => {
  const { currentPatient, setCurrentCoding, setActiveStep } = useRCM();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

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

  const handleProcess = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const base64 = await toBase64(file);

      const prompt = `You are a Certified Medical Coder. Analyze this doctor's prescription or clinical notes image.

Use these ICD-10 mappings:
- Cancer → C80.1
- Diabetes → E11.9
- Arthritis → M19.90
- Asthma → J45.909
- Obesity → E66.9
- Hypertension → I10

Use these CPT mappings:
- Urgent Visit → 99214
- Emergency Visit → 99284
- Elective Visit → 99213

${currentPatient ? `Patient context: ${currentPatient.name}, known condition: ${currentPatient.condition}` : ""}

Return ONLY a raw JSON object with no markdown, no explanation, no backticks. Just the JSON.
Format:
{
  "medical_condition": "",
  "icd_10": "",
  "admission_type": "",
  "cpt_code": "",
  "notes": "",
  "medications": [],
  "doctor_name": ""
}`;

      const parsed = await analyzeImageWithGroq(base64, file.type, prompt);

      setResult(parsed);
      setCurrentCoding(parsed);
    } catch (err) {
      console.error("Agent Error:", err);
      setError("Failed to process prescription. Please try again or use manual entry.");
    } finally {
      setLoading(false);
    }
  };

  const [manualCondition, setManualCondition] = useState("");
  const [manualAdmission, setManualAdmission] = useState("");

  const handleManualCode = () => {
    if (!manualCondition || !manualAdmission) return;
    const conditionKey = manualCondition.toLowerCase();
    const admissionKey = manualAdmission.toLowerCase();

    const icdMatch = Object.entries(ICD_MAP).find(([key]) =>
      conditionKey.includes(key)
    );
    const cptMatch = Object.entries(CPT_MAP).find(([key]) =>
      admissionKey.includes(key)
    );

    const coded = {
      medical_condition: icdMatch ? icdMatch[1].label : manualCondition,
      icd_10: icdMatch ? icdMatch[1].icd : "Unknown",
      admission_type: cptMatch ? cptMatch[1].label : manualAdmission,
      cpt_code: cptMatch ? cptMatch[1].cpt : "Unknown",
      notes: "Manually entered",
      medications: [],
      doctor_name: "",
    };

    setResult(coded);
    setCurrentCoding(coded);
    setError(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-700">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-2xl">🧠</span>
          <h2 className="text-xl font-bold text-white">Agent 2 — Medical Coding</h2>
        </div>
        <p className="text-gray-400 text-sm ml-11">
          Upload the doctor's prescription or clinical notes. The AI will
          extract ICD-10 diagnosis codes and CPT procedure codes.
        </p>
      </div>

      {/* Patient Context Banner */}
      {currentPatient && (
        <div className="bg-blue-900/30 border border-blue-700 rounded-xl px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-blue-400 text-lg">👤</span>
            <div>
              <p className="text-sm font-semibold text-white">
                {currentPatient.name}
              </p>
              <p className="text-xs text-blue-300">
                {currentPatient.insuranceId} · {currentPatient.provider}
              </p>
            </div>
          </div>
          <span className="text-xs bg-blue-800 text-blue-200 px-3 py-1 rounded-full">
            Known: {currentPatient.condition || "—"}
          </span>
        </div>
      )}

      {/* Upload + Manual */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Upload */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-700 space-y-4">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-widest">
            Upload Prescription / Notes
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
                  <div className="text-4xl mb-2">📋</div>
                  <p className="text-sm text-gray-400">
                    Click to upload prescription image
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
                  <span className="animate-spin">⚙️</span> Coding...
                </span>
              ) : (
                "🚀 Run Coding Agent"
              )}
            </button>
          )}
        </div>

        {/* Manual Entry */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-700 space-y-4">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-widest">
            Manual Code Entry
          </h3>
          <p className="text-xs text-gray-500">
            Enter the condition and visit type manually if image upload fails.
          </p>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">
                Medical Condition
              </label>
              <select
                value={manualCondition}
                onChange={(e) => setManualCondition(e.target.value)}
                className="w-full bg-gray-800 text-white text-sm px-4 py-3 rounded-xl border border-gray-600 focus:outline-none focus:border-blue-500"
              >
                <option value="">Select condition...</option>
                {Object.entries(ICD_MAP).map(([key, val]) => (
                  <option key={key} value={key}>
                    {val.label} ({val.icd})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">
                Admission Type
              </label>
              <select
                value={manualAdmission}
                onChange={(e) => setManualAdmission(e.target.value)}
                className="w-full bg-gray-800 text-white text-sm px-4 py-3 rounded-xl border border-gray-600 focus:outline-none focus:border-blue-500"
              >
                <option value="">Select type...</option>
                {Object.entries(CPT_MAP).map(([key, val]) => (
                  <option key={key} value={key}>
                    {val.label} ({val.cpt})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleManualCode}
              disabled={!manualCondition || !manualAdmission}
              className="w-full py-3 bg-purple-700 hover:bg-purple-600 disabled:bg-gray-800 disabled:text-gray-500 rounded-xl font-semibold text-sm transition-all"
            >
              ⚡ Generate Codes
            </button>
          </div>
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
        <div className="bg-green-900/20 border border-green-700 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg text-green-400">
              ✅ Coding Complete
            </h3>
            <span className="text-xs bg-green-800 text-green-300 px-3 py-1 rounded-full font-semibold">
              ICD-10 + CPT Generated
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { label: "Medical Condition", value: result.medical_condition },
              { label: "ICD-10 Code", value: result.icd_10 },
              { label: "Admission Type", value: result.admission_type },
              { label: "CPT Code", value: result.cpt_code },
              { label: "Doctor", value: result.doctor_name || "—" },
              { label: "Notes", value: result.notes || "—" },
            ].map((item) => (
              <div key={item.label} className="bg-gray-800 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-1">{item.label}</p>
                <p className="text-sm font-semibold text-white font-mono">
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          {result.medications && result.medications.length > 0 && (
            <div className="bg-gray-800 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-2">Medications</p>
              <div className="flex flex-wrap gap-2">
                {result.medications.map((med, i) => (
                  <span
                    key={i}
                    className="text-xs bg-gray-700 text-gray-200 px-3 py-1 rounded-full"
                  >
                    💊 {med}
                  </span>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => setActiveStep(3)}
            className="w-full py-3 bg-green-600 hover:bg-green-500 rounded-xl font-bold text-sm transition-all"
          >
            ➡️ Proceed to Adjudication
          </button>
        </div>
      )}
    </div>
  );
};

export default CodingAgent;