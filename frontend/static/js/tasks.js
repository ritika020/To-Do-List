const API_URL = 'http://localhost:5000';

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
        const response = await fetch(`${API_URL}/tasks/${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const tasks = await response.json();
        renderTasks(tasks);
    } catch (error) {
        console.error('Error fetching tasks:', error);
    }
}

// Render tasks
function renderTasks(tasks) {
    const activeTasksContainer = document.getElementById('activeTasks');
    const completedTasksContainer = document.getElementById('completedTasks');
    
    activeTasksContainer.innerHTML = '';
    completedTasksContainer.innerHTML = '';

    tasks.forEach(task => {
        const taskElement = createTaskElement(task);
        if (task.is_completed) {
            completedTasksContainer.appendChild(taskElement);
        } else {
            activeTasksContainer.appendChild(taskElement);
        }
    });
}

// Create task element
function createTaskElement(task) {
    const taskDiv = document.createElement('div');
    taskDiv.className = 'task-item';
    
    const timeRemaining = task.deadline ? calculateTimeRemaining(task.deadline) : null;
    const progressWidth = timeRemaining ? 
        Math.max(0, Math.min(100, (timeRemaining.total / (task.deadline - task.created_at)) * 100)) : 
        100;

    taskDiv.innerHTML = `
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

    return taskDiv;
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
        const response = await fetch(`${API_URL}/tasks`, {
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
        const response = await fetch(`${API_URL}/tasks/complete/${taskId}`, {
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