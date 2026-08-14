import type { PremiumPlanId, UserProfile } from '../types';

export const PREMIUM_PLAN_MONTHS: Record<Exclude<PremiumPlanId, 'free'>, number> = {
  monthly: 1,
  semiannual: 6,
  annual: 12,
};

export function computePremiumExpiry(plan: Exclude<PremiumPlanId, 'free'>, from = new Date()): string {
  const expires = new Date(from);
  const day = expires.getDate();
  expires.setDate(1);
  expires.setMonth(expires.getMonth() + PREMIUM_PLAN_MONTHS[plan]);
  // 1/31 の1ヶ月後が 3/3 に繰り上がらないよう、月末日で丸める
  const lastDayOfMonth = new Date(expires.getFullYear(), expires.getMonth() + 1, 0).getDate();
  expires.setDate(Math.min(day, lastDayOfMonth));
  return expires.toISOString();
}

export function normalizeUserProfile(user: UserProfile): UserProfile {
  const premiumPlan: PremiumPlanId =
    user.premiumPlan ?? (user.isPremium ? 'monthly' : 'free');
  return {
    ...user,
    premiumPlan,
    premiumExpiresAt: user.premiumExpiresAt ?? null,
  };
}

export function withPremiumExpiryCheck(user: UserProfile): UserProfile {
  const normalized = normalizeUserProfile(user);
  if (!normalized.isPremium || normalized.premiumPlan === 'free') return normalized;
  if (!normalized.premiumExpiresAt) return normalized;
  if (new Date(normalized.premiumExpiresAt) > new Date()) return normalized;
  return {
    ...normalized,
    isPremium: false,
    premiumPlan: 'free',
    premiumExpiresAt: null,
    geminiLimit: {
      ...normalized.geminiLimit,
      maxPerDay: 5,
    },
    updatedAt: new Date().toISOString(),
  };
}

export function premiumPlanI18nKey(plan: PremiumPlanId): string {
  switch (plan) {
    case 'monthly':
      return 'settings.premium.planMonthly';
    case 'semiannual':
      return 'settings.premium.planSemiannual';
    case 'annual':
      return 'settings.premium.planAnnual';
    default:
      return 'common.planFree';
  }
}
