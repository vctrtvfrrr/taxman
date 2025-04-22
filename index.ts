import "dotenv/config";
import fs from "fs";
import Papa from "papaparse";
import Stripe from "stripe";

const CUSTOMERS_FILE = "customers.csv";
const CURSOR_FILE = "cursor.txt";

interface CustomerData {
  id: string;
  name: string;
  email: string;
  plan: string;
  state: string;
  city: string;
  postal_code: string;
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil",
});

async function saveToCSV(customers: CustomerData[], outputFile: string) {
  const csv = Papa.unparse(customers);
  fs.writeFileSync(outputFile, csv);
  console.log(`💾 CSV file updated with ${customers.length} customers`);
}

async function saveCursor(cursor: string | undefined) {
  if (cursor) {
    fs.writeFileSync(CURSOR_FILE, cursor);
    console.log(`📝 Cursor saved: ${cursor}`);
  } else {
    // If no cursor, remove the file to indicate completion
    if (fs.existsSync(CURSOR_FILE)) {
      fs.unlinkSync(CURSOR_FILE);
    }
  }
}

async function loadCursor(): Promise<string | undefined> {
  if (fs.existsSync(CURSOR_FILE)) {
    const cursor = fs.readFileSync(CURSOR_FILE, "utf-8").trim();
    console.log(`📝 Resuming from cursor: ${cursor}`);
    return cursor;
  }
  return undefined;
}

async function main() {
  try {
    let customers: CustomerData[] = [];

    // Check if file exists and load it
    if (fs.existsSync(CUSTOMERS_FILE)) {
      console.log("📂 Loading existing CSV file...");
      const fileContent = fs.readFileSync(CUSTOMERS_FILE, "utf-8");
      const result = Papa.parse<CustomerData>(fileContent, { header: true });
      customers = result.data;
    }

    // Load the last cursor if it exists
    let lastSubscriptionId = await loadCursor();

    // Fetch all active subscriptions from Stripe using pagination
    console.log("🔍 Fetching active subscriptions from Stripe...");
    let hasMore = true;
    let totalSubscriptions = 0;

    while (hasMore) {
      const stripeSubscriptions = await stripe.subscriptions.list({
        status: "active",
        expand: ["data.customer"],
        starting_after: lastSubscriptionId,
        limit: 100, // Maximum allowed by Stripe
      });

      totalSubscriptions += stripeSubscriptions.data.length;
      console.log(
        `📥 Fetched ${stripeSubscriptions.data.length} subscriptions (Total: ${totalSubscriptions})`
      );

      // Process each subscription in the current batch
      for (const stripeSub of stripeSubscriptions.data) {
        // Skip if no customer data or if customer is deleted
        if (
          !stripeSub.customer ||
          typeof stripeSub.customer === "string" ||
          stripeSub.customer.deleted
        ) {
          continue;
        }

        const stripeCustomer = stripeSub.customer as Stripe.Customer;

        // Check if customer has address
        if (
          !stripeCustomer.address ||
          stripeCustomer.address.country !== "US" ||
          !["NY", "KY", "HI"].includes(stripeCustomer.address.state!)
        ) {
          continue;
        }

        // Get plan details
        const planId =
          stripeSub.items.data[0]?.price.id ||
          stripeSub.items.data[0]?.price.nickname;

        // Add customer to array
        customers.push({
          id: stripeCustomer.id,
          name: stripeCustomer.name || "",
          email: stripeCustomer.email || "",
          plan: planId || "Unknown Plan",
          state: stripeCustomer.address.state || "",
          city: stripeCustomer.address.city || "",
          postal_code: stripeCustomer.address.postal_code || "",
        });
      }

      // Save progress after each batch
      await saveToCSV(customers, CUSTOMERS_FILE);

      // Update pagination parameters and save cursor
      hasMore = stripeSubscriptions.has_more;
      if (hasMore && stripeSubscriptions.data.length > 0) {
        lastSubscriptionId =
          stripeSubscriptions.data[stripeSubscriptions.data.length - 1].id;
        await saveCursor(lastSubscriptionId);
      } else {
        // If no more data, remove the cursor file
        await saveCursor(undefined);
      }
    }

    console.log(`\n📊 Processing Summary:`);
    console.log(`   - Total subscriptions fetched: ${totalSubscriptions}`);
    console.log(`   - Total customers exported: ${customers.length}`);
    console.log("✅ Process completed successfully!");
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

main();
