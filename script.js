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
    });
}

function handleTableBodyCellDblClick(e) {
    if (e.target.tagName === 'SPAN') {
        e.target.removeEventListener('dblclick', handleSpanDblClick);
        return;
    }
    createEditableInput(this, '00', true, function() {
        const inputValue = parseInt(this.value);
        if (inputValue >= 60) return;
        const normalizedValue = inputValue.toString().padStart(2, '0');

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

function addNewColumn() {
    // Add new header
    const newHeader = document.createElement('th');
    newHeader.addEventListener('dblclick', handleTableHeaderCellDblClick);
    const lastHeader = document.querySelector('table tr th:last-child');
    lastHeader.parentNode.insertBefore(newHeader, lastHeader);

    // Add new cells in each row
    document.querySelectorAll('table tr:not(:first-child)').forEach(row => {
        const newCell = document.createElement('td');
        newCell.addEventListener('dblclick', handleTableBodyCellDblClick);
        const lastCell = row.lastElementChild;
        row.insertBefore(newCell, lastCell);
    });
}

document.getElementById('add-column').addEventListener('click', addNewColumn);
