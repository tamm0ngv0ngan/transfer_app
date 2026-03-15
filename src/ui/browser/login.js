


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