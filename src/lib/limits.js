export const MODEL_CONTEXT_LIMIT = 128000;

// High-fidelity chat history (approx 20-30 messages)
export const MAX_WINDOW_TOKENS = 4000; 

// When unsummarized old messages hit this, trigger the summarizer
export const SUMMARIZATION_LIMIT = 3000; 

// The maximum size of the condensed "Memory" string
export const RUNNING_SUMMARY_MAX = 800; 

// Permanent User Bio/Facts size
export const GLOBAL_SUMMARY_LIMIT = 1000; 

// Safety cap to stay within Groq Free Tier daily limits
export const SESSION_DAILY_LIMIT = 70000;
