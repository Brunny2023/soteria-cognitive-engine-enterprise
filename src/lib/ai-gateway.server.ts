import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export function createAiGateway(apiKey: string, baseURL = process.env.AI_GATEWAY_BASE_URL) {
  if (!baseURL) throw new Error("AI_GATEWAY_BASE_URL is not configured");
  return createOpenAICompatible({
    name: "organization-ai-gateway",
    baseURL,
    headers: { Authorization: `Bearer ${apiKey}` },
  });
}
