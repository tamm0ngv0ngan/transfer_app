import { isTMA } from "@telegram-apps/sdk";

export function setupEnvironment() {
    const appContainer = document.getElementById("app");

    try {
        const isTelegram = isTMA('complete') && window.Telegram?.WebApp?.initData !== "";
        if (isTelegram) {
            console.error("Application started!");
            appContainer.setAttribute('data-environment', 'telegram');
            document.documentElement.classList.add('telegram-mode');
            document.body.classList.add('bg-light');
        } else {
            console.error("Application aaaaa");
            appContainer.setAttribute('data-environment', 'browser');
        }
    } catch (e) {
        console.log("Running in standard Web Browser (TMA check failed/bypassed)");
    }
}

export function renderCategories(categories, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    categories.forEach(category => {
        const categoryCard = document.createElement('div');
        categoryCard.className = 'card mb-4 shadow-sm';

        categoryCard.innerHTML = `
<div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
    <h5 class="mb-0">${category.name}</h5>
    <span class="badge bg-secondary">Environment: ${document.getElementById('app').getAttribute('data-environment')}</span>        
</div>
<div class="card-body">
    <div class="table-responsive">
        <table class="table table-bordered table-hover align-middle">
            <thead class="table-light">
                <tr>
                    <th scope="col" style="width: 5%">No.</th>
                    <th scope="col" style="width: 20%">Key</th>
                    <th scope="col" style="width: 55%">Value</th>
                    <th scope="col" style="width: 20%">Updated At</th>
                </tr>
            </thead>
            <tbody id="tbody-${category.id}">
                ${category.items.map((item, index) => `
                <tr data-item-id="${item.id}">
                    <td>${index + 1}</td>
                    <td>${item.key}</td>
                    <td><input type="text" class="form-control item-value" value="${item.value}" /></td>
                    <td>${item.updatedAt}</td>
                </tr>
                `).join(' ')}
            </tbody>
        </table>
    </div>
    <div class="d-flex justify-content-end gap-2 mt-3">
        <button class="btn btn-outline-success btn-add" data-cat-id="${category.id}">
        <i class="bi bi-plus-circle"></i> Add New
        </button>
        <button class="btn btn-primary btn-update" data-cat-id="${category.id}">
        Update Changes
        </button>
    </div>
</div>
        `;
        container.appendChild(categoryCard);
        attachButtonListeners(categoryCard, containerId);
    })
}

function attachButtonListeners(cardElement, categoryId) {
    const updateButton = cardElement.querySelector(".btn-update");
    const addButton = cardElement.querySelector(".btn-add");

    updateButton.addEventListener('click', () => {
        const rows = cardElement.querySelectorAll('tbody tr');
        const updatedData = Array.from(rows).map(row => {
            return {
                id: row.getAttribute('data-item-id'),
                key: row.children[1].innerText,
                value: row.querySelector('.item-value').value
            };
        });
        alert(`Triggered update for ${categoryId}. Check console.`);
        console.log(`Dispatching update for ${categoryId}:`, updatedData);
        // Call your DB update function here
    });

    addButton.addEventListener('click', () => {
        const tbody = cardElement.querySelector('tbody');
        const newRowIndex = tbody.children.length + 1;

        const tr = document.createElement('tr');
        tr.innerHTML = `
      <td>${newRowIndex}</td>
      <td><input type="text" class="form-control" placeholder="New Key" /></td>
      <td><input type="text" class="form-control item-value" placeholder="New Value" /></td>
      <td>Pending...</td>
    `;
        tbody.appendChild(tr);
    });
}