// dataManager.js - JSON-Datei basiertes Datenspeicher-System

class DataManager {
    constructor() {
        this.dataFile = 'Backend/Data/data.json';
        this.backupFile = 'Backend/Data/backup.json';
        this.defaultData = this.getDefaultData();
        this.cache = null;
        this.init();
    }

    // Initialisierung des Datensystems
    async init() {
        try {
            await this.loadData();
            this.migrateDataIfNeeded();
        } catch (error) {
            console.warn('Fehler beim Laden der JSON-Datei, verwende Standarddaten:', error);
            this.cache = this.defaultData;
            await this.saveData(); // Erstelle die JSON-Datei mit Standarddaten
        }
    }

    // Daten aus JSON-Datei laden
    async loadData() {
        try {
            const response = await fetch(this.dataFile);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            
            // Validierung der geladenen Daten
            if (!this.validateData(data)) {
                throw new Error('Geladene Daten sind ungültig');
            }
            
            this.cache = data;
            return data;
        } catch (error) {
            console.error('Fehler beim Laden der JSON-Datei:', error);
            throw error;
        }
    }

    // Daten in JSON-Datei speichern
    async saveData() {
        try {
            // Backup erstellen bevor gespeichert wird
            await this.createBackup();
            
            // Timestamp aktualisieren
            this.cache.lastUpdated = new Date().toISOString();
            
            // Daten an Server senden zum Speichern
            const response = await fetch(this.dataFile, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(this.cache, null, 2)
            });

            if (!response.ok) {
                throw new Error(`Fehler beim Speichern: ${response.status}`);
            }

            this.notifyDataChange('全体', this.cache);
            return true;
        } catch (error) {
            console.error('Fehler beim Speichern der JSON-Datei:', error);
            // Fallback: Versuche localStorage als temporären Speicher
            this.saveToLocalStorage();
            return false;
        }
    }

    // Backup erstellen
    async createBackup() {
        try {
            if (this.cache) {
                const backupData = {
                    ...this.cache,
                    backupDate: new Date().toISOString()
                };
                
                await fetch(this.backupFile, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(backupData, null, 2)
                });
            }
        } catch (error) {
            console.warn('Backup konnte nicht erstellt werden:', error);
        }
    }

    // Fallback zu localStorage
    saveToLocalStorage() {
        try {
            localStorage.setItem('budgetAppData_backup', JSON.stringify(this.cache));
            console.warn('Daten wurden temporär in localStorage gespeichert');
        } catch (error) {
            console.error('Auch localStorage-Fallback fehlgeschlagen:', error);
        }
    }

    // Aus localStorage wiederherstellen
    async restoreFromLocalStorage() {
        try {
            const data = localStorage.getItem('budgetAppData_backup');
            if (data) {
                this.cache = JSON.parse(data);
                await this.saveData(); // Versuche wieder in JSON-Datei zu speichern
                localStorage.removeItem('budgetAppData_backup');
                return true;
            }
        } catch (error) {
            console.error('Wiederherstellung aus localStorage fehlgeschlagen:', error);
        }
        return false;
    }

    // Standard-Datenstruktur
    getDefaultData() {
        return {
            version: '1.0',
            lastUpdated: new Date().toISOString(),
            settings: {
                currency: 'EUR',
                language: 'de',
                theme: 'light',
                dateFormat: 'DD.MM.YYYY'
            },
            categories: [
                {
                    id: 1,
                    name: 'Wohnung',
                    icon: 'fas fa-home',
                    color: '#667eea',
                    budget: 800,
                    spent: 800,
                    transactions: [
                        {
                            id: 1001,
                            amount: 800,
                            description: 'Miete November',
                            date: '2024-11-01',
                            type: 'expense'
                        }
                    ]
                },
                {
                    id: 2,
                    name: 'Lebensmittel',
                    icon: 'fas fa-utensils',
                    color: '#27ca3f',
                    budget: 400,
                    spent: 285,
                    transactions: [
                        {
                            id: 1002,
                            amount: 156.30,
                            description: 'Wocheneinkauf',
                            date: '2024-11-28',
                            type: 'expense'
                        },
                        {
                            id: 1003,
                            amount: 128.70,
                            description: 'Verschiedene Einkäufe',
                            date: '2024-11-15',
                            type: 'expense'
                        }
                    ]
                },
                {
                    id: 3,
                    name: 'Transport',
                    icon: 'fas fa-car',
                    color: '#e74c3c',
                    budget: 200,
                    spent: 160,
                    transactions: [
                        {
                            id: 1004,
                            amount: 65.00,
                            description: 'Tankstelle',
                            date: '2024-11-26',
                            type: 'expense'
                        },
                        {
                            id: 1005,
                            amount: 95.00,
                            description: 'Öffentliche Verkehrsmittel',
                            date: '2024-11-01',
                            type: 'expense'
                        }
                    ]
                },
                {
                    id: 4,
                    name: 'Unterhaltung',
                    icon: 'fas fa-gamepad',
                    color: '#f39c12',
                    budget: 150,
                    spent: 67.49,
                    transactions: [
                        {
                            id: 1006,
                            amount: 42.50,
                            description: 'Restaurant',
                            date: '2024-11-25',
                            type: 'expense'
                        },
                        {
                            id: 1007,
                            amount: 24.00,
                            description: 'Kino',
                            date: '2024-11-23',
                            type: 'expense'
                        },
                        {
                            id: 1008,
                            amount: 0.99,
                            description: 'App-Kauf',
                            date: '2024-11-20',
                            type: 'expense'
                        }
                    ]
                }
            ],
            income: [
                {
                    id: 2001,
                    amount: 3200,
                    description: 'Gehalt November',
                    date: '2024-11-01',
                    category: 'Gehalt',
                    type: 'income'
                },
                {
                    id: 2002,
                    amount: 150,
                    description: 'Bonus',
                    date: '2024-11-15',
                    category: 'Bonus',
                    type: 'income'
                }
            ],
            reports: {
                monthlyData: {
                    '2024-01': { income: 3200, expenses: 2100, savings: 1100 },
                    '2024-02': { income: 3100, expenses: 2300, savings: 800 },
                    '2024-03': { income: 3250, expenses: 2050, savings: 1200 },
                    '2024-04': { income: 3180, expenses: 2200, savings: 980 },
                    '2024-05': { income: 3300, expenses: 2150, savings: 1150 },
                    '2024-06': { income: 3400, expenses: 2400, savings: 1000 },
                    '2024-07': { income: 3350, expenses: 2300, savings: 1050 },
                    '2024-08': { income: 3500, expenses: 2250, savings: 1250 },
                    '2024-09': { income: 3280, expenses: 2180, savings: 1100 },
                    '2024-10': { income: 3150, expenses: 2350, savings: 800 },
                    '2024-11': { income: 3350, expenses: 1312.49, savings: 2037.51 }
                },
                weeklyData: {
                    '2024-W47': { income: 0, expenses: 287.49, savings: -287.49 },
                    '2024-W46': { income: 0, expenses: 225.80, savings: -225.80 },
                    '2024-W45': { income: 150, expenses: 189.20, savings: -39.20 },
                    '2024-W44': { income: 3200, expenses: 610.00, savings: 2590.00 }
                }
            },
            goals: [
                {
                    id: 3001,
                    title: 'Notgroschen aufbauen',
                    targetAmount: 5000,
                    currentAmount: 2500,
                    deadline: '2024-12-31',
                    category: 'Sparen',
                    priority: 'high'
                },
                {
                    id: 3002,
                    title: 'Urlaub 2025',
                    targetAmount: 2000,
                    currentAmount: 850,
                    deadline: '2025-06-01',
                    category: 'Reisen',
                    priority: 'medium'
                }
            ],
            tasks: [
                {
                    id: 4001,
                    title: 'Budget für Dezember planen',
                    completed: false,
                    dueDate: '2024-12-01',
                    priority: 'high'
                },
                {
                    id: 4002,
                    title: 'Jahresabschluss vorbereiten',
                    completed: false,
                    dueDate: '2024-12-31',
                    priority: 'medium'
                },
                {
                    id: 4003,
                    title: 'Steuerberatung terminieren',
                    completed: true,
                    dueDate: '2024-11-30',
                    priority: 'high'
                }
            ]
        };
    }

    // Daten existieren prüfen
    async hasData() {
        try {
            const response = await fetch(this.dataFile, { method: 'HEAD' });
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    // Alle Daten abrufen (aus Cache)
    getData() {
        return this.cache || this.defaultData;
    }

    // Alle Daten setzen und speichern
    async setData(data) {
        this.cache = data;
        return await this.saveData();
    }

    // Spezifischen Datenbereich abrufen
    getSection(section) {
        const data = this.getData();
        return data[section] || null;
    }

    // Spezifischen Datenbereich aktualisieren
    async updateSection(section, newData) {
        const data = this.getData();
        data[section] = newData;
        this.cache = data;
        const success = await this.saveData();
        if (success) {
            this.notifyDataChange(section, newData);
        }
        return success;
    }

    // KATEGORIEN-OPERATIONEN
    getCategories() {
        return this.getSection('categories') || [];
    }

    async addCategory(category) {
        const categories = this.getCategories();
        category.id = this.generateId();
        category.spent = category.spent || 0;
        category.transactions = category.transactions || [];
        categories.push(category);
        return await this.updateSection('categories', categories);
    }

    async updateCategory(categoryId, updates) {
        const categories = this.getCategories();
        const index = categories.findIndex(cat => cat.id === categoryId);
        if (index > -1) {
            categories[index] = { ...categories[index], ...updates };
            return await this.updateSection('categories', categories);
        }
        return false;
    }

    async deleteCategory(categoryId) {
        const categories = this.getCategories();
        const filtered = categories.filter(cat => cat.id !== categoryId);
        return await this.updateSection('categories', filtered);
    }

    getCategoryById(categoryId) {
        const categories = this.getCategories();
        return categories.find(cat => cat.id === categoryId) || null;
    }

    // TRANSAKTIONEN-OPERATIONEN
    async addTransaction(categoryId, transaction) {
        const category = this.getCategoryById(categoryId);
        if (!category) return false;

        transaction.id = this.generateId();
        transaction.date = transaction.date || new Date().toISOString().split('T')[0];
        category.transactions.push(transaction);
        
        // Ausgaben der Kategorie aktualisieren
        if (transaction.type === 'expense') {
            category.spent += transaction.amount;
        }

        return await this.updateCategory(categoryId, category);
    }

    async updateTransaction(categoryId, transactionId, updates) {
        const category = this.getCategoryById(categoryId);
        if (!category) return false;

        const transactionIndex = category.transactions.findIndex(t => t.id === transactionId);
        if (transactionIndex === -1) return false;

        const oldTransaction = category.transactions[transactionIndex];
        category.transactions[transactionIndex] = { ...oldTransaction, ...updates };

        // Ausgaben neu berechnen
        await this.recalculateCategorySpent(categoryId);
        
        return await this.updateCategory(categoryId, category);
    }

    async deleteTransaction(categoryId, transactionId) {
        const category = this.getCategoryById(categoryId);
        if (!category) return false;

        category.transactions = category.transactions.filter(t => t.id !== transactionId);
        
        // Ausgaben neu berechnen
        await this.recalculateCategorySpent(categoryId);
        
        return await this.updateCategory(categoryId, category);
    }

    async recalculateCategorySpent(categoryId) {
        const category = this.getCategoryById(categoryId);
        if (!category) return false;

        const totalSpent = category.transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
        
        category.spent = totalSpent;
        return await this.updateCategory(categoryId, category);
    }

    // EINNAHMEN-OPERATIONEN
    getIncome() {
        return this.getSection('income') || [];
    }

    async addIncome(income) {
        const incomeList = this.getIncome();
        income.id = this.generateId();
        income.date = income.date || new Date().toISOString().split('T')[0];
        income.type = 'income';
        incomeList.push(income);
        
        // Monatliche Berichte aktualisieren
        await this.updateMonthlyReport(income.date, 'income', income.amount);
        
        return await this.updateSection('income', incomeList);
    }

    async updateIncome(incomeId, updates) {
        const incomeList = this.getIncome();
        const index = incomeList.findIndex(inc => inc.id === incomeId);
        if (index > -1) {
            incomeList[index] = { ...incomeList[index], ...updates };
            return await this.updateSection('income', incomeList);
        }
        return false;
    }

    async deleteIncome(incomeId) {
        const incomeList = this.getIncome();
        const filtered = incomeList.filter(inc => inc.id !== incomeId);
        return await this.updateSection('income', filtered);
    }

    // BERICHTE-OPERATIONEN
    getReports() {
        return this.getSection('reports') || { monthlyData: {}, weeklyData: {} };
    }

    async updateMonthlyReport(date, type, amount) {
        const reports = this.getReports();
        const monthKey = date.substring(0, 7); // YYYY-MM Format
        
        if (!reports.monthlyData[monthKey]) {
            reports.monthlyData[monthKey] = { income: 0, expenses: 0, savings: 0 };
        }
        
        if (type === 'income') {
            reports.monthlyData[monthKey].income += amount;
        } else {
            reports.monthlyData[monthKey].expenses += amount;
        }
        
        // Ersparnisse berechnen
        reports.monthlyData[monthKey].savings = 
            reports.monthlyData[monthKey].income - reports.monthlyData[monthKey].expenses;
        
        return await this.updateSection('reports', reports);
    }

    getMonthlyReport(month) {
        const reports = this.getReports();
        return reports.monthlyData[month] || { income: 0, expenses: 0, savings: 0 };
    }

    // ZIELE-OPERATIONEN
    getGoals() {
        return this.getSection('goals') || [];
    }

    async addGoal(goal) {
        const goals = this.getGoals();
        goal.id = this.generateId();
        goal.currentAmount = goal.currentAmount || 0;
        goals.push(goal);
        return await this.updateSection('goals', goals);
    }

    async updateGoal(goalId, updates) {
        const goals = this.getGoals();
        const index = goals.findIndex(goal => goal.id === goalId);
        if (index > -1) {
            goals[index] = { ...goals[index], ...updates };
            return await this.updateSection('goals', goals);
        }
        return false;
    }

    async deleteGoal(goalId) {
        const goals = this.getGoals();
        const filtered = goals.filter(goal => goal.id !== goalId);
        return await this.updateSection('goals', filtered);
    }

    // AUFGABEN-OPERATIONEN
    getTasks() {
        return this.getSection('tasks') || [];
    }

    async addTask(task) {
        const tasks = this.getTasks();
        task.id = this.generateId();
        task.completed = task.completed || false;
        tasks.push(task);
        return await this.updateSection('tasks', tasks);
    }

    async updateTask(taskId, updates) {
        const tasks = this.getTasks();
        const index = tasks.findIndex(task => task.id === taskId);
        if (index > -1) {
            tasks[index] = { ...tasks[index], ...updates };
            return await this.updateSection('tasks', tasks);
        }
        return false;
    }

    async deleteTask(taskId) {
        const tasks = this.getTasks();
        const filtered = tasks.filter(task => task.id !== taskId);
        return await this.updateSection('tasks', filtered);
    }

    async toggleTask(taskId) {
        const task = this.getTasks().find(t => t.id === taskId);
        if (task) {
            return await this.updateTask(taskId, { completed: !task.completed });
        }
        return false;
    }

    // EINSTELLUNGEN-OPERATIONEN
    getSettings() {
        return this.getSection('settings') || {};
    }

    async updateSettings(settings) {
        return await this.updateSection('settings', { ...this.getSettings(), ...settings });
    }

    // HILFSFUNKTIONEN
    generateId() {
        return Date.now() + Math.floor(Math.random() * 1000);
    }

    // Daten zurücksetzen
    async resetToDefault() {
        this.cache = this.defaultData;
        return await this.saveData();
    }

    // Daten exportieren
    exportData() {
        const data = this.getData();
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `budget_export_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        return true;
    }

    // Daten importieren
    async importData(jsonData) {
        try {
            const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
            
            // Grundlegende Validierung
            if (!this.validateData(data)) {
                throw new Error('Ungültiges Datenformat');
            }
            
            // Daten ersetzen
            this.cache = data;
            const success = await this.saveData();
            
            if (success) {
                console.log('Daten erfolgreich importiert');
            }
            
            return success;
        } catch (e) {
            console.error('Fehler beim Importieren der Daten:', e);
            return false;
        }
    }

    // Datenmigration (für zukünftige Versionen)
    migrateDataIfNeeded() {
        const data = this.getData();
        const currentVersion = data.version || '1.0';
        
        // Hier können zukünftige Migrationen hinzugefügt werden
        if (currentVersion !== '1.0') {
            console.log('Datenmigration erforderlich von Version', currentVersion);
        }
    }

    // Event-System für Datenänderungen
    dataChangeListeners = [];

    onDataChange(callback) {
        this.dataChangeListeners.push(callback);
    }

    offDataChange(callback) {
        this.dataChangeListeners = this.dataChangeListeners.filter(cb => cb !== callback);
    }

    notifyDataChange(section, data) {
        this.dataChangeListeners.forEach(callback => {
            try {
                callback(section, data);
            } catch (e) {
                console.error('Fehler in Data Change Listener:', e);
            }
        });
    }

    // Statistiken und Zusammenfassungen
    getSummaryStats() {
        const categories = this.getCategories();
        const income = this.getIncome();
        
        const totalBudget = categories.reduce((sum, cat) => sum + cat.budget, 0);
        const totalSpent = categories.reduce((sum, cat) => sum + cat.spent, 0);
        const totalIncome = income.reduce((sum, inc) => sum + inc.amount, 0);
        const totalSavings = totalIncome - totalSpent;
        const savingsRate = totalIncome > 0 ? (totalSavings / totalIncome) * 100 : 0;
        
        return {
            totalBudget,
            totalSpent,
            totalIncome,
            totalSavings,
            savingsRate: Math.round(savingsRate * 100) / 100,
            budgetUtilization: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0
        };
    }

    // Datenvalidierung
    validateData(data) {
        try {
            // Grundstruktur prüfen
            if (!data || typeof data !== 'object') return false;
            
            // Erforderliche Sektionen prüfen
            const requiredSections = ['categories', 'income', 'reports', 'settings'];
            for (const section of requiredSections) {
                if (!(section in data)) return false;
            }
            
            // Kategorien validieren
            if (!Array.isArray(data.categories)) return false;
            for (const category of data.categories) {
                if (!category.id || !category.name || typeof category.budget !== 'number') {
                    return false;
                }
            }
            
            return true;
        } catch (e) {
            console.error('Validierungsfehler:', e);
            return false;
        }
    }

    // JSON-Datei zurücksetzen
    async clearData() {
        try {
            this.cache = this.defaultData;
            return await this.saveData();
        } catch (e) {
            console.error('Fehler beim Zurücksetzen der Daten:', e);
            return false;
        }
    }

    // Cache-Größe abrufen
    getCacheSize() {
        try {
            if (!this.cache) return 0;
            return new Blob([JSON.stringify(this.cache)]).size;
        } catch (e) {
            console.error('Fehler beim Berechnen der Cache-Größe:', e);
            return 0;
        }
    }

    // Cache-Status prüfen
    isCacheLoaded() {
        return this.cache !== null;
    }

    // Cache neu laden
    async reloadCache() {
        try {
            await this.loadData();
            this.notifyDataChange('reload', this.cache);
            return true;
        } catch (error) {
            console.error('Fehler beim Neuladen des Caches:', error);
            return false;
        }
    }
}

// Globale Instanz erstellen und initialisieren
window.DataManager = new DataManager();

// Warte auf Initialisierung bevor andere Operationen ausgeführt werden
window.DataManager.ready = window.DataManager.init();

// Für Module die das alte System verwenden - Kompatibilitäts-Layer
window.DataManager.ready.then(() => {
    window.budgetCategories = window.DataManager.getCategories();
});

// Export für ES6 Module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataManager;
}