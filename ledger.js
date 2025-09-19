const body = document.body;
const inputform = document.getElementById("inputform");
const table = document.getElementById("outputTable");
const chartsContainer = document.getElementById("chartsContainer");
const chartsButton = document.getElementById("charts");
const currentPageNameSpan = document.getElementById("current-page-name");
const deletePageBtn = document.getElementById("delete-page-btn");

let allData = JSON.parse(localStorage.getItem("allData")) || {};
let currentPage = localStorage.getItem("currentPage") || null;
let chartsVisible = false;
let pieChart, lineChart, histogram, barChart;

if (!currentPage || !allData[currentPage]) {
    alert("No ledger selected. Redirecting to homepage.");
    window.location.href = "index.html";
}

currentPageNameSpan.textContent = currentPage;

const saveData = () => {
    localStorage.setItem("allData", JSON.stringify(allData));
    localStorage.setItem("currentPage", currentPage);
};

const deletePage = () => {
    if (Object.keys(allData).length > 0) {
        if (confirm(`Are you sure you want to delete the "${currentPage}" ledger? This action cannot be undone.`)) {
            delete allData[currentPage];
            localStorage.setItem("allData", JSON.stringify(allData));
            window.location.href = "index.html";
        }
    }
};

const deleteTransaction = (index) => {
    allData[currentPage].splice(index, 1);
    saveData();
    showtrans();
    if (chartsVisible) renderCharts();
};

const showtrans = () => {
    while (table.rows.length > 1) {
        table.deleteRow(1);
    }

    const transactions = allData[currentPage] || [];
    transactions.forEach((trans, index) => {
        const row = table.insertRow();
        row.insertCell(0).textContent = index + 1;
        
        const amountCell = row.insertCell(1);
        amountCell.textContent = trans.amount;
        amountCell.style.color = trans.type === "income" ? "green" : "red";
        amountCell.style.fontWeight = "bold";

        row.insertCell(2).textContent = trans.desc;
        row.insertCell(3).textContent = trans.type;
        row.insertCell(4).textContent = trans.date;
        row.insertCell(5).textContent = trans.time;

        const deleteCell = row.insertCell(6);
        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.onclick = () => deleteTransaction(index);
        deleteButton.style.background = "#f44336";
        deleteButton.style.color = "white";
        deleteButton.style.border = "none";
        deleteButton.style.padding = "5px 10px";
        deleteButton.style.cursor = "pointer";
        deleteCell.appendChild(deleteButton);
    });
};

const addtrans = () => {
    let amount = document.getElementById("amount").value;
    let desc = document.getElementById("desc").value;
    let type = document.getElementById("transtype").value;
    let now = new Date();
    let date = now.toLocaleDateString();
    let time = now.toLocaleTimeString();

    try {
        amount = parseFloat(amount);
        if (isNaN(amount) || amount <= 0) {
            alert("Please enter a valid positive amount");
            return;
        }
    } catch (error) {
        alert("Please enter a valid amount");
        return;
    }

    let transdetail = { amount, desc, type, date, time };
    allData[currentPage].push(transdetail);
    saveData();
    showtrans();
    if (chartsVisible) renderCharts();
};

const renderCharts = () => {
    if (pieChart) pieChart.destroy();
    if (lineChart) lineChart.destroy();
    if (histogram) histogram.destroy();
    if (barChart) barChart.destroy();

    const transactions = allData[currentPage] || [];

    const incomeTotal = transactions.reduce((sum, t) => t.type === "income" ? sum + t.amount : sum, 0);
    const expenseTotal = transactions.reduce((sum, t) => t.type === "expense" ? sum + t.amount : sum, 0);
    pieChart = new Chart(document.getElementById("pieChart"), {
        type: 'pie',
        data: {
            labels: ['Income', 'Expense'],
            datasets: [{ data: [incomeTotal, expenseTotal], backgroundColor: ['#4CAF50', '#f44336'] }]
        },
        options: { responsive: true, plugins: { legend: { position: 'top' } } }
    });

    const sortedTransactions = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
    const balanceData = [];
    let balance = 0;
    const dates = [];
    sortedTransactions.forEach(t => {
        balance += t.type === "income" ? t.amount : -t.amount;
        balanceData.push(balance);
        dates.push(t.date);
    });
    lineChart = new Chart(document.getElementById("lineChart"), {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{ label: 'Balance', data: balanceData, borderColor: '#4CAF50', fill: false }]
        },
        options: {
            responsive: true,
            scales: { x: { title: { display: true, text: 'Date' } }, y: { title: { display: true, text: 'Balance' } } }
        }
    });

    const incomeAmounts = transactions.filter(t => t.type === "income").map(t => t.amount);
    const expenseAmounts = transactions.filter(t => t.type === "expense").map(t => t.amount);
    const maxAmount = Math.max(...transactions.map(t => t.amount), 100);
    const bins = 10;
    const binSize = maxAmount / bins;
    const incomeBins = Array(bins).fill(0);
    const expenseBins = Array(bins).fill(0);
    incomeAmounts.forEach(amount => {
        const binIndex = Math.min(Math.floor(amount / binSize), bins - 1);
        incomeBins[binIndex]++;
    });
    expenseAmounts.forEach(amount => {
        const binIndex = Math.min(Math.floor(amount / binSize), bins - 1);
        expenseBins[binIndex]++;
    });
    const binLabels = Array.from({ length: bins }, (_, i) => `${(i * binSize).toFixed(0)}-${((i + 1) * binSize).toFixed(0)}`);
    histogram = new Chart(document.getElementById("histogram"), {
        type: 'bar',
        data: {
            labels: binLabels,
            datasets: [
                { label: 'Income', data: incomeBins, backgroundColor: '#4CAF50' },
                { label: 'Expense', data: expenseBins, backgroundColor: '#f44336' }
            ]
        },
        options: {
            responsive: true,
            scales: { x: { title: { display: true, text: 'Amount Range' } }, y: { title: { display: true, text: 'Frequency' } } },
            plugins: { legend: { position: 'top' } }
        }
    });

    const dailyData = {};
    transactions.forEach(t => {
        if (!dailyData[t.date]) dailyData[t.date] = { income: 0, expense: 0 };
        dailyData[t.date][t.type] += t.amount;
    });
    const dailyDates = Object.keys(dailyData).sort((a, b) => new Date(a) - new Date(b));
    const dailyIncome = dailyDates.map(date => dailyData[date].income);
    const dailyExpense = dailyDates.map(date => dailyData[date].expense);
    barChart = new Chart(document.getElementById("barChart"), {
        type: 'bar',
        data: {
            labels: dailyDates,
            datasets: [
                { label: 'Income', data: dailyIncome, backgroundColor: '#4CAF50' },
                { label: 'Expense', data: dailyExpense, backgroundColor: '#f44336' }
            ]
        },
        options: {
            responsive: true,
            scales: { x: { title: { display: true, text: 'Date' } }, y: { title: { display: true, text: 'Amount' } } },
            plugins: { legend: { position: 'top' } }
        }
    });
};

inputform.addEventListener("submit", (e) => {
    e.preventDefault();
    addtrans();
    inputform.reset();
});

document.getElementById("summary").addEventListener("click", () => {
    const transactions = allData[currentPage] || [];
    let income = 0;
    let expense = 0;
    transactions.forEach(item => {
        if (item.type === "income") income += item.amount;
        if (item.type === "expense") expense += item.amount;
    });
    let balance = income - expense;
    alert(`Ledger: ${currentPage}\n\nTotal Income: ${income}\nTotal Expenses: ${expense}\nRemaining Balance: ${balance}`);
});

chartsButton.addEventListener("click", () => {
    chartsVisible = !chartsVisible;
    chartsContainer.style.display = chartsVisible ? "block" : "none";
    chartsButton.textContent = chartsVisible ? "HIDE CHARTS" : "VIEW CHARTS";
    if (chartsVisible) renderCharts();
});

deletePageBtn.addEventListener("click", deletePage);

// Initial load
showtrans();