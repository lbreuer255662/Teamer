// tasks.js - A modern task management application with advanced features
class TaskManager {
    constructor() {
        this.tasks = [];
        this.currentFilter = 'all';
        this.currentView = 'list';
        this.editingTask = null;
        
        this.init();
        this.loadSampleTasks();
        this.updateStats();
        this.renderTasks();
    }

    init() {
        this.bindEvents();
        this.setupModal();
    }

    bindEvents() {
        // Add task button
        document.getElementById('addTaskBtn').addEventListener('click', () => {
            this.showModal();
        });

        // Filter tabs
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.setActiveFilter(e.target);
                this.currentFilter = e.target.dataset.filter;
                this.renderTasks();
            });
        });

        // Filter selects
        document.querySelector('.priority-filter').addEventListener('change', () => {
            this.renderTasks();
        });

        document.querySelector('.category-filter').addEventListener('change', () => {
            this.renderTasks();
        });

        // View buttons
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setActiveView(e.target);
                this.currentView = e.target.dataset.view;
                this.toggleView();
            });
        });

        // Task form
        document.getElementById('taskForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleTaskSubmit();
        });
    }

    setupModal() {
        const modal = document.getElementById('taskModal');
        const closeBtn = document.getElementById('closeModal');
        const cancelBtn = document.getElementById('cancelTask');

        closeBtn.addEventListener('click', () => this.hideModal());
        cancelBtn.addEventListener('click', () => this.hideModal());

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hideModal();
            }
        });
    }

    showModal(task = null) {
        const modal = document.getElementById('taskModal');
        const form = document.getElementById('taskForm');
        
        if (task) {
            this.editingTask = task;
            this.populateForm(task);
            document.querySelector('.modal-header h2').textContent = 'Aufgabe bearbeiten';
            document.querySelector('button[type="submit"]').textContent = 'Aufgabe aktualisieren';
        } else {
            this.editingTask = null;
            form.reset();
            document.querySelector('.modal-header h2').textContent = 'Neue Aufgabe hinzufügen';
            document.querySelector('button[type="submit"]').textContent = 'Aufgabe erstellen';
        }
        
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    hideModal() {
        const modal = document.getElementById('taskModal');
        modal.classList.remove('active');
        document.body.style.overflow = '';
        this.editingTask = null;
    }

    populateForm(task) {
        document.getElementById('taskTitle').value = task.title;
        document.getElementById('taskDescription').value = task.description || '';
        document.getElementById('taskPriority').value = task.priority;
        document.getElementById('taskCategory').value = task.category;
        document.getElementById('taskDueDate').value = task.dueDate ? task.dueDate.toISOString().split('T')[0] : '';
    }

    handleTaskSubmit() {
        const formData = new FormData(document.getElementById('taskForm'));
        const taskData = {
            title: formData.get('title'),
            description: formData.get('description'),
            priority: formData.get('priority'),
            category: formData.get('category'),
            dueDate: formData.get('dueDate') ? new Date(formData.get('dueDate')) : null,
            completed: false,
            createdAt: new Date()
        };

        if (this.editingTask) {
            this.updateTask(this.editingTask.id, taskData);
        } else {
            this.addTask(taskData);
        }

        this.hideModal();
    }

    addTask(taskData) {
        const task = {
            id: Date.now().toString(),
            ...taskData
        };

        this.tasks.unshift(task);
        this.updateStats();
        this.renderTasks();
        this.showNotification('Aufgabe erfolgreich hinzugefügt!', 'success');
    }

    updateTask(taskId, taskData) {
        const taskIndex = this.tasks.findIndex(task => task.id === taskId);
        if (taskIndex !== -1) {
            this.tasks[taskIndex] = { ...this.tasks[taskIndex], ...taskData };
            this.updateStats();
            this.renderTasks();
            this.showNotification('Aufgabe erfolgreich aktualisiert!', 'success');
        }
    }

    deleteTask(taskId) {
        if (confirm('Sind Sie sicher, dass Sie diese Aufgabe löschen möchten?')) {
            this.tasks = this.tasks.filter(task => task.id !== taskId);
            this.updateStats();
            this.renderTasks();
            this.showNotification('Aufgabe erfolgreich gelöscht!', 'info');
        }
    }

    toggleTask(taskId) {
        const task = this.tasks.find(task => task.id === taskId);
        if (task) {
            task.completed = !task.completed;
            task.completedAt = task.completed ? new Date() : null;
            this.updateStats();
            this.renderTasks();
            
            const message = task.completed ? 'Aufgabe als erledigt markiert!' : 'Aufgabe als offen markiert!';
            this.showNotification(message, 'success');
        }
    }

    setActiveFilter(activeTab) {
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        activeTab.classList.add('active');
    }

    setActiveView(activeBtn) {
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        activeBtn.classList.add('active');
    }

    toggleView() {
        const taskList = document.getElementById('taskList');
        if (this.currentView === 'grid') {
            taskList.classList.add('grid-view');
        } else {
            taskList.classList.remove('grid-view');
        }
    }

    filterTasks() {
        const priorityFilter = document.querySelector('.priority-filter').value;
        const categoryFilter = document.querySelector('.category-filter').value;
        
        return this.tasks.filter(task => {
            // Status filter
            let statusMatch = true;
            switch (this.currentFilter) {
                case 'completed':
                    statusMatch = task.completed;
                    break;
                case 'pending':
                    statusMatch = !task.completed;
                    break;
                case 'overdue':
                    statusMatch = !task.completed && task.dueDate && new Date() > task.dueDate;
                    break;
                default:
                    statusMatch = true;
            }

            // Priority filter
            const priorityMatch = priorityFilter === 'all' || task.priority === priorityFilter;
            
            // Category filter
            const categoryMatch = categoryFilter === 'all' || task.category === categoryFilter;

            return statusMatch && priorityMatch && categoryMatch;
        });
    }

    renderTasks() {
        const taskList = document.getElementById('taskList');
        const filteredTasks = this.filterTasks();

        if (filteredTasks.length === 0) {
            taskList.innerHTML = this.renderEmptyState();
            return;
        }

        taskList.innerHTML = filteredTasks.map(task => this.renderTask(task)).join('');
        
        // Add event listeners to new task elements
        this.bindTaskEvents();
    }

    renderTask(task) {
        const isOverdue = !task.completed && task.dueDate && new Date() > task.dueDate;
        const priorityClass = `${task.priority}-priority`;
        const statusClasses = [
            task.completed ? 'completed' : '',
            isOverdue ? 'overdue' : '',
            priorityClass
        ].filter(Boolean).join(' ');

        const dueDateFormatted = task.dueDate ? this.formatDate(task.dueDate) : null;
        const dueDateClass = isOverdue ? 'overdue' : '';

        return `
            <div class="task-item ${statusClasses}" data-task-id="${task.id}">
                <div class="task-checkbox">
                    <input type="checkbox" id="task-${task.id}" ${task.completed ? 'checked' : ''}>
                    <label for="task-${task.id}" class="checkmark"></label>
                </div>
                
                <div class="task-content">
                    <div class="task-header">
                        <h4 class="task-title ${task.completed ? 'completed' : ''}">${this.escapeHtml(task.title)}</h4>
                        <span class="task-priority ${task.priority}">${this.getPriorityText(task.priority)}</span>
                    </div>
                    
                    ${task.description ? `<p class="task-description">${this.escapeHtml(task.description)}</p>` : ''}
                    
                    <div class="task-meta">
                        <span class="task-category">
                            <i class="${this.getCategoryIcon(task.category)}"></i>
                            ${this.getCategoryText(task.category)}
                        </span>
                        ${dueDateFormatted ? `
                            <span class="task-due-date ${dueDateClass}">
                                <i class="fas fa-calendar-alt"></i>
                                ${dueDateFormatted}
                            </span>
                        ` : ''}
                    </div>
                </div>
                
                <div class="task-actions">
                    <button class="task-action-btn edit" title="Bearbeiten">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="task-action-btn delete" title="Löschen">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    renderEmptyState() {
        return `
            <div class="empty-state">
                <i class="fas fa-tasks"></i>
                <h3>Keine Aufgaben gefunden</h3>
                <p>Es sind keine Aufgaben für die aktuellen Filter vorhanden.</p>
                <button class="btn-primary" onclick="taskManager.showModal()">
                    <i class="fas fa-plus"></i>
                    Erste Aufgabe hinzufügen
                </button>
            </div>
        `;
    }

    bindTaskEvents() {
        // Checkbox events
        document.querySelectorAll('.task-checkbox input').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const taskId = e.target.closest('.task-item').dataset.taskId;
                this.toggleTask(taskId);
            });
        });

        // Edit button events
        document.querySelectorAll('.task-action-btn.edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const taskId = e.target.closest('.task-item').dataset.taskId;
                const task = this.tasks.find(t => t.id === taskId);
                this.showModal(task);
            });
        });

        // Delete button events
        document.querySelectorAll('.task-action-btn.delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const taskId = e.target.closest('.task-item').dataset.taskId;
                this.deleteTask(taskId);
            });
        });
    }

    updateStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(task => task.completed).length;
        const pending = total - completed;
        const overdue = this.tasks.filter(task => 
            !task.completed && task.dueDate && new Date() > task.dueDate
        ).length;

        document.getElementById('totalTasks').textContent = total;
        document.getElementById('completedTasks').textContent = completed;
        document.getElementById('pendingTasks').textContent = pending;
        document.getElementById('overdueTasks').textContent = overdue;

        // Update percentages
        const completedPercentage = total > 0 ? ((completed / total) * 100).toFixed(1) : 0;
        const pendingPercentage = total > 0 ? ((pending / total) * 100).toFixed(1) : 0;
        const overduePercentage = total > 0 ? ((overdue / total) * 100).toFixed(1) : 0;

        const completedStat = document.querySelector('.stat-card.completed .stat-change');
        const pendingStat = document.querySelector('.stat-card.pending .stat-change');
        const overdueStat = document.querySelector('.stat-card.overdue .stat-change');

        if (completedStat) completedStat.textContent = `${completedPercentage}%`;
        if (pendingStat) pendingStat.textContent = `${pendingPercentage}%`;
        if (overdueStat) overdueStat.textContent = `${overduePercentage}%`;
    }

    loadSampleTasks() {
        const sampleTasks = [
            {
                id: '1',
                title: 'Wöchentlichen Budgetbericht erstellen',
                description: 'Analyse der Ausgaben und Einnahmen der letzten Woche',
                priority: 'high',
                category: 'finance',
                dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
                completed: false,
                createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
            },
            {
                id: '2',
                title: 'Arzttermin vereinbaren',
                description: 'Jährliche Vorsorgeuntersuchung beim Hausarzt',
                priority: 'medium',
                category: 'health',
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
                completed: false,
                createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
            },
            {
                id: '3',
                title: 'Projektpräsentation vorbereiten',
                description: 'Slides für das Quartalsprojekt erstellen',
                priority: 'high',
                category: 'work',
                dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago (overdue)
                completed: false,
                createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
            },
            {
                id: '4',
                title: 'Einkaufsliste erstellen',
                description: 'Für den Wocheneinkauf am Samstag',
                priority: 'low',
                category: 'personal',
                dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
                completed: true,
                createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
                completedAt: new Date()
            },
            {
                id: '5',
                title: 'Versicherungsunterlagen sortieren',
                description: 'Alle Policen und Dokumente ordnen',
                priority: 'medium',
                category: 'finance',
                dueDate: null,
                completed: true,
                createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
                completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
            }
        ];

        this.tasks = sampleTasks;
    }

    // Utility functions
    formatDate(date) {
        const options = { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        };
        return date.toLocaleDateString('de-DE', options);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    getPriorityText(priority) {
        const priorities = {
            'high': 'Hoch',
            'medium': 'Mittel',
            'low': 'Niedrig'
        };
        return priorities[priority] || priority;
    }

    getCategoryText(category) {
        const categories = {
            'work': 'Arbeit',
            'personal': 'Persönlich',
            'finance': 'Finanzen',
            'health': 'Gesundheit'
        };
        return categories[category] || category;
    }

    getCategoryIcon(category) {
        const icons = {
            'work': 'fas fa-briefcase',
            'personal': 'fas fa-user',
            'finance': 'fas fa-euro-sign',
            'health': 'fas fa-heart'
        };
        return icons[category] || 'fas fa-tag';
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Add styles if not exist
        if (!document.querySelector('.notification-styles')) {
            const styles = document.createElement('style');
            styles.className = 'notification-styles';
            styles.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                    padding: 15px 20px;
                    z-index: 3000;
                    min-width: 300px;
                    animation: slideInRight 0.3s ease-out;
                    border-left: 4px solid #667eea;
                }
                .notification.notification-success { border-left-color: #27ca3f; }
                .notification.notification-error { border-left-color: #e74c3c; }
                .notification.notification-warning { border-left-color: #f39c12; }
                .notification-content {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .notification-close {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: none;
                    border: none;
                    color: #999;
                    cursor: pointer;
                }
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(styles);
        }

        // Add to page
        document.body.appendChild(notification);

        // Close functionality
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            notification.remove();
        });

        // Auto remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }

    getNotificationIcon(type) {
        const icons = {
            'success': 'check-circle',
            'error': 'exclamation-circle',
            'warning': 'exclamation-triangle',
            'info': 'info-circle'
        };
        return icons[type] || 'info-circle';
    }
}

// Initialize the task manager when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.taskManager = new TaskManager();
});