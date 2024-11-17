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
        console.log(response);
        const tasks = await response.json();
        console.log(tasks);
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
    
    const timeRemaining = task.deadline ? calculateTimeRemaining(task.deadline) : null;
    const progressWidth = timeRemaining ? 
        Math.max(0, Math.min(100, (timeRemaining.total / (task.deadline - task.created_at)) * 100)) : 
        100;

    taskElement.innerHTML = `
        <input type="checkbox" ${task.is_completed ? 'checked' : ''} 
               onchange="toggleTaskComplete('${task.task_id}')">
        <div class="task-content">
            <p>${task.task_text}</p>
            ${timeRemaining ? `
                <div class="task-progress">
                    <div class="progress-bar">
                        <div class="progress-bar-fill" style="width: ${progressWidth}%"></div>
                    </div>
                    <small>${timeRemaining.text}</small>
                </div>
            ` : ''}
        </div>
    `;

    // Modify the checkbox event listener
    const checkbox = taskElement.querySelector('input[type="checkbox"]');
    checkbox.addEventListener('change', async (e) => {
        const taskItem = e.target.closest('.task-item');
        if (e.target.checked) {
            taskItem.classList.add('completing');
            // Wait for animation to complete
            setTimeout(() => {
                toggleTaskStatus(task.task_id, task.status);
            }, 300);
        } else {
            toggleTaskStatus(task.task_id, task.status);
        }
    });

    return taskElement;
}

// Calculate time remaining
function calculateTimeRemaining(deadline) {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diff = deadlineDate - now;

    if (diff <= 0) return { total: 0, text: 'Expired' };

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    let text = '';
    if (days > 0) text += `${days}d `;
    if (hours > 0) text += `${hours}h `;
    text += `${minutes}m`;

    return { total: diff, text };
}

// Add new task
document.getElementById('taskForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const token = checkAuth();
    const taskText = document.getElementById('taskInput').value;
    const deadline = document.getElementById('deadline').value;
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
async function toggleTaskStatus(taskId, currentStatus) {
    try {
        const response = await fetch(`http://127.0.0.1:5000/tasks/${taskId}/toggle`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
            
            // Remove task from current tab
            const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
            if (taskElement) {
                taskElement.remove();
            }

            // If task was marked as completed, refresh the completed tasks tab
            if (newStatus === 'completed') {
                // Switch to completed tab if not already there
                const completedTab = document.querySelector('[data-tab="completed"]');
                if (completedTab) {
                    switchTab('completed');
                }
                await loadTasks('completed');
            } else {
                // If task was unmarked as completed, refresh the pending tasks tab
                await loadTasks('pending');
                switchTab('pending');
            }
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

    // Update active content with transition
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => {
        if (content.id === `${tabName}Tasks`) {
            content.style.display = 'block';
            // Trigger reflow
            content.offsetHeight;
            content.classList.add('active');
        } else {
            content.classList.remove('active');
            setTimeout(() => {
                if (!content.classList.contains('active')) {
                    content.style.display = 'none';
                }
            }, 300); // Match transition duration
        }
    });

    // Load tasks for the selected tab
    loadTasks(tabName);
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
