// Get elements
const loginForm = document.getElementById('loginForm');
const toast = document.getElementById('toast');
const forgotPasswordLink = document.getElementById('forgotPassword');

// Handle forgot password click (non-functional as per requirements)
forgotPasswordLink.addEventListener('click', function(e) {
    e.preventDefault();
    showToast('Password reset functionality coming soon', 'error');
});

// Validation helper functions
function showError(input, message) {
    const formGroup = input.closest('.form-group');
    const errorElement = formGroup.querySelector('.error-message');
    errorElement.textContent = message;
    input.classList.add('error');
}

function clearError(input) {
    const formGroup = input.closest('.form-group');
    const errorElement = formGroup.querySelector('.error-message');
    errorElement.textContent = '';
    input.classList.remove('error');
}

function validateRequired(input, fieldName) {
    const value = input.value.trim();
    if (!value) {
        showError(input, `${fieldName} is required`);
        return false;
    }
    clearError(input);
    return true;
}

// Show toast notification
function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = `toast ${type} show`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 5000);
}

// Login form submission
loginForm.addEventListener('submit', function(e) {
    e.preventDefault();

    let isValid = true;

    // Get input fields
    const emailOrUsername = document.getElementById('emailOrUsername');
    const password = document.getElementById('password');

    // Validate fields
    isValid = validateRequired(emailOrUsername, 'Email or Username') && isValid;
    isValid = validateRequired(password, 'Password') && isValid;

    if (!isValid) {
        showToast('Please fill in all required fields', 'error');
        return;
    }

    // Collect form data
    const formData = {
        emailOrUsername: emailOrUsername.value.trim(),
        password: password.value
    };

    // Log to console (demo mode)
    console.log('Login Data:', formData);

    // Show success message
    showToast('Logged in (demo)', 'success');

    // Reset form after a delay
    setTimeout(() => {
        loginForm.reset();
    }, 1500);
});

// Real-time validation on blur
document.getElementById('emailOrUsername').addEventListener('blur', function() {
    validateRequired(this, 'Email or Username');
});

document.getElementById('password').addEventListener('blur', function() {
    validateRequired(this, 'Password');
});

// Clear errors on input
document.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', function() {
        if (this.classList.contains('error')) {
            clearError(this);
        }
    });
});
