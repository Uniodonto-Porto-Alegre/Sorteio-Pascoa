document.addEventListener('DOMContentLoaded', function() {
    const items = [
        "Fio Card",
        "Bloco de notas",
        "Caneta",
        "Kit odontológico",
        "Uniodonto Experience"
    ];
    
    const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'];
    const wheel = document.getElementById('roulette-wheel');
    const spinBtn = document.getElementById('spin-btn');
    const resultDisplay = document.getElementById('result');
    
    // Criar os segmentos da roleta
    function createWheel() {
        const segmentAngle = 360 / items.length;
        
        items.forEach((item, index) => {
            const segment = document.createElement('div');
            segment.className = 'roulette-segment';
            segment.style.transform = `rotate(${index * segmentAngle}deg)`;
            segment.style.backgroundColor = colors[index % colors.length];
            segment.style.clipPath = `polygon(50% 50%, 50% 0%, ${50 + 50 * Math.tan((segmentAngle * Math.PI) / 360)}% 0%)`;
            
            const text = document.createElement('span');
            text.className = 'roulette-text';
            text.textContent = item;
            text.style.transform = `rotate(${segmentAngle / 2}deg) translate(0, -70px)`;
            text.style.transformOrigin = '0 0';
            
            segment.appendChild(text);
            wheel.appendChild(segment);
        });
    }
    
    // Girar a roleta
    function spinWheel() {
        spinBtn.disabled = true;
        resultDisplay.textContent = '';
        
        const spins = 5; // Número de voltas completas
        const randomAngle = Math.floor(Math.random() * 360);
        const totalAngle = (spins * 360) + randomAngle;
        
        wheel.style.transition = 'transform 5s cubic-bezier(0.17, 0.85, 0.32, 0.98)';
        wheel.style.transform = `rotate(${totalAngle}deg)`;
        
        setTimeout(() => {
            const segmentAngle = 360 / items.length;
            const normalizedAngle = (360 - (totalAngle % 360)) % 360;
            const winningIndex = Math.floor(normalizedAngle / segmentAngle);
            
            resultDisplay.textContent = `Parabéns! Você ganhou: ${items[winningIndex]}`;
            spinBtn.disabled = false;
        }, 5000);
    }
    
    // Resetar a roleta após animação
    wheel.addEventListener('transitionend', () => {
        wheel.style.transition = 'none';
        const currentRotation = parseInt(wheel.style.transform.replace('rotate(', '').replace('deg)', '')) % 360;
        wheel.style.transform = `rotate(${currentRotation}deg)`;
        setTimeout(() => {
            wheel.style.transition = 'transform 5s cubic-bezier(0.17, 0.85, 0.32, 0.98)';
        }, 10);
    });
    
    spinBtn.addEventListener('click', spinWheel);
    
    // Inicializar a roleta
    createWheel();
});