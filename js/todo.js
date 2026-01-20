// 状态管理
const state = {
    tasks: [],
    filter: 'all'
};

// 存储模块
const Storage = {
    save() {
        localStorage.setItem('todoTasks', JSON.stringify(state.tasks));
    },

    load() {
        const stored = localStorage.getItem('todoTasks');
        if (stored) {
            state.tasks = JSON.parse(stored);
        }
    }
};

// DOM 元素
const elements = {
    taskInput: document.getElementById('taskInput'),
    addTaskBtn: document.getElementById('addTaskBtn'),
    taskList: document.getElementById('taskList'),
    emptyState: document.getElementById('emptyState'),
    totalTasks: document.getElementById('totalTasks'),
    activeTasks: document.getElementById('activeTasks'),
    completedTasks: document.getElementById('completedTasks'),
    filterBtns: document.querySelectorAll('.filter-btn'),
    clearCompletedBtn: document.getElementById('clearCompletedBtn')
};

// 渲染任务列表
function renderTasks() {
    const filteredTasks = state.tasks.filter(task => {
        if (state.filter === 'active') return !task.completed;
        if (state.filter === 'completed') return task.completed;
        return true;
    });

    elements.taskList.innerHTML = '';

    if (filteredTasks.length === 0) {
        elements.emptyState.style.display = 'block';
    } else {
        elements.emptyState.style.display = 'none';
        filteredTasks.forEach(task => {
            const li = document.createElement('li');
            li.className = `task-item ${task.completed ? 'completed' : ''}`;
            li.innerHTML = `
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} data-id="${task.id}">
                <span class="task-text">${escapeHtml(task.text)}</span>
                <span class="task-date">${formatDate(task.createdAt)}</span>
                <button class="delete-btn" data-id="${task.id}">删除</button>
            `;
            elements.taskList.appendChild(li);
        });
    }

    updateStats();
}

// 更新统计数字
function updateStats() {
    const total = state.tasks.length;
    const completed = state.tasks.filter(t => t.completed).length;
    const active = total - completed;

    elements.totalTasks.textContent = total;
    elements.activeTasks.textContent = active;
    elements.completedTasks.textContent = completed;
}

// 任务管理
function addTask(text) {
    const task = {
        id: Date.now(),
        text: text.trim(),
        completed: false,
        createdAt: new Date().toISOString()
    };

    state.tasks.unshift(task);
    Storage.save();
    renderTasks();
}

function deleteTask(id) {
    state.tasks = state.tasks.filter(t => t.id !== id);
    Storage.save();
    renderTasks();
}

function toggleTask(id) {
    const task = state.tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        Storage.save();
        renderTasks();
    }
}

function clearCompleted() {
    state.tasks = state.tasks.filter(t => !t.completed);
    Storage.save();
    renderTasks();
}

// 工具函数
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${month}-${day} ${hours}:${minutes}`;
}

// 事件处理
function handleAddTask() {
    const text = elements.taskInput.value.trim();
    if (text) {
        addTask(text);
        elements.taskInput.value = '';
        elements.taskInput.focus();
    }
}

function handleTaskListClick(e) {
    const target = e.target;

    if (target.classList.contains('task-checkbox')) {
        const id = parseInt(target.dataset.id);
        toggleTask(id);
    }

    if (target.classList.contains('delete-btn')) {
        const id = parseInt(target.dataset.id);
        deleteTask(id);
    }
}

function handleFilterClick(e) {
    if (e.target.classList.contains('filter-btn')) {
        elements.filterBtns.forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        state.filter = e.target.dataset.filter;
        renderTasks();
    }
}

// 绑定事件
elements.addTaskBtn.addEventListener('click', handleAddTask);
elements.taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleAddTask();
});
elements.taskList.addEventListener('click', handleTaskListClick);
elements.filterBtns.forEach(btn => {
    btn.addEventListener('click', handleFilterClick);
});
elements.clearCompletedBtn.addEventListener('click', clearCompleted);

// 初始化
function init() {
    Storage.load();
    renderTasks();
}

init();
