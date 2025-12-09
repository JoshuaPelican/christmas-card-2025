// Store all selectables and their drag states
const selectables = new Map();

Array.from(document.getElementsByClassName("selectable")).forEach((selectable) => {
    initializeSelectable(selectable);
});

function initializeSelectable(selectable) {
    const state = {
        isDragging: false,
        offsetX: 0,
        offsetY: 0,
        lastX: 0,
        lastY: 0,
        velocityX: 0,
        velocityY: 0
    };

    // Set position style if not already set
    const computedStyle = window.getComputedStyle(selectable);
    if (computedStyle.position === 'static') {
        selectable.style.position = 'absolute';
    }

    // Initialize position if not set
    if (!selectable.style.left) {
        selectable.style.left = 130 + 'px';
    }
    if (!selectable.style.top) {
        selectable.style.top = 130 + 'px';
    }

    selectables.set(selectable, state);

    function handleStart(e) {
        const pos = getEventPosition(e);
        
        state.isDragging = true;
        state.offsetX = pos.x - 130;
        state.offsetY = pos.y - 130;
        state.lastX = pos.x;
        state.lastY = pos.y;
        state.velocityX = 0;
        state.velocityY = 0;

        selectable.style.cursor = 'grabbing';
        
        // Don't prevent default - let other handlers work
        e.stopPropagation();
    }

    function handleMove(e) {
        if (!state.isDragging) return;

        const pos = getEventPosition(e);
        const newLeft = pos.x - state.offsetX;
        const newTop = pos.y - state.offsetY;

        // Calculate velocity for shake effect
        state.velocityX = pos.x - state.lastX;
        state.velocityY = pos.y - state.lastY;

        selectable.style.left = newLeft + 'px';
        selectable.style.top = newTop + 'px';

        state.lastX = pos.x;
        state.lastY = pos.y;

        // Dispatch custom event for other scripts to listen to
        selectable.dispatchEvent(new CustomEvent('selectableDrag', {
            detail: {
                deltaX: state.velocityX,
                deltaY: state.velocityY,
                x: pos.x,
                y: pos.y
            }
        }));

        e.stopPropagation();
    }

    function handleEnd(e) {
        if (!state.isDragging) return;
        
        state.isDragging = false;
        selectable.style.cursor = 'grab';

        // Dispatch end event
        selectable.dispatchEvent(new CustomEvent('selectableDragEnd', {
            detail: {
                velocityX: state.velocityX,
                velocityY: state.velocityY
            }
        }));
    }

    function getEventPosition(e) {
        if (e.touches && e.touches.length > 0) {
            return { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
        return { x: e.clientX, y: e.clientY };
    }

    // Mouse events
    selectable.addEventListener('mousedown', handleStart);
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);

    // Touch events
    selectable.addEventListener('touchstart', handleStart, { passive: true });
    document.addEventListener('touchmove', handleMove, { passive: true });
    document.addEventListener('touchend', handleEnd);
    document.addEventListener('touchcancel', handleEnd);

    // Prevent context menu
    selectable.addEventListener('contextmenu', (e) => e.preventDefault());
}

// Export function to get drag state of a selectable
function getSelectableState(selectable) {
    return selectables.get(selectable);
}