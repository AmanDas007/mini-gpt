import { HfInference } from "@huggingface/inference";

const hf = new HfInference(
  process.env.HUGGINGFACE_API_KEY
);

export async function createEmbedding(text) {
  try {
    const response = await hf.featureExtraction({
      model: "sentence-transformers/all-MiniLM-L6-v2",
      inputs: text,
    });

    // flatten embedding safely
    const embedding = Array.isArray(response[0])
      ? response[0]
      : response;

    return embedding;

  } catch (err) {
    console.error("Embedding Error:", err);

    return null;
  }
}