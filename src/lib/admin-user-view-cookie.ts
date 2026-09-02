// No imports here on purpose — this constant is shared with `proxy.ts`,
// which runs on the Edge runtime and can't pull in Node-only code (bcrypt,
// the DB client, etc.) that `requireAdmin()` and friends depend on.
export const ADMIN_USER_VIEW_COOKIE = "admin_user_view";
