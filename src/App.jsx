import React from "react";
import Sidebar from "./components/Sidebar";
import RegistrationAgent from "./components/RegistrationAgent";
import CodingAgent from "./components/CodingAgent";
import AdjudicationAgent from "./components/AdjudicationAgent";
import ClaimsHistory from "./components/ClaimsHistory";
import { useRCM } from "./context/RCMContext";

const StepIndicator = ({ step, label, current }) => {
  const isDone = current > step;
  const isActive = current === step;

  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all
          ${isDone ? "bg-green-500 border-green-500 text-white" : ""}
          ${isActive ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/30" : ""}
          ${!isDone && !isActive ? "bg-gray-800 border-gray-600 text-gray-400" : ""}
        `}
      >
        {isDone ? "✓" : step}
      </div>
      <span
        className={`text-sm font-medium ${
          isActive ? "text-white" : isDone ? "text-green-400" : "text-gray-500"
        }`}
      >
        {label}
      </span>
    </div>
  );
};

const Divider = ({ active }) => (
  <div
    className={`flex-1 h-0.5 mx-2 rounded ${
      active ? "bg-green-500" : "bg-gray-700"
    }`}
  />
);

function App() {
  const { activeStep, resetPipeline, claims } = useRCM();
  const [showHistory, setShowHistory] = React.useState(false);

  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Nav */}
        <div className="bg-gray-900 border-b border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                🏥 RCM Pipeline
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">
                Revenue Cycle Management — AI Powered
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="relative text-sm px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-600 transition-all"
              >
                📋 Claims History
                {claims.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-blue-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {claims.length}
                  </span>
                )}
              </button>
              <button
                onClick={resetPipeline}
                className="text-sm px-4 py-2 rounded-lg bg-red-900/40 hover:bg-red-900/70 border border-red-700 text-red-400 transition-all"
              >
                🔄 Reset
              </button>
            </div>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center">
            <StepIndicator step={1} label="Registration" current={activeStep} />
            <Divider active={activeStep > 1} />
            <StepIndicator step={2} label="Medical Coding" current={activeStep} />
            <Divider active={activeStep > 2} />
            <StepIndicator step={3} label="Adjudication" current={activeStep} />
            <Divider active={activeStep > 3} />
            <StepIndicator step={4} label="Complete" current={activeStep} />
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {showHistory ? (
            <ClaimsHistory onClose={() => setShowHistory(false)} />
          ) : (
            <>
              {activeStep === 1 && <RegistrationAgent />}
              {activeStep === 2 && <CodingAgent />}
              {activeStep === 3 && <AdjudicationAgent />}
              {activeStep === 4 && (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <div className="text-6xl">🎉</div>
                  <h2 className="text-2xl font-bold text-green-400">
                    Claim Processed Successfully
                  </h2>
                  <p className="text-gray-400 text-sm">
                    The full pipeline has completed. Start a new claim below.
                  </p>
                  <button
                    onClick={resetPipeline}
                    className="mt-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold transition-all"
                  >
                    + New Claim
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;