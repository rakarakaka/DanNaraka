// --- 1. Scroll Reveal Animation ---
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
};

const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

document.querySelectorAll('.reveal-on-scroll').forEach((el) => {
    observer.observe(el);
});

// --- 1b. Gallery Show More Toggle ---
const galleryToggle = document.getElementById('gallery-toggle');
if (galleryToggle) {
    const hiddenItems = Array.from(document.querySelectorAll('.gallery-item--hidden'));
    let expanded = false;

    const updateGalleryToggle = () => {
        hiddenItems.forEach((item) => {
            item.classList.toggle('gallery-item--hidden', !expanded);
        });
        galleryToggle.textContent = expanded ? 'Show less' : 'Show more';
        galleryToggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    };

    galleryToggle.addEventListener('click', () => {
        expanded = !expanded;
        updateGalleryToggle();

        if (!expanded) {
            const gallerySection = document.getElementById('gallery');
            if (gallerySection) {
                gallerySection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    });

    updateGalleryToggle();
}

// --- 2. Three.js 3D Viewer Implementation ---

let scene, camera, renderer, currentMesh;
let isDragging = false;
let previousMousePosition = {
    x: 0,
    y: 0
};
const container = document.getElementById('canvas-container');

function initThreeJS() {
    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a); // Dark gray background

    // Fog for depth
    scene.fog = new THREE.FogExp2(0x0a0a0a, 0.03);

    // Camera
    camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.z = 5;

    // Renderer
    renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
    directionalLight.position.set(1, 1, 2);
    scene.add(directionalLight);

    const backLight = new THREE.DirectionalLight(0xffffff, 1.8);
    backLight.position.set(-1, 0, -2); // From behind and left
    scene.add(backLight);

    // Initial Model
    loadModel('cube');

    // Event Listeners for Interaction
    container.addEventListener('mousedown', (e) => {
        isDragging = true;
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
    });

    // --- MOUSE MOVE FOR ROTATION AND PANNING (SHIFT KEY) ---
    container.addEventListener('mousemove', (e) => {
        if (isDragging && currentMesh) {
            const deltaMove = {
                x: e.offsetX - previousMousePosition.x,
                y: e.offsetY - previousMousePosition.y
            };

            const sensitivity = 0.005;

            // Check for Shift key to enable Panning (moving the object side-to-side/up-down)
            if (e.shiftKey) {
                // Panning (Translation)
                currentMesh.position.x += deltaMove.x * sensitivity * 2.5;
                currentMesh.position.y -= deltaMove.y * sensitivity * 2.5;
            } else {
                // Standard Rotation (Default interaction)
                currentMesh.rotation.y += deltaMove.x * sensitivity;
                currentMesh.rotation.x += deltaMove.y * sensitivity;
            }
        }

        previousMousePosition = {
            x: e.offsetX,
            y: e.offsetY
        };
    });

    // --- ZOOM (WHEEL EVENT) ---
    container.addEventListener('wheel', (e) => {
        e.preventDefault(); // Prevent page scroll when zooming

        // Adjust camera position based on scroll direction
        // DeltaY is negative when scrolling up (zoom in), positive when scrolling down (zoom out)
        camera.position.z += e.deltaY * 0.005;

        // Clamp zoom to prevent going too far in or out (e.g., between 2 and 10)
        camera.position.z = Math.max(2, Math.min(10, camera.position.z));

        // Force render update after interaction
        renderer.render(scene, camera);
    });


    // Handle Resize
    window.addEventListener('resize', onWindowResize, false);

    // Start Loop
    animate();
}

// Function to switch models
// NOTE: This is where you would load external .obj or .gltf files
function loadModel(type) {
    if (currentMesh) {
        scene.remove(currentMesh);
    }

    let geometry, material;

    // Wireframe Material style
    material = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        wireframe: true,
        transparent: true,
        opacity: 0.8
    });

    // Solid material for contrast
    const solidMaterial = new THREE.MeshPhongMaterial({
        color: 0x111111,
        flatShading: true,
        shininess: 100
    });

    if (type === 'plushie') {
        // Initialize the Loader
        const loader = new THREE.GLTFLoader();

        // Load your file (Make sure the file is in the same folder as your HTML)
        loader.load('3Dasset/bangboo shork.glb', function(gltf) {
            if (currentMesh) {
                scene.remove(currentMesh);
            }

            currentMesh = gltf.scene;

            currentMesh.scale.set(1, 1, 1);
            currentMesh.position.y = -1;

            scene.add(currentMesh);
        });

    } else if (type === 'vendingmachine') {
        // Initialize the Loader
        const loader = new THREE.GLTFLoader();

        // Load your file (Make sure the file is in the same folder as your HTML)
        loader.load('3Dasset/vendmach.glb', function(gltf) {
            if (currentMesh) {
                scene.remove(currentMesh);
            }

            currentMesh = gltf.scene;

            currentMesh.scale.set(1, 1, 1);
            currentMesh.position.y = -1;

            scene.add(currentMesh);
        });


    } else if (type === 'shirt') {
        const loader = new THREE.GLTFLoader();
        loader.load('3Dasset/CropTop.glb', function(gltf) {

            // 1. Clear previous
            if (currentMesh) scene.remove(currentMesh);

            currentMesh = gltf.scene;

            // 2. THE FIX: Reset Material Settings
            currentMesh.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = false;
                    child.receiveShadow = false;

                    const mat = child.material;

                    if (mat) {
                        mat.vertexColors = false;
                        mat.metalness = 0.0; // cloth
                        mat.roughness = 0.9; // cloth
                        mat.side = THREE.DoubleSide;
                        mat.needsUpdate = true;

                        if (mat.map) {
                            mat.map.anisotropy = renderer.capabilities.getMaxAnisotropy();
                            mat.map.flipY = false; // VERY IMPORTANT
                            mat.map.needsUpdate = true;
                        }
                    }
                }
            });

            currentMesh.scale.set(1, 1, 1);
            currentMesh.position.y = -1;
            scene.add(currentMesh);

        }, undefined, function(error) {
            console.error('Error:', error);
        });

    } else if (type === 'noodle') {
        // Initialize the Loader
        const loader = new THREE.GLTFLoader();

        // Load your file (Make sure the file is in the same folder as your HTML)
        loader.load('3Dasset/indomifinal.glb', function(gltf) {
            if (currentMesh) {
                scene.remove(currentMesh);
            }

            currentMesh = gltf.scene;

            currentMesh.scale.set(1, 1, 1);
            currentMesh.position.y = -1;

            scene.add(currentMesh);
        });

        // Note: We don't use 'geometry' or 'material' variables here 
        // because the GLB file has its own colors and shapes inside it.
    }

    // *** HOW TO ADD YOUR OWN ASSETS ***
    // 1. Uncomment the GLTFLoader script in <head>
    // 2. Use the following code:
    /*
    const loader = new THREE.GLTFLoader();
    loader.load('path/to/your/model.gltf', function (gltf) {
        currentMesh = gltf.scene;
        scene.add(currentMesh);
    });
    */

    scene.add(currentMesh);
}

// Global function to be called from HTML buttons
window.changeModel = function(type) {
    loadModel(type);
}

function onWindowResize() {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

function animate() {
    requestAnimationFrame(animate);
    if (currentMesh) {
        currentMesh.rotation.y += 0.002;
    }
    renderer.render(scene, camera);
}

// Initialize 3D when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initThreeJS();
    const video = document.querySelector('[data-autoplay]');
    if (video) {
        const tryPlay = () => {
            const playAttempt = video.play();
            if (playAttempt && typeof playAttempt.catch === 'function') {
                playAttempt.catch(() => {});
            }
        };

        // Ensure browser autoplay rules are satisfied.
        video.muted = true;
        video.setAttribute('muted', '');
        video.setAttribute('autoplay', '');
        video.setAttribute('playsinline', '');
        video.autoplay = true;

        // Try on load and when media can play.
        tryPlay();
        video.addEventListener('loadeddata', tryPlay);
        video.addEventListener('canplay', tryPlay);

        const videoObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    tryPlay();
                }
            });
        }, { threshold: 0.5 });

        videoObserver.observe(video);

        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                tryPlay();
            }
        });

        // Autoplay can still require a user gesture; retry on first interaction.
        const resumeOnInteract = () => {
            tryPlay();
            window.removeEventListener('click', resumeOnInteract);
            window.removeEventListener('touchstart', resumeOnInteract);
            window.removeEventListener('scroll', resumeOnInteract);
            window.removeEventListener('keydown', resumeOnInteract);
        };
        window.addEventListener('click', resumeOnInteract, { once: true });
        window.addEventListener('touchstart', resumeOnInteract, { once: true });
        window.addEventListener('scroll', resumeOnInteract, { once: true });
        window.addEventListener('keydown', resumeOnInteract, { once: true });
    }
});
