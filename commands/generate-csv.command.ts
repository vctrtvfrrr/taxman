import { generateCSV } from "../services/generate-csv";
import type { StripeSubscriptionStatus } from "../types";

export class GenerateCsvCommand {
  constructor(private status: StripeSubscriptionStatus) {}

  async execute(): Promise<void> {
    await generateCSV(this.status);
  }
} 