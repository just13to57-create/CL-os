// ==========================================
// 全域變數與初始化
// ==========================================
let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
let emergencyDeposits = JSON.parse(localStorage.getItem('emergency_deposits')) || [];

// 💡 換成這段全新的目標資料（它會自動幫您修正舊資料的問題）
let financialGoals = [
    { id: 1, type: 'short', title: '🏖️ 日本賞楓之旅', current: 45000, target: 60000, date: '2026-11-30', tag: '旅遊基金' },
    { id: 2, type: 'mid', title: '🚗 換新車頭期款', current: 180000, target: 300000, date: '2028-06-30', tag: '大筆消費' },
    { id: 3, type: 'long', title: '🏡 購屋頭期款基金', current: 600000, target: 2000000, date: '2033-12-31', tag: '房產頭期' }
];
localStorage.setItem('financial_goals', JSON.stringify(financialGoals));

let expenseChartInstance = null;

// 切換頁面
function switchPage(pageNum) {
    document.querySelectorAll('.page-content').forEach(page => {
        page.classList.remove('active');
    });
    const targetPage = document.getElementById(`page-${pageNum}`);
    if (targetPage) {
        targetPage.classList.add('active');
        if (pageNum === 2) {
            renderExpenses();
            updateChart();
        } else if (pageNum === 3) {
            calculateEmergencyFund();
        }
    }
}

// 切換選單 Modal
function toggleMenu() {
    const modal = document.getElementById('nav-modal');
    if (modal) {
        modal.classList.toggle('active');
    }
}

// ==========================================
// 第二頁：日常記賬邏輯
// ==========================================
function addTransaction(event) {
    event.preventDefault();
    const amountInput = document.getElementById('amount');
    const categorySelect = document.getElementById('category');
    const descInput = document.getElementById('description');

    const amount = parseFloat(amountInput.value);
    if (!amount || amount <= 0) return;

    const newTransaction = {
        id: Date.now(),
        amount: amount,
        category: categorySelect ? categorySelect.value : '未分類',
        desc: descInput && descInput.value.trim() ? descInput.value.trim() : '無說明',
        date: new Date().toLocaleDateString()
    };

    expenses.unshift(newTransaction);
    localStorage.setItem('expenses', JSON.stringify(expenses));

    amountInput.value = '';
    if (descInput) descInput.value = '';
    
    renderExpenses();
    updateChart();
}

function renderExpenses() {
    const listContainer = document.getElementById('transaction-list');
    const countEl = document.getElementById('transaction-count');
    const totalBalanceEl = document.getElementById('total-balance');
    if (!listContainer) return;

    let total = expenses.reduce((sum, item) => sum + item.amount, 0);
    if (totalBalanceEl) totalBalanceEl.innerText = `$ ${total.toLocaleString()}`;
    if (countEl) countEl.innerText = `共 ${expenses.length} 筆`;

    if (expenses.length === 0) {
        listContainer.innerHTML = `<p class="empty-text">目前尚無記賬資料</p>`;
        return;
    }

    listContainer.innerHTML = expenses.map(item => `
        <div class="transaction-item">
            <div>
                <span style="font-weight: 500; color: var(--text-main);">${item.desc || '無說明'}</span>
                <span class="category-tag" style="margin-left: 6px;">${item.category || '未分類'}</span>
                <span style="font-size: 0.65rem; color: var(--text-sub); display: block;">${item.date || ''}</span>
            </div>
            <span class="text-expense">- $ ${item.amount.toLocaleString()}</span>
        </div>
    `).join('');
}

function toggleTransactionBox() {
    const box = document.getElementById('transaction-list');
    const section = box ? box.closest('.transaction-section') : null;
    const toggleText = document.getElementById('toggle-text');
    if (box) {
        box.classList.toggle('collapsed');
        if (section) section.classList.toggle('collapsed');
        if (toggleText) {
            toggleText.innerText = box.classList.contains('collapsed') ? '展開' : '收合';
        }
    }
}

function toggleDepositBox() {
    const box = document.getElementById('deposit-list');
    const section = box ? box.closest('.transaction-section') : null;
    const toggleText = document.getElementById('deposit-toggle-text');
    if (box) {
        box.classList.toggle('collapsed');
        if (section) section.classList.toggle('collapsed');
        if (toggleText) {
            toggleText.innerText = box.classList.contains('collapsed') ? '展開' : '收合';
        }
    }
}

function resetAppData() {
    if (confirm("確定要清除所有記賬資料嗎？")) {
        localStorage.removeItem('expenses');
        expenses = [];
        renderExpenses();
        updateChart();
    }
}

function updateChart() {
    const ctx = document.getElementById('expenseChart');
    if (!ctx) return;

    const categoryTotals = {};
    expenses.forEach(item => {
        const cat = item.category || '未分類';
        categoryTotals[cat] = (categoryTotals[cat] || 0) + item.amount;
    });

    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);

    if (expenseChartInstance) {
        expenseChartInstance.destroy();
    }

    expenseChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels.length > 0 ? labels : ['無資料'],
            datasets: [{
                data: data.length > 0 ? data : [1],
                backgroundColor: ['#8C7A6B', '#9C948C', '#B5A697', '#D4C5B9', '#E5E0D8', '#C4B5A5'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right', labels: { boxWidth: 10, font: { size: 10 } } }
            }
        }
    });
}

// ==========================================
// 第三頁：緊急預備金邏輯
// ==========================================
function calculateEmergencyFund() {
    const expenseInput = document.getElementById('monthly-expense');
    if (!expenseInput) return;

    const monthlyExpense = parseFloat(expenseInput.value) || 0;
    const target3m = monthlyExpense * 3;
    const target6m = monthlyExpense * 6;

    let totalSaved = emergencyDeposits.reduce((sum, item) => sum + item.amount, 0);

    const t3mEl = document.getElementById('target-3m');
    const t6mEl = document.getElementById('target-6m');
    const totalSavedEl = document.getElementById('total-saved-display');
    const progressEl = document.getElementById('saving-progress-text');

    if (t3mEl) t3mEl.innerText = `$ ${target3m.toLocaleString()}`;
    if (t6mEl) t6mEl.innerText = `$ ${target6m.toLocaleString()}`;
    if (totalSavedEl) totalSavedEl.innerText = `$ ${totalSaved.toLocaleString()}`;

    let progress = 0;
    if (target6m > 0) {
        progress = Math.min(Math.round((totalSaved / target6m) * 100), 100);
    }
    if (progressEl) progressEl.innerText = `${progress}%`;

    localStorage.setItem('emergency_monthly_expense', monthlyExpense);
    renderDepositList();
}

function addEmergencyDeposit() {
    const amountInput = document.getElementById('deposit-amount');
    const descInput = document.getElementById('deposit-desc');

    if (!amountInput) return;

    const amount = parseFloat(amountInput.value);
    if (!amount || amount <= 0) {
        alert("請輸入有效的存入金額！");
        return;
    }

    const description = descInput && descInput.value.trim() ? descInput.value.trim() : '存入預備金';

    const newDeposit = {
        id: Date.now(),
        amount: amount,
        desc: description,
        date: new Date().toLocaleDateString()
    };

    emergencyDeposits.unshift(newDeposit);
    localStorage.setItem('emergency_deposits', JSON.stringify(emergencyDeposits));

    amountInput.value = '';
    if (descInput) descInput.value = '';

    calculateEmergencyFund();
}

function renderDepositList() {
    const listContainer = document.getElementById('deposit-list');
    const countEl = document.getElementById('deposit-count');
    if (!listContainer) return;

    if (countEl) countEl.innerText = `共 ${emergencyDeposits.length} 筆`;

    if (emergencyDeposits.length === 0) {
        listContainer.innerHTML = `<p class="empty-text">目前尚無存入紀錄</p>`;
        return;
    }

    listContainer.innerHTML = emergencyDeposits.map(item => `
        <div class="transaction-item">
            <div>
                <span style="font-weight: 500; color: var(--text-main);">${item.desc || '存入預備金'}</span>
                <span style="font-size: 0.65rem; color: var(--text-sub); margin-left: 6px;">${item.date || ''}</span>
            </div>
            <span style="color: var(--accent); font-weight: 500;">+ $ ${item.amount.toLocaleString()}</span>
        </div>
    `).join('');
}

// 網頁載入初始化
document.addEventListener('DOMContentLoaded', () => {
    const savedExpense = localStorage.getItem('emergency_monthly_expense');
    const expenseInput = document.getElementById('monthly-expense');
    if (savedExpense !== null && expenseInput) {
        expenseInput.value = savedExpense;
    }
    renderExpenses();
    updateChart();
    calculateEmergencyFund();
});


// ==========================================
// 第五頁：目標管理邏輯
// ==========================================
function renderGoals() {
    renderGoalGroup('short-goal-list', financialGoals.filter(g => g.type === 'short'));
    renderGoalGroup('mid-goal-list', financialGoals.filter(g => g.type === 'mid'));
    renderGoalGroup('long-goal-list', financialGoals.filter(g => g.type === 'long'));
}

function renderGoalGroup(containerId, goals) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (goals.length === 0) {
        container.innerHTML = `<p class="empty-text">尚無此區間目標</p>`;
        return;
    }

    container.innerHTML = goals.map(item => {
        const percent = item.target > 0 ? Math.min(Math.round((item.current / item.target) * 100), 100) : 0;
        return `
            <div class="morandi-card goal-card" onclick="editGoal(${item.id})" style="cursor: pointer;">
                <div class="goal-header">
                    <h3>${item.title}</h3>
                    <span class="goal-amount">NT$ ${item.current.toLocaleString()} / ${item.target.toLocaleString()}</span>
                </div>
                <p class="goal-date">預計達成：${item.date}</p>
                <div class="progress-bar-container">
                    <div class="progress-bar-fill" style="width: ${percent}%;"></div>
                </div>
                <div class="goal-footer">
                    <span class="category-tag">${item.tag || '一般目標'}</span>
                    <span class="text-percentage">${percent}%</span>
                </div>
            </div>
        `;
    }).join('');
}

function editGoal(id) {
    const goal = financialGoals.find(g => g.id === id);
    if (!goal) return;

    const newTitle = prompt("修改目標名稱：", goal.title);
    if (newTitle === null) return;

    const newCurrent = prompt("修改目前已存金額：", goal.current);
    if (newCurrent === null) return;

    const newTarget = prompt("修改目標總金額：", goal.target);
    if (newTarget === null) return;

    const newDate = prompt("修改預計達成日期 (YYYY-MM-DD)：", goal.date);
    if (newDate === null) return;

    goal.title = newTitle.trim() || goal.title;
    goal.current = parseFloat(newCurrent) >= 0 ? parseFloat(newCurrent) : goal.current;
    goal.target = parseFloat(newTarget) > 0 ? parseFloat(newTarget) : goal.target;
    goal.date = newDate.trim() || goal.date;

    localStorage.setItem('financial_goals', JSON.stringify(financialGoals));
    renderGoals();
}
