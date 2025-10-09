// dashboard.js - Main JavaScript file for the dashboard - DataManager Compatible
document.addEventListener('DOMContentLoaded', function() {
    // Warten bis DataManager verfügbar ist
    if (typeof window.DataManager === 'undefined') {
        console.error('DataManager ist nicht verfügbar!');
        return;
    }

    // DataManager Event Listener registrieren
    window.DataManager.onDataChange((section, data) => {
        console.log('Daten geändert:', section, data);
        // Charts und UI aktualisieren wenn sich Daten ändern
        if (section === 'categories' || section === 'income' || section === 'reports') {
            setTimeout(() => updateChartsFromData(), 100);
        }
        if (section === 'tasks') {
            setTimeout(() => updateTasksFromData(), 100);
        }
    });

    // Initialize charts with real data
    initializeCharts();
    
    // Add event listeners
    setupEventListeners();
    
    // Animate elements on load
    animateElements();
    
    // Update real-time data
    updateRealTimeData();

    // Update stats from DataManager
    updateStatsFromData();

    // Update tasks from DataManager
    updateTasksFromData();
});

// Chart initialization with DataManager data
function initializeCharts() {
    const categories = window.DataManager.getCategories();
    const reports = window.DataManager.getReports();
    const income = window.DataManager.getIncome();
    
    // Income vs Expense Chart (Bar Chart) - Weekly data
    initializeIncomeExpenseChart();
    
    // Category Pie Chart
    initializeCategoryChart(categories);
    
    // Monthly Trend Chart (Line Chart)
    initializeTrendChart(reports.monthlyData);
}

function initializeIncomeExpenseChart() {
    const reports = window.DataManager.getReports();
    const weeklyData = reports.weeklyData || {};
    
    // Aktuelle Woche und 6 Wochen davor
    const weeks = [];
    const incomeData = [];
    const expenseData = [];
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - (i * 7));
        const weekKey = getWeekKey(date);
        const weekName = getWeekDayName(date);
        
        weeks.push(weekName);
        
        const weekData = weeklyData[weekKey] || { income: 0, expenses: 0 };
        incomeData.push(weekData.income);
        expenseData.push(Math.abs(weekData.expenses)); // Positive Darstellung
    }

    const incomeExpenseCtx = document.getElementById('incomeExpenseChart');
    if (!incomeExpenseCtx) return;

    new Chart(incomeExpenseCtx.getContext('2d'), {
        type: 'bar',
        data: {
            labels: weeks,
            datasets: [{
                label: 'Einnahmen',
                data: incomeData,
                backgroundColor: 'rgba(39, 202, 63, 0.8)',
                borderColor: '#27ca3f',
                borderWidth: 2,
                borderRadius: 8,
                borderSkipped: false,
            }, {
                label: 'Ausgaben',
                data: expenseData,
                backgroundColor: 'rgba(231, 76, 60, 0.8)',
                borderColor: '#e74c3c',
                borderWidth: 2,
                borderRadius: 8,
                borderSkipped: false,
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
                        padding: 20,
                        font: {
                            size: 12,
                            weight: '500'
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0,0,0,0.05)'
                    },
                    ticks: {
                        callback: function(value) {
                            return '€' + value;
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

function initializeCategoryChart(categories) {
    const categoryCtx = document.getElementById('categoryChart');
    if (!categoryCtx || !categories.length) return;

    const labels = categories.map(cat => cat.name);
    const data = categories.map(cat => cat.spent);
    const colors = categories.map(cat => cat.color || '#667eea');

    new Chart(categoryCtx.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderWidth: 3,
                borderColor: '#fff',
                hoverBorderColor: '#fff',
                hoverBorderWidth: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        padding: 15,
                        font: {
                            size: 11
                        }
                    }
                }
            },
            cutout: '60%'
        }
    });
}

function initializeTrendChart(monthlyData) {
    const trendCtx = document.getElementById('trendChart');
    if (!trendCtx) return;

    // Letzte 12 Monate
    const months = [];
    const incomeData = [];
    const expenseData = [];
    const savingsData = [];

    for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthName = date.toLocaleDateString('de-DE', { month: 'short' });
        
        months.push(monthName);
        
        const monthData = monthlyData[monthKey] || { income: 0, expenses: 0, savings: 0 };
        incomeData.push(monthData.income);
        expenseData.push(Math.abs(monthData.expenses));
        savingsData.push(monthData.savings);
    }

    new Chart(trendCtx.getContext('2d'), {
        type: 'line',
        data: {
            labels: months,
            datasets: [{
                label: 'Einnahmen',
                data: incomeData,
                borderColor: '#27ca3f',
                backgroundColor: 'rgba(39, 202, 63, 0.1)',
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#27ca3f',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5
            }, {
                label: 'Ausgaben',
                data: expenseData,
                borderColor: '#e74c3c',
                backgroundColor: 'rgba(231, 76, 60, 0.1)',
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#e74c3c',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5
            }, {
                label: 'Ersparnisse',
                data: savingsData,
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#667eea',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    display: false // Legend ist bereits im HTML
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0,0,0,0.05)'
                    },
                    ticks: {
                        callback: function(value) {
                            return '€' + value;
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

// Event Listeners Setup
function setupEventListeners() {
    // Navigation menu
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Time filter change
    const timeFilter = document.querySelector('.time-filter');
    if (timeFilter) {
        timeFilter.addEventListener('change', function() {
            updateChartData(this.value);
        });
    }

    // Task checkboxes - mit DataManager Integration
    const taskCheckboxes = document.querySelectorAll('.task-checkbox input');
    taskCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const taskId = parseInt(this.dataset.taskId);
            if (taskId) {
                // Task-Status im DataManager aktualisieren
                window.DataManager.toggleTask(taskId);
            }
            
            const taskText = this.closest('.task-item').querySelector('.task-text');
            if (this.checked) {
                taskText.classList.add('completed');
            } else {
                taskText.classList.remove('completed');
            }
            updateTaskProgress();
        });
    });

    // Button hover effects
    const buttons = document.querySelectorAll('.btn-primary, .btn-secondary, .btn-icon');
    buttons.forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });

    // Card hover effects
    const cards = document.querySelectorAll('.dashboard-card, .stat-card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
}

// Animation functions
function animateElements() {
    // Animate stats cards
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach((card, index) => {
        setTimeout(() => {
            card.classList.add('fade-in');
        }, index * 100);
    });

    // Animate dashboard cards
    const dashboardCards = document.querySelectorAll('.dashboard-card');
    dashboardCards.forEach((card, index) => {
        setTimeout(() => {
            card.classList.add('slide-up');
        }, 300 + (index * 150));
    });

    // Animate progress bars
    setTimeout(() => {
        animateProgressBars();
    }, 1000);

    // Animate numbers
    setTimeout(() => {
        animateNumbers();
    }, 500);
}

function animateProgressBars() {
    const progressBars = document.querySelectorAll('.progress');
    progressBars.forEach(bar => {
        const width = bar.style.width;
        bar.style.width = '0%';
        setTimeout(() => {
            bar.style.width = width;
        }, 100);
    });
}

function animateNumbers() {
    const statValues = document.querySelectorAll('.stat-value');
    statValues.forEach(element => {
        const text = element.textContent;
        const number = parseFloat(text.replace(/[€,.]/g, ''));
        
        if (!isNaN(number)) {
            let current = 0;
            const increment = number / 50;
            const timer = setInterval(() => {
                current += increment;
                if (current >= number) {
                    current = number;
                    clearInterval(timer);
                }
                
                if (text.includes('€')) {
                    element.textContent = formatCurrency(current);
                } else {
                    element.textContent = Math.floor(current) + (text.includes('/') ? text.substring(text.indexOf('/')) : '');
                }
            }, 20);
        }
    });
}

// Update functions with DataManager integration
function updateChartData(period) {
    console.log('Updating chart data for period:', period);
    
    // Charts basierend auf dem gewählten Zeitraum aktualisieren
    setTimeout(() => {
        // Alle Charts neu initialisieren
        // Erst vorherige Charts zerstören wenn nötig
        Chart.helpers.each(Chart.instances, function(instance) {
            instance.destroy();
        });
        
        initializeCharts();
    }, 100);
}

function updateChartsFromData() {
    // Alle Charts mit neuen Daten aktualisieren
    Chart.helpers.each(Chart.instances, function(instance) {
        instance.destroy();
    });
    
    initializeCharts();
}

function updateStatsFromData() {
    const stats = window.DataManager.getSummaryStats();
    
    // Statistiken im HTML aktualisieren
    updateStatElement('.total-income .stat-value', stats.totalIncome, true);
    updateStatElement('.total-expenses .stat-value', stats.totalSpent, true);
    updateStatElement('.total-savings .stat-value', stats.totalSavings, true);
    updateStatElement('.savings-rate .stat-value', stats.savingsRate + '%', false);
    
    // Budget-Auslastung aktualisieren
    const budgetUtilization = Math.min(stats.budgetUtilization, 100);
    updateStatElement('.budget-usage .stat-value', budgetUtilization.toFixed(1) + '%', false);
    
    // Fortschrittsbalken aktualisieren
    const progressBar = document.querySelector('.budget-progress .progress');
    if (progressBar) {
        progressBar.style.width = budgetUtilization + '%';
    }
}

function updateStatElement(selector, value, isCurrency) {
    const element = document.querySelector(selector);
    if (element) {
        if (isCurrency) {
            element.textContent = formatCurrency(value);
        } else {
            element.textContent = value.toString();
        }
    }
}

function updateTasksFromData() {
    const tasks = window.DataManager.getTasks();
    
    // Task-Liste im HTML aktualisieren
    const taskContainer = document.querySelector('.task-list');
    if (taskContainer) {
        // Neue Task-Liste generieren
        let taskHTML = '';
        tasks.forEach(task => {
            const checkedAttr = task.completed ? 'checked' : '';
            const completedClass = task.completed ? 'completed' : '';
            const priorityClass = `priority-${task.priority || 'medium'}`;
            
            taskHTML += `
                <div class="task-item ${priorityClass}">
                    <div class="task-checkbox">
                        <input type="checkbox" ${checkedAttr} data-task-id="${task.id}">
                        <span class="checkmark"></span>
                    </div>
                    <div class="task-content">
                        <span class="task-text ${completedClass}">${task.title}</span>
                        <span class="task-date">${formatDate(new Date(task.dueDate))}</span>
                    </div>
                </div>
            `;
        });
        
        taskContainer.innerHTML = taskHTML;
        
        // Event Listeners für neue Checkboxes hinzufügen
        setupTaskEventListeners();
    }
    
    updateTaskProgress();
}

function setupTaskEventListeners() {
    const taskCheckboxes = document.querySelectorAll('.task-checkbox input');
    taskCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const taskId = parseInt(this.dataset.taskId);
            if (taskId) {
                window.DataManager.toggleTask(taskId);
            }
            
            const taskText = this.closest('.task-item').querySelector('.task-text');
            if (this.checked) {
                taskText.classList.add('completed');
            } else {
                taskText.classList.remove('completed');
            }
            updateTaskProgress();
        });
    });
}

function updateTaskProgress() {
    const tasks = window.DataManager.getTasks();
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.completed).length;
    const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    // Update progress ring
    const progressText = document.querySelector('.progress-text');
    const progressCircle = document.querySelector('.progress-svg circle:last-child');
    
    if (progressText && progressCircle) {
        progressText.textContent = percentage + '%';
        
        const circumference = 2 * Math.PI * 30; // radius = 30
        const offset = circumference - (percentage / 100) * circumference;
        progressCircle.style.strokeDashoffset = offset;
    }
    
    // Update task stats
    const taskStats = document.querySelector('.task-stats');
    if (taskStats) {
        const statElements = taskStats.querySelectorAll('p strong');
        if (statElements.length >= 2) {
            statElements[0].textContent = completedTasks;
            statElements[1].textContent = totalTasks - completedTasks;
        }
    }
}

function updateRealTimeData() {
    // Echtzeit-Updates alle 30 Sekunden
    setInterval(() => {
        // Statistiken aktualisieren
        updateStatsFromData();
        
        // Gelegentliche visuelle Effekte
        if (Math.random() < 0.1) { // 10% chance every interval
            updateRandomStat();
        }
    }, 30000); // Every 30 seconds
}

function updateRandomStat() {
    const statValues = document.querySelectorAll('.stat-value');
    const randomStat = statValues[Math.floor(Math.random() * statValues.length)];
    
    // Add a subtle pulse effect
    randomStat.style.transform = 'scale(1.05)';
    setTimeout(() => {
        randomStat.style.transform = 'scale(1)';
    }, 200);
}

// Utility functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: 'EUR'
    }).format(amount);
}

function formatDate(date) {
    return new Intl.DateTimeFormat('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }).format(date);
}

function getWeekKey(date) {
    const year = date.getFullYear();
    const week = getWeekNumber(date);
    return `${year}-W${String(week).padStart(2, '0')}`;
}

function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function getWeekDayName(date) {
    const days = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
    return days[date.getDay()];
}

// Theme toggle functionality
function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    const theme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
    
    // Theme in DataManager Settings speichern
    window.DataManager.updateSettings({ theme: theme });
}

// Load saved theme from DataManager
function loadTheme() {
    const settings = window.DataManager.getSettings();
    if (settings.theme === 'dark') {
        document.body.classList.add('dark-theme');
    }
}

// Initialize theme on load
loadTheme();

function toggleMoreMenu() {
    const moreMenu = document.querySelector('.more-menu');
    if (moreMenu.classList.contains('show')) {
        moreMenu.classList.remove('show');
    } else {
        moreMenu.classList.add('show');
    }
}

// API für externe Nutzung
window.dashboardUtils = {
    updateChartData,
    updateTaskProgress,
    updateStatsFromData,
    updateTasksFromData,
    formatCurrency,
    formatDate,
    toggleTheme,
    // Neue DataManager-Integration
    addTransaction: (categoryId, transaction) => {
        return window.DataManager.addTransaction(categoryId, transaction);
    },
    addIncome: (income) => {
        return window.DataManager.addIncome(income);
    },
    addTask: (task) => {
        return window.DataManager.addTask(task);
    },
    refreshDashboard: () => {
        updateStatsFromData();
        updateTasksFromData();
        updateChartsFromData();
    }
};