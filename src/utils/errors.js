// Turns API and network errors into short messages for the UI. The API envelope is
// { error: { code, message, details: [{ field, reason }] } } and never contains stack traces.

// Returns the API error object of an axios error, or null.
export function getApiError(error) {
  return error?.response?.data?.error ?? null;
}

// Returns a human-readable message for any error thrown by the API layer.
export function getErrorMessage(error) {
  const apiError = getApiError(error);
  if (apiError) {
    const fields = (apiError.details ?? []).map((detail) => `${detail.field}: ${detail.reason}`).join(', ');
    return fields ? `${apiError.message} (${fields})` : apiError.message;
  }
  if (error?.request && !error?.response) {
    return `Cannot reach the API at ${import.meta.env.VITE_API_URL}. Is the backend running?`;
  }
  return error?.message ?? 'Something went wrong.';
}

// Returns { field: reason } for validation errors, so forms can show messages next to inputs.
export function getFieldErrors(error) {
  const details = getApiError(error)?.details ?? [];
  return Object.fromEntries(details.map((detail) => [detail.field, detail.reason]));
}
