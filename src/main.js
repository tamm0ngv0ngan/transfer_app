import { isTMA } from "@telegram-apps/sdk";
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import 'bootstrap-icons/font/bootstrap-icons.css'
import './css/main.css'

import { onAuthStateChanged } from "firebase/auth";
import { auth, login, logout} from './repository/db.js'
import { renderHomePage } from "./ui/browser/textItem.js";
import { renderLoginForm } from "./ui/browser/login.js";
import { renderLogoutForm } from "./ui/browser/logout.js";


export async function refreshApp() {
    const container = document.getElementById('app');
    try {
        await renderHomePage(container);
    } catch (error) {
        console.log(error);
    }
}


function setupEnvironment() {
    const appContainer = document.getElementById("app");
    try {
        // noinspection JSUnresolvedReference
        const isTelegram = isTMA('complete') && window.Telegram?.WebApp?.initData !== "";
        if (isTelegram) {
            appContainer.setAttribute('data-environment', 'telegram');
            document.documentElement.classList.add('telegram-mode');
            document.body.classList.add('bg-light');
        } else {
            appContainer.setAttribute('data-environment', 'browser');
        }
    } catch (e) {
        console.log("Running in standard Web Browser (TMA check failed/bypassed)");
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