
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
