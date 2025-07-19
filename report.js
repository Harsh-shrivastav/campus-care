// report.js

document.addEventListener('DOMContentLoaded', () => {
    const reportForm = document.getElementById('report-form');
    const backButton = document.getElementById('back-button');
    const issueTypeSelect = document.getElementById('issueType');
    const facilityIdInput = document.getElementById('facility_id');
    const descriptionTextarea = document.getElementById('description');
    const submitButton = document.getElementById('submit-report-button');
    const successAlert = document.getElementById('success-alert');
    const submitErrorAlert = document.getElementById('submit-error-alert');

    const issueTypes = [
        { value: "dirty_restroom", label: "Dirty restroom" },
        { value: "overflowing_bin", label: "Overflowing bin" },
        { value: "no_dispenser", label: "No dispenser" },
        { value: "no_water", label: "No water" },
        { value: "safety_concern", label: "Safety concern" },
        { value: "other", label: "Other" },
    ];

    // Populate issue types
    issueTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type.value;
        option.textContent = type.label;
        issueTypeSelect.appendChild(option);
    });



    // Validation Service (simplified version of ReportValidationService)
    const ReportValidationService = {
        validateReport: (data) => {
            const errors = {};


            if (!data.issue_type || data.issue_type.trim() === "") {
                errors.issue_type = "Please select an issue type";
            }
            if (!data.facility_id || data.facility_id.trim() === "") {
                errors.facility_id = "Facility ID is required";
            }

            if (data.description && data.description.trim().length > 1000) {
                errors.description = "Description must be less than 1000 characters";
            }

            return {
                isValid: Object.keys(errors).length === 0,
                errors: errors,
            };
        },
        sanitizeInput: (input) => {
            return input
                .trim()
                .replace(/[<>]/g, "")
                .replace(/\s+/g, " ");
        }
    };

    // Helper to display errors
    const displayError = (field, message) => {
        const errorElement = document.getElementById(`${field}-error`);
        if (errorElement) {
            errorElement.querySelector('span').textContent = message;
            errorElement.style.display = 'flex';
            document.getElementById(field).classList.add('error');
        }
    };

    // Helper to clear errors
    const clearErrors = () => {
        document.querySelectorAll('.error-message').forEach(el => {
            el.style.display = 'none';
            el.querySelector('span').textContent = '';
        });
        document.querySelectorAll('.input-field, .textarea-field, .select-trigger').forEach(el => {
            el.classList.remove('error');
        });
        submitErrorAlert.style.display = 'none';
        submitErrorAlert.querySelector('p').textContent = '';
    };

    // Event Listeners for input changes to clear errors
    issueTypeSelect.addEventListener('change', () => {
        if (document.getElementById('issueType-error').style.display !== 'none') {
            displayError('issueType', ''); // Clear the error message
            document.getElementById('issueType-error').style.display = 'none';
            issueTypeSelect.classList.remove('error');
        }
    });


    facilityIdInput.addEventListener('change', () => {
        if (document.getElementById('facility_id-error').style.display !== 'none') {
            displayError('facility_id', ''); // Clear the error message
            document.getElementById('facility_id-error').style.display = 'none';
            facilityIdInput.classList.remove('error');
        }
    });

    descriptionTextarea.addEventListener('input', () => {
        if (document.getElementById('description-error').style.display !== 'none') {
            displayError('description', ''); // Clear the error message
            document.getElementById('description-error').style.display = 'none';
            descriptionTextarea.classList.remove('error');
        }
    });

    // Helper to get query parameter from URL
    function getQueryParam(param) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    }

    // Facility ID to Location mapping
    const facilityLocationMap = {
        "79439ae2-5361-4332-9832-d1569aafb861": "Hygiene Station - Sports Complex",
        "8c53dd4e-8d97-4b1f-885f-76078bf9fac6": "Girls' Washroom - Main Block 1F",
        "e76dbc24-c029-4ed6-8a5b-86e7c8ef95ce": "Sanitary Pad Dispenser - Library"
    };
    const locationDisplay = document.getElementById('location-display');

    function updateLocationDisplay() {
        const selectedFacilityId = facilityIdInput.value;
        locationDisplay.value = facilityLocationMap[selectedFacilityId] || '';
    }

    facilityIdInput.addEventListener('change', updateLocationDisplay);

    // Autofill facility from QR code link
    const facilityIdFromQR = getQueryParam('facility_id');
    if (facilityIdFromQR) {
        facilityIdInput.value = facilityIdFromQR;
        facilityIdInput.dispatchEvent(new Event('change'));
    } else {
        updateLocationDisplay(); // Set location if facility is pre-selected
    }


    // Form Submission
    reportForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearErrors();
        submitButton.disabled = true;
        submitButton.textContent = 'Submitting...';
        successAlert.style.display = 'none';

        const formData = {
            issue_type: issueTypeSelect.value,
            facility_id: facilityIdInput.value,
            description: descriptionTextarea.value,
        };

        const validationResult = ReportValidationService.validateReport(formData);

        if (!validationResult.isValid) {
            for (const field in validationResult.errors) {
                displayError(field, validationResult.errors[field]);
            }
            submitButton.disabled = false;
            submitButton.textContent = 'Submit Report';
            return;
        }

        try {
            // Sanitize data before sending to backend
            const sanitizedData = {
                issue_type: ReportValidationService.sanitizeInput(formData.issue_type),
                facility_id: ReportValidationService.sanitizeInput(formData.facility_id),
                description: formData.description ? ReportValidationService.sanitizeInput(formData.description) : undefined,
            };

            // Send data to backend to insert into Supabase
            const response = await fetch('http://localhost:3001/api/issues', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(sanitizedData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to submit issue.');
            }

            successAlert.style.display = 'flex';
            setTimeout(() => {
                alert('Report submitted successfully!');
                window.location.href = 'index.html'; // Redirect to home page
            }, 1000);

            // Reset form after successful submission
            reportForm.reset();
            issueTypeSelect.value = ""; // Explicitly reset select

        } catch (error) {
            console.error("Error submitting issue:", error);
            let errorMessage = 'An unexpected error occurred. Please try again.';
            
            // Provide more specific error messages
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                errorMessage = 'Network error: Unable to connect to server. Please check your internet connection and try again.';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            submitErrorAlert.querySelector('p').textContent = errorMessage;
            submitErrorAlert.style.display = 'flex';
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Submit Report';
        }
    });

    // Back button navigation
    backButton.addEventListener('click', () => {
        window.location.href = 'index.html';
    });

    // No local reports to load
}); 