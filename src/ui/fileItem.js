import {deleteFileItem, getAllFileItems, uploadFile} from "../repository/db.js";

/**
 * @param {boolean} isLoading
 */
function setFileCardLoading(isLoading) {
    const overlay = document.getElementById("fileCardOverlay");
    if (overlay) {
        if (isLoading) {
            overlay.classList.add("active");
        } else {
            overlay.classList.remove("active");
        }
    }
}

/**
 * @param {HTMLElement} rowElement
 */
function attachRowListeners(rowElement) {
    const downloadBtn = rowElement.querySelector('.btn-download-file');
    const deleteBtn = rowElement.querySelector('.btn-delete-file');

    downloadBtn.addEventListener("click", async () => {
        const fileUrl = downloadBtn.getAttribute("data-url");
        const fileName = downloadBtn.getAttribute("data-name");

        try {
            downloadBtn.disabled = true;
            downloadBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
            const response = await fetch(fileUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            alert("Could not download file: " + error.message);
        } finally {
            downloadBtn.disabled = false;
            downloadBtn.innerHTML = '<i class="bi bi-download"></i>';
        }
    });

    deleteBtn.addEventListener("click", async () => {
        if (confirm("Delete this file permanently?")) {
            const id = deleteBtn.getAttribute("data-id");
            const path = deleteBtn.getAttribute("data-path");
            try {
                deleteBtn.disabled = true;
                deleteBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';

                await deleteFileItem(id, path);
                await loadFileItems();
            } catch (error) {
                alert("Delete failed: " + error.message);
                deleteBtn.disabled = false;
                deleteBtn.innerHTML = '<i class="bi bi-trash"></i>';
            }
        }
    });
}

/**
 * @param {HTMLElement} container
 */
export function renderFileTable(container) {
    const fileContainer = document.createElement('div');
    fileContainer.className = 'card mb-4 shadow-sm card-relative';
    fileContainer.id = 'fileManagerCard';

    fileContainer.innerHTML = `
<div id="fileCardOverlay" class="card-loading-overlay">
    <div class="spinner-border text-primary" role="status"></div>
    <div class="mt-2 fw-bold">Uploading File...</div>
</div>
<div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
    <h5 class="mb-0">File Manager</h5>
</div>
<div class="card-body">
    <div class="table-responsive">
        <table class="table table-bordered table-hover align-middle" style="table-layout: fixed;">
            <thead class="table-light">
            <tr>
                <th scope="col" style="width: 5%">No.</th>
                <th scope="col" style="width: 45%">Name</th>
                <th scope="col" style="width: 15%">Size</th>
                <th scope="col" style="width: 20%">Updated At</th>
                <th scope="col" style="width: 15%" class="text-center">Action</th>
            </tr>
            </thead>
            <tbody id="tbody-file-id">
            <tr>
                <td colspan="5" class="text-center">
                    <span class="spinner-border spinner-border-sm me-2"></span>Loading Data ...
                </td>
            </tr>
            </tbody>
        </table>
    </div>
    <div class="d-flex justify-content-end gap-2 mt-3">
        <input type="file" id="fileInput" class="d-none">
        <button class="btn btn-primary btn-add" onclick="document.getElementById('fileInput').click()">
            <i class="bi bi-plus-circle"></i> Upload New File
        </button>
    </div>
</div>
    `;
    container.appendChild(fileContainer);

    const fileInput = document.getElementById('fileInput');
    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) {
            return;
        }
        try {
            setFileCardLoading(true);
            await uploadFile(file);
            await loadFileItems();
            setFileCardLoading(false);
        } catch (error) {
            alert("Upload failed: " + error.message);
            setFileCardLoading(false);
        }
    })
}

export async function loadFileItems() {
    const bodyContainer = document.getElementById('tbody-file-id');
    const fileItems = await getAllFileItems();
    bodyContainer.innerHTML = `
    ${fileItems.map((item, index) => `
        <tr data-item-id="${item.id}">
            <td>${index + 1}</td>
            <td>${item.name}</td>
            <td>${item.size}</td>
            <td>${item.updatedAt}</td>
            <td class="text-center">
                <button class="btn btn-sm btn-primary btn-download-file me-3" 
                        data-url="${item.url}" data-name="${item.name}">
                    <i class="bi bi-download"></i>
                </button>
                <button class="btn btn-sm btn-danger btn-delete-file"
                        data-id="${item.id}" data-path="${item.path}">
                        <i class="bi bi-trash"></i>
                </button>
            </td>
        </tr>
        `).join(' ')}
    `;

    const existingRows = bodyContainer.querySelectorAll('tr');
    existingRows.forEach(existingRow => {
        attachRowListeners(existingRow);
    });
}