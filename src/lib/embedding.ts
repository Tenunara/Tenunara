export async function generateEmbedding(
  text: string,
  inputType: "document" | "query" = "document",
) {
  const VOYAGE_API_KEY = process.env.VOYAGE_API_KEY;
  if (!VOYAGE_API_KEY) {
    throw new Error("VOYAGE_API_KEY tidak dikonfigurasi");
  }

  const res = await fetch("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${VOYAGE_API_KEY}`,
    },
    body: JSON.stringify({
      model: "voyage-3.5-lite",
      input: [text],
      input_type: inputType,
      output_dimension: 1024,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    console.error("Voyage API error:", data);
    throw new Error("Embedding failed");
  }

  return data.data[0].embedding as number[];
}
