
export async function fetchCategories() {
    await new Promise(resolve => setTimeout(resolve, 1000));

    return [
        {
            id: "cat_1",
            name: "System Config",
            items: [
                { id: "item_1", key: "MAX_USERS", value: "100", updatedAt: "2026-03-14 10:00:00" },
                { id: "item_2", key: "MAINTENANCE_MODE", value: "false", updatedAt: "2026-03-14 10:05:00" }
            ]
        },
        {
            id: "cat_2",
            name: "API Settings",
            items: [
                { id: "item_3", key: "TIMEOUT_MS", value: "5000", updatedAt: "2026-03-13 15:30:00" }
            ]
        }
    ];
}

export async function updateCategoryItems(categoryId, updatedItems) {
    console.log(`Updating category ${categoryId}:`, updatedItems);
    // Implementation for DB update goes here
    return true;
}

export async function addCategoryItem(categoryId, newItem) {
    console.log(`Adding to ${categoryId}:`, newItem);
    // Implementation for DB insert goes here
    return true;
}