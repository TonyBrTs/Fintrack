const VAULT_OWNER_EMAIL = "brts2461@gmail.com";

export function canAccessVault(email: string | undefined) {
  return email?.toLowerCase() === VAULT_OWNER_EMAIL;
}
