/**
 * Find the smallest available number shared by all item collections.
 * @param {Set<number>} usedNumbers
 * @return {number}
 */
export function nextItemNumber(usedNumbers) {
    for (let number = 1; number <= 999; number++) {
        if (!usedNumbers.has(number)) {
            return number;
        }
    }
    throw new Error('All item numbers from 1 to 999 are in use. Delete an item before adding a new one.');
}
