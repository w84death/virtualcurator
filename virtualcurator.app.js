

      let skyImages, environmentImages, modelImages;
      let currentEnvironmentIndex = 0;
      let currentSkyIndex = 0;
      let currentModelIndex = 0;

      async function loadImagesData() {
        const response = await fetch('imagesData.json');
        const data = await response.json();

        return data;
      }

      loadImagesData().then((data) => {
        skyImages = data.skyImages;
        environmentImages = data.environmentImages;
        modelImages = data.modelImages;

        populateSkyImageList();
        loadMaterialPresets();
        loadCameraTransformFromUrlHash();
        loadFOVFromHash();
        loadModelFromUrlHash();
        loadEnvironmentFromUrlHash();
        loadSkyFromUrlHash();
        applyLightPositionsFromHash();
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


        function loadNextModel() {
          currentModelIndex = (currentModelIndex + 1) % modelImages.length;
          const nextModelUrl = modelImages[currentModelIndex].url;
          loadModel(nextModelUrl);

          // Update the URL's hash
          const params = new URLSearchParams(window.location.hash.slice(1));
          const nextModelFilename = nextModelUrl.split('/').pop().split('.')[0];
          params.set('model', nextModelFilename);
          window.location.hash = params.toString();
        }


      function loadEnvironment(url) {
        showLoadingOverlay();
        const environment = document.getElementById('customEnvironment');
        environment.setAttribute('gltf-model', url);
        environment.addEventListener('model-loaded', () => {
          hideLoadingOverlay();
        });
      }

      function loadEnvironmentFromUrlHash() {
        const params = new URLSearchParams(window.location.hash.slice(1));
        const environmentFilename = params.get('environment');

        if (environmentFilename) {
          const environmentUrl = `environments/${environmentFilename}.glb`;
          loadEnvironment(environmentUrl);
        } else {
          loadEnvironment(environmentImages[currentEnvironmentIndex].url);
        }
      }


      function loadNextSky() {
        currentSkyIndex = (currentSkyIndex + 1) % skyImages.length;
        const nextSkyUrl = skyImages[currentSkyIndex].url;
        loadSky(nextSkyUrl);

        // Update the URL's hash
        const params = new URLSearchParams(window.location.hash.slice(1));
        const nextSkyFilename = nextSkyUrl.split('/').pop().split('.')[0];
        params.set('sky', nextSkyFilename);
        window.location.hash = params.toString();
      }

      function loadExactSky(url) {
        loadSky(url);

        // Update the URL's hash
        const params = new URLSearchParams(window.location.hash.slice(1));
        const nextSkyFilename = url.split('/').pop().split('.')[0];
        params.set('sky', nextSkyFilename);
        window.location.hash = params.toString();
      }

      function loadNextEnvironment() {
        currentEnvironmentIndex = (currentEnvironmentIndex + 1) % environmentImages.length;
        const nextEnvironmentUrl = environmentImages[currentEnvironmentIndex].url;
        loadEnvironment(nextEnvironmentUrl);

        // Update the URL's hash
        const params = new URLSearchParams(window.location.hash.slice(1));
        const nextEnvironmentFilename = nextEnvironmentUrl.split('/').pop().split('.')[0];
        params.set('environment', nextEnvironmentFilename);
        window.location.hash = params.toString();
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

      function randomPosition(radius) {
        const angle = Math.random() * 2 * Math.PI;
        const x = radius * Math.cos(angle);
        const y = radius * Math.sin(angle);
        const z = radius * Math.sin(angle);
        return { x, y, z };
      }

      function moveLights(lightIds) {
        const lightPositions = parseLightPositionsFromHash();

        lightIds.forEach((lightId) => {
          const light = document.getElementById(lightId);
          if (!light) return;

          const currentPosition = light.getAttribute('position');
          const newPosition = randomPosition(8);
          light.setAttribute('animation', {
            property: 'position',
            from: `${currentPosition.x} ${currentPosition.y} ${currentPosition.z}`,
            to: `${newPosition.x} ${newPosition.y} ${newPosition.z}`,
            dur: 3000,
            easing: 'easeInOutQuad',
          });

          // Update the light positions object
          lightPositions[lightId] = [newPosition.x, newPosition.y, newPosition.z];
        });

        // Update the URL's hash
        const params = new URLSearchParams(window.location.hash.slice(1));
        Object.entries(lightPositions).forEach(([key, value]) => {
          params.set(key, value.join(','));
        });
        window.location.hash = params.toString();
      }

      function applyLightPositionsFromHash() {
        const lightPositions = parseLightPositionsFromHash();
        Object.entries(lightPositions).forEach(([lightId, position]) => {
          const light = document.getElementById(lightId);
          if (light) {
            light.setAttribute('position', { x: position[0], y: position[1], z: position[2] });
          }
        });
      }

      document.getElementById('move-light-button').addEventListener('click', () => {
        moveLights(['light1', 'light2', 'light3']);
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


      function parseLightPositionsFromHash() {
        const hash = window.location.hash.slice(1);
        const params = new URLSearchParams(hash);

        const lightPositions = {};
        params.forEach((value, key) => {
          if (key.startsWith('light')) {
            lightPositions[key] = value.split(',').map(parseFloat);
          }
        });

        return lightPositions;
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


     function populateSkyImageList() {
        const skyImageList = document.getElementById('skyImageList');
        const skyImageListUL = document.createElement('ul');

        skyImages.forEach((skyImage) => {
          const skyImageListItem = document.createElement('li');
          const skyImageButton = document.createElement('button');
          const skyImageThumbnail = document.createElement('img');

          skyImageButton.dataset.skyUrl = skyImage.url;
          skyImageButton.classList.add('menu-button');

          skyImageThumbnail.src = skyImage.url.replace('.', '_thumb.'); // Add 'thumb_' suffix to the image URL
          skyImageThumbnail.alt = skyImage.title;

          skyImageButton.appendChild(skyImageThumbnail);
          skyImageListItem.appendChild(skyImageButton);
          skyImageListUL.appendChild(skyImageListItem);

          // Add event listener for the button
          skyImageButton.addEventListener('click', () => {
            loadExactSky(skyImage.url);
          });
        });

        skyImageList.appendChild(skyImageListUL);


      }

      function resetView() {
        window.location.hash = '';

        currentEnvironmentIndex = 0;
        currentSkyIndex = 0;
        currentModelIndex = 0;

        loadEnvironment(environmentImages[currentEnvironmentIndex].url)
        loadModel(modelImages[currentModelIndex].url);
        loadSky(skyImages[currentSkyIndex].url);

        blockLook();
        const camera = document.querySelector('#camera');
        const cameraPosition = AFRAME.utils.coordinates.parse("0 0 0");
        const cameraRotation = AFRAME.utils.coordinates.parse("0 0 0");
        camera.setAttribute('position', cameraPosition);
        camera.setAttribute('rotation', cameraRotation);
        restoreLook();
        restoreControls();
        document.querySelector('#restore-controls').style.display="none";
      }

      document.getElementById('reset-view-btn').addEventListener('click', resetView);

      document.querySelector('#expandButton').addEventListener('click', togglePanelDrawer);

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
        const overlay = document.getElementById('loading-overlay');
        overlay.classList.remove('hidden');
      }

      function hideLoadingOverlay() {
        const overlay = document.getElementById('loading-overlay');
        overlay.classList.add('hidden');
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

      updateVersion();
