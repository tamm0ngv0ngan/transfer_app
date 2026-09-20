import {login} from "../repository/db.js";


/**
 * @param {HTMLElement} container
 */
export function renderLoginForm(container) {
    // Presentation only: retain the existing form IDs and authentication handler.
    container.innerHTML = `
<div class="login-layout">
    <div class="card login-card">
        <div class="card-body">
            <span class="brand-mark" aria-hidden="true"><i class="bi bi-arrow-left-right"></i></span>
            <p class="login-brand">TRANSFER</p>
            <h1>Welcome back</h1>
            <p class="login-description">Sign in to access your text and files.</p>
            <div id="login-error" class="alert alert-danger d-none"></div>
            <form id="login-form">
                <div class="mb-3">
                    <label for="email" class="form-label">Email address</label>
                    <input type="email" autocomplete="username" placeholder="you@example.com" id="email" class="form-control" required />
                </div>
                <div class="mb-3">
                    <label for="password" class="form-label">Password</label>
                    <input type="password" autocomplete="current-password" id="password" class="form-control" required />
                </div>
                <button type="submit" class="btn btn-primary w-100">Sign in <i class="bi bi-arrow-right ms-2" aria-hidden="true"></i></button>
            </form>
        </div>
    </div>
</div>
    `;

    document.getElementById("login-form").addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        const result = await login(email, password);
        if (!result.success) {
            const errDiv = document.getElementById('login-error');
            errDiv.innerText = result.message;
            errDiv.classList.remove('d-none');
        }
    });
}