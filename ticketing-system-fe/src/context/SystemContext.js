import React, { createContext, useState, useContext } from "react";

const SystemContext = createContext();

export const SystemProvider = ({ children }) => {
  const [isSystemRunning, setIsSystemRunning] = useState(true);

  const toggleSystem = async () => {
    try {
      setIsSystemRunning(!isSystemRunning);
    } catch (error) {
      console.error("Failed to toggle system:", error);
    }
  };

  return (
    <SystemContext.Provider value={{ isSystemRunning, toggleSystem }}>
      {children}
    </SystemContext.Provider>
  );
};

export const useSystem = () => {
  const context = useContext(SystemContext);
  if (context === undefined) {
    throw new Error("useSystem must be used within a SystemProvider");
  }
  return context;
};

export default SystemContext;
