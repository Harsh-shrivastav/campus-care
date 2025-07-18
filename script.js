

document.addEventListener('DOMContentLoaded', () => {
    const reportButton = document.getElementById('report-button');
    const dashboardButton = document.getElementById('dashboard-button');

    if (reportButton) {
        reportButton.addEventListener('click', () => {
            window.location.href = 'report.html'; // Assuming report.html will be the report page
        });
    }

    if (dashboardButton) {
        dashboardButton.addEventListener('click', () => {
            window.location.href = 'dashboard.html'; // Assuming dashboard.html will be the dashboard page
        });
    }
}); 