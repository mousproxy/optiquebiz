export const companySelect = {
  id: true,
  name: true,
  currency: true,
  logo_url: true,
  subscriptions: {
    select: {
      status: true,
      trial_ends_at: true,
      plans: { select: { key: true, name: true, modules: true } },
    },
  },
} as const;

export const serializeCompany = (company: any) => {
  if (!company) return null;
  const { subscriptions, ...rest } = company;
  return {
    ...rest,
    subscription: subscriptions
      ? {
          planKey: subscriptions.plans.key,
          planName: subscriptions.plans.name,
          status: subscriptions.status,
          modules: subscriptions.plans.modules,
          trialEndsAt: subscriptions.trial_ends_at,
        }
      : null,
  };
};
