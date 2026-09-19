/* ==========================================
   記賬助手核心邏輯 (純支出記賬與分類圓餅圖)
   ========================================== */

let transactions = [];
let myChart = null;

// 網頁載入時，從 localStorage 讀取過去的記錄
window.onload = function() {
    const savedData = localStorage.getItem('transactions');
    if (savedData) {
        transactions = JSON.parse(savedData);
        updateUI();
    }
};

// 頁面切換函數
function switchPage(pageNum) {
    for (let i = 1; i <= 5; i++) {
        document.getElementById(`page-${i}`).classList.remove('active');
        document.getElementById(`nav-btn-${i}`).classList.remove('active');
    }
    document.getElementById(`page-${pageNum}`).classList.add('active');
    document.getElementById(`nav-btn-${pageNum}`).classList.add('active');
}

// 新增記賬處理函數 (純支出)
function addTransaction(event) {
    event.preventDefault(); // 防止網頁重新整理
    
    const descInput = document.getElementById('desc');
    const amountInput = document.getElementById('amount');
    const categoryInput = document.getElementById('category');
   
    if (!amountInput || !categoryInput) return;

    // 如果沒填說明文字，就直接使用類別名稱作為預設說明
    const category = categoryInput.value;
    let desc = descInput.value.trim();
    if (desc === "") {
        desc = category; 
    }

    const amount = parseFloat(amountInput.value);

    const transaction = { 
        id: Date.now(), 
        desc, 
        amount, 
        category 
    };
    
    transactions.push(transaction);
    updateUI();

   transactions.push(transaction);
   localStorage.setItem('transactions', JSON.stringify(transactions)); // 👈 存入瀏覽器
   updateUI();
    
    // 清空表單
    document.getElementById('expense-form').reset();
}

// 更新介面與重繪圓餅圖
function updateUI() {
    const listContainer = document.getElementById('transaction-list');
    const balanceEl = document.getElementById('total-balance');
    
    // 更新筆數顯示
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

   
    // 初始化所有新分類的累計金額
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
    document.getElementById('transaction-count').innerText = `共 ${transactions.length} 筆`;

    transactions.slice().reverse().forEach(t => {
        total += t.amount;
        // 若該分類存在則累加，防呆避免未定義錯誤
        if (categoryTotals.hasOwnProperty(t.category)) {
            categoryTotals[t.category] += t.amount;
        } else {
            categoryTotals['住房其他'] += t.amount; // 預設歸類
        }

        html += `
            <div class="transaction-item">
                <div>
                    <span style="color: var(--text-main); font-weight: 500;">${t.desc}</span>
                    <span style="font-size: 0.7rem; color: var(--text-sub); display: block;">[${t.category}]</span>
                </div>
                <span class="text-expense">-$ ${t.amount}</span>
            </div>
        `;
    });

    listContainer.innerHTML = html;
    balanceEl.innerText = `$ ${total}`;

    updateChart(categoryTotals);
}

// 繪製莫蘭迪色系圓餅圖 (支援多分類)
function updateChart(dataObj) {
    const canvasEl = document.getElementById('expenseChart');
    if (!canvasEl) return;
    
    const ctx = canvasEl.getContext('2d');
    
    // 過濾掉金額為 0 的分類，讓圓餅圖乾淨不擁擠
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

    // 如果全部都是 0 就不畫圖
    if (filteredData.length === 0) return;

    // 莫蘭迪色系色票庫
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
