// ==========================================
// 全域變數與初始化
// ==========================================
let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
let emergencyDeposits = JSON.parse(localStorage.getItem('emergency_deposits')) || [];
let currentActivePage = 1;
let expenseChartInstance = null;

// 切換頁面
function switchPage(pageNum) {
    document.querySelectorAll('.page-content').forEach(page => {
        page.classList.remove('active');
    });
    const targetPage = document.getElementById(`page-${pageNum}`);
    if (targetPage) {
        targetPage.classList.add('active');
        currentActivePage = pageNum;
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
    const toggleText = document.getElementById('toggle-text');
    if (box) {
        box.classList.toggle('collapsed');
        if (toggleText) {
            toggleText.innerText = box.classList.contains('collapsed') ? '展開' : '收合';
        }
    }
}

function resetAppData() {
    if (confirm("確定要清除所有記賬資料嗎？（這也會清除舊的格式錯誤資料）")) {
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

// 🌟 新增：控制階段一存入明細收合 / 展開的切換函數
function toggleDepositBox() {
    const box = document.getElementById('deposit-list');
    const toggleText = document.getElementById('deposit-toggle-text');
    if (box) {
        box.classList.toggle('collapsed');
        if (toggleText) {
            toggleText.innerText = box.classList.contains('collapsed') ? '展開' : '收合';
        }
    }
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
