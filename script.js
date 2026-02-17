// 待办事项应用JavaScript

// 任务状态枚举
const TaskStatus = {
    PENDING: 'pending',      // 未完成
    IN_PROGRESS: 'in_progress',  // 进行中
    COMPLETED: 'completed',  // 已完成
    CANCELLED: 'cancelled',  // 已取消
    OVERDUE: 'overdue'       // 已逾期
};

// 任务分类枚举
const TaskCategory = {
    WORK: 'work',           // 工作
    STUDY: 'study',         // 学习
    LIFE: 'life'            // 生活
};

// 任务优先级枚举
const TaskPriority = {
    HIGH: 'high',           // 高
    MEDIUM: 'medium',       // 中
    LOW: 'low'              // 低
};

// 创建任务存储对象
const taskStore = {
    // 状态
    currentUser: null,
    tasks: [],
    currentFilter: 'all',
    currentCategoryFilter: 'all',
    
    // 获取筛选后的任务
    getFilteredTasks: function() {
        return this.tasks.filter(task => {
            // 按完成状态筛选
            if (this.currentFilter === 'pending' && task.status === TaskStatus.COMPLETED) return false;
            if (this.currentFilter === 'completed' && task.status !== TaskStatus.COMPLETED) return false;
            
            // 按分类筛选
            if (this.currentCategoryFilter && this.currentCategoryFilter !== 'all' && task.category !== this.currentCategoryFilter) return false;
            
            return true;
        }).sort((a, b) => {
            // 按优先级排序
            const priorityOrder = {
                [TaskPriority.HIGH]: 3,
                [TaskPriority.MEDIUM]: 2,
                [TaskPriority.LOW]: 1
            };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
    },
    
    // 加载用户信息
    loadUser: function() {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
        }
    },
    
    // 保存用户信息
    saveUser: function() {
        if (this.currentUser) {
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        } else {
            localStorage.removeItem('currentUser');
        }
    },
    
    // 登录
    login: function(username, password) {
        // 允许用户使用任意用户名登录，无需固定密码
        if (username.trim()) {
            this.currentUser = { username: username.trim() };
            this.saveUser();
            this.loadTasks();
            return true;
        }
        return false;
    },
    
    // 退出登录
    logout: function() {
        this.currentUser = null;
        this.tasks = [];
        this.currentFilter = 'all';
        this.currentCategoryFilter = 'all';
        this.saveUser();
    },
    
    // 加载任务
    loadTasks: function() {
        if (this.currentUser) {
            const savedTasks = localStorage.getItem(`tasks_${this.currentUser.username}`);
            if (savedTasks) {
                this.tasks = JSON.parse(savedTasks);
                // 检查任务类型并重置每日/每周任务的完成状态
                const today = new Date();
                const todayDay = today.getDay();
                
                this.tasks.forEach(task => {
                    if (task.type === 'daily' && task.status === TaskStatus.COMPLETED) {
                        // 重置每日任务的完成状态
                        const lastCompletedDate = new Date(task.lastCompleted);
                        if (lastCompletedDate.toDateString() !== today.toDateString()) {
                            task.status = TaskStatus.PENDING;
                            task.completedAt = null;
                            task.lastCompleted = null;
                        }
                    } else if (task.type === 'weekly' && task.status === TaskStatus.COMPLETED) {
                        // 检查每周任务是否需要重置
                        const lastCompletedDate = new Date(task.lastCompleted);
                        
                        // 兼容旧格式和新格式
                        if (task.weekdays) {
                            // 新格式：多个星期几
                            if (!task.weekdays.includes(todayDay) || 
                                lastCompletedDate.toDateString() !== today.toDateString()) {
                                task.status = TaskStatus.PENDING;
                                task.completedAt = null;
                                task.lastCompleted = null;
                            }
                        } else if (task.weekday !== null) {
                            // 旧格式：单个星期几
                            if (lastCompletedDate.getDay() !== todayDay || 
                                lastCompletedDate.toDateString() !== today.toDateString()) {
                                task.status = TaskStatus.PENDING;
                                task.completedAt = null;
                                task.lastCompleted = null;
                            }
                        }
                    } else if (task.type === 'today' && task.status === TaskStatus.COMPLETED) {
                        // 检查今日任务是否过期
                        const taskDate = new Date(task.createdAt);
                        if (taskDate.toDateString() !== today.toDateString()) {
                            task.status = TaskStatus.PENDING;
                            task.completedAt = null;
                            task.lastCompleted = null;
                        }
                    }
                });
                
                this.saveTasks();
            } else {
                this.tasks = [];
            }
        }
    },
    
    // 保存任务
    saveTasks: function() {
        if (this.currentUser) {
            localStorage.setItem(`tasks_${this.currentUser.username}`, JSON.stringify(this.tasks));
        }
    },
    
    // 添加任务
    addTask: function(task) {
        this.tasks.push(task);
        this.saveTasks();
    },
    
    // 更新任务
    updateTask: function(taskId, updates) {
        const taskIndex = this.tasks.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
            this.tasks[taskIndex] = { ...this.tasks[taskIndex], ...updates };
            this.saveTasks();
        }
    },
    
    // 根据ID获取任务
    getTaskById: function(taskId) {
        return this.tasks.find(task => task.id === taskId);
    },
    
    // 删除任务
    deleteTask: function(taskId) {
        const taskIndex = this.tasks.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
            this.tasks.splice(taskIndex, 1);
            this.saveTasks();
        }
    },
    
    // 切换任务状态
    toggleTaskCompletion: function(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            const newStatus = task.status === TaskStatus.COMPLETED ? TaskStatus.PENDING : TaskStatus.COMPLETED;
            task.status = newStatus;
            
            if (newStatus === TaskStatus.COMPLETED) {
                task.completedAt = new Date().toISOString();
                task.lastCompleted = task.completedAt;
            } else {
                task.completedAt = null;
                task.lastCompleted = null;
            }
            
            this.saveTasks();
        }
    },
    
    // 更新任务状态
    updateTaskStatus: function(taskId, newStatus) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.status = newStatus;
            
            if (newStatus === TaskStatus.COMPLETED) {
                task.completedAt = new Date().toISOString();
                task.lastCompleted = task.completedAt;
            } else if (newStatus !== TaskStatus.COMPLETED) {
                task.completedAt = null;
                task.lastCompleted = null;
            }
            
            this.saveTasks();
        }
    },
    
    // 设置筛选条件
    setFilter: function(filter) {
        this.currentFilter = filter;
    },
    
    // 设置分类筛选条件
    setCategoryFilter: function(category) {
        this.currentCategoryFilter = category;
    }
};

// 创建通知元素
const notificationElement = document.createElement('div');
notificationElement.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    border-radius: 5px;
    color: white;
    font-weight: 500;
    z-index: 1000;
    transform: translateX(400px);
    transition: transform 0.3s ease;
`;
document.body.appendChild(notificationElement);

// 声明DOM元素变量
let loginContainer, todoContainer, usernameInput, passwordInput, loginBtn, loginError;
let logoutBtn, currentDateElement, filterBtns, taskInput, taskTypeSelect, weekdaySelect;
let addTaskBtn, tasksContainer;

// 初始化应用
document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    loginContainer = document.getElementById('login-container');
    todoContainer = document.getElementById('todo-container');
    usernameInput = document.getElementById('username');
    passwordInput = document.getElementById('password');
    loginBtn = document.getElementById('login-btn');
    loginError = document.getElementById('login-error');
    logoutBtn = document.getElementById('logout-btn');
    currentDateElement = document.getElementById('current-date');
    filterBtns = document.querySelectorAll('.filter-btn');
    taskInput = document.getElementById('task-input');
    taskTypeSelect = document.getElementById('task-type');
    weekdaySelect = document.getElementById('weekday-select');
    addTaskBtn = document.getElementById('add-task-btn');
    tasksContainer = document.getElementById('tasks-container');
    
    // 检查是否有已登录用户
    taskStore.loadUser();
    if (taskStore.currentUser) {
        showTodoContainer();
    }
    
    // 更新当前日期
    updateCurrentDate();
    setInterval(updateCurrentDate, 60000); // 每分钟更新一次
    
    // 启动倒计时定时器，每秒更新一次
    setInterval(updateCountdowns, 1000);
    
    // 绑定事件监听器
    bindEventListeners();
    
    // 初始化分类筛选
    initializeCategoryFilter();
});

// 分类筛选初始化
function initializeCategoryFilter() {
    const categoryFilterBtns = document.querySelectorAll('.category-filter-btn');
    categoryFilterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            filterTasksByCategory(this.dataset.category);
        });
    });
}

// 分类筛选
function filterTasksByCategory(category) {
    taskStore.setCategoryFilter(category);
    // 更新分类筛选按钮状态
    const categoryFilterBtns = document.querySelectorAll('.category-filter-btn');
    categoryFilterBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.category === category) {
            btn.classList.add('active');
        }
    });
    renderTasks();
}

// 显示通知
function showNotification(message, type = 'info') {
    // 设置通知样式
    switch (type) {
        case 'success':
            notificationElement.style.backgroundColor = '#2ecc71';
            break;
        case 'error':
            notificationElement.style.backgroundColor = '#e74c3c';
            break;
        case 'warning':
            notificationElement.style.backgroundColor = '#f39c12';
            break;
        default:
            notificationElement.style.backgroundColor = '#3498db';
    }
    
    // 设置消息并显示
    notificationElement.textContent = message;
    notificationElement.style.transform = 'translateX(0)';
    
    // 3秒后隐藏
    setTimeout(() => {
        notificationElement.style.transform = 'translateX(400px)';
    }, 3000);
}

// 绑定事件监听器
function bindEventListeners() {
    // 登录按钮
    loginBtn.addEventListener('click', handleLogin);
    
    // 回车键登录
    usernameInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') handleLogin();
    });
    
    passwordInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') handleLogin();
    });
    
    // 退出登录
    logoutBtn.addEventListener('click', handleLogout);
    
    // 任务筛选
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            filterTasks(this.dataset.filter);
        });
    });
    
    // 任务类型选择
    taskTypeSelect.addEventListener('change', function() {
        if (this.value === 'weekly') {
            weekdaySelect.style.display = 'block';
        } else {
            weekdaySelect.style.display = 'none';
        }
    });
    
    // 添加任务按钮
    addTaskBtn.addEventListener('click', addTask);
    
    // 回车键添加任务
    taskInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') addTask();
    });
    
    // 分类筛选事件
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', () => {
            currentCategoryFilter = categoryFilter.value;
            renderTasks();
        });
    }
}

// 处理登录
function handleLogin() {
    const username = usernameInput.value.trim();
    
    if (!username) {
        loginError.textContent = '请输入用户名';
        return;
    }
    
    // 使用Pinia进行登录验证
    if (taskStore.login(username, '')) {
        showTodoContainer();
    } else {
        loginError.textContent = '登录失败';
    }
}

// 处理退出登录
function handleLogout() {
    taskStore.logout();
    loginContainer.style.display = 'flex';
    todoContainer.style.display = 'none';
    usernameInput.value = '';
    passwordInput.value = '';
    loginError.textContent = '';
}

// 显示任务管理界面
function showTodoContainer() {
    loginContainer.style.display = 'none';
    todoContainer.style.display = 'block';
    taskStore.loadTasks();
    renderTasks();
}

// 更新当前日期
function updateCurrentDate() {
    const now = new Date();
    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    };
    currentDateElement.textContent = now.toLocaleDateString('zh-CN', options);
}

// 任务筛选
function filterTasks(filter) {
    taskStore.setFilter(filter);
    
    // 更新筛选按钮状态
    filterBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.filter === filter) {
            btn.classList.add('active');
        }
    });
    
    renderTasks();
}

// 添加任务
function addTask() {
    const taskText = taskInput.value.trim();
    const taskType = taskTypeSelect.value;
    
    if (!taskText) return;
    
    // 获取选中的星期几
    let selectedWeekdays = [];
    if (taskType === 'weekly') {
        const checkboxes = document.querySelectorAll('input[name="weekday"]:checked');
        selectedWeekdays = Array.from(checkboxes).map(cb => parseInt(cb.value));
        
        // 检查是否至少选择了一个星期几
        if (selectedWeekdays.length === 0) {
            showNotification('请至少选择一个星期几！', 'error');
            return;
        }
    }
    
    // 获取分类和优先级选择
    const categorySelect = document.getElementById('task-category');
    const prioritySelect = document.getElementById('task-priority');
    const category = categorySelect ? categorySelect.value : TaskCategory.WORK;
    const priority = prioritySelect ? prioritySelect.value : TaskPriority.MEDIUM;
    
    const now = new Date();
    const task = {
        id: Date.now(),
        text: taskText,
        status: TaskStatus.PENDING,  // 默认状态：未完成
        category: category, // 用户选择的分类
        priority: priority, // 用户选择的优先级
        type: taskType,
        weekdays: taskType === 'weekly' ? selectedWeekdays : null,
        createdAt: now.toISOString(),
        lastCompleted: null,
        completedAt: null
    };
    
    taskStore.addTask(task);
    renderTasks();
    
    // 清空输入并聚焦
    taskInput.value = '';
    taskInput.focus();
    taskTypeSelect.value = 'today';
    weekdaySelect.style.display = 'none';
    
    // 清空星期几选择
    document.querySelectorAll('input[name="weekday"]').forEach(cb => cb.checked = false);
    
    // 显示添加成功提示
    showNotification('任务添加成功！', 'success');
}

// 切换任务完成状态
function toggleTaskCompletion(taskId) {
    const task = taskStore.getTaskById(taskId);
    if (task) {
        const { ElMessageBox } = ElementPlus;
        
        const newStatus = task.status === TaskStatus.COMPLETED ? TaskStatus.PENDING : TaskStatus.COMPLETED;
        const statusNames = {
            [TaskStatus.PENDING]: '未完成',
            [TaskStatus.COMPLETED]: '已完成'
        };
        
        ElMessageBox.confirm(
            `确定要将任务状态更改为"${statusNames[newStatus]}"吗？`,
            '确认状态更改',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }
        ).then(() => {
            taskStore.updateTaskStatus(taskId, newStatus);
            
            // 显示完成状态变化通知
            showNotification(`任务已${newStatus === TaskStatus.COMPLETED ? '完成' : '取消完成'}！`, 'success');
        }).catch(() => {
            // 用户取消操作
        });
    }
}

// 更新任务状态
function updateTaskStatus(taskId, newStatus) {
    const task = taskStore.getTaskById(taskId);
    if (task) {
        const { ElMessageBox } = ElementPlus;
        
        const statusNames = {
            [TaskStatus.PENDING]: '未完成',
            [TaskStatus.IN_PROGRESS]: '进行中',
            [TaskStatus.COMPLETED]: '已完成',
            [TaskStatus.CANCELLED]: '已取消',
            [TaskStatus.OVERDUE]: '已逾期'
        };
        
        ElMessageBox.confirm(
            `确定要将任务状态更改为"${statusNames[newStatus]}"吗？`,
            '确认状态更改',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }
        ).then(() => {
            taskStore.updateTaskStatus(taskId, newStatus);
            
            // 显示状态更新通知
            showNotification(`任务状态已更新为：${statusNames[newStatus]}`, 'success');
        }).catch(() => {
            // 用户取消操作
        });
    }
}

// 编辑任务


// 删除任务
function deleteTask(taskId) {
    const { ElMessageBox } = ElementPlus;
    
    ElMessageBox.confirm(
        '确定要删除这个任务吗？删除后将无法恢复。',
        '确认删除',
        {
            confirmButtonText: '删除',
            cancelButtonText: '取消',
            type: 'error'
        }
    ).then(() => {
        taskStore.deleteTask(taskId);
        showNotification('任务已删除！', 'error');
    }).catch(() => {
        // 用户取消删除操作
    });
}

// 更新倒计时
function updateCountdowns() {
    const countdownElements = document.querySelectorAll('.task-countdown');
    
    countdownElements.forEach(element => {
        const taskId = parseInt(element.dataset.taskId);
        const task = taskStore.tasks.find(t => t.id === taskId);
        
        if (task && task.type === 'today' && task.status !== TaskStatus.COMPLETED) {
            const now = new Date();
            const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
            const remainingTime = endOfDay - now;
            
            if (remainingTime > 0) {
                const hours = Math.floor(remainingTime / (1000 * 60 * 60));
                const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);
                
                element.textContent = `剩余时间: ${hours}小时${minutes}分钟${seconds}秒`;
                element.style.display = 'block';
            } else {
                element.textContent = '已过期';
                element.style.color = '#e74c3c';
                element.style.display = 'block';
                
                // 将任务状态更新为已逾期
                if (task.status !== TaskStatus.OVERDUE && task.status !== TaskStatus.COMPLETED) {
                    taskStore.updateTaskStatus(taskId, TaskStatus.OVERDUE);
                    renderTasks();
                    showNotification('有任务已过期！', 'warning');
                }
            }
        } else {
            element.style.display = 'none';
        }
    });
}

// 渲染任务列表
function renderTasks() {
    // 从Pinia获取筛选后的任务
    const filteredTasks = taskStore.getFilteredTasks();
    
    // 清空任务列表
    tasksContainer.innerHTML = '';
    
    if (filteredTasks.length === 0) {
        tasksContainer.innerHTML = '<p style="text-align: center; color: #999; padding: 2rem;">暂无任务</p>';
        return;
    }
    
    filteredTasks.forEach(task => {
        const taskItem = document.createElement('li');
        taskItem.className = `task-item ${task.status === TaskStatus.COMPLETED ? 'task-completed' : ''} ${task.status === TaskStatus.OVERDUE ? 'task-overdue' : ''}`;
        
        // 获取任务类型显示文本
        let typeText = '';
        const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
        switch (task.type) {
            case 'today':
                typeText = '仅今天';
                break;
            case 'daily':
                typeText = '每天';
                break;
            case 'weekly':
                if (task.weekdays) {
                    // 处理旧格式的单个weekday
                    if (typeof task.weekday !== 'undefined' && task.weekday !== null) {
                        typeText = `每周: ${weekdays[task.weekday]}`;
                    } else {
                        // 新格式的weekdays数组
                        const selectedDays = task.weekdays.map(day => weekdays[day]).join(', ');
                        typeText = `每周: ${selectedDays}`;
                    }
                } else if (task.weekday !== null) {
                    // 兼容旧数据
                    typeText = `每周: ${weekdays[task.weekday]}`;
                } else {
                    typeText = '每周';
                }
                break;
        }
        
        // 为当天未完成任务添加倒计时
        const countdownHTML = task.type === 'today' && task.status !== TaskStatus.COMPLETED 
            ? `<span class="task-countdown" data-task-id="${task.id}"></span>` 
            : '';
        
        // 获取优先级和分类显示文本
        const priorityText = {
            [TaskPriority.HIGH]: '高',
            [TaskPriority.MEDIUM]: '中',
            [TaskPriority.LOW]: '低'
        }[task.priority];
        
        const categoryText = {
            [TaskCategory.WORK]: '工作',
            [TaskCategory.STUDY]: '学习',
            [TaskCategory.LIFE]: '生活'
        }[task.category];
        
        taskItem.innerHTML = `
            <input type="checkbox" class="task-checkbox" ${task.status === TaskStatus.COMPLETED ? 'checked' : ''} onchange="toggleTaskCompletion(${task.id})">
            <div class="task-content">
                <span class="task-title">${task.text}</span>
                <div class="task-meta">
                    <span class="task-type">${typeText}</span>
                    <span class="priority-badge priority-${task.priority}">${priorityText}</span>
                    <span class="category-badge category-${task.category}">${categoryText}</span>
                    ${countdownHTML}
                </div>
            </div>
            <button class="delete-task-btn" onclick="deleteTask(${task.id})">&times;</button>
        `;
        
        tasksContainer.appendChild(taskItem);
    });
    
    // 更新所有倒计时
    updateCountdowns();
}

// 保存任务到本地存储
function saveTasks() {
    if (currentUser) {
        localStorage.setItem(`tasks_${currentUser.username}`, JSON.stringify(tasks));
    }
}

// 从本地存储加载任务
function loadTasks() {
    if (currentUser) {
        const savedTasks = localStorage.getItem(`tasks_${currentUser.username}`);
        if (savedTasks) {
            tasks = JSON.parse(savedTasks);
            // 检查任务类型并重置每日/每周任务的完成状态
            const today = new Date();
            const todayDay = today.getDay();
            
            tasks.forEach(task => {
                if (task.type === 'daily' && task.completed) {
                    // 重置每日任务的完成状态
                    const lastCompletedDate = new Date(task.lastCompleted);
                    if (lastCompletedDate.toDateString() !== today.toDateString()) {
                        task.completed = false;
                        task.lastCompleted = null;
                    }
                } else if (task.type === 'weekly' && task.completed) {
                    // 检查每周任务是否需要重置
                    const lastCompletedDate = new Date(task.lastCompleted);
                    
                    // 兼容旧格式和新格式
                    if (task.weekdays) {
                        // 新格式：多个星期几
                        if (!task.weekdays.includes(todayDay) || 
                            lastCompletedDate.toDateString() !== today.toDateString()) {
                            task.completed = false;
                            task.lastCompleted = null;
                        }
                    } else if (task.weekday !== null) {
                        // 旧格式：单个星期几
                        if (lastCompletedDate.getDay() !== todayDay || 
                            lastCompletedDate.toDateString() !== today.toDateString()) {
                            task.completed = false;
                            task.lastCompleted = null;
                        }
                    }
                } else if (task.type === 'today' && task.completed) {
                    // 检查今日任务是否过期
                    const taskDate = new Date(task.createdAt);
                    if (taskDate.toDateString() !== today.toDateString()) {
                        task.completed = false;
                        task.lastCompleted = null;
                    }
                }
            });
            
            saveTasks();
        } else {
            tasks = [];
        }
    }
}