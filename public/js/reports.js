//reports.js - JavaScript for the Budget Reports page - DataManager Compatible

// Chart instances
let incomeExpenseChart = null;
let categoryChart = null;
let monthlyChart = null;

// Data Manager instance
let dataManager = null;

// Initialize the reports page
document.addEventListener('DOMContentLoaded', function() {
    // Initialize DataManager connection
    dataManager = window.DataManager;
    
    if (!dataManager) {
        console.error('DataManager nicht verfügbar!');
        showNotification('Fehler beim Laden der Daten', 'error');
        return;
    }

    initializeCharts();
    initializeEventListeners();
    updateSummaryCards();
    updateTopExpenses();
    updateCategoryLegend();
    
    // Listen for data changes
    dataManager.onDataChange(handleDataChange);
});

// Handle data changes from DataManager
function handleDataChange(section, data) {
    console.log('Data changed:', section);
    
    // Update relevant components based on changed section
    switch(section) {
        case 'categories':
        case 'income':
        case 'reports':
        case '全体': // Full data update
            updateAllCharts();
            updateSummaryCards();
            updateTopExpenses();
            updateCategoryLegend();
            break;
    }
}

// Initialize all charts
function initializeCharts() {
    initIncomeExpenseChart();
    initCategoryChart();
    initMonthlyComparisonChart();
}

// Income vs Expense Trend Chart
function initIncomeExpenseChart() {
    const ctx = document.getElementById('incomeExpenseTrendChart');
    if (!ctx) return;

    const reportsData = dataManager.getReports();
    const chartData = prepareIncomeExpenseData(reportsData.monthlyData);

    incomeExpenseChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.labels,
            datasets: [{
                label: 'Einnahmen',
                data: chartData.income,
                borderColor: '#27ca3f',
                backgroundColor: 'rgba(39, 202, 63, 0.1)',
                fill: true,
                tension: 0.4,
                borderWidth: 3,
                pointBackgroundColor: '#27ca3f',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 6
            }, {
                label: 'Ausgaben',
                data: chartData.expenses,
                borderColor: '#e74c3c',
                backgroundColor: 'rgba(231, 76, 60, 0.1)',
                fill: true,
                tension: 0.4,
                borderWidth: 3,
                pointBackgroundColor: '#e74c3c',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 20
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                        callback: function(value) {
                            return '€' + value.toLocaleString();
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

// Category Pie Chart
function initCategoryChart() {
    const ctx = document.getElementById('categoryPieChart');
    if (!ctx) return;

    const categories = dataManager.getCategories();
    const chartData = prepareCategoryData(categories);

    categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: chartData.labels,
            datasets: [{
                data: chartData.data,
                backgroundColor: chartData.colors,
                borderWidth: 0,
                hoverBorderWidth: 2,
                hoverBorderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const percentage = ((context.parsed / chartData.total) * 100).toFixed(1);
                            return context.label + ': €' + context.parsed.toLocaleString() + ' (' + percentage + '%)';
                        }
                    }
                }
            }
        }
    });
}

// Monthly Comparison Chart
function initMonthlyComparisonChart() {
    const ctx = document.getElementById('monthlyComparisonChart');
    if (!ctx) return;

    const reportsData = dataManager.getReports();
    const chartData = prepareMonthlyComparisonData(reportsData.monthlyData);

    monthlyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: chartData.labels,
            datasets: [{
                label: 'Ersparnisse',
                data: chartData.data,
                backgroundColor: chartData.colors,
                borderColor: '#667eea',
                borderWidth: 2,
                borderRadius: 8,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                        callback: function(value) {
                            return '€' + value.toLocaleString();
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Prepare data for income/expense chart
function prepareIncomeExpenseData(monthlyData) {
    const sortedMonths = Object.keys(monthlyData).sort();
    const recentMonths = sortedMonths.slice(-12); // Last 12 months
    
    return {
        labels: recentMonths.map(month => {
            const date = new Date(month + '-01');
            return date.toLocaleDateString('de-DE', { month: 'short' });
        }),
        income: recentMonths.map(month => monthlyData[month].income),
        expenses: recentMonths.map(month => monthlyData[month].expenses)
    };
}

// Prepare data for category chart
function prepareCategoryData(categories) {
    const filteredCategories = categories.filter(cat => cat.spent > 0);
    const total = filteredCategories.reduce((sum, cat) => sum + cat.spent, 0);
    
    return {
        labels: filteredCategories.map(cat => cat.name),
        data: filteredCategories.map(cat => cat.spent),
        colors: filteredCategories.map(cat => cat.color || '#667eea'),
        total: total
    };
}

// Prepare data for monthly comparison chart
function prepareMonthlyComparisonData(monthlyData) {
    const sortedMonths = Object.keys(monthlyData).sort();
    const recentMonths = sortedMonths.slice(-3); // Last 3 months
    
    const data = recentMonths.map(month => monthlyData[month].savings);
    const colors = data.map((savings, index) => {
        const opacity = 0.8 + (index * 0.1);
        return savings >= 0 ? `rgba(39, 202, 63, ${opacity})` : `rgba(231, 76, 60, ${opacity})`;
    });
    
    return {
        labels: recentMonths.map(month => {
            const date = new Date(month + '-01');
            return date.toLocaleDateString('de-DE', { month: 'short' });
        }),
        data: data,
        colors: colors
    };
}

// Initialize event listeners
function initializeEventListeners() {
    // Time period selector
    const timePeriodSelect = document.getElementById('timePeriodSelect');
    if (timePeriodSelect) {
        timePeriodSelect.addEventListener('change', handleTimePeriodChange);
    }

    // Chart type toggle buttons
    const chartTypeButtons = document.querySelectorAll('.chart-type-btn');
    chartTypeButtons.forEach(btn => {
        btn.addEventListener('click', handleChartTypeChange);
    });

    // Comparison toggle buttons
    const toggleButtons = document.querySelectorAll('.toggle-btn');
    toggleButtons.forEach(btn => {
        btn.addEventListener('click', handleComparisonToggle);
    });

    // Top expenses filter
    const topExpensesFilter = document.getElementById('topExpensesFilter');
    if (topExpensesFilter) {
        topExpensesFilter.addEventListener('change', handleTopExpensesFilter);
    }

    // Export and share buttons
    const exportBtn = document.getElementById('exportBtn');
    const shareBtn = document.getElementById('shareBtn');
    
    if (exportBtn) {
        exportBtn.addEventListener('click', handleExport);
    }
    
    if (shareBtn) {
        shareBtn.addEventListener('click', handleShare);
    }

    // Category details button
    const categoryDetailsBtn = document.getElementById('categoryDetailsBtn');
    if (categoryDetailsBtn) {
        categoryDetailsBtn.addEventListener('click', handleCategoryDetails);
    }
}

// Handle time period change
function handleTimePeriodChange(event) {
    const period = event.target.value;
    console.log('Time period changed to:', period);
    
    updateChartsForPeriod(period);
    updateSummaryCards(period);
}

// Handle chart type change (line/bar)
function handleChartTypeChange(event) {
    const chartType = event.target.closest('.chart-type-btn').dataset.type;
    
    // Update active state
    document.querySelectorAll('.chart-type-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.closest('.chart-type-btn').classList.add('active');
    
    // Update chart type
    if (incomeExpenseChart) {
        incomeExpenseChart.config.type = chartType;
        incomeExpenseChart.update();
    }
}

// Handle comparison toggle
function handleComparisonToggle(event) {
    const period = event.target.dataset.period;
    
    // Update active state
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Update monthly comparison chart
    updateMonthlyComparison(period);
}

// Handle top expenses filter
function handleTopExpensesFilter(event) {
    const filter = event.target.value;
    console.log('Top expenses filter changed to:', filter);
    updateTopExpenses(filter);
}

// Update all charts
function updateAllCharts() {
    updateIncomeExpenseChart();
    updateCategoryChart();
    updateMonthlyComparisonChart();
}

// Update income/expense chart
function updateIncomeExpenseChart() {
    if (!incomeExpenseChart) return;
    
    const reportsData = dataManager.getReports();
    const chartData = prepareIncomeExpenseData(reportsData.monthlyData);
    
    incomeExpenseChart.data.labels = chartData.labels;
    incomeExpenseChart.data.datasets[0].data = chartData.income;
    incomeExpenseChart.data.datasets[1].data = chartData.expenses;
    incomeExpenseChart.update();
}

// Update category chart
function updateCategoryChart() {
    if (!categoryChart) return;
    
    const categories = dataManager.getCategories();
    const chartData = prepareCategoryData(categories);
    
    categoryChart.data.labels = chartData.labels;
    categoryChart.data.datasets[0].data = chartData.data;
    categoryChart.data.datasets[0].backgroundColor = chartData.colors;
    categoryChart.update();
}

// Update monthly comparison chart
function updateMonthlyComparisonChart() {
    if (!monthlyChart) return;
    
    const reportsData = dataManager.getReports();
    const chartData = prepareMonthlyComparisonData(reportsData.monthlyData);
    
    monthlyChart.data.labels = chartData.labels;
    monthlyChart.data.datasets[0].data = chartData.data;
    monthlyChart.data.datasets[0].backgroundColor = chartData.colors;
    monthlyChart.update();
}

// Update charts for selected time period
function updateChartsForPeriod(period) {
    const reportsData = dataManager.getReports();
    const monthlyData = reportsData.monthlyData;
    
    let filteredData = {};
    const sortedMonths = Object.keys(monthlyData).sort();
    
    switch(period) {
        case '7':
            // Last week - use weekly data if available
            const weeklyData = reportsData.weeklyData || {};
            const recentWeeks = Object.keys(weeklyData).sort().slice(-1);
            // For demonstration, use recent month data
            filteredData = Object.fromEntries(sortedMonths.slice(-1).map(month => [month, monthlyData[month]]));
            break;
        case '30':
            // Last month
            filteredData = Object.fromEntries(sortedMonths.slice(-1).map(month => [month, monthlyData[month]]));
            break;
        case '90':
            // Last 3 months
            filteredData = Object.fromEntries(sortedMonths.slice(-3).map(month => [month, monthlyData[month]]));
            break;
        case '365':
        default:
            // Last year
            filteredData = Object.fromEntries(sortedMonths.slice(-12).map(month => [month, monthlyData[month]]));
            break;
    }
    
    // Update income/expense chart with filtered data
    if (incomeExpenseChart) {
        const chartData = prepareIncomeExpenseData(filteredData);
        incomeExpenseChart.data.labels = chartData.labels;
        incomeExpenseChart.data.datasets[0].data = chartData.income;
        incomeExpenseChart.data.datasets[1].data = chartData.expenses;
        incomeExpenseChart.update();
    }
}

// Update monthly comparison chart
function updateMonthlyComparison(period) {
    if (!monthlyChart) return;
    
    const reportsData = dataManager.getReports();
    let chartData;
    
    if (period === 'quarter') {
        // Group monthly data into quarters
        chartData = prepareQuarterlyData(reportsData.monthlyData);
    } else {
        chartData = prepareMonthlyComparisonData(reportsData.monthlyData);
    }
    
    monthlyChart.data.labels = chartData.labels;
    monthlyChart.data.datasets[0].data = chartData.data;
    monthlyChart.data.datasets[0].backgroundColor = chartData.colors;
    monthlyChart.update();
}

// Prepare quarterly data
function prepareQuarterlyData(monthlyData) {
    const quarters = {};
    
    Object.keys(monthlyData).forEach(month => {
        const year = month.split('-')[0];
        const monthNum = parseInt(month.split('-')[1]);
        const quarter = Math.ceil(monthNum / 3);
        const quarterKey = `${year}-Q${quarter}`;
        
        if (!quarters[quarterKey]) {
            quarters[quarterKey] = { income: 0, expenses: 0, savings: 0 };
        }
        
        quarters[quarterKey].income += monthlyData[month].income;
        quarters[quarterKey].expenses += monthlyData[month].expenses;
        quarters[quarterKey].savings += monthlyData[month].savings;
    });
    
    const sortedQuarters = Object.keys(quarters).sort();
    const recentQuarters = sortedQuarters.slice(-4);
    
    const data = recentQuarters.map(quarter => quarters[quarter].savings);
    const colors = data.map((savings, index) => {
        const opacity = 0.8 + (index * 0.05);
        return savings >= 0 ? `rgba(39, 202, 63, ${opacity})` : `rgba(231, 76, 60, ${opacity})`;
    });
    
    return {
        labels: recentQuarters.map(quarter => quarter.split('-')[1]),
        data: data,
        colors: colors
    };
}

// Update summary cards
function updateSummaryCards(period = '30') {
    const summaryStats = dataManager.getSummaryStats();
    const reportsData = dataManager.getReports();
    
    const cards = {
        totalIncome: document.getElementById('totalIncome'),
        totalExpenses: document.getElementById('totalExpenses'),
        netSavings: document.getElementById('netSavings'),
        savingsRate: document.getElementById('savingsRate'),
        incomeChange: document.getElementById('incomeChange'),
        expensesChange: document.getElementById('expensesChange'),
        savingsChange: document.getElementById('savingsChange'),
        rateChange: document.getElementById('rateChange')
    };

    // Calculate period-specific data
    const periodData = calculatePeriodData(reportsData.monthlyData, period);
    const previousPeriodData = calculatePreviousPeriodData(reportsData.monthlyData, period);
    
    // Update main values
    if (cards.totalIncome) cards.totalIncome.textContent = formatCurrency(periodData.income);
    if (cards.totalExpenses) cards.totalExpenses.textContent = formatCurrency(periodData.expenses);
    if (cards.netSavings) cards.netSavings.textContent = formatCurrency(periodData.savings);
    if (cards.savingsRate) cards.savingsRate.textContent = periodData.rate.toFixed(1) + '%';
    
    // Calculate and update change indicators
    const changes = calculateChanges(periodData, previousPeriodData);
    
    if (cards.incomeChange) {
        cards.incomeChange.textContent = changes.incomeChange;
        cards.incomeChange.className = 'summary-change ' + (changes.incomeChange.includes('+') ? 'positive' : 'negative');
    }
    
    if (cards.expensesChange) {
        cards.expensesChange.textContent = changes.expensesChange;
        cards.expensesChange.className = 'summary-change ' + (changes.expensesChange.includes('+') ? 'negative' : 'positive');
    }
    
    if (cards.savingsChange) {
        cards.savingsChange.textContent = changes.savingsChange;
        cards.savingsChange.className = 'summary-change ' + (changes.savingsChange.includes('+') ? 'positive' : 'negative');
    }
    
    if (cards.rateChange) {
        cards.rateChange.textContent = changes.rateChange;
        cards.rateChange.className = 'summary-change ' + (changes.rateChange.includes('+') ? 'positive' : 'negative');
    }
}

// Calculate period-specific data
function calculatePeriodData(monthlyData, period) {
    const sortedMonths = Object.keys(monthlyData).sort();
    let relevantMonths = [];
    
    switch(period) {
        case '7':
        case '30':
            relevantMonths = sortedMonths.slice(-1);
            break;
        case '90':
            relevantMonths = sortedMonths.slice(-3);
            break;
        case '365':
        default:
            relevantMonths = sortedMonths.slice(-12);
            break;
    }
    
    const totals = relevantMonths.reduce((acc, month) => {
        const data = monthlyData[month];
        acc.income += data.income;
        acc.expenses += data.expenses;
        acc.savings += data.savings;
        return acc;
    }, { income: 0, expenses: 0, savings: 0 });
    
    const rate = totals.income > 0 ? (totals.savings / totals.income) * 100 : 0;
    
    return { ...totals, rate };
}

// Calculate previous period data for comparison
function calculatePreviousPeriodData(monthlyData, period) {
    const sortedMonths = Object.keys(monthlyData).sort();
    let relevantMonths = [];
    
    switch(period) {
        case '7':
        case '30':
            relevantMonths = sortedMonths.slice(-2, -1);
            break;
        case '90':
            relevantMonths = sortedMonths.slice(-6, -3);
            break;
        case '365':
        default:
            relevantMonths = sortedMonths.slice(-24, -12);
            break;
    }
    
    if (relevantMonths.length === 0) {
        return { income: 0, expenses: 0, savings: 0, rate: 0 };
    }
    
    const totals = relevantMonths.reduce((acc, month) => {
        const data = monthlyData[month] || { income: 0, expenses: 0, savings: 0 };
        acc.income += data.income;
        acc.expenses += data.expenses;
        acc.savings += data.savings;
        return acc;
    }, { income: 0, expenses: 0, savings: 0 });
    
    const rate = totals.income > 0 ? (totals.savings / totals.income) * 100 : 0;
    
    return { ...totals, rate };
}

// Calculate percentage changes
function calculateChanges(current, previous) {
    const calculatePercentageChange = (current, previous) => {
        if (previous === 0) return current > 0 ? '+100.0%' : '0.0%';
        const change = ((current - previous) / Math.abs(previous)) * 100;
        return (change >= 0 ? '+' : '') + change.toFixed(1) + '%';
    };
    
    return {
        incomeChange: calculatePercentageChange(current.income, previous.income),
        expensesChange: calculatePercentageChange(current.expenses, previous.expenses),
        savingsChange: calculatePercentageChange(current.savings, previous.savings),
        rateChange: calculatePercentageChange(current.rate, previous.rate)
    };
}

// Update top expenses list
function updateTopExpenses(filter = 'month') {
    const topExpensesList = document.getElementById('topExpensesList');
    if (!topExpensesList) return;
    
    const expensesData = getTopExpensesFromData(filter);
    
    topExpensesList.innerHTML = expensesData.map(expense => `
        <div class="expense-item">
            <div class="expense-icon">
                <i class="${expense.icon}"></i>
            </div>
            <div class="expense-details">
                <h4>${expense.title}</h4>
                <p class="expense-date">${expense.date}</p>
                <span class="expense-category">${expense.category}</span>
            </div>
            <div class="expense-amount">${formatCurrency(expense.amount)}</div>
        </div>
    `).join('');
}

// Get top expenses from real data
function getTopExpensesFromData(filter) {
    const categories = dataManager.getCategories();
    const allTransactions = [];
    
    // Collect all transactions from all categories
    categories.forEach(category => {
        category.transactions.forEach(transaction => {
            if (transaction.type === 'expense') {
                allTransactions.push({
                    title: transaction.description,
                    date: formatDate(transaction.date),
                    category: category.name,
                    amount: transaction.amount,
                    icon: category.icon,
                    dateObj: new Date(transaction.date)
                });
            }
        });
    });
    
    // Filter by time period
    const now = new Date();
    const filteredTransactions = allTransactions.filter(transaction => {
        const daysDiff = Math.floor((now - transaction.dateObj) / (1000 * 60 * 60 * 24));
        
        switch(filter) {
            case 'week':
                return daysDiff <= 7;
            case 'month':
                return daysDiff <= 30;
            case 'year':
                return daysDiff <= 365;
            default:
                return daysDiff <= 30;
        }
    });
    
    // Sort by amount (descending) and return top 5
    return filteredTransactions
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);
}

// Update category legend
function updateCategoryLegend() {
    const legendContainer = document.getElementById('categoryLegend');
    if (!legendContainer) return;
    
    const categories = dataManager.getCategories();
    const filteredCategories = categories.filter(cat => cat.spent > 0);
    const total = filteredCategories.reduce((sum, cat) => sum + cat.spent, 0);
    
    legendContainer.innerHTML = filteredCategories.map(category => {
        const percentage = total > 0 ? ((category.spent / total) * 100).toFixed(1) : 0;
        return `
            <div class="legend-item">
                <div class="legend-color" style="background-color: ${category.color}"></div>
                <div class="legend-details">
                    <span class="legend-name">${category.name}</span>
                    <span class="legend-amount">${formatCurrency(category.spent)} (${percentage}%)</span>
                </div>
            </div>
        `;
    }).join('');
}

// Handle export functionality
function handleExport() {
    try {
        const success = dataManager.exportData();
        if (success) {
            showNotification('Daten erfolgreich exportiert!', 'success');
        } else {
            showNotification('Fehler beim Exportieren der Daten', 'error');
        }
    } catch (error) {
        console.error('Export error:', error);
        showNotification('Fehler beim Exportieren der Daten', 'error');
    }
}

// Handle share functionality
function handleShare() {
    const summaryStats = dataManager.getSummaryStats();
    const shareText = `Meine Budget-Übersicht:
📊 Gesamteinkommen: ${formatCurrency(summaryStats.totalIncome)}
💰 Ausgaben: ${formatCurrency(summaryStats.totalSpent)}
💸 Ersparnisse: ${formatCurrency(summaryStats.totalSavings)}
📈 Sparquote: ${summaryStats.savingsRate}%`;
    
    if (navigator.share) {
        navigator.share({
            title: 'Budget Bericht',
            text: shareText,
            url: window.location.href
        }).catch(err => console.log('Error sharing:', err));
    } else if (navigator.clipboard) {
        navigator.clipboard.writeText(shareText).then(() => {
            showNotification('Budget-Übersicht in Zwischenablage kopiert!', 'success');
        }).catch(() => {
            showNotification('Fehler beim Kopieren', 'error');
        });
    } else {
        showNotification('Teilen wird von diesem Browser nicht unterstützt', 'error');
    }
}

// Handle category details
function handleCategoryDetails() {
    const categories = dataManager.getCategories();
    const detailsHtml = categories.map(category => {
        const percentage = category.budget > 0 ? ((category.spent / category.budget) * 100).toFixed(1) : 0;
        const remaining = category.budget - category.spent;
        
        return `
            <div class="category-detail">
                <div class="category-header" style="border-left: 4px solid ${category.color}">
                    <h4><i class="${category.icon}"></i> ${category.name}</h4>
                    <span class="category-usage">${percentage}% verwendet</span>
                </div>
                <div class="category-amounts">
                    <span>Budget: ${formatCurrency(category.budget)}</span>
                    <span>Ausgegeben: ${formatCurrency(category.spent)}</span>
                    <span>Verbleibend: ${formatCurrency(remaining)}</span>
                </div>
            </div>
        `;
    }).join('');
    
    // You could show this in a modal or navigate to a details page
    console.log('Category details:', detailsHtml);
    showNotification('Kategorie-Details in der Konsole', 'info');
}

// Utility function to format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: 'EUR'
    }).format(amount);
}

// Utility function to format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

// Show notification to user
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${getNotificationColor(type)};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    
    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        .notification-content {
            display: flex;
            align-items: center;
            gap: 10px;
        }
    `;
    document.head.appendChild(style);
    
    // Add to page
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
            document.head.removeChild(style);
        }, 300);
    }, 3000);
}

// Get notification icon based on type
function getNotificationIcon(type) {
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    return icons[type] || 'info-circle';
}

// Get notification color based on type
function getNotificationColor(type) {
    const colors = {
        success: '#27ca3f',
        error: '#e74c3c',
        warning: '#f39c12',
        info: '#667eea'
    };
    return colors[type] || '#667eea';
}

// Initialize charts resize handler
window.addEventListener('resize', function() {
    if (incomeExpenseChart) incomeExpenseChart.resize();
    if (categoryChart) categoryChart.resize();
    if (monthlyChart) monthlyChart.resize();
});

// Performance monitoring
if (window.performance && window.performance.mark) {
    window.performance.mark('reports-js-loaded');
}