window.TodoStorage = (function () {
    function loadTasks() {
        const savedTasks = localStorage.getItem('tasks');
        if (!savedTasks) return [];

        const parsed = JSON.parse(savedTasks);
        return parsed.map(task => ({
            ...task,
            createdAt: task.createdAt || new Date().toISOString()
        }));
    }

    function saveTasks(tasks) {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
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

    return {
        loadTasks,
        saveTasks,
        generateId,
        formatCreatedAt,
        arrayMove
    };
})();

