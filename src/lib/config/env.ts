type EnvVar = {
  name: string;
  required: boolean;
  description: string;
};

const ENV_VARS: EnvVar[] = [
  { name: "DATABASE_URL", required: true, description: "PostgreSQL connection string" },
  { name: "NEXTAUTH_SECRET", required: true, description: "NextAuth.js secret" },
  { name: "NEXTAUTH_URL", required: true, description: "App base URL for NextAuth" },
  { name: "STRIPE_SECRET_KEY", required: true, description: "Stripe secret key" },
  { name: "STRIPE_WEBHOOK_SECRET", required: true, description: "Stripe webhook signing secret" },
  { name: "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", required: true, description: "Stripe publishable key" },
  { name: "NEXT_PUBLIC_APP_URL", required: false, description: "Public app URL" },
  { name: "SENDGRID_API_KEY", required: false, description: "SendGrid API key for emails" },
  { name: "EMAIL_FROM", required: false, description: "From email address" },
  { name: "MUX_TOKEN_ID", required: false, description: "Mux API token ID" },
  { name: "MUX_TOKEN_SECRET", required: false, description: "Mux API token secret" },
  { name: "ENCRYPTION_KEY", required: false, description: "AES-256 encryption key (64 hex chars)" },
  { name: "UPSTASH_REDIS_REST_URL", required: false, description: "Upstash Redis URL for rate limiting" },
  { name: "UPSTASH_REDIS_REST_TOKEN", required: false, description: "Upstash Redis token" },
];

export function validateEnv(): { valid: boolean; missing: string[]; warnings: string[] } {
  const missing: string[] = [];
  const warnings: string[] = [];

  for (const envVar of ENV_VARS) {
    const value = process.env[envVar.name];
    if (!value || value === "") {
      if (envVar.required) {
        missing.push(`${envVar.name} — ${envVar.description}`);
      } else {
        warnings.push(`${envVar.name} — ${envVar.description}`);
      }
    }
  }

  return { valid: missing.length === 0, missing, warnings };
}

/**
 * Call at server startup to validate required env vars.
 * Logs warnings for optional missing vars.
 */
export function checkEnvOnStartup(): void {
  const { valid, missing, warnings } = validateEnv();

  if (!valid) {
    console.error("Missing required environment variables:");
    missing.forEach((m) => console.error(`  - ${m}`));
    if (process.env.NODE_ENV === "production") {
      throw new Error(`Missing required environment variables: ${missing.map(m => m.split(" — ")[0]).join(", ")}`);
    }
  }

  if (warnings.length > 0) {
    console.warn("Optional environment variables not set (some features may be disabled):");
    warnings.forEach((w) => console.warn(`  - ${w}`));
  }
}
