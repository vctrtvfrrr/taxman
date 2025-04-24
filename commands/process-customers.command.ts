import fs from "fs";
import Papa from "papaparse";
import { StripeSDK } from "../services/stripe";
import type { CustomerData } from "../types";

const CUSTOMERS_FILE = "customers.csv";

export class ProcessCustomersCommand {
  async execute(): Promise<void> {
    try {
      if (!fs.existsSync(CUSTOMERS_FILE)) {
        console.error(
          "❌ Error: customers.csv file not found. Please run generate-csv command first."
        );
        process.exit(1);
      }

      console.log("📂 Loading customers from CSV file...");
      const fileContent = fs.readFileSync(CUSTOMERS_FILE, "utf-8");
      const result = Papa.parse<CustomerData>(fileContent, { header: true });
      const customers = result.data;

      console.log(`🔍 Found ${customers.length} customers to process`);
      let processedCount = 0;
      let successCount = 0;
      let errorCount = 0;

      for (const customer of customers) {
        processedCount++;
        console.log(
          `\n📝 Processing customer ${processedCount}/${customers.length} - ${customer.name} (${customer.id})`
        );

        try {
          // Get subscription directly using the ID from CSV
          const subscription = await StripeSDK.subscriptions.retrieve(customer.subscription);

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
          console.error("❌ Error processing customer:", error);
          errorCount++;
        }
      }

      console.log("\n📊 Processing Summary:");
      console.log(`   - Total customers processed: ${processedCount}`);
      console.log(`   - Successful updates: ${successCount}`);
      console.log(`   - Errors: ${errorCount}`);
      console.log("✅ Process completed!");
    } catch (error) {
      console.error("❌ Error:", error);
      process.exit(1);
    }
  }
}
