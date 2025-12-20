// Store all selectable instances for external access
const selectableInstances = new Map();
let selectionOverlay = null;
let currentlySelected = null;

// Create the overlay element
function createSelectionOverlay() {
    if (selectionOverlay) return selectionOverlay;
    
    selectionOverlay = document.createElement('div');
    selectionOverlay.className = 'selection-overlay';
    selectionOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.3s ease, visibility 0.3s ease;
        z-index: 999;
        cursor: pointer;
    `;
    
    selectionOverlay.addEventListener('click', deselectCurrent);
    document.body.appendChild(selectionOverlay);
    
    return selectionOverlay;
}

function showOverlay() {
    if (!selectionOverlay) createSelectionOverlay();
    selectionOverlay.offsetHeight; // Force reflow
    selectionOverlay.style.opacity = '1';
    selectionOverlay.style.visibility = 'visible';
}

function hideOverlay() {
    if (selectionOverlay) {
        selectionOverlay.style.opacity = '0';
        selectionOverlay.style.visibility = 'hidden';
    }
}

function deselectCurrent() {
    if (!currentlySelected) return;
    
    const state = selectableInstances.get(currentlySelected.id || currentlySelected);
    if (state) {
        // Get current position (accounting for scale)
        const rect = currentlySelected.getBoundingClientRect();
        const scale = 1.1;
        const actualWidth = rect.width / scale;
        const actualHeight = rect.height / scale;
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const actualLeft = centerX - actualWidth / 2;
        const actualTop = centerY - actualHeight / 2;
        
        // Remove transform first
        currentlySelected.style.transform = state.originalTransform;
        currentlySelected.style.transition = 'transform 0.3s ease';
        
        // Move back to original parent
        if (state.originalParent) {
            if (state.originalNextSibling) {
                state.originalParent.insertBefore(currentlySelected, state.originalNextSibling);
            } else {
                state.originalParent.appendChild(currentlySelected);
            }
        }
        
        // Calculate position relative to new offset parent
        currentlySelected.style.position = state.originalPosition || 'absolute';
        
        const offsetParent = currentlySelected.offsetParent || document.body;
        const parentRect = offsetParent.getBoundingClientRect();
        
        currentlySelected.style.left = (actualLeft - parentRect.left + offsetParent.scrollLeft) + 'px';
        currentlySelected.style.top = (actualTop - parentRect.top + offsetParent.scrollTop) + 'px';
        currentlySelected.style.zIndex = state.originalZIndex;
        currentlySelected.classList.remove('selected');
        
        if (state.onDeselect) {
            state.onDeselect(currentlySelected);
        }
    }
    
    hideOverlay();
    currentlySelected = null;
}

function selectElement(selectable) {
    // Toggle selection if clicking the same element
    if (currentlySelected === selectable) {
        deselectCurrent();
        return;
    }
    
    // Deselect any currently selected element first
    if (currentlySelected) {
        deselectCurrent();
    }
    
    const state = selectableInstances.get(selectable.id || selectable);
    if (!state) return;
    
    // Store original DOM position
    state.originalParent = selectable.parentNode;
    state.originalNextSibling = selectable.nextSibling;
    state.originalPosition = selectable.style.position || '';
    state.originalTransform = selectable.style.transform || '';
    state.originalZIndex = selectable.style.zIndex || '';
    
    // Get current position before moving
    const rect = selectable.getBoundingClientRect();
    
    // Move to body AFTER the overlay so it appears on top
    document.body.appendChild(selectable);
    
    // Set to fixed positioning at current visual location
    selectable.style.position = 'fixed';
    selectable.style.left = rect.left + 'px';
    selectable.style.top = rect.top + 'px';
    selectable.style.zIndex = '1000';
    
    // Show overlay
    showOverlay();
    
    // Calculate center position
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const centerX = (viewportWidth - rect.width) / 2;
    const centerY = (viewportHeight - rect.height) / 2;
    
    // Force reflow before animating
    selectable.offsetHeight;
    
    // Animate to center with scale
    selectable.style.left = centerX + 'px';
    selectable.style.top = centerY + 'px';
    selectable.style.transform = 'scale(1.1)';
    selectable.classList.add('selected');
    
    currentlySelected = selectable;
    
    if (state.onSelect) {
        state.onSelect(selectable);
    }
}

function initializeSelectable(selectable) {
    const state = {
        onSelect: null,
        onDeselect: null,
        originalParent: null,
        originalNextSibling: null,
        originalPosition: '',
        originalTransform: '',
        originalZIndex: ''
    };
    
    selectableInstances.set(selectable.id || selectable, state);
    
    // Add transition for smooth animations
    const existingTransition = selectable.style.transition;
    selectable.style.transition = existingTransition 
        ? `${existingTransition}, transform 0.3s ease, left 0.3s ease, top 0.3s ease`
        : 'transform 0.3s ease, left 0.3s ease, top 0.3s ease';
    
    selectable.style.cursor = 'pointer';
    
    selectable.addEventListener('click', (e) => {
        if (e.defaultPrevented) return;
        selectElement(selectable);
    });
}

// Initialize all selectable elements
Array.from(document.getElementsByClassName("selectable")).forEach((selectable) => {
    initializeSelectable(selectable);
});

// Handle Escape key to deselect
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        deselectCurrent();
    }
});

// Create overlay on load
createSelectionOverlay();

// Helper function to register callbacks for a selectable element
function onSelectable(elementId, callbacks) {
    const state = selectableInstances.get(elementId);
    if (state) {
        if (callbacks.onSelect) state.onSelect = callbacks.onSelect;
        if (callbacks.onDeselect) state.onDeselect = callbacks.onDeselect;
    }
}

// Programmatic selection
function selectById(elementId) {
    const element = document.getElementById(elementId);
    if (element && selectableInstances.has(elementId)) {
        selectElement(element);
    }
}

// Check if an element is currently selected
function isSelected(elementOrId) {
    const element = typeof elementOrId === 'string' 
        ? document.getElementById(elementOrId) 
        : elementOrId;
    return currentlySelected === element;
}