// Configuration
const CONFIG = {
    particleCount: 200,
    gravity: 0.015,
    minSize: 2,
    maxSize: 5,
    globeRadius: 130,
    globeCenterX: 150,
    globeCenterY: 150,
    
    // Swirl settings
    swirlStrength: 0.09,
    swirlDecayRate: 0.999,
    
    // Motion sensitivity
    motionMultiplier: 0.25,
    
    // Settling settings
    groundLevel: 280,
    settleThreshold: 0.1,
    groundFriction: 1,
    airFriction: 0.985,
    restThreshold: 0.01
};

// State
let particles = [];
let swirlEnergy = 0;
let lastMotion = { x: 0, y: 0, z: 0 };

// DOM elements
const container = document.getElementById('snowGlobe');
const snowContainerFront = document.getElementById('snowContainerFront');
const snowContainerBack = document.getElementById('snowContainerBack');

// Initialize particles at rest at the bottom
function createParticles() {
    snowContainerFront.innerHTML = '';
    snowContainerBack.innerHTML = '';
    particles = [];

    for (let i = 0; i < CONFIG.particleCount; i++) {
        const spreadX = (Math.random() - 0.5) * CONFIG.globeRadius * 1.6;
        const baseY = CONFIG.groundLevel;
        const stackHeight = Math.random() * 20 * (1 - Math.abs(spreadX) / CONFIG.globeRadius);
        
        const particle = {
            x: CONFIG.globeCenterX + spreadX,
            y: baseY - stackHeight,
            vx: 0,
            vy: 0,
            size: CONFIG.minSize + Math.random() * (CONFIG.maxSize - CONFIG.minSize),
            opacity: 0.6 + Math.random() * 0.4,
            mass: 0.5 + Math.random() * 0.5,
            isResting: true,
            swirlOffset: Math.random() * Math.PI * 2
        };

        constrainToGlobe(particle);

        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('r', particle.size);
        circle.setAttribute('fill', 'white');
        circle.setAttribute('opacity', particle.opacity);
        
        particle.element = circle;
        particles.push(particle);
        
        Math.random() > 0.5 ? snowContainerFront.appendChild(circle) : snowContainerBack.appendChild(circle);
        
        updateParticlePosition(particle);
    }
}

function isAtGround(particle) {
    const dx = particle.x - CONFIG.globeCenterX;
    const maxRadius = CONFIG.globeRadius - particle.size;
    const groundAtX = CONFIG.globeCenterY + Math.sqrt(Math.max(0, maxRadius * maxRadius - dx * dx));
    return particle.y >= groundAtX - 3;
}

function getGroundY(x, particleSize) {
    const dx = x - CONFIG.globeCenterX;
    const maxRadius = CONFIG.globeRadius - particleSize;
    const radiusSquared = maxRadius * maxRadius;
    const dxSquared = dx * dx;
    
    if (dxSquared >= radiusSquared) {
        return CONFIG.globeCenterY;
    }
    
    return CONFIG.globeCenterY + Math.sqrt(radiusSquared - dxSquared) - 2;
}

function constrainToGlobe(particle) {
    const dx = particle.x - CONFIG.globeCenterX;
    const dy = particle.y - CONFIG.globeCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxDist = CONFIG.globeRadius - particle.size - 1;
    
    if (distance > maxDist) {
        const angle = Math.atan2(dy, dx);
        particle.x = CONFIG.globeCenterX + Math.cos(angle) * maxDist;
        particle.y = CONFIG.globeCenterY + Math.sin(angle) * maxDist;
        
        const normalX = dx / distance;
        const normalY = dy / distance;
        const dotProduct = particle.vx * normalX + particle.vy * normalY;
        
        if (dotProduct > 0) {
            particle.vx -= 1.8 * dotProduct * normalX;
            particle.vy -= 1.8 * dotProduct * normalY;
            particle.vx *= 0.3;
            particle.vy *= 0.3;
        }
    }
}

function updateParticlePosition(particle) {
    particle.element.setAttribute('cx', particle.x);
    particle.element.setAttribute('cy', particle.y);
}

function handleMotion(motion) {
    // Calculate motion intensity
    const moveIntensity = Math.sqrt(motion.x * motion.x + motion.y * motion.y);
    
    // Add to swirl energy
    swirlEnergy = Math.min(swirlEnergy + moveIntensity * 0.1, 10);
    
    // Apply motion to particles
    particles.forEach(particle => {
        if (moveIntensity > 0.5) {
            particle.isResting = false;
        }
        
        // Apply acceleration (x affects horizontal, y affects vertical)
        const disturbFactor = CONFIG.motionMultiplier * (0.5 + Math.random() * 0.5);
        particle.vx += motion.x * disturbFactor;
        particle.vy += motion.y * disturbFactor;
        
        // Add some upward kick for strong movements
        if (moveIntensity > 2) {
            particle.vy -= moveIntensity * 0.1 * Math.random();
        }
    });
    
    lastMotion = motion;
}

function updatePhysics() {
    swirlEnergy *= CONFIG.swirlDecayRate;

    particles.forEach(particle => {
        const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
        const atGround = isAtGround(particle);
        
        if (atGround && speed < CONFIG.restThreshold && swirlEnergy < 0.1) {
            particle.isResting = true;
            particle.vx = 0;
            particle.vy = 0;
            const groundY = getGroundY(particle.x, particle.size);
            particle.y = groundY;
            updateParticlePosition(particle);
            return;
        }
        
        particle.isResting = false;

        // Swirl effect
        const distFromCenter = Math.sqrt(
            Math.pow(particle.x - CONFIG.globeCenterX, 2) + 
            Math.pow(particle.y - CONFIG.globeCenterY, 2)
        );
        
        const swirlFactor = swirlEnergy * CONFIG.swirlStrength * (distFromCenter / CONFIG.globeRadius);
        const angleToCenter = Math.atan2(
            particle.y - CONFIG.globeCenterY,
            particle.x - CONFIG.globeCenterX
        );
        
        const tangentX = -Math.sin(angleToCenter + particle.swirlOffset);
        const tangentY = Math.cos(angleToCenter + particle.swirlOffset);
        
        particle.vx += tangentX * swirlFactor * 0.1;
        particle.vy += tangentY * swirlFactor * 0.1;
        particle.vx += (Math.random() - 0.5) * swirlEnergy * 0.05;
        particle.vy += (Math.random() - 0.5) * swirlEnergy * 0.05;
        
        // Gravity
        particle.vy += CONFIG.gravity * particle.mass;

        // Friction
        if (atGround) {
            particle.vx *= CONFIG.groundFriction;
            particle.vy *= CONFIG.groundFriction;
            
            if (speed < CONFIG.settleThreshold) {
                particle.vx *= 0.8;
                particle.vy *= 0.8;
            }
            
            if (particle.vy > 0 && particle.vy < 0.5) {
                particle.vy = 0;
                const groundY = getGroundY(particle.x, particle.size);
                particle.y = groundY;
            }
        } else {
            particle.vx *= CONFIG.airFriction;
            particle.vy *= CONFIG.airFriction;
        }

        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;

        constrainToGlobe(particle);

        // Ground check
        if (isAtGround(particle) && particle.vy >= 0) {
            const groundY = getGroundY(particle.x, particle.size);
            if (particle.y > groundY) {
                particle.y = groundY;
                if (Math.abs(particle.vy) < 1) {
                    particle.vy = 0;
                } else {
                    particle.vy *= -0.2;
                }
            }
        }

        updateParticlePosition(particle);
    });

    requestAnimationFrame(updatePhysics);
}

// Initialize motion detection
async function initMotion() {
    if (!MotionAPI.isSupported()) {
        console.log('Motion not supported on this device');
        return;
    }
    
    const granted = await MotionAPI.requestPermission();
    if (granted) {
        MotionAPI.start(handleMotion);
        console.log('Motion detection started');
    } else {
        console.log('Motion permission denied');
    }
}

// Initialize
createParticles();
updatePhysics();

// Start motion detection (may need user interaction on iOS)
if (MotionAPI.isSupported()) {
    // Try to start immediately
    initMotion().catch(() => {
        // If it fails, wait for user interaction
        console.log('Tap screen to enable motion');
        document.addEventListener('click', () => {
            initMotion();
        }, { once: true });
    });
}