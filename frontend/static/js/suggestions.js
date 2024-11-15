const API_URL = 'http://localhost:5000';

let typingTimer;
const doneTypingInterval = 300;

const taskInput = document.getElementById('taskInput');
const suggestionsDiv = document.getElementById('suggestions');

taskInput?.addEventListener('input', () => {
    clearTimeout(typingTimer);
    if (taskInput.value) {
        typingTimer = setTimeout(fetchSuggestions, doneTypingInterval);
    } else {
        suggestionsDiv.style.display = 'none';
    }
});

async function fetchSuggestions() {
    const token = localStorage.getItem('token');
    const query = taskInput.value;

    try {
        const response = await fetch(`${API_URL}/suggestions?q=${encodeURIComponent(query)}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const suggestions = await response.json();
        displaySuggestions(suggestions);
    } catch (error) {
        console.error('Error fetching suggestions:', error);
    }
}

function displaySuggestions(suggestions) {
    if (!suggestions.length) {
        suggestionsDiv.style.display = 'none';
        return;
    }

    suggestionsDiv.innerHTML = suggestions
        .map(sugg => `
            <div class="suggestion-item" onclick="selectSuggestion('${sugg.task_text}')">
                ${sugg.task_text}
            </div>
        `)
        .join('');

    suggestionsDiv.style.display = 'block';
}

function selectSuggestion(text) {
    taskInput.value = text;
    suggestionsDiv.style.display = 'none';
}

// Close suggestions when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('#taskInput') && !e.target.closest('#suggestions')) {
        suggestionsDiv.style.display = 'none';
    }
}); 