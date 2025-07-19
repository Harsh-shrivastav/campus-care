// script.js

document.addEventListener('DOMContentLoaded', () => {
    // Header navigation
    const homeButton = document.getElementById('home-button');
    const reportHeaderButton = document.getElementById('report-header-button');
    const reportButton = document.getElementById('report-button');
    const adminLoginButton = document.getElementById('admin-login-button');
    const dashboardButton = document.getElementById('dashboard-button');

    if (homeButton) {
        homeButton.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }
    if (reportHeaderButton) {
        reportHeaderButton.addEventListener('click', () => {
            window.location.href = 'report.html';
        });
    }
    if (reportButton) {
        reportButton.addEventListener('click', () => {
            window.location.href = 'report.html';
        });
    }
    if (dashboardButton) {
        dashboardButton.addEventListener('click', () => {
            window.location.href = 'dashboard.html';
        });
    }

    // Admin Login Modal logic
    const adminModal = document.getElementById('admin-login-modal');
    const adminForm = document.getElementById('admin-login-form');
    const adminCancel = document.getElementById('admin-cancel');
    const adminError = document.getElementById('admin-login-error');
    const adminUsername = document.getElementById('admin-username');
    const adminPassword = document.getElementById('admin-password');

    if (adminLoginButton && adminModal) {
        adminLoginButton.addEventListener('click', () => {
            adminModal.style.display = 'flex';
            adminError.style.display = 'none';
            adminForm.reset();
            adminUsername.focus();
        });
    }
    if (adminCancel && adminModal) {
        adminCancel.addEventListener('click', () => {
            adminModal.style.display = 'none';
        });
    }
    if (adminForm) {
        adminForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = adminUsername.value.trim();
            const password = adminPassword.value;
            if (username === 'admin123' && password === '1234') {
                window.location.href = 'dashboard.html';
            } else {
                adminError.textContent = 'Invalid credentials. Try admin123 / 1234';
                adminError.style.display = 'block';
            }
        });
    }
    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && adminModal && adminModal.style.display === 'flex') {
            adminModal.style.display = 'none';
        }
    });
}); 