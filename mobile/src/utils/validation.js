export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password) => {
  return password.length >= 6;
};

export const getValidationError = (field, value) => {
  switch (field) {
    case 'email':
      if (!value) return 'Email is required';
      if (!validateEmail(value)) return 'Invalid email format';
      return '';
    case 'password':
      if (!value) return 'Password is required';
      if (!validatePassword(value)) return 'Password must be at least 6 characters';
      return '';
    default:
      return '';
  }
};