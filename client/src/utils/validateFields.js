
/**
 * Validate fields based on the rules provided.
 * @param {Object} validationRules - An object where keys are field names and values are arrays of validation rules.
 * @param {Function} setErrors - A function to set the errors state.
 * @returns {boolean} - Returns true if all fields are valid, false otherwise.
 * 
 * Example usage to ensure a username and password are provided:
 * const validationRules = {
 *   username: [
 *     { condition: !username, message: 'Username is required' },
 *   ],
 *   password: [
 *     { condition: !password, message: 'Password is required' },
 *   ],
 * };
 */
function validateFields(validationRules, setErrors) {
    const newErrors = {};
  
    // Loop over each field => arrayOfRules
    for (const [field, rules] of Object.entries(validationRules)) {
      // Check each rule
      for (const rule of rules) {
        if (rule.condition) {
          // If this rule fails, record the error message
          // and move on (we only record the first error per field)
          newErrors[field] = rule.message;
          break;
        }
      }
    }
  
    // Set the errors in state
    setErrors(newErrors);
  
    // Return whether we have zero errors
    return Object.keys(newErrors).length === 0;
  }

export default validateFields;