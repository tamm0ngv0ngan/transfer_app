import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import 'bootstrap-icons/font/bootstrap-icons.css'
import './css/main.css'

import { onAuthStateChanged } from "firebase/auth";
import {auth, login, logout} from './repository/db.js'
import {renderHomePage, renderLoginForm, renderLogoutForm, setupEnvironment} from "./ui/ui.js";

export async function refreshApp() {
    const container = document.getElementById('app');
    try {
        await renderHomePage(container);
    } catch (error) {
        console.log(error);
    }
}

async function initApp() {
    setupEnvironment();

    const container = document.getElementById('app');
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            renderLogoutForm(async () => {
                await logout();
            });
            container.innerHTML = '<div class="spinner-border text-primary" role="status"></div> Loading data...';
            await refreshApp();
        } else {
            renderLoginForm(async (email, password) => {
                const result = await login(email, password);
                if (!result.success) {
                    const errDiv = document.getElementById('login-error');
                    errDiv.innerText = result.message;
                    errDiv.classList.remove('d-none');
                }
            }, "app");

            const oldBtn = document.querySelector('.btn-danger');
            if (oldBtn) {
                oldBtn.remove();
            }
        }
    });
}

// Bootstrap the application
initApp().then(() => console.log("Initializing categories..."));