document.addEventListener("DOMContentLoaded", () => {
    const ledgerSelect = document.getElementById("ledger-select");
    const openLedgerBtn = document.getElementById("open-ledger-btn");
    const newLedgerName = document.getElementById("new-ledger-name");
    const createLedgerBtn = document.getElementById("create-ledger-btn");

    let allData = JSON.parse(localStorage.getItem("allData")) || {};

    const populateLedgerSelector = () => {
        ledgerSelect.innerHTML = "";
        const ledgerNames = Object.keys(allData);
        if (ledgerNames.length === 0) {
            const option = document.createElement("option");
            option.textContent = "No ledgers available";
            option.disabled = true;
            ledgerSelect.appendChild(option);
            openLedgerBtn.disabled = true;
        } else {
            ledgerNames.forEach(name => {
                const option = document.createElement("option");
                option.value = name;
                option.textContent = name;
                ledgerSelect.appendChild(option);
            });
            openLedgerBtn.disabled = false;
        }
    };

    openLedgerBtn.addEventListener("click", () => {
        const selectedLedger = ledgerSelect.value;
        if (selectedLedger) {
            // This is the corrected line
            localStorage.setItem("currentPage", selectedLedger);
            window.location.href = "ledger.html";
        }
    });

    createLedgerBtn.addEventListener("click", () => {
        const pageName = newLedgerName.value.trim();
        if (pageName && !allData[pageName]) {
            allData[pageName] = [];
            localStorage.setItem("allData", JSON.stringify(allData));
            localStorage.setItem("currentPage", pageName);
            window.location.href = "ledger.html";
        } else if (allData[pageName]) {
            alert("Ledger name already exists.");
        } else {
            alert("Please enter a valid ledger name.");
        }
    });

    populateLedgerSelector();

    const cards = document.querySelectorAll('.card');

    cards.forEach(card => {
        card.addEventListener('mousemove', e => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Set variables for the glow effect
            card.style.setProperty('--mouseX', `${x}px`);
            card.style.setProperty('--mouseY', `${y}px`);

            // Calculate and set variables for the tilt effect
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = (y - centerY) / 20;
            const rotateY = (centerX - x) / 20;

            card.style.setProperty('--rotateX', `${rotateX}deg`);
            card.style.setProperty('--rotateY', `${rotateY}deg`);
        });

        card.addEventListener('mouseleave', () => {
            card.style.setProperty('--rotateX', '0deg');
            card.style.setProperty('--rotateY', '0deg');
        });
    });
});