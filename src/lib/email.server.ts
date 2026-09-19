export type EmailMessage = {
  to: string;
  from: string;
  subject: string;
  text: string;
  html?: string;
  purpose?: string;
};

export async function sendEmail(message: EmailMessage): Promise<void> {
  const endpoint = process.env.EMAIL_PROVIDER_URL;
  const apiKey = process.env.EMAIL_PROVIDER_API_KEY;
  if (!endpoint || !apiKey) throw new Error("Email provider is not configured");
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(message),
  });
  if (!response.ok) throw new Error(`Email provider returned HTTP ${response.status}`);
}
