import { DataMode } from '../types';

// Safe environment access helper
const getMetaEnv = () => {
  try {
    return (import.meta as any).env || {};
  } catch {
    return {};
  }
};

const metaEnv = getMetaEnv();

// Check if specific keys exist in the environment
const hasFinnhubKey = !!metaEnv.VITE_FINNHUB_API_KEY;

// Safe check for Gemini Key (process.env might not exist in browser runtime)
let hasGeminiKey = false;
try {
  // In Vite, process.env.API_KEY is replaced by a string literal at build time.
  // We check it directly. Use try-catch to handle ReferenceError if process is missing and not replaced.
  if (process.env.API_KEY) {
    hasGeminiKey = !!process.env.API_KEY;
  }
} catch (e) {
  hasGeminiKey = false;
}

const hasFirebaseConfig = !!metaEnv.VITE_FIREBASE_CONFIG_STRING;

// Helper to determine availability
export const isRealDataAvailable = {
  market: hasFinnhubKey,
  ai: hasGeminiKey,
  portfolio: hasFirebaseConfig
};

// Current Active Mode (stored in memory for session, defaulting to MOCK if keys missing)
// We default to REAL if EITHER key is present, but services will handle individual missing keys gracefully
let currentMode: DataMode = (hasFinnhubKey || hasGeminiKey) ? DataMode.REAL : DataMode.MOCK;

export const setAppMode = (mode: DataMode) => {
  currentMode = mode;
};

export const getAppMode = (): DataMode => {
  return currentMode;
};

export const getEnv = () => {
  const env = getMetaEnv();
  let geminiKey = undefined;
  try {
    // Direct access to support Vite replacement
    geminiKey = process.env.API_KEY;
  } catch {}

  return {
    FINNHUB_KEY: env.VITE_FINNHUB_API_KEY,
    GEMINI_KEY: geminiKey,
    FIREBASE_CONFIG: env.VITE_FIREBASE_CONFIG_STRING
  };
};