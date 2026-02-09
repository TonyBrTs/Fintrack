/**
 * Common headers for all API requests.
 */
export const getApiHeaders = (extraHeaders: Record<string, string> = {}) => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...extraHeaders,
  };

  return headers;
};
