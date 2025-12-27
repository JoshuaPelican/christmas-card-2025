
// Motion Detection API
// Detects device motion and returns acceleration in x, y, z axes

const MotionAPI = {
  // Current acceleration data
  acceleration: { x: 0, y: 0, z: 0 },
  
  // Listener callback storage
  listeners: [],
  
  // Check if motion events are supported
  isSupported() {
	return 'DeviceMotionEvent' in window;
  },
  
  // Request permission (required for iOS 13+)
  async requestPermission() {
	if (typeof DeviceMotionEvent.requestPermission === 'function') {
	  try {
		const permission = await DeviceMotionEvent.requestPermission();
		return permission === 'granted';
	  } catch (error) {
		console.error('Permission request failed:', error);
		return false;
	  }
	}
	// Permission not needed on this device
	return true;
  },
  
  // Start listening to motion events
  start(callback) {
	if (!this.isSupported()) {
	  console.error('DeviceMotionEvent not supported');
	  return false;
	}
	
	const handler = (event) => {
	  // Get acceleration data (excludes gravity)
	  const accel = event.acceleration || { x: 0, y: 0, z: 0 };
	  
	  this.acceleration = {
		x: accel.x || 0,
		y: accel.y || 0,
		z: accel.z || 0
	  };
	  
	  // Call all registered listeners
	  this.listeners.forEach(fn => fn(this.acceleration));
	  
	  // Call provided callback if any
	  if (callback) callback(this.acceleration);
	};
	
	window.addEventListener('devicemotion', handler);
	this.handler = handler;
	return true;
  },
  
  // Stop listening to motion events
  stop() {
	if (this.handler) {
	  window.removeEventListener('devicemotion', this.handler);
	  this.handler = null;
	}
  },
  
  // Add a listener function
  addListener(callback) {
	this.listeners.push(callback);
  },
  
  // Remove a listener function
  removeListener(callback) {
	this.listeners = this.listeners.filter(fn => fn !== callback);
  },
  
  // Get current acceleration
  getAcceleration() {
	return { ...this.acceleration };
  }
};

// Example usage:
// 1. Check support
console.log('Motion supported:', MotionAPI.isSupported());

// 2. Request permission and start (iOS)
async function initMotion() {
  const granted = await MotionAPI.requestPermission();
  if (granted) {
	MotionAPI.start((data) => {
	  console.log(`X: ${data.x?.toFixed(2)}, Y: ${data.y?.toFixed(2)}, Z: ${data.z?.toFixed(2)}`);
	});
  }
}