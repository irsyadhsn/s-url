export type UserRole = "user" | "admin";

export type UserPlan = "free" | "premium";

export interface PublicUser {
  id: string;
  email: string;
  role: UserRole;
  /** Effective plan — a lapsed premium period reports as free. */
  plan: UserPlan;
  planExpiresAt: string | null;
  createdAt: string;
}

export interface Link {
  id: string;
  shortCode: string;
  originalUrl: string;
  userId: string;
  clicks: number;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  /** Full short URL (server-composed); older payloads may omit it. */
  shortUrl?: string;
}

export interface DayBucket {
  /** UTC day, YYYY-MM-DD. */
  day: string;
  clicks: number;
}

export interface StatsTotals {
  links: number;
  clicks: number;
  activeLinks: number;
  clicksToday: number;
}

export interface OverviewStats {
  totals: StatsTotals;
  series: DayBucket[];
  topLinks: Link[];
}

export interface LinkStatsDetail {
  totalClicks: number;
  clicksToday: number;
  clicksInRange: number;
  avgPerDay: number;
  peakDayClicks: number;
  daysActive: number;
}

export interface LinkStatsResponse {
  link: Link;
  stats: LinkStatsDetail;
  series: DayBucket[];
}

export interface ListMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
}

export interface ListLinksResponse {
  items: Link[];
  meta: ListMeta;
}

export interface LoginResponse {
  token: string;
  user: PublicUser;
}

export interface RegisterResponse {
  user: PublicUser;
}

export interface AdminUser extends PublicUser {
  linkCount: number;
}

export interface AdminLink extends Link {
  ownerEmail: string | null;
}

export interface ListUsersResponse {
  items: AdminUser[];
  meta: ListMeta;
}

export interface ListAdminLinksResponse {
  items: AdminLink[];
  meta: ListMeta;
}

export interface AdminOverviewTotals {
  users: number;
  admins: number;
  newUsers: number;
  links: number;
  activeLinks: number;
  clicks: number;
  clicksToday: number;
}

export interface AdminOverview {
  totals: AdminOverviewTotals;
  series: DayBucket[];
  topLinks: Link[];
}

export interface ApiErrorBody {
  message: string;
  code: string;
  details?: unknown;
}

/* ------------------------------------------------------------------ *
 * Billing — free/premium plans, simulated payment (no gateway).
 * ------------------------------------------------------------------ */

export interface PlanInfo {
  id: UserPlan;
  name: string;
  priceCents: number;
  currency: string;
  /** null = unlimited (premium). */
  customAliasLimit: number | null;
  /** Length of one paid period; null for free. */
  durationDays: number | null;
  tagline: string;
  features: string[];
}

export interface SubscriptionInfo {
  plan: UserPlan;
  planExpiresAt: string | null;
  /** Whole days left on a premium period; null on free. */
  daysRemaining: number | null;
  customAliasUsed: number;
  customAliasLimit: number | null;
}

export interface PaymentRecord {
  id: string;
  reference: string;
  plan: UserPlan;
  amountCents: number;
  /** Pre-formatted, e.g. "$9.99". */
  amount: string;
  currency: string;
  status: "pending" | "succeeded" | "failed";
  planExpiresAt: string | null;
  createdAt: string;
}

export interface CheckoutResponse {
  receipt: PaymentRecord;
  subscription: SubscriptionInfo;
}
