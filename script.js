// 儲存記帳資料與 Chart 實例
let records = JSON.parse(localStorage.getItem('expenses')) || [];
let expenseChart = null;

// 莫蘭迪風格色調盤
const morandiColors = [
    '#90A4AE', '#A1887F', '#81C784', '#E57373', '#BA68C8',
    '#FFB74D', '#4DB6AC', '#64B5F6', '#D4E157', '#A1887F'
];

document.addEventListener('DOMContentLoaded', () => {
    initChart();
    renderPage();

    // 表單提交事件處理
    document.getElementById('expenseForm').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const amount = parseFloat(document.getElementById('amount').value);
        const category = document.getElementById('category').value;
        const note = document.getElementById('note').value;

        if (isNaN(amount) || amount <= 0) return;

        const newRecord = {
            id: Date.now(),
            amount: amount,
            category: category,
            note: note,
            date: new Date().toLocaleDateString('zh-TW')
        };

        records.push(newRecord);
        saveRecords();
        renderPage();
        
        // 重置表單
        e.target.reset();
    });
});

// 初始化 Chart.js 圓餅圖
function initChart() {
    const ctx = document.getElementById('expenseChart').getContext('2d');
    expenseChart = new Chart(ctx, {
        type: 'pie', // 設定圖表類型為圓餅圖
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: morandiColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: { size: 12 }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return ` ${context.label}: $${context.raw.toFixed(2)}`;
                        }
                    }
                }
            }
        }
    });
}

// 更新圓餅圖數據
function updateChart() {
    if (!expenseChart) return;

    // 依類別統計總金額
    const categoryTotals = {};
    records.forEach(r => {
        categoryTotals[r.category] = (categoryTotals[r.category] || 0) + r.amount;
    });

    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);

    // 載入新資料並重繪
    expenseChart.data.labels = labels;
    expenseChart.data.datasets[0].data = data;
    expenseChart.update();
}

// 儲存至 LocalStorage
function saveRecords() {
    localStorage.setItem('expenses', JSON.stringify(records));
}

// 畫面同步繪製
function renderPage() {
    updateChart();
    renderTotal();
    renderRecordList();
    updatePage2Stats();
}

// 計算總支出
function renderTotal() {
    const total = records.reduce((sum, r) => sum + r.amount, 0);
    document.getElementById('totalAmount').innerText = total.toFixed(2);
}

// 渲染歷史記錄清單
function renderRecordList() {
    const listContainer = document.getElementById('recordList');
    if (!listContainer) return;
    
    listContainer.innerHTML = records.map(r => `
        <div class="record-item" style="display:flex; justify-content:space-between; margin: 8px 0; padding: 6px 0; border-bottom: 1px solid #eee;">
            <span>${r.category} ${r.note ? `(${r.note})` : ''}</span>
            <span style="font-weight: bold;">$${r.amount.toFixed(2)}</span>
        </div>
    `).join('');
}

// 切換頁面選單邏輯
function toggleDropdown(e) {
    e.stopPropagation();
    document.getElementById('dropdownContainer').classList.toggle('active');
}

function switchPage(pageId, btn) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.dropdown-item').forEach(i => i.classList.remove('active'));
    
    document.getElementById(pageId).classList.add('active');
    btn.classList.add('active');
    document.getElementById('dropdownContainer').classList.remove('active');
}

function toggleRecordList() {
    const list = document.getElementById('recordList');
    list.style.display = list.style.display === 'block' ? 'none' : 'block';
}

function updatePage2Stats() {
    document.getElementById('totalCount').innerText = `${records.length} 筆`;
    const max = records.length ? Math.max(...records.map(r => r.amount)) : 0;
    const avg = records.length ? (records.reduce((a, b) => a + b.amount, 0) / records.length) : 0;
    
    document.getElementById('maxAmount').innerText = `$${max.toFixed(2)}`;
    document.getElementById('avgAmount').innerText = `$${avg.toFixed(2)}`;
}

function clearAllData() {
    if (confirm('確定要清空所有資料嗎？')) {
        records = [];
        saveRecords();
        renderPage();
    }
}
