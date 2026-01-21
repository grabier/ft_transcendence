export const validateEmail = (email: string): string => {
    if (!email) return "Email is required";
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return "Please enter a valid email address";
    }
    
    return "";
};

export const validatePassword = (password: string): string => {
    if (!password) return "Password is required";
    
    if (password.length < 8) {
        return "Password must be at least 8 characters";
    }

	if (!/[A-Z]/.test(password)) {
        return "Password must include at least one uppercase letter";
    }

    if (!/\d/.test(password)) {
        return "Password must include at least one number";
    }

    const symbolRegex = /[^A-Za-z0-9]/;
    if (!symbolRegex.test(password)) {
        return "Password must include at least one symbol (e.g., @, #, $, %)";
    }
    
return "";
};

export const validateUsername = (username: string): string => {
    if (!username) return "Username is required";

    if (username.length < 3 || username.length > 16) {
        return "Username must be at least 3 characters and less than 16 characters";
    }
	const alphanumericRegex = /^[a-zA-Z0-9]+$/;
    
    if (!alphanumericRegex.test(username)) {
		return "Username must contain only alphanumeric characters and underscores";
	}

    return "";
};
/* TODO: Add this latter


export const validatePasswordMatch = (password: string, confirmPassword: string): string => {
    if (!confirmPassword) return "";
    
    if (password !== confirmPassword) {
        return "Passwords do not match";
    }
    
    return "";
};
*/