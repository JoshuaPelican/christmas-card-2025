const blurOverlay = document.getElementById("blur-overlay");
let currentlySelected = null;

// Initialize all selectable elements
Array.from(document.getElementsByClassName("selectable")).forEach((selectable) => {
    initializeSelectable(selectable);
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        unselectElement(currentlySelected);
    }
});

blurOverlay.addEventListener('mousedown', (e) =>{
    unselectElement(currentlySelected);
});


function initializeSelectable(element){
    element.addEventListener("mousedown", (e) =>{
        if(element != currentlySelected)
            selectElement(element);
    })
}

function selectElement(element){
    const rect = element.getBoundingClientRect();

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const translateX = centerX - (rect.left + (rect.width / 2));
    const translateY = centerY - (rect.top + (rect.height / 2));

    element.style.position = 'relative';
    element.style.zIndex = '1000';
    element.style.transform = `translate(${translateX}px, ${translateY}px) scale(2)`;
    element.classList.add('selected');
    currentlySelected = element;

    blurOverlay.offsetHeight;
    blurOverlay.classList.remove('hidden');
}

function unselectElement(element){
    if(element == null)
        return;

    element.style.transform = '';
    element.style.zIndex = '0';
    element.classList.remove('selected');

    currentlySelected = null;

    blurOverlay.classList.add('hidden');
}