import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const breachSchema = z.object({
  tool: z.string().max(80),
  metric: z.string().max(40),
  observed: z.string().max(60),
  threshold: z.string().max(60),
  severity: z.enum(["critical", "warning"]),
});

const payloadSchema = z.object({
  breaches: z.array(breachSchema).max(50),
  text: z.string().max(4000),
  slackWebhookUrl: z.string().max(500),
  emailTo: z.string().max(320),
  emailFrom: z.string().max(320),
});

export type AlertDispatchResult = {
  slack: { attempted: boolean; ok: boolean; detail: string };
  email: { attempted: boolean; ok: boolean; detail: string };
};

/** Dispatch a tool-health alert to Slack and/or email. Never throws to the caller. */
export const dispatchToolHealthAlertFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => payloadSchema.parse(input))
  .handler(async ({ data }) => {
    const result: AlertDispatchResult = {
      slack: { attempted: false, ok: false, detail: "no webhook configured" },
      email: { attempted: false, ok: false, detail: "no recipient configured" },
    };

    const webhook = data.slackWebhookUrl.trim();
    if (webhook) {
      result.slack.attempted = true;
      if (!/^https:\/\/hooks\.slack\.com\//.test(webhook)) {
        result.slack.detail = "webhook must be an https://hooks.slack.com/… URL";
      } else {
        try {
          const res = await fetch(webhook, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: data.text }),
          });
          result.slack.ok = res.ok;
          result.slack.detail = res.ok ? "delivered to Slack" : `Slack responded ${res.status}`;
        } catch (err) {
          result.slack.detail = err instanceof Error ? err.message : "Slack delivery failed";
        }
      }
    }

    const to = data.emailTo.trim();
    const from = data.emailFrom.trim();
    if (to) {
      result.email.attempted = true;
      if (!from) {
        result.email.detail = "a verified sender address is required";
      } else {
        try {
          const { sendLovableEmail } = await import("@lovable.dev/email-js");
          const rows = data.breaches
            .map(
              (b) =>
                `<li><strong>${b.severity.toUpperCase()}</strong> — ${b.tool} · ${b.metric}: ${b.observed} exceeds ${b.threshold}</li>`,
            )
            .join("");
          await sendLovableEmail(
            {
              to,
              from,
              subject: `SECP tool-health alert — ${data.breaches.length} breach(es)`,
              text: data.text,
              html: `<h2>SECP tool-health alert</h2><ul>${rows}</ul>`,
              purpose: "tool-health-alert",
            },
            { apiKey: process.env.LOVABLE_API_KEY! },
          );
          result.email.ok = true;
          result.email.detail = `sent to ${to}`;
        } catch (err) {
          result.email.detail = err instanceof Error ? err.message : "email delivery failed";
        }
      }
    }

    return result;
  });
