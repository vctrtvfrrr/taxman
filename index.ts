import { generateCSV } from "./services/generate-csv";
import type { StripeSubscriptionStatus } from "./types";

// Get status from command line arguments and validate it
const validStatuses = ["active", "past_due"] as const;
const statusArg = process.argv[2] as StripeSubscriptionStatus;

if (!statusArg || !validStatuses.includes(statusArg)) {
  console.error(
    "❌ Error: Status parameter is required and must be either 'active' or 'past_due'"
  );
  console.error("Usage: bun index.ts <status>");
  console.error("Example: bun index.ts active");
  process.exit(1);
}

async function main() {
  await generateCSV(statusArg);
}

main();
