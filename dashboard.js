// dashboard.js

document.addEventListener('DOMContentLoaded', () => {
    // Navigation Elements
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.dashboard-section');
    const backButton = document.getElementById('back-button');
    const newReportButton = document.getElementById('new-report-button');

    // Filter Elements
    const statusFilter = document.getElementById('status-filter');
    const priorityFilter = document.getElementById('priority-filter');
    const issueTypeFilter = document.getElementById('issue-type-filter');
    const noReportsMessage = document.getElementById('no-reports-message');
    const reportsGrid = document.getElementById('reports-grid');
    const locationFilter = document.getElementById('location-filter');

    // Analytics Elements
    const analyticsTableBody = document.getElementById('analytics-table-body');
    const todayCount = document.getElementById('today-count');
    const weekCount = document.getElementById('week-count');
    const monthCount = document.getElementById('month-count');

    // Add after the existing filter elements
    const resolutionStatusFilter = document.getElementById('resolution-status-filter');
    const resolutionPriorityFilter = document.getElementById('resolution-priority-filter');
    const issuesTableBody = document.getElementById('issues-table-body');

    // Add after the existing elements
    const statusUpdateModal = document.getElementById('status-update-modal');
    const closeModalButton = document.querySelector('.close-modal');
    const cancelStatusButton = document.getElementById('cancel-status-update');
    const confirmStatusButton = document.getElementById('confirm-status-update');
    const statusSelect = document.getElementById('status-select');
    const actionRemarks = document.getElementById('action-remarks');

    // Add analytics elements
    const analyticsTimeRange = document.getElementById('analytics-time-range');
    const resolutionTimeChart = document.getElementById('resolution-time-chart');
    const issueTypeChart = document.getElementById('issue-type-chart');
    const facilityChart = document.getElementById('facility-chart');
    const priorityTrendChart = document.getElementById('priority-trend-chart');

    // Issue Types Configuration
    const issueTypes = {
        dirty_restroom: "Dirty restroom",
        overflowing_bin: "Overflowing bin",
        no_dispenser: "No dispenser",
        no_water: "No water",
        safety_concern: "Safety concern",
        other: "Other"
    };

    // Populate issue type filter
    Object.entries(issueTypes).forEach(([value, label]) => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = label;
        issueTypeFilter.appendChild(option);
    });

    // Populate location filter
    const populateLocationFilter = () => {
        if (!locationFilter) return;
        // Remove all except the first option
        while (locationFilter.options.length > 1) {
            locationFilter.remove(1);
        }
        const uniqueLocations = Object.values(facilitiesData)
            .map(f => f.displayName)
            .filter((v, i, a) => a.indexOf(v) === i)
            .sort();
        uniqueLocations.forEach(loc => {
            const option = document.createElement('option');
            option.value = loc;
            option.textContent = loc;
            locationFilter.appendChild(option);
        });
    };

    // Facility data store
    let facilitiesData = {};
    
    // Function to fetch facilities from the database
    const loadFacilities = async () => {
        try {
            console.log('Fetching facilities from API...');
            const response = await fetch('http://localhost:3001/api/facilities');
            if (!response.ok) {
                throw new Error(`Failed to fetch facilities: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Facilities data received:', data);
            
            // Transform into a map for quick lookups
            const facilitiesMap = {};
            if (data && data.facilities && Array.isArray(data.facilities)) {
                data.facilities.forEach(facility => {
                    facilitiesMap[facility.facility_id] = {
                        displayName: `${facility.name} - ${facility.building} ${facility.floor}${facility.room_number ? ' #' + facility.room_number : ''}`,
                        name: facility.name,
                        building: facility.building,
                        floor: facility.floor,
                        roomNumber: facility.room_number
                    };
                });
                console.log('Created facilities map:', facilitiesMap);
            }
            
            return facilitiesMap;
        } catch (error) {
            console.error('Error loading facilities:', error);
            // Return hardcoded facility data as fallback
            return {
                "79439ae2-5361-4332-9832-d1569aafb861": {
                    displayName: "Hygiene Station - Sports Complex",
                    name: "Hygiene Station",
                    building: "Sports Complex",
                    floor: "1F",
                    roomNumber: ""
                },
                "8c53dd4e-8d97-4b1f-885f-76078bf9fac6": {
                    displayName: "Girls' Washroom - Main Block 1F",
                    name: "Girls' Washroom",
                    building: "Main Block",
                    floor: "1F",
                    roomNumber: ""
                },
                "e76dbc24-c029-4ed6-8a5b-86e7c8ef95ce": {
                    displayName: "Sanitary Pad Dispenser - Library",
                    name: "Sanitary Pad Dispenser",
                    building: "Library",
                    floor: "Ground",
                    roomNumber: ""
                }
            };
        }
    };

    // Enhanced Helper to load reports from backend API
    const loadReports = async () => {
        try {
            const response = await fetch('http://localhost:3001/api/issues');
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (!data.issues || !Array.isArray(data.issues)) {
                console.warn('Invalid data structure:', data);
                return [];
            }
            
            // Transform backend data to match frontend format
            return data.issues.map(issue => {
                const facility = facilitiesData[issue.facility_id] || {
                    displayName: issue.facility_id,
                    name: 'Unknown',
                    building: 'Unknown',
                    floor: 'Unknown'
                };
                
                return {
                    id: issue.id,
                    issueType: issue.issue_type,
                    location: facility.name || facility.displayName || 'Unknown',
                    facilityId: issue.facility_id,
                    facilityDetails: facility,
                    description: issue.description || '',
                    priority: issue.priority || 'Low',
                    status: issue.status || 'Reported',
                    timestamp: issue.created_at,
                    updated_at: issue.updated_at || null,
                    action_remarks: issue.action_remarks || '',
                    image_url: issue.image_url || null // Add image_url to the report object
                };
            });
            
        } catch (error) {
            console.error('Error loading reports:', error);
                return [];
        }
    };

    // Analytics Service
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
            const analytics = {
                today: { total: 0, critical: 0, high: 0, low: 0 },
                week: { total: 0, critical: 0, high: 0, low: 0 },
                month: { total: 0, critical: 0, high: 0, low: 0 }
            };

            reports.forEach(report => {
                const priority = report.priority?.toLowerCase() || 'low';
                
                if (AnalyticsService.isToday(report.timestamp)) {
                    analytics.today.total++;
                    if (priority === 'critical') analytics.today.critical++;
                    else if (priority === 'high') analytics.today.high++;
                    else analytics.today.low++;
                }

                if (AnalyticsService.isThisWeek(report.timestamp)) {
                    analytics.week.total++;
                    if (priority === 'critical') analytics.week.critical++;
                    else if (priority === 'high') analytics.week.high++;
                    else analytics.week.low++;
                }

                if (AnalyticsService.isThisMonth(report.timestamp)) {
                    analytics.month.total++;
                    if (priority === 'critical') analytics.month.critical++;
                    else if (priority === 'high') analytics.month.high++;
                    else analytics.month.low++;
                }
            });

            return analytics;
        }
    };

    // Function to update issue status
    const updateIssueStatus = async (issueId, status, actionRemarks) => {
        try {
            const response = await fetch(`http://localhost:3001/api/issues/${issueId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    status: status,
                    action_remarks: actionRemarks
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update issue status');
            }

            const data = await response.json();
            return data.issue;
        } catch (error) {
            console.error('Error updating issue status:', error);
            throw error;
        }
    };

    // Update calculateResolutionTime function
    const calculateResolutionTime = (reports) => {
        const resolvedReports = reports.filter(report => report.status === 'Resolved' && report.updated_at);
        if (!resolvedReports.length) return { avg: 0, fastest: 0, slowest: 0 };

        const times = resolvedReports.map(report => {
            const start = new Date(report.created_at);
            const end = new Date(report.updated_at);
            return {
                hours: (end - start) / (1000 * 60 * 60),
                report: report
            };
        });

        const sortedTimes = times.sort((a, b) => a.hours - b.hours);
        const totalHours = times.reduce((sum, item) => sum + item.hours, 0);

        return {
            avg: totalHours / times.length,
            fastest: sortedTimes[0],
            slowest: sortedTimes[sortedTimes.length - 1]
        };
    };

    const calculateIssueDistribution = (reports) => {
        const distribution = {};
        reports.forEach(report => {
            distribution[report.issueType] = (distribution[report.issueType] || 0) + 1;
        });
        return distribution;
    };

    const calculateFacilityAnalysis = (reports) => {
        const distribution = {};
        reports.forEach(report => {
            distribution[report.location] = (distribution[report.location] || 0) + 1;
        });
        return distribution;
    };

    const calculatePriorityTrends = (reports) => {
        const trends = {
            Critical: 0,
            High: 0,
            Medium: 0,
            Low: 0
        };
        reports.forEach(report => {
            trends[report.priority] = (trends[report.priority] || 0) + 1;
        });
        return trends;
    };

    // Update generateRecommendations function
    const generateRecommendations = (reports) => {
        const recommendations = [];
        const resolutionTime = calculateResolutionTime(reports);
        const issueDistribution = calculateIssueDistribution(reports);

        // Check average resolution time
        if (resolutionTime.avg > 48) {
            recommendations.push({
                priority: 'high',
                title: 'High Resolution Time',
                description: `Average resolution time is ${resolutionTime.avg.toFixed(1)} hours. Consider allocating more resources to speed up issue resolution.`
            });
        }

        // Check for frequent issues
        const mostCommonIssue = Object.entries(issueDistribution)
            .sort(([,a], [,b]) => b - a)[0];
        if (mostCommonIssue && mostCommonIssue[1] > reports.length * 0.3) {
            recommendations.push({
                priority: 'critical',
                title: 'Recurring Issue Pattern',
                description: `${issueTypes[mostCommonIssue[0]]} represents ${((mostCommonIssue[1] / reports.length) * 100).toFixed(1)}% of all issues. Consider preventive measures.`
            });
        }

        return recommendations;
    };

    // Update updateCharts function
    const updateCharts = (reports) => {
        // Helper function to safely get chart context
        const getChartContext = (elementId) => {
            const canvas = document.getElementById(elementId);
            return canvas ? canvas.getContext('2d') : null;
        };

        // Helper function to destroy existing chart
        const destroyChart = (chartId) => {
            const canvas = document.getElementById(chartId);
            const chartInstance = Chart.getChart(canvas);
            if (chartInstance) {
                chartInstance.destroy();
            }
        };

        // Destroy all existing charts
        destroyChart('resolution-time-chart');
        destroyChart('issue-type-chart');
        destroyChart('priority-trend-chart');

        // Resolution Time Chart - Now showing average resolution time per day
        const resolutionTimeCtx = getChartContext('resolution-time-chart');
        if (resolutionTimeCtx) {
            // Group reports by date and calculate average resolution time
            const dailyAverages = reports
                .filter(report => report.status === 'Resolved' && report.updated_at)
                .reduce((acc, report) => {
                    const date = new Date(report.created_at).toLocaleDateString();
                    if (!acc[date]) {
                        acc[date] = { total: 0, count: 0 };
                    }
                    const resolutionTime = (new Date(report.updated_at) - new Date(report.created_at)) / (1000 * 60 * 60);
                    acc[date].total += resolutionTime;
                    acc[date].count += 1;
                    return acc;
                }, {});

            const resolutionTimeData = Object.entries(dailyAverages)
                .map(([date, data]) => ({
                    x: new Date(date).getTime(),
                    y: data.total / data.count // average hours for the day
                }))
                .sort((a, b) => a.x - b.x);

            new Chart(resolutionTimeCtx, {
                type: 'line',
                data: {
                    datasets: [{
                        label: 'Average Resolution Time (hours)',
                        data: resolutionTimeData,
                        borderColor: '#00c851',
                        tension: 0.4,
                        fill: false
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: {
                            type: 'time',
                            time: {
                                unit: 'day',
                                displayFormats: {
                                    day: 'MMM d, yyyy'
                                }
                            },
                            title: {
                                display: true,
                                text: 'Date'
                            },
                            ticks: {
                                source: 'auto',
                                autoSkip: true
                            }
                        },
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Average Hours to Resolution'
                            }
                        }
                    },
                    plugins: {
                        tooltip: {
                            callbacks: {
                                title: function(context) {
                                    return new Date(context[0].parsed.x).toLocaleDateString();
                                },
                                label: function(context) {
                                    return `Average Resolution Time: ${context.parsed.y.toFixed(1)} hours`;
                                }
                            }
                        }
                    }
                }
            });
        }

        // Issue Type Distribution Chart
        const issueTypeCtx = getChartContext('issue-type-chart');
        if (issueTypeCtx) {
            const issueDistribution = calculateIssueDistribution(reports);
            
            new Chart(issueTypeCtx, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(issueDistribution).map(type => issueTypes[type]),
                    datasets: [{
                        data: Object.values(issueDistribution),
                        backgroundColor: [
                            '#ff4444',
                            '#ffaa00',
                            '#00c851',
                            '#33b5e5',
                            '#aa66cc',
                            '#2BBBAD'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'right'
                        }
                    }
                }
            });
        }

        // Facility Analysis Chart
        const facilityCtx = getChartContext('facility-chart');
        if (facilityCtx) {
            const facilityData = calculateFacilityAnalysis(reports);
            
            new Chart(facilityCtx, {
                type: 'bar',
                data: {
                    labels: Object.keys(facilityData),
                    datasets: [{
                        label: 'Number of Issues',
                        data: Object.values(facilityData),
                        backgroundColor: '#00c851'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Number of Issues'
                            }
                        }
                    }
                }
            });
        }

        // Priority Trends Chart
        const priorityCtx = getChartContext('priority-trend-chart');
        if (priorityCtx) {
            const priorityData = calculatePriorityTrends(reports);
            
            new Chart(priorityCtx, {
                type: 'radar',
                data: {
                    labels: Object.keys(priorityData),
                    datasets: [{
                        label: 'Number of Issues',
                        data: Object.values(priorityData),
                        backgroundColor: 'rgba(0, 200, 81, 0.2)',
                        borderColor: '#00c851',
                        pointBackgroundColor: '#00c851'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        r: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }
    };

    // Update analytics display
    const updateAnalytics = (reports) => {
        const timeRange = parseInt(analyticsTimeRange?.value || '30');
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - timeRange);

        const filteredReports = reports.filter(report => 
            new Date(report.timestamp) >= cutoffDate
        );

        // Helper function to safely update element text content
        const safeSetText = (elementId, text) => {
            const element = document.getElementById(elementId);
            if (element) {
                element.textContent = text;
            }
        };

        // Update counts
        safeSetText('today-count', filteredReports.filter(report => AnalyticsService.isToday(report.timestamp)).length);
        safeSetText('week-count', filteredReports.filter(report => AnalyticsService.isThisWeek(report.timestamp)).length);
        safeSetText('month-count', filteredReports.filter(report => AnalyticsService.isThisMonth(report.timestamp)).length);
        
        // Update breakdowns
        safeSetText('today-critical', filteredReports.filter(report => AnalyticsService.isToday(report.timestamp) && report.priority === 'Critical').length);
        safeSetText('today-high', filteredReports.filter(report => AnalyticsService.isToday(report.timestamp) && report.priority === 'High').length);
        safeSetText('today-low', filteredReports.filter(report => AnalyticsService.isToday(report.timestamp) && report.priority === 'Low').length);
        
        safeSetText('week-critical', filteredReports.filter(report => AnalyticsService.isThisWeek(report.timestamp) && report.priority === 'Critical').length);
        safeSetText('week-high', filteredReports.filter(report => AnalyticsService.isThisWeek(report.timestamp) && report.priority === 'High').length);
        safeSetText('week-low', filteredReports.filter(report => AnalyticsService.isThisWeek(report.timestamp) && report.priority === 'Low').length);
        
        safeSetText('month-critical', filteredReports.filter(report => AnalyticsService.isThisMonth(report.timestamp) && report.priority === 'Critical').length);
        safeSetText('month-high', filteredReports.filter(report => AnalyticsService.isThisMonth(report.timestamp) && report.priority === 'High').length);
        safeSetText('month-low', filteredReports.filter(report => AnalyticsService.isThisMonth(report.timestamp) && report.priority === 'Low').length);

        // Update resolution time analysis with more details
        const resolutionTime = calculateResolutionTime(filteredReports);
        
        // Update issue type distribution
        const issueDistribution = calculateIssueDistribution(filteredReports);
        const [mostCommon, leastCommon] = Object.entries(issueDistribution)
            .sort(([,a], [,b]) => b - a)
            .map(([type]) => issueTypes[type]);
        safeSetText('most-common-issue', mostCommon || '-');
        safeSetText('least-common-issue', leastCommon || '-');

        // Update priority trends
        const priorityTrends = calculatePriorityTrends(filteredReports);
        safeSetText('critical-issues-count', priorityTrends.Critical || '0');
        safeSetText('high-priority-count', priorityTrends.High || '0');
        
        const resolvedCount = filteredReports.filter(r => r.status === 'Resolved').length;
        const totalCount = filteredReports.length;
        const resolutionRate = totalCount ? 
            ((resolvedCount / totalCount) * 100).toFixed(1) + '%' : '0%';
        safeSetText('resolution-rate', resolutionRate);

        // Update recommendations
        const recommendations = generateRecommendations(filteredReports);
        const recommendationsList = document.getElementById('recommendations-list');
        if (recommendationsList) {
            recommendationsList.innerHTML = recommendations.map(rec => `
                <div class="recommendation-item ${rec.priority}">
                    <h4>${rec.title}</h4>
                    <p>${rec.description}</p>
                </div>
            `).join('');
        }

        // Update charts if they exist
        try {
            updateCharts(filteredReports);
        } catch (error) {
            console.warn('Error updating charts:', error);
        }
    };

    // Update analytics table
    const updateAnalyticsTable = (reports) => {
        const issueTypeCounts = {};
        
        // Initialize counts for each issue type
        Object.keys(issueTypes).forEach(type => {
            issueTypeCounts[type] = {
                    today: 0,
                    week: 0,
                    month: 0,
                    total: 0
                };
            });

        // Count reports by type and period
            reports.forEach(report => {
            const type = report.issueType;
            if (issueTypeCounts[type]) {
                issueTypeCounts[type].total++;
                    
                    if (AnalyticsService.isToday(report.timestamp)) {
                    issueTypeCounts[type].today++;
                    }
                    if (AnalyticsService.isThisWeek(report.timestamp)) {
                    issueTypeCounts[type].week++;
                    }
                    if (AnalyticsService.isThisMonth(report.timestamp)) {
                    issueTypeCounts[type].month++;
                }
            }
        });
        
        // Clear existing table content
        analyticsTableBody.innerHTML = '';
        
        // Populate table
        Object.entries(issueTypes).forEach(([type, label]) => {
            const counts = issueTypeCounts[type];
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td class="issue-type-cell">${label}</td>
                <td class="count-cell ${counts.today > 0 ? 'has-reports' : ''}">${counts.today}</td>
                <td class="count-cell ${counts.week > 0 ? 'has-reports' : ''}">${counts.week}</td>
                <td class="count-cell ${counts.month > 0 ? 'has-reports' : ''}">${counts.month}</td>
                <td class="total-cell">${counts.total}</td>
            `;
            
            analyticsTableBody.appendChild(row);
        });
    };

    // Filter and render reports
    const filterAndRenderReports = (reports) => {
        const status = statusFilter.value || 'all';
        const priority = priorityFilter.value || 'all';
        const issueType = issueTypeFilter.value || 'all';
        const location = locationFilter.value || 'all';
        
        let filteredReports = [...reports];
        
        if (status !== 'all') {
            filteredReports = filteredReports.filter(report => report.status === status);
        }
        if (priority !== 'all') {
            filteredReports = filteredReports.filter(report => report.priority === priority);
        }
        if (issueType !== 'all') {
            filteredReports = filteredReports.filter(report => report.issueType === issueType);
        }
        if (location !== 'all') {
            filteredReports = filteredReports.filter(report => report.location === location);
        }
        
        renderReports(filteredReports);
    };

    // Render reports to grid
    const renderReports = (reports) => {
        if (!reports.length) {
            reportsGrid.style.display = 'none';
            noReportsMessage.style.display = 'block';
            return;
        }
        
        reportsGrid.style.display = 'grid';
        noReportsMessage.style.display = 'none';
            reportsGrid.innerHTML = '';
            
        reports.forEach(report => {
            const card = document.createElement('div');
            card.className = 'report-card';
            
            const priorityClass = report.priority.toLowerCase();
            const statusClass = report.status.toLowerCase().replace(' ', '-');
            
            card.innerHTML = `
                <div class="report-card-header">
                    <div class="report-card-title">${issueTypes[report.issueType]}</div>
                    <div class="report-card-timestamp">${new Date(report.timestamp).toLocaleString()}</div>
                </div>
                <div class="report-card-location">${report.location}</div>
                ${report.image_url ? `<div class='report-card-image'><img src='${report.image_url}' alt='Issue Image' style='max-width: 100%; max-height: 180px; border-radius: 0.5rem; margin: 0.5rem 0;'/></div>` : ''}
                <div class="report-card-description">${report.description || 'No description provided.'}</div>
                <div class="report-card-badges">
                    <span class="badge priority-${priorityClass}">${report.priority}</span>
                    <span class="badge status-${statusClass}">${report.status}</span>
                </div>
            `;
            
            reportsGrid.appendChild(card);
        });
    };

    // Function to render issues table
    const renderIssuesTable = (reports) => {
        const status = resolutionStatusFilter.value || 'all';
        const priority = resolutionPriorityFilter.value || 'all';
        
        let filteredReports = [...reports];
        
        if (status !== 'all') {
            filteredReports = filteredReports.filter(report => report.status === status);
        }
        if (priority !== 'all') {
            filteredReports = filteredReports.filter(report => report.priority === priority);
        }
        
        issuesTableBody.innerHTML = '';

        filteredReports.forEach(report => {
            const tr = document.createElement('tr');
            const statusClass = report.status.toLowerCase().replace(' ', '-');
            
            tr.innerHTML = `
                <td>${issueTypes[report.issueType]}</td>
                <td>${report.location}</td>
                <td>${report.description || 'No description provided'}</td>
                <td>
                    <span class="priority-badge ${report.priority.toLowerCase()}">${report.priority}</span>
                </td>
                <td>
                    <span class="status-badge ${statusClass}">${report.status}</span>
                </td>
                <td>${report.action_remarks || '-'}</td>
                <td>${new Date(report.timestamp).toLocaleString()}</td>
                <td>
                    <button class="action-button update-status" data-issue-id="${report.id}" data-current-status="${report.status}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-edit"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                </td>
            `;
            
            issuesTableBody.appendChild(tr);
        });
        
        // Add event listeners to update status buttons
        document.querySelectorAll('.update-status').forEach(button => {
            button.addEventListener('click', () => {
                const issueId = button.dataset.issueId;
                const currentStatus = button.dataset.currentStatus;
                openStatusUpdateModal(issueId, currentStatus);
            });
        });
    };

    // Modal handling functions
    let currentIssueId = null;

    const openStatusUpdateModal = (issueId, currentStatus) => {
        currentIssueId = issueId;
        statusSelect.value = currentStatus;
        actionRemarks.value = '';
        statusUpdateModal.style.display = 'flex';
    };

    const closeStatusUpdateModal = () => {
        statusUpdateModal.style.display = 'none';
        currentIssueId = null;
        actionRemarks.value = '';
    };

    // Update confirmStatusButton click handler
    confirmStatusButton.addEventListener('click', async () => {
        if (!currentIssueId) return;
        
        try {
            confirmStatusButton.disabled = true;
            confirmStatusButton.textContent = 'Updating...';
            
            const newStatus = statusSelect.value;
            const remarks = actionRemarks.value.trim();
            
            if (!newStatus) {
                throw new Error('Please select a status');
            }
            
            await updateIssueStatus(currentIssueId, newStatus, remarks);
            closeStatusUpdateModal();
            
            // Refresh the data
            const reports = await loadReports();
            updateAnalytics(reports);
            updateAnalyticsTable(reports);
            renderIssuesTable(reports);
            filterAndRenderReports(reports);
            
        } catch (error) {
            alert(error.message || 'Failed to update issue status. Please try again.');
        } finally {
            confirmStatusButton.disabled = false;
            confirmStatusButton.textContent = 'Update Status';
        }
    });

    // Add analytics time range change handler
    analyticsTimeRange.addEventListener('change', async () => {
        const reports = await loadReports();
        updateAnalytics(reports);
    });

    // Initialize dashboard
    const initializeDashboard = async () => {
        // Set default filter values
        statusFilter.value = 'all';
        priorityFilter.value = 'all';
        issueTypeFilter.value = 'all';
        locationFilter.value = 'all';
        resolutionStatusFilter.value = 'all';
        resolutionPriorityFilter.value = 'all';
        
        try {
            // Load facilities data first
            console.log('Loading facilities data...');
            facilitiesData = await loadFacilities();
            console.log('Facilities data loaded:', facilitiesData);
            populateLocationFilter();
            
            // Then load reports
            console.log('Loading reports...');
            const reports = await loadReports();
            console.log('Reports loaded:', reports);
            
            // Update analytics
            updateAnalytics(reports);
            updateAnalyticsTable(reports);
            
            // Render initial reports
            filterAndRenderReports(reports);
            renderIssuesTable(reports);
            
            // Setup auto-refresh
            setInterval(async () => {
                const updatedReports = await loadReports();
                updateAnalytics(updatedReports);
                updateAnalyticsTable(updatedReports);
                filterAndRenderReports(updatedReports);
                renderIssuesTable(updatedReports);
            }, 30000); // Refresh every 30 seconds
        } catch (error) {
            console.error('Error initializing dashboard:', error);
        }
    };

    // Event Listeners
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetView = item.getAttribute('data-view');
            
            // Update active states
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            // Show selected section
            sections.forEach(section => {
                section.classList.remove('active');
                if (section.id === `${targetView}-section`) {
                    section.classList.add('active');
                }
            });
        });
    });

    // Filter change handlers
    [statusFilter, priorityFilter, issueTypeFilter, locationFilter].forEach(filter => {
        filter.addEventListener('change', async () => {
            const reports = await loadReports();
            filterAndRenderReports(reports);
        });
    });

    // Resolution filter handlers
    [resolutionStatusFilter, resolutionPriorityFilter].forEach(filter => {
        filter.addEventListener('change', async () => {
            const reports = await loadReports();
            renderIssuesTable(reports);
        });
    });

    // Modal event listeners
    closeModalButton.addEventListener('click', closeStatusUpdateModal);
    cancelStatusButton.addEventListener('click', closeStatusUpdateModal);

    // Navigation handlers
    backButton.addEventListener('click', () => {
        window.location.href = 'index.html';
    });

    newReportButton.addEventListener('click', () => {
        window.location.href = 'report.html';
    });

    // Initialize the dashboard
    initializeDashboard();
}); 