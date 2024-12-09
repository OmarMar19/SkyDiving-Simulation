// Import necessary modules
import { GLTFLoader } from "./GLTFLoader.js";
import { OrbitControls } from "./OrbitControls.js";

// Create the scene, camera, and renderer
var scene = new THREE.Scene(); // Represents the 3D scene
var camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 1000); // Represents the camera for viewing the scene
var renderer = new THREE.WebGLRenderer(); // Responsible for rendering the scene
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement); // Append the renderer's DOM element to the document

// Set initial camera position
camera.position.set(0, 0, 150);

// Create OrbitControls for camera interaction
var controls = new OrbitControls(camera, renderer.domElement);

// Set the background color of the scene
scene.background = new THREE.Color(0x000000);

// Add a HemisphereLight for lighting
var light = new THREE.HemisphereLight(0xffffff, 0x000000, 1);
scene.add(light);

// Create a GLTFLoader instance for loading 3D models
var loader = new GLTFLoader();

// Declare variables for models and simulation parameters
var character; // Represents the character model
var parachute; // Represents the parachute model
var plane; // Represents the plane model
var terrain; // Represents the terrain model
var sky; // Represents the sky model
var isFalling = false; // Indicates whether the character is falling or not

var params = {
    playerMass: 75, // كتلة اللاعب
    gravity: 9.81, // التسارع الناتج عن الجاذبية
    parachuteSurfaceArea: calculateParachuteSurfaceArea(), // مساحة سطح المظلة (م^2)
    parachuteMass: 15, // كتلة المظلة
    speed: 0, // سرعة الرياح
    planespeed: 100 // سرعة الطائرة (م/ث)
};

// Create a dat.GUI instance for parameter control
var gui = new dat.GUI();
gui.add(params, "planespeed", 100, 400).step(0.1).onChange(updatePlaneSpeed);
gui.add(params, "playerMass", 40, 150).step(0.1).onChange(updatePlayerMass);
gui.add(params, "speed", -40, 40).step(0.1).onChange(updateWindSpeed);
gui.add(params, "parachuteMass", 15, 50).step(0.1).onChange(updateParachuteMass);
gui.add(params, "parachuteSurfaceArea", 10, 200).step(0.1).onChange(updateParachuteSurfaceArea);

// تهيئة المتغيرات والثوابت للمحاكاة
var windSpeed = 0; // قيمة سرعة الرياح
var parachuteSurfaceArea = params.parachuteSurfaceArea; // مساحة سطح المظلة
var parachuteMass = params.parachuteMass; // كتلة المظلة
var playerMass = params.playerMass; // كتلة اللاعب
var combinedMass = playerMass + parachuteMass; // الكتلة المجمعة الأولية هي نفس كتلة اللاعب
var g = params.gravity; // التسارع الناتج عن الجاذبية
var k = 0.25; // معامل المقاومة الهوائية
var p = 1.225; // كثافة الهواء (كجم/م^3)
var planeSpeed = params.planespeed; // سرعة الطائرة
var deltaT = 0.01;// حساب التغير بالزمن


var planeS = document.getElementById("planeSound");
var windS = document.getElementById("windSound");
var ps = document.getElementById("pSound");
var lnd = document.getElementById("land");
var fall = document.getElementById("fall");
function playPlaneSound() {
    planeS.play();
}
function playWindSound() {
    windS.play();
}
function playParachuteSound() {
    ps.play();
}
function playLandingSound() {
    lnd.play();
}
function playFallingSound() {
    fall.play();
}
// Update the plane's speed based on the GUI control value
function updatePlaneSpeed() {
    planeSpeed = params.planespeed; // Update the plane's speed with the value from the GUI
}
// Update the wind speed based on the GUI control value
function updateWindSpeed() {
    var totalMass = playerMass + parachuteMass; // حساب الكتلة الإجمالية ككتلة اللاعب في البداية


    var speedInKmph = params.speed; // الحصول على قيمة السرعة بالكيلومترات في الساعة
    var speedInMps = speedInKmph * 1000 / 3600; // تحويل الكيلومترات في الساعة إلى أمتار في الثانية
    windSpeed = speedInMps * Math.sqrt(playerMass / totalMass); // ضبط سرعة الرياح استنادًا إلى نسبة الكتلة
}
// Update the combined mass based on the current falling state and player/parachute masses
function updateCombinedMass() {

    // إذا كانت الشخصية تسقط، حدث الكتلة المجمعة لتشمل كتلة اللاعب والمظلة
    combinedMass = playerMass + parachuteMass;

}
// Update the player's mass and recalculate the combined mass
function updatePlayerMass() {
    playerMass = params.playerMass; // Update the player's mass with the value from the GUI
    updateCombinedMass(); // Recalculate the combined mass
}
// Update the parachute's mass and recalculate the combined mass
function updateParachuteMass() {
    parachuteMass = params.parachuteMass; // Update the parachute's mass with the value from the GUI
    updateCombinedMass(); // Recalculate the combined mass
}
function updateParachuteSurfaceArea() {
    parachuteSurfaceArea = params.parachuteSurfaceArea; // Update the parachute's mass with the value from the GUI
}

// Load the terrain model
function loadTerrainModel() {
    loader.load(
        "assets/4/terrain.gltf",
        function (gltf) {
            terrain = gltf.scene;
            terrain.traverse(function (child) {
                if (child.isMesh) {
                    child.scale.set(1, 1, 1);
                    child.position.set(0, 0, 0);
                }
            });
            scene.add(terrain);
            terrain.scale.set(10, 1, 10);
            terrain.position.set(-500, -1000, -50);
        }
    );
}

// Load the sky model
function loadSkyModel() {
    loader.load(
        "assets/5/sky.gltf",
        function (gltf) {
            sky = gltf.scene;
            sky.traverse(function (child) {
                if (child.isMesh) {
                    child.scale.set(10, 10, 10);
                    child.position.set(0, 0, 0);
                }
            });
            scene.add(sky);
            sky.scale.set(100, 1, 100);
            sky.position.set(50, 300, 50);
        }
    );
}

// Load the plane model
function loadPlaneModel() {
    loader.load(
        "assets/3/plane.gltf",
        function (gltf) {
            plane = gltf.scene;
            plane.traverse(function (child) {
                if (child.isMesh) {
                    child.scale.set(10, 10, 10);
                    child.position.set(0, 0, 0);
                    child.rotation.y = Math.PI / 2;
                }
            });
            scene.add(plane);
        }
    );
}

// Load the character model
function loadCharacterModel() {
    loader.load("assets/2/character.gltf", function (gltf) {
        character = gltf.scene;
        character.traverse(function (child) {
            if (child.isMesh) {
                child.material = new THREE.MeshStandardMaterial({ map: gltf.texture });
                child.scale.set(5, 5, 5);
                child.position.set(0, 0, 0); // Adjust the position inside the plane
                child.rotation.x = Math.PI / 2;
                child.rotation.y = -Math.PI / 2;
            }
        });
        scene.add(character); // Add the character to the scene if the plane is not loaded
    });
}

// Load the parachute model
function loadParachuteModel() {
    loader.load(
        "assets/1/openedParachute.gltf",
        function (gltf) {
            parachute = gltf.scene;
            parachute.traverse(function (child) {
                if (child.isMesh) {
                    child.scale.set(2, 2, 2);
                    child.position.set(0, 0, 0);
                    //child.rotation.x = Math.PI;

                }
            });
            character.add(parachute);
            parachute.position.set(-18, 0, 0);
            parachute.rotation.set(Math.PI / 2, 0, Math.PI / 2);
            parachuteSurfaceArea = calculateParachuteSurfaceArea();
            //kps = k * p * parachuteSurfaceArea;
            parachuteMass = params.parachuteMass;
        }
    );
}
var flagP = false;
var cnt = 0
window.addEventListener("keydown", function (event) {
    if (event.key === " ") {
        isFalling = true;
    }
    if (event.key === "f" && !parachute && !flagP) {
        if (isFalling)
            loadParachuteModel();
        character.rotation.x = -Math.PI / 2;
        character.rotation.y = Math.PI / 2;
        playParachuteSound();
        cnt = 1;
        flagP = true;
    }
});

// حساب مساحة السطح (S) استنادًا إلى أبعاد المستطيل
var L = 10;
var W = 5;
var S = 2 * (L * W); // معادلة مساحة السطح للمستطيل
// تعديل S استنادًا إلى كتلة اللاعب (m)
S *= 10 / combinedMass;

// حساب مساحة سطح المظلة استنادًا إلى أبعادها
function calculateParachuteSurfaceArea() {
    var length = 10; // طول المظلة
    var width = 5; // عرض المظلة

    // حساب مساحة سطح المظلة (للشكل المستطيل)
    var surfaceArea = 2 * (length * width);

    return surfaceArea;
}

// تعيين شعاع السرعة الأولية
var velocity = new THREE.Vector3(0, 0, 0);
var flagl = false;
var flagf = false;
var flagc = false;


// Apply falling motion to the character
function applyFallingMotion() {

    // حساب قوة الجاذبية من خلال ضرب الكتلة بتسارع الجاذبية (قانون نيوتن الثاني)
    var gravityForce = new THREE.Vector3(0, -combinedMass * g, 0);

    // حساب قوة المقاومة الهوائية (قوة السحب استنادًا إلى سرعة السرعة الاولية, باستخدام معادلة السحب)
    var airResistanceForce = new THREE.Vector3().copy(velocity).multiplyScalar(-k * p * S * velocity.length());

    // حساب محصلة القوى المؤثرة على الشخصية (مجموع جميع القوى)
    var netForce = new THREE.Vector3().addVectors(gravityForce, airResistanceForce);

    // حساب التسارع استنادًا إلى القوة الصافية والكتلة (قانون نيوتن الثاني)
    var acceleration = new THREE.Vector3().copy(netForce).divideScalar(combinedMass);



    // تحديث السرعة استنادًا إلى التسارع والوقت (معادلة الحركة)
    velocity.add(acceleration.multiplyScalar(deltaT));

    // تحديث الموقع استنادًا إلى السرعة والوقت (معادلة الحركة)
    character.position.add(velocity.clone().multiplyScalar(deltaT).multiplyScalar(10));

    var newPositionY = character.position.y;
    if (newPositionY < -985) {
        character.position.y = -985;
        character.remove(parachute);
        parachute = false;

    }
    if (newPositionY <= -985 && !flagl && cnt == 1) {
        playLandingSound();
        flagl = true;
    }
    if (newPositionY <= -985 && !flagf && cnt == 0) {
        playFallingSound();
        var messageContainer = document.getElementById("messageContainer");
        messageContainer.style.display = "block";
        flagf = true;
    }


    // Check if the parachute is opened
    if (parachute) {

        // حساب قوة السحب التي تمارسها المظلة (قوة السحب استنادًا إلى سرعة السرعة الاولية ومساحة السطح)
        var parachuteDragForce = new THREE.Vector3().copy(velocity).multiplyScalar(
            -0.5 * p * parachuteSurfaceArea * velocity.length() * velocity.length()
        );

        // حساب قوة الرياح على المظلة استنادًا إلى سرعة الرياح والاتجاه ومساحة السطح (قوة السحب استنادًا إلى سرعة الرياح المربعة ومساحة السطح)
        var windForceOnParachute = new THREE.Vector3(windSpeed, 0, 0);
        windForceOnParachute.multiplyScalar(0.5 * p * parachuteSurfaceArea * windSpeed * windSpeed);


        // حساب القوة الصافية المؤثرة على الشخصية مع المظلة، بما في ذلك قوة السحب وقوة الرياح على المظلة
        var netForceWithParachute = new THREE.Vector3()
            .addVectors(gravityForce, airResistanceForce)
            .add(parachuteDragForce)
            .add(windForceOnParachute);

        // حساب التسارع مع المظلة (قانون نيوتن الثاني)
        var accelerationWithParachute = new THREE.Vector3().copy(netForceWithParachute).divideScalar(combinedMass);

        // تحديث السرعة مع المظلة استنادًا إلى التسارع والوقت (معادلة الحركة)
        velocity.add(accelerationWithParachute.multiplyScalar(deltaT));


    }
}

// Function to animate the scene
function animate() {
    requestAnimationFrame(animate);

    plane.position.x += planeSpeed * deltaT;
    if (!isFalling) {
        character.position.x = plane.position.x;
        playPlaneSound();
    }
    if (isFalling) {
        applyFallingMotion();
        playWindSound();
    }


    // Render the scene
    renderer.render(scene, camera);
}

// Load the sky model
loadSkyModel();

// Load the plane model
loadPlaneModel();

// Load the terrain model
loadTerrainModel();

// Load the character model
loadCharacterModel();

// Start the animation
animate();

