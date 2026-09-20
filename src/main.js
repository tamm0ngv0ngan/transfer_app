import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import 'bootstrap-icons/font/bootstrap-icons.css'
import './css/main.css'

import { onAuthStateChanged } from "firebase/auth";
import { auth, loadItemNumbers } from './repository/db.js'
import {renderItemTable, loadTextItems} from "./ui/textItem.js";
import { renderLoginForm } from "./ui/login.js";
import { renderLogoutForm } from "./ui/logout.js";
import {loadFileItems, renderFileTable} from "./ui/fileItem.js";


function renderInitialLoader(container) {
    container.innerHTML = `
      <div id="initial-loader" class="initial-loader" role="status" aria-live="polite">
        <img src="/transfer.svg" alt="" class="loading-illustration" />
        <h1>Transfer</h1>
        <p>Opening your workspace<span class="loading-dots" aria-hidden="true">…</span></p>
      </div>
    `;
}

/**
 * Build the authenticated workspace while it is hidden behind the loader.
 * The loader is removed only after metadata and both item tables are ready.
 * @param {HTMLElement} container
 * @param {import('firebase/auth').User} user
 */
async function renderAuthenticatedWorkspace(container, user) {
    renderInitialLoader(container);

    const workspace = document.createElement('div');
    workspace.className = 'authenticated-workspace d-none';
    container.appendChild(workspace);

    renderLogoutForm(workspace);
    renderItemTable(workspace);
    renderFileTable(workspace);

    try {
        // Load independent Firebase data in parallel to shorten the loading screen.
        await Promise.all([
            loadItemNumbers(),
            loadTextItems(),
            loadFileItems()
        ]);
    } catch (error) {
        if (auth.currentUser?.uid !== user.uid) return;
        const loader = document.getElementById('initial-loader');
        if (loader) {
            loader.classList.add('loading-error');
            loader.querySelector('p').textContent = 'Could not open your workspace. Please reload the page.';
        }
        console.error('Could not load workspace:', error);
        return;
    }

    // Ignore stale work when authentication changed during Firebase requests.
    if (auth.currentUser?.uid !== user.uid || !workspace.isConnected) return;

    document.getElementById('initial-loader')?.remove();
    workspace.classList.remove('d-none');
}

async function initApp() {
    const container = document.getElementById('app');
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            await renderAuthenticatedWorkspace(container, user);
        } else {
            renderLoginForm( container);

            const oldBtn = document.querySelector('.btn-danger');
            if (oldBtn) {
                oldBtn.remove();
            }
        }
    });
}

// Bootstrap the application
initApp().then(() => console.log("Initializing categories..."));
