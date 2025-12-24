// Store all draggable instances for external access
const draggableInstances = new Map();

Array.from(document.getElementsByClassName("draggable")).forEach((draggable) => {
    initializeDraggable(draggable);
});


flo

function initializeDraggable(element){
    element.addEventListener("pointerdown", (e) =>{
        const pointPos = getPointerPosition(e);
        const rect = element.getBoundingClientRect();
        
        
        element.style.cursor = 'grabbing';

    });
    element.addEventListener("pointerdown", (e) =>{
    });
    element.addEventListener("pointerdown", (e) =>{
    });
}


function handleStart(e) {
    const pos = getPointerPosition(e);
    const rect = draggable.getBoundingClientRect();
    
    state.startX = pos.x;
    state.startY = pos.y;
    // Use getBoundingClientRect for accurate position with transforms
    state.offsetX = pos.x - rect.left;
    state.offsetY = pos.y - rect.top;
    state.lastX = pos.x;
    state.lastY = pos.y;

    draggable.style.cursor = 'grabbing';

    if (e.pointerId !== undefined) {
        draggable.setPointerCapture(e.pointerId);
    }

    if (state.onStart) {
        state.onStart(pos.x, pos.y);
    }

    e.preventDefault();
}

function handleMove(e) {
    if (!state.isDragging) return;

    const pos = getPointerPosition(e);
    
    const deltaX = pos.x - state.lastX;
    const deltaY = pos.y - state.lastY;

    // Account for scale transform (1.1x) - adjust offset
    const scale = 1.1;
    const adjustedOffsetX = state.offsetX / scale;
    const adjustedOffsetY = state.offsetY / scale;

    draggable.style.transform = `translate(${pos.x - adjustedOffsetX}px, ${pos.y - adjustedOffsetY}px)`;

    // Check if we've moved enough to count as a drag
    const totalMove = Math.abs(pos.x - state.startX) + Math.abs(pos.y - state.startY);
    if (totalMove > 5) {
        state.didDrag = true;
    }

    if (state.onMove) {
        state.onMove(deltaX, deltaY, pos.x, pos.y);
    }

    state.lastX = pos.x;
    state.lastY = pos.y;

    e.preventDefault();
}

function handleEnd(e) {
    if (!state.isDragging) return;
    state.isDragging = false;
    
    draggable.style.cursor = '';

    if (state.onEnd) {
        state.onEnd();
    }
}

function getPointerPosition(e) {
    if (e.touches && e.touches.length > 0) {
        return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
}

draggable.addEventListener('pointerdown', handleStart);
draggable.addEventListener('pointermove', handleMove);
draggable.addEventListener('pointerup', handleEnd);
draggable.addEventListener('pointercancel', handleEnd);
draggable.addEventListener('lostpointercapture', handleEnd);

// Prevent click propagation if we actually dragged
draggable.addEventListener('click', (e) => {
    if (state.didDrag) {
        e.stopPropagation();
        state.didDrag = false;
    }
}, true);

draggable.addEventListener('contextmenu', (e) => e.preventDefault());
draggable.setAttribute('draggable', 'false');


// Helper function to register callbacks for a draggable element
function onDraggableDrag(elementId, callbacks) {
    const state = draggableInstances.get(elementId);
    if (state) {
        if (callbacks.onMove) state.onMove = callbacks.onMove;
        if (callbacks.onStart) state.onStart = callbacks.onStart;
        if (callbacks.onEnd) state.onEnd = callbacks.onEnd;
    }
}