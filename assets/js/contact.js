// Contact Form Integration with MailerSend, Supabase, and reCAPTCHA
document.addEventListener('DOMContentLoaded', function() {
    // Configuration - Replace with your actual keys
    const CONFIG = {
        SUPABASE_URL: 'https://your-project.supabase.co', // Replace with your Supabase URL
        SUPABASE_ANON_KEY: 'your-supabase-anon-key', // Replace with your Supabase anon key
        MAILERSEND_API_KEY: 'mlsn.52acc0fefa865872fc1b4853a3216835aad3b539ff5b79fb7f41388b202fff45', // Replace with your MailerSend API key
        MAILERSEND_FROM_EMAIL: 'noreply@demcode.com',
        MAILERSEND_TO_EMAIL: 'demcodedevelopment@gmail.com'
    };

    // Initialize Supabase client
    const supabase = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

    // Form elements
    const form = document.getElementById('contact-form');
    const submitBtn = document.getElementById('submit-btn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoading = submitBtn.querySelector('.btn-loading');
    const formSuccess = document.getElementById('form-success');
    const formError = document.getElementById('form-error');

    // Form validation
    const validators = {
        name: (value) => {
            if (!value.trim()) return 'Name is required';
            if (value.trim().length < 2) return 'Name must be at least 2 characters';
            return null;
        },
        email: (value) => {
            if (!value.trim()) return 'Email is required';
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) return 'Please enter a valid email address';
            return null;
        },
        service: (value) => {
            if (!value) return 'Please select a service';
            return null;
        },
        message: (value) => {
            if (!value.trim()) return 'Project details are required';
            if (value.trim().length < 10) return 'Please provide more details about your project';
            return null;
        }
    };

    // reCAPTCHA removed — no initialization required

    // Validate form field
    function validateField(fieldName, value) {
        const validator = validators[fieldName];
        if (!validator) return null;
        
        const error = validator(value);
        const errorElement = document.getElementById(`${fieldName}-error`);
        
        if (error) {
            errorElement.textContent = error;
            errorElement.style.display = 'block';
            return false;
        } else {
            errorElement.textContent = '';
            errorElement.style.display = 'none';
            return true;
        }
    }

    // Validate entire form
    function validateForm(formData) {
        let isValid = true;
        
        Object.keys(validators).forEach(fieldName => {
            const value = formData.get(fieldName) || '';
            if (!validateField(fieldName, value)) {
                isValid = false;
            }
        });

        // reCAPTCHA removed — skip captcha validation

        return isValid;
    }

    // Show loading state
    function showLoading() {
        submitBtn.disabled = true;
        btnText.style.display = 'none';
        btnLoading.style.display = 'inline';
        formSuccess.style.display = 'none';
        formError.style.display = 'none';
    }

    // Hide loading state
    function hideLoading() {
        submitBtn.disabled = false;
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
    }

    // Show success message
    function showSuccess() {
        formSuccess.style.display = 'block';
        formError.style.display = 'none';
        form.reset();
    }

    // Show error message
    function showError() {
        formError.style.display = 'block';
        formSuccess.style.display = 'none';
    }

    // Save to Supabase
    async function saveToSupabase(formData) {
        try {
            const contactData = {
                name: formData.get('name'),
                email: formData.get('email'),
                service: formData.get('service'),
                message: formData.get('message'),
                created_at: new Date().toISOString()
            };

            const { data, error } = await supabase
                .from('contact_submissions')
                .insert([contactData]);

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Supabase error:', error);
            throw error;
        }
    }

    // Send email via MailerSend
    async function sendEmail(formData) {
        try {
            const emailData = {
                from: {
                    email: CONFIG.MAILERSEND_FROM_EMAIL,
                    name: "DemCode Contact Form"
                },
                to: [
                    {
                        email: CONFIG.MAILERSEND_TO_EMAIL,
                        name: "DemCode Team"
                    }
                ],
                subject: `New Contact Form Submission from ${formData.get('name')}`,
                html: `
                    <h2>New Contact Form Submission</h2>
                    <p><strong>Name:</strong> ${formData.get('name')}</p>
                    <p><strong>Email:</strong> ${formData.get('email')}</p>
                    <p><strong>Service:</strong> ${formData.get('service')}</p>
                    <h3>Project Details:</h3>
                    <p>${formData.get('message').replace(/\n/g, '<br>')}</p>
                `,
                text: `
                    New Contact Form Submission
                    
                    Name: ${formData.get('name')}
                    Email: ${formData.get('email')}
                    Service: ${formData.get('service')}
                    
                    Project Details:
                    ${formData.get('message')}
                `
            };

            const response = await fetch('https://api.mailersend.com/v1/email', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${CONFIG.MAILERSEND_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(emailData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to send email');
            }

            return await response.json();
        } catch (error) {
            console.error('MailerSend error:', error);
            throw error;
        }
    }

    // Handle form submission
    async function handleSubmit(event) {
        event.preventDefault();
        
        const formData = new FormData(form);
        
        // Validate form
        if (!validateForm(formData)) {
            return;
        }

        showLoading();

        try {
            // reCAPTCHA removed — proceed without captcha

            // Save to Supabase
            await saveToSupabase(formData);
            console.log('Data saved to Supabase');

            // Send email via MailerSend
            await sendEmail(formData);
            console.log('Email sent via MailerSend');

            // Show success message
            hideLoading();
            showSuccess();
            
        } catch (error) {
            console.error('Form submission error:', error);
            hideLoading();
            showError();
        }
    }

    // Add real-time validation
    function addRealTimeValidation() {
        Object.keys(validators).forEach(fieldName => {
            const field = document.getElementById(fieldName);
            if (field) {
                field.addEventListener('blur', function() {
                    validateField(fieldName, this.value);
                });
                
                field.addEventListener('input', function() {
                    // Clear error on input
                    const errorElement = document.getElementById(`${fieldName}-error`);
                    if (errorElement.textContent) {
                        errorElement.textContent = '';
                        errorElement.style.display = 'none';
                    }
                });
            }
        });
    }

    // Initialize everything
    function init() {
        // Add form event listener
        form.addEventListener('submit', handleSubmit);
        
        // Add real-time validation
        addRealTimeValidation();
        
        console.log('Contact form initialized');
    }

    // Start initialization
    init();
});
