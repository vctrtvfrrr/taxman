import { config } from 'dotenv';
import { eq, and, gt } from 'drizzle-orm';
import Stripe from 'stripe';
import ExcelJS from 'exceljs';
import { db } from './db';
import { user, subscription } from './db/schema';

// Load environment variables
config();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

async function main() {
  try {
    // Create a new workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Customers');

    // Add headers
    worksheet.columns = [
      { header: 'ID', key: 'id' },
      { header: 'Name', key: 'name' },
      { header: 'Email', key: 'email' },
      { header: 'Subscription Plan', key: 'plan' },
      { header: 'Address', key: 'address' },
    ];

    // Get all active Stripe subscriptions
    const activeSubscriptions = await db
      .select()
      .from(subscription)
      .where(
        and(
          eq(subscription.providerName, 'stripe'),
          gt(subscription.expireDate, new Date())
        )
      );

    // Process each subscription
    for (const sub of activeSubscriptions) {
      // Get user data
      const userData = await db
        .select()
        .from(user)
        .where(eq(user.id, sub.userId))
        .limit(1);

      if (!userData.length) continue;

      const user = userData[0];

      // Get Stripe customer data
      const stripeCustomer = await stripe.customers.retrieve(user.id);

      if (!stripeCustomer || stripeCustomer.deleted) continue;

      // Add row to Excel
      worksheet.addRow({
        id: user.id,
        name: user.name,
        email: user.email,
        plan: sub.plan,
        address: stripeCustomer.address
          ? `${stripeCustomer.address.line1}, ${stripeCustomer.address.city}, ${stripeCustomer.address.country}`
          : 'No address',
      });
    }

    // Save the workbook
    await workbook.xlsx.writeFile('customers.xlsx');
    console.log('Excel file has been created successfully!');
  } catch (error) {
    console.error('Error:', error);
  }
}

main(); 