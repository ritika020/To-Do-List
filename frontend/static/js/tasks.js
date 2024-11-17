// const API_URL = 'http://127.0.0.1:5000';

// Check authentication
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
    }
    return token;
}

// Get tasks
async function fetchTasks() {
    const token = checkAuth();
    const userId = localStorage.getItem('userId');

    try {
        const response = await fetch(`http://127.0.0.1:5000/tasks/${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        // console.log(response);
        const tasks = await response.json();
        // console.log(tasks);
        renderTasks(tasks);
    } catch (error) {
        console.error('Error fetching tasks:', error);
    }
}

// Render tasks
function renderTasks(tasks) {
    const pendingTasksContainer = document.getElementById('pendingTasks');
    const completedTasksContainer = document.getElementById('completedTasks');
    
    pendingTasksContainer.innerHTML = '';
    completedTasksContainer.innerHTML = '';

    tasks.forEach(task => {
        const taskElement = createTaskElement(task);
        if (task.is_completed) {    
            completedTasksContainer.appendChild(taskElement);
        } else {
            pendingTasksContainer.appendChild(taskElement);
        }
    });
}

// Create task element
function createTaskElement(task) {
    const taskElement = document.createElement('div');
    taskElement.className = 'task-item';
    taskElement.dataset.taskId = task.task_id;
    taskElement.dataset.deadline = task.deadline || '';
    
    const timeInfo = task.deadline ? calculateTimeRemaining(task.deadline) : null;
    
    taskElement.innerHTML = `
        <div class="task-select">
            <input type="checkbox" class="task-checkbox">
        </div>
        <div class="task-content">
            <p>${task.task_text}</p>
            ${timeInfo ? `
                <div class="task-progress ${timeInfo.isLate ? 'late' : ''}">
                    <div class="progress-bar">
                        <div class="progress-bar-fill" style="width: ${timeInfo.isLate ? '100' : '50'}%"></div>
                    </div>
                    <small class="${timeInfo.isLate ? 'late-text' : ''}">${timeInfo.text}</small>
                </div>
            ` : ''}
        </div>
        <div class="task-actions">
            ${!task.is_completed ? `
                <button class="complete-task" title="Complete Task">
                    <i class="fas fa-check"></i>
                </button>
            ` : ''}
            <button class="delete-task" title="Delete Task">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;

    // Add event listeners
    const completeBtn = taskElement.querySelector('.complete-task');
    const deleteBtn = taskElement.querySelector('.delete-task');
    
    completeBtn?.addEventListener('click', () => toggleTaskStatus(task.task_id));
    deleteBtn?.addEventListener('click', () => deleteTask(task.task_id));

    const checkbox = taskElement.querySelector('.task-checkbox');
    checkbox?.addEventListener('change', updateSelectAllCheckbox);

    return taskElement;
}

// Calculate time remaining
function calculateTimeRemaining(deadline) {
    const now = new Date();
 
    const deadlineDate = new Date(deadline);
    deadlineDate.setHours(deadlineDate.getHours() + 5);
    const diff = deadlineDate - now;
    
    if (diff <= 0) {
        // Task is late
        const lateTime = Math.abs(diff);
        const lateDays = Math.floor(lateTime / (1000 * 60 * 60 * 24));
        const lateHours = Math.floor((lateTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const lateMinutes = Math.floor((lateTime % (1000 * 60 * 60)) / (1000 * 60));
        
        let lateText = 'Late by ';
        if (lateDays > 0) lateText += `${lateDays}d `;
        if (lateHours > 0) lateText += `${lateHours}h `;
        lateText += `${lateMinutes}m`;
        
        return { total: diff, text: lateText, isLate: true };
    }

    // Task is not late
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    let text = '';
    if (days > 0) text += `${days}d `;
    if (hours > 0) text += `${hours}h `;
    text += `${minutes}m left`;

    return { total: diff, text, isLate: false };
}

// Add new task
document.getElementById('taskForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const token = checkAuth();
    const taskText = document.getElementById('taskInput').value;
    const deadline = document.getElementById('deadline').value;
    console.log(deadline);
    const userId = localStorage.getItem('userId');

    try {
        const response = await fetch(`http://127.0.0.1:5000/tasks`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: userId,
                task_text: taskText,
                deadline: deadline || null
            })
        });

        if (response.ok) {
            document.getElementById('taskInput').value = '';
            document.getElementById('deadline').value = '';
            fetchTasks();
        }
    } catch (error) {
        console.error('Error adding task:', error);
    }
});

// Toggle task completion
async function toggleTaskComplete(taskId) {
    const token = checkAuth();

    try {
        const response = await fetch(`http://127.0.0.1:5000/tasks/complete/${taskId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            fetchTasks();
        }
    } catch (error) {
        console.error('Error toggling task:', error);
    }
}

// Tab switching
document.querySelectorAll('.tab-btn').forEach(button => {
    button.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        const tabName = button.dataset.tab;
        document.getElementById('activeTasks').classList.toggle('hidden', tabName !== 'active');
        document.getElementById('completedTasks').classList.toggle('hidden', tabName !== 'completed');
    });
});

// Initial load
fetchTasks();

// Add this function to set minimum datetime
function updateMinDateTime() {
    const now = new Date();
    // Add 5 minutes to current time to give user some buffer
    now.setMinutes(now.getMinutes() + 5);
    
    // Format datetime for input
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    const minDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
    
    // Update all deadline inputs
    const deadlineInputs = document.querySelectorAll('input[type="datetime-local"]');
    deadlineInputs.forEach(input => {
        input.min = minDateTime;
        // If the current value is empty or in the past, set it to the minimum
        if (!input.value || new Date(input.value) < now) {
            input.value = minDateTime;
        }
    });
    console.log(minDateTime);
}

// Call this when page loads and when adding new task form
document.addEventListener('DOMContentLoaded', () => {
    updateMinDateTime();
    // Update every minute
    setInterval(updateMinDateTime, 60000);
});

// Modify your task creation validation
function validateTaskForm(title, description, deadline) {
    let isValid = true;
    const now = new Date();
    const deadlineDate = new Date(deadline);

    if (deadlineDate <= now) {
        showError('Deadline must be in the future', 'deadline');
        isValid = false;
    }

    if (title.trim().length < 1) {
        showError('Title is required', 'title');
        isValid = false;
    }

    if (description.trim().length < 1) {
        showError('Description is required', 'description');
        isValid = false;
    }

    return isValid;
}

// Add this to your task creation form handler
document.getElementById('createTaskForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;
    const deadline = document.getElementById('deadline').value;
    
    // Clear previous errors
    clearErrors();
    
    // Validate form including deadline
    if (!validateTaskForm(title, description, deadline)) {
        return;
    }
    
    // Rest of your existing task creation code...
});

// Add this for dynamic task form creation
function createTaskForm() {
    updateMinDateTime();
    // Rest of your existing form creation code...
}

// Modify the toggleTaskStatus function
async function toggleTaskStatus(taskId) {
    try {
        const response = await fetch(`http://127.0.0.1:5000/tasks/complete/${taskId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            // Refresh the tasks
            await fetchTasks();
        } else {
            const data = await response.json();
            showError(data.error || 'Failed to update task status');
        }
    } catch (error) {
        showError('An error occurred while updating task status');
        console.error('Error:', error);
    }
}

// Modify the switchTab function to handle active states
function switchTab(tabName) {
    // Update active tab
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Show/hide bulk complete button based on tab
    const bulkCompleteBtn = document.querySelector('.bulk-complete');
    if (bulkCompleteBtn) {
        bulkCompleteBtn.style.display = tabName === 'pending' ? 'block' : 'none';
    }

    // Update active content
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => {
        if (content.id === `${tabName}Tasks`) {
            content.style.display = 'block';
            content.classList.add('active');
        } else {
            content.classList.remove('active');
            content.style.display = 'none';
        }
    });

    // Load tasks for the selected tab
    loadTasks(tabName);

    // Reset select all checkbox
    const selectAllCheckbox = document.getElementById('selectAll');
    if (selectAllCheckbox) {
        selectAllCheckbox.checked = false;
    }
}

// Add CSS classes for smooth transitions

// Function to load tasks for a specific tab
async function loadTasks(status) {
    try {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');
        
        if (!token || !userId) {
            window.location.href = '/login';
            return;
        }

        const tasksContainer = document.getElementById(`${status}Tasks`);
        const bulkActions = createBulkActionButtons();
        tasksContainer.prepend(bulkActions);

        // Add event listeners for bulk actions
        bulkActions.querySelector('.bulk-complete')?.addEventListener('click', completeBulkTasks);
        bulkActions.querySelector('.bulk-delete')?.addEventListener('click', deleteBulkTasks);

        tasksContainer.innerHTML = '<p class="loading">Loading tasks...</p>';

        const response = await fetch(`http://127.0.0.1:5000/tasks?status=${status}&user_id=${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            tasksContainer.innerHTML = '';

            if (data.tasks.length === 0) {
                tasksContainer.innerHTML = `
                    <p class="no-tasks">
                        ${status === 'pending' ? 
                            'No pending tasks. Add a new task to get started!' : 
                            'No completed tasks yet. Complete some tasks to see them here!'}
                    </p>`;
                return;
            }

            data.tasks.forEach(task => {
                const taskElement = createTaskElement(task);
                tasksContainer.appendChild(taskElement);
            });
        } else {
            const error = await response.json();
            tasksContainer.innerHTML = `
                <p class="error-message">
                    ${error.error || 'Failed to load tasks'}
                </p>`;
        }
    } catch (error) {
        console.error('Error fetching tasks:', error);
        tasksContainer.innerHTML = `
            <p class="error-message">Failed to load tasks</p>`;
    }
}

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    // Load pending tasks by default
    switchTab('pending');
});

// Function to handle bulk actions
function createBulkActionButtons() {
    const bulkActionsDiv = document.createElement('div');
    bulkActionsDiv.className = 'bulk-actions';
    bulkActionsDiv.innerHTML = `
        <div class="select-all-container">
            <input type="checkbox" id="selectAll" title="Select All">
            <label for="selectAll">Select All</label>
        </div>
        <button class="bulk-complete" title="Complete Selected">
            <i class="fas fa-check"></i>
        </button>
        <button class="bulk-delete" title="Delete Selected">
            <i class="fas fa-trash"></i>
        </button>
    `;
    return bulkActionsDiv;
}

// Add delete task function
async function deleteTask(taskId) {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
        const response = await fetch(`http://127.0.0.1:5000/tasks/${taskId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            await loadTasks(getCurrentTab());
        } else {
            const data = await response.json();
            showError(data.error || 'Failed to delete task');
        }
    } catch (error) {
        showError('An error occurred while deleting the task');
        console.error('Error:', error);
    }
}

// Add bulk action functions
async function completeBulkTasks() {
    const currentTab = getCurrentTab();
    if (currentTab !== 'pending') return;

    const selectedTasks = getSelectedTasks();
    if (selectedTasks.length === 0) {
        alert('Please select tasks to complete');
        return;
    }

    if (!confirm(`Complete ${selectedTasks.length} selected tasks?`)) return;

    for (const taskId of selectedTasks) {
        await toggleTaskStatus(taskId);
    }
    await loadTasks(currentTab);
}

async function deleteBulkTasks() {
    const selectedTasks = getSelectedTasks();
    if (selectedTasks.length === 0) {
        alert('Please select tasks to delete');
        return;
    }

    if (!confirm(`Delete ${selectedTasks.length} selected tasks?`)) return;

    for (const taskId of selectedTasks) {
        await deleteTask(taskId);
    }
    await loadTasks(getCurrentTab());
}

function getSelectedTasks() {
    const checkboxes = document.querySelectorAll('.task-checkbox:checked');
    return Array.from(checkboxes).map(cb => cb.closest('.task-item').dataset.taskId);
}

function getCurrentTab() {
    return document.querySelector('.tab.active').dataset.tab;
}

// Add this after your existing event listeners
document.getElementById('selectAll')?.addEventListener('change', function() {
    const currentTab = getCurrentTab();
    const container = document.getElementById(`${currentTab}Tasks`);
    const checkboxes = container.querySelectorAll('.task-checkbox');
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = this.checked;
    });
});

// Add this function to update select all checkbox state when individual checkboxes change
function updateSelectAllCheckbox() {
    const currentTab = getCurrentTab();
    const container = document.getElementById(`${currentTab}Tasks`);
    const checkboxes = container.querySelectorAll('.task-checkbox');
    const selectAllCheckbox = document.getElementById('selectAll');
    
    if (checkboxes.length === 0) {
        selectAllCheckbox.checked = false;
        return;
    }
    
    const allChecked = Array.from(checkboxes).every(checkbox => checkbox.checked);
    selectAllCheckbox.checked = allChecked;
}

// Modified time updates function
function startTimeUpdates() {
    setInterval(() => {
        document.querySelectorAll('.task-progress').forEach(progressElement => {
            const taskElement = progressElement.closest('.task-item');
            const deadlineText = progressElement.querySelector('small').textContent;
            
            // Only update if there's a deadline
            if (deadlineText) {
                // Extract deadline from DOM or data attribute
                const deadline = taskElement.dataset.deadline; // You'll need to add this when creating the task element
                if (deadline) {
                    const timeInfo = calculateTimeRemaining(deadline);
                    progressElement.classList.toggle('late', timeInfo.isLate);
                    progressElement.querySelector('small').textContent = timeInfo.text;
                    progressElement.querySelector('small').classList.toggle('late-text', timeInfo.isLate);
                    progressElement.querySelector('.progress-bar-fill').style.width = 
                        timeInfo.isLate ? '100%' : '50%';
                }
            }
        });
    }, 60000); // Update every minute
}

// Call this when the page loads
document.addEventListener('DOMContentLoaded', () => {
    startTimeUpdates();
});
