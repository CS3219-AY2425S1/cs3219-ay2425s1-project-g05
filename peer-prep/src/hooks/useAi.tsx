// src/hooks/AIContext.tsx
import React, { createContext, useContext, useState } from "react";

interface AIContextType {
  isApiKeyModalVisible: boolean;
  setApiKeyModalVisible: (visible: boolean) => void;
  hasApiKey: boolean;
  setHasApiKey: (value: boolean) => void; 
}

const AIContext = createContext<AIContextType | undefined>(undefined);

export const AIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isApiKeyModalVisible, setApiKeyModalVisible] = useState(false); 
  const [hasApiKey, setHasApiKey] = useState(false); // Track if the API key is set

  return (
    <AIContext.Provider value={{ isApiKeyModalVisible, setApiKeyModalVisible, hasApiKey, setHasApiKey }}>
      {children}
    </AIContext.Provider>
  );
};

export const useAi = () => {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error("useAi must be used within an AIProvider");
  }
  return context;
};