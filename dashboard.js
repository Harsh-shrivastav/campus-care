// dashboard.js

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Dashboard loading...');
    
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

    // Facility data store
    let facilitiesData = {};
    
    // Function to fetch facilities from the database
    const loadFacilities = async () => {
        try {
            console.log('📡 Fetching facilities from API...');
            const response = await fetch('http://localhost:3001/api/facilities');
            if (!response.ok) {
                throw new Error(`Failed to fetch facilities: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('📊 Facilities data received:', data);
            
            // Transform into a map for quick lookups
            const facilitiesMap = {};
            if (data && data.facilities && Array.isArray(data.facilities)) {
                data.facilities.forEach(facility => {
                    const displayName = `${facility.name} - ${facility.building} ${facility.floor}${facility.room_number ? ' #' + facility.room_number : ''}`;
                    facilitiesMap[facility.facility_id] = {
                        displayName,
                        name: facility.name,
                        building: facility.building,
                        floor: facility.floor,
                        roomNumber: facility.room_number
                    };
                });
                console.log('✅ Created facilities map with', Object.keys(facilitiesMap).length, 'entries');
            }
            
            return facilitiesMap;
        } catch (error) {
            console.error('Error loading facilities:', error);
            // Fallback to static mapping if API fails
            return {
                "79439a2e-63b1-4332-9832-d1569aaff861": {
                    displayName: "Hygiene Station - Sports Complex",
                    name: "Hygiene Station",
                    building: "Sports Complex",
                    floor: "1F",
                    roomNumber: ""
                },
                "8cc53d64-a097-4b1f-9b6f-7607f89f9ac5": {
                    displayName: "Girls' Washroom - Main Block 1F",
                    name: "Girls' Washroom",
                    building: "Main Block",
                    floor: "1F",
                    roomNumber: ""
                },
                "e7f6dbc2-c029-4ed6-8a5b-8e9c7c8e95ce": {
                    displayName: "Sanitary Pad Dispenser - Library",
                    name: "Sanitary Pad Dispenser",
                    building: "Library",
                    floor: "Ground",
                    roomNumber: ""
                }
            };
        }
    };

    // Populate filter options
    for (const [value, label] of Object.entries(issueTypeLabels)) {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = label;
        filterSelect.appendChild(option);
    }

    // Enhanced Helper to load reports from backend API
    const loadReports = async () => {
        console.log('📡 Fetching reports from API...');
        
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
            
            const response = await fetch('http://localhost:3001/api/issues', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            console.log('🔍 Response status:', response.status);
            console.log('🔍 Response headers:', [...response.headers.entries()]);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('📊 Raw API response:', data);
            
            if (!data.issues || !Array.isArray(data.issues)) {
                console.warn('⚠️ Invalid data structure:', data);
                return [];
            }
            
            // Transform backend data to match frontend format
            const transformedData = data.issues.map(issue => {
                const facility = facilitiesData[issue.facility_id] || {
                    displayName: issue.facility_id,
                    name: 'Unknown',
                    building: 'Unknown',
                    floor: 'Unknown'
                };
                
                const transformed = {
                    id: issue.id,
                    issueType: issue.issue_type,
                    location: facility.displayName,
                    facilityId: issue.facility_id,
                    facilityDetails: facility,
                    description: issue.description || '',
                    priority: issue.priority || 'Low',
                    status: issue.status || 'Reported',
                    timestamp: issue.created_at
                };
                console.log('🔄 Transformed issue:', transformed);
                return transformed;
            });
            
            console.log('✅ Successfully loaded', transformedData.length, 'reports');
            return transformedData;
            
        } catch (error) {
            if (error.name === 'AbortError') {
                console.error('❌ Request timeout');
            } else {
                console.error('❌ Error loading reports from backend:', error);
            }
            
            // Fallback to localStorage for backward compatibility
            try {
                const storedReports = localStorage.getItem('menstrualHygieneReports');
                const fallbackData = storedReports ? JSON.parse(storedReports) : [];
                console.log('🔄 Using fallback data:', fallbackData.length, 'reports');
                return fallbackData;
            } catch (e) {
                console.error('❌ Error loading fallback data:', e);
                return [];
            }
        }
    };

    // Analytics Service for time-based filtering
    const AnalyticsService = {
        isToday: (date) => {
            const today = new Date();
            const reportDate = new Date(date);
            return (
                reportDate.getDate() === today.getDate() &&
                reportDate.getMonth() === today.getMonth() &&
                reportDate.getFullYear() === today.getFullYear()
            );
        },

        isThisWeek: (date) => {
            const today = new Date();
            const reportDate = new Date(date);
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay());
            startOfWeek.setHours(0, 0, 0, 0);
            
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            endOfWeek.setHours(23, 59, 59, 999);
            
            return reportDate >= startOfWeek && reportDate <= endOfWeek;
        },

        isThisMonth: (date) => {
            const today = new Date();
            const reportDate = new Date(date);
            return (
                reportDate.getMonth() === today.getMonth() &&
                reportDate.getFullYear() === today.getFullYear()
            );
        },

        calculateAnalytics: (reports) => {
            console.log('🧮 calculateAnalytics called with', reports.length, 'reports');
            const analytics = {
                today: { total: 0, critical: 0, high: 0, low: 0 },
                week: { total: 0, critical: 0, high: 0, low: 0 },
                month: { total: 0, critical: 0, high: 0, low: 0 }
            };

            reports.forEach(report => {
                console.log('📅 Processing report:', report.timestamp, 'Priority:', report.priority);
                const priority = report.priority?.toLowerCase() || 'low';
                
                if (AnalyticsService.isToday(report.timestamp)) {
                    console.log('✅ Report is from today');
                    analytics.today.total++;
                    if (priority === 'critical') analytics.today.critical++;
                    else if (priority === 'high') analytics.today.high++;
                    else analytics.today.low++;
                }

                if (AnalyticsService.isThisWeek(report.timestamp)) {
                    console.log('✅ Report is from this week');
                    analytics.week.total++;
                    if (priority === 'critical') analytics.week.critical++;
                    else if (priority === 'high') analytics.week.high++;
                    else analytics.week.low++;
                }

                if (AnalyticsService.isThisMonth(report.timestamp)) {
                    console.log('✅ Report is from this month');
                    analytics.month.total++;
                    if (priority === 'critical') analytics.month.critical++;
                    else if (priority === 'high') analytics.month.high++;
                    else analytics.month.low++;
                }
            });

            console.log('📊 Final analytics:', analytics);
            return analytics;
        },

        calculateIssueTypeAnalytics: (reports) => {
            console.log('📊 calculateIssueTypeAnalytics called with', reports.length, 'reports');
            const issueTypes = ['dirty_restroom', 'overflowing_bin', 'no_dispenser', 'no_water', 'safety_concern', 'other'];
            const analytics = {};

            issueTypes.forEach(type => {
                analytics[type] = {
                    today: 0,
                    week: 0,
                    month: 0,
                    total: 0
                };
            });

            reports.forEach(report => {
                console.log('🔍 Processing report for issue type analytics:', report.issueType, report.timestamp);
                const issueType = report.issueType;
                if (analytics[issueType]) {
                    analytics[issueType].total++;
                    
                    if (AnalyticsService.isToday(report.timestamp)) {
                        analytics[issueType].today++;
                        console.log('✅ Added to today for', issueType);
                    }
                    
                    if (AnalyticsService.isThisWeek(report.timestamp)) {
                        analytics[issueType].week++;
                        console.log('✅ Added to week for', issueType);
                    }
                    
                    if (AnalyticsService.isThisMonth(report.timestamp)) {
                        analytics[issueType].month++;
                        console.log('✅ Added to month for', issueType);
                    }
                } else {
                    console.warn('⚠️ Unknown issue type:', issueType);
                }
            });

            console.log('📈 Final issue type analytics:', analytics);
            return analytics;
        }
    };

    // Function to update analytics table
    const updateAnalyticsTable = (reports) => {
        console.log('📋 updateAnalyticsTable called with', reports.length, 'reports');
        
        const issueAnalytics = AnalyticsService.calculateIssueTypeAnalytics(reports);
        console.log('📊 Issue analytics calculated:', issueAnalytics);
        
        const tableBody = document.getElementById('analytics-table-body');
        console.log('🔍 Table body element:', tableBody);
        
        if (!tableBody) {
            console.error('❌ analytics-table-body element not found!');
            return;
        }
        
        tableBody.innerHTML = '';

        Object.entries(issueAnalytics).forEach(([issueType, data]) => {
            console.log('📝 Adding row for', issueType, ':', data);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="issue-type-cell">${issueTypeLabels[issueType] || issueType}</td>
                <td class="count-cell ${data.today > 0 ? 'has-reports' : ''}">${data.today}</td>
                <td class="count-cell ${data.week > 0 ? 'has-reports' : ''}">${data.week}</td>
                <td class="count-cell ${data.month > 0 ? 'has-reports' : ''}">${data.month}</td>
                <td class="count-cell total-cell">${data.total}</td>
            `;
            tableBody.appendChild(row);
        });

        // Add totals row
        const totals = {
            today: Object.values(issueAnalytics).reduce((sum, data) => sum + data.today, 0),
            week: Object.values(issueAnalytics).reduce((sum, data) => sum + data.week, 0),
            month: Object.values(issueAnalytics).reduce((sum, data) => sum + data.month, 0),
            total: Object.values(issueAnalytics).reduce((sum, data) => sum + data.total, 0)
        };

        const totalsRow = document.createElement('tr');
        totalsRow.style.borderTop = '2px solid rgba(255, 255, 255, 0.2)';
        totalsRow.innerHTML = `
            <td class="issue-type-cell" style="font-weight: 700; color: #ffffff;">TOTAL</td>
            <td class="count-cell total-cell">${totals.today}</td>
            <td class="count-cell total-cell">${totals.week}</td>
            <td class="count-cell total-cell">${totals.month}</td>
            <td class="count-cell total-cell" style="background-color: rgba(147, 112, 219, 0.4);">${totals.total}</td>
        `;
        tableBody.appendChild(totalsRow);
    };

    // Enhanced Function to update analytics display
    const updateAnalytics = (reports) => {
        console.log('📊 Updating analytics with', reports.length, 'reports');
        
        try {
            if (!Array.isArray(reports)) {
                console.warn('⚠️ Invalid reports data for analytics');
                return;
            }
            
            const analytics = AnalyticsService.calculateAnalytics(reports);
            console.log('📈 Calculated analytics:', analytics);

            // Update today's analytics with fallback
            const todayElements = {
                count: document.getElementById('today-count'),
                critical: document.getElementById('today-critical'),
                high: document.getElementById('today-high'),
                low: document.getElementById('today-low')
            };

            Object.entries(todayElements).forEach(([key, element]) => {
                if (element) {
                    element.textContent = key === 'count' ? analytics.today.total : analytics.today[key] || 0;
                }
            });

            // Update week's analytics with fallback
            const weekElements = {
                count: document.getElementById('week-count'),
                critical: document.getElementById('week-critical'),
                high: document.getElementById('week-high'),
                low: document.getElementById('week-low')
            };

            Object.entries(weekElements).forEach(([key, element]) => {
                if (element) {
                    element.textContent = key === 'count' ? analytics.week.total : analytics.week[key] || 0;
                }
            });

            // Update month's analytics with fallback
            const monthElements = {
                count: document.getElementById('month-count'),
                critical: document.getElementById('month-critical'),
                high: document.getElementById('month-high'),
                low: document.getElementById('month-low')
            };

            Object.entries(monthElements).forEach(([key, element]) => {
                if (element) {
                    element.textContent = key === 'count' ? analytics.month.total : analytics.month[key] || 0;
                }
            });
            
            console.log('✅ Analytics updated successfully');
            
        } catch (error) {
            console.error('❌ Error updating analytics:', error);
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

    // Enhanced Function to render reports and update statistics
    const renderReports = async () => {
        console.log('🎯 Starting renderReports...');
        
        try {
            // Show loading state
            totalReportsStat.textContent = 'Loading...';
            
            // First load facilities data
            try {
                console.log('🔄 Loading facilities data...');
                facilitiesData = await loadFacilities();
                console.log('✅ Facilities data loaded:', Object.keys(facilitiesData).length, 'facilities');
            } catch (error) {
                console.error('❌ Failed to load facilities:', error);
                // Continue with default/fallback data
            }
            
            // Clear previous reports
            reportsGrid.innerHTML = '';
            
            const allReports = await loadReports();
            console.log('📋 Loaded reports:', allReports);
            
            if (!Array.isArray(allReports)) {
                throw new Error('Invalid reports data received');
            }
            
            const currentFilterType = filterSelect.value;
            const filteredReports = ReportFilterService.filterByIssueType(allReports, currentFilterType);
            
            console.log('🔍 Filter applied:', currentFilterType, '- Found:', filteredReports.length, 'reports');

            // Update analytics with all reports (not filtered)
            console.log('📊 Updating analytics...');
            updateAnalytics(allReports);
            updateAnalyticsTable(allReports);

            // Update UI based on filtered reports
            if (filteredReports.length === 0) {
                noReportsMessage.style.display = 'block';
                reportsContainer.style.display = 'none';
            } else {
                showReportsList(filteredReports, currentFilterType);
            }

            // Update statistics with actual counts
            console.log('📈 Updating statistics...');
            const stats = {
                total: allReports.length,
                safety: allReports.filter(r => r.issueType === "safety_concern").length,
                dirty: allReports.filter(r => r.issueType === "dirty_restroom").length,
                dispensers: allReports.filter(r => r.issueType === "no_dispenser").length
            };
            
            console.log('📊 Calculated stats:', stats);
            
            totalReportsStat.textContent = stats.total;
            safetyConcernsStat.textContent = stats.safety;
            dirtyRestroomsStat.textContent = stats.dirty;
            noDispensersStat.textContent = stats.dispensers;
            
            // Clear previous reports
            reportsGrid.innerHTML = '';

            if (filteredReports.length === 0) {
                showNoReportsMessage(allReports.length === 0);
            } else {
                showReportsList(filteredReports, currentFilterType);
            }
            
            console.log('✅ Dashboard updated successfully!');
            
        } catch (error) {
            console.error('❌ Error in renderReports:', error);
            // Show error state
            totalReportsStat.textContent = 'Error';
            safetyConcernsStat.textContent = 'Error';
            dirtyRestroomsStat.textContent = 'Error';
            noDispensersStat.textContent = 'Error';
        }
    };
    
    // Helper function to show no reports message
    const showNoReportsMessage = (noReportsAtAll) => {
        noReportsMessage.style.display = 'block';
        reportsContainer.style.display = 'none';
        
        if (noReportsAtAll) {
            noReportsMessage.querySelector('h3').textContent = "No reports yet";
            noReportsMessage.querySelector('p').textContent = "Be the first to report a menstrual hygiene issue in your community.";
            submitFirstReportButton.style.display = 'block';
        } else {
            noReportsMessage.querySelector('h3').textContent = "No reports match your filter";
            noReportsMessage.querySelector('p').textContent = "Try adjusting your filter to see more reports.";
            submitFirstReportButton.style.display = 'none';
        }
    };
    
    // Helper function to show reports list
    const showReportsList = (filteredReports, currentFilterType) => {
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
            
            const formattedDate = new Date(report.timestamp).toLocaleString();
            const priorityClass = report.priority ? report.priority.toLowerCase() : 'low';
            
            // Format facility details
            const facility = report.facilityDetails || {};
            const facilityDetails = `
                <div class="facility-details">
                    <p><strong>Building:</strong> ${facility.building || 'Unknown'}</p>
                    <p><strong>Floor:</strong> ${facility.floor || 'Unknown'}</p>
                    ${facility.roomNumber ? `<p><strong>Room:</strong> ${facility.roomNumber}</p>` : ''}
                </div>
            `;
            
            reportCard.innerHTML = `
                <div class="report-card-header">
                    <h3 class="report-card-title">Issue: ${issueTypeLabels[report.issueType] || report.issueType}</h3>
                    <span class="report-card-timestamp">${formattedDate}</span>
                </div>
                <p class="report-card-location"><strong>Location:</strong> ${report.location}</p>
                ${facilityDetails}
                ${report.description ? `<p class="report-card-description"><strong>Description:</strong> ${report.description}</p>` : ''}
                ${report.priority ? `<p class="report-card-priority"><strong>Priority:</strong> <span class="priority-badge priority-${priorityClass}">${report.priority}</span></p>` : ''}
                <div class="report-card-badges">
                    <span class="badge issue-type">${issueTypeLabels[report.issueType] || report.issueType}</span>
                    ${report.status ? `<span class="badge status">${report.status}</span>` : ''}
                </div>
            `;
            reportsGrid.appendChild(reportCard);
        });
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
    
    // Add refresh button functionality
    const addRefreshButton = () => {
        const headerSection = document.querySelector('.header-section');
        if (headerSection && !document.getElementById('refresh-button')) {
            const refreshButton = document.createElement('button');
            refreshButton.id = 'refresh-button';
            refreshButton.className = 'button ghost';
            refreshButton.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-refresh-cw">
                    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                    <path d="M21 3v5h-5"/>
                    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                    <path d="M3 21v-5h5"/>
                </svg>
                Refresh Data
            `;
            refreshButton.addEventListener('click', () => {
                console.log('🔄 Manual refresh triggered');
                renderReports();
            });
            headerSection.appendChild(refreshButton);
        }
    };

    // Auto-refresh every 30 seconds
    const startAutoRefresh = () => {
        setInterval(() => {
            console.log('🔄 Auto-refresh triggered');
            renderReports();
        }, 30000); // 30 seconds
    };



    // Initial setup
    console.log('🚀 Initializing dashboard...');
    addRefreshButton();
    
    // Initial render with retry logic
    const initializeDashboard = async () => {
        let attempts = 0;
        const maxAttempts = 3;
        
        while (attempts < maxAttempts) {
            try {
                console.log(`📡 Initialization attempt ${attempts + 1}/${maxAttempts}`);
                await renderReports();
                console.log('✅ Dashboard initialized successfully');
                break;
            } catch (error) {
                attempts++;
                console.error(`❌ Initialization attempt ${attempts} failed:`, error);
                if (attempts < maxAttempts) {
                    console.log(`⏳ Retrying in 2 seconds...`);
                    await new Promise(resolve => setTimeout(resolve, 2000));
                } else {
                    console.error('❌ Failed to initialize dashboard after', maxAttempts, 'attempts');
                    // Show error message to user
                    if (totalReportsStat) {
                        totalReportsStat.textContent = 'Failed to load';
                    }
                }
            }
        }
    };
    
    // Start initialization and auto-refresh
    initializeDashboard();
    startAutoRefresh();
}); 