let records = JSON.parse(localStorage.getItem('expenses')) || [];

const form = document.getElementById('expenseForm');
const recordList = document.getElementById('recordList');
const totalAmountEl = document.getElementById('totalAmount');
const toggleListBtn = document.getElementById('toggleListBtn');

// 初始化 Chart.js 圓餅圖
const ctx = document.getElementById('expenseChart').getContext('2d');
let expenseChart = new Chart(ctx, {
    type: 'pie',
    data: {
        labels: [],
        datasets: [{
            data: [],
            backgroundColor: [
                '#8E9AAF', '#CBC0D3', '#EFD3D7', '#FEEAFA', 
                '#DEE2E6', '#A3B18A', '#588157', '#B5838D', 
                '#E0AFA0', '#D4A373', '#CCD5AE'
            ],
            borderWidth: 1.5,
            borderColor: '#FAFAFA'
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    color: '#6C6B6B',
                    font: { size: 12 },
                    padding: 12
                }
            }
        }
    }
});

// 控制下拉選單展開/收合
function toggleDropdown(e) {
    e.stopPropagation();
    const container = document.getElementById('dropdownContainer');
    container.classList.toggle('active');
}

// 點擊頁面其他地方時，自動關閉下拉選單
window.addEventListener('click', () => {
    const container = document.getElementById('dropdownContainer');
    if (container.classList.contains('active')) {
        container.classList.remove('active');
    }
});

// 頁面切換邏輯
function switchPage(pageId, btn) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.querySelectorAll('.dropdown-item').forEach(b => b.classList.remove('active'));

    document.getElementById(pageId).classList.add('active');
    btn.classList.add('active');

    const pageTitle = document.getElementById('pageTitle');
    if (pageId === 'page1') {
        pageTitle.textContent = '簡易記帳';
    } else if (pageId === 'page2') {
        pageTitle.textContent = '統計分析';
        updatePage2Stats();
    } else if (pageId === 'page3') {
        pageTitle.textContent = '儲蓄目標';
        loadSavingsData();
    }

    // 切換頁面後自動收合選單
    document.getElementById('dropdownContainer').classList.remove('active');
}

// 更新第二頁統計數據
function updatePage2Stats() {
    const count = records.length;
    let max = 0;
    let total = 0;

    records.forEach(r => {
        const amt = parseFloat(r.amount) || 0;
        total += amt;
        if (amt > max) max = amt;
    });

    const avg = count > 0 ? (total / count) : 0;

    document.getElementById('totalCount').textContent = `${count} 筆`;
    document.getElementById('maxAmount').textContent = `$${max.toFixed(2)}`;
    document.getElementById('avgAmount').textContent = `$${avg.toFixed(2)}`;
}

// 更新圖表資料
function updateChart() {
    const categoryTotals = {};
    records.forEach(record => {
        const cat = record.category;
        const amt = parseFloat(record.amount) || 0;
        categoryTotals[cat] = (categoryTotals[cat] || 0) + amt;
    });

    expenseChart.data.labels = Object.keys(categoryTotals);
    expenseChart.data.datasets[0].data = Object.values(categoryTotals).map(v => v.toFixed(2));
    expenseChart.update();
}

// 更新 UI 與 LocalStorage
function updateUI() {
    recordList.innerHTML = '';
    let total = 0;

    records.forEach((record, index) => {
        const amt = parseFloat(record.amount) || 0;
        total += amt;

        const item = document.createElement('div');
        item.className = 'record-item';
        const recordDate = record.date ? record.date : '未知時間';

        item.innerHTML = `
            <div class="record-info">
                <div class="record-main">
                    <span class="category-badge">${record.category}</span>
                    <span>${record.note ? record.note : record.category}</span>
                </div>
                <div class="record-date">${recordDate}</div>
            </div>
            <div>
                <strong>$${amt.toFixed(2)}</strong>
                <button class="delete-btn" onclick="deleteRecord(${index})">✕</button>
            </div>
        `;
        recordList.appendChild(item);
    });

    totalAmountEl.textContent = total.toFixed(2);
    localStorage.setItem('expenses', JSON.stringify(records));
    
    updateChart();
}

// 切換顯示/隱藏詳細記錄
function toggleRecordList() {
    const isHidden = recordList.style.display === '' || recordList.style.display === 'none';
    if (isHidden) {
        recordList.style.display = 'block';
        toggleListBtn.textContent = '▲ 收合消費明細';
    } else {
        recordList.style.display = 'none';
        toggleListBtn.textContent = '📋 查看消費明細';
    }
}

// 格式化當前日期時間
function getCurrentFormattedDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}`;
}

// 表單提交事件
form.addEventListener('submit', (e) => {
    e.preventDefault();

    const rawAmount = parseFloat(document.getElementById('amount').value);
    const amount = rawAmount ? rawAmount.toFixed(2) : '0.00';
    const category = document.getElementById('category').value;
    const note = document.getElementById('note').value;
    const currentDate = getCurrentFormattedDate();

    const newRecord = {
        amount: amount,
        category: category,
        note: note,
        date: currentDate
    };

    records.unshift(newRecord);
    updateUI();

    form.reset();
});

// 刪除紀錄
function deleteRecord(index) {
    records.splice(index, 1);
    updateUI();
}

// 清空所有資料功能
function clearAllData() {
    if (confirm('確定要清空所有記帳記錄嗎？此動作無法復原喔！')) {
        records = [];
        updateUI();
        updatePage2Stats();
    }
}

// 儲存儲蓄資料
function saveSavingsData() {
    const goal = parseFloat(document.getElementById('savingsGoalInput').value) || 0;
    const current = parseFloat(document.getElementById('savingsCurrentInput').value) || 0;

    const savingsData = { goal, current };
    localStorage.setItem('savingsData', JSON.stringify(savingsData));

    updateSavingsUI(goal, current);
    alert('儲蓄目標已成功更新！');
}

// 載入並讀取儲蓄資料
function loadSavingsData() {
    const saved = JSON.parse(localStorage.getItem('savingsData')) || { goal: 0, current: 0 };
    
    document.getElementById('savingsGoalInput').value = saved.goal || '';
    document.getElementById('savingsCurrentInput').value = saved.current || '';

    updateSavingsUI(saved.goal, saved.current);
}

// 更新儲蓄進度條與文字 UI
function updateSavingsUI(goal, current) {
    let percent = 0;
    if (goal > 0) {
        percent = Math.min((current / goal) * 100, 100);
    }

    document.getElementById('savingsPercent').textContent = `${percent.toFixed(1)}%`;
    document.getElementById('progressBar').style.width = `${percent}%`;
    document.getElementById('currentAmountText').textContent = current.toFixed(2);
    document.getElementById('goalAmountText').textContent = goal.toFixed(2);
}

// 初次載入 UI
updateUI();
