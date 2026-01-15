export const validateEmail = (email: string): string => {
    if (!email) return "";
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return "Please enter a valid email address";
    }
    
    return "";
};

/* TODO: Add this latter

export const validatePassword = (password: string): string => {
    if (!password) return "";
    
    if (password.length < 8) {
        return "Password must be at least 8 characters";
    }
    
    return "";
};

export const validatePasswordMatch = (password: string, confirmPassword: string): string => {
    if (!confirmPassword) return "";
    
    if (password !== confirmPassword) {
        return "Passwords do not match";
    }
    
    return "";
};
*/