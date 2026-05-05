
import * as bootstrap from "bootstrap";
import {addTextItem, deleteTextItem, getAllTextItems, updateTextItem} from "../repository/db.js";


async function handleConfirmTextAdd() {
    const key = document.getElementById("newTextKeyInput").value.trim();
    const value = document.getElementById("newTextValueInput").value.trim();

    if (!key || !value) {
        alert("Please enter an key and value!");
        return;
    }
    const overlay = document.getElementById('textModalOverlay');

    try {
        overlay.classList.add('active');

        await addTextItem({key, value});
        const modalElement = document.getElementById('addTextModal');
        const modalInstance = bootstrap.Modal.getOrCreateInstance(modalElement);
        modalInstance.hide();
        overlay.classList.remove('active');
        await loadTextItems();
    } catch (error) {
        overlay.classList.remove('active');
        alert("Add failed: " + error.message);
    }
}

function setupAddTextModal() {
    if (document.getElementById("addTextModal")) {
        return;
    }
    const modalHtml = `
    <div class="modal fade" id="addTextModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div id="textModalOverlay" class="modal-loading-overlay">
            <div class="text-center">
              <div class="spinner-border text-primary" role="status"></div>
              <div class="mt-2 fw-bold">Processing...</div>
            </div>
          </div>
          <div class="modal-header">
            <h5 class="modal-title">Add New Item</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label for="newTextKeyInput" class="form-label">Key</label>
              <input type="text" class="form-control" id="newTextKeyInput" placeholder="Enter Key...">
            </div>
            <div class="mb-3">
              <label for="newTextValueInput" class="form-label">Value</label>
              <textarea id="newTextValueInput" class="form-control item-value" style="resize: none; overflow: hidden; min-height: 38px;" placeholder="Enter Value..." rows="1"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-primary" id="confirmTextAddBtn">Add</button>
          </div>
        </div>
      </div>
    </div>
`;
    document.body.insertAdjacentHTML("beforeend", modalHtml);
    document.getElementById('confirmTextAddBtn').addEventListener('click', handleConfirmTextAdd)
}


/**
 * @param {HTMLElement} rowElement
 */
function attachRowListeners(rowElement) {
    const updateBtn = rowElement.querySelector('.btn-update-row');
    const deleteBtn = rowElement.querySelector('.btn-delete-row');

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
            await updateTextItem(itemId, value);
            await loadTextItems();
        } catch (e) {
            alert("Update failed: " + e.message);
            updateBtn.disabled = false;
            updateBtn.innerHTML = '<i class="bi bi-arrow-repeat"></i>';
        }
    })

    deleteBtn.addEventListener('click', async () => {
        if (confirm('Are you sure you want to delete this item?')) {
            try {
                deleteBtn.disabled = true;
                deleteBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';

                await deleteTextItem(itemId);
                await loadTextItems();
            } catch (error) {
                alert("Delete failed: " + error.message);
                deleteBtn.disabled = false;
                deleteBtn.innerHTML = '<i class="bi bi-trash"></i>';
            }
        }
    });
}

/**
 * @typedef {Object} TextItem
 * @property {string} id - id of Item, auto generate by Firebase
 * @property {string} key
 * @property {string} value
 * @property {string} updatedAt - when create/update item, code js auto add
* */


/**
 * @param {HTMLElement} container
 */
export function renderItemTable(container) {
    setupAddTextModal();

    const textContainer = document.createElement('div');
    textContainer.className = 'card mb-4 shadow-sm';

    textContainer.innerHTML = `
<div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
    <h5 class="mb-0">Text Items</h5>
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
            <tbody id="tbody-text-id">
            <tr>
                <td colspan="5" class="text-center">
                    <span class="spinner-border spinner-border-sm me-2"></span>Loading Data ...
                </td>
            </tr>
            </tbody>
        </table>
    </div>
    <div class="d-flex justify-content-end gap-2 mt-3">
        <button id="btn-add-text-id" class="btn btn-primary btn-add">
            <i class="bi bi-plus-circle"></i> Add New Text
        </button>
    </div>
</div>
    `;
    container.appendChild(textContainer);

    const addBtn = document.getElementById("btn-add-text-id");
    addBtn.addEventListener('click', () => {
        document.getElementById('newTextKeyInput').value = '';
        document.getElementById('newTextValueInput').value = '';

        const modalElement = document.getElementById('addTextModal');
        const modalInstance = bootstrap.Modal.getOrCreateInstance(modalElement);
        modalInstance.show();
    });
}

export async function loadTextItems() {
    const bodyContainer = document.getElementById('tbody-text-id');
    const textItems = await getAllTextItems();
    bodyContainer.innerHTML = `
    ${textItems.map((item, index) => `
        <tr data-item-id="${item.id}">
            <td>${index + 1}</td>
            <td>${item.key}</td>
            <td>
                <textarea class="form-control item-value" style="resize: none; overflow: hidden; min-height: 38px;" rows="1">${item.value}</textarea>
            </td>
            <td>${item.updatedAt}</td>
            <td class="text-center">
                <button class="btn btn-sm btn-success btn-update-row me-3" title="Update">
                    <i class="bi bi-arrow-repeat"></i>
                </button>
                <button class="btn btn-sm btn-danger btn-delete-row" title="Delete">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        </tr>
        `).join(' ')}
    `;

    const existingRows = bodyContainer.querySelectorAll('tr');
    existingRows.forEach(existingRow => {
        attachRowListeners(existingRow);

        const textarea = existingRow.querySelector('.item-value');
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = textarea.scrollHeight + 'px';
        }
    });
}