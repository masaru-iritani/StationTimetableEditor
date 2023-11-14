document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('table td:nth-child(2)').forEach(cell => {
        cell.addEventListener('dblclick', handleTableBodyCellDblClick);
    });
    document.querySelector('table th:nth-child(2)').addEventListener('dblclick', handleTableHeaderCellDblClick);
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

function sortCellNumbers(cell) {
    const numbers = Array.from(cell.querySelectorAll('span'))
                         .map(span => parseInt(span.textContent));
    numbers.sort((a, b) => a - b);
    cell.innerHTML = '';
    numbers.forEach(num => {
        const span = document.createElement('span');
        span.textContent = num.toString().padStart(2, '0') + ', ';
        span.addEventListener('dblclick', handleSpanDblClick);
        cell.appendChild(span);
    });
}

function handleTableBodyCellDblClick(e) {
    if (e.target.tagName === 'SPAN') {
        e.target.removeEventListener('dblclick', handleSpanDblClick);
        return;
    }
    createEditableInput(this, '00', true, function() {
        const span = document.createElement('span');
        span.textContent = this.value.padStart(2, '0') + ', ';
        span.addEventListener('dblclick', handleSpanDblClick);
        this.parentElement.appendChild(span);
        this.parentElement.removeChild(this);
        sortCellNumbers(this.parentElement);
    });
}

function handleTableHeaderCellDblClick() {
    createEditableInput(this, this.innerText, false, function() {
        const newHeader = this.value.trim() || 'Column 2';
        this.parentElement.innerText = newHeader;
    });
}

function handleSpanDblClick(e) {
    const cell = this.parentElement;
    const span = this;
    createEditableInput(cell, span.textContent.slice(0, -2), true, function() {
        span.textContent = this.value.padStart(2, '0') + ', ';
        cell.removeChild(this);
    });
    e.stopPropagation();
}
