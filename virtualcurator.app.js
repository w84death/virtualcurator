
      let loading_elements = 0;
      let skyImages, environmentModels, modelImages, lightSetups, panoramas;
      let currentEnvironmentIndex = 0;
      let currentSkyIndex = 0;
      let currentModelIndex = 0;
      let lightSetupIndex = 0;
      let panoramaIndex = 0;

      async function loadConfigData() {
        const response = await fetch('config.json');
        const data = await response.json();

        return data;
      }

      loadConfigData().then((data) => {
        skyImages = data.skys;
        environmentModels = data.environments;
        modelImages = data.models;
        lightSetups = data.lights;
        panoramas = data.panoramas;

        loadMaterialPresets();
        loadCameraTransformFromUrlHash();
        loadFOVFromHash();
        loadModelFromUrlHash();
        loadEnvironmentFromUrlHash();
        loadSettingsFromUrlHash();
        loadSkyFromUrlHash();
        loadPanoramaFromHash();
        bindExplorer();
        enableEnterAppButton();
      });

      const dropZoneModel = document.getElementById('drop-zone-model');
      const dropZoneEnvironment = document.getElementById('drop-zone-environment');

      function updateVersion(){
        document.getElementById('app-version').innerHTML = appVersion;
        document.getElementById('app-date').innerHTML = appDate;
      };

      function enableEnterAppButton() {
        const enterAppButton = document.getElementById('enter-app-btn');
        enterAppButton.textContent = 'Enter the App';
        enterAppButton.removeAttribute('disabled');
      }

      function loadModel(url) {
        const model = document.getElementById('customModel');
        if (model.getAttribute('gltf-model') === url) return;
        showLoadingOverlay();
        model.setAttribute('gltf-model', url);
        model.addEventListener('model-loaded', () => {
          loadMaterialPresetFromUrlHash();
          hideLoadingOverlay();
        });
        // Update the URL's hash
        const params = new URLSearchParams(window.location.hash.slice(1));
        const nextModelFilename = url.split('/').pop().split('.')[0];
        params.set('model', nextModelFilename);
        window.location.hash = params.toString();
      }

      function loadModelFromUrlHash() {
        const params = new URLSearchParams(window.location.hash.slice(1));
        const modelFilename = params.get('model');

        if (modelFilename) {
          const modelUrl = `models/${modelFilename}.glb`;
          loadModel(modelUrl);
        } else {
          loadModel(modelImages[currentModelIndex].url);
        }
      }


      function loadSettingsFromUrlHash() {
        const params = new URLSearchParams(window.location.hash.slice(1));
        const vp = params.get('vp');
        const virtualProduction = document.getElementById('virtualProduction');
        virtualProduction.setAttribute('visible', vp);
        if (params.has("vp_shift")) {
          const verticalShift = parseFloat(params.get("vp_shift"));
          const verticalShiftSlider = document.querySelector("#vp-vertical-shift");
          verticalShiftSlider.value = verticalShift;
          applyVerticalShift(verticalShift);
        }
      }


        function loadNextModel() {
          currentModelIndex = (currentModelIndex + 1) % modelImages.length;
          const nextModelUrl = modelImages[currentModelIndex].url;
          loadModel(nextModelUrl);
        }


      function loadEnvironment(url) {
        const environment = document.getElementById('customEnvironment');
        if (environment.getAttribute('gltf-model') === url) return;
        showLoadingOverlay();
        environment.setAttribute('gltf-model', url);
        environment.addEventListener('model-loaded', () => {
          hideLoadingOverlay();
        });

        // Update the URL's hash
        const params = new URLSearchParams(window.location.hash.slice(1));
        const nextEnvironmentFilename = url.split('/').pop().split('.')[0];
        params.set('environment', nextEnvironmentFilename);
        window.location.hash = params.toString();
      }

      function loadEnvironmentFromUrlHash() {
        const params = new URLSearchParams(window.location.hash.slice(1));
        const environmentFilename = params.get('environment');

        if (environmentFilename) {
          const environmentUrl = `environments/${environmentFilename}.glb`;
          loadEnvironment(environmentUrl);
        } else {
          loadEnvironment(environmentModels[currentEnvironmentIndex].url);
        }
      }


      function loadNextSky() {
        currentSkyIndex = (currentSkyIndex + 1) % skyImages.length;
        const nextSkyUrl = skyImages[currentSkyIndex].url;
        loadSky(nextSkyUrl);
      }

      function loadExactSky(url) {
        loadSky(url);
      }

      function loadNextEnvironment() {
        currentEnvironmentIndex = (currentEnvironmentIndex + 1) % environmentModels.length;
        const nextEnvironmentUrl = environmentModels[currentEnvironmentIndex].url;
        loadEnvironment(nextEnvironmentUrl);
      }



      document.getElementById('load-model').addEventListener('click', () => {
        loadNextModel();
      });

      document.getElementById('load-enviro').addEventListener('click', () => {
       loadNextEnvironment();
      });

      document.getElementById('load-sky').addEventListener('click', () => {
        loadNextSky();
      });

      document.getElementById('restore-controls').addEventListener('click', () => {
        restoreCameraControls();
      });

      document.getElementById('share-view').addEventListener('click', () => {
        togglePopupWindowShare();
      });

      document.getElementById('close-popup-share').addEventListener('click', () => {
        togglePopupWindowShare();
      });


      document.addEventListener('dragover', (event) => {
        event.preventDefault();
        dropZoneModel.style.display = 'block';
        dropZoneEnvironment.style.display = 'block';
      });

      dropZoneModel.addEventListener('dragleave', (event) => {
        event.preventDefault();
        dropZoneModel.style.display = 'none';
      });

      dropZoneEnvironment.addEventListener('dragleave', (event) => {
        event.preventDefault();
        dropZoneEnvironment.style.display = 'none';
      });

      dropZoneModel.addEventListener('drop', async (event) => {
        event.preventDefault();
        dropZoneModel.style.display = 'none';
        dropZoneEnvironment.style.display = 'none';

        const file = event.dataTransfer.files[0];
        if (file && file.name.endsWith('.glb')) {
          const modelURL = URL.createObjectURL(file);
          const modelEntity = document.getElementById('customModel');
          modelEntity.setAttribute('gltf-model', modelURL);
        }
      });

      dropZoneEnvironment.addEventListener('drop', async (event) => {
        event.preventDefault();
        dropZoneModel.style.display = 'none';
        dropZoneEnvironment.style.display = 'none';

        const file = event.dataTransfer.files[0];
        if (file && file.name.endsWith('.glb')) {
          const environmentURL = URL.createObjectURL(file);
          const environmentEntity = document.getElementById('customEnvironment');
          environmentEntity.setAttribute('gltf-model', environmentURL);
        }
      });

      function loadSky(url) {
        const scene = document.querySelector("#theScene");
        const sky = document.querySelector('a-sky');
        if (sky.getAttribute('src') === url) return;
        showLoadingOverlay();
        scene.removeAttribute("reflection");
        sky.setAttribute('src', url);
        sky.addEventListener('materialtextureloaded', () => {
          hideLoadingOverlay();
          setTimeout(() => {
            scene.setAttribute("reflection", "");
          }, 0);
        });

        // Update the URL's hash
        const params = new URLSearchParams(window.location.hash.slice(1));
        const nextSkyFilename = url.split('/').pop().split('.')[0];
        params.set('sky', nextSkyFilename);
        window.location.hash = params.toString();
      }

      AFRAME.registerComponent('buttons-events',{
        init: function () {
          this.el.addEventListener('abuttondown', this.changeSky);
          this.el.addEventListener('bbuttondown', this.changeLight);
          this.el.addEventListener('xbuttondown', this.changeModel);
          this.el.addEventListener('ybuttondown', this.changeEnviro);
        },
        changeSky: function(){
            loadNextSky()
        },
        changeLight: function(){
            moveLights(['light1', 'light2', 'light3']);
        },
        changeModel: function(){
            loadNextModel();
        },
        changeEnviro: function(){
            loadNextEnvironment();
        }
      });

      function loadSkyFromUrlHash() {
        const params = new URLSearchParams(window.location.hash.slice(1));
        const skyFilename = params.get('sky');

        if (skyFilename) {
          const skyUrl = `skys/${skyFilename}.jpg`;
          loadSky(skyUrl);
        }else {
          loadSky(skyImages[currentSkyIndex].url);
        }
      }

      function restoreCameraControls(){
        const camera = document.querySelector('#camera');
        const restore = document.querySelector('#restore-controls');
        camera.setAttribute('wasd-controls', '');
        camera.setAttribute('look-controls', '');
        camera.setAttribute('camera-keyboard-controls', '');

        restore.style.display="none";
      }

      function loadCameraTransformFromUrlHash() {
        const params = new URLSearchParams(window.location.hash.slice(1));
        const cameraPositionString = params.get('cameraPosition');
        const cameraRotationString = params.get('cameraRotation');

        const camera = document.querySelector('#camera');
        const restore = document.querySelector('#restore-controls');
        if (cameraPositionString) {
          const cameraPosition = AFRAME.utils.coordinates.parse(cameraPositionString);
          camera.setAttribute('position', cameraPosition);
          restore.style.display="block";
        } else {
          restoreControls();
          restoreLook();
        }

        if (cameraRotationString) {
          const cameraRotation = AFRAME.utils.coordinates.parse(cameraRotationString);
          camera.setAttribute('rotation', cameraRotation);
          restore.style.display="block";
        }else{
          restoreLook();
        }
      }

      function blockControls(){
        const camera = document.querySelector('#camera');
        camera.removeAttribute('wasd-controls');
        camera.removeAttribute('camera-keyboard-controls');

      }

      function blockLook(){
        camera.removeAttribute('look-controls');
      }

      function restoreControls(){
        const camera = document.querySelector('#camera');
        camera.setAttribute('wasd-controls', '');
        camera.setAttribute('camera-keyboard-controls', '');

      }

      function restoreLook(){
        camera.setAttribute('look-controls', '');
      }

      AFRAME.registerComponent('camera-transform-updater', {
        schema: {
          tickTimeout: { type: 'int', default: 1000 }
        },

        init: function () {
          this.previousPosition = this.el.getAttribute('position');
          this.previousRotation = this.el.getAttribute('rotation');
          this.lastUpdate = performance.now();
        },

        tick: function (time) {
          const currentPosition = this.el.getAttribute('position');
          const currentRotation = this.el.getAttribute('rotation');
          const timeSinceLastUpdate = time - this.lastUpdate;
          const shouldUpdateHash = timeSinceLastUpdate >= this.data.tickTimeout;

          if (shouldUpdateHash &&
              (AFRAME.utils.deepEqual(this.previousPosition, currentPosition) ||
              AFRAME.utils.deepEqual(this.previousRotation, currentRotation))) {

            const params = new URLSearchParams(window.location.hash.slice(1));
            params.set('cameraPosition', AFRAME.utils.coordinates.stringify(currentPosition));
            params.set('cameraRotation', AFRAME.utils.coordinates.stringify(currentRotation));
            window.location.hash = params.toString();

            this.previousPosition = currentPosition;
            this.previousRotation = currentRotation;
            this.lastUpdate = time;
          }
        }
      });

      AFRAME.registerComponent('camera-keyboard-controls', {
        init: function () {
          this.onKeyDown = this.onKeyDown.bind(this);
          this.onKeyUp = this.onKeyUp.bind(this);
          this.keysPressed = new Set();
        },

        play: function () {
          window.addEventListener('keydown', this.onKeyDown);
          window.addEventListener('keyup', this.onKeyUp);
        },

        pause: function () {
          window.removeEventListener('keydown', this.onKeyDown);
          window.removeEventListener('keyup', this.onKeyUp);
        },

        tick: function (time, deltaTime) {
          this.updateCameraPosition(deltaTime);
        },

        onKeyDown: function (event) {
          this.keysPressed.add(event.key);
        },

        onKeyUp: function (event) {
          this.keysPressed.delete(event.key);
        },

        updateCameraPosition: function (deltaTime) {
          if (this.keysPressed.size === 0) {
            return;
          }

          const position = this.el.getAttribute('position');
          const speed = 2; // Adjust the speed value to your preference
          const delta = deltaTime / 1000;

          if (this.keysPressed.has('e')) {
            position.y += speed * delta;
          }
          if (this.keysPressed.has('q')) {
            position.y -= speed * delta;
          }

          this.el.setAttribute('position', position);
        }
      });


      function togglePopupWindowShare() {
        const popupShare = document.querySelector('#popup-window-share');
        const shareUrlInput = document.querySelector('#shareUrlInput');
        const isVisible = popupShare.style.display === "flex";

        if (isVisible) {
          popupShare.style.display="none";
          restoreControls();
        } else {
          blockControls();
          shareUrlInput.value = window.location.href;
          popupShare.style.display="flex";
          shareUrlInput.select();
        }
      }

      function togglePanelDrawer() {
        const panelDrawer = document.querySelector('#panelDrawer');
        const skyImageList = document.querySelector('#skyImageList');
        const isExpanded = panelDrawer.classList.toggle('expanded');

        if (isExpanded) {
          skyImageList.classList.remove('hidden');
        } else {
          skyImageList.classList.add('hidden');
        }
      }

      function resetView() {
        window.location.hash = '';
       blockLook();
        currentEnvironmentIndex = 0;
        currentSkyIndex = 0;
        currentModelIndex = 0;

        loadEnvironment(environmentModels[currentEnvironmentIndex].url)
        loadModel(modelImages[currentModelIndex].url);
        loadSky(skyImages[currentSkyIndex].url);
        document.querySelector('#virtualProduction').setAttribute('visible', false);
        document.querySelector('#load-panorama').style.display='none';
        const scene = document.querySelector("#theScene");
        scene.removeAttribute("reflection");
        const camera = document.querySelector('#camera');
        const cameraPosition = AFRAME.utils.coordinates.parse("0 0 0");
        const cameraRotation = AFRAME.utils.coordinates.parse("0 0 0");
        camera.setAttribute('position', cameraPosition);
        camera.setAttribute('rotation', cameraRotation);
        setTimeout(() => {
          scene.setAttribute("reflection", "");
        }, 0);
        restoreLook();
        restoreControls();
        document.querySelector('#restore-controls').style.display="none";
        hideLoadingOverlay();
      }

      document.getElementById('reset-view-btn').addEventListener('click', resetView);

      document.getElementById('enter-app-btn').addEventListener('click', () => {
        document.getElementById('popup-window').style.display = 'none';
      });

      function handleMouseScroll(event) {
        const camera = document.getElementById('camera');
        const currentFOV = camera.getAttribute('camera').fov;
        const minFov = 20;
        const maxFov = 110;

        // Adjust the FOV based on the scroll direction
        let newFOV = currentFOV - event.deltaY * 0.1;

        // Limit the FOV to a reasonable range, e.g., between 20 and 100
        newFOV = Math.max(minFov, Math.min(maxFov, newFOV));

        // Set the new FOV
        camera.setAttribute('camera', 'fov', newFOV);
        updateFOVUrlHash();

        updateVignette(newFOV);
      }

      function updateVignette(cameraFov){
        // Update vignette opacity based on FOV
        const vignette = document.getElementById("vignette");
        const minFov = 20;
        const maxFov = 80;
        const opacityFactor = (cameraFov - minFov) / (maxFov - minFov);
        vignette.style.opacity = Math.min(Math.max(opacityFactor, 0), 1);
      }

      window.addEventListener('wheel', handleMouseScroll);


      function startTitleScrolling() {
        const baseTitle = "VirtualCurator";
        const scrollText = " - Welcome to the VirtualCurator app! Enjoy your experience. ";
        let currentScrollPosition = 0;

        function updateTitleScroll() {
          const visibleText = scrollText.substr(currentScrollPosition, 10);
          document.title = baseTitle + visibleText;

          // Increment the current scroll position and wrap around if it exceeds the length of the scrollText
          currentScrollPosition = (currentScrollPosition + 1) % scrollText.length;
        }

        const scrollInterval = 300; // Scroll speed in milliseconds
        setInterval(updateTitleScroll, scrollInterval);
      }

      function supportsWebWorkers() {
        return typeof Worker !== "undefined";
      }

      if (supportsWebWorkers()) {
        const titleWorker = new Worker("title-worker.js");

        titleWorker.onmessage = (event) => {
          document.title = event.data;
        };
      } else {
        console.log("Web workers not supported.");
        startTitleScrolling();
      }

      function loadFOVFromHash() {
        const params = new URLSearchParams(window.location.hash.slice(1));
        const fov = params.get('fov');
        if (fov){
          document.querySelector('#camera').setAttribute('camera', 'fov', fov);
          updateVignette(fov);
        }
      }

      function updateFOVUrlHash() {
        const camera = document.querySelector('#camera');
        const fov = camera.getAttribute('camera').fov;
        // Update the URL's hash
        const params = new URLSearchParams(window.location.hash.slice(1));
        params.set('fov', fov);
        window.location.hash = params.toString();
      }

      function showLoadingOverlay() {
        loading_elements += 1;
        const overlay = document.getElementById('loading-overlay');
        overlay.classList.remove('hidden');
      }

      function hideLoadingOverlay() {
        loading_elements -= 1;
        if (loading_elements < 1){
        const overlay = document.getElementById('loading-overlay');
        overlay.classList.add('hidden');
        }
      }

      async function loadMaterialPresets() {
        const response = await fetch("material-presets.json");
        const json = await response.json();

        const materialPresetList = document.getElementById("materialPresetList");
        const ul = materialPresetList.querySelector("ul");
        json.presets.forEach((preset) => {
          const li = document.createElement("li");
          const button = document.createElement("button");
          button.classList.add('menu-button', 'material-button');
          button.style.backgroundColor = preset.albedo;
          button.textContent = preset.name;
          // Set the text color based on the brightness of the material color
          const brightness = colorBrightness(preset.albedo);
          button.style.color = brightness > 128 ? 'black' : 'white';

          button.addEventListener("click", () => {
            applyMaterialPreset(preset);
          });
          li.appendChild(button);
          ul.appendChild(li);
        });
      }

      function applyMaterialPreset(preset) {
        const model = document.querySelector("#customModel");
        const scene = document.querySelector("#theScene");
        if (!model) return;
        scene.removeAttribute("reflection");
        model.object3D.traverse((node) => {
          if (node.isMesh) {
            node.material.color.set(preset.albedo);
            node.material.metalness = preset.metallic;
            node.material.roughness = preset.roughness;
            node.material.transparent = preset.transparent;
            node.material.opacity = preset.opacity;
            node.material.needsUpdate = true;
          }
        });
        saveMaterialPresetToUrlHash(preset.name);
        setTimeout(() => {
          scene.setAttribute("reflection", "");
        }, 0);
      }

      document.getElementById("materialExpandButton").addEventListener("click", () => {
        const materialDrawer = document.getElementById("materialDrawer");
        materialDrawer.classList.toggle("collapsed");
      });

      function saveMaterialPresetToUrlHash(presetName) {
        const currentHash = window.location.hash.substr(1);
        const hashParams = new URLSearchParams(currentHash);

        hashParams.set('material', presetName);
        window.location.hash = hashParams.toString();
      }

      async function loadMaterialPresetFromUrlHash() {
        const currentHash = window.location.hash.substr(1);
        const hashParams = new URLSearchParams(currentHash);

        if (hashParams.has('material')) {
          const presetName = hashParams.get('material');
          const materialsData = await fetch('material-presets.json').then(response => response.json());
          const presets = materialsData.presets;

          const foundPreset = presets.find(preset => preset.name === presetName);

          if (foundPreset) {
            applyMaterialPreset(foundPreset);
          }
        }
      }

      function colorBrightness(hexColor) {
        const rgb = parseInt(hexColor.substring(1), 16);
        const r = (rgb >> 16) & 0xff;
        const g = (rgb >> 8) & 0xff;
        const b = (rgb >> 0) & 0xff;
        return (r * 299 + g * 587 + b * 114) / 1000;
      }


      const customModel = document.querySelector('#customModel');
      const moveSpeed = 0.1;
      const rotationSpeed = 2;

      function onLeftJoystickMoved(event) {
        const x = event.detail.x * moveSpeed;
        const z = event.detail.y * moveSpeed;

        customModel.object3D.position.x += x;
        customModel.object3D.position.z += z;
      }

      function onRightJoystickMoved(event) {
        const y = event.detail.x * rotationSpeed;

        customModel.object3D.rotation.y += THREE.Math.degToRad(y);
      }


      document.querySelector('#left-hand').addEventListener('thumbstickmoved', onLeftJoystickMoved);
      document.querySelector('#right-hand').addEventListener('thumbstickmoved', onRightJoystickMoved);

      function loadPanorama(url){
        const model = document.querySelector('#virtualProduction');
        if (model.getAttribute('src') === 'url(' + url + ')' ) return;
        showLoadingOverlay();
        const scene = document.querySelector("#theScene");
        scene.removeAttribute("reflection");
        model.setAttribute('src', 'url(' + url + ')');
        model.addEventListener('materialtextureloaded', () => {
          hideLoadingOverlay();
          setTimeout(() => {
            scene.setAttribute("reflection", "");
          }, 0);
        });

        // Update the URL's hash
        const params = new URLSearchParams(window.location.hash.slice(1));
        const vp_pano = url.split('/').pop().split('.')[0];
        params.set('vp_pano', vp_pano);
        window.location.hash = params.toString();
      }

      function loadNextPanorama() {
        if (panoramas.length === 0) return;
        panoramaIndex = (panoramaIndex + 1) % panoramas.length;
        const url = panoramas[panoramaIndex].url;

        loadPanorama(url);
      }

      function loadPanoramaFromHash() {
        const params = new URLSearchParams(window.location.hash.slice(1));
        const pano = params.get('vp_pano');
        if (pano){
          const panoUrl = `panoramas/${pano}.jpg`;
          loadPanorama(panoUrl);
          document.querySelector('#load-panorama').style.display='block';
        }else{
          const panoUrl = `panoramas/pano_00.jpg`;
          loadPanorama(panoUrl);
          virtualProduction.setAttribute('visible', false);
          document.querySelector('#load-panorama').style.display='none';
        }
      }

      function toggleVirtualProduction() {

        const virtualProduction = document.querySelector('#virtualProduction');
        const showVP = !virtualProduction.getAttribute('visible');
        virtualProduction.setAttribute('visible', showVP);
        const scene = document.querySelector("#theScene");
        scene.removeAttribute("reflection");
        setTimeout(() => {
          scene.setAttribute("reflection", "");
        }, 0);

        document.querySelector('#load-panorama').style.display=showVP? 'block':'none';

        // Update the URL's hash
        const params = new URLSearchParams(window.location.hash.slice(1));
        if(!showVP){
          document.querySelector('#load-panorama').style.display=showVP? 'block':'none';
           params.set('vp_pano','');
        }
        params.set('vp', showVP);
        window.location.hash = params.toString();
      }

      document.querySelector('#load-panorama').addEventListener('click', loadNextPanorama);
      document.querySelector('#toggle-vp').addEventListener('click', toggleVirtualProduction);

      function loadNextLightSetup() {
        if (lightSetups.length === 0) return;

        lightSetupIndex = (lightSetupIndex + 1) % lightSetups.length;
        const setup = lightSetups[lightSetupIndex];

        // Remove existing lights
        let existingLights = document.querySelectorAll('.light');
        existingLights.forEach(light => light.parentNode.removeChild(light));

        // Add new lights
        setup.lights.forEach(light => {
          const newLight = document.createElement('a-light');
          newLight.classList.add('light');
          newLight.setAttribute('type', light.type);
          newLight.setAttribute('position', light.position);
          newLight.setAttribute('intensity', light.intensity);
          newLight.setAttribute('color', light.color);
          newLight.setAttribute('target', light.target);
          newLight.setAttribute('castShadow', true);
          const scene = document.querySelector('a-scene');
          scene.appendChild(newLight);
        });
      }

      // document.querySelector('#load-lights').addEventListener('click',loadNextLightSetup);

      function applyVerticalShift(verticalShift) {
        const virtualProduction = document.querySelector("#virtualProduction");
        const currentPosition = virtualProduction.getAttribute("position");
        virtualProduction.setAttribute("position", {
          x: currentPosition.x,
          y: verticalShift,
          z: currentPosition.z,
        });

         // Update the URL's hash
          const params = new URLSearchParams(window.location.hash.slice(1));
          params.set('vp_shift', verticalShift);
          window.location.hash = params.toString();
      }

      function bindExplorer() {

        // Add event listeners to the tab buttons
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
          btn.addEventListener('click', () => {
            const targetTab = btn.dataset.tab;

            // Toggle the active state for the buttons
            tabBtns.forEach(b => b.classList.toggle('active', b === btn));

            // Toggle the active state for the tab panes
            const tabPanes = document.querySelectorAll('.tab-pane');
            tabPanes.forEach(pane => pane.classList.toggle('active', pane.id === targetTab));
          });
        });

        // Add event listener to the close button
        const popupCloseBtn = document.querySelector('.popup-close-btn');
        popupCloseBtn.addEventListener('click', () => {
          const popup = document.querySelector('#popup');
          popup.classList.add('hidden');
        });

        // Function to open the popup
        function openPopup() {
          const popup = document.querySelector('#popup');
          popup.classList.remove('hidden');
        }

        // Add event listener to open the popup
        const openPopupButton = document.querySelector('.open-popup-btn');
        openPopupButton.addEventListener('click', openPopup);

        function createThumbnail(container, item) {
          const thumbnail = document.createElement('div');
          thumbnail.classList.add('thumbnail');
          thumbnail.style.backgroundImage = `url(${item.thumb})`;
          thumbnail.setAttribute('data-url', item.url);
          thumbnail.setAttribute('title', item.name);
          container.appendChild(thumbnail);
        }

        const skiesContainer = document.querySelector('#skies-tab');
        const panoramasContainer = document.querySelector('#panoramas-tab');
        const environmentsContainer = document.querySelector("#environments-tab");
        const modelsContainer = document.querySelector("#models-tab");

        skyImages.forEach(sky => createThumbnail(skiesContainer, sky));
        panoramas.forEach(panorama => createThumbnail(panoramasContainer, panorama));
        environmentModels.forEach(environment => createThumbnail(environmentsContainer, environment));
        modelImages.forEach(model => createThumbnail(modelsContainer, model));

        document.querySelectorAll('.thumbnail').forEach(thumbnail => {
          thumbnail.addEventListener('click', (e) => {
            const selectedUrl = e.target.dataset.url;

            if (e.target.parentElement.id === 'skies-tab') {
              loadSky(selectedUrl);
            } else
            if (e.target.parentElement.id === 'panoramas-tab') {
              loadPanorama(selectedUrl);
            }else
            if (e.target.parentElement.id === 'environments-tab') {
              loadEnvironment(selectedUrl);
            }else
            if (e.target.parentElement.id === 'models-tab') {
              loadModel(selectedUrl);
            }

            // Toggle the selected state for the thumbnails
            e.target.parentElement.querySelectorAll('.thumbnail').forEach(t => t.classList.toggle('selected', t === e.target));
          });
        });

        document.querySelector("#vp-vertical-shift").addEventListener("input", function (event) {
          const shiftValue = parseFloat(event.target.value);
          applyVerticalShift(shiftValue);
        });
      }

      updateVersion();
