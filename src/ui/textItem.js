
import * as bootstrap from "bootstrap";
import {addTextItem, deleteTextItem, getAllTextItems, updateTextItem} from "../repository/db.js";


let itemValueResizeObserver = null;
let itemValueWidths = new WeakMap();
let itemValueResizeFrame = null;
const pendingItemValueTextareas = new Set();

/**
 * Match the textarea height to all wrapped lines, including its borders.
 * Keeping overflow automatic shows a scrollbar only after a manual shrink.
 * @param {HTMLTextAreaElement} textarea
 */
function resizeTextareaToContent(textarea) {
    const style = window.getComputedStyle(textarea);
    const borderHeight = parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth);
    textarea.style.height = 'auto';
    textarea.style.height = Math.ceil(textarea.scrollHeight + borderHeight) + 'px';
}

/**
 * Recalculate wrapping when the table width changes without overriding a
 * vertical resize made by the user.
 * @param {NodeListOf<HTMLTextAreaElement>} textareas
 */
function setupItemValueResize(textareas) {
    itemValueResizeObserver?.disconnect();
    if (itemValueResizeFrame) {
        cancelAnimationFrame(itemValueResizeFrame);
        itemValueResizeFrame = null;
    }
    pendingItemValueTextareas.clear();
    itemValueWidths = new WeakMap();

    if (typeof ResizeObserver === 'undefined') {
        textareas.forEach(textarea => resizeTextareaToContent(textarea));
        return;
    }

    itemValueResizeObserver = new ResizeObserver(entries => {
        entries.forEach(entry => {
            const boxSize = entry.borderBoxSize?.[0] || entry.borderBoxSize;
            const width = boxSize?.inlineSize || entry.target.getBoundingClientRect().width;
            const previousWidth = itemValueWidths.get(entry.target);

            // Ignore height-only changes caused by the user's resize handle.
            if (!width || (previousWidth && Math.abs(previousWidth - width) < 0.5)) return;

            itemValueWidths.set(entry.target, width);
            pendingItemValueTextareas.add(entry.target);
        });

        // Update height in the next frame to avoid a ResizeObserver feedback loop.
        if (!itemValueResizeFrame && pendingItemValueTextareas.size) {
            itemValueResizeFrame = requestAnimationFrame(() => {
                pendingItemValueTextareas.forEach(textarea => {
                    if (textarea.isConnected) resizeTextareaToContent(textarea);
                });
                pendingItemValueTextareas.clear();
                itemValueResizeFrame = null;
            });
        }
    });

    textareas.forEach(textarea => itemValueResizeObserver.observe(textarea));
}


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
    <div class="modal fade" id="addTextModal" tabindex="-1" aria-labelledby="addTextTitle" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div id="textModalOverlay" class="modal-loading-overlay">
            <div class="text-center">
              <div class="spinner-border text-primary" role="status"></div>
              <div class="mt-2 fw-bold">Processing...</div>
            </div>
          </div>
          <div class="modal-header">
            <h5 class="modal-title" id="addTextTitle">Add text</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label for="newTextKeyInput" class="form-label">Key</label>
              <input type="text" class="form-control" id="newTextKeyInput" placeholder="Enter Key...">
            </div>
            <div class="mb-3">
              <label for="newTextValueInput" class="form-label">Value</label>
              <textarea id="newTextValueInput" class="form-control item-value" placeholder="Enter Value..." rows="1"></textarea>
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
    const copyBtn = rowElement.querySelector('.btn-copy-row');
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

    const textarea = rowElement.querySelector('.item-value');

    copyBtn.addEventListener('click', () => {
        const value = textarea.value;
        navigator.clipboard.writeText(value).then(() => {
            const originalHtml = copyBtn.innerHTML;
            copyBtn.innerHTML = '<i class="bi bi-check-lg"></i>';
            copyBtn.classList.remove('btn-info');
            copyBtn.classList.add('btn-success');
            setTimeout(() => {
                copyBtn.innerHTML = originalHtml;
                copyBtn.classList.remove('btn-success');
                copyBtn.classList.add('btn-info');
            }, 1500);
        });
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
    textContainer.className = 'card workspace-card text-card';

    textContainer.innerHTML = `
<!-- Responsive section headers keep the existing action IDs and handlers. -->
<div class="card-header section-header">
    <div class="section-title"><span class="section-icon" aria-hidden="true"><i class="bi bi-text-left"></i></span><div><h2>Text items</h2><p>Keep a thought. Copy it anywhere.</p></div></div>
    <button id="btn-add-text-id" class="btn btn-primary btn-add"><i class="bi bi-plus-lg" aria-hidden="true"></i> Add text</button>
</div>
<div class="card-body">
    <div class="table-responsive">
        <table class="table item-table align-middle" aria-label="Text items">
            <thead>
            <tr>
                <th scope="col">No.</th>
                <th scope="col">Key</th>
                <th scope="col">Value</th>
                <th scope="col">Updated</th>
                <th scope="col" class="text-center">Actions</th>
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
    // Keep the row number unchanged and show --- for items without an item number.
    bodyContainer.innerHTML = `
    ${textItems.map((item, index) => `
        <tr data-item-id="${item.id}">
            <td class="number-cell" data-label="No.">${index + 1}</td>
            <td class="name-cell" data-label="Key">${item.key} <span class="item-id">(id: ${item.itemNumber ?? '---'})</span></td>
            <td class="value-cell" data-label="Value">
                <textarea aria-label="Text value" class="form-control item-value" rows="1">${item.value}</textarea>
            </td>
            <td class="updated-cell" data-label="Updated">${item.updatedAt}</td>
            <td class="actions-cell" data-label="Actions"><div class="row-actions">
                <button class="btn btn-sm btn-success btn-update-row" title="Save changes" aria-label="Save changes">
                    <i class="bi bi-arrow-repeat"></i>
                </button>
                <button class="btn btn-sm btn-info btn-copy-row" title="Copy text" aria-label="Copy text">
                    <i class="bi bi-copy"></i>
                </button>
                <button class="btn btn-sm btn-danger btn-delete-row" title="Delete text" aria-label="Delete text">
                    <i class="bi bi-trash"></i>
                </button>
            </div></td>
        </tr>
        `).join(' ')}
    `;

    const existingRows = bodyContainer.querySelectorAll('tr');
    existingRows.forEach(existingRow => {
        attachRowListeners(existingRow);
    });

    // This also waits for a hidden authenticated workspace to become visible.
    setupItemValueResize(bodyContainer.querySelectorAll('.item-value'));
}
