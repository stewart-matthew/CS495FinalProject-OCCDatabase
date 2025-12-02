// Phone number validation utility
// Validates US phone numbers in various formats: (123) 456-7890, 123-456-7890, 123.456.7890, 1234567890, etc.
export const validatePhoneNumber = (phone) => {
  if (!phone || phone.trim() === '') return true; // Allow empty (optional field)
  
  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '');
  
  // US phone numbers should have 10 digits (or 11 if starting with 1)
  if (digitsOnly.length === 10 || (digitsOnly.length === 11 && digitsOnly[0] === '1')) {
    return true;
  }
  
  return false;
};

// Format phone number for display (optional, can be used for consistent formatting)
export const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  const digitsOnly = phone.replace(/\D/g, '');
  
  if (digitsOnly.length === 10) {
    return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6)}`;
  }
  
  return phone; // Return original if not 10 digits
};

