import { isTMA } from "@telegram-apps/sdk";
import * as bootstrap from "bootstrap";
import {addItem, deleteItem, updateItem} from "./db.js";

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
            appContainer.setAttribute('data-environment', 'browser');
        }
    } catch (e) {
        console.log("Running in standard Web Browser (TMA check failed/bypassed)");
    }
}

export function renderLoginForm(onLoginSuccess, containerId) {
    const appContainer = document.getElementById(containerId);
    appContainer.innerHTML = `
<div class="d-flex justify-content-center align-items-center" style="min-height: 80vh;">
    <div class="card shadow" style="width: 100%; max-width: 400px;">
        <div class="card-body">
            <h3 class="card-title text-center mb-4">Admin Login</h3>
            <div id="login-error" class="alert alert-danger d-none"></div>
            <form id="login-form">
                <div class="mb-3">
                    <label class="form-label">Email Address</label>
                    <input type="email" id="email" class="form-control" required />
                </div>
                <div class="mb-3">
                    <label class="form-label">Password</label>
                    <input type="password" id="password" class="form-control" required />
                </div>
                <button type="submit" class="btn btn-primary w-100">Login</button>
            </form>
        </div>
    </div>
</div>
    `;

    document.getElementById("login-form").addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
        onLoginSuccess(email, password);
    });
}

export function renderLogoutForm(onLogoutClick) {
    const btn = document.createElement("button");
    btn.className = "btn btn-danger btn-sm position-fixed top-0 end-0 m-3 z-3";
    btn.innerHTML = '<i class=\"bi bi-box-arrow-right\"></i> Logout';
    btn.addEventListener('click', async () => {
        if (confirm("Are you sure you want to log out?")) {
            await onLogoutClick();
        }
    });
    document.body.appendChild(btn);
}

function setupAddModal() {
    if (document.getElementById("addModal")) {
        return;
    }
    const modalHtml = `
    <div class="modal fade" id="addModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div id="modalOverlay" class="modal-loading-overlay">
          <div class="text-center">
            <div class="spinner-border text-primary" role="status"></div>
            <div class="mt-2 fw-bold">Processing...</div>
          </div>
        </div>
          <input type="hidden" id="modalTargetCategoryId">
          <div class="modal-header">
            <h5 class="modal-title">Add New Item</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label for="newKeyInput" class="form-label">Key</label>
              <input type="text" class="form-control" id="newKeyInput" placeholder="Enter Key...">
            </div>
            <div class="mb-3">
              <label for="newValueInput" class="form-label">Value</label>
              <input type="text" class="form-control" id="newValueInput" placeholder="Enter Value...">
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-primary" id="confirmAddBtn">Add</button>
          </div>
        </div>
      </div>
    </div>
    `;
    document.body.insertAdjacentHTML("beforeend", modalHtml);
    document.getElementById('confirmAddBtn').addEventListener('click', handleConfirmAdd)
}

function attachRowListeners(rowElement) {
    const updateBtn = rowElement.querySelector('.btn-update-row');
    const deleteBtn = rowElement.querySelector('.btn-delete-row');

    const categoryId = rowElement.getAttribute('data-cat-id');
    const itemId = rowElement.getAttribute('data-item-id');

    updateBtn.addEventListener('click', async () => {
        const value = rowElement.querySelector('.item-value').value.trim();

        if (!value) {
            alert("Value cannot be empty!");
            return;
        }

        try {
            updateBtn.disabled = true;
            updateBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
            await updateItem(categoryId, itemId, value);
            import('./main.js').then(m => m.refreshApp());
            console.log(`[UPDATE SUCCESS] Item ${itemId} updated.`);
        } catch (e) {
            alert("Update failed: " + e.message);
            updateBtn.disabled = false;
            updateBtn.innerHTML = '<i class="bi bi-arrow-repeat"></i>';
        }

        const keyInput = rowElement.querySelector('.item-key-input');
        const keyText = rowElement.querySelector('.item-key-text');
        const key = keyInput ? keyInput.value : keyText.innerText;

        console.log(`[UPDATE] Cat: ${categoryId} | Item: ${itemId} | Key: ${key} | Value: ${value}`);
    })

    deleteBtn.addEventListener('click', async () => {
        if (confirm('Are you sure you want to delete this item?')) {
            console.log(`[DELETE] Cat: ${categoryId} | Item: ${itemId}`);
            try {
                deleteBtn.disabled = true;
                deleteBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';

                await deleteItem(categoryId, itemId);
                import('./main.js').then(m => m.refreshApp());
            } catch (error) {
                alert("Delete failed: " + error.message);
                deleteBtn.disabled = false;
                deleteBtn.innerHTML = '<i class="bi bi-trash"></i>';
            }
        }
    });
}

function attachCardListeners(cardElement, categoryId) {
    const addBtn = cardElement.querySelector('.btn-add');

    addBtn.addEventListener('click', () => {
        document.getElementById("modalTargetCategoryId").value = categoryId;

        document.getElementById('newKeyInput').value = '';
        document.getElementById('newValueInput').value = '';

        const modalElement = document.getElementById('addModal');
        const modalInstance = bootstrap.Modal.getOrCreateInstance(modalElement);
        modalInstance.show();
    });

    const existingRows = cardElement.querySelectorAll('tbody tr');
    existingRows.forEach(existingRow => {
        attachRowListeners(existingRow);
    });
}

async function handleConfirmAdd() {
    const key = document.getElementById("newKeyInput").value.trim();
    const value = document.getElementById("newValueInput").value.trim();

    if (!key || !value) {
        alert("Please enter an key and value!");
        return;
    }
    const overlay = document.getElementById('modalOverlay');
    const categoryId = document.getElementById("modalTargetCategoryId").value;

    try {
        overlay.classList.add('active');

        await addItem(categoryId, {key, value});
        const modalElement = document.getElementById('addModal');
        const modalInstance = bootstrap.Modal.getOrCreateInstance(modalElement);
        modalInstance.hide();
        overlay.classList.remove('active');
        import('./main.js').then(m => m.refreshApp());
    } catch (error) {
        overlay.classList.remove('active');
        alert("Add failed: " + error.message);
    }
}

/**
 * @param {Object[]} categories
 * @param {string} categories[].id
 * @param {string} categories[].name
 * @param {string} categories[].updatedAt
 * @param {HTMLElement} container
 */
export function renderCategories(categories, container) {
    container.innerHTML = '';

    setupAddModal();

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
        <table class="table table-bordered table-hover align-middle" style="table-layout: fixed;">
            <thead class="table-light">
                <tr>
                    <th scope="col" style="width: 5%">No.</th>
                    <th scope="col" style="width: 20%">Key</th>
                    <th scope="col" style="width: 40%">Value</th>
                    <th scope="col" style="width: 20%">Updated At</th>
                    <th scope="col" style="width: 15%" class="text-center">Action</th>
                </tr>
            </thead>
            <tbody id="tbody-${category.id}">
                ${category.items.map((item, index) => `
                <tr data-item-id="${item.id}">
                    <td>${index + 1}</td>
                    <td>${item.key}</td>
                    <td><input type="text" class="form-control item-value" value="${item.value}" /></td>
                    <td>${item.updatedAt}</td>
                    <td class="text-center">
                        <button class="btn btn-sm btn-success btn-update-row" title="Update">
                            <i class="bi bi-arrow-repeat"></i>
                        </button>
                        <button class="btn btn-sm btn-danger btn-delete-row" title="Delete">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                </tr>
                `).join(' ')}
            </tbody>
        </table>
    </div>
    <div class="d-flex justify-content-end gap-2 mt-3">
        <button class="btn btn-outline-success btn-add" data-cat-id="${category.id}">
        <i class="bi bi-plus-circle"></i> Add New
        </button>
    </div>
</div>
        `;
        container.appendChild(categoryCard);
        attachCardListeners(categoryCard, category.id);
    });
}
