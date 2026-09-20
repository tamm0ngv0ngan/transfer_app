import { logout } from "../repository/db.js";


/**
 * @param {HTMLElement} container
 */
export function renderLogoutForm(container) {
    const btn = document.createElement("button");
    btn.className = "btn btn-outline-secondary logout-button";
    btn.innerHTML = '<i class="bi bi-box-arrow-right me-1"></i> Sign out';

    const buttonContainer = document.createElement("div");
    // Keep the existing sign-out action inside a responsive workspace header.
    buttonContainer.className = "workspace-header";
    buttonContainer.innerHTML = `
        <div class="workspace-brand">
            <span class="brand-mark" aria-hidden="true"><i class="bi bi-arrow-left-right"></i></span>
            <div><h1>Transfer</h1><p>Your text and files, in one place.</p></div>
        </div>
    `;

    buttonContainer.appendChild(btn);
    container.appendChild(buttonContainer);

    btn.addEventListener('click', async () => {
        if (confirm("Are you sure you want to log out?")) {
            await logout();
        }
    });
}
