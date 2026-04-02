const taskInput = document.getElementById('taskInput');
const addBtn = document.getElementById('addBtn');
const taskList = document.getElementById('taskList');
const taskCount = document.getElementById('taskCount');
const clearCompleted = document.getElementById('clearCompleted');
const deleteAllBtn = document.getElementById('deleteAllBtn');
const filterBtns = document.querySelectorAll('.filter-btn');
const themeToggle = document.getElementById('themeToggle');

let tasks = [];
let currentFilter = 'all';
let draggingTaskId = null;
let dragOverTaskId = null;

function loadTasks() {
    const savedTasks = localStorage.getItem('tasks');
    if (savedTasks) {
        tasks = JSON.parse(savedTasks);
        tasks = tasks.map(task => ({
            ...task,
            createdAt: task.createdAt || new Date().toISOString()
        }));
    }

    renderTasks();
}

function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function addTask() {
    const text = taskInput.value.trim();
    if (text === '') return;

    const newTask = {
        id: generateId(),
        text: text,
        completed: false,
        createdAt: new Date().toISOString()
    };

    tasks.push(newTask);
    taskInput.value = '';
    saveTasks();
    renderTasks();
}

function deleteTask(id) {
    tasks = tasks.filter(task => task.id !== id);
    saveTasks();
    renderTasks();
}

function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        saveTasks();
        renderTasks();
    }
}

function editTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const taskItem = document.querySelector(`[data-id="${id}"]`);
    const taskText = taskItem.querySelector('.task-text');

    if (taskText.isContentEditable) {
        taskText.contentEditable = 'false';
        taskText.classList.remove('editing');
        task.text = taskText.textContent.trim();
        saveTasks();
        renderTasks();
        return;
    }

    taskText.contentEditable = 'true';
    taskText.classList.add('editing');
    taskText.focus();

    const onBlur = () => {
        taskText.contentEditable = 'false';
        taskText.classList.remove('editing');
        task.text = taskText.textContent.trim();
        saveTasks();
        renderTasks();
    };

    const onKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            taskText.blur();
        }
    };

    taskText.addEventListener('blur', onBlur, { once: true });
    taskText.addEventListener('keydown', onKeyDown);
}

function clearCompletedTasks() {
    tasks = tasks.filter(task => !task.completed);
    saveTasks();
    renderTasks();
}

function deleteAllTasks() {
    if (tasks.length === 0) {
        alert('Нет задач для удаления.');
        return;
    }

    const ok = confirm('Удалить все задачи?');
    if (!ok) return;

    tasks = [];
    saveTasks();
    filterTasks('all');
}

function filterTasks(filter) {
    currentFilter = filter;
    filterBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.filter === filter) {
            btn.classList.add('active');
        }
    });
    renderTasks();
}

function getFilteredTasks() {
    switch (currentFilter) {
        case 'active':
            return tasks.filter(task => !task.completed);
        case 'completed':
            return tasks.filter(task => task.completed);
        default:
            return tasks;
    }
}

function updateTaskCount() {
    const activeTasks = tasks.filter(task => !task.completed).length;
    taskCount.textContent = `${activeTasks} ${activeTasks === 1 ? 'задача' : activeTasks < 5 ? 'задачи' : 'задач'}`;
}

function formatCreatedAt(iso) {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('ru-RU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

function arrayMove(array, fromIndex, toIndex) {
    const next = array.slice();
    const [item] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, item);
    return next;
}

function renderTasks() {
    const filteredTasks = getFilteredTasks();
    taskList.innerHTML = '';

    if (filteredTasks.length === 0) {
        taskList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">✨</div>
                <div class="empty-state-text">
                    ${currentFilter === 'completed' ? 'Нет выполненных задач' :
                currentFilter === 'active' ? 'Нет активных задач' :
                    'Добавьте свою первую задачу!'}
                </div>
            </div>
        `;
    } else {
        filteredTasks.forEach(task => {
            const taskItem = document.createElement('li');
            taskItem.className = `task-item ${task.completed ? 'completed' : ''}`;
            taskItem.setAttribute('data-id', task.id);

            taskItem.innerHTML = `
                <div class="task-top">
                    <span class="created-at">${escapeHtml(formatCreatedAt(task.createdAt))}</span>
                </div>
                <div class="task-row">
                    <span class="drag-handle" draggable="true" title="Перетащите для сортировки">⋮⋮</span>
                    <input 
                        type="checkbox" 
                        class="task-checkbox" 
                        ${task.completed ? 'checked' : ''}
                    >
                    <span class="task-text">${escapeHtml(task.text)}</span>
                    <div class="task-actions">
                        <button class="edit-btn" type="button">
                            <img src="./icons/red-trash-can-icon.svg" width="18" alt="Delete">

                        </button>
                        <button class="delete-btn" type="button">
                            <img src="./icons/red-trash.svg" width="18" alt="Delete">
                        </button>
                    </div>
                </div>
            `;

            const checkbox = taskItem.querySelector('.task-checkbox');
            const editBtn = taskItem.querySelector('.edit-btn');
            const deleteBtn = taskItem.querySelector('.delete-btn');
            const dragHandle = taskItem.querySelector('.drag-handle');

            checkbox.addEventListener('change', () => toggleTask(task.id));
            editBtn.addEventListener('click', () => editTask(task.id));
            deleteBtn.addEventListener('click', () => deleteTask(task.id));

            dragHandle.addEventListener('dragstart', (e) => {
                draggingTaskId = task.id;
                dragOverTaskId = null;
                taskItem.classList.add('dragging');
                e.dataTransfer.setData('text/plain', task.id);
                e.dataTransfer.effectAllowed = 'move';
            });

            dragHandle.addEventListener('dragend', () => {
                draggingTaskId = null;
                taskItem.classList.remove('dragging');
                if (dragOverTaskId) {
                    const prev = taskList.querySelector(`[data-id="${dragOverTaskId}"]`);
                    if (prev) prev.classList.remove('drag-over');
                }
                dragOverTaskId = null;
            });

            taskItem.addEventListener('dragover', (e) => {
                e.preventDefault();
                if (!draggingTaskId || draggingTaskId === task.id) {
                    taskItem.classList.remove('drag-over');
                    return;
                }

                if (dragOverTaskId && dragOverTaskId !== task.id) {
                    const prev = taskList.querySelector(`[data-id="${dragOverTaskId}"]`);
                    if (prev) prev.classList.remove('drag-over');
                }

                taskItem.classList.add('drag-over');
                dragOverTaskId = task.id;
                e.dataTransfer.dropEffect = 'move';
            });

            taskItem.addEventListener('dragleave', () => {
                if (dragOverTaskId === task.id) {
                    taskItem.classList.remove('drag-over');
                    dragOverTaskId = null;
                }
            });

            taskItem.addEventListener('drop', (e) => {
                e.preventDefault();
                const fromId = e.dataTransfer.getData('text/plain') || draggingTaskId;
                const toId = task.id;
                if (!fromId || fromId === toId) return;

                const fromIndex = tasks.findIndex(t => t.id === fromId);
                const toIndex = tasks.findIndex(t => t.id === toId);
                if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return;

                tasks = arrayMove(tasks, fromIndex, toIndex);
                saveTasks();
                draggingTaskId = null;
                dragOverTaskId = null;
                renderTasks();
            });

            taskList.appendChild(taskItem);
        });
    }

    updateTaskCount();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

addBtn.addEventListener('click', addTask);

function applyTheme(theme) {
    document.body.dataset.theme = theme;
    localStorage.setItem('theme', theme);
    if (!themeToggle) return;
    themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
}

function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const theme = savedTheme ? savedTheme : (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    applyTheme(theme);
}

if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.body.dataset.theme || 'light';
        const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(nextTheme);
    });
}

taskInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        addTask();
    }
});

clearCompleted.addEventListener('click', () => {
    const completedCount = tasks.filter(task => task.completed).length;
    if (completedCount === 0) {
        alert('Нет выполненных задач.');
        return;
    }

    const ok = confirm(`Удалить ${completedCount} выполненных задач?`);
    if (!ok) return;

    clearCompletedTasks();
});

if (deleteAllBtn) {
    deleteAllBtn.addEventListener('click', deleteAllTasks);
}

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterTasks(btn.dataset.filter);
    });
});

initTheme();
loadTasks();
