const FRIENDLY_AUTH_MESSAGES = {
  'auth/invalid-email': 'That email address is not valid.',
  'auth/user-disabled': 'This account has been disabled. Contact support.',
  'auth/user-not-found': 'No account found with that email.',
  'auth/wrong-password': 'Incorrect email or password.',
  'auth/invalid-credential': 'Incorrect email or password.',
  'auth/email-already-in-use': 'That email is already registered. Try logging in instead.',
  'auth/weak-password': 'Please choose a stronger password (at least 6 characters).',
  'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
  'auth/network-request-failed': 'Network error. Check your connection and try again.',
  'auth/popup-closed-by-user': 'Sign-in was cancelled.',
  'auth/invalid-phone-number': 'That phone number is not valid.',
  'auth/invalid-verification-code': 'The OTP you entered is incorrect.',
  'auth/code-expired': 'That OTP has expired. Please request a new one.',
  'auth/missing-phone-number': 'Please enter a phone number.',
  'auth/quota-exceeded': 'SMS quota reached. Please try again later.',
};

export function friendlyAuthError(err, fallback = 'Something went wrong. Please try again.') {
  if (!err) return fallback;
  return FRIENDLY_AUTH_MESSAGES[err.code] || fallback;
}
