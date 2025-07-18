// dashboard.js

document.addEventListener('DOMContentLoaded', () => {
    const backButton = document.getElementById('back-button');
    const newReportButton = document.getElementById('new-report-button');
    const filterSelect = document.getElementById('filter-select');
    const totalReportsStat = document.getElementById('total-reports');
    const safetyConcernsStat = document.getElementById('safety-concerns');
    const dirtyRestroomsStat = document.getElementById('dirty-restrooms');
    const noDispensersStat = document.getElementById('no-dispensers');
    const noReportsMessage = document.getElementById('no-reports-message');
    const reportsContainer = document.getElementById('reports-container');
    const reportsSummary = reportsContainer.querySelector('.reports-summary');
    const reportsCountHeading = reportsSummary.querySelector('h2');
    const filterBadge = document.getElementById('filter-badge');
    const reportsGrid = document.getElementById('reports-grid');
    const submitFirstReportButton = document.getElementById('submit-first-report-button');

    const issueTypeLabels = {
        all: "All Issues",
        dirty_restroom: "Dirty restroom",
        overflowing_bin: "Overflowing bin",
        no_dispenser: "No dispenser",
        no_water: "No water",
        safety_concern: "Safety concern",
        other: "Other",
    };

    // Facility mapping for better display
    const facilityLabels = {
        "79439a2e-63b1-4332-9832-d1569aaff861": "Hygiene Station - Sports Complex",
        "8cc53d64-a097-4b1f-9b6f-7607f89f9ac5": "Girls' Washroom - Main Block 1F",
        "e7f6dbc2-c029-4ed6-8a5b-8e9c7c8e95ce": "Sanitary Pad Dispenser - Library"
    };

    // Populate filter options
    for (const [value, label] of Object.entries(issueTypeLabels)) {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = label;
        filterSelect.appendChild(option);
    }

    // Helper to load reports from backend API
    const loadReports = async () => {
        try {
            const response = await fetch('http://localhost:3001/api/issues');
            if (!response.ok) {
                throw new Error('Failed to fetch issues from server');
            }
            const data = await response.json();
            
            // Transform backend data to match frontend format
            return data.issues.map(issue => ({
                id: issue.id,
                issueType: issue.issue_type,
                location: facilityLabels[issue.facility_id] || issue.facility_id, // Resolve facility name
                description: issue.description || '',
                priority: issue.priority,
                status: issue.status,
                timestamp: issue.created_at
            }));
        } catch (error) {
            console.error("Error loading reports from backend:", error);
            // Fallback to localStorage for backward compatibility
            try {
                const storedReports = localStorage.getItem('menstrualHygieneReports');
                return storedReports ? JSON.parse(storedReports) : [];
            } catch (e) {
                console.error("Error loading reports from localStorage:", e);
                return [];
            }
        }
    };

    // Report Filter Service (simplified version of ReportFilterService)
    const ReportFilterService = {
        filterByIssueType: (reports, filterType) => {
            if (filterType === "all") {
                return reports;
            }
            return reports.filter(report => report.issueType === filterType);
        }
    };

    // Function to render reports and update statistics
    const renderReports = async () => {
        const allReports = await loadReports();
        const currentFilterType = filterSelect.value;
        const filteredReports = ReportFilterService.filterByIssueType(allReports, currentFilterType);

        // Update statistics
        totalReportsStat.textContent = allReports.length;
        safetyConcernsStat.textContent = allReports.filter(r => r.issueType === "safety_concern").length;
        dirtyRestroomsStat.textContent = allReports.filter(r => r.issueType === "dirty_restroom").length;
        noDispensersStat.textContent = allReports.filter(r => r.issueType === "no_dispenser").length;

        // Clear previous reports
        reportsGrid.innerHTML = '';

        if (filteredReports.length === 0) {
            noReportsMessage.style.display = 'block';
            reportsContainer.style.display = 'none';
            if (allReports.length === 0) {
                noReportsMessage.querySelector('h3').textContent = "No reports yet";
                noReportsMessage.querySelector('p').textContent = "Be the first to report a menstrual hygiene issue in your community.";
                submitFirstReportButton.style.display = 'block';
            } else {
                noReportsMessage.querySelector('h3').textContent = "No reports match your filter";
                noReportsMessage.querySelector('p').textContent = "Try adjusting your filter to see more reports.";
                submitFirstReportButton.style.display = 'none';
            }
        } else {
            noReportsMessage.style.display = 'none';
            reportsContainer.style.display = 'block';

            reportsCountHeading.textContent = `Reports (${filteredReports.length})`;
            reportsSummary.style.display = 'flex';

            if (currentFilterType !== "all") {
                filterBadge.textContent = `Filtered by: ${issueTypeLabels[currentFilterType]}`;
                filterBadge.style.display = 'inline-block';
            } else {
                filterBadge.style.display = 'none';
            }

            filteredReports.forEach(report => {
                const reportCard = document.createElement('div');
                reportCard.className = 'report-card';
                reportCard.innerHTML = `
                    <div class="report-card-header">
                        <h3 class="report-card-title">Issue: ${issueTypeLabels[report.issueType] || report.issueType}</h3>
                        <span class="report-card-timestamp">${new Date(report.timestamp).toLocaleString()}</span>
                    </div>
                    <p class="report-card-location"><strong>Location:</strong> ${report.location}</p>
                    ${report.description ? `<p class="report-card-description"><strong>Description:</strong> ${report.description}</p>` : ''}
                    ${report.priority ? `<p class="report-card-priority"><strong>Priority:</strong> <span class="priority-badge priority-${report.priority.toLowerCase()}">${report.priority}</span></p>` : ''}
                    <div class="report-card-badges">
                        <span class="badge issue-type">${issueTypeLabels[report.issueType] || report.issueType}</span>
                    </div>
                `;
                reportsGrid.appendChild(reportCard);
            });
        }
    };

    // Event Listeners
    backButton.addEventListener('click', () => {
        window.location.href = 'index.html';
    });

    newReportButton.addEventListener('click', () => {
        window.location.href = 'report.html';
    });

    filterSelect.addEventListener('change', renderReports);
    submitFirstReportButton.addEventListener('click', () => {
        window.location.href = 'report.html';
    });

    // Initial render
    renderReports();
}); 