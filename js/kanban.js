const state = {
    boards: [],
    currentBoardId: null,
    editingBoardId: null,
    editingListId: null,
    editingTodoId: null,
    draggedTodo: null
};

const Storage = {
    save() {
        localStorage.setItem('kanbanBoards', JSON.stringify(state.boards));
        localStorage.setItem('kanbanCurrentBoardId', state.currentBoardId);
    },

    load() {
        const boards = localStorage.getItem('kanbanBoards');
        const currentBoardId = localStorage.getItem('kanbanCurrentBoardId');
        
        if (boards) {
            state.boards = JSON.parse(boards);
        }
        
        if (currentBoardId) {
            state.currentBoardId = parseInt(currentBoardId);
        }
        
        if (!state.currentBoardId && state.boards.length > 0) {
            state.currentBoardId = state.boards[0].id;
        }
    }
};

const elements = {
    backBtn: document.getElementById('backBtn'),
    currentBoardTitle: document.getElementById('currentBoardTitle'),
    createBoardBtn: document.getElementById('createBoardBtn'),
    manageBoardsBtn: document.getElementById('manageBoardsBtn'),
    boardContainer: document.getElementById('boardContainer'),
    listsContainer: document.getElementById('listsContainer'),
    addListBtn: document.getElementById('addListBtn'),
    boardModal: document.getElementById('boardModal'),
    boardModalTitle: document.getElementById('boardModalTitle'),
    boardNameInput: document.getElementById('boardNameInput'),
    closeBoardModal: document.getElementById('closeBoardModal'),
    cancelBoardBtn: document.getElementById('cancelBoardBtn'),
    saveBoardBtn: document.getElementById('saveBoardBtn'),
    listModal: document.getElementById('listModal'),
    listModalTitle: document.getElementById('listModalTitle'),
    listNameInput: document.getElementById('listNameInput'),
    closeListModal: document.getElementById('closeListModal'),
    cancelListBtn: document.getElementById('cancelListBtn'),
    saveListBtn: document.getElementById('saveListBtn'),
    todoModal: document.getElementById('todoModal'),
    todoModalTitle: document.getElementById('todoModalTitle'),
    todoTitleInput: document.getElementById('todoTitleInput'),
    todoDescInput: document.getElementById('todoDescInput'),
    todoDueDateInput: document.getElementById('todoDueDateInput'),
    closeTodoModal: document.getElementById('closeTodoModal'),
    cancelTodoBtn: document.getElementById('cancelTodoBtn'),
    saveTodoBtn: document.getElementById('saveTodoBtn'),
    boardsManageModal: document.getElementById('boardsManageModal'),
    closeBoardsManageModal: document.getElementById('closeBoardsManageModal'),
    closeBoardsManageBtn: document.getElementById('closeBoardsManageBtn'),
    boardsList: document.getElementById('boardsList'),
    toast: document.getElementById('toast')
};

function getCurrentBoard() {
    return state.boards.find(b => b.id === state.currentBoardId);
}

function generateId() {
    return Date.now() + Math.random();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dueDate = new Date(date);
    dueDate.setHours(0, 0, 0, 0);
    
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    let className = '';
    if (dueDate < today) {
        className = 'overdue';
    } else if (dueDate.getTime() === today.getTime()) {
        className = 'today';
    }
    
    return `<span class="todo-due-date ${className}">📅 ${month}-${day}</span>`;
}

function showToast(message, type = 'success') {
    elements.toast.textContent = message;
    elements.toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        elements.toast.classList.remove('show');
    }, 3000);
}

function renderBoard() {
    const board = getCurrentBoard();
    
    if (!board) {
        elements.currentBoardTitle.textContent = '暂无看板';
        elements.listsContainer.innerHTML = '<div class="empty-state">请先创建一个看板</div>';
        return;
    }
    
    elements.currentBoardTitle.textContent = board.name;
    renderLists();
}

function renderLists() {
    const board = getCurrentBoard();
    
    if (!board) return;
    
    elements.listsContainer.innerHTML = '';
    
    if (board.lists.length === 0) {
        elements.listsContainer.innerHTML = '<div class="empty-state">暂无列表，点击右侧按钮添加</div>';
        return;
    }
    
    board.lists.forEach(list => {
        const listElement = createListElement(list);
        elements.listsContainer.appendChild(listElement);
    });
}

function createListElement(list) {
    const listDiv = document.createElement('div');
    listDiv.className = 'list';
    listDiv.dataset.listId = list.id;
    
    listDiv.innerHTML = `
        <div class="list-header">
            <span class="list-title">${escapeHtml(list.name)}</span>
            <div class="list-actions">
                <button class="btn btn-sm btn-secondary btn-icon edit-list-btn" data-list-id="${list.id}" title="编辑">✏️</button>
                <button class="btn btn-sm btn-danger btn-icon delete-list-btn" data-list-id="${list.id}" title="删除">🗑️</button>
            </div>
        </div>
        <div class="list-todos" data-list-id="${list.id}"></div>
        <div class="list-footer">
            <button class="add-todo-btn" data-list-id="${list.id}">
                <span>+</span> 添加待办事项
            </button>
        </div>
    `;
    
    const todosContainer = listDiv.querySelector('.list-todos');
    list.todos.forEach(todo => {
        const todoElement = createTodoElement(todo);
        todosContainer.appendChild(todoElement);
    });
    
    todosContainer.addEventListener('dragover', handleDragOver);
    todosContainer.addEventListener('drop', handleDrop);
    todosContainer.addEventListener('dragleave', handleDragLeave);
    
    return listDiv;
}

function createTodoElement(todo) {
    const todoDiv = document.createElement('div');
    todoDiv.className = 'todo';
    todoDiv.draggable = true;
    todoDiv.dataset.todoId = todo.id;
    
    todoDiv.innerHTML = `
        <div class="todo-header">
            <span class="todo-title">${escapeHtml(todo.title)}</span>
            <div class="todo-actions">
                <button class="btn btn-sm btn-secondary btn-icon edit-todo-btn" data-todo-id="${todo.id}" title="编辑">✏️</button>
                <button class="btn btn-sm btn-danger btn-icon delete-todo-btn" data-todo-id="${todo.id}" title="删除">🗑️</button>
            </div>
        </div>
        ${todo.description ? `<div class="todo-desc">${escapeHtml(todo.description)}</div>` : ''}
        <div class="todo-meta">
            ${todo.dueDate ? formatDate(todo.dueDate) : ''}
            <span>📌</span>
        </div>
    `;
    
    todoDiv.addEventListener('dragstart', handleDragStart);
    todoDiv.addEventListener('dragend', handleDragEnd);
    todoDiv.addEventListener('click', (e) => {
        if (!e.target.closest('.todo-actions')) {
            openTodoModal(todo.id);
        }
    });
    
    return todoDiv;
}

function openBoardModal(boardId = null) {
    state.editingBoardId = boardId;
    elements.boardModalTitle.textContent = boardId ? '编辑看板' : '新建看板';
    
    if (boardId) {
        const board = state.boards.find(b => b.id === boardId);
        elements.boardNameInput.value = board.name;
    } else {
        elements.boardNameInput.value = '';
    }
    
    elements.boardModal.classList.add('active');
    elements.boardNameInput.focus();
}

function closeBoardModal() {
    elements.boardModal.classList.remove('active');
    state.editingBoardId = null;
    elements.boardNameInput.value = '';
}

function saveBoard() {
    const name = elements.boardNameInput.value.trim();
    
    if (!name) {
        showToast('请输入看板名称', 'error');
        return;
    }
    
    if (state.editingBoardId) {
        const board = state.boards.find(b => b.id === state.editingBoardId);
        board.name = name;
        showToast('看板已更新');
    } else {
        const newBoard = {
            id: generateId(),
            name: name,
            lists: []
        };
        state.boards.push(newBoard);
        state.currentBoardId = newBoard.id;
        showToast('看板已创建');
    }
    
    Storage.save();
    renderBoard();
    closeBoardModal();
}

function deleteBoard(boardId) {
    if (state.boards.length === 1) {
        showToast('至少需要保留一个看板', 'error');
        return;
    }
    
    if (confirm('确定要删除这个看板吗？')) {
        state.boards = state.boards.filter(b => b.id !== boardId);
        
        if (state.currentBoardId === boardId) {
            state.currentBoardId = state.boards[0].id;
        }
        
        Storage.save();
        renderBoard();
        renderBoardsList();
        showToast('看板已删除');
    }
}

function switchBoard(boardId) {
    state.currentBoardId = boardId;
    Storage.save();
    renderBoard();
    renderBoardsList();
}

function openListModal(listId = null) {
    state.editingListId = listId;
    elements.listModalTitle.textContent = listId ? '编辑列表' : '新建列表';
    
    if (listId) {
        const board = getCurrentBoard();
        const list = board.lists.find(l => l.id === listId);
        elements.listNameInput.value = list.name;
    } else {
        elements.listNameInput.value = '';
    }
    
    elements.listModal.classList.add('active');
    elements.listNameInput.focus();
}

function closeListModal() {
    elements.listModal.classList.remove('active');
    state.editingListId = null;
    elements.listNameInput.value = '';
}

function saveList() {
    const name = elements.listNameInput.value.trim();
    
    if (!name) {
        showToast('请输入列表名称', 'error');
        return;
    }
    
    const board = getCurrentBoard();
    
    if (state.editingListId) {
        const list = board.lists.find(l => l.id === state.editingListId);
        list.name = name;
        showToast('列表已更新');
    } else {
        const newList = {
            id: generateId(),
            name: name,
            todos: []
        };
        board.lists.push(newList);
        showToast('列表已创建');
    }
    
    Storage.save();
    renderLists();
    closeListModal();
}

function deleteList(listId) {
    if (confirm('确定要删除这个列表吗？')) {
        const board = getCurrentBoard();
        board.lists = board.lists.filter(l => l.id !== listId);
        Storage.save();
        renderLists();
        showToast('列表已删除');
    }
}

function openTodoModal(todoId = null, listId = null) {
    state.editingTodoId = todoId;
    state.currentListId = listId;
    elements.todoModalTitle.textContent = todoId ? '编辑待办事项' : '新建待办事项';
    
    if (todoId) {
        const board = getCurrentBoard();
        let todo = null;
        for (const list of board.lists) {
            todo = list.todos.find(t => t.id === todoId);
            if (todo) break;
        }
        
        if (todo) {
            elements.todoTitleInput.value = todo.title;
            elements.todoDescInput.value = todo.description || '';
            elements.todoDueDateInput.value = todo.dueDate || '';
        }
    } else {
        elements.todoTitleInput.value = '';
        elements.todoDescInput.value = '';
        elements.todoDueDateInput.value = '';
    }
    
    elements.todoModal.classList.add('active');
    elements.todoTitleInput.focus();
}

function closeTodoModal() {
    elements.todoModal.classList.remove('active');
    state.editingTodoId = null;
    state.currentListId = null;
    elements.todoTitleInput.value = '';
    elements.todoDescInput.value = '';
    elements.todoDueDateInput.value = '';
}

function saveTodo() {
    const title = elements.todoTitleInput.value.trim();
    const description = elements.todoDescInput.value.trim();
    const dueDate = elements.todoDueDateInput.value;
    
    if (!title) {
        showToast('请输入待办事项标题', 'error');
        return;
    }
    
    const board = getCurrentBoard();
    
    if (state.editingTodoId) {
        for (const list of board.lists) {
            const todo = list.todos.find(t => t.id === state.editingTodoId);
            if (todo) {
                todo.title = title;
                todo.description = description;
                todo.dueDate = dueDate;
                break;
            }
        }
        showToast('待办事项已更新');
    } else {
        if (!state.currentListId) {
            showToast('请先选择一个列表', 'error');
            return;
        }
        
        const list = board.lists.find(l => l.id === state.currentListId);
        const newTodo = {
            id: generateId(),
            title: title,
            description: description,
            dueDate: dueDate,
            createdAt: new Date().toISOString()
        };
        list.todos.push(newTodo);
        showToast('待办事项已创建');
    }
    
    Storage.save();
    renderLists();
    closeTodoModal();
}

function deleteTodo(todoId) {
    if (confirm('确定要删除这个待办事项吗？')) {
        const board = getCurrentBoard();
        for (const list of board.lists) {
            const index = list.todos.findIndex(t => t.id === todoId);
            if (index !== -1) {
                list.todos.splice(index, 1);
                break;
            }
        }
        Storage.save();
        renderLists();
        showToast('待办事项已删除');
    }
}

function handleDragStart(e) {
    state.draggedTodo = e.target;
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    document.querySelectorAll('.list-todos').forEach(container => {
        container.classList.remove('drag-over');
    });
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    e.currentTarget.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    
    if (!state.draggedTodo) return;
    
    const todoId = parseInt(state.draggedTodo.dataset.todoId);
    const targetListId = parseInt(e.currentTarget.dataset.listId);
    
    const board = getCurrentBoard();
    let todo = null;
    let sourceListId = null;
    
    for (const list of board.lists) {
        const index = list.todos.findIndex(t => t.id === todoId);
        if (index !== -1) {
            todo = list.todos.splice(index, 1)[0];
            sourceListId = list.id;
            break;
        }
    }
    
    if (todo) {
        const targetList = board.lists.find(l => l.id === targetListId);
        targetList.todos.push(todo);
        Storage.save();
        renderLists();
        
        if (sourceListId !== targetListId) {
            showToast('待办事项已移动');
        }
    }
    
    state.draggedTodo = null;
}

function renderBoardsList() {
    elements.boardsList.innerHTML = '';
    
    state.boards.forEach(board => {
        const boardItem = document.createElement('div');
        boardItem.className = `board-item ${board.id === state.currentBoardId ? 'active' : ''}`;
        boardItem.innerHTML = `
            <span class="board-item-name">${escapeHtml(board.name)}</span>
            <div class="board-item-actions">
                <button class="btn btn-sm btn-secondary btn-icon edit-board-btn" data-board-id="${board.id}" title="编辑">✏️</button>
                <button class="btn btn-sm btn-danger btn-icon delete-board-btn" data-board-id="${board.id}" title="删除">🗑️</button>
            </div>
        `;
        elements.boardsList.appendChild(boardItem);
    });
}

function openBoardsManageModal() {
    renderBoardsList();
    elements.boardsManageModal.classList.add('active');
}

function closeBoardsManageModal() {
    elements.boardsManageModal.classList.remove('active');
}

function handleBoardContainerClick(e) {
    const target = e.target;
    
    if (target.classList.contains('edit-list-btn')) {
        const listId = parseInt(target.dataset.listId);
        openListModal(listId);
    }
    
    if (target.classList.contains('delete-list-btn')) {
        const listId = parseInt(target.dataset.listId);
        deleteList(listId);
    }
    
    if (target.classList.contains('add-todo-btn') || target.closest('.add-todo-btn')) {
        const btn = target.classList.contains('add-todo-btn') ? target : target.closest('.add-todo-btn');
        const listId = parseInt(btn.dataset.listId);
        openTodoModal(null, listId);
    }
    
    if (target.classList.contains('edit-todo-btn')) {
        const todoId = parseInt(target.dataset.todoId);
        openTodoModal(todoId);
    }
    
    if (target.classList.contains('delete-todo-btn')) {
        const todoId = parseInt(target.dataset.todoId);
        deleteTodo(todoId);
    }
}

function handleBoardsListClick(e) {
    const target = e.target;
    
    if (target.classList.contains('edit-board-btn')) {
        const boardId = parseInt(target.dataset.boardId);
        openBoardModal(boardId);
    }
    
    if (target.classList.contains('delete-board-btn')) {
        const boardId = parseInt(target.dataset.boardId);
        deleteBoard(boardId);
    }
    
    if (target.classList.contains('board-item') || target.closest('.board-item')) {
        const item = target.classList.contains('board-item') ? target : target.closest('.board-item');
        if (!target.closest('.board-item-actions')) {
            const boardId = parseInt(item.querySelector('.edit-board-btn').dataset.boardId);
            switchBoard(boardId);
        }
    }
}

elements.backBtn.addEventListener('click', () => {
    window.location.href = 'index.html';
});

elements.createBoardBtn.addEventListener('click', () => openBoardModal());
elements.manageBoardsBtn.addEventListener('click', openBoardsManageModal);
elements.addListBtn.addEventListener('click', () => openListModal());

elements.closeBoardModal.addEventListener('click', closeBoardModal);
elements.cancelBoardBtn.addEventListener('click', closeBoardModal);
elements.saveBoardBtn.addEventListener('click', saveBoard);
elements.boardNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') saveBoard();
});

elements.closeListModal.addEventListener('click', closeListModal);
elements.cancelListBtn.addEventListener('click', closeListModal);
elements.saveListBtn.addEventListener('click', saveList);
elements.listNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') saveList();
});

elements.closeTodoModal.addEventListener('click', closeTodoModal);
elements.cancelTodoBtn.addEventListener('click', closeTodoModal);
elements.saveTodoBtn.addEventListener('click', saveTodo);

elements.closeBoardsManageModal.addEventListener('click', closeBoardsManageModal);
elements.closeBoardsManageBtn.addEventListener('click', closeBoardsManageModal);

elements.boardContainer.addEventListener('click', handleBoardContainerClick);
elements.boardsList.addEventListener('click', handleBoardsListClick);

document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
});

function init() {
    Storage.load();
    renderBoard();
}

init();
