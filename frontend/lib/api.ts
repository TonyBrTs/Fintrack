/**
 * Common headers for all API requests.
 * Includes ngrok skip warning header if configured in environment variables.
 */
export const getApiHeaders = (extraHeaders: Record<string, string> = {}) => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...extraHeaders,
  };

  // Only add the ngrok skip warning if explicitly enabled for local testing
  if (process.env.NEXT_PUBLIC_NGROK_SKIP_WARNING === "true") {
    headers["ngrok-skip-browser-warning"] = "true";
  }

  return headers;
};
