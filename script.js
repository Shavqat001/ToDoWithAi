// Получаем элементы DOM
const taskInput = document.getElementById('taskInput');
const addBtn = document.getElementById('addBtn');
const taskList = document.getElementById('taskList');
const taskCount = document.getElementById('taskCount');
const clearCompleted = document.getElementById('clearCompleted');
const filterBtns = document.querySelectorAll('.filter-btn');

// Состояние приложения
let tasks = [];
let currentFilter = 'all';

// Загружаем задачи из localStorage при загрузке страницы
function loadTasks() {
    const savedTasks = localStorage.getItem('tasks');
    if (savedTasks) {
        tasks = JSON.parse(savedTasks);
        renderTasks();
    }
}

// Сохраняем задачи в localStorage
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Генерируем уникальный ID для задачи
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Добавляем новую задачу
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

// Удаляем задачу
function deleteTask(id) {
    tasks = tasks.filter(task => task.id !== id);
    saveTasks();
    renderTasks();
}

// Переключаем статус выполнения задачи
function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        saveTasks();
        renderTasks();
    }
}

// Редактируем задачу
function editTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const taskItem = document.querySelector(`[data-id="${id}"]`);
    const taskText = taskItem.querySelector('.task-text');
    
    if (taskText.contentEditable === 'true') {
        // Сохраняем изменения
        taskText.contentEditable = 'false';
        taskText.classList.remove('editing');
        task.text = taskText.textContent.trim();
        saveTasks();
    } else {
        // Включаем режим редактирования
        taskText.contentEditable = 'true';
        taskText.classList.add('editing');
        taskText.focus();
        
        // Сохраняем при потере фокуса
        taskText.addEventListener('blur', function saveEdit() {
            taskText.contentEditable = 'false';
            taskText.classList.remove('editing');
            task.text = taskText.textContent.trim();
            saveTasks();
            taskText.removeEventListener('blur', saveEdit);
        });
        
        // Сохраняем при нажатии Enter
        taskText.addEventListener('keydown', function handleKeydown(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                taskText.blur();
            }
        });
    }
}

// Очищаем выполненные задачи
function clearCompletedTasks() {
    tasks = tasks.filter(task => !task.completed);
    saveTasks();
    renderTasks();
}

// Фильтруем задачи
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

// Получаем отфильтрованные задачи
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

// Обновляем счетчик задач
function updateTaskCount() {
    const activeTasks = tasks.filter(task => !task.completed).length;
    taskCount.textContent = `${activeTasks} ${activeTasks === 1 ? 'задача' : activeTasks < 5 ? 'задачи' : 'задач'}`;
}

// Рендерим список задач
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
                <input 
                    type="checkbox" 
                    class="task-checkbox" 
                    ${task.completed ? 'checked' : ''}
                >
                <span class="task-text">${escapeHtml(task.text)}</span>
                <div class="task-actions">
                    <button class="edit-btn">✏️</button>
                    <button class="delete-btn">🗑️</button>
                </div>
            `;

            // Добавляем обработчики событий
            const checkbox = taskItem.querySelector('.task-checkbox');
            const editBtn = taskItem.querySelector('.edit-btn');
            const deleteBtn = taskItem.querySelector('.delete-btn');

            checkbox.addEventListener('change', () => toggleTask(task.id));
            editBtn.addEventListener('click', () => editTask(task.id));
            deleteBtn.addEventListener('click', () => deleteTask(task.id));

            taskList.appendChild(taskItem);
        });
    }

    updateTaskCount();
}

// Экранируем HTML для безопасности
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Обработчики событий
addBtn.addEventListener('click', addTask);

taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTask();
    }
});

clearCompleted.addEventListener('click', clearCompletedTasks);

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterTasks(btn.dataset.filter);
    });
});

// Загружаем задачи при загрузке страницы
loadTasks();
