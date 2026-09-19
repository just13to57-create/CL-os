/* ==========================================
   記賬助手完整核心邏輯 (分類圓餅圖 + 修改/刪除 + LocalStorage)
   ========================================== */

let transactions = [];
let myChart = null;

// 網頁載入時自動從 localStorage 讀取資料
window.onload = function() {
    loadFromLocalStorage();
    const savedPage = localStorage.getItem('current_page');
    if (savedPage) {
        switchPage(parseInt(savedPage));
    } else {
        switchPage(1);
    }
   
    updateUI();
};

// 頁面切換函數
function switchPage(pageNum) {
    for (let i = 1; i <= 5; i++) {
        document.getElementById(`page-${i}`).classList.remove('active');
        document.getElementById(`nav-btn-${i}`).classList.remove('active');
    }
    document.getElementById(`page-${pageNum}`).classList.add('active');
    document.getElementById(`nav-btn-${pageNum}`).classList.add('active');
    localStorage.setItem('current_page', pageNum);
}

// 新增記賬處理函數 (支援選填說明與新分類)
function addTransaction(event) {
    event.preventDefault(); 
    
    const descInput = document.getElementById('desc');
    const amountInput = document.getElementById('amount');
    const categoryInput = document.getElementById('category');

    if (!amountInput || !categoryInput) return;

    const category = categoryInput.value;
    let desc = descInput.value.trim();
    if (desc === "") {
        desc = category; // 若未填說明，預設為類別名稱
    }

    const amount = parseFloat(amountInput.value);

    const transaction = { 
        id: Date.now(), 
        desc, 
        amount, 
        category 
    };
    
    transactions.push(transaction);
    saveToLocalStorage();
    updateUI();
    
    document.getElementById('expense-form').reset();
}

// 更新介面與重繪圓餅圖
function updateUI() {
    const listContainer = document.getElementById('transaction-list');
    const balanceEl = document.getElementById('total-balance');
    
    const countEl = document.getElementById('transaction-count');
    if (countEl) {
        countEl.innerText = `共 ${transactions.length} 筆`;
    }

    if (transactions.length === 0) {
        listContainer.innerHTML = `<p class="empty-text">目前尚無記賬資料</p>`;
        balanceEl.innerText = `$ 0`;
        if (myChart) myChart.destroy();
        return;
    }

    let total = 0;
    let html = '';
    
    // 初始化所有子分類的累計金額
    let categoryTotals = {
        '房租': 0, '水電': 0, '住房其他': 0,
        '食材': 0, '外食': 0, '點心': 0,
        '大眾運輸': 0, '打車': 0, '油錢': 0,
        '耐用品': 0, '消耗品': 0,
        '話費': 0, '訂閱': 0,
        '旅遊': 0, '社交': 0, '娛樂其他': 0,
        '課程': 0, '書籍': 0, '教育其他': 0,
        '保險': 0
    };

    transactions.forEach((t, index) => {
        if (!t.id) t.id = Date.now() + index;
    });

    transactions.slice().reverse().forEach(t => {
        total += t.amount;
        if (categoryTotals.hasOwnProperty(t.category)) {
            categoryTotals[t.category] += t.amount;
        } else {
            categoryTotals['住房其他'] += t.amount;
        }

        html += `
            <div class="transaction-item" style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #eee;">
                <div>
                    <span style="color: var(--text-main); font-weight: 500;">${t.desc}</span>
                    <span style="font-size: 0.7rem; color: var(--text-sub); display: block;">[${t.category}]</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span class="text-expense" style="font-weight: bold; color: var(--accent);">-$ ${t.amount}</span>
                    <button onclick="editTransaction(${t.id})" style="background: none; border: none; cursor: pointer; font-size: 0.85rem;" title="修改">✏️</button>
                    <button onclick="deleteTransaction(${t.id})" style="background: none; border: none; cursor: pointer; font-size: 0.85rem;" title="刪除">🗑️</button>
                </div>
            </div>
        `;
    });

    listContainer.innerHTML = html;
    balanceEl.innerText = `$ ${total}`;

    updateChart(categoryTotals);
}

// 刪除單筆明細
function deleteTransaction(id) {
    if (confirm('確定要刪除這筆支出嗎？')) {
        transactions = transactions.filter(t => t.id !== id);
        saveToLocalStorage();
        updateUI();
    }
}

// 修改單筆明細
function editTransaction(id) {
    const t = transactions.find(item => item.id === id);
    if (!t) return;

    const newDesc = prompt('修改項目說明：', t.desc);
    if (newDesc === null) return; 

    const newAmountStr = prompt('修改金額：', t.amount);
    if (newAmountStr === null) return;
    
    const newAmount = parseFloat(newAmountStr);
    if (isNaN(newAmount) || newAmount <= 0) {
        alert('請輸入有效的金額！');
        return;
    }

    t.desc = newDesc.trim() || t.category;
    t.amount = newAmount;
    
    saveToLocalStorage();
    updateUI();
}

// 重新整理按鈕對應功能
function resetAppData() {
    if (confirm('是否要重新整理並載入資料？')) {
        loadFromLocalStorage();
        updateUI();
    }
}

// 儲存至瀏覽器 LocalStorage
function saveToLocalStorage() {
    localStorage.setItem('my_transactions', JSON.stringify(transactions));
}

// 從瀏覽器 LocalStorage 讀取
function loadFromLocalStorage() {
    const saved = localStorage.getItem('my_transactions');
    if (saved) {
        try {
            transactions = JSON.parse(saved);
        } catch(e) {
            transactions = [];
        }
    }
}

// 繪製莫蘭迪色系圓餅圖
function updateChart(dataObj) {
    const canvasEl = document.getElementById('expenseChart');
    if (!canvasEl) return;
    
    const ctx = canvasEl.getContext('2d');
    
    const filteredLabels = [];
    const filteredData = [];
    
    for (let [key, value] of Object.entries(dataObj)) {
        if (value > 0) {
            filteredLabels.push(key);
            filteredData.push(value);
        }
    }

    if (myChart) {
        myChart.destroy();
    }

    if (filteredData.length === 0) return;

    const morandiColors = [
        '#8C9DAE', '#A37073', '#D4A373', '#738A75', 
        '#9B88A8', '#C29B88', '#7395AE', '#A0AAB2',
        '#B48A84', '#859071', '#D0B49F', '#78686E'
    ];

    myChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: filteredLabels,
            datasets: [{
                data: filteredData,
                backgroundColor: morandiColors.slice(0, filteredData.length),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        boxWidth: 10,
                        font: { size: 10 }
                    }
                }
            }
        }
    });
}
// 控制彈出式選單的開關 (請加在 script.js 的最下方)
function toggleMenu() {
    const modal = document.getElementById('nav-modal');
    if (modal) {
        modal.classList.toggle('active');
    }
}
