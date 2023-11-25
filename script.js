document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('table td:nth-child(2)').forEach(cell => {
        cell.addEventListener('dblclick', handleTableBodyCellDblClick);
    });
    document.querySelector('table th:nth-child(2)').addEventListener('dblclick', handleTableHeaderCellDblClick);
    parseHashAndRestoreTimetable();
});

function createEditableInput(cell, defaultValue, isNumeric, callback) {
    const input = document.createElement('input');
    input.type = isNumeric ? 'number' : 'text';
    if (isNumeric) {
        input.min = 0;
        input.max = 59;
    }
    input.style.width = '100%';
    input.value = defaultValue;
    cell.appendChild(input);
    input.focus();
    input.addEventListener('blur', callback);
    input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            this.blur();
        }
        if (e.key === 'Escape') {
            cell.removeChild(this);
            if (cell.querySelector('span')) {
                cell.querySelector('span').style.display = 'inline'; // Show the original span if it exists
            }
        }
    });
}

function handleTableBodyCellDblClick(e) {
    if (e.target.tagName === 'SPAN') {
        e.target.removeEventListener('dblclick', handleSpanDblClick);
        e.target.style.display = 'none'; // Hide the original span during editing
        createEditableInput(this, e.target.textContent, true, function() {
            const inputValue = this.value.trim();
            if (inputValue === '' || isNaN(inputValue)) {
                e.target.style.display = 'inline';
                this.parentElement.removeChild(this);
                return;
            }
            const parsedValue = parseInt(inputValue);
            if (parsedValue >= 60) {
                e.target.style.display = 'inline';
                this.parentElement.removeChild(this);
                return;
            }
            const normalizedValue = parsedValue.toString().padStart(2, '0');

            const newSpan = document.createElement('span');
            newSpan.textContent = normalizedValue;
            newSpan.addEventListener('dblclick', handleSpanDblClick);
            this.parentElement.replaceChild(newSpan, e.target);
            this.parentElement.removeChild(this);
            updateURLHash(this.parentElement);
        });
        return;
    }
    createEditableInput(this, '00', true, function() {
        const inputValue = this.value.trim();
        if (inputValue === '' || isNaN(inputValue)) {
            this.parentElement.removeChild(this);
            return;
        }
        const parsedValue = parseInt(inputValue);
        if (parsedValue >= 60) return;
        const normalizedValue = parsedValue.toString().padStart(2, '0');

        // Check if the number already exists in the cell
        if (Array.from(this.parentElement.querySelectorAll('span'))
                 .some(span => span.textContent === normalizedValue)) {
            this.parentElement.removeChild(this);
            return;
        }

        const span = document.createElement('span');
        span.textContent = normalizedValue;
        span.addEventListener('dblclick', handleSpanDblClick);
        insertSortedSpan(this.parentElement, span);
        this.parentElement.removeChild(this);
        updateURLHash(this.parentElement);
    });
}

function handleTableHeaderCellDblClick() {
    createEditableInput(this, this.innerText, false, function() {
        const newHeader = this.value.trim() || 'Column 2';
        this.parentElement.innerText = newHeader;
        updateURLHash(this.parentElement);
    });
}

function handleSpanDblClick(e) {
    const cell = this.parentElement;
    const oldSpan = this;
    createEditableInput(cell, oldSpan.textContent, true, function() {
        const inputValue = this.value.trim();
        if (inputValue === '') {
            cell.removeChild(oldSpan);
            cell.removeChild(this);
            updateURLHash(cell);
            return;
        }
        const parsedValue = parseInt(inputValue);
        if (parsedValue >= 60) {
            oldSpan.style.display = 'inline'; // Show the original span if input is invalid
            cell.removeChild(this);
            return;
        }
        const normalizedValue = parsedValue.toString().padStart(2, '0');
        const newSpan = document.createElement('span');
        newSpan.textContent = normalizedValue;
        newSpan.addEventListener('dblclick', handleSpanDblClick);
        cell.removeChild(oldSpan);
        insertSortedSpan(cell, newSpan);
        cell.removeChild(this);
        updateURLHash(cell);
    });
    oldSpan.style.display = 'none'; // Hide the original span during editing
    e.stopPropagation();
}

function insertSortedSpan(cell, newSpan) {
    const spans = Array.from(cell.querySelectorAll('span'));
    const newNumber = parseInt(newSpan.textContent);
    const insertionIndex = spans.findIndex(span => parseInt(span.textContent) > newNumber);
    if (insertionIndex === -1) {
        cell.appendChild(newSpan); // Append at the end if no larger number is found
    } else {
        cell.insertBefore(newSpan, spans[insertionIndex]); // Insert before the first larger number
    }
}

function updateURLHash(cell) {
    const headerCells = Array.from(document.querySelectorAll('table th:not(:first-child, :last-child)'));
    const headers = headerCells.map(header => encodeURIComponent(header.innerText)).join('|');
    const rows = Array.from(document.querySelectorAll('table tr:not(:first-child)'));

    const timetable = rows.map(row => {
        const hourCell = row.cells[0].innerText;
        const minuteCells = Array.from(row.querySelectorAll('td:not(:first-child, :last-child)'));
        const minutesGroups = minuteCells.map(cell => {
            const minutes = Array.from(cell.querySelectorAll('span'))
                                 .map(span => span.textContent);
            return minutes.join(',');
        });
        return hourCell + ':' + minutesGroups.join(':');
    }).join(';');

    window.location.hash = headers + '#' + timetable;
}

function addEmptyColumn() {
    // Add new header
    const newHeader = document.createElement('th');
    if (document.querySelectorAll('table th').length === 2) {
        const button = document.createElement('button');
        button.id = 'add-column';
        button.textContent = '+';
        button.addEventListener('click', addNewColumn);
        newHeader.appendChild(button);
    }

    // Add new cells in each row
    document.querySelectorAll('table tr').forEach(row => {
        const newCell = document.createElement('td');
        row.appendChild(newCell);
    });
}

function parseHashAndRestoreTimetable() {
    const hashParts = window.location.hash.slice(1).split('#');
    if (hashParts.length < 2) return;

    const headerTexts = hashParts[0].split('|').map(text => decodeURIComponent(text));
    headerTexts.forEach((text, index) => {
        let header = document.querySelector(`table th:nth-child(${index + 2})`);
        if (!header) {
            addNewColumn(); // Add a column if not enough columns
            header = document.querySelector(`table th:nth-child(${index + 2})`);
        }
        header.innerText = text || ''; // Set header text, allowing empty
    });

    const timetable = hashParts[1].split(';');
    timetable.forEach(entry => {
        const [hour, ...minutesGroups] = entry.split(':');
        if (!minutesGroups.length) return;

        const rows = Array.from(document.querySelectorAll('table tr:not(:first-child)'));
        const row = rows.find(r => r.cells[0].innerText === hour);
        if (!row) return;

        minutesGroups.forEach((group, index) => {
            let minuteCell = row.cells[index + 1];
            if (!minuteCell) {
                addEmptyColumn(); // Add a column if not enough columns
                minuteCell = row.cells[index + 1];
            }
            minuteCell.innerHTML = ''; // Clear the cell before inserting new data

            const uniqueMinutes = [...new Set(group.split(',')
                                        .filter(min => min !== '' && !isNaN(min) && parseInt(min) >= 0 && parseInt(min) < 60)
                                        .map(min => parseInt(min)))];

            const sortedMinutes = uniqueMinutes.sort((a, b) => a - b)
                                               .map(min => min.toString().padStart(2, '0'));

            sortedMinutes.forEach(min => {
                const span = document.createElement('span');
                span.textContent = min;
                span.addEventListener('dblclick', handleSpanDblClick);
                minuteCell.appendChild(span);
            });
        });
    });

    // Ensure the last column with the plus button is always present
    addEmptyColumn();
}

function addNewColumn(beforeLast = false) {
    // Add new header
    const newHeader = document.createElement('th');
    newHeader.addEventListener('dblclick', handleTableHeaderCellDblClick);

    // Insert the new header
    const headerRow = document.querySelector('table tr:first-child');
    if (beforeLast && headerRow.lastElementChild) {
        headerRow.insertBefore(newHeader, headerRow.lastElementChild);
    } else {
        headerRow.appendChild(newHeader);
    }

    // Add new cells in each body row
    document.querySelectorAll('table tr:not(:first-child)').forEach(row => {
        const newCell = document.createElement('td');
        newCell.addEventListener('dblclick', handleTableBodyCellDblClick);
        if (beforeLast && row.lastElementChild) {
            row.insertBefore(newCell, row.lastElementChild);
        } else {
            row.appendChild(newCell);
        }
    });
}

function clearEditableColumns() {
    document.querySelectorAll('table th:not(:first-child, :last-child)').forEach(th => th.remove());
    document.querySelectorAll('table td:not(:first-child, :last-child)').forEach(td => td.remove());
}

function parseHashAndRestoreTimetable() {
    const hashParts = window.location.hash.slice(1).split('#');
    if (hashParts.length < 2) return;

    clearEditableColumns(); // Clear existing columns before restoring

    const headerTexts = hashParts[0].split('|').map(text => decodeURIComponent(text));
    headerTexts.forEach((text, index) => {
        addNewColumn(true); // Add a column before the last one
        const header = document.querySelector(`table th:nth-child(${index + 2})`);
        header.innerText = text || ''; // Set header text, allowing empty
    });

    const timetable = hashParts[1].split(';');
    timetable.forEach(entry => {
        const [hour, ...minutesGroups] = entry.split(':');
        if (!minutesGroups.length) return;

        const rows = Array.from(document.querySelectorAll('table tr:not(:first-child)'));
        const row = rows.find(r => r.cells[0].innerText === hour);
        if (!row) return;

        minutesGroups.forEach((group, index) => {
            const minuteCell = row.cells[index + 1];
            minuteCell.innerHTML = ''; // Clear the cell before inserting new data

            const uniqueMinutes = [...new Set(group.split(',')
                                        .filter(min => min !== '' && !isNaN(min) && parseInt(min) >= 0 && parseInt(min) < 60)
                                        .map(min => parseInt(min)))];

            const sortedMinutes = uniqueMinutes.sort((a, b) => a - b)
                                               .map(min => min.toString().padStart(2, '0'));

            sortedMinutes.forEach(min => {
                const span = document.createElement('span');
                span.textContent = min;
                span.addEventListener('dblclick', handleSpanDblClick);
                minuteCell.appendChild(span);
            });
        });
    });
}

document.getElementById('add-column').addEventListener('click', addNewColumn);

function addNewRow() {
    const table = document.querySelector('table');
    const lastRow = table.rows[table.rows.length - 1];
    const newRow = table.insertRow();
    const numColumns = lastRow.cells.length;

    for (let i = 0; i < numColumns; i++) {
        const newCell = newRow.insertCell();
        if (i === 0) {
            const lastHour = parseInt(lastRow.cells[0].textContent);
            newCell.textContent = isNaN(lastHour) ? 1 : lastHour + 1; // Increment the hour by 1
        } else if (i < numColumns - 1) {
            newCell.addEventListener('dblclick', handleTableBodyCellDblClick);
        }
    }
    updateURLHash(newRow);
}

const tableContainer = document.getElementById('table-container');
const table = document.querySelector('#table-container table');
const threshold = 30; // pixels for proximity to the bottom border

document.getElementById('table-container').addEventListener('mousemove', function(event) {
    const mouseX = event.clientX;
    const mouseY = event.clientY;
    const table = this.querySelector('table');
    const tableBody = table.querySelector('tbody');
    const tableRect = table.getBoundingClientRect();
    const tableBodyRect = tableBody.getBoundingClientRect();
    const firstRow = tableBody.querySelector('tr:first-child');
    const lastRow = tableBody.querySelector('tr:last-child');
    const firstRowRect = firstRow.getBoundingClientRect();
    const lastRowRect = lastRow.getBoundingClientRect();
    const leftBorderRange = 20; // Range in pixels for activation horizontally
    const bottomBorderRange = 20; // Range in pixels for activation vertically
    const topBorderRange = 20; // Range in pixels for activation vertically
    const distanceToLeftBorder = Math.abs(mouseX - tableRect.left);
    const distanceToBottomBorder = Math.abs(mouseY - (tableRect.bottom + bottomBorderRange));
    const distanceToTopBorder = Math.abs(mouseY - (tableBodyRect.top - topBorderRange));
    const isEmptyFirstRow = Array.from(firstRow.cells).slice(1).every(cell => !cell.textContent.trim());
    const isEmptyLastRow = Array.from(lastRow.cells).slice(1).every(cell => !cell.textContent.trim());

    // Show plus button when cursor is close to the bottom or top border but outside of the table
    if ((distanceToBottomBorder <= bottomBorderRange && mouseY > tableRect.bottom) ||
        (distanceToTopBorder <= topBorderRange && mouseY < tableBodyRect.top)) {
        table.classList.add('show-plus');
    } else {
        table.classList.remove('show-plus');
    }

    // Highlight first or last row based on mouse position and emptiness
    if (distanceToLeftBorder <= leftBorderRange) {
        if (isEmptyFirstRow && mouseY >= firstRowRect.top && mouseY <= firstRowRect.bottom) {
            firstRow.classList.add('highlight-left');
            lastRow.classList.remove('highlight-left');
        } else if (isEmptyLastRow && mouseY >= lastRowRect.top && mouseY <= lastRowRect.bottom) {
            lastRow.classList.add('highlight-left');
            firstRow.classList.remove('highlight-left');
        } else {
            firstRow.classList.remove('highlight-left');
            lastRow.classList.remove('highlight-left');
        }
    } else {
        firstRow.classList.remove('highlight-left');
        lastRow.classList.remove('highlight-left');
    }
});

tableContainer.addEventListener('click', (event) => {
    if (table.classList.contains('show-plus')) {
        addNewRow();
    }
});

document.getElementById('table-container').addEventListener('click', function() {
    const highlightedRow = this.querySelector('tr.highlight-left');
    if (highlightedRow) {
        highlightedRow.remove();
    }
});
