import React, { createContext, useContext, useState } from "react";

const RCMContext = createContext();

export const RCMProvider = ({ children }) => {
  const [patients, setPatients] = useState([]);
  const [claims, setClaims] = useState([]);
  const [currentPatient, setCurrentPatient] = useState(null);
  const [currentCoding, setCurrentCoding] = useState(null);
  const [insuranceData, setInsuranceData] = useState([]);
  const [activeStep, setActiveStep] = useState(1);

  const addPatient = (patientData) => {
    setPatients((prev) => {
      const exists = prev.find(
        (p) => p.insuranceId === patientData.insuranceId
      );
      if (exists) return prev;
      return [...prev, patientData];
    });
  };

  const addClaim = (claimData) => {
    setClaims((prev) => [
      ...prev,
      { ...claimData, id: Date.now(), timestamp: new Date().toLocaleString() },
    ]);
  };

  const resetPipeline = () => {
    setCurrentPatient(null);
    setCurrentCoding(null);
    setActiveStep(1);
  };

  return (
    <RCMContext.Provider
      value={{
        patients,
        claims,
        currentPatient,
        currentCoding,
        insuranceData,
        activeStep,
        setInsuranceData,
        setCurrentPatient,
        setCurrentCoding,
        setActiveStep,
        addPatient,
        addClaim,
        resetPipeline,
      }}
    >
      {children}
    </RCMContext.Provider>
  );
};

export const useRCM = () => useContext(RCMContext);