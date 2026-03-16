
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
    <span class="badge bg-secondary">Environment: ${container.getAttribute('data-environment')}</span>
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
            await new Promise(resolve => setTimeout(resolve, 5000));
            setFileCardLoading(false);
        } catch (error) {
            alert("Upload failed: " + error.message);
            setFileCardLoading(false);
        }
    })
}