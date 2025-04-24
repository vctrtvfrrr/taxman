import { GenerateCsvCommand } from "./commands/generate-csv.command";
import { ProcessCustomersCommand } from "./commands/process-customers.command";
import { ProcessSubscriptionsCommand } from "./commands/process-subscriptions.command";
import type { StripeSubscriptionStatus } from "./types";

type Command = "generate-csv" | "process-customers" | "process-subscriptions";

const validStatuses = ["active", "past_due"] as const;

function printUsage() {
  console.error("Usage: bun <command> [options]");
  console.error("\nCommands:");
  console.error("  generate-csv <status>            Generate CSV file for customers with given status");
  console.error("  process-customers                Process customers from the generated CSV file");
  console.error("  process-subscriptions <status>   Process all active subscriptions to enable automatic tax");
  console.error("\nOptions:");
  console.error("  status: 'active' or 'past_due' (required for generate-csv command)");
  console.error("\nExamples:");
  console.error("  bun generate-csv active");
  console.error("  bun process-customers");
  console.error("  bun process-subscriptions active");
  process.exit(1);
}

async function main() {
  const command = process.argv[2] as Command;
  
  if (!command) {
    printUsage();
  }

  switch (command) {
    case "generate-csv": {
      const statusArg = process.argv[3] as StripeSubscriptionStatus;
      if (!statusArg || !validStatuses.includes(statusArg)) {
        console.error("❌ Error: Status parameter is required and must be either 'active' or 'past_due'");
        printUsage();
      }
      const cmd = new GenerateCsvCommand(statusArg);
      await cmd.execute();
      break;
    }
    case "process-customers": {
      const cmd = new ProcessCustomersCommand();
      await cmd.execute();
      break;
    }
    case "process-subscriptions": {
      const statusArg = process.argv[3] as StripeSubscriptionStatus;
      if (!statusArg || !validStatuses.includes(statusArg)) {
        console.error("❌ Error: Status parameter is required and must be either 'active' or 'past_due'");
        printUsage();
      }
      const cmd = new ProcessSubscriptionsCommand(statusArg);
      await cmd.execute();
      break;
    }
    default:
      console.error(`❌ Error: Unknown command '${command}'`);
      printUsage();
  }
}

main().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});
