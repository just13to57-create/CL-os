/* ==========================================
   記賬助手完整核心邏輯 (分類圓餅圖 + 修改/刪除 + LocalStorage)
   ========================================== */

let transactions = [];
let myChart = null;

// 網頁載入時自動從 localStorage 讀取資料並初始化明細為收合狀態
window.onload = function() {
    loadFromLocalStorage();
    const savedPage = localStorage.getItem('current_page');
    if (savedPage) {
        switchPage(parseInt(savedPage));
    } else {
        switchPage(1);
    }
   
    updateUI();

    // 確保一進入頁面時，支出明細預設是「收合」狀態，文字顯示「展開」
    const listContainer = document.getElementById('transaction-list');
    const toggleText = document.getElementById('toggle-text');
    if (listContainer) {
        listContainer.classList.add('collapsed');
    }
    if (toggleText) {
        toggleText.innerText = '展開';
    }
};

// 頁面切換函數
function switchPage(pageNum) {
    for (let i = 1; i <= 5; i++) {
        const pageEl = document.getElementById(`page-${i}`);
        if (pageEl) {
            pageEl.classList.remove('active');
        }
    }
    const targetPage = document.getElementById(`page-${pageNum}`);
    if (targetPage) {
        targetPage.classList.add('active');
    }
    localStorage.setItem('current_page', pageNum);
}

// 【已修正】控制右上角彈出式選單的開關 (對應您網頁右上角的選單按鈕)
function toggleMenu() {
    const modal = document.getElementById('nav-modal');
    if (modal) {
        modal.classList.toggle('active');
    }
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

   // 溫柔大地色系與低彩度莫蘭迪色標
    const categoryColors = {
        '房租': '#A49B90', '水電': '#A49B90', '住房其他': '#A49B90', // 溫潤灰褐
        '食材': '#C48B83', '外食': '#C48B83', '點心': '#C48B83', // 乾燥玫瑰/暖土紅
        '大眾運輸': '#D4A373', '打車': '#D4A373', '油錢': '#D4A373', // 柔和焦糖/沙色
        '耐用品': '#8A9A86', '消耗品': '#8A9A86', // 沉穩苔綠
        '話費': '#B098A4', '訂閱': '#B098A4', // 柔霧藕紫
        '旅遊': '#C29B7F', '社交': '#C29B7F', '娛樂其他': '#C29B7F', // 暖杏茶色
        '課程': '#859BA8', '書籍': '#859BA8', '教育其他': '#859BA8', // 霧藍灰
        '保險': '#9E8D85'  // 暖灰咖
    };

    transactions.slice().reverse().forEach(t => {
        total += t.amount;
        if (categoryTotals.hasOwnProperty(t.category)) {
            categoryTotals[t.category] += t.amount;
        } else {
            categoryTotals['住房其他'] += t.amount;
        }

        // 取得該分類對應的色標，若無則預設灰色
        const dotColor = categoryColors[t.category] || '#A0AAB2';

        html += `
            <div class="transaction-item" style="display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid #F0ECE6;">
                <div>
                    <span style="color: var(--text-main); font-weight: 500; font-size: 0.8rem;">${t.desc}</span>
                    <span class="category-tag" style="display: inline-flex; align-items: center; gap: 4px; font-size: 0.7rem; color: var(--text-sub); display: block;">
                        <span class="category-dot" style="width: 6px; height: 6px; border-radius: 50%; display: inline-block; background-color: ${dotColor};"></span>
                        ${t.category}
                    </span>
                </div>
                <div style="display: flex; align-items: center; gap: 6px;">
                    <span class="text-expense" style="font-weight: bold; color: var(--accent);">-$ ${t.amount}</span>
                    <button onclick="editTransaction(${t.id})" style="background: none; border: none; cursor: pointer; font-size: 0.8rem;" title="修改">✏️</button>
                    <button onclick="deleteTransaction(${t.id})" style="background: none; border: none; cursor: pointer; font-size: 0.8rem;" title="刪除">🗑️</button>
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

// 控制支出明細區塊的展開與折疊（文字切換：展開 ⇄ 收合）
function toggleTransactionBox() {
    const listContainer = document.getElementById('transaction-list');
    const toggleText = document.getElementById('toggle-text');
    const header = document.querySelector('.transaction-header');
    
    if (listContainer) {
        listContainer.classList.toggle('collapsed');
        const isCollapsed = listContainer.classList.contains('collapsed');
        if (toggleText) {
            toggleText.innerText = isCollapsed ? '展開' : '收合';
        }
    }
    if (header) {
        header.classList.toggle('expanded');
    }
}
