const defaultFrom = process.env.EMAIL_FROM_ADDRESS
  ? `SafeCheck <${process.env.EMAIL_FROM_ADDRESS}>`
  : 'SafeCheck <onboarding@resend.dev>';

export const EMAIL_FROM = {
  alerts: defaultFrom,
  reminders: defaultFrom,
  digest: defaultFrom,
};
