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
const themeToggle = document.getElementById('theme-toggle');
const moonIcon = document.getElementById('moon-icon');
const sunIcon = document.getElementById('sun-icon');
const instrumentSelect = document.getElementById('instrument-select');

let audioCtx;
let activeOscillators = [];
let activeBtn = null;

// Initialize Audio Context on user interaction to comply with browser policies
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

// Load saved instrument
const savedInstrument = localStorage.getItem('instrument') || 'pure';
if (instrumentSelect) {
    instrumentSelect.value = savedInstrument;
    instrumentSelect.addEventListener('change', (e) => {
        localStorage.setItem('instrument', e.target.value);
    });
}

function playNote(freq, btn) {
    initAudio();
    stopNote(); // Stop any currently playing note just in case

    const instrument = instrumentSelect ? instrumentSelect.value : savedInstrument;
    const t = audioCtx.currentTime;

    const gainNode = audioCtx.createGain();
    gainNode.connect(audioCtx.destination);
    
    let oscillators = [];

    if (instrument === 'pure') {
        const osc = audioCtx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = freq;
        
        gainNode.gain.setValueAtTime(0, t);
        gainNode.gain.linearRampToValueAtTime(1.0, t + 0.05);
        
        osc.connect(gainNode);
        oscillators.push(osc);
    } else if (instrument === 'pipe') {
        // Classic pitch pipe: slightly reedy
        const osc1 = audioCtx.createOscillator();
        osc1.type = 'square';
        osc1.frequency.value = freq;
        
        const osc2 = audioCtx.createOscillator();
        osc2.type = 'triangle';
        osc2.frequency.value = freq;

        // Use a lowpass filter to tame the square wave harshness
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1200; // Mellow it out

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gainNode);
        
        // Attack is a bit slower for a reed instrument
        gainNode.gain.setValueAtTime(0, t);
        gainNode.gain.linearRampToValueAtTime(0.8, t + 0.1);

        oscillators.push(osc1, osc2);
    } else if (instrument === 'piano') {
        // Simple piano-like synth
        const osc1 = audioCtx.createOscillator();
        osc1.type = 'triangle';
        osc1.frequency.value = freq;

        const osc2 = audioCtx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.value = freq * 2; // Add an overtone

        osc1.connect(gainNode);
        osc2.connect(gainNode);

        // Piano envelope: fast attack, quick initial decay
        gainNode.gain.setValueAtTime(0, t);
        gainNode.gain.linearRampToValueAtTime(1.2, t + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.2, t + 1.5);

        oscillators.push(osc1, osc2);
    }

    oscillators.forEach(osc => osc.start(t));
    activeOscillators.push({ oscillators, gainNode });

    // Update UI
    btn.classList.add('active');
    activeBtn = btn;
}

function stopNote() {
    if (activeOscillators.length > 0) {
        const t = audioCtx.currentTime;
        activeOscillators.forEach(({ oscillators, gainNode }) => {
            // Quick fade out to avoid clicking
            gainNode.gain.cancelScheduledValues(t);
            // Read current gain value to ramp down from it smoothly
            const currentGain = gainNode.gain.value;
            gainNode.gain.setValueAtTime(currentGain, t);
            gainNode.gain.linearRampToValueAtTime(0, t + 0.1);
            
            oscillators.forEach(osc => {
                osc.stop(t + 0.1);
            });
        });
        activeOscillators = [];
    }
    
    if (activeBtn) {
        activeBtn.classList.remove('active');
        activeBtn = null;
    }
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
        
        // Mouse events
        btn.addEventListener('mousedown', (e) => {
            if (e.button === 0) playNote(note.freq, btn);
        });
        btn.addEventListener('mouseup', stopNote);
        btn.addEventListener('mouseleave', stopNote);

        // Touch events
        btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            playNote(note.freq, btn);
        });
        btn.addEventListener('touchend', (e) => {
            e.preventDefault();
            stopNote();
        });
        btn.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            stopNote();
        });

        pitchPipe.appendChild(btn);
    });
}

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

// Notes logic
const notesToggleBtn = document.getElementById('notes-toggle-btn');
const notesPanel = document.getElementById('notes-panel');
const notesTextarea = document.getElementById('notes-textarea');
const clearNotesBtn = document.getElementById('clear-notes-btn');
const mainContainer = document.getElementById('main-container');

// Load saved notes
const savedNotes = localStorage.getItem('setlist-notes') || '';
notesTextarea.value = savedNotes;

// Save notes on input
notesTextarea.addEventListener('input', (e) => {
    localStorage.setItem('setlist-notes', e.target.value);
});

// Toggle notes panel
function toggleNotes(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    document.body.classList.toggle('notes-open');
}

notesToggleBtn.addEventListener('click', toggleNotes);
notesToggleBtn.addEventListener('touchstart', toggleNotes);

// Close notes when clicking the background
mainContainer.addEventListener('click', (e) => {
    // Only close if we clicked the container itself or the pitch-pipe div directly (not a note button)
    if (document.body.classList.contains('notes-open') && (e.target === mainContainer || e.target.id === 'pitch-pipe')) {
        document.body.classList.remove('notes-open');
    }
});
mainContainer.addEventListener('touchstart', (e) => {
    if (document.body.classList.contains('notes-open') && (e.target === mainContainer || e.target.id === 'pitch-pipe')) {
        document.body.classList.remove('notes-open');
    }
});

// Clear button
clearNotesBtn.addEventListener('click', () => {
    notesTextarea.value = '';
    localStorage.removeItem('setlist-notes');
    notesTextarea.focus();
});
