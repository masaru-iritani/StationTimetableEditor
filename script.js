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
    const headerText = document.querySelector('table th:nth-child(2)').innerText;
    const rows = Array.from(document.querySelectorAll('table tr:not(:first-child)'));
    const timetable = rows.map(row => {
        const hourCell = row.cells[0].innerText;
        const minuteCells = Array.from(row.cells[1].querySelectorAll('span'));
        const minutes = minuteCells.map(span => span.textContent.slice(0, -2));
        return hourCell + ':' + minutes.join(',');
    }).join(';');
    window.location.hash = encodeURIComponent(headerText) + '|' + timetable;
}

function parseHashAndRestoreTimetable() {
    const hashParts = window.location.hash.slice(1).split('|');
    if (hashParts.length < 2) return;

    const headerText = decodeURIComponent(hashParts[0]);
    document.querySelector('table th:nth-child(2)').innerText = headerText; // Directly set the text, allowing for empty header

    const timetable = hashParts[1].split(';');
    timetable.forEach(entry => {
        const [hour, minutes] = entry.split(':');
        if (!minutes) return;

        const rows = Array.from(document.querySelectorAll('table tr:not(:first-child)'));
        const row = rows.find(r => r.cells[0].innerText === hour);
        if (!row) return;

        const minuteCell = row.cells[1];
        minuteCell.innerHTML = ''; // Clear the cell before inserting new data

        const uniqueMinutes = [...new Set(minutes.split(',')
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
