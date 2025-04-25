import fs from "fs";
import { StripeSDK } from "../services/stripe";
import type { StripeSubscriptionStatus } from "../types";

const CURSOR_FILE = "subscription-cursor.txt";

export class ProcessSubscriptionsCommand {
  constructor(private status: StripeSubscriptionStatus) {}

  async saveCursor(cursor: string | undefined) {
    if (cursor) {
      fs.writeFileSync(CURSOR_FILE, cursor);
      console.log(`📝 Cursor saved: ${cursor}`);
      return;
    }

    // If no cursor, remove the file to indicate completion
    if (fs.existsSync(CURSOR_FILE)) fs.unlinkSync(CURSOR_FILE);
  }

  async loadCursor(): Promise<string | undefined> {
    if (fs.existsSync(CURSOR_FILE)) {
      const cursor = fs.readFileSync(CURSOR_FILE, "utf-8").trim();
      console.log(`📝 Resuming from cursor: ${cursor}`);
      return cursor;
    }
    return undefined;
  }

  async execute(): Promise<void> {
    try {
      console.log("🔍 Starting subscription processing...");
      let processedCount = 0;
      let successCount = 0;
      let errorCount = 0;
      let hasMore = true;

      // Load the last cursor if it exists
      let lastSubscriptionId = await this.loadCursor();

      while (hasMore) {
        const stripeSubscriptions = await StripeSDK.subscriptions.list({
          status: this.status,
          expand: ["data.customer"],
          starting_after: lastSubscriptionId,
          limit: 100, // Maximum allowed by Stripe
        });

        console.log(
          `📥 Fetched ${stripeSubscriptions.data.length} subscriptions`
        );

        for (const subscription of stripeSubscriptions.data) {
          processedCount++;
          console.log(
            `\n📝 Processing subscription ${processedCount} - ${subscription.id}`
          );

          // Save the cursor after processing each subscription
          await this.saveCursor(subscription.id);

          try {
            // Check if automatic tax is already enabled
            if (subscription.automatic_tax?.enabled) {
              console.log(
                "ℹ️ Automatic tax is already enabled for this subscription"
              );
              continue;
            }

            // Enable automatic tax
            await StripeSDK.subscriptions.update(subscription.id, {
              automatic_tax: { enabled: true },
            });

            console.log("✅ Successfully enabled automatic tax");
            successCount++;
          } catch (error) {
            console.error("❌ Error processing subscription:", error);
            errorCount++;
          }
        }

        // Update pagination parameters
        hasMore = stripeSubscriptions.has_more;
        if (hasMore && stripeSubscriptions.data.length > 0) {
          lastSubscriptionId =
            stripeSubscriptions.data[stripeSubscriptions.data.length - 1].id;
        }
      }

      // Clear the cursor file when processing is complete
      await this.saveCursor(undefined);

      console.log("\n📊 Processing Summary:");
      console.log(`   - Total subscriptions processed: ${processedCount}`);
      console.log(`   - Successful updates: ${successCount}`);
      console.log(`   - Errors: ${errorCount}`);
      console.log("✅ Process completed!");
    } catch (error) {
      console.error("❌ Error:", error);
      process.exit(1);
    }
  }
}
