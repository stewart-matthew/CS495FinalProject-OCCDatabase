// Phone number validation utility
// Validates US phone numbers in various formats: (123) 456-7890, 123-456-7890, 123.456.7890, 1234567890, etc.
export const validatePhoneNumber = (phone) => {
  // Normalize input to string to handle numbers (bigint) coming from DB
  const phoneStr = phone == null ? "" : String(phone);
  if (!phoneStr || phoneStr.trim() === '') return true; // Allow empty (optional field)

  // Remove all non-digit characters
  const digitsOnly = phoneStr.replace(/\D/g, '');
  
  // US phone numbers should have 10 digits (or 11 if starting with 1)
  if (digitsOnly.length === 10 || (digitsOnly.length === 11 && digitsOnly[0] === '1')) {
    return true;
  }
  
  return false;
};

// Format phone number for display (optional, can be used for consistent formatting)
export const formatPhoneNumber = (phone) => {
  if (phone == null) return '';
  const phoneStr = String(phone);
  const digitsOnly = phoneStr.replace(/\D/g, '');
  
  if (digitsOnly.length === 10) {
    return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6)}`;
  }
  
  return phone; // Return original if not 10 digits
};

