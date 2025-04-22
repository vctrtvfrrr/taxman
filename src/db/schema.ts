import { pgTable, text, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email"),
  createdAt: timestamp("createdAt", { withTimezone: true }),
  emailVerified: boolean("emailVerified").notNull().default(false),
});

export const subscription = pgTable("subscription", {
  userId: text("userId")
    .primaryKey()
    .references(() => user.id),
  autoRenew: boolean("autoRenew"),
  expireDate: timestamp("expireDate", { withTimezone: true }).notNull(),
  plan: text("plan"),
  planCycle: text("planCycle"),
  providerName: text("providerName"),
  providerData: jsonb("providerData"),
  createdAt: timestamp("createdAt", { withTimezone: true })
    .notNull()
    .defaultNow(),
  isTrial: boolean("isTrial").notNull().default(false),
  lastSubscribedAt: timestamp("lastSubscribedAt", { withTimezone: true }),
});

export type User = typeof user.$inferSelect;
export type Subscription = typeof subscription.$inferSelect;
