/* ==========================================
   記賬助手核心邏輯 (純支出記賬與分類圓餅圖)
   ========================================== */

let transactions = [];
let myChart = null;

// 頁面切換函數
function switchPage(pageNum) {
    for (let i = 1; i <= 5; i++) {
        document.getElementById(`page-${i}`).classList.remove('active');
        document.getElementById(`nav-btn-${i}`).classList.remove('active');
    }
    document.getElementById(`page-${pageNum}`).classList.add('active');
    document.getElementById(`nav-btn-${pageNum}`).classList.add('active');
}

// 新增記賬處理函數 (統一為支出)
function addTransaction(event) {
    event.preventDefault();
    const desc = document.getElementById('desc').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const category = document.getElementById('category').value;

    const transaction = { 
        id: Date.now(), 
        desc, 
        amount, 
        category 
    };
    
    transactions.push(transaction);
    updateUI();
    document.getElementById('expense-form').reset();
}

// 更新介面與重繪圓餅圖
function updateUI() {
    const listContainer = document.getElementById('transaction-list');
    const balanceEl = document.getElementById('total-balance');
    
    if (transactions.length === 0) {
        listContainer.innerHTML = `<p class="empty-text">目前尚無記賬資料</p>`;
        balanceEl.innerText = `$ 0`;
        if (myChart) myChart.destroy();
        return;
    }

    let total = 0;
    let html = '';
    let categoryTotals = { '餐飲': 0, '交通': 0, '娛樂': 0, '其他': 0 };

    transactions.slice().reverse().forEach(t => {
        total += t.amount;
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;

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

// 繪製莫蘭迪色系圓餅圖
function updateChart(dataObj) {
    const ctx = document.getElementById('expenseChart').getContext('2d');
    const labels = Object.keys(dataObj);
    const data = Object.values(dataObj);

    if (myChart) {
        myChart.destroy();
    }

    myChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    '#8C9DAE', // 莫蘭迪灰藍
                    '#A37073', // 莫蘭迪玫瑰紅
                    '#D4A373', // 莫蘭迪暖黃
                    '#738A75'  // 莫蘭迪草綠
                ],
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
                        boxWidth: 12,
                        font: { size: 11 }
                    }
                }
            }
        }
    });
}
