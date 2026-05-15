
        // Data for mobile view switching
        function switchMobileView(view) {
            // Only effective on mobile
            if (window.innerWidth > 768) return;

            // Update Nav State
            document.querySelectorAll('.mobile-bottom-nav .nav-item').forEach(el => el.classList.remove('active'));
            const activeNav = document.getElementById('nav-' + view);
            if(activeNav) activeNav.classList.add('active');

            // Update View Visibility on Main Content
            const mainContent = document.querySelector('.main-content');

            // Remove all view classes
            mainContent.classList.remove('view-list', 'view-add', 'view-temp');

            // Add current view class
            mainContent.classList.add('view-' + view);
        }

        // Initialize mobile view
        document.addEventListener('DOMContentLoaded', () => {
            // Initial check
            if (window.innerWidth <= 768) {
                switchMobileView('list');
                document.querySelector('.mobile-bottom-nav').style.display = 'flex';
            } else {
                document.querySelector('.mobile-bottom-nav').style.display = 'none';
            }

            // Listen for resize
            window.addEventListener('resize', () => {
                if (window.innerWidth <= 768) {
                    document.querySelector('.mobile-bottom-nav').style.display = 'flex';
                    // If no view is set, set default
                    if (!document.querySelector('.main-content').classList.contains('view-list') &&
                        !document.querySelector('.main-content').classList.contains('view-add') &&
                        !document.querySelector('.main-content').classList.contains('view-temp')) {
                        switchMobileView('list');
                    }
                } else {
                    document.querySelector('.mobile-bottom-nav').style.display = 'none';
                    // Clean up classes so desktop view looks normal
                    const mainContent = document.querySelector('.main-content');
                    mainContent.classList.remove('view-list', 'view-add', 'view-temp');
                }
            });
        });

        // Setup overrides to auto-switch views on mobile interactions
        setTimeout(() => {
            // Helper to hook into existing functions
            function hookFunction(fnName, postAction) {
                if (typeof window[fnName] === 'function') {
                    const originalFn = window[fnName];
                    window[fnName] = function(...args) {
                        // Call original
                        const result = originalFn.apply(this, args);
                        // Call post action
                        postAction(...args);
                        return result;
                    }
                }
            }

            const switchToAddView = () => {
                if (window.innerWidth <= 768) {
                    switchMobileView('add');
                }
            };

            // Hook these functions to open the form view
            hookFunction('addNewLocation', switchToAddView);
            hookFunction('editItem', switchToAddView);
            hookFunction('editTempItem', switchToAddView);

            // Hook cancel to go back to list view
            hookFunction('cancelEdit', () => {
                 if (window.innerWidth <= 768) {
                    switchMobileView('list');
                }
            });

        }, 500);

        function toggleMobileHeader() {
            const header = document.querySelector('.app-header');
            const icon = document.getElementById('headerToggleIcon');

            header.classList.toggle('collapsed');

            if (header.classList.contains('collapsed')) {
                icon.textContent = '▼';
            } else {
                icon.textContent = '▲';
            }
        }

        function toggleTempStorage() {
            const content = document.getElementById('tempStorageList');
            const container = document.getElementById('tempStorageContainer');
            const btn = document.getElementById('toggleTempBtn');
            const isHidden = content.classList.toggle('hidden');
            btn.classList.toggle('collapsed', isHidden);
            container.classList.toggle('collapsed', isHidden);
        }

        // Auto-collapse header when clicking outside
        document.addEventListener('click', (event) => {
            if (window.innerWidth > 768) return;

            const header = document.querySelector('.app-header');
            // If header is expanded (not collapsed) and click is outside header
            if (header && !header.classList.contains('collapsed') && !header.contains(event.target)) {
                toggleMobileHeader(); // This toggles it to collapsed state
            }
        });
