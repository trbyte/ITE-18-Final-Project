// -------------------------
// API & User Variables
// -------------------------
const API_BASE = "http://localhost:5000";
let token = "";
let userId = "";
let user = {};

let coins = 0;
let exp = 0;
let level = 1;
let ownedCars = [1];
let selectedCar = 1;

// -------------------------
// Game Variables
// -------------------------
let scene, camera, renderer, player, moveSpeed=0.2;
let keys = {};
let aiCars = [], pedestrians = [];
const cars = [
  { id:1,name:"Basic Car",color:0x00ff00,speed:0.2,price:0},
  { id:2,name:"Sport Car",color:0xff0000,speed:0.3,price:150},
  { id:3,name:"Police Car",color:0x0000ff,speed:0.35,price:300}
];

// -------------------------
// LOGIN / REGISTER
// -------------------------
async function register(username, password) {
  try {
    const res = await fetch(`${API_BASE}/register`, {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({username,password})
    });
    const data = await res.json();
    if(res.ok) alert("Registered successfully! Please login.");
    else alert(data.error || "Registration failed");
  } catch(err) { console.error(err); }
}

async function login(username, password) {
  try {
    const res = await fetch(`${API_BASE}/login`, {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({username,password})
    });
    const data = await res.json();
    if(res.ok){
      token = data.token;
      user = data.user;
      userId = user.id;
      coins = user.coins || 0;
      exp = user.exp || 0;
      level = user.level || 1;
      ownedCars = user.owned_cars || [1];
      selectedCar = user.selected_car || 1;
      document.getElementById("auth").style.display="none";
      document.getElementById("menu").style.display="flex";
      updateHUD();
      loadPlayerCar(selectedCar);
    } else alert(data.error || "Login failed");
  } catch(err){ console.error(err); }
}

// -------------------------
// SAVE PROGRESS
// -------------------------
async function saveProgress() {
  if(!token || !userId) return;
  try{
    const res = await fetch(`${API_BASE}/save`,{
      method:"POST",
      headers:{
        "Content-Type":"application/json",
        "Authorization":`Bearer ${token}`
      },
      body: JSON.stringify({
        id: userId,
        coins,
        exp,
        level,
        owned_cars: ownedCars,
        selected_car: selectedCar
      })
    });
    const data = await res.json();
    if(!res.ok) console.error(data.error);
  } catch(err){ console.error(err); }
}

// -------------------------
// HUD
// -------------------------
function updateHUD(){
  document.getElementById("coins").innerText = coins;
  document.getElementById("exp").innerText = exp;
}

// -------------------------
// GAME INIT
// -------------------------
function startGame(){
  document.getElementById("menu").style.display="none";
  init();
  animate();
}

function init(){
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75,window.innerWidth/window.innerHeight,0.1,1000);
  renderer = new THREE.WebGLRenderer({canvas:document.getElementById("game"),antialias:true});
  renderer.setSize(window.innerWidth,window.innerHeight);

  const light = new THREE.DirectionalLight(0xffffff,1);
  light.position.set(5,10,5);
  scene.add(light);

  // Road
  const road = new THREE.Mesh(
    new THREE.BoxGeometry(12,0.1,100),
    new THREE.MeshStandardMaterial({color:0x333333})
  );
  scene.add(road);

  // Buildings
  for(let i=0;i<20;i++){
    const b = new THREE.Mesh(
      new THREE.BoxGeometry(3,Math.random()*6+2,3),
      new THREE.MeshStandardMaterial({color:0x888888})
    );
    b.position.set(Math.random()>0.5?6:-6,b.geometry.parameters.height/2,-i*10);
    scene.add(b);
  }

  loadPlayerCar(selectedCar);
  camera.position.set(0,5,10);
  camera.lookAt(player?.position || new THREE.Vector3(0,0,0));

  window.addEventListener("keydown",e=>keys[e.key]=true);
  window.addEventListener("keyup",e=>keys[e.key]=false);

  startTrafficLights(3000);
  createAICars(level);
  createPedestrians();
}

// -------------------------
// LOAD PLAYER CAR
// -------------------------
function loadPlayerCar(id){
  const loader = new THREE.GLTFLoader();
  const carData = cars.find(c=>c.id===id);
  loader.load(`assets/models/car${id}.glb`, function(gltf){
    if(player) scene.remove(player);
    player = gltf.scene;
    player.scale.set(0.5,0.5,0.5);
    player.position.set(0,0,40);
    scene.add(player);
    moveSpeed = carData.speed;
  });
}

// -------------------------
// PLAYER MOVEMENT
// -------------------------
function updatePlayer(){
  if(!player) return;
  if(keys["w"] || keys["ArrowUp"]) player.position.z -= moveSpeed;
  if(keys["s"] || keys["ArrowDown"]) player.position.z += moveSpeed;
  if(keys["a"] || keys["ArrowLeft"]) player.position.x -= moveSpeed;
  if(keys["d"] || keys["ArrowRight"]) player.position.x += moveSpeed;

  checkTrafficRules();
  checkCollisions();
}

// -------------------------
// TRAFFIC LIGHTS
// -------------------------
let lightState="red";
function startTrafficLights(speed){
  setInterval(()=>{
    lightState = lightState==="red"?"green":"red";
  }, speed);
}
function checkTrafficRules(){
  if(lightState==="red" && player?.position.z<5){
    showWarning("STOP! RED LIGHT 🚦");
  } else hideWarning();
}

// -------------------------
// AI CARS & PEDESTRIANS
// -------------------------
function createAICars(level){
  for(let i=0;i<level+2;i++){
    const car = new THREE.Mesh(
      new THREE.BoxGeometry(1.5,1,3),
      new THREE.MeshStandardMaterial({color:0x0000ff})
    );
    car.position.set(Math.random()>0.5?2:-2,0.5,-i*15-10);
    scene.add(car);
    aiCars.push(car);
  }
}
function createPedestrians(){
  for(let i=0;i<5;i++){
    const p = new THREE.Mesh(
      new THREE.BoxGeometry(0.5,1,0.5),
      new THREE.MeshStandardMaterial({color:0xffff00})
    );
    p.position.set(Math.random()*4-2,0.5,-i*20-5);
    scene.add(p);
    pedestrians.push(p);
  }
}
function moveAICars(){ aiCars.forEach(c=>{ if(lightState==="green") c.position.z += 0.1; }); }
function movePedestrians(){ pedestrians.forEach(p=>{ p.position.z += 0.05; if(p.position.z>50) p.position.z=-50; }); }

// -------------------------
// COLLISIONS
// -------------------------
function checkCollisions(){
  aiCars.forEach(c=>{ if(player.position.distanceTo(c.position)<1.5){ showWarning("CRASH! ⚠️"); resetPlayer(); } });
  pedestrians.forEach(p=>{ if(player.position.distanceTo(p.position)<1.5){ showWarning("Hit pedestrian! ⚠️"); resetPlayer(); } });
}

// -------------------------
// LEVEL / PROGRESS
// -------------------------
function completeLevel(){
  coins += 50*level; exp += 20;
  level++; player.position.z=40;
  createAICars(level);
  updateHUD();
  saveProgress();
}

// -------------------------
// WARNING DISPLAY
// -------------------------
function showWarning(msg){
  const w = document.getElementById("warning");
  w.innerText = msg;
  w.style.display="block";
}
function hideWarning(){ document.getElementById("warning").style.display="none"; }
function resetPlayer(){ player.position.set(0,0,40); }

// -------------------------
// HUD UPDATE
// -------------------------
updateHUD();

// -------------------------
// ANIMATE LOOP
// -------------------------
function animate(){
  requestAnimationFrame(animate);
  updatePlayer();
  moveAICars();
  movePedestrians();
  renderer.render(scene,camera);
}

// -------------------------
// SHOP / CAR PURCHASE
// -------------------------
function openShop(){
  document.getElementById("menu").style.display="none";
  document.getElementById("shop").style.display="flex";
  const carList = document.getElementById("carList");
  carList.innerHTML="";
  cars.forEach(car=>{
    const div = document.createElement("div");
    div.className="car-item";
    div.innerHTML=`${car.name} - ${car.price} coins <button onclick="buyCar(${car.id})">Buy/Select</button>`;
    carList.appendChild(div);
  });
}
function closeShop(){ document.getElementById("shop").style.display="none"; document.getElementById("menu").style.display="flex"; }

function buyCar(id){
  const car = cars.find(c=>c.id===id);
  if(!ownedCars.includes(id)){
    if(coins>=car.price){ coins-=car.price; ownedCars.push(id); alert("Car purchased!"); }
    else{ alert("Not enough coins!"); return; }
  } else alert("Car selected!");
  selectedCar = id;
  loadPlayerCar(id);
  updateHUD();
  saveProgress();
}

// -------------------------
// MOBILE CONTROLS (OPTIONAL)
// -------------------------
document.getElementById("up")?.addEventListener("touchstart",()=>keys["w"]=true);
document.getElementById("up")?.addEventListener("touchend",()=>keys["w"]=false);
// Repeat for down, left, right if mobile buttons exist
