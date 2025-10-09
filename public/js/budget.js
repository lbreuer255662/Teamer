// budget.js - Budget Planer JavaScript Datei (Kompatibel mit DataManager)

// Globale Variablen
let budgetCategories = [];
let currentChart = null;
let currentHistoryChart = null;
let editingCategoryId = null;
let dataManager = null;

// DOM Elemente
const categoriesGrid = document.getElementById('categoriesGrid');
const categoryModal = document.getElementById('categoryModal');
const categoryForm = document.getElementById('categoryForm');
const addCategoryBtn = document.getElementById('addCategoryBtn');
const closeModalBtn = document.getElementById('closeModal');
const cancelBtn = document.getElementById('cancelBtn');
const exportBudgetBtn = document.getElementById('exportBudgetBtn');
const budgetPeriodSelect = document.getElementById('budgetPeriod');
const historyPeriodSelect = document.getElementById('historyPeriod');

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    initializeDataManager();
    initializeEventListeners();
    loadDataFromManager();
    renderCategories();
    renderBudgetChart();
    renderHistoryChart();
    updateOverviewCards();
});

// DataManager initialisieren
function initializeDataManager() {
    if (window.DataManager) {
        dataManager = window.DataManager;
        
        // Event Listener für Datenänderungen
        dataManager.onDataChange((section, data) => {
            if (section === 'categories' || section === '全体') {
                loadDataFromManager();
                renderCategories();
                renderBudgetChart();
                updateOverviewCards();
            }
        });
        
        console.log('DataManager erfolgreich initialisiert');
    } else {
        console.error('DataManager nicht verfügbar');
    }
}

// Daten aus DataManager laden
function loadDataFromManager() {
    if (dataManager) {
        budgetCategories = dataManager.getCategories();
    }
}

function initializeEventListeners() {
    // Modal Event Listeners
    addCategoryBtn.addEventListener('click', openAddCategoryModal);
    closeModalBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    categoryForm.addEventListener('submit', handleCategorySubmit);
    
    // Export Button
    exportBudgetBtn.addEventListener('click', exportBudget);
    
    // Period Selectors
    budgetPeriodSelect.addEventListener('change', handlePeriodChange);
    historyPeriodSelect.addEventListener('change', handleHistoryPeriodChange);
    
    // Chart Toggle Buttons
    const chartToggles = document.querySelectorAll('.chart-toggle');
    chartToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            const chartType = this.getAttribute('data-chart');
            switchChart(chartType);
        });
    });
    
    // Icon Selector
    const iconOptions = document.querySelectorAll('.icon-option');
    iconOptions.forEach(option => {
        option.addEventListener('click', function() {
            selectIcon(this);
        });
    });
    
    // Color Selector
    const colorOptions = document.querySelectorAll('.color-option');
    colorOptions.forEach(option => {
        option.addEventListener('click', function() {
            selectColor(this);
        });
    });
    
    // Modal Outside Click
    categoryModal.addEventListener('click', function(e) {
        if (e.target === categoryModal) {
            closeModal();
        }
    });
}

// Kategorie-Funktionen
function renderCategories() {
    if (!categoriesGrid) return;
    
    categoriesGrid.innerHTML = '';
    
    budgetCategories.forEach(category => {
        const categoryCard = createCategoryCard(category);
        categoriesGrid.appendChild(categoryCard);
    });
}

function createCategoryCard(category) {
    const percentage = Math.min((category.spent / category.budget) * 100, 100);
    const remaining = category.budget - category.spent;
    
    let budgetStatus = 'safe';
    if (percentage >= 90) budgetStatus = 'danger';
    else if (percentage >= 75) budgetStatus = 'warning';
    
    const card = document.createElement('div');
    card.className = 'category-card';
    card.innerHTML = `
        <div class="category-header">
            <div class="category-info">
                <div class="category-icon" style="background: ${category.color};">
                    <i class="${category.icon}"></i>
                </div>
                <div class="category-details">
                    <h3>${category.name}</h3>
                    <div class="category-amount">Budget: €${category.budget.toFixed(2)}</div>
                </div>
            </div>
            <div class="category-actions">
                <button class="btn-icon-small add-transaction" data-id="${category.id}" title="Transaktion hinzufügen">
                    <i class="fas fa-plus"></i>
                </button>
                <button class="btn-icon-small view-transactions" data-id="${category.id}" title="Transaktionen anzeigen">
                    <i class="fas fa-list"></i>
                </button>
                <button class="btn-icon-small edit-category" data-id="${category.id}" title="Bearbeiten">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon-small delete-category" data-id="${category.id}" title="Löschen">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
        
        <div class="category-progress-section">
            <div class="progress-header">
                <span class="spent-amount">€${category.spent.toFixed(2)}</span>
                <span class="budget-limit">von €${category.budget.toFixed(2)}</span>
            </div>
            <div class="category-progress-bar">
                <div class="category-progress" style="width: ${percentage}%; background: ${category.color};">
                    <span class="progress-percentage">${percentage.toFixed(1)}%</span>
                </div>
            </div>
        </div>
        
        <div class="category-stats">
            <div class="remaining-budget ${remaining >= 0 ? 'positive' : 'negative'}">
                Verbleibend: €${remaining.toFixed(2)}
            </div>
            <div class="budget-status ${budgetStatus}">
                ${budgetStatus === 'safe' ? 'Im Rahmen' : 
                  budgetStatus === 'warning' ? 'Warnung' : 'Überschritten'}
            </div>
            <div class="transaction-count">
                ${category.transactions ? category.transactions.length : 0} Transaktionen
            </div>
        </div>
    `;
    
    // Event Listeners für Buttons
    const addTransactionBtn = card.querySelector('.add-transaction');
    const viewTransactionsBtn = card.querySelector('.view-transactions');
    const editBtn = card.querySelector('.edit-category');
    const deleteBtn = card.querySelector('.delete-category');
    
    addTransactionBtn.addEventListener('click', () => openAddTransactionModal(category.id));
    viewTransactionsBtn.addEventListener('click', () => viewTransactions(category.id));
    editBtn.addEventListener('click', () => openEditCategoryModal(category.id));
    deleteBtn.addEventListener('click', () => deleteCategory(category.id));
    
    return card;
}

// Modal-Funktionen
function openAddCategoryModal() {
    editingCategoryId = null;
    document.getElementById('modalTitle').textContent = 'Kategorie hinzufügen';
    resetForm();
    categoryModal.classList.add('show');
}

function openEditCategoryModal(categoryId) {
    editingCategoryId = categoryId;
    const category = dataManager ? dataManager.getCategoryById(categoryId) : 
                    budgetCategories.find(cat => cat.id === categoryId);
    
    if (category) {
        document.getElementById('modalTitle').textContent = 'Kategorie bearbeiten';
        
        // Formular mit Kategorie-Daten füllen
        document.getElementById('categoryName').value = category.name;
        document.getElementById('budgetAmount').value = category.budget;
        document.getElementById('selectedIcon').value = category.icon;
        document.getElementById('selectedColor').value = category.color;
        
        // Icon und Farbe visuell auswählen
        selectIconByValue(category.icon);
        selectColorByValue(category.color);
        
        categoryModal.classList.add('show');
    }
}

function openAddTransactionModal(categoryId) {
    // Hier würde normalerweise ein separates Modal für Transaktionen geöffnet
    const amount = prompt('Betrag eingeben (€):');
    const description = prompt('Beschreibung:') || 'Transaktion';
    
    if (amount && !isNaN(amount)) {
        const transaction = {
            amount: parseFloat(amount),
            description: description,
            date: new Date().toISOString().split('T')[0],
            type: 'expense'
        };
        
        if (dataManager) {
            dataManager.addTransaction(categoryId, transaction);
            loadDataFromManager();
            renderCategories();
            renderBudgetChart();
            updateOverviewCards();
        }
    }
}

function viewTransactions(categoryId) {
    const category = dataManager ? dataManager.getCategoryById(categoryId) : 
                    budgetCategories.find(cat => cat.id === categoryId);
    
    if (category && category.transactions) {
        let transactionList = `Transaktionen für ${category.name}:\n\n`;
        category.transactions.forEach(transaction => {
            transactionList += `${transaction.date}: ${transaction.description} - €${transaction.amount.toFixed(2)}\n`;
        });
        
        if (category.transactions.length === 0) {
            transactionList += 'Keine Transaktionen vorhanden.';
        }
        
        alert(transactionList);
    }
}

function closeModal() {
    categoryModal.classList.remove('show');
    resetForm();
}

function resetForm() {
    categoryForm.reset();
    
    // Icon und Farbe zurücksetzen
    document.querySelectorAll('.icon-option').forEach(option => {
        option.classList.remove('active');
    });
    document.querySelectorAll('.color-option').forEach(option => {
        option.classList.remove('active');
    });
    
    // Erste Option als Standard auswählen
    const firstIcon = document.querySelector('.icon-option');
    const firstColor = document.querySelector('.color-option');
    
    if (firstIcon) {
        firstIcon.classList.add('active');
        document.getElementById('selectedIcon').value = 'fas fa-home';
    }
    if (firstColor) {
        firstColor.classList.add('active');
        document.getElementById('selectedColor').value = '#667eea';
    }
}

function handleCategorySubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(categoryForm);
    const categoryData = {
        name: formData.get('categoryName'),
        icon: formData.get('selectedIcon'),
        color: formData.get('selectedColor'),
        budget: parseFloat(formData.get('budgetAmount'))
    };
    
    if (editingCategoryId) {
        // Kategorie bearbeiten
        if (dataManager) {
            dataManager.updateCategory(editingCategoryId, categoryData);
        } else {
            const categoryIndex = budgetCategories.findIndex(cat => cat.id === editingCategoryId);
            if (categoryIndex > -1) {
                budgetCategories[categoryIndex] = {
                    ...budgetCategories[categoryIndex],
                    ...categoryData
                };
            }
        }
    } else {
        // Neue Kategorie hinzufügen
        if (dataManager) {
            dataManager.addCategory(categoryData);
        } else {
            categoryData.id = Date.now();
            categoryData.spent = 0;
            categoryData.transactions = [];
            budgetCategories.push(categoryData);
        }
    }
    
    closeModal();
    loadDataFromManager();
    renderCategories();
    renderBudgetChart();
    updateOverviewCards();
}

function deleteCategory(categoryId) {
    if (confirm('Sind Sie sicher, dass Sie diese Kategorie löschen möchten?')) {
        if (dataManager) {
            dataManager.deleteCategory(categoryId);
        } else {
            budgetCategories = budgetCategories.filter(cat => cat.id !== categoryId);
        }
        
        loadDataFromManager();
        renderCategories();
        renderBudgetChart();
        updateOverviewCards();
    }
}

// Icon und Farb-Auswahl
function selectIcon(element) {
    document.querySelectorAll('.icon-option').forEach(option => {
        option.classList.remove('active');
    });
    element.classList.add('active');
    document.getElementById('selectedIcon').value = element.getAttribute('data-icon');
}

function selectColor(element) {
    document.querySelectorAll('.color-option').forEach(option => {
        option.classList.remove('active');
    });
    element.classList.add('active');
    document.getElementById('selectedColor').value = element.getAttribute('data-color');
}

function selectIconByValue(iconValue) {
    document.querySelectorAll('.icon-option').forEach(option => {
        option.classList.remove('active');
        if (option.getAttribute('data-icon') === iconValue) {
            option.classList.add('active');
        }
    });
}

function selectColorByValue(colorValue) {
    document.querySelectorAll('.color-option').forEach(option => {
        option.classList.remove('active');
        if (option.getAttribute('data-color') === colorValue) {
            option.classList.add('active');
        }
    });
}

// Chart-Funktionen
function renderBudgetChart() {
    const chartCanvas = document.getElementById('budgetChart');
    if (!chartCanvas) return;
    
    const ctx = chartCanvas.getContext('2d');
    
    if (currentChart) {
        currentChart.destroy();
    }
    
    const chartToggle = document.querySelector('.chart-toggle.active');
    const chartType = chartToggle ? chartToggle.getAttribute('data-chart') : 'pie';
    
    const data = {
        labels: budgetCategories.map(cat => cat.name),
        datasets: [{
            data: budgetCategories.map(cat => cat.budget),
            backgroundColor: budgetCategories.map(cat => cat.color),
            borderWidth: 0
        }]
    };
    
    const config = {
        type: chartType === 'pie' ? 'pie' : 'bar',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: chartType === 'pie' ? 'bottom' : 'top',
                    labels: {
                        padding: 20,
                        usePointStyle: true
                    }
                }
            }
        }
    };
    
    if (chartType === 'bar') {
        config.options.scales = {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: function(value) {
                        return '€' + value;
                    }
                }
            }
        };
    }
    
    currentChart = new Chart(ctx, config);
}

function renderHistoryChart() {
    const chartCanvas = document.getElementById('historyChart');
    if (!chartCanvas) return;
    
    const ctx = chartCanvas.getContext('2d');
    
    if (currentHistoryChart) {
        currentHistoryChart.destroy();
    }
    
    // Daten aus DataManager laden wenn verfügbar
    let monthlyData = {};
    if (dataManager) {
        const reports = dataManager.getReports();
        monthlyData = reports.monthlyData || {};
    }
    
    // Fallback-Daten wenn keine Berichte vorhanden
    const months = ['Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov'];
    const budgetData = months.map(month => {
        const monthKey = `2024-${String(months.indexOf(month) + 6).padStart(2, '0')}`;
        return monthlyData[monthKey] ? monthlyData[monthKey].income : 
               2400 + Math.random() * 400;
    });
    const spentData = months.map(month => {
        const monthKey = `2024-${String(months.indexOf(month) + 6).padStart(2, '0')}`;
        return monthlyData[monthKey] ? monthlyData[monthKey].expenses : 
               2000 + Math.random() * 600;
    });
    
    const config = {
        type: 'line',
        data: {
            labels: months,
            datasets: [
                {
                    label: 'Einnahmen',
                    data: budgetData,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Ausgaben',
                    data: spentData,
                    borderColor: '#e74c3c',
                    backgroundColor: 'rgba(231, 76, 60, 0.1)',
                    fill: true,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '€' + value;
                        }
                    }
                }
            }
        }
    };
    
    currentHistoryChart = new Chart(ctx, config);
}

function switchChart(chartType) {
    document.querySelectorAll('.chart-toggle').forEach(toggle => {
        toggle.classList.remove('active');
    });
    const targetToggle = document.querySelector(`[data-chart="${chartType}"]`);
    if (targetToggle) {
        targetToggle.classList.add('active');
    }
    
    renderBudgetChart();
}

// Übersichtskarten aktualisieren
function updateOverviewCards() {
    const totalBudget = budgetCategories.reduce((sum, cat) => sum + cat.budget, 0);
    const totalSpent = budgetCategories.reduce((sum, cat) => sum + cat.spent, 0);
    const remaining = totalBudget - totalSpent;
    const spentPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
    
    // Einnahmen aus DataManager laden
    let totalIncome = 0;
    if (dataManager) {
        const income = dataManager.getIncome();
        totalIncome = income.reduce((sum, inc) => sum + inc.amount, 0);
    }
    
    // Karten aktualisieren (falls die Elemente existieren)
    const totalBudgetElement = document.querySelector('.total-budget .amount');
    const spentElement = document.querySelector('.spent .amount');
    const spentPercentageElement = document.querySelector('.spent .percentage');
    const remainingElement = document.querySelector('.remaining .amount');
    const incomeElement = document.querySelector('.income .amount');
    
    if (totalBudgetElement) totalBudgetElement.textContent = `€${totalBudget.toFixed(2)}`;
    if (spentElement) spentElement.textContent = `€${totalSpent.toFixed(2)}`;
    if (spentPercentageElement) spentPercentageElement.textContent = `${spentPercentage.toFixed(1)}% des Budgets`;
    if (remainingElement) remainingElement.textContent = `€${remaining.toFixed(2)}`;
    if (incomeElement) incomeElement.textContent = `€${totalIncome.toFixed(2)}`;
}

// Event Handler
function handlePeriodChange() {
    if (budgetPeriodSelect) {
        console.log('Periode geändert:', budgetPeriodSelect.value);
        // Hier können periodespezifische Daten geladen werden
    }
}

function handleHistoryPeriodChange() {
    if (historyPeriodSelect) {
        console.log('Verlaufs-Periode geändert:', historyPeriodSelect.value);
        renderHistoryChart();
    }
}

function exportBudget() {
    if (dataManager) {
        // Vollständigen Export über DataManager
        dataManager.exportData();
    } else {
        // Fallback: Nur Kategorien exportieren
        const budgetData = {
            period: budgetPeriodSelect ? budgetPeriodSelect.value : 'aktuell',
            totalBudget: budgetCategories.reduce((sum, cat) => sum + cat.budget, 0),
            totalSpent: budgetCategories.reduce((sum, cat) => sum + cat.spent, 0),
            categories: budgetCategories.map(cat => ({
                name: cat.name,
                budget: cat.budget,
                spent: cat.spent,
                remaining: cat.budget - cat.spent
            }))
        };
        
        const dataStr = JSON.stringify(budgetData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `budget_export_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    }
}

// Hilfsfunktionen
function formatCurrency(amount) {
    return new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: 'EUR'
    }).format(amount);
}

function calculatePercentage(spent, budget) {
    if (budget === 0) return 0;
    return Math.min((spent / budget) * 100, 100);
}

// Öffentliche API für externe Verwendung
window.BudgetApp = {
    refreshData: function() {
        loadDataFromManager();
        renderCategories();
        renderBudgetChart();
        renderHistoryChart();
        updateOverviewCards();
    },
    
    addTransaction: function(categoryId, amount, description) {
        if (dataManager) {
            const transaction = {
                amount: parseFloat(amount),
                description: description || 'Transaktion',
                date: new Date().toISOString().split('T')[0],
                type: 'expense'
            };
            return dataManager.addTransaction(categoryId, transaction);
        }
        return false;
    },
    
    getCategories: function() {
        return budgetCategories;
    },
    
    getSummary: function() {
        if (dataManager) {
            return dataManager.getSummaryStats();
        }
        return {
            totalBudget: budgetCategories.reduce((sum, cat) => sum + cat.budget, 0),
            totalSpent: budgetCategories.reduce((sum, cat) => sum + cat.spent, 0)
        };
    }
};

// Initialisierung beim Laden der Seite
console.log('Budget Planer mit DataManager-Integration geladen');