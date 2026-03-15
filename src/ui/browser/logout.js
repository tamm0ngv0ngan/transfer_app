import { logout } from "../../repository/db.js";


/**
 * @param {HTMLElement} container
 */
export function renderLogoutForm(container) {
    const btn = document.createElement("button");
    btn.className = "btn btn-danger btn-sm d-flex justify-content-end";
    btn.innerHTML = '<i class="bi bi-box-arrow-right me-1"></i> Logout';

    const buttonContainer = document.createElement("div");
    buttonContainer.classList.add("d-flex", "justify-content-end", "mb-3");

    buttonContainer.appendChild(btn);
    container.appendChild(buttonContainer);

    btn.addEventListener('click', async () => {
        if (confirm("Are you sure you want to log out?")) {
            await logout();
        }
    });
}
