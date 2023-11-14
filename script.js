document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('table td:nth-child(2)').forEach(cell => {
        cell.addEventListener('dblclick', function() {
            const input = document.createElement('input');
            input.type = 'number';
            input.min = 0;
            input.max = 59;
            input.style.width = '100%';
            input.value = this.innerText || '00';
            this.innerText = '';
            this.appendChild(input);
            input.focus();

            input.addEventListener('blur', function() {
                cell.innerText = this.value.padStart(2, '0');
            });

            input.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    this.blur();
                }
            });
        });
    });
});
