// 全域變數
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let myChart = null;

// 初始化執行
document.addEventListener('DOMContentLoaded', () => {
    updateUI();
});

// 切換頁面函數
function switchPage(pageNum) {
    // 隱藏所有頁面
    for (let i = 1; i <= 5; i++) {
        const page = document.getElementById(`page-${i}`);
        if (page) page.classList.remove('active');
    }
    // 顯示目標頁面
    const targetPage = document.getElementById(`page-${pageNum}`);
    if (targetPage) {
        targetPage.classList.add('active');
        // 如果切換回記賬頁面，重新調整圖表大小
        if (pageNum === 2 && myChart) {
            setTimeout(() => myChart.resize(), 50);
        }
    }
}

// 切換右上角導航選單
function toggleMenu() {
    const modal = document.getElementById('nav-modal');
    if (modal) {
        modal.classList.toggle('active');
    }
}

// 支出明細抽屜收合與展開
function toggleTransactionBox() {
    const box = document.getElementById('transaction-list');
    const toggleText = document.getElementById('toggle-text');
    if (box) {
        box.classList.toggle('collapsed');
        if (box.classList.contains('collapsed')) {
            toggleText.innerText = '展開';
        } else {
            toggleText.innerText = '收起';
        }
        // 畫面展開/收合時讓圖表動態適應高度
        if (myChart) {
            setTimeout(() => myChart.resize(), 300);
        }
    }
}

// 新增支出紀錄
function addTransaction(event) {
    event.preventDefault();
    
    const descInput = document.getElementById('desc');
    const categorySelect = document.getElementById('category');
    const amountInput = document.getElementById('amount');

    const desc = descInput.value.trim() || categorySelect.value;
    const category = categorySelect.value;
    const amount = parseFloat(amountInput.value);

    if (isNaN(amount) || amount <= 0) return;

    const newTransaction = {
        id: Date.now(),
        desc: desc,
        category: category,
        amount: amount
    };

    transactions.push(newTransaction);
    saveAndRefresh();

    // 清空表單
    descInput.value = '';
    amountInput.value = '';
    amountInput.blur();
}

// 刪除紀錄
function deleteTransaction(id) {
    transactions = transactions.filter(t => t.id !== id);
    saveAndRefresh();
}

// 修改紀錄
function editTransaction(id) {
    const t = transactions.find(item => item.id === id);
    if (!t) return;

    const newDesc = prompt("修改項目說明：", t.desc);
    if (newDesc === null) return;

    const newAmountStr = prompt("修改金額：", t.amount);
    if (newAmountStr === null) return;

    const newAmount = parseFloat(newAmountStr);
    if (isNaN(newAmount) || newAmount <= 0) {
        alert("請輸入有效的金額！");
        return;
    }

    t.desc = newDesc.trim() || t.category;
    t.amount = newAmount;
    saveAndRefresh();
}

// 儲存並重新整理介面
function saveAndRefresh() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
    updateUI();
}

// 重置所有資料
function resetAppData() {
    if (confirm("確定要清除所有記賬資料嗎？")) {
        transactions = [];
        localStorage.removeItem('transactions');
        updateUI();
    }
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
        if (myChart) {
            myChart.destroy();
            myChart = null;
        }
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

    // 溫柔大地色系分類色標
    const categoryColors = {
        '房租': '#A49B90', '水電': '#A49B90', '住房其他': '#A49B90', 
        '食材': '#C48B83', '外食': '#C48B83', '點心': '#C48B83', 
        '大眾運輸': '#D4A373', '打車': '#D4A373', '油錢': '#D4A373', 
        '耐用品': '#8A9A86', '消耗品': '#8A9A86', 
        '話費': '#B098A4', '訂閱': '#B098A4', 
        '旅遊': '#C29B7F', '社交': '#C29B7F', '娛樂其他': '#C29B7F', 
        '課程': '#859BA8', '書籍': '#859BA8', '教育其他': '#859BA8', 
        '保險': '#9E8D85'  
    };

    transactions.slice().reverse().forEach(t => {
        total += t.amount;
        if (categoryTotals.hasOwnProperty(t.category)) {
            categoryTotals[t.category] += t.amount;
        } else {
            categoryTotals['住房其他'] += t.amount;
        }

        const dotColor = categoryColors[t.category] || '#A0AAB2';

        html += `
            <div class="transaction-item">
                <div>
                    <span style="color: var(--text-main); font-weight: 500; font-size: 0.8rem;">${t.desc}</span>
                    <span class="category-tag">
                        <span class="category-dot" style="background-color: ${dotColor};"></span>
                        ${t.category}
                    </span>
                </div>
                <div style="display: flex; align-items: center; gap: 6px;">
                    <span class="text-expense" style="font-weight: bold;">-$ ${t.amount}</span>
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

// 繪製或更新圓餅圖 (只顯示有花費的分類)
function updateChart(categoryTotals) {
    const ctx = document.getElementById('expenseChart').getContext('2d');
    
    // 過濾掉金額為 0 的分類
    const filteredLabels = [];
    const filteredData = [];
    const colorMap = {
        '房租': '#A49B90', '水電': '#B5ADB0', '住房其他': '#C2BCB6',
        '食材': '#C48B83', '外食': '#D4A39B', '點心': '#E0C1BC',
        '大眾運輸': '#D4A373', '打車': '#E0BA9B', '油錢': '#EBD2BC',
        '耐用品': '#8A9A86', '消耗品': '#A8B8A4',
        '話費': '#B098A4', '訂閱': '#C8B4C0',
        '旅遊': '#C29B7F', '社交': '#D4B39B', '娛樂其他': '#E5D0C2',
        '課程': '#859BA8', '書籍': '#A4B4C0', '教育其他': '#C4D0D8',
        '保險': '#9E8D85'
    };
    const backgroundColors = [];

    for (let [key, value] of Object.entries(categoryTotals)) {
        if (value > 0) {
            filteredLabels.push(key);
            filteredData.push(value);
            backgroundColors.push(colorMap[key] || '#B08D81');
        }
    }

    if (myChart) {
        myChart.destroy();
    }

    if (filteredData.length === 0) {
        
        myChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['尚無支出'],
                datasets: [{ data: [1], backgroundColor: ['#EFECE6'] }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                radius: '70%',      // 整個圓的直徑縮小到 70%（數字越小圓越小）
                cutout: '65%',      // 中間挖空的比例（讓環形保持好看的粗細）
                plugins: {
                   legend: {
                       position: 'right',
                       labels: {
                          boxWidth: 10,   // 圖例前方的小色塊寬度
                          font: { size: 10 } // 圖例文字大小
                    }
                }
            },
        }
        });
        return;
    }

    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: filteredLabels,
            datasets: [{
                data: filteredData,
                backgroundColor: backgroundColors,
                borderWidth: 1,
                borderColor: '#FFFFFF'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            radius: '85%',
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        boxWidth: 10,
                        font: { size: 10 },
                        color: '#5C534B'
                    }
                }
            },
            cutout: '60%'
        }
    });
}
