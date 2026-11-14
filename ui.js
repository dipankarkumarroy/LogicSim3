
        function toggleSidebar() {
            document.getElementById('sidebar').classList.toggle('sidebar-closed');
        }

        // --- Safe Fullscreen Logic ---
        function toggleFullScreen() {
            const doc = window.document;
            const docEl = doc.documentElement;
            const btnIcon = document.querySelector('#fsBtn i');

            // Standard & Vendor Prefixes
            const requestFullScreen = docEl.requestFullscreen ||
                docEl.mozRequestFullScreen ||
                docEl.webkitRequestFullScreen ||
                docEl.msRequestFullscreen;

            const cancelFullScreen = doc.exitFullscreen ||
                doc.mozCancelFullScreen ||
                doc.webkitExitFullscreen ||
                doc.msExitFullscreen;

            const isFullScreen = doc.fullscreenElement ||
                doc.mozFullScreenElement ||
                doc.webkitFullscreenElement ||
                doc.msFullscreenElement;

            if (!isFullScreen) {
                if (requestFullScreen) {
                    // Note: This promise will FAIL if not user-triggered (browser security)
                    requestFullScreen.call(docEl).catch(err => {
                        console.log("Auto-Fullscreen blocked. User interaction required.");
                    });
                }
                if (btnIcon) {
                    btnIcon.classList.remove('fa-expand');
                    btnIcon.classList.add('fa-compress');
                }
            } else {
                if (cancelFullScreen) {
                    cancelFullScreen.call(doc);
                }
                if (btnIcon) {
                    btnIcon.classList.remove('fa-compress');
                    btnIcon.classList.add('fa-expand');
                }
            }
        }

        // Update Icon on ESC key or external change
        document.addEventListener('fullscreenchange', updateFsIcon);
        document.addEventListener('webkitfullscreenchange', updateFsIcon);
        document.addEventListener('mozfullscreenchange', updateFsIcon);
        document.addEventListener('MSFullscreenChange', updateFsIcon);

        function updateFsIcon() {
            const btnIcon = document.querySelector('#fsBtn i');
            if (!btnIcon) return;

            const isFullScreen = document.fullscreenElement ||
                document.webkitFullscreenElement ||
                document.mozFullScreenElement ||
                document.msFullscreenElement;

            if (!isFullScreen) {
                btnIcon.classList.remove('fa-compress');
                btnIcon.classList.add('fa-expand');
            } else {
                btnIcon.classList.remove('fa-expand');
                btnIcon.classList.add('fa-compress');
            }
        }

        // --- EXAMPLES LOAD LOGIC ---
        async function loadExamples() {
            const container = document.getElementById('examplesGrid');
            const subTitle = document.getElementById('examplesSubtitle');
            subTitle.innerText = "Fetching data...";

            container.innerHTML = `
                <div id="loaderContainer" class="col-span-full flex flex-col items-center justify-center py-10">
                    <i class="fas fa-circle-notch fa-spin text-4xl text-blue-500 mb-4"></i>
                    <div class="w-64 h-2 bg-gray-700 rounded-full overflow-hidden relative shadow-inner">
                        <div id="loaderBar" class="h-full bg-blue-500 transition-all duration-75 ease-out" style="width: 0%"></div>
                    </div>
                    <div id="loaderText" class="text-xs text-gray-400 mt-2 font-mono">0%</div>
                </div>
            `;

            const bar = document.getElementById('loaderBar');
            const txt = document.getElementById('loaderText');

            let progress = 0;
            const interval = setInterval(() => {
                if (progress < 90) {
                    progress += Math.random() * 5;
                    if (progress > 90) progress = 90;
                    if (bar) bar.style.width = `${progress}%`;
                    if (txt) txt.innerText = `${Math.round(progress)}%`;
                }
            }, 50);

            try {
                const start = Date.now();
                const response = await fetch('examples.json');
                if (!response.ok) throw new Error('Failed to load examples');
                const examples = await response.json();
                const end = Date.now();

                if (end - start < 600) {
                    await new Promise(r => setTimeout(r, 600 - (end - start)));
                }

                clearInterval(interval);
                bar.style.width = '100%';
                txt.innerText = '100%';
                subTitle.innerText = "Select a circuit to open";

                setTimeout(() => {
                    container.innerHTML = '';
                    examples.forEach(ex => {
                        const card = `
                            <a href="${ex.link}" class="example-card block bg-gray-700 p-4 rounded border border-gray-600 no-underline text-white" onclick="closeExamplesModal()">
                                <div class="flex justify-between items-start">
                                    <h3 class="font-bold text-blue-300">${ex.title}</h3>
                                    <svg class="svg-inline--fa fa-arrow-up-right-from-square text-xs text-gray-400" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="arrow-up-right-from-square" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" data-fa-i2svg=""><path fill="currentColor" d="M320 0c-17.7 0-32 14.3-32 32s14.3 32 32 32h82.7L201.4 265.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L448 109.3V192c0 17.7 14.3 32 32 32s32-14.3 32-32V32c0-17.7-14.3-32-32-32H320zM80 32C35.8 32 0 67.8 0 112V432c0 44.2 35.8 80 80 80H400c44.2 0 80-35.8 80-80V320c0-17.7-14.3-32-32-32s-32 14.3-32 32V432c0 8.8-7.2 16-16 16H80c-8.8 0-16-7.2-16-16V112c0-8.8 7.2-16 16-16H192c17.7 0 32-14.3 32-32s-14.3-32-32-32H80z"></path></svg>
                                </div>
                                <p class="text-xs text-gray-300 mt-1">${ex.description}</p>
                            </a>
                        `;
                        container.innerHTML += card;
                    });
                }, 200);

            } catch (error) {
                clearInterval(interval);
                console.error(error);
                subTitle.innerText = "Error";
                container.innerHTML = `
                    <div class="col-span-full text-center text-red-400 border border-red-500 p-4 rounded bg-red-900/20">
                        <svg class="svg-inline--fa fa-triangle-exclamation mb-2 text-2xl" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="triangle-exclamation" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" data-fa-i2svg=""><path fill="currentColor" d="M256 32c14.2 0 27.3 7.5 34.5 19.8l216 368c7.3 12.4 7.3 27.7 .2 40.1S486.3 480 472 480H40c-14.3 0-27.6-7.7-34.7-20.1s-7-27.8 .2-40.1l216-368C228.7 39.5 241.8 32 256 32zm0 128c-13.3 0-24 10.7-24 24V296c0 13.3 10.7 24 24 24s24-10.7 24-24V184c0-13.3-10.7-24-24-24zm32 224a32 32 0 1 0 -64 0 32 32 0 1 0 64 0z"></path></svg><br>
                        <strong>Error loading examples.</strong><br>
                        <span class="text-xs text-gray-400">check your internet connection</span>
                    </div>
                `;
            }
        }

        function openExamplesModal() {
            document.getElementById('examplesModal').style.display = 'flex';
            loadExamples();
        }

        function closeExamplesModal() {
            document.getElementById('examplesModal').style.display = 'none';
        }

        if (typeof sim === 'undefined') {
            window.sim = {
                newCircuit: () => console.log('New Circuit'),
                saveCircuit: () => console.log('Save Circuit'),
                setSimulationState: (state) => console.log('Sim State:', state),
                toggleGlobalLabels: () => console.log('Toggle Labels'),
                rotateSelection: () => console.log('Rotate'),
                deleteSelection: () => console.log('Delete'),
                openTruthTable: () => document.getElementById('ttModal').style.display = 'flex',
                closeTruthTable: () => document.getElementById('ttModal').style.display = 'none',
                addComponent: (type) => console.log('Add:', type),
                importCircuit: () => { },
                generateTruthTable: () => { },
                clearAlert: () => document.getElementById('alertBanner').style.display = 'none',
                hideContextMenu: () => document.getElementById('contextMenu').style.display = 'none'
            };
        }
    