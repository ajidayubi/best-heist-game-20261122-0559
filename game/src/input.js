// input.js — keyboard state and mouse clicks, plus the E interact, R restart
// and M mute keys. Coordinates are converted to canvas space.
const INPUT = {
  keys: { left: false, right: false, up: false, down: false },
  interactHeld: false,
  muted: false,
  click: null, // {x, y} consumed by the game loop
  anyKeyPressed: false,
};

function bindInput(canvas, callbacks) {
  const keyMap = {
    ArrowLeft: 'left', KeyA: 'left',
    ArrowRight: 'right', KeyD: 'right',
    ArrowUp: 'up', KeyW: 'up',
    ArrowDown: 'down', KeyS: 'down',
  };
  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    INPUT.anyKeyPressed = true;
    const dir = keyMap[event.code];
    if (dir) {
      INPUT.keys[dir] = true;
      event.preventDefault();
      return;
    }
    if (event.code === 'KeyE') INPUT.interactHeld = true;
    if (event.code === 'KeyR' && callbacks.onRestart) callbacks.onRestart();
    if (event.code === 'KeyM') {
      INPUT.muted = !INPUT.muted;
      if (callbacks.onMute) callbacks.onMute(INPUT.muted);
    }
    if (callbacks.onAnyKey) callbacks.onAnyKey();
  });
  window.addEventListener('keyup', (event) => {
    const dir = keyMap[event.code];
    if (dir) INPUT.keys[dir] = false;
    if (event.code === 'KeyE') INPUT.interactHeld = false;
  });
  canvas.addEventListener('mousedown', (event) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    INPUT.click = {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
    if (callbacks.onAnyKey) callbacks.onAnyKey();
  });
}
