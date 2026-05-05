import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import 'bootstrap-icons/font/bootstrap-icons.css'
import './css/main.css'

import { onAuthStateChanged } from "firebase/auth";
import { auth } from './repository/db.js'
import {renderItemTable, loadTextItems} from "./ui/textItem.js";
import { renderLoginForm } from "./ui/login.js";
import { renderLogoutForm } from "./ui/logout.js";
import {loadFileItems, renderFileTable} from "./ui/fileItem.js";


async function initApp() {
    const container = document.getElementById('app');
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            container.innerHTML = '';
            renderLogoutForm(container);
            renderItemTable(container);
            renderFileTable(container)
            await loadTextItems();
            await loadFileItems();
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
