// Validation patterns
const patterns = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    // E.164 format or US format (xxx) xxx-xxxx or xxx-xxx-xxxx
    phone: /^(\+?[1-9]\d{1,14}|(\(\d{3}\)\s?|\d{3}[-\s]?)\d{3}[-\s]?\d{4})$/,
    // At least 8 chars, one letter and one number
    password: /^(?=.*[A-Za-z])(?=.*\d).{8,}$/,
    // Minimum 2 words
    fullName: /^[A-Za-z]+(?:\s+[A-Za-z]+)+$/
};

// Get elements
const userSignupBtn = document.getElementById('userSignupBtn');
const buddySignupBtn = document.getElementById('buddySignupBtn');
const userFormContainer = document.getElementById('userFormContainer');
const buddyFormContainer = document.getElementById('buddyFormContainer');
const userSignupForm = document.getElementById('userSignupForm');
const buddySignupForm = document.getElementById('buddySignupForm');
const toast = document.getElementById('toast');

// Bio character counter
const buddyBioField = document.getElementById('buddyBio');
const bioCharCount = document.getElementById('bioCharCount');

if (buddyBioField) {
    buddyBioField.addEventListener('input', function() {
        bioCharCount.textContent = this.value.length;
    });
}

// Toggle form visibility
userSignupBtn.addEventListener('click', function() {
    if (userFormContainer.classList.contains('active')) {
        userFormContainer.classList.remove('active');
    } else {
        userFormContainer.classList.add('active');
        buddyFormContainer.classList.remove('active');
    }
});

buddySignupBtn.addEventListener('click', function() {
    if (buddyFormContainer.classList.contains('active')) {
        buddyFormContainer.classList.remove('active');
    } else {
        buddyFormContainer.classList.add('active');
        userFormContainer.classList.remove('active');
    }
});

// Photo preview for buddy
const buddyPhotoInput = document.getElementById('buddyPhoto');
const photoPreview = document.getElementById('photoPreview');

if (buddyPhotoInput) {
    buddyPhotoInput.addEventListener('change', function() {
        const file = this.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                photoPreview.innerHTML = `<img src="${e.target.result}" alt="Profile photo preview">`;
            };
            reader.readAsDataURL(file);
        } else {
            photoPreview.innerHTML = '';
        }
    });
}

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

function validateEmail(input) {
    const value = input.value.trim();
    if (!value) {
        showError(input, 'Email is required');
        return false;
    }
    if (!patterns.email.test(value)) {
        showError(input, 'Please enter a valid email address');
        return false;
    }
    clearError(input);
    return true;
}

function validateFullName(input) {
    const value = input.value.trim();
    if (!value) {
        showError(input, 'Full name is required');
        return false;
    }
    if (!patterns.fullName.test(value)) {
        showError(input, 'Please enter at least first and last name');
        return false;
    }
    clearError(input);
    return true;
}

function validatePhone(input, required = false) {
    const value = input.value.trim();
    if (!value && !required) {
        clearError(input);
        return true;
    }
    if (!value && required) {
        showError(input, 'Phone number is required');
        return false;
    }
    if (!patterns.phone.test(value)) {
        showError(input, 'Please enter a valid phone number');
        return false;
    }
    clearError(input);
    return true;
}

function validatePassword(input) {
    const value = input.value;
    if (!value) {
        showError(input, 'Password is required');
        return false;
    }
    if (!patterns.password.test(value)) {
        showError(input, 'Password must be at least 8 characters with one letter and one number');
        return false;
    }
    clearError(input);
    return true;
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

function validateCheckboxGroup(name, fieldName, minRequired = 1) {
    const checkboxes = document.querySelectorAll(`input[name="${name}"]:checked`);
    const formGroup = document.querySelector(`input[name="${name}"]`).closest('.form-group');
    const errorElement = formGroup.querySelector('.error-message');

    if (checkboxes.length < minRequired) {
        errorElement.textContent = `Please select at least ${minRequired} option${minRequired > 1 ? 's' : ''}`;
        return false;
    }
    errorElement.textContent = '';
    return true;
}

function validateRadioGroup(name, fieldName) {
    const radio = document.querySelector(`input[name="${name}"]:checked`);
    const formGroup = document.querySelector(`input[name="${name}"]`).closest('.form-group');
    const errorElement = formGroup.querySelector('.error-message');

    if (!radio) {
        errorElement.textContent = `Please select a ${fieldName}`;
        return false;
    }
    errorElement.textContent = '';
    return true;
}

function validateFile(input, required = false, maxSizeMB = 5) {
    const file = input.files[0];

    if (!file && !required) {
        clearError(input);
        return true;
    }

    if (!file && required) {
        showError(input, 'This file is required');
        return false;
    }

    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
        showError(input, `File size must be less than ${maxSizeMB}MB`);
        return false;
    }

    clearError(input);
    return true;
}

function validateCheckbox(input, message) {
    const formGroup = input.closest('.form-group');
    const errorElement = formGroup.querySelector('.error-message');

    if (!input.checked) {
        errorElement.textContent = message;
        return false;
    }
    errorElement.textContent = '';
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

// User form submission
userSignupForm.addEventListener('submit', function(e) {
    e.preventDefault();

    let isValid = true;

    // Validate all fields
    const fullName = document.getElementById('userFullName');
    const email = document.getElementById('userEmail');
    const phone = document.getElementById('userPhone');
    const password = document.getElementById('userPassword');
    const location = document.getElementById('userLocation');
    const emergencyPhone = document.getElementById('userEmergencyPhone');
    const photo = document.getElementById('userPhoto');
    const terms = document.getElementById('userTerms');

    isValid = validateFullName(fullName) && isValid;
    isValid = validateEmail(email) && isValid;
    isValid = validatePhone(phone, false) && isValid;
    isValid = validatePassword(password) && isValid;
    isValid = validateRequired(location, 'City / Postal Code') && isValid;
    isValid = validateCheckboxGroup('walkingTimes', 'Walking Times', 1) && isValid;
    isValid = validateRadioGroup('walkingPace', 'Walking Pace') && isValid;

    // Emergency phone is optional but must be valid if provided
    if (emergencyPhone.value.trim()) {
        isValid = validatePhone(emergencyPhone, false) && isValid;
    }

    isValid = validateFile(photo, false, 5) && isValid;
    isValid = validateCheckbox(terms, 'You must agree to the terms') && isValid;

    if (!isValid) {
        showToast('Please fix the errors in the form', 'error');
        return;
    }

    // Collect form data
    const formData = {
        role: 'user',
        fullName: fullName.value.trim(),
        email: email.value.trim(),
        phone: phone.value.trim() || null,
        password: password.value,
        location: location.value.trim(),
        walkingTimes: Array.from(document.querySelectorAll('input[name="walkingTimes"]:checked'))
            .map(cb => cb.value),
        walkingPace: document.querySelector('input[name="walkingPace"]:checked').value,
        emergencyContact: {
            name: document.getElementById('userEmergencyName').value.trim() || null,
            phone: emergencyPhone.value.trim() || null
        },
        hasPhoto: photo.files.length > 0,
        agreedToTerms: true
    };

    // Log to console (demo mode)
    console.log('User Signup Data:', formData);

    // Show success message
    showToast('Account created (demo)', 'success');

    // Reset form
    setTimeout(() => {
        userSignupForm.reset();
        userFormContainer.classList.remove('active');
    }, 1500);
});

// Buddy form submission
buddySignupForm.addEventListener('submit', function(e) {
    e.preventDefault();

    let isValid = true;

    // Validate all fields
    const fullName = document.getElementById('buddyFullName');
    const email = document.getElementById('buddyEmail');
    const phone = document.getElementById('buddyPhone');
    const password = document.getElementById('buddyPassword');
    const walkingArea = document.getElementById('buddyArea');
    const photo = document.getElementById('buddyPhoto');
    const govId = document.getElementById('buddyGovId');
    const backgroundCheck = document.getElementById('buddyBackgroundCheck');
    const proofAddress = document.getElementById('buddyProofAddress');

    isValid = validateFullName(fullName) && isValid;
    isValid = validateEmail(email) && isValid;
    isValid = validatePhone(phone, true) && isValid;
    isValid = validatePassword(password) && isValid;
    isValid = validateRequired(walkingArea, 'Primary Walking Area') && isValid;

    // Validate availability (at least one day and one time)
    const daysValid = validateCheckboxGroup('availabilityDays', 'Availability Days', 1);
    const timesValid = validateCheckboxGroup('availabilityTimes', 'Availability Times', 1);
    isValid = daysValid && timesValid && isValid;

    // Show specific error if only one is missing
    if (!daysValid || !timesValid) {
        const formGroup = document.querySelector('input[name="availabilityDays"]').closest('.form-group');
        const errorElement = formGroup.querySelector('.error-message');
        if (!daysValid && !timesValid) {
            errorElement.textContent = 'Please select at least one day and one time';
        } else if (!daysValid) {
            errorElement.textContent = 'Please select at least one day';
        } else {
            errorElement.textContent = 'Please select at least one time of day';
        }
    }

    isValid = validateCheckboxGroup('walkingPaces', 'Walking Paces', 1) && isValid;
    isValid = validateFile(photo, true, 5) && isValid;
    isValid = validateFile(govId, true, 5) && isValid;
    isValid = validateFile(backgroundCheck, true, 5) && isValid;
    isValid = validateFile(proofAddress, true, 5) && isValid;

    if (!isValid) {
        showToast('Please fix the errors in the form', 'error');
        return;
    }

    // Collect form data
    const formData = {
        role: 'buddy',
        fullName: fullName.value.trim(),
        email: email.value.trim(),
        phone: phone.value.trim(),
        password: password.value,
        walkingArea: walkingArea.value.trim(),
        availability: {
            days: Array.from(document.querySelectorAll('input[name="availabilityDays"]:checked'))
                .map(cb => cb.value),
            times: Array.from(document.querySelectorAll('input[name="availabilityTimes"]:checked'))
                .map(cb => cb.value)
        },
        walkingPaces: Array.from(document.querySelectorAll('input[name="walkingPaces"]:checked'))
            .map(cb => cb.value),
        bio: document.getElementById('buddyBio').value.trim() || null,
        hasPhoto: true,
        documents: {
            governmentId: govId.files[0].name,
            backgroundCheck: backgroundCheck.files[0].name,
            proofOfAddress: proofAddress.files[0].name
        }
    };

    // Log to console (demo mode)
    console.log('Buddy Application Data:', formData);

    // Show success message
    showToast('Account created (demo)', 'success');

    // Reset form
    setTimeout(() => {
        buddySignupForm.reset();
        photoPreview.innerHTML = '';
        bioCharCount.textContent = '0';
        buddyFormContainer.classList.remove('active');
    }, 1500);
});

// Real-time validation on blur
document.querySelectorAll('input[type="email"]').forEach(input => {
    input.addEventListener('blur', () => validateEmail(input));
});

document.querySelectorAll('input[type="tel"]').forEach(input => {
    const isRequired = input.hasAttribute('required');
    input.addEventListener('blur', () => validatePhone(input, isRequired));
});

document.querySelectorAll('input[type="password"]').forEach(input => {
    input.addEventListener('blur', () => validatePassword(input));
});

document.querySelectorAll('#userFullName, #buddyFullName').forEach(input => {
    input.addEventListener('blur', () => validateFullName(input));
});
