const notes = [
    { name: 'C', freq: 261.63 },
    { name: 'C#', freq: 277.18 },
    { name: 'D', freq: 293.66 },
    { name: 'D#', freq: 311.13 },
    { name: 'E', freq: 329.63 },
    { name: 'F', freq: 349.23 },
    { name: 'F#', freq: 369.99 },
    { name: 'G', freq: 392.00 },
    { name: 'G#', freq: 415.30 },
    { name: 'A', freq: 440.00 },
    { name: 'A#', freq: 466.16 },
    { name: 'B', freq: 493.88 }
];

const pitchPipe = document.getElementById('pitch-pipe');
const stopBtn = document.getElementById('stop-btn');
const themeToggle = document.getElementById('theme-toggle');
const moonIcon = document.getElementById('moon-icon');
const sunIcon = document.getElementById('sun-icon');

let audioCtx;
let oscillator;
let gainNode;
let activeBtn = null;

// Initialize Audio Context on user interaction to comply with browser policies
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playNote(freq, btn) {
    initAudio();
    stopNote();

    oscillator = audioCtx.createOscillator();
    gainNode = audioCtx.createGain();

    oscillator.type = 'sine'; // A smooth tone, typical for pitch pipes
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);

    // Envelope to avoid clicking
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.05);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.start();

    // Update UI
    if (activeBtn) activeBtn.classList.remove('active');
    btn.classList.add('active');
    activeBtn = btn;
    stopBtn.style.display = 'block';
}

function stopNote() {
    if (oscillator && gainNode) {
        gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.1);
        oscillator.stop(audioCtx.currentTime + 0.1);
        oscillator = null;
    }
    if (activeBtn) {
        activeBtn.classList.remove('active');
        activeBtn = null;
    }
    stopBtn.style.display = 'none';
}

// Generate circular layout
function setupNotes() {
    const radius = 120; // Radius of the circle
    const centerX = 160; // Half of pitch-pipe width
    const centerY = 160; // Half of pitch-pipe height
    const totalNotes = notes.length;

    notes.forEach((note, index) => {
        // Start from top (-90 degrees or -PI/2)
        const angle = (index / totalNotes) * 2 * Math.PI - (Math.PI / 2);
        
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);

        const btn = document.createElement('button');
        btn.className = 'note-btn';
        btn.textContent = note.name;
        // Position relative to the container
        btn.style.left = `${x}px`;
        btn.style.top = `${y}px`;
        // Keep text upright, no rotation on the button itself needed since we used absolute left/top correctly
        
        btn.addEventListener('mousedown', () => playNote(note.freq, btn));
        btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            playNote(note.freq, btn);
        });

        pitchPipe.appendChild(btn);
    });
}

stopBtn.addEventListener('mousedown', stopNote);
stopBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    stopNote();
});

// Theme handling
function toggleTheme() {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    if (isDark) {
        document.body.removeAttribute('data-theme');
        moonIcon.style.display = 'none';
        sunIcon.style.display = 'block';
        localStorage.setItem('theme', 'light');
    } else {
        document.body.setAttribute('data-theme', 'dark');
        moonIcon.style.display = 'block';
        sunIcon.style.display = 'none';
        localStorage.setItem('theme', 'dark');
    }
}

themeToggle.addEventListener('click', toggleTheme);

// Load saved theme
const savedTheme = localStorage.getItem('theme');
const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
    document.body.setAttribute('data-theme', 'dark');
    moonIcon.style.display = 'block';
    sunIcon.style.display = 'none';
}

setupNotes();
