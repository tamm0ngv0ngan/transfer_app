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
    const copyUrlBtn = rowElement.querySelector('.btn-copy-url');
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

    copyUrlBtn.addEventListener("click", async () => {
        const url = copyUrlBtn.getAttribute("data-url");
        navigator.clipboard.writeText(url).then(() => {
            const originalHtml = copyUrlBtn.innerHTML;
            copyUrlBtn.innerHTML = '<i class="bi bi-check-lg"></i>';
            copyUrlBtn.classList.remove('btn-info');
            copyUrlBtn.classList.add('btn-success');
            setTimeout(() => {
                copyUrlBtn.innerHTML = originalHtml;
                copyUrlBtn.classList.remove('btn-success');
                copyUrlBtn.classList.add('btn-info');
            }, 1500);
        });
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
    fileContainer.className = 'card workspace-card file-card card-relative';
    fileContainer.id = 'fileManagerCard';

    fileContainer.innerHTML = `
<div id="fileCardOverlay" class="card-loading-overlay">
    <div class="spinner-border text-primary" role="status"></div>
    <div class="mt-2 fw-bold">Uploading File...</div>
</div>
<!-- Responsive section headers keep the existing action IDs and handlers. -->
<div class="card-header section-header">
    <div class="section-title"><span class="section-icon" aria-hidden="true"><i class="bi bi-folder2"></i></span><div><h2>File items</h2><p>A simple home for the files you share.</p></div></div>
    <input type="file" id="fileInput" class="d-none">
    <button class="btn btn-primary btn-add" onclick="document.getElementById('fileInput').click()"><i class="bi bi-upload" aria-hidden="true"></i> Upload file</button>
</div>
<div class="card-body">
    <div class="table-responsive">
        <table class="table item-table align-middle" aria-label="File items">
            <thead>
            <tr>
                <th scope="col">No.</th>
                <th scope="col">Name</th>
                <th scope="col">Size</th>
                <th scope="col">Updated</th>
                <th scope="col" class="text-center">Actions</th>
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
    // Keep the row number unchanged and show --- for items without an item number.
    bodyContainer.innerHTML = `
    ${fileItems.map((item, index) => `
        <tr data-item-id="${item.id}">
            <td class="number-cell" data-label="No.">${index + 1}</td>
            <td class="name-cell" data-label="Name">${item.name} <span class="item-id">(id: ${item.itemNumber ?? '---'})</span></td>
            <td class="size-cell" data-label="Size">${item.size}</td>
            <td class="updated-cell" data-label="Updated">${item.updatedAt}</td>
            <td class="actions-cell" data-label="Actions"><div class="row-actions">
                <button class="btn btn-sm btn-primary btn-download-file" title="Download file" aria-label="Download file"
                        data-url="${item.url}" data-name="${item.name}">
                    <i class="bi bi-download"></i>
                </button>
                <button class="btn btn-sm btn-info btn-copy-url" title="Copy download link" aria-label="Copy download link"
                        data-url="${item.url}">
                    <i class="bi bi-copy"></i>
                </button>
                <button class="btn btn-sm btn-danger btn-delete-file" title="Delete file" aria-label="Delete file"
                        data-id="${item.id}" data-path="${item.path}">
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
}
