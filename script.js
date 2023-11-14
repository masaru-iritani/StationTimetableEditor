document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('table td:nth-child(2)').forEach(cell => {
        cell.addEventListener('dblclick', function(e) {
            if (e.target !== this) return;
            const input = document.createElement('input');
            input.type = 'number';
            input.min = 0;
            input.max = 59;
            input.style.width = '100%';
            input.value = '00';
            this.appendChild(input);
            input.focus();

            input.addEventListener('blur', function() {
                const span = document.createElement('span');
                span.textContent = this.value.padStart(2, '0') + ', ';
                cell.insertBefore(span, this);
                cell.removeChild(this);
            });

            input.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    this.blur();
                }
            });
        });
    });
});
