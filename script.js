/* ==========================================
   記賬助手核心邏輯 (頁面切換與記賬功能)
   ========================================== */

let transactions = [];

// 頁面切換函數 (點擊底部或首頁卡片時觸發)
function switchPage(pageNum) {
    for (let i = 1; i <= 5; i++) {
        document.getElementById(`page-${i}`).classList.remove('active');
        document.getElementById(`nav-btn-${i}`).classList.remove('active');
    }
    document.getElementById(`page-${pageNum}`).classList.add('active');
    document.getElementById(`nav-btn-${pageNum}`).classList.add('active');
}

// 新增記賬處理函數
function addTransaction(event) {
    event.preventDefault();
    const desc = document.getElementById('desc').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const type = document.getElementById('type').value;

    const transaction = { 
        id: Date.now(), 
        desc, 
        amount, 
        type 
    };
    
    transactions.push(transaction);
    updateUI();
    document.getElementById('expense-form').reset();
}

// 更新介面顯示與計算總結餘
function updateUI() {
    const listContainer = document.getElementById('transaction-list');
    const balanceEl = document.getElementById('total-balance');
    
    if (transactions.length === 0) {
        listContainer.innerHTML = `<p class="empty-text">目前尚無記賬資料</p>`;
        balanceEl.innerText = `$ 0`;
        return;
    }

    let total = 0;
    let html = '';

    transactions.slice().reverse().forEach(t => {
        const isIncome = t.type === 'income';
        const sign = isIncome ? '+' : '-';
        const cssClass = isIncome ? 'text-income' : 'text-expense';
        total += isIncome ? t.amount : -t.amount;

        html += `
            <div class="transaction-item">
                <span style="color: var(--text-main); font-weight: 500;">${t.desc}</span>
                <span class="${cssClass}">${sign}$ ${t.amount}</span>
            </div>
        `;
    });

    listContainer.innerHTML = html;
    balanceEl.innerText = `$ ${total}`;
}
