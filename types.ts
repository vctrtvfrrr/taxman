export type StripeSubscriptionStatus = "active" | "past_due";

export type CustomerData = {
  id: string;
  name: string;
  email: string;
  plan: string;
  state: string;
  city: string;
  postal_code: string;
};
