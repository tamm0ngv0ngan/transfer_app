import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

import { fetchCategories } from './db.js'
import { renderCategories, setupEnvironment } from "./ui.js";

async function initApp() {
    setupEnvironment();

    const containerId = 'category-container';
    document.getElementById(containerId).innerHTML = '<div class="spinner-border text-primary" role="status"></div> Loading data...';
    try {
        const categories = await fetchCategories();
        renderCategories(categories, containerId);
    } catch (error) {
        document.getElementById(containerId).innerHTML = `<div class="alert alert-danger">Error loading data: ${error.message}</div>`;
    }
}

// Bootstrap the application
initApp().then(() => console.log("Initializing categories..."));