import { encodingForModel } from "js-tiktoken";

// Initialize the encoder for the correct model
// Note: gpt-4o-mini uses the same underlying tokenizer as gpt-4o (the o200k_base encoder)
const enc = encodingForModel("gpt-4o-mini"); 

export function countTokens(text) {
  if (!text) return 0;
  // Encode the text into tokens and return the length of the array
  return enc.encode(text).length; 
}