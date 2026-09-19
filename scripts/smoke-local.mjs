import process from "node:process";

const baseUrl = (process.env.SMOKE_BASE_URL || "http://127.0.0.1:4173").replace(/\/$/, "");
const checks = [
  {
    name: "public landing page",
    path: "/",
    expectedStatus: 200,
    expectedText: "The cognitive operating system for modern organizations.",
  },
  {
    name: "configuration-aware authentication page",
    path: "/auth",
    expectedStatus: 200,
    expectedText: "Access Mission Control",
  },
  {
    name: "unauthenticated protected-route redirect",
    path: "/dashboard",
    expectedStatus: 200,
    expectedText: "Soteria SECP",
  },
];

const failures = [];
for (const check of checks) {
  const response = await fetch(`${baseUrl}${check.path}`, { redirect: "follow" });
  const body = await response.text();
  if (response.status !== check.expectedStatus) {
    failures.push(
      `${check.name}: expected HTTP ${check.expectedStatus}, received ${response.status}`,
    );
  }
  if (!body.includes(check.expectedText)) {
    failures.push(`${check.name}: response did not contain ${JSON.stringify(check.expectedText)}`);
  }
  if (check.path === "/dashboard" && body.includes("This page didn't load")) {
    failures.push(`${check.name}: route returned the root error boundary during HTTP smoke test`);
  }
  console.log(`${check.name}: ${response.status} ${response.url}`);
}

if (failures.length) {
  console.error(`Smoke test failed:\n${failures.join("\n")}`);
  process.exit(1);
}

console.log(`Smoke test passed: ${checks.length} HTTP journeys verified against ${baseUrl}`);
