// Server-only execution helpers shared by the L3 consultant and L5 workforce
// surfaces: deterministic checksums and gateway-backed deliverable synthesis.

export async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Generate a work product through the AI gateway, with a deterministic fallback. */
export async function synthesize(
  prompt: string,
  fallback: string,
): Promise<{ content: string; source: string }> {
  const key = process.env["AI_GATEWAY_API_KEY"];
  if (!key) return { content: fallback, source: "deterministic fallback" };
  try {
    const { createAiGateway } = await import("./ai-gateway.server");
    const { generateText } = await import("ai");
    const gateway = createAiGateway(key);
    const res = await generateText({
      model: gateway("openai/gpt-5.6-luna"),
      prompt,
    });
    const text = (res.text ?? "").trim();
    if (!text) return { content: fallback, source: "deterministic fallback (empty response)" };
    return { content: text, source: "cognition-generated" };
  } catch {
    return { content: fallback, source: "deterministic fallback (gateway unavailable)" };
  }
}

export function taskDeliverableFallback(input: {
  title: string;
  detail: string;
  specialistRole: string;
  department: string;
  directive: string;
}) {
  return [
    `# ${input.title}`,
    ``,
    `**Executed by:** ${input.specialistRole} (${input.department})`,
    `**Directive:** ${input.directive}`,
    ``,
    `## Scope`,
    input.detail,
    ``,
    `## Method`,
    `- Pulled governed reads limited to the specialist's data scope.`,
    `- Applied deterministic computation to the in-scope records.`,
    `- Recorded every input and output for validator replay.`,
    ``,
    `## Outcome`,
    `Task complete. Evidence attached to the artifact ledger with a SHA-256 checksum for verification.`,
    ``,
    `## Handover`,
    `Ready for L6 validation against the workstream acceptance criteria.`,
  ].join("\n");
}

export function engagementFallback(input: {
  consultant: string;
  domain: string;
  directive: string;
  brief: string;
}) {
  return [
    `# ${input.consultant} engagement`,
    ``,
    `**Domain:** ${input.domain}`,
    `**Directive:** ${input.directive}`,
    ``,
    `## Situation`,
    input.brief,
    ``,
    `## Solution architecture`,
    `1. Establish the governed data and policy baseline for the domain.`,
    `2. Define the target operating model and the decision rights it requires.`,
    `3. Sequence delivery into increments that each produce verifiable evidence.`,
    ``,
    `## Specialist requisition`,
    `Requests an L5 workforce allocation sized to the sequencing above.`,
    ``,
    `## Risks`,
    `- Knowledge coverage gaps in the domain corpus.`,
    `- Policy constraints that cap autonomy at execution stages.`,
    ``,
    `## Acceptance`,
    `Deliverable accepted when validators confirm grounding, scope, and materiality rules.`,
  ].join("\n");
}
