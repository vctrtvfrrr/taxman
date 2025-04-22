import "dotenv/config";
import ExcelJS from "exceljs";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil",
});

async function main() {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Customers");

    worksheet.columns = [
      { header: "ID", key: "id" },
      { header: "Name", key: "name" },
      { header: "Email", key: "email" },
      { header: "Subscription Plan", key: "plan" },
      { header: "Address", key: "address" },
    ];

    // Fetch active subscriptions from Stripe
    const stripeSubscriptions = await stripe.subscriptions.list({
      status: "active",
      expand: ["data.customer"],
    });

    console.log(
      `Found ${stripeSubscriptions.data.length} active subscriptions`
    );

    // Process each subscription
    for (const stripeSub of stripeSubscriptions.data) {
      // Skip if no customer data or if customer is deleted
      if (
        !stripeSub.customer ||
        typeof stripeSub.customer === "string" ||
        stripeSub.customer.deleted
      )
        continue;

      const stripeCustomer = stripeSub.customer as Stripe.Customer;

      // Check if customer has address
      if (!stripeCustomer.address) continue;

      // Get plan details
      const planId =
        stripeSub.items.data[0]?.price.nickname ||
        stripeSub.items.data[0]?.price.id;

      // Add row to Excel
      worksheet.addRow({
        id: stripeCustomer.id,
        name: stripeCustomer.name || "",
        email: stripeCustomer.email || "",
        plan: planId || "Unknown Plan",
        address: `${stripeCustomer.address.line1}, ${stripeCustomer.address.city}, ${stripeCustomer.address.country}`,
      });
    }

    await workbook.xlsx.writeFile("customers.xlsx");
    console.log("Excel file has been created successfully!");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    process.exit(0);
  }
}

main();
