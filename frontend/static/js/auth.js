const API_URL = 'http://localhost:5000';

// Login functionality
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const button = e.target.querySelector('button');
        button.classList.add('loading');

        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('userId', data.user_id);
            window.location.href = 'index.html';
        } else {
            showError(data.error);
        }
    } catch (error) {
        showError('An error occurred during login');
    } finally {
        button.classList.remove('loading');
    }
});

// Registration functionality
document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const name = document.getElementById('name').value;
    const gender = document.getElementById('gender').value;

    // Clear previous error messages
    clearErrors();

    // Validate form
    if (!validateRegistrationForm(email, password, confirmPassword, name, gender)) {
        return;
    }

    try {
        const button = e.target.querySelector('button');
        button.classList.add('loading');
        button.textContent = 'Registering...';

        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email,
                password,
                name,
                gender
            })
        });

        const data = await response.json();

        if (response.ok) {
            // Show success message
            showSuccess('Registration successful! Redirecting to login...');
            
            // Redirect to login page after 2 seconds
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        } else {
            showError(data.error || 'Registration failed');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showError('An error occurred during registration');
    } finally {
        const button = e.target.querySelector('button');
        button.classList.remove('loading');
        button.textContent = 'Register';
    }
});

function validateRegistrationForm(email, password, confirmPassword, name, gender) {
    let isValid = true;

    // Email validation
    if (!isValidEmail(email)) {
        showError('Please enter a valid email address', 'email');
        isValid = false;
    }

    // Password validation
    if (!isPasswordStrong(password)) {
        showError('Password must be at least 8 characters long and contain letters, numbers, and special characters', 'password');
        isValid = false;
    }

    // Confirm password
    if (password !== confirmPassword) {
        showError('Passwords do not match', 'confirmPassword');
        isValid = false;
    }

    // Name validation
    if (name.trim().length < 2) {
        showError('Please enter a valid name', 'name');
        isValid = false;
    }

    // Gender validation
    if (!gender) {
        showError('Please select a gender', 'gender');
        isValid = false;
    }

    return isValid;
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showError(message, fieldId = null) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;

    if (fieldId) {
        const field = document.getElementById(fieldId);
        const existingError = field.parentElement.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        field.parentElement.appendChild(errorDiv);
    } else {
        const form = document.querySelector('form');
        form.insertBefore(errorDiv, form.firstChild);
    }
}

function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    
    const form = document.querySelector('form');
    form.insertBefore(successDiv, form.firstChild);
}

function clearErrors() {
    document.querySelectorAll('.error-message').forEach(error => error.remove());
    document.querySelectorAll('.success-message').forEach(success => success.remove());
}

// Password strength checker
function isPasswordStrong(password) {
    const minLength = 8;
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return password.length >= minLength && hasLetter && hasNumber && hasSpecialChar;
}

// Real-time password strength indicator
document.getElementById('password')?.addEventListener('input', (e) => {
    const password = e.target.value;
    const strengthIndicator = document.createElement('div');
    strengthIndicator.className = 'password-strength';
    
    let strength = 'weak';
    let message = 'Weak';
    
    if (password.length >= 8) {
        const hasLetter = /[a-zA-Z]/.test(password);
        const hasNumber = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        
        if (hasLetter && hasNumber && hasSpecialChar) {
            strength = 'strong';
            message = 'Strong';
        } else if ((hasLetter && hasNumber) || (hasLetter && hasSpecialChar) || (hasNumber && hasSpecialChar)) {
            strength = 'medium';
            message = 'Medium';
        }
    }
    
    strengthIndicator.className = `password-strength strength-${strength}`;
    strengthIndicator.textContent = `Password Strength: ${message}`;
    
    // Update or add the strength indicator
    const existingIndicator = e.target.parentNode.querySelector('.password-strength');
    if (existingIndicator) {
        existingIndicator.replaceWith(strengthIndicator);
    } else {
        e.target.parentNode.appendChild(strengthIndicator);
    }
});

// Confirm password validation
document.getElementById('confirmPassword')?.addEventListener('input', (e) => {
    const password = document.getElementById('password').value;
    const confirmPassword = e.target.value;
    
    if (password !== confirmPassword) {
        e.target.setCustomValidity('Passwords do not match');
    } else {
        e.target.setCustomValidity('');
    }
});

// Logout functionality
document.getElementById('logoutBtn')?.addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    window.location.href = 'login.html';
}); 