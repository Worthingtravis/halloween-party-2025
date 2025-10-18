export const ERROR_MESSAGES: Record<string, string> = {
  NETWORK_ERROR: "Can't connect right now. Check your internet and try again.",
  VOTING_CLOSED: "Voting hasn't opened yet. Check back soon!",
  VOTING_ENDED: 'Voting has closed. Check the results page!',
  INVALID_FILE_TYPE: 'Please upload a JPG, PNG, or WEBP image.',
  FILE_TOO_LARGE: 'Image is too large. Please use a photo under 6MB.',
  CAMERA_DENIED: 'Camera access denied. You can upload a photo instead.',
  RATE_LIMITED: 'Slow down! Too many requests. Wait a moment and try again.',
  INVALID_ATTENDEE: 'Invalid attendee. Please register first.',
  INVALID_REGISTRATION: 'Registration not found.',
  MISSING_FIELDS: 'Please fill in all required fields.',
  UNKNOWN_ERROR: 'Something went wrong. Please try again.',
};

export function getUserFriendlyMessage(code?: string): string {
  if (!code) return ERROR_MESSAGES.UNKNOWN_ERROR;
  return ERROR_MESSAGES[code] || ERROR_MESSAGES.UNKNOWN_ERROR;
}

