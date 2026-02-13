
        // 數據存儲
        const STORAGE_KEY = 'storageManagementData';
        let storageData = {
            roots: [],
            nodes: [],
            leafs: [],
            tempStorage: [] // 临时存储的容器和物件
        };
        let currentEditId = null;
        let currentEditType = null;
        let expandedLocations = new Set();
        let selectedLocationId = null;
        let expandedNodes = new Set();
        let selectedNodeId = null;
        let isAddingToSpecificParent = false;

        // 搜索優化變量
        let searchTimeout;
        let searchResults = {
            matchingLeafIds: new Set(),
            matchingNodeIds: new Set(),
            nodesWithMatches: new Set(), // 包含匹配項的節點
            rootsWithMatches: new Set()  // 包含匹配項的地點
        };
        let nodeMap = new Map(); // ID -> Node 映射，用於快速查找

        // 層級構建器變量
        let hierarchyLevels = [];
        let hierarchyLevelCounter = 0;

        // 頁面載入初始化
        document.addEventListener('DOMContentLoaded', function() {
            loadData();
            updateStats();
            renderLocations();
            renderTempStorage();
            initializeHierarchy();
            initTagInput(); // 初始化標籤輸入系統
            initContentInput(); // 初始化內容物輸入系統

            // 为临时存储区域添加拖放事件监听器
            const tempStorageContent = document.getElementById('tempStorageList');
            if (tempStorageContent) {
                tempStorageContent.addEventListener('dragover', handleDragOver);
                tempStorageContent.addEventListener('drop', handleDropToTemp);
            }

            // 初始化表單欄位狀態
            updateFormFields();

            // 初始化父級輸入系統
            initParentInput();
        });

        // 載入數據
        function loadData() {
            const savedData = localStorage.getItem(STORAGE_KEY);
            if (savedData) {
                storageData = JSON.parse(savedData);
                // 确保 tempStorage 字段存在
                if (!storageData.tempStorage) {
                    storageData.tempStorage = [];
                }
            } else {
                // 初始化示例數據
                storageData = {
                    roots: [
                        { id: '1', name: '睡房', description: '主臥室', tags: ['私人'], timestamp: new Date().toISOString() },
                        { id: '2', name: '客廳', description: '公共區域', tags: [], timestamp: new Date().toISOString() },
                        { id: '3', name: '廚房', description: '烹飪區', tags: [], timestamp: new Date().toISOString() },
                        { id: '4', name: '書房', description: '工作學習', tags: [], timestamp: new Date().toISOString() },
                        { id: '99', name: '未分類', description: '暫存', tags: [], timestamp: new Date().toISOString() }
                    ],
                    nodes: [
                        // 睡房
                        { id: '101', name: '書桌頂櫃(中間)', parentType: 'root', parentId: '1', description: '', tags: [], timestamp: new Date().toISOString() },
                        { id: '102', name: '書桌頂櫃(右)', parentType: 'root', parentId: '1', description: '', tags: [], timestamp: new Date().toISOString() },
                        { id: '103', name: '書桌右空間', parentType: 'root', parentId: '1', description: '', tags: [], timestamp: new Date().toISOString() },

                        // 書桌右空間內部
                        { id: '1031', name: '鐵盒', parentType: 'node', parentId: '103', description: '', tags: [], timestamp: new Date().toISOString() },

                        // 客廳
                        { id: '201', name: '電視櫃', parentType: 'root', parentId: '2', description: '', tags: [], timestamp: new Date().toISOString() },
                        { id: '202', name: '鞋櫃', parentType: 'root', parentId: '2', description: '門口', tags: [], timestamp: new Date().toISOString() },
                        { id: '203', name: '雜物箱', parentType: 'root', parentId: '2', description: '透明膠箱', tags: [], timestamp: new Date().toISOString() },

                        // 廚房
                        { id: '301', name: '冰箱', parentType: 'root', parentId: '3', description: '', tags: [], timestamp: new Date().toISOString() },
                        { id: '302', name: '櫥櫃', parentType: 'root', parentId: '3', description: '上方', tags: [], timestamp: new Date().toISOString() },

                        // 書房
                        { id: '401', name: '書架', parentType: 'root', parentId: '4', description: 'IKEA書架', tags: [], timestamp: new Date().toISOString() },
                        { id: '402', name: '書桌抽屜', parentType: 'root', parentId: '4', description: '', tags: [], timestamp: new Date().toISOString() },

                        // 未分類
                        { id: '9901', name: '待整理箱', parentType: 'root', parentId: '99', description: '', tags: [], timestamp: new Date().toISOString() }
                    ],
                    leafs: [
                        // 睡房物品
                        { id: '1001', name: 'Swtich', parentType: 'node', parentId: '102', description: '', tags: ['遊戲機'], timestamp: new Date().toISOString() },
                        { id: '1002', name: '手機充電線', parentType: 'node', parentId: '1031', description: '', tags: [], timestamp: new Date().toISOString() },

                        // 客廳物品
                        { id: '2001', name: '遙控器', parentType: 'node', parentId: '201', description: '電視遙控', tags: [], timestamp: new Date().toISOString() },
                        { id: '2002', name: '運動鞋', parentType: 'node', parentId: '202', description: 'Nike', tags: ['鞋'], timestamp: new Date().toISOString() },
                        { id: '2003', name: '拖鞋', parentType: 'node', parentId: '202', description: '', tags: ['鞋'], timestamp: new Date().toISOString() },
                        { id: '2004', name: '電池', parentType: 'node', parentId: '203', description: 'AA電池', tags: ['消耗品'], timestamp: new Date().toISOString() },

                        // 廚房物品
                        { id: '3001', name: '牛奶', parentType: 'node', parentId: '301', description: '', tags: ['食品'], timestamp: new Date().toISOString() },
                        { id: '3002', name: '雞蛋', parentType: 'node', parentId: '301', description: '', tags: ['食品'], timestamp: new Date().toISOString() },
                        { id: '3003', name: '泡麵', parentType: 'node', parentId: '302', description: '', tags: ['食品'], timestamp: new Date().toISOString() },

                        // 書房物品
                        { id: '4001', name: '護照', parentType: 'node', parentId: '402', description: '重要證件', tags: ['證件'], timestamp: new Date().toISOString() },
                        { id: '4002', name: '備用鑰匙', parentType: 'node', parentId: '402', description: '', tags: ['雜物'], timestamp: new Date().toISOString() },
                        { id: '4003', name: '小說', parentType: 'node', parentId: '401', description: '哈利波特', tags: ['書籍'], timestamp: new Date().toISOString() },
                    ],
                    tempStorage: []
                };
                saveToStorage();
            }
            // 加載完成後更新標籤和項目名稱緩存
            updateTagsCache();
            updateNamesCache();
        }

        // 更新標籤緩存
        function updateTagsCache() {
            allTagsCache.clear();
            const collect = (items) => {
                items.forEach(item => {
                    if (item.tags && Array.isArray(item.tags)) {
                        item.tags.forEach(t => allTagsCache.add(t));
                    }
                });
            };
            collect(storageData.roots);
            collect(storageData.nodes);
            collect(storageData.leafs);
            collect(storageData.tempStorage);
        }

        // 更新項目名稱緩存
        function updateNamesCache() {
            allNamesCache = [];
            storageData.nodes.forEach(node => {
                allNamesCache.push({
                    id: node.id,
                    name: node.name,
                    type: 'node',
                    path: getItemPath('node', node.id)
                });
            });
            storageData.leafs.forEach(leaf => {
                allNamesCache.push({
                    id: leaf.id,
                    name: leaf.name,
                    type: 'leaf',
                    path: getItemPath(leaf.parentType, leaf.parentId)
                });
            });
        }

        // 保存到 LocalStorage
        function saveToStorage() {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(storageData));
            // 保存後更新標籤和項目名稱緩存
            updateTagsCache();
            updateNamesCache();
        }

        // --- 標籤管理系統 ---
        let currentTags = [];
        let allTagsCache = new Set();  // 標籤集合緩存，避免每次查詢都遍歷所有項目

        // --- 項目名稱管理系統 ---
        let allNamesCache = [];  // 項目名稱緩存，存儲所有節點和葉子的信息

        // --- 父級管理系統 ---
        let currentParentValue = ''; // 儲存選擇或創建的父級值
        let newCreatedParents = {}; // 儲存新創建的父級臨時信息

        function initTagInput() {
            const tagInput = document.getElementById('tagInput');
            const tagsSuggestions = document.getElementById('tagsSuggestions');

            if (!tagInput) return;

            // 輸入事件：顯示建議並移除紅邊
            tagInput.addEventListener('input', (e) => {
                const value = e.target.value.trim();
                // 移除紅邊
                tagInput.style.border = '';
                tagInput.style.boxShadow = '';
                // 顯示建議
                if (value) {
                    showTagSuggestions(value);
                } else {
                    tagsSuggestions.classList.remove('show');
                }
            });

            // 鍵盤事件：Enter添加，Backspace刪除
            tagInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const value = tagInput.value.trim();
                    if (value) {
                        addTag(value);
                        tagInput.value = '';
                        tagInput.style.border = '';
                        tagInput.style.boxShadow = '';
                        tagsSuggestions.classList.remove('show');
                    }
                } else if (e.key === 'Backspace' && !tagInput.value) {
                    if (currentTags.length > 0) {
                        removeTag(currentTags[currentTags.length - 1]);
                    }
                }
            });

            // 失去焦點時檢查是否有文字但未添加標籤
            tagInput.addEventListener('blur', (e) => {
                setTimeout(() => {
                    const value = tagInput.value.trim();
                    // 有文字但沒有添加到標籤中
                    if (value && !allTagsCache.has(value) && !currentTags.includes(value)) {
                        tagInput.style.border = '2px solid #ef4444';
                        tagInput.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.1)';
                    }
                }, 200);
            });

            // 聚焦顯示建議
            tagInput.addEventListener('focus', () => {
                const value = tagInput.value.trim();
                showTagSuggestions(value);
            });

            // 點擊外部關閉建議
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.tags-input-wrapper')) {
                    tagsSuggestions.classList.remove('show');
                }
            });
        }

        function getAllExistingTags() {
            // 直接使用緩存，避免每次都遍歷所有項目
            return Array.from(allTagsCache).sort();
        }

        function showTagSuggestions(filterText = '') {
            const tagsSuggestions = document.getElementById('tagsSuggestions');
            const existingTags = getAllExistingTags();
            const filteredTags = existingTags.filter(t =>
                t.toLowerCase().includes(filterText.toLowerCase()) &&
                !currentTags.includes(t)
            );

            let html = '';

            // 如果輸入了文字，且該文字不在現有標籤中，顯示"創建新標籤"選項
            if (filterText && !existingTags.includes(filterText) && !currentTags.includes(filterText)) {
                html += `
                    <div class="suggestion-item" onclick="addTag('${filterText}'); document.getElementById('tagInput').value = ''; document.getElementById('tagsSuggestions').classList.remove('show'); document.getElementById('tagInput').style.border = ''; document.getElementById('tagInput').style.boxShadow = '';">
                        <span>${filterText}</span>
                        <span class="new-tag-badge">創建新標籤</span>
                    </div>
                `;
            }

            // 顯示現有標籤建議
            filteredTags.forEach(tag => {
                // 計算該標籤的使用次數
                let count = 0;
                const countIn = (items) => items.forEach(i => { if(i.tags && i.tags.includes(tag)) count++; });
                countIn(storageData.roots);
                countIn(storageData.nodes);
                countIn(storageData.leafs);
                countIn(storageData.tempStorage);

                html += `
                    <div class="suggestion-item" onclick="addTag('${tag}'); document.getElementById('tagInput').value = ''; document.getElementById('tagsSuggestions').classList.remove('show'); document.getElementById('tagInput').style.border = ''; document.getElementById('tagInput').style.boxShadow = '';">
                        <span>${tag}</span>
                        <span class="count-badge">${count}</span>
                    </div>
                `;
            });

            if (html) {
                tagsSuggestions.innerHTML = html;
                tagsSuggestions.classList.add('show');
            } else {
                tagsSuggestions.classList.remove('show');
            }
        }

        function addTag(tag) {
            tag = tag.trim();
            if (tag && !currentTags.includes(tag)) {
                currentTags.push(tag);
                allTagsCache.add(tag);  // 新標籤添加到緩存
                const tagInput = document.getElementById('tagInput');
                tagInput.style.border = '';
                tagInput.style.boxShadow = '';
                renderTags();
            }
        }

        function removeTag(tag) {
            currentTags = currentTags.filter(t => t !== tag);
            renderTags();
        }

        function renderTags() {
            const container = document.getElementById('tagsContainer');
            const input = document.getElementById('tagInput');

            // 移除現有的 chips (保留 input)
            const chips = container.querySelectorAll('.tag-chip');
            chips.forEach(chip => chip.remove());

            // 插入新的 chips
            currentTags.forEach(tag => {
                const chip = document.createElement('div');
                chip.className = 'tag-chip';
                chip.innerHTML = `
                    ${tag}
                    <span class="tag-remove" onclick="removeTag('${tag}')">×</span>
                `;
                container.insertBefore(chip, input);
            });

            // 更新隱藏的 input 值 (為了兼容性)
            document.getElementById('tags').value = currentTags.join(', ');
        }

        // --- 內容物管理系統 (單選名稱) ---
        let currentContent = null; // 單個項目而非陣列

        function initContentInput() {
            const contentInput = document.getElementById('contentInput');
            const contentSuggestions = document.getElementById('contentSuggestions');

            if (!contentInput) return;

            contentInput.addEventListener('input', (e) => {
                const value = e.target.value.trim();
                // 移除红边
                contentInput.style.border = '';
                contentInput.style.boxShadow = '';
                // 显示建议
                if (value) {
                    showContentSuggestions(value);
                } else {
                    contentSuggestions.classList.remove('show');
                }
            });

            contentInput.addEventListener('focus', () => {
                const value = contentInput.value.trim();
                showContentSuggestions(value);
            });

            // 失去焦点时检查是否有文字但未选择
            contentInput.addEventListener('blur', (e) => {
                setTimeout(() => {
                    const value = contentInput.value.trim();
                    const itemType = document.getElementById('itemType').value;
                    // 只在建立容器/物件时检查
                    if ((itemType === 'node' || itemType === 'leaf') && value && !currentContent) {
                        // 有文字但没有选择，加红边
                        contentInput.style.border = '2px solid #ef4444';
                        contentInput.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.1)';
                    }
                }, 200);
            });

            document.addEventListener('click', (e) => {
                if (!e.target.closest('#contentsWrapper')) {
                    contentSuggestions.classList.remove('show');
                }
            });
        }

        function showContentSuggestions(filterText = '') {
            const contentSuggestions = document.getElementById('contentSuggestions');
            const filterLower = filterText.toLowerCase();
            const currentId = document.getElementById('editId').value; // 當前正在編輯的容器ID
            const currentType = document.getElementById('itemType').value; // 當前項目類型

            // 直接使用緩存，避免每次都遍歷所有項目
            let candidates = allNamesCache.filter(item => {
                if (item.id === currentId) return false; // 排除自身
                if (currentId && isAncestorOf(item.id, currentId)) return false; // 防止循環參考
                // 如果當前類型是容器(node)，只顯示容器；如果是物件(leaf)，只顯示物件
                if (currentType === 'node' && item.type !== 'node') return false;
                if (currentType === 'leaf' && item.type !== 'leaf') return false;
                return true;
            });

            // 過濾
            const filtered = candidates.filter(item =>
                (item.name.toLowerCase().includes(filterLower) || item.path.toLowerCase().includes(filterLower)) &&
                (!currentContent || currentContent.id !== item.id)
            );

            let html = '';

            // 創建新項目選項
            if (filterText) {
                if (currentType === 'node') {
                    html += `
                        <div class="suggestion-item create-new" onclick="createNewContent('${filterText.replace(/'/g, "\\'")}', 'node')" style="background: #ecfdf5; color: #047857;">
                            ✨ 創建新容器：<strong>"${filterText}"</strong>
                        </div>
                    `;
                } else if (currentType === 'leaf') {
                    html += `
                        <div class="suggestion-item create-new" onclick="createNewContent('${filterText.replace(/'/g, "\\'")}', 'leaf')" style="background: #fffbeb; color: #b45309;">
                            ✨ 創建新物件：<strong>"${filterText}"</strong>
                        </div>
                    `;
                }
            }

            // 顯示現有項目
            filtered.forEach(item => {
                const icon = item.type === 'node' ? '📦' : '🔖';
                html += `
                    <div class="suggestion-item" onclick="addContent('${item.id}', '${item.name.replace(/'/g, "\\'")}', '${item.type}')">
                        <div style="display: flex; flex-direction: column;">
                            <span>${icon} ${item.name}</span>
                        </div>
                    </div>
                `;
            });

            if (html) {
                contentSuggestions.innerHTML = html;
                contentSuggestions.classList.add('show');
            } else {
                contentSuggestions.classList.remove('show');
            }
        }

        function addContent(id, name, type, isNew = false) {
            currentContent = { id, name, type, isNew };
            renderContents();
            const contentInput = document.getElementById('contentInput');
            contentInput.value = '';
            contentInput.style.border = '';
            contentInput.style.boxShadow = '';
            document.getElementById('contentSuggestions').classList.remove('show');
        }

        function createNewContent(name, type) {
            const id = `new-${type}-${Date.now()}`;
            addContent(id, name, type, true);
        }

        function removeContent(id) {
            if (currentContent && currentContent.id === id) {
                currentContent = null;
            }
            renderContents();
        }

        function renderContents() {
            const container = document.getElementById('contentsContainer');
            const input = document.getElementById('contentInput');

            // 移除現有的 chips
            const chips = container.querySelectorAll('.tag-chip');
            chips.forEach(chip => chip.remove());

            // 插入新的 chip (只有一個)
            if (currentContent) {
                const chip = document.createElement('div');
                chip.className = 'tag-chip';
                const icon = currentContent.type === 'node' ? '📦' : '🔖';
                const newBadge = currentContent.isNew ? '<span style="font-size:0.8em; color:green;">(新)</span>' : '';

                chip.innerHTML = `
                    ${icon} ${currentContent.name} ${newBadge}
                    <span class="tag-remove" onclick="removeContent('${currentContent.id}')">×</span>
                `;
                container.insertBefore(chip, input);
            }
        }

        // 更新統計
        function updateStats() {
            // 更新左側 stats-bar（隱藏）
            document.getElementById('totalRoots').textContent = storageData.roots.length;
            document.getElementById('totalNodes').textContent = storageData.nodes.length;
            document.getElementById('totalLeafs').textContent = storageData.leafs.length;

            // 更新 header 中的統計信息
            document.getElementById('headerTotalRoots').textContent = storageData.roots.length;
            document.getElementById('headerTotalNodes').textContent = storageData.nodes.length;
            document.getElementById('headerTotalLeafs').textContent = storageData.leafs.length;
        }

        // 獲取排序後的兄弟項目（用於計算插入位置）
        function getSortedSiblings(parentType, parentId, excludeId = null) {
            const nodes = storageData.nodes.filter(n => n.parentType === parentType && n.parentId === parentId && n.id !== excludeId);
            const leafs = storageData.leafs.filter(l => l.parentType === parentType && l.parentId === parentId && l.id !== excludeId);

            const items = [
                ...nodes.map(n => ({ type: 'node', data: n })),
                ...leafs.map(l => ({ type: 'leaf', data: l }))
            ];

            items.sort((a, b) => new Date(a.data.timestamp) - new Date(b.data.timestamp));
            return items;
        }

        // 渲染混合項目（容器和物件），按時間排序
        function renderMixedItems(nodes, leafs, level = 0, parentId = null, searchText = '') {
            // 搜索時保留所有物品和容器，不進一步過濾
            let filteredNodes = nodes;
            let filteredLeafs = leafs;

            const items = [
                ...filteredNodes.map(n => ({ type: 'node', data: n })),
                ...filteredLeafs.map(l => ({ type: 'leaf', data: l }))
            ];

            // 容器優先，然後按時間戳排序
            items.sort((a, b) => {
                // 如果有選中的節點或其祖先，將其置頂
                if (selectedNodeId) {
                    const isASelectedOrAncestor = a.type === 'node' && (a.data.id === selectedNodeId || isAncestorOf(a.data.id, selectedNodeId));
                    const isBSelectedOrAncestor = b.type === 'node' && (b.data.id === selectedNodeId || isAncestorOf(b.data.id, selectedNodeId));

                    if (isASelectedOrAncestor && !isBSelectedOrAncestor) return -1;
                    if (!isASelectedOrAncestor && isBSelectedOrAncestor) return 1;
                }

                if (a.type !== b.type) {
                    return a.type === 'node' ? -1 : 1;
                }
                return new Date(a.data.timestamp) - new Date(b.data.timestamp);
            });

            return items.map(item => {
                if (item.type === 'node') {
                    return renderNodeCard(item.data, level, parentId, searchText);
                } else {
                    return renderLeafCard(item.data, searchText);
                }
            }).join('');
        }



        // 渲染地點列表
        function renderLocations(searchText = '') {
            const container = document.getElementById('locationsList');
            let roots = storageData.roots;

            // 搜索過濾 - 使用預計算結果
            if (searchText) {
                performSearch(searchText);

                // 找到包含匹配物件或容器的所有地點
                roots = roots.filter(root => {
                    // 檢查地點本身是否匹配
                    const isRootMatch = root.name.toLowerCase().includes(searchText.toLowerCase()) ||
                        (root.description && root.description.toLowerCase().includes(searchText.toLowerCase()));

                    // 檢查地點下是否有匹配的物件或容器
                    const hasMatches = searchResults.rootsWithMatches.has(root.id);

                    return isRootMatch || hasMatches;
                });
            }

            if (roots.length === 0) {
                container.innerHTML = `
                    <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #a0aec0;">
                        <p>暫無地點</p>
                        <p style="font-size: 12px; margin-top: 10px;">點擊上方 "+ 新增地點" 開始使用</p>
                    </div>
                `;
                return;
            }

            let selectedRoot = null;
            let selectedIndex = -1;

            // 如果有選中的地點，將其移到第一位
            let sortedRoots = [...roots];
            if (selectedLocationId) {
                const selectedRootIndex = sortedRoots.findIndex(r => r.id === selectedLocationId);
                if (selectedRootIndex > -1) {
                    const selectedRootItem = sortedRoots.splice(selectedRootIndex, 1)[0];
                    sortedRoots.unshift(selectedRootItem);
                }
            }

            const locationCards = [];

            sortedRoots.forEach((root) => {
                const itemCount = countRootItems(root.id);
                const isSelected = selectedLocationId === root.id;
                const isExpanded = isSelected || (searchText && searchText.trim() !== '');

                locationCards.push(`
                    <div class="location-grid-item ${isSelected ? 'selected' : ''}"
                         onclick="selectLocation('${root.id}')"
                         onmouseenter="showHoverPopup(event, 'root', '${root.id}')"
                         onmouseleave="hideHoverPopup()"
                         ondragover="handleDragOver(event)"
                         ondrop="handleDrop(event, 'root', '${root.id}')">
                        <div class="location-icon">🏠</div>
                        <div class="location-name">${root.name}</div>
                        <div class="location-count">${itemCount} 項</div>
                        <div class="location-actions">
                            <button class="btn-mini" onclick="editItem('root', '${root.id}'); event.stopPropagation(); return false;" title="編輯">✏️</button>
                            <button class="btn-mini" onclick="deleteItem('root', '${root.id}'); event.stopPropagation(); return false;" title="刪除">🗑️</button>
                        </div>
                    </div>
                `);

                if (isExpanded) {
                    let directNodes = storageData.nodes.filter(n => n.parentType === 'root' && n.parentId === root.id);
                    let directLeafs = storageData.leafs.filter(l => l.parentType === 'root' && l.parentId === root.id);

                    // 如果有搜索文本，過濾顯示匹配的項目
                    let displayNodes = directNodes;
                    let displayLeafs = directLeafs;

                    const detailPanel = `
                        <div class="location-detail-expanded" id="location-detail-${root.id}"
                             ondragover="handleDragOver(event)"
                             ondrop="handleDrop(event, 'root', '${root.id}')">
                            <div class="detail-header-inline" onclick="toggleDetailCollapse('${root.id}')" style="cursor: pointer;">
                                <h4>
                                    <span class="toggle-icon detail-toggle-icon" id="detail-toggle-${root.id}">▼</span>
                                    <span>🏠 ${root.name}</span>
                                </h4>
                                <div class="detail-actions-inline">
                                    <button class="btn-action-small" onclick="editItem('root', '${root.id}'); event.stopPropagation(); return false;">✏️ <span class="btn-text">編輯</span></button>
                                    <button class="btn-action-small danger" onclick="deleteItem('root', '${root.id}'); event.stopPropagation(); return false;">🗑️ <span class="btn-text">刪除</span></button>
                                    <button class="btn-action-small" onclick="closeDetail(); event.stopPropagation(); return false;">✕ <span class="btn-text">關閉</span></button>
                                </div>
                            </div>
                            <div class="detail-content-wrapper" id="detail-content-${root.id}">
                                <div class="nodes-grid-inline">
                                    ${renderMixedItems(displayNodes, displayLeafs, 0, root.id, searchText)}
                                    ${displayNodes.length === 0 && displayLeafs.length === 0 ? '<p class="empty-message">暂無容器或物件</p>' : ''}
                                </div>
                                <div class="add-section-inline">
                                    <button class="btn-add-item" onclick="addItemToLocation('${root.id}'); event.stopPropagation();">+ 添加容器/物件</button>
                                </div>
                            </div>
                        </div>
                    `;
                    locationCards.push(detailPanel);
                }
            });

            container.innerHTML = locationCards.join('');
        }

        // 計算地點下的項目數量
        function countRootItems(rootId) {
            const directNodes = storageData.nodes.filter(n => n.parentType === 'root' && n.parentId === rootId);
            const directLeafs = storageData.leafs.filter(l => l.parentType === 'root' && l.parentId === rootId);
            let count = directNodes.length + directLeafs.length;

            directNodes.forEach(node => {
                count += countNodeItems(node.id);
            });

            return count;
        }

        // 計算節點下的項目數量
        function countNodeItems(nodeId) {
            const childNodes = storageData.nodes.filter(n => n.parentType === 'node' && n.parentId === nodeId);
            const childLeafs = storageData.leafs.filter(l => l.parentType === 'node' && l.parentId === nodeId);
            let count = childNodes.length + childLeafs.length;

            childNodes.forEach(node => {
                count += countNodeItems(node.id);
            });

            return count;
        }

        // 渲染地點內容
        function renderLocationContent(root) {
            const directNodes = storageData.nodes.filter(n => n.parentType === 'root' && n.parentId === root.id);

            return `
                <div class="location-content">
                    <div class="detail-header">
                        <h4>📦 容器與物件</h4>
                        <div class="detail-actions">
                            <button class="btn-action-small" onclick="editItem('root', '${root.id}'); event.stopPropagation(); return false;">✏️ <span class="btn-text">編輯地點</span></button>
                            <button class="btn-action-small danger" onclick="deleteItem('root', '${root.id}'); event.stopPropagation(); return false;">🗑️ <span class="btn-text">刪除</span></button>
                        </div>
                    </div>
                    <div class="container-list">
                        ${directNodes.length > 0 ? directNodes.map(node => renderNodeItem(node)).join('') : '<p style="color: #a0aec0; font-size: 13px; padding: 10px 0;">暫無容器或物件</p>'}
                    </div>
                    <div class="add-section">
                        <button class="btn-add-item" onclick="addItemToLocation('${root.id}'); event.stopPropagation();">+ 添加容器/物件</button>
                    </div>
                </div>
            `;
        }

        // 渲染節點項目
        function renderNodeItem(node, level = 0) {
            const childNodes = storageData.nodes.filter(n => n.parentType === 'node' && n.parentId === node.id);
            const childLeafs = storageData.leafs.filter(l => l.parentType === 'node' && l.parentId === node.id);

            return `
                <div class="container-item" style="margin-left: ${level * 20}px;">
                    <div class="container-row">
                        <span class="container-icon">📦</span>
                        <span class="container-name">${node.name}</span>
                        <span class="item-count">${childNodes.length + childLeafs.length} 項</span>
                        <div class="item-actions">
                            <button class="btn-mini" onclick="editItem('node', '${node.id}'); event.stopPropagation(); return false;">✏️</button>
                            <button class="btn-mini" onclick="deleteItem('node', '${node.id}'); event.stopPropagation(); return false;">🗑️</button>
                        </div>
                    </div>
                    ${childLeafs.length > 0 || childNodes.length > 0 ? `
                        <div class="items-list">
                            ${childLeafs.map(leaf => `
                                <div class="item-row">
                                    <span class="item-icon">🔖</span>
                                    <span class="item-name">${leaf.name}</span>
                                    <div class="item-actions">
                                        <button class="btn-mini" onclick="editItem('leaf', '${leaf.id}'); event.stopPropagation(); return false;">✏️</button>
                                        <button class="btn-mini" onclick="deleteItem('leaf', '${leaf.id}'); event.stopPropagation(); return false;">🗑️</button>
                                    </div>
                                </div>
                            `).join('')}
                            ${childNodes.map(childNode => renderNodeItem(childNode, level + 1)).join('')}
                        </div>
                    ` : ''}
                </div>
            `;
        }

        // 選擇地點
        function selectLocation(rootId) {
            const searchText = document.getElementById('searchInput').value;
            if (selectedLocationId === rootId) {
                // 如果點擊同一個地點,則關閉詳情
                selectedLocationId = null;
            } else {
                selectedLocationId = rootId;
            }
            renderLocations(searchText);
        }

        // 關閉詳情面板
        function closeDetail() {
            const searchText = document.getElementById('searchInput').value;
            selectedLocationId = null;
            renderLocations(searchText);
        }

        // 渲染物件卡片
        function renderLeafCard(leaf, searchText = '') {
            const quantity = leaf.quantity || 1;

            // 檢查是否匹配搜索文本
            let isHighlighted = false;
            if (searchText) {
                const searchLower = searchText.toLowerCase();
                isHighlighted = leaf.name.toLowerCase().includes(searchLower) ||
                               (leaf.description && leaf.description.toLowerCase().includes(searchLower));
            }

            const highlightStyle = isHighlighted ? 'background-color: #fef3c7; border: 2px solid #fbbf24;' : '';

            return `
                <div class="leaf-card"
                     style="${highlightStyle}"
                     draggable="true"
                     onmouseenter="showHoverPopup(event, 'leaf', '${leaf.id}')"
                     onmouseleave="hideHoverPopup()"
                     ondragstart="handleDragStart(event, 'leaf', '${leaf.id}')"
                     ondragover="handleDragOver(event)"
                     ondrop="handleDrop(event, 'leaf', '${leaf.id}')">
                    <div class="leaf-icon">🔖</div>
                    <div class="leaf-content">
                        <div class="leaf-name">${leaf.name}</div>
                        <div class="leaf-count">${quantity} 個</div>
                    </div>
                    <div class="leaf-actions">
                        <button class="btn-mini" onclick="editItem('leaf', '${leaf.id}'); event.stopPropagation(); return false;">✏️</button>
                        <button class="btn-mini" onclick="deleteItem('leaf', '${leaf.id}'); event.stopPropagation(); return false;">🗑️</button>
                    </div>
                </div>
            `;
        }



        // 渲染節點卡片
        function renderNodeCard(node, level = 0, parentId = null, searchText = '') {
            let childNodes = storageData.nodes.filter(n => n.parentType === 'node' && n.parentId === node.id);
            const childLeafs = storageData.leafs.filter(l => l.parentType === 'node' && l.parentId === node.id);

            // 如果搜索，自動展開包含匹配項目的節點
            let isExpanded = expandedNodes.has(node.id);
            if (searchText) {
                // 使用預計算的結果：如果該節點包含匹配項（是匹配項的祖先），則展開
                const hasMatchingChildren = searchResults.nodesWithMatches.has(node.id);
                isExpanded = hasMatchingChildren || isExpanded;
            }

            const itemCount = childNodes.length + childLeafs.length;
            const hasChildren = childNodes.length > 0 || childLeafs.length > 0;
            const isSelected = selectedNodeId === node.id;

            // 檢查是否為選中節點的祖先
            const isAncestorOfSelected = selectedNodeId && isAncestorOf(node.id, selectedNodeId);
            const shouldBeFullWidth = isSelected || isAncestorOfSelected || (isExpanded && hasChildren);

            let html = `
                <div class="node-card ${isSelected ? 'selected-node' : ''} ${isAncestorOfSelected ? 'ancestor-node' : ''}"
                     style="${shouldBeFullWidth ? 'grid-column: 1 / -1;' : ''}"
                     ${!isExpanded ? 'draggable="true"' : ''}
                     ${!isExpanded ? `ondragstart="handleNodeDragStart(event, '${node.id}', ${isExpanded})"` : ''}
                     onmouseenter="showHoverPopup(event, 'node', '${node.id}')"
                     onmouseleave="hideHoverPopup()"
                     ondragover="handleDragOver(event)"
                     ondrop="handleDrop(event, 'node', '${node.id}')">
                    <div class="node-card-header"
                         ${isExpanded ? 'draggable="true"' : ''}
                         ${isExpanded ? `ondragstart="handleNodeDragStart(event, '${node.id}', ${isExpanded})"` : ''}>
                        <div class="node-header-content"
                             style="display: flex; flex-direction: column; align-items: center; width: 100%; cursor: pointer;"
                             onclick="handleHeaderClick(event, '${node.id}', '${parentId || 'root'}')">
                            ${hasChildren ? `
                                <button class="node-toggle" onclick="handleToggleClick(event, '${node.id}', '${parentId || 'root'}')">
                                    ${isExpanded ? '▼' : '▶'}
                                </button>
                            ` : '<span class="node-spacer"></span>'}
                            <div class="node-icon">📦</div>
                            <div style="display: flex; align-items: center; justify-content: center; gap: 5px;">
                                <div class="node-name" style="width: auto;">${node.name}</div>
                                <div class="node-count">${itemCount} 項</div>
                            </div>
                        </div>
                        <div class="node-actions">
                            <button class="btn-mini" onclick="editItem('node', '${node.id}'); event.stopPropagation(); return false;">✏️</button>
                            <button class="btn-mini" onclick="deleteItem('node', '${node.id}'); event.stopPropagation(); return false;">🗑️</button>
                        </div>
                    </div>
            `;

            // 如果展開且有子項目，顯示嵌套內容
            if (isExpanded && hasChildren) {
                html += `
                    <div class="node-children">
                        <div class="node-children-grid"
                             ondragover="handleDragOver(event)"
                             ondrop="handleDrop(event, 'node', '${node.id}')">
                            ${renderMixedItems(childNodes, childLeafs, level + 1, node.id, searchText)}
                            <div class="leaf-card add-item-card" onclick="addItemToNode('${node.id}'); event.stopPropagation();">
                                <div class="add-icon">+</div>
                            </div>
                        </div>
                    </div>
                `;
            } else if (isExpanded && !hasChildren) {
                // 如果展開但沒有子項目，只顯示添加按鈕
                html += `
                    <div class="node-children">
                        <div class="node-children-grid">
                            <div class="leaf-card add-item-card" onclick="addItemToNode('${node.id}'); event.stopPropagation();">
                                <div class="add-icon">+</div>
                            </div>
                        </div>
                    </div>
                `;
            }

            html += `</div>`;
            return html;
        }

        // 處理點擊事件，防止冒泡
        function handleToggleClick(event, nodeId, parentId) {
            event.stopPropagation();
            selectNode(nodeId, parentId);
        }

        function handleHeaderClick(event, nodeId, parentId) {
            event.stopPropagation();
            selectNode(nodeId, parentId);
        }

        // 選擇節點
        function selectNode(nodeId, parentId) {
            const searchText = document.getElementById('searchInput').value;

            // 如果點擊同一個節點, 取消選中並收起
            if (selectedNodeId === nodeId) {
                selectedNodeId = null;
                if (expandedNodes.has(nodeId)) {
                    expandedNodes.delete(nodeId);
                }
                renderLocations(searchText);
                renderTempStorage();
                return;
            }

            selectedNodeId = nodeId;

            // 自動找到並選中該節點所屬的地點 (Root)
            let currentNode = storageData.nodes.find(n => n.id === nodeId) ||
                             (storageData.tempStorage ? storageData.tempStorage.find(n => n.id === nodeId) : null);

            if (currentNode) {
                // 如果是直接在 Root 下的 Node
                if (currentNode.parentType === 'root') {
                    selectedLocationId = currentNode.parentId;
                } else {
                    // 如果是深層嵌套的 Node，向上查找直到找到 Root
                    let tempNode = currentNode;
                    while (tempNode && tempNode.parentType === 'node') {
                        tempNode = storageData.nodes.find(n => n.id === tempNode.parentId);
                    }
                    if (tempNode && tempNode.parentType === 'root') {
                        selectedLocationId = tempNode.parentId;
                    }
                }
            }

            // 收起所有其他節點，保留當前節點及其祖先鏈
            const ancestorIds = getAncestorIds(nodeId);
            const nodesToKeep = new Set([nodeId, ...ancestorIds]);

            // 只保留當前節點及其祖先的展開狀態
            const newExpandedNodes = new Set();
            expandedNodes.forEach(id => {
                if (nodesToKeep.has(id)) {
                    newExpandedNodes.add(id);
                }
            });
            expandedNodes = newExpandedNodes;

            // 自動展開該節點
            if (!expandedNodes.has(nodeId)) {
                expandedNodes.add(nodeId);
            }

            renderLocations(searchText);
            renderTempStorage();
        }

        // 獲取節點的所有祖先ID (防止無限循環)
        function getAncestorIds(nodeId) {
            const ancestors = [];
            let currentNode = storageData.nodes.find(n => n.id === nodeId) ||
                             (storageData.tempStorage ? storageData.tempStorage.find(n => n.id === nodeId) : null);
            const visited = new Set(); // 防止數據已損壞時的無限循環

            while (currentNode && currentNode.parentType === 'node') {
                if (visited.has(currentNode.id)) break;
                visited.add(currentNode.id);

                ancestors.push(currentNode.parentId);
                currentNode = storageData.nodes.find(n => n.id === currentNode.parentId) ||
                             (storageData.tempStorage ? storageData.tempStorage.find(n => n.id === currentNode.parentId) : null);
            }

            return ancestors;
        }

        // 檢查nodeId是否為targetId的祖先
        function isAncestorOf(nodeId, targetId) {
            const ancestors = getAncestorIds(targetId);
            return ancestors.includes(nodeId);
        }

        // 切換節點展開/折疊
        function toggleNode(nodeId) {
            if (expandedNodes.has(nodeId)) {
                expandedNodes.delete(nodeId);
            } else {
                expandedNodes.add(nodeId);
            }
            const searchText = document.getElementById('searchInput').value;
            renderLocations(searchText);
            renderTempStorage();
        }

        // 新增地點
        function addNewLocation() {
            resetForm();
            document.getElementById('itemType').value = 'root';
            updateFormFields();
            document.getElementById('contentInput').focus();
        }

        // 添加項目到地點
        function addItemToLocation(rootId) {
            resetForm();
            isAddingToSpecificParent = true;
            document.getElementById('itemType').value = 'node';

            // 1. 先更新表單以填充地點篩選選項
            updateFormFields();

            // 2. 設置地點篩選
            const filterSelect = document.getElementById('filterLocationId');
            if (filterSelect) {
                filterSelect.value = `root-${rootId}`;
            }

            // 3. 再次更新表單以根據篩選填充父級選項
            updateFormFields();

            // 4. 設置父級
            const root = storageData.roots.find(r => r.id === rootId);
            if (root) {
                document.getElementById('parentId').value = `root-${rootId}`;
                document.getElementById('parentInputField').value = `🏠 ${root.name}`;
            }

            // 5. 更新UI
            updateFormFields();

            document.getElementById('contentInput').focus();
            switchTab('form');
        }

        // 添加項目到節點
        function addItemToNode(nodeId) {
            resetForm();
            isAddingToSpecificParent = true;
            document.getElementById('itemType').value = 'node';

            // 1. 先更新表單以填充地點篩選選項
            updateFormFields();

            // 找到該節點所屬的地點以設置篩選
            let rootId = null;
            const node = storageData.nodes.find(n => n.id === nodeId);
            if (node) {
                if (node.parentType === 'root') {
                    rootId = node.parentId;
                } else {
                    let tempNode = node;
                    while (tempNode && tempNode.parentType === 'node') {
                        tempNode = storageData.nodes.find(n => n.id === tempNode.parentId);
                    }
                    if (tempNode && tempNode.parentType === 'root') {
                        rootId = tempNode.parentId;
                    }
                }
            }

            // 2. 設置地點篩選
            const filterSelect = document.getElementById('filterLocationId');
            if (filterSelect && rootId) {
                filterSelect.value = `root-${rootId}`;
            }

            // 3. 再次更新表單以根據篩選填充父級選項
            updateFormFields();

            // 4. 設置父級
            document.getElementById('parentId').value = `node-${nodeId}`;
            const parentPath = getItemPath('node', nodeId);
            document.getElementById('parentInputField').value = parentPath;

            // 5. 更新UI
            updateFormFields();

            document.getElementById('contentInput').focus();
            switchTab('form');
        }

        // 清除父級選擇
        function clearParentSelection() {
            document.getElementById('parentId').value = "";
            isAddingToSpecificParent = false;
            updateFormFields();
        }

        // 更新表單欄位
        function updateFormFields() {
            const itemType = document.getElementById('itemType').value;
            const editType = document.getElementById('editType').value;
            const parentField = document.getElementById('parentField');
            const quantityField = document.getElementById('quantityField');
            const filterLocationField = document.getElementById('filterLocationField');
            const parentHint = document.getElementById('parentHint');
            const contentField = document.getElementById('contentField');

            // 如果是临时存储项目，不需要父级选择
            if (editType === 'temp') {
                parentField.style.display = 'none';
                filterLocationField.style.display = 'none';
                if (contentField) contentField.style.display = 'block';
                const nameField = document.getElementById('nameField');
                if (nameField) nameField.style.display = 'none';

                // 臨時存儲如果是 leaf 類型也顯示數量
                if (itemType === 'leaf') {
                    quantityField.style.display = 'block';
                } else {
                    quantityField.style.display = 'none';
                }
                return;
            }

            if (itemType === 'root') {
                parentField.style.display = 'none';
                quantityField.style.display = 'none';
                filterLocationField.style.display = 'none';
                if (contentField) contentField.style.display = 'none';
                const nameField = document.getElementById('nameField');
                if (nameField) nameField.style.display = 'block';
            } else {
                // 預設顯示父級 (當類型為空、node 或 leaf 時)
                parentField.style.display = 'block';
                quantityField.style.display = itemType === 'leaf' ? 'block' : 'none';
                filterLocationField.style.display = itemType === 'node' ? 'block' : 'none';
                if (contentField) contentField.style.display = 'block';
                const nameField = document.getElementById('nameField');
                if (nameField) nameField.style.display = 'none';

                if (itemType === 'node') populateFilterLocations();

                // 重新顯示父級建議
                // showParentSuggestions('');
                if (parentHint) parentHint.style.display = 'block';
            }

        }

        // 填充地點篩選選項
        function populateFilterLocations() {
            const filterSelect = document.getElementById('filterLocationId');
            const currentValue = filterSelect.value;
            filterSelect.innerHTML = '<option value="">所有地點</option>';

            storageData.roots.forEach(root => {
                filterSelect.innerHTML += `<option value="root-${root.id}">🏠 ${root.name}</option>`;
            });

            // 恢復之前的選擇
            if (currentValue) {
                filterSelect.value = currentValue;
            }
        }

        // 初始化父級輸入
        function initParentInput() {
            const parentInput = document.getElementById('parentInputField');
            const parentSuggestions = document.getElementById('parentSuggestions');

            if (!parentInput) return;

            // 輸入事件：顯示建議
            parentInput.addEventListener('input', (e) => {
                const value = e.target.value.trim();
                if (value) {
                    showParentSuggestions(value);
                } else {
                    parentSuggestions.classList.remove('show');
                }
            });

            // 聚焦顯示建議
            parentInput.addEventListener('focus', () => {
                const value = parentInput.value.trim();
                showParentSuggestions(value || '');
            });

            // 點擊外部關閉建議
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.parent-input-wrapper')) {
                    parentSuggestions.classList.remove('show');
                }
            });
        }

        // 顯示父級建議
        function showParentSuggestions(filterText = '') {
            const parentSuggestions = document.getElementById('parentSuggestions');
            const itemType = document.getElementById('itemType').value;
            const filterLocationId = document.getElementById('filterLocationId')?.value || '';

            let availableParents = [];
            const filterTextLower = filterText.toLowerCase();

            // 根據類型獲取可用的父級
            if (itemType === 'node') {
                // Node 可以在 Root 或其他 Node 下
                if (filterLocationId) {
                    const [filterType, filterId] = filterLocationId.split('-');
                    if (filterType === 'root') {
                        const root = storageData.roots.find(r => r.id === filterId);
                        if (root) {
                            availableParents.push({ id: `root-${root.id}`, name: `🏠 ${root.name}`, type: 'root' });
                        }
                        storageData.nodes.forEach(node => {
                            let isUnderRoot = false;
                            if (node.parentType === 'root' && node.parentId === filterId) {
                                isUnderRoot = true;
                            } else {
                                let tempNode = node;
                                while (tempNode && tempNode.parentType === 'node') {
                                    tempNode = storageData.nodes.find(n => n.id === tempNode.parentId);
                                }
                                if (tempNode && tempNode.parentType === 'root' && tempNode.parentId === filterId) {
                                    isUnderRoot = true;
                                }
                            }
                            if (isUnderRoot) {
                                const path = getItemPath('node', node.id);
                                availableParents.push({ id: `node-${node.id}`, name: `📦 ${path}`, type: 'node' });
                            }
                        });
                    }
                } else {
                    storageData.roots.forEach(root => {
                        availableParents.push({ id: `root-${root.id}`, name: `🏠 ${root.name}`, type: 'root' });
                    });
                    storageData.nodes.forEach(node => {
                        const path = getItemPath('node', node.id);
                        availableParents.push({ id: `node-${node.id}`, name: `📦 ${path}`, type: 'node' });
                    });
                }
            } else if (itemType === 'leaf') {
                // Leaf 可以在 Root 或 Node 下
                storageData.roots.forEach(root => {
                    availableParents.push({ id: `root-${root.id}`, name: `🏠 ${root.name}`, type: 'root' });
                });
                storageData.nodes.forEach(node => {
                    const path = getItemPath('node', node.id);
                    availableParents.push({ id: `node-${node.id}`, name: `📦 ${path}`, type: 'node' });
                });
            }

            // 過濾建議
            const filteredParents = availableParents.filter(p =>
                p.name.toLowerCase().includes(filterTextLower)
            );

            let html = '';

            // 如果輸入了文字，且該文字不在現有父級中，顯示"創建新父級"選項
            if (filterText && !availableParents.some(p => p.name.toLowerCase().includes(filterTextLower))) {
                const itemTypeLabel = itemType === 'node' ? '容器' : '物件';
                html += `
                    <div class="suggestion-item create-new" onclick="createNewParent('${filterText.replace(/'/g, "\\'")}', '${itemType}')" style="background: #ecfdf5; color: #047857; font-weight: 500;">
                        ✨ 創建新${itemTypeLabel}：<strong>"${filterText}"</strong>
                    </div>
                `;
            }

            // 顯示現有父級建議
            filteredParents.forEach(parent => {
                html += `
                    <div class="suggestion-item" onclick="selectParent('${parent.id}', '${parent.name.replace(/'/g, "\\'")}')" style="cursor: pointer;">
                        ${parent.name}
                    </div>
                `;
            });

            if (html) {
                parentSuggestions.innerHTML = html;
                parentSuggestions.classList.add('show');
            } else {
                parentSuggestions.classList.remove('show');
            }
        }

        // 選擇已存在的父級
        function selectParent(parentId, parentName) {
            document.getElementById('parentInputField').value = parentName;
            document.getElementById('parentId').value = parentId;
            currentParentValue = parentId;
            document.getElementById('parentSuggestions').classList.remove('show');
        }

        // 創建新的父級
        function createNewParent(parentName, itemType) {
            const filterId = document.getElementById('filterLocationId')?.value || '';
            let parentType, parentId;

            if (itemType === 'node') {
                // 新容器的父級
                if (filterId) {
                    const [filterType, fId] = filterId.split('-');
                    parentType = filterType;
                    parentId = fId;
                } else {
                    // 如果沒有選擇限制地點，默認在\"未分類\"下
                    const unclassifiedRoot = storageData.roots.find(r => r.name === '未分類');
                    if (unclassifiedRoot) {
                        parentType = 'root';
                        parentId = unclassifiedRoot.id;
                    } else {
                        alert('請先選擇限制地點或創建地點');
                        return;
                    }
                }

                // 創建新容器對象
                const newNodeId = `new-node-${Date.now()}`;
                const newNode = {
                    id: newNodeId,
                    name: parentName,
                    parentType: parentType,
                    parentId: parentId,
                    description: '',
                    tags: [],
                    timestamp: new Date().toISOString(),
                    isNewTemp: true // 標記為臨時新創建
                };

                // 暫存新創建的節點
                newCreatedParents[newNodeId] = newNode;

                // 更新輸入框和隱藏值
                const displayName = `📦 ${parentName}`;
                document.getElementById('parentInputField').value = displayName;
                document.getElementById('parentId').value = newNodeId;
                currentParentValue = newNodeId;
                document.getElementById('parentSuggestions').classList.remove('show');
            }
        }

        // 處理父級輸入改變
        function handleParentInputChange() {
            // 當輸入框改變時，重新顯示建議
            const inputValue = document.getElementById('parentInputField').value.trim();
            if (inputValue) {
                showParentSuggestions(inputValue);
            } else {
                document.getElementById('parentId').value = '';
                currentParentValue = '';
                document.getElementById('parentSuggestions').classList.remove('show');
            }
        }

        // 填充父級選項 (已棄用，改用輸入框系統)
        function populateParentOptions(childType) {
            return;
        }

        // 獲取項目路徑
        function getItemPath(type, id) {
            let path = [];
            let currentType = type;
            let currentId = id;

            while (currentId) {
                let item;
                if (currentType === 'root') {
                    item = storageData.roots.find(r => r.id === currentId);
                    if (item) {
                        path.unshift(item.name);
                        break;
                    }
                } else if (currentType === 'node') {
                    item = storageData.nodes.find(n => n.id === currentId);
                    if (item) {
                        path.unshift(item.name);
                        if (item.parentType && item.parentId) {
                            currentType = item.parentType;
                            currentId = item.parentId;
                        } else {
                            break;
                        }
                    } else {
                        break;
                    }
                } else {
                    break;
                }
            }

            return path.join(' → ');
        }

        // 獲取用於日誌的完整路徑
        function getLogPath(type, id) {
            if (type === 'temp') return '臨時存儲';

            let item;
            if (type === 'root') item = storageData.roots.find(i => i.id === id);
            else if (type === 'node') item = storageData.nodes.find(i => i.id === id);
            else if (type === 'leaf') item = storageData.leafs.find(i => i.id === id);

            if (!item) return '未知';

            if (type === 'root') return item.name;

            if (type === 'node') {
                return getItemPath('node', id);
            }

            if (type === 'leaf') {
                const parentPath = getItemPath(item.parentType, item.parentId);
                return `${parentPath} . ${item.name}`;
            }

            return item.name;
        }

        // 保存數據
        function saveData(event) {
            event.preventDefault();

            const itemType = document.getElementById('itemType').value;
            const itemName = document.getElementById('itemName').value.trim(); // Root 使用
            const itemQuantity = document.getElementById('itemQuantity').value;
            const description = document.getElementById('description').value.trim();
            // 使用新的標籤系統
            const tags = [...currentTags];
            const editId = document.getElementById('editId').value;
            const editType = document.getElementById('editType').value;

            // Root 類型使用 itemName，Node/Leaf 使用 currentContent
            if (itemType === 'root') {
                if (!itemName) {
                    alert('請輸入地點名稱！');
                    return;
                }
            } else {
                const contentInput = document.getElementById('contentInput');
                const hasUnselectedText = contentInput.value.trim() && !currentContent;

                if (!currentContent) {
                    if (hasUnselectedText) {
                        alert('請從建議中選擇 新容器 或 新物件！');
                        contentInput.style.border = '2px solid #ef4444';
                        contentInput.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.1)';
                        contentInput.focus();
                    } else {
                        alert('請選擇或輸入名稱！');
                    }
                    return;
                }
            }

            // 檢查標籤輸入框是否有未保存的文字
            const tagInput = document.getElementById('tagInput');
            const hasUnselectedTag = tagInput.value.trim() && !currentTags.includes(tagInput.value.trim());
            if (hasUnselectedTag) {
                alert('請添加或清空標籤輸入框！');
                tagInput.style.border = '2px solid #ef4444';
                tagInput.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.1)';
                tagInput.focus();
                return;
            }

            const data = {
                id: itemType === 'root' ? (Date.now().toString() + Math.random().toString(36).substr(2, 5)) : (currentContent.isNew ? (Date.now().toString() + Math.random().toString(36).substr(2, 5)) : currentContent.id),
                name: itemType === 'root' ? itemName : currentContent.name,
                    description: description,
                    tags: tags,
                    timestamp: new Date().toISOString()
                };

            if (editId) {
                data.id = editId;
            }

            if (itemType === 'leaf') {
                data.quantity = itemQuantity ? parseInt(itemQuantity) : 1;
            }

            // 如果是临时存储
            if (editType === 'temp') {
                if (itemType !== 'node' && itemType !== 'leaf') {
                    alert('臨時存儲只能添加容器或物件');
                    return;
                }

                data.type = itemType;

                if (editId) {
                    // 更新临时项目
                    const index = storageData.tempStorage.findIndex(item => item.id === editId);
                    if (index !== -1) {
                        storageData.tempStorage[index] = data;
                    }
                } else {
                    // 新增临时项目
                    if (currentContent.isNew) {
                        storageData.tempStorage.push(data);
                    } else {
                        // 現有項目複製到臨時存儲
                        data.id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
                        storageData.tempStorage.push(data);
                    }
                }
            } else {
                // 處理 Root 類型直接保存
                if (itemType === 'root') {
                    if (editId && editType) {
                        updateItem(editType, data);
                    } else {
                        storageData.roots.push(data);
                    }
                } else {
                    // 處理父級關係 (Node/Leaf)
                    if (itemType === 'node' || itemType === 'leaf') {
                        const parentValue = document.getElementById('parentId').value;
                        if (!parentValue) {
                            alert(`${itemType === 'node' ? '容器' : '物件'}必須選擇父級！`);
                            return;
                        }

                    // 如果父級是新創建的臨時節點，先保存到 storageData
                    if (newCreatedParents[parentValue]) {
                        const newParent = newCreatedParents[parentValue];
                        const realId = Date.now().toString() + '-node'; // 生成真實 ID
                        newParent.id = realId;
                        delete newParent.isNewTemp;
                        storageData.nodes.push(newParent);
                        delete newCreatedParents[parentValue];
                        // 更新子項目的父級 ID 為真實 ID
                        document.getElementById('parentId').value = `node-${realId}`;
                        const updatedParentValue = document.getElementById('parentId').value;
                        const [parentType, parentId] = updatedParentValue.split('-');
                        data.parentType = parentType;
                        data.parentId = parentId;
                    } else {
                        const [parentType, parentId] = parentValue.split('-');
                        data.parentType = parentType;
                        data.parentId = parentId;
                    }
                }

                // 處理容器的限制地點
                if (itemType === 'node') {
                    const filterLocationId = document.getElementById('filterLocationId')?.value || '';
                    if (filterLocationId) {
                        // 如果選擇了限制地點，將其保存到容器
                        const [, rootId] = filterLocationId.split('-');
                        data.restrictedRootId = rootId;
                    } else {
                        // 如果沒有選擇限制地點，清除該字段
                        delete data.restrictedRootId;
                    }
                }

                // 編輯或新增
                if (editId && editType) {
                    updateItem(editType, data);
                } else {
                    // 如果是現有項目，則是移動操作
                    if (!currentContent.isNew) {
                        // 找到原項目並更新父級
                        let originalItem;
                        if (currentContent.type === 'root') originalItem = storageData.roots.find(r => r.id === currentContent.id);
                        else if (currentContent.type === 'node') originalItem = storageData.nodes.find(n => n.id === currentContent.id);
                        else if (currentContent.type === 'leaf') originalItem = storageData.leafs.find(l => l.id === currentContent.id);

                        if (originalItem) {
                            originalItem.parentType = data.parentType;
                            originalItem.parentId = data.parentId;
                            // 更新其他屬性
                            originalItem.description = data.description;
                            originalItem.tags = data.tags;
                            if (itemType === 'leaf') originalItem.quantity = data.quantity;
                            if (itemType === 'node') originalItem.restrictedRootId = data.restrictedRootId;
                        }
                    } else {
                        // 創建新項目
                        if (itemType === 'node') {
                            storageData.nodes.push(data);
                        } else if (itemType === 'leaf') {
                            storageData.leafs.push(data);
                        }
                    }
                    }
                }
            }

            showNotification(editId ? '更新成功！' : '新增成功！', 'success');
            saveToStorage();
            resetForm();
            updateStats();
            renderLocations();
        }

        // 更新項目
        function updateItem(type, data) {
            let array;
            if (type === 'root') array = storageData.roots;
            else if (type === 'node') array = storageData.nodes;
            else if (type === 'leaf') array = storageData.leafs;
            else if (type === 'temp') array = storageData.tempStorage;

            const index = array.findIndex(item => item.id === data.id);
            if (index !== -1) {
                // 保留原有的父級關係
                if (!data.parentType && array[index].parentType) {
                    data.parentType = array[index].parentType;
                    data.parentId = array[index].parentId;
                }
                // 保留原有的容器限制地點（如果新數據中沒有明確設置）
                if (type === 'node' && !('restrictedRootId' in data) && 'restrictedRootId' in array[index]) {
                    data.restrictedRootId = array[index].restrictedRootId;
                }
                array[index] = data;
            }
        }

        // 編輯項目
        function editItem(type, id) {
            let item;
            if (type === 'root') item = storageData.roots.find(r => r.id === id);
            else if (type === 'node') item = storageData.nodes.find(n => n.id === id);
            else if (type === 'leaf') item = storageData.leafs.find(l => l.id === id);

            if (item) {
                // 清除輸入框文本
                const contentInput = document.getElementById('contentInput');
                if (contentInput) {
                    contentInput.value = '';
                }

                const tagInput = document.getElementById('tagInput');
                if (tagInput) {
                    tagInput.value = '';
                }

                // 關閉建議下拉列表
                const tagsSuggestions = document.getElementById('tagsSuggestions');
                if (tagsSuggestions) {
                    tagsSuggestions.classList.remove('show');
                }

                const contentSuggestions = document.getElementById('contentSuggestions');
                if (contentSuggestions) {
                    contentSuggestions.classList.remove('show');
                }

                // 自動切換到"添加項目"分頁
                switchTab('form');
                isAddingToSpecificParent = false;

                document.getElementById('itemType').value = type;
                updateFormFields();

                document.getElementById('editId').value = item.id;
                document.getElementById('editType').value = type;
                // document.getElementById('itemName').value = item.name; // 已棄用
                document.getElementById('description').value = item.description || '';

                // 更新標籤系統
                currentTags = item.tags ? [...item.tags] : [];
                renderTags();
                // document.getElementById('tags').value = item.tags ? item.tags.join(', ') : ''; // 已由 renderTags 處理

                // 填充名稱
                if (type === 'root') {
                    // Root 類型使用 itemName
                    document.getElementById('itemName').value = item.name;
                } else {
                    // Node/Leaf 使用內容物系統
                    currentContent = { id: item.id, name: item.name, type: type, isNew: false };
                    renderContents();
                }

                if (type === 'leaf') {
                    document.getElementById('itemQuantity').value = item.quantity || 1;
                }

                if (type === 'node') {
                    const filterSelect = document.getElementById('filterLocationId');
                    if (filterSelect) {
                        filterSelect.value = item.restrictedRootId ? `root-${item.restrictedRootId}` : '';
                        populateParentOptions('node');
                    }
                }

                if (item.parentType && item.parentId) {
                    const parentValue = `${item.parentType}-${item.parentId}`;
                    document.getElementById('parentId').value = parentValue;

                    // 更新父級輸入框顯示
                    let parentDisplayName = '';
                    if (item.parentType === 'root') {
                        const root = storageData.roots.find(r => r.id === item.parentId);
                        parentDisplayName = root ? `🏠 ${root.name}` : '未知地點';
                    } else if (item.parentType === 'node') {
                        parentDisplayName = getItemPath('node', item.parentId);
                    }
                    document.getElementById('parentInputField').value = parentDisplayName;
                }

                updateFormFields();

                // 顯示編輯橫幅
                const formTab = document.getElementById('formTab');
                if (formTab) formTab.textContent = '✏️ 編輯項目';
                document.getElementById('editBannerText').textContent = `✏️ 正在編輯：${item.name}`;
                document.getElementById('editBanner').style.display = 'flex';

                currentEditId = id;
                currentEditType = type;

                // 滾動到表單
                document.querySelector('.form-container').scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }

        // 刪除項目
        function deleteItem(type, id) {
            let item;
            let itemName;
            if (type === 'root') {
                item = storageData.roots.find(r => r.id === id);
                itemName = item?.name || '該地點';
            } else if (type === 'node') {
                item = storageData.nodes.find(n => n.id === id);
                itemName = item?.name || '該容器';
            } else if (type === 'leaf') {
                item = storageData.leafs.find(l => l.id === id);
                itemName = item?.name || '該物件';
            }

            // 檢查是否有子項目
            let hasChildren = false;
            let childCount = 0;

            if (type === 'root') {
                const children = storageData.nodes.filter(n => n.parentType === 'root' && n.parentId === id);
                hasChildren = children.length > 0;
                childCount = countRootItems(id);
            } else if (type === 'node') {
                const childNodes = storageData.nodes.filter(n => n.parentType === 'node' && n.parentId === id);
                const childLeafs = storageData.leafs.filter(l => l.parentType === 'node' && l.parentId === id);
                hasChildren = childNodes.length > 0 || childLeafs.length > 0;
                childCount = countNodeItems(id);
            }

            let message = `確定要刪除「${itemName}」嗎？`;
            if (hasChildren) {
                message = `「${itemName}」下有 ${childCount} 個項目，刪除將會一併刪除所有子項目。\n\n確定要繼續嗎？`;
            }

            if (!confirm(message)) {
                return;
            }

            // 執行刪除
            if (hasChildren) {
                deleteItemAndChildren(type, id);
            } else {
                removeItem(type, id);
            }

            saveToStorage();
            updateStats();
            renderLocations();
            showNotification('刪除成功', 'success');

            // 如果正在編輯該項目，重置表單
            if (currentEditId === id) {
                resetForm();
            }
        }

        // 遞歸刪除項目及其子項目
        function deleteItemAndChildren(type, id) {
            if (type === 'root') {
                const childNodes = storageData.nodes.filter(n => n.parentType === 'root' && n.parentId === id);
                childNodes.forEach(node => deleteItemAndChildren('node', node.id));
                removeItem('root', id);
            } else if (type === 'node') {
                const childNodes = storageData.nodes.filter(n => n.parentType === 'node' && n.parentId === id);
                childNodes.forEach(node => deleteItemAndChildren('node', node.id));
                const childLeafs = storageData.leafs.filter(l => l.parentType === 'node' && l.parentId === id);
                childLeafs.forEach(leaf => removeItem('leaf', leaf.id));
                removeItem('node', id);
            }
        }

        // 移除單個項目
        function removeItem(type, id) {
            if (type === 'root') {
                storageData.roots = storageData.roots.filter(r => r.id !== id);
                expandedLocations.delete(id);
            } else if (type === 'node') {
                storageData.nodes = storageData.nodes.filter(n => n.id !== id);
            } else if (type === 'leaf') {
                storageData.leafs = storageData.leafs.filter(l => l.id !== id);
            }
        }

        // 重置表單
        function resetForm() {
            document.getElementById('dataForm').reset();
            document.getElementById('editId').value = '';
            document.getElementById('editType').value = '';
            document.getElementById('parentId').value = '';
            document.getElementById('parentInputField').value = '';
            const formTab = document.getElementById('formTab');
            if (formTab) formTab.textContent = '➕ 添加項目';
            document.getElementById('editBanner').style.display = 'none';
            currentEditId = null;
            currentEditType = null;
            isAddingToSpecificParent = false;
            currentParentValue = '';
            newCreatedParents = {};

            // 重置標籤
            currentTags = [];
            renderTags();

            // 重置內容物
            currentContent = null;
            renderContents();

            updateFormFields();
        }

        // 取消編輯
        function cancelEdit() {
            resetForm();
        }

        // 搜索過濾 (Debounced)
        function filterLocations(searchText) {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                // 搜索前收起所有已打開的容器並取消激活
                if (searchText && searchText.trim() !== '') {
                    expandedNodes.clear();  // 收起所有容器
                    selectedNodeId = null;  // 取消選中的節點 (移除 selected-node class)
                }
                renderLocations(searchText);
            }, 300);
        }

        // 執行搜索預計算
        function performSearch(searchText) {
            const searchLower = searchText.toLowerCase();
            searchResults.matchingLeafIds.clear();
            searchResults.matchingNodeIds.clear();
            searchResults.nodesWithMatches.clear();
            searchResults.rootsWithMatches.clear();
            nodeMap.clear();

            if (!searchText) return;

            // 建立 Node Map
            storageData.nodes.forEach(n => nodeMap.set(n.id, n));

            // 1. 查找直接匹配
            storageData.leafs.forEach(l => {
                if (l.name.toLowerCase().includes(searchLower) || (l.description && l.description.toLowerCase().includes(searchLower))) {
                    searchResults.matchingLeafIds.add(l.id);
                }
            });
            storageData.nodes.forEach(n => {
                if (n.name.toLowerCase().includes(searchLower)) {
                    searchResults.matchingNodeIds.add(n.id);
                }
            });

            // 2. 向上傳播標記
            const markAncestors = (parentType, parentId) => {
                if (parentType === 'node') {
                    if (searchResults.nodesWithMatches.has(parentId)) return; // 已標記，無需重複遍歷
                    searchResults.nodesWithMatches.add(parentId);

                    const parentNode = nodeMap.get(parentId);
                    if (parentNode) {
                        markAncestors(parentNode.parentType, parentNode.parentId);
                    }
                } else if (parentType === 'root') {
                    searchResults.rootsWithMatches.add(parentId);
                }
            };

            // 處理匹配的物件
            storageData.leafs.forEach(l => {
                if (searchResults.matchingLeafIds.has(l.id)) {
                    markAncestors(l.parentType, l.parentId);
                }
            });

            // 處理匹配的節點
            storageData.nodes.forEach(n => {
                if (searchResults.matchingNodeIds.has(n.id)) {
                    markAncestors(n.parentType, n.parentId);
                }
            });
        }

        // 導出 JSON
        function exportToJSON() {
            const dataStr = JSON.stringify(storageData, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `storage_export_${getDateString()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showNotification('導出成功！', 'success');
        }

        // 導入數據
        function importData(event) {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const importedData = JSON.parse(e.target.result);
                    if (importedData.roots && importedData.nodes && importedData.leafs) {
                        if (confirm('確定要導入數據嗎？這將覆蓋現有數據。')) {
                            storageData = importedData;
                            expandedLocations.clear();
                            saveToStorage();
                            updateStats();
                            renderLocations();
                            showNotification('導入成功！', 'success');
                        }
                    } else {
                        alert('導入失敗：文件格式不正確！');
                    }
                } catch (error) {
                    alert('導入失敗：文件格式不正確！');
                    console.error(error);
                }
            };
            reader.readAsText(file);
            event.target.value = '';
        }

        // 還原範本數據
        function restoreTemplate() {
            if (confirm('確定要還原為範本數據嗎？這將清除所有當前數據並恢復預設值。')) {
                localStorage.removeItem(STORAGE_KEY);
                loadData(); // 重新載入會觸發預設數據初始化
                expandedLocations.clear();
                updateStats();
                renderLocations();
                renderTempStorage();
                resetForm();
                showNotification('已還原為範本數據', 'success');
            }
        }

        // 清空所有數據
        function clearAllData() {
            if (confirm('確定要清空所有數據嗎？此操作不可恢復！')) {
                storageData = { roots: [], nodes: [], leafs: [], tempStorage: [] };
                expandedLocations.clear();
                saveToStorage();
                updateStats();
                renderLocations();
                renderTempStorage();
                resetForm();
                showNotification('數據已清空', 'success');
            }
        }

        // 渲染临时存储面板
        function renderTempStorage() {
            const container = document.getElementById('tempStorageList');
            if (!storageData.tempStorage || storageData.tempStorage.length === 0) {
                container.innerHTML = `
                    <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; color: #b45309;">
                        <p style="font-size: 14px; margin-bottom: 10px;">📋 臨時存儲區</p>
                        <p style="font-size: 12px; color: #d97706;">在此創建未分類的容器/物件</p>
                        <p style="font-size: 12px; color: #d97706; margin-top: 10px;">或拖動項目到此處</p>
                    </div>
                    <div class="temp-add-section">
                        <button class="btn-add-temp-item" onclick="addTempItem()">+ 添加臨時項目</button>
                    </div>
                `;
                return;
            }

            const items = storageData.tempStorage.map(item => {
                const isNode = item.type === 'node';
                let hasChildren = false;
                let isExpanded = false;
                let childNodes = [];
                let childLeafs = [];

                if (isNode) {
                    childNodes = storageData.nodes.filter(n => n.parentType === 'node' && n.parentId === item.id);
                    childLeafs = storageData.leafs.filter(l => l.parentType === 'node' && l.parentId === item.id);
                    hasChildren = childNodes.length > 0 || childLeafs.length > 0;
                    isExpanded = expandedNodes.has(item.id);
                }

                const icon = isNode ? '📦' : '🔖';
                const typeLabel = isNode ? '容器' : '物件';
                const isSelected = selectedNodeId === item.id;
                const shouldBeFullWidth = isSelected || (isExpanded && hasChildren);
                const wrapperStyle = shouldBeFullWidth ? 'grid-column: 1 / -1; width: 100%;' : '';
                const cardStyle = shouldBeFullWidth ? 'aspect-ratio: auto; flex-direction: row; justify-content: flex-start; padding: 10px 20px; gap: 15px; height: auto;' : '';
                const infoStyle = shouldBeFullWidth ? 'align-items: flex-start; text-align: left;' : '';
                const nameStyle = shouldBeFullWidth ? 'text-align: left;' : '';

                return `
                    <div class="temp-item-wrapper" style="${wrapperStyle}">
                        <div class="temp-item-card ${isSelected ? 'selected-node' : ''}"
                             draggable="true"
                             onmouseenter="showHoverPopup(event, 'temp', '${item.id}')"
                             onmouseleave="hideHoverPopup()"
                             ondragstart="handleDragStart(event, 'temp', '${item.id}')"
                             ${isNode ? `ondrop="handleDrop(event, 'node', '${item.id}')"` : ''}
                             style="${cardStyle}"
                             ${isNode ? `onclick="handleHeaderClick(event, '${item.id}', 'temp')"` : ''}>

                            ${isNode && hasChildren ? `
                                <button class="node-toggle" onclick="handleToggleClick(event, '${item.id}', 'temp')" style="position: absolute; top: 5px; left: 5px;">
                                    ${isExpanded ? '▼' : '▶'}
                                </button>
                            ` : ''}

                            <div class="temp-item-icon">${icon}</div>
                            <div class="temp-item-info" style="${infoStyle}">
                                <div class="temp-item-name" style="${nameStyle}">${item.name}</div>
                                <span class="temp-item-type">${typeLabel}</span>
                            </div>
                            <div class="temp-item-actions">
                                <button class="btn-mini" onclick="editTempItem('${item.id}'); event.stopPropagation();" title="編輯">✏️</button>
                                <button class="btn-mini" onclick="deleteTempItem('${item.id}'); event.stopPropagation();" title="刪除">🗑️</button>
                            </div>
                        </div>

                        ${isExpanded && hasChildren ? `
                            <div class="node-children" style="background: rgba(255,255,255,0.5); border-radius: 8px; padding: 10px; margin-top: 5px; border: 1px dashed #ccc;">
                                <div class="node-children-grid"
                                     ondragover="handleDragOver(event)"
                                     ondrop="handleDrop(event, 'node', '${item.id}')">
                                    ${renderMixedItems(childNodes, childLeafs, 1, item.id)}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                `;
            }).join('');

            container.innerHTML = `
                ${items}
                <div class="temp-add-section">
                    <button class="btn-add-temp-item" onclick="addTempItem()">+ 添加臨時項目</button>
                </div>
            `;
        }

        // 添加临时项目
        function addTempItem() {
            resetForm();
            document.getElementById('itemType').value = 'node';
            document.getElementById('editId').value = '';
            document.getElementById('editType').value = 'temp';

            updateFormFields();

            const formTab = document.getElementById('formTab');
            if (formTab) formTab.textContent = '➕ 添加臨時項目';
            document.querySelector('.form-container').scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        // 编辑临时项目
        function editTempItem(id) {
            const item = storageData.tempStorage.find(i => i.id === id);
            if (item) {
                switchTab('form');
                document.getElementById('itemType').value = item.type;
                document.getElementById('editId').value = item.id;
                document.getElementById('editType').value = 'temp';

                updateFormFields();

                document.getElementById('description').value = item.description || '';

                // 更新標籤系統
                currentTags = item.tags ? [...item.tags] : [];
                renderTags();

                // 填充名稱
                currentContent = { id: item.id, name: item.name, type: item.type, isNew: false };
                renderContents();

                if (item.type === 'leaf') {
                    document.getElementById('itemQuantity').value = item.quantity || 1;
                }

                const formTab = document.getElementById('formTab');
                if (formTab) formTab.textContent = '✏️ 編輯臨時項目';
                document.getElementById('editBannerText').textContent = `✏️ 正在編輯：${item.name}`;
                document.getElementById('editBanner').style.display = 'flex';

                currentEditId = id;
                currentEditType = 'temp';

                document.querySelector('.form-container').scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }

        // 删除临时项目
        function deleteTempItem(id) {
            const item = storageData.tempStorage.find(i => i.id === id);
            if (item && confirm(`確定要刪除臨時項目「${item.name}」嗎？`)) {
                storageData.tempStorage = storageData.tempStorage.filter(i => i.id !== id);
                saveToStorage();
                renderTempStorage();
                showNotification('已刪除臨時項目', 'success');
            }
        }

        // 拖放功能
        let dragData = null;

        function handleDragStart(event, type, id) {
            event.stopPropagation();
            dragData = { type, id };
            event.dataTransfer.effectAllowed = 'move';
            event.currentTarget.style.opacity = '0.5';
        }

        function handleNodeDragStart(event, nodeId, isExpanded) {
            // 如果 node 已打開，只能從 header 拖拉
            if (isExpanded) {
                // 檢查拖拽起點是否在 header 區域
                const isFromHeader = event.target.closest('.node-card-header') !== null;

                if (!isFromHeader) {
                    // 不是從 header 拖拉，阻止拖拽
                    event.stopPropagation();
                    return;
                }
            }
            handleDragStart(event, 'node', nodeId);
        }

        function handleDragOver(event) {
            event.preventDefault();
            event.dataTransfer.dropEffect = 'move';

            // 添加视觉反馈
            const target = event.currentTarget;
            // 簡單優化：如果已經有類別，就不重複添加
            if (!target.classList.contains('drag-over')) {
                if (target.classList.contains('temp-storage-content') ||
                    target.classList.contains('location-detail-expanded') ||
                    target.classList.contains('location-grid-item') ||
                    target.classList.contains('node-card') ||
                    target.classList.contains('leaf-card') ||
                    target.classList.contains('node-children-grid')) {
                    target.classList.add('drag-over');
                }
            }

            return false;
        }

        function handleDrop(event, targetType, targetId) {
            event.preventDefault();
            event.stopPropagation();

            // 移除所有視覺反饋
            document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));

            if (!dragData) return;

            const { type: sourceType, id: sourceId } = dragData;

            // 找到源项目
            let sourceItem = null;
            let sourceArray = null;

            if (sourceType === 'temp') {
                sourceItem = storageData.tempStorage.find(i => i.id === sourceId);
                sourceArray = storageData.tempStorage;
            } else if (sourceType === 'node') {
                sourceItem = storageData.nodes.find(n => n.id === sourceId);
                sourceArray = storageData.nodes;
            } else if (sourceType === 'leaf') {
                sourceItem = storageData.leafs.find(l => l.id === sourceId);
                sourceArray = storageData.leafs;
            }

            if (!sourceItem) return;

            // 確定新的父級關係
            let newParentType, newParentId;
            let newTimestamp = new Date().toISOString(); // 默認為當前時間（添加到末尾）

            if (targetType === 'leaf') {
                // 拖到物件上：插入到該物件之前
                const targetLeaf = storageData.leafs.find(l => l.id === targetId);
                if (!targetLeaf) return;
                newParentType = targetLeaf.parentType;
                newParentId = targetLeaf.parentId;

                // 如果是同類型（Leaf拖到Leaf），計算插入位置的時間戳
                if (sourceType === 'leaf') {
                    const siblings = storageData.leafs.filter(l =>
                        l.parentType === newParentType &&
                        l.parentId === newParentId &&
                        l.id !== sourceId
                    ).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

                    const targetIndex = siblings.findIndex(l => l.id === targetId);

                    if (targetIndex !== -1) {
                        if (targetIndex === 0) {
                            // 插入到最前面
                            const firstTimestamp = new Date(siblings[0].timestamp).getTime();
                            newTimestamp = new Date(firstTimestamp - 100000).toISOString();
                        } else {
                            // 插入到中間
                            const prevTimestamp = new Date(siblings[targetIndex - 1].timestamp).getTime();
                            const nextTimestamp = new Date(siblings[targetIndex].timestamp).getTime();
                            newTimestamp = new Date((prevTimestamp + nextTimestamp) / 2).toISOString();
                        }
                    }
                }
            } else if (targetType === 'node') {
                // 拖到容器上：成為該容器的子項（添加到末尾）
                newParentType = 'node';
                newParentId = targetId;
            } else if (targetType === 'root') {
                // 拖到地點上：成為該地點的子項（添加到末尾）
                newParentType = 'root';
                newParentId = targetId;
            }

            // 循環引用檢查 (Circular Reference Check)
            if (sourceType === 'node') {
                // 1. 不能拖到自己裡面 (Target is self)
                if (newParentType === 'node' && newParentId === sourceId) {
                    return;
                }

                // 2. 不能拖到自己的子孫節點裡面 (Target is descendant)
                if (newParentType === 'node') {
                    if (isAncestorOf(sourceId, newParentId)) {
                        alert('無法移動：不能將容器移到其自身的子容器中。');
                        return;
                    }
                }
            }            // 記錄移動前的路徑
            const sourcePath = getLogPath(sourceType, sourceId);

            // 檢查路徑是否改變
            const oldParentType = sourceItem.parentType;
            const oldParentId = sourceItem.parentId;
            const isPathChanged = (sourceType === 'temp') || (oldParentType !== newParentType || oldParentId !== newParentId);

            // Create new item object
            const newItem = {
                id: sourceItem.id,
                name: sourceItem.name,
                description: sourceItem.description || '',
                tags: sourceItem.tags || [],
                timestamp: newTimestamp
            };

            if (sourceItem.quantity) {
                newItem.quantity = sourceItem.quantity;
            }

            // Set new parent relationship
            newItem.parentType = newParentType;
            newItem.parentId = newParentId;

            // 从源位置删除
            if (sourceType === 'temp') {
                // 从临时存储移到节点
                storageData.tempStorage = storageData.tempStorage.filter(i => i.id !== sourceId);

                if (sourceItem.type === 'node') {
                    storageData.nodes.push(newItem);
                } else {
                    storageData.leafs.push(newItem);
                }
            } else {
                // 在nodes/leafs之间移动，更新父级关系
                const index = sourceArray.findIndex(i => i.id === sourceId);
                if (index !== -1) {
                    // 移除舊項目並添加到數組末尾，確保它顯示在列表最後
                    sourceArray.splice(index, 1);
                    sourceArray.push(newItem);
                }
            }

            saveToStorage();
            updateStats();
            renderLocations();
            renderTempStorage();

            if (isPathChanged) {
                showNotification('項目已移動', 'success');
                // 打印移動路徑日誌
                let finalType = sourceType === 'temp' ? sourceItem.type : sourceType;
                const targetPath = getLogPath(finalType, sourceId);
                console.log(`Moved "${sourceItem.name}": ${sourcePath} => ${targetPath}`);
            } else {
                // 僅排序改變，不顯示移動通知
                console.log(`Reordered "${sourceItem.name}"`);
            }

            // 重置拖拽状态
            dragData = null;
        }

        function handleDropToTemp(event) {
            event.preventDefault();
            event.stopPropagation();

            // 移除所有視覺反饋
            document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));

            if (!dragData) return;

            const { type: sourceType, id: sourceId } = dragData;

            // 只允许从nodes/leafs拖到临时存储
            if (sourceType === 'temp') {
                dragData = null;
                return;
            }

            // 記錄移動前的路徑
            const sourcePath = getLogPath(sourceType, sourceId);

            let sourceItem = null;

            if (sourceType === 'node') {
                sourceItem = storageData.nodes.find(n => n.id === sourceId);
                if (sourceItem) {
                    // 从nodes删除
                    storageData.nodes = storageData.nodes.filter(n => n.id !== sourceId);

                    // 添加到临时存储
                    storageData.tempStorage.push({
                        id: sourceItem.id,
                        name: sourceItem.name,
                        description: sourceItem.description || '',
                        tags: sourceItem.tags || [],
                        timestamp: sourceItem.timestamp,
                        type: 'node'
                    });
                }
            } else if (sourceType === 'leaf') {
                sourceItem = storageData.leafs.find(l => l.id === sourceId);
                if (sourceItem) {
                    // 从leafs删除
                    storageData.leafs = storageData.leafs.filter(l => l.id !== sourceId);

                    // 添加到临时存储
                    storageData.tempStorage.push({
                        id: sourceItem.id,
                        name: sourceItem.name,
                        description: sourceItem.description || '',
                        tags: sourceItem.tags || [],
                        timestamp: sourceItem.timestamp,
                        quantity: sourceItem.quantity || 1,
                        type: 'leaf'
                    });
                }
            }

            if (sourceItem) {
                saveToStorage();
                updateStats();
                renderLocations();
                renderTempStorage();
                showNotification('項目已移至臨時存儲', 'success');

                console.log(`Moved "${sourceItem.name}": ${sourcePath} => 臨時存儲`);
            }

            // 重置拖拽状态
            dragData = null;
        }

        // 添加拖拽结束事件处理
        document.addEventListener('dragend', function(event) {
            if (event.target.classList.contains('node-card') ||
                event.target.classList.contains('leaf-card') ||
                event.target.classList.contains('temp-item-card')) {
                event.target.style.opacity = '1';
            }

            // 移除所有視覺反饋
            document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));

            dragData = null;
        });

        // 添加拖拽离开事件处理
        document.addEventListener('dragleave', function(event) {
            if (event.target.classList.contains('drag-over')) {
                event.target.classList.remove('drag-over');
            }
        });

        // 獲取日期字符串
        function getDateString() {
            const now = new Date();
            return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
        }

        // 顯示 Hover Popup
        function showHoverPopup(event, type, id) {
            // 阻止事件冒泡，防止觸發父層的 popup
            if (event && event.stopPropagation) {
                event.stopPropagation();
            }

            // 移除舊的 popup
            const oldPopup = document.getElementById('hoverPopup');
            if (oldPopup) oldPopup.remove();

            let item = null;
            if (type === 'root') {
                item = storageData.roots.find(r => r.id === id);
            } else if (type === 'node') {
                item = storageData.nodes.find(n => n.id === id);
            } else if (type === 'leaf') {
                item = storageData.leafs.find(l => l.id === id);
            } else if (type === 'temp') {
                item = storageData.tempStorage.find(t => t.id === id);
            }

            if (!item) return;

            // 判斷是否為物件類型 (leaf 或 temp 中的 leaf)
            const isLeaf = type === 'leaf' || (type === 'temp' && item.type === 'leaf');

            // 檢查是否有內容可顯示
            // 如果是物件，總是顯示（因為至少有數量，默認為1）
            const hasContent = item.description || (item.tags && item.tags.length > 0) || isLeaf;
            if (!hasContent) return;

            // 構建 popup 內容
            let content = '';
            if (item.description) {
                content += `<div class="popup-description">${item.description}</div>`;
            }
            if (item.tags && item.tags.length > 0) {
                content += `<div class="popup-tags">${item.tags.map(tag => `<span class="popup-tag">${tag}</span>`).join('')}</div>`;
            }
            // 物件特殊：顯示數量
            if (isLeaf) {
                const qty = item.quantity !== undefined ? item.quantity : 1;
                content += `<div class="popup-quantity">數量: ${qty} 個</div>`;
            }

            // 創建 popup
            const popup = document.createElement('div');
            popup.id = 'hoverPopup';
            popup.innerHTML = content;
            popup.style.cssText = `
                position: fixed;
                background: white;
                border: 1px solid #cbd5e0;
                border-radius: 8px;
                padding: 12px 16px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                max-width: 300px;
                font-size: 13px;
                color: #4a5568;
                z-index: 9999;
                pointer-events: none;
            `;

            document.body.appendChild(popup);

            // 計算位置（顯示在右邊）
            // 使用 currentTarget 確保定位是相對於整個卡片，而不是內部的子元素
            const targetEl = event.currentTarget || event.target;
            const rect = targetEl.getBoundingClientRect();
            let top = rect.top + rect.height / 2 - popup.offsetHeight / 2;
            let left = rect.right + 10;

            // 防止超出視窗
            if (left + 300 > window.innerWidth) {
                left = rect.left - 310;
            }
            if (top < 10) {
                top = 10;
            } else if (top + popup.offsetHeight > window.innerHeight - 10) {
                top = window.innerHeight - popup.offsetHeight - 10;
            }

            popup.style.top = top + 'px';
            popup.style.left = left + 'px';
        }

        // 隱藏 Hover Popup
        function hideHoverPopup() {
            const popup = document.getElementById('hoverPopup');
            if (popup) popup.remove();
        }

        // 顯示通知
        function showNotification(message, type) {
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: ${type === 'success' ? '#48bb78' : '#f56565'};
                color: white;
                padding: 15px 25px;
                border-radius: 8px;
                box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                z-index: 10000;
                animation: slideIn 0.3s ease-out;
                font-weight: 600;
            `;
            notification.textContent = message;
            document.body.appendChild(notification);

            setTimeout(() => {
                notification.style.opacity = '0';
                notification.style.transform = 'translateX(400px)';
                notification.style.transition = 'all 0.3s ease-out';
                setTimeout(() => notification.remove(), 300);
            }, 2000);
        }

        // ========== 標籤頁切換功能 ==========
        function switchTab(tabName) {
            // 切換標籤按鈕狀態
            document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

            if (tabName === 'form') {
                document.getElementById('formTab').classList.add('active');
                document.getElementById('formTabContent').classList.add('active');
            } else if (tabName === 'hierarchy') {
                document.getElementById('hierarchyTab').classList.add('active');
                document.getElementById('hierarchyTabContent').classList.add('active');
            }
        }

        // ========== 層級構建器功能 ==========

        // 初始化層級構建器 - 新設計
        function initializeHierarchy() {
            hierarchyLevels = {
                id: 'root-0',
                level: 1,
                selectedId: null,
                selectedName: null,
                children: [],
                displayName: '第 1 層：🏠 地點'
            };
            hierarchyLevelCounter = 1;
            renderHierarchyLevels();
        }

        // 處理層級選擇變更
        function handleHierarchyChange(levelId, value) {
            const level = findLevelById(levelId);
            if (level) {
                if (level.selectedId !== value) {
                    // 清除所有子層級
                    level.children = [];
                    level.selectedName = null;
                } else {
                    // 取消選擇
                    level.selectedId = null;
                    level.selectedName = null;
                    level.children = [];
                    renderHierarchyLevels();
                    return;
                }

                if (value) {
                    level.selectedId = value;
                    const [type, id] = value.split('-');
                    let item;
                    if (type === 'root') {
                        item = storageData.roots.find(r => r.id === id);
                        level.displayName = `第 ${level.level} 層：🏠 ${item?.name || '未知'}`;
                    } else {
                        item = storageData.nodes.find(n => n.id === id);
                        level.displayName = `第 ${level.level} 層：📦 ${item?.name || '未知'}`;
                    }
                    level.selectedName = item?.name || null;
                }

                renderHierarchyLevels();
            }
        }

        // 添加新層級（基於當前層級）
        function addHierarchyLevel(levelId) {
            const parentLevel = findLevelById(levelId);
            if (!parentLevel || !parentLevel.selectedId) {
                alert('請先選擇當前層級的項目');
                return;
            }

            const newLevelId = `level-${++hierarchyLevelCounter}`;
            const newLevel = {
                id: newLevelId,
                level: parentLevel.level + 1,
                selectedId: null,
                selectedName: null,
                children: [],
                displayName: `第 ${parentLevel.level + 1} 層`
            };

            parentLevel.children.push(newLevel);
            renderHierarchyLevels();
        }

        // 查找層級對象
        function findLevelById(id, currentLevel = hierarchyLevels) {
            if (currentLevel.id === id) return currentLevel;

            if (currentLevel.children && currentLevel.children.length > 0) {
                for (let child of currentLevel.children) {
                    const found = findLevelById(id, child);
                    if (found) return found;
                }
            }

            return null;
        }

        // 移除層級及其所有子層級
        function removeHierarchyLevel(levelId) {
            function removeFromLevel(parent, id) {
                if (parent.children) {
                    parent.children = parent.children.filter(child => {
                        if (child.id === id) return false;
                        removeFromLevel(child, id);
                        return true;
                    });
                }
            }

            removeFromLevel(hierarchyLevels, levelId);
            renderHierarchyLevels();
        }

        // 渲染層級構建器（主函數）
        function renderHierarchyLevels() {
            const container = document.getElementById('hierarchyLevels');
            if (!container) return;

            const html = renderHierarchyTree(hierarchyLevels, 0);
            container.innerHTML = html;
        }

        // 遞歸渲染層級樹結構
        function renderHierarchyTree(level, depth = 0) {
            const indent = depth > 0 ? 'clamp(20px, 2vw, 30px)' : '0';
            const options = getHierarchyOptionsForLevel(level);
            const hasChildren = level.children && level.children.length > 0;
            const levelDisplay = level.level ? `第 ${level.level} 層` : '根';

            let html = `
            <div class="hierarchy-level-container" style="margin-left: ${indent};">
                <div class="hierarchy-level">
                    <div class="hierarchy-select-wrapper">
                        ${hasChildren ? '<span class="hierarchy-arrow">▼</span>' : ''}
                        <select class="hierarchy-select" onchange="handleHierarchyChange('${level.id}', this.value)">
                            <option value="">-- 請選擇 ${levelDisplay} --</option>
                            ${options}
                        </select>
                        ${depth > 0 ? `<button class="btn-mini" onclick="removeHierarchyLevel('${level.id}'); event.stopPropagation();" title="刪除層級">✕</button>` : ''}
                    </div>
                </div>`;

            if (hasChildren) {
                html += '<div class="hierarchy-children">';
                level.children.forEach(child => {
                    html += renderHierarchyTree(child, depth + 1);
                });
                html += '</div>';
            }

            if (level.selectedId) {
                html += `
                <button class="btn-add-sublevel-wide" onclick="addHierarchyLevel('${level.id}'); event.stopPropagation();" title="添加子層級">
                    ➕ 為「${level.selectedName || '此項目'}」添加子層
                </button>`;
            }

            html += `</div>`;
            return html;
        }

        // 獲取層級的選項列表
        function getHierarchyOptionsForLevel(level) {
            const isTopLevel = level.level === 1;
            let options = '';

            if (isTopLevel) {
                // 第一層：地點和容器
                const roots = storageData.roots.map(root =>
                    `<option value="root-${root.id}" ${level.selectedId === `root-${root.id}` ? 'selected' : ''}>
                        🏠 ${root.name}
                    </option>`
                ).join('');

                const nodes = storageData.nodes.map(node =>
                    `<option value="node-${node.id}" ${level.selectedId === `node-${node.id}` ? 'selected' : ''}>
                        📦 ${node.name}
                    </option>`
                ).join('');

                options = roots + nodes;
            } else {
                // 子層級：根據父級限制篩選容器
                const parentLevel = getParentLevel(level);
                let filteredNodes = storageData.nodes;

                // 輔助函數：獲取節點所屬的地點 ID
                const getRootIdForNode = (nodeId) => {
                    const visited = new Set();
                    let currentNode = storageData.nodes.find(n => n.id === nodeId);

                    while (currentNode) {
                        if (currentNode.parentType === 'root') {
                            return currentNode.parentId;
                        }
                        if (currentNode.parentType === 'node') {
                            if (visited.has(currentNode.parentId)) break;
                            visited.add(currentNode.parentId);
                            currentNode = storageData.nodes.find(n => n.id === currentNode.parentId);
                        } else {
                            break;
                        }
                    }
                    return null;
                };

                let parentRootId = null;
                if (parentLevel && parentLevel.selectedId) {
                    const [parentType, parentId] = parentLevel.selectedId.split('-');
                    if (parentType === 'root') {
                        parentRootId = parentId;
                    } else if (parentType === 'node') {
                        const parentNode = storageData.nodes.find(n => n.id === parentId);
                        // 如果父節點有限制地點，則使用該限制
                        if (parentNode && parentNode.restrictedRootId) {
                            parentRootId = parentNode.restrictedRootId;
                        } else {
                            // 否則嘗試查找其當前所在的地點
                            parentRootId = getRootIdForNode(parentId);
                        }
                    }
                }

                filteredNodes = storageData.nodes.filter(node => {
                    // 排除自身（防止選擇自己作為子級）
                    if (parentLevel && parentLevel.selectedId === `node-${node.id}`) return false;

                    // 如果節點沒有設定限制位置，則總是顯示
                    if (!node.restrictedRootId) return true;

                    // 如果節點有限制位置，則必須匹配父級的地點
                    if (parentRootId) {
                        return node.restrictedRootId === parentRootId;
                    }

                    // 如果無法確定父級地點，且節點有限制，則不顯示
                    return false;
                });

                options = filteredNodes.map(node =>
                    `<option value="node-${node.id}" ${level.selectedId === `node-${node.id}` ? 'selected' : ''}>
                        📦 ${node.name}
                    </option>`
                ).join('');
            }

            return options;
        }

        // 獲取層級的父級
        function getParentLevel(level, currentLevel = hierarchyLevels) {
            if (!currentLevel.children) return null;

            for (let child of currentLevel.children) {
                if (child.id === level.id) return currentLevel;
                const found = getParentLevel(level, child);
                if (found) return found;
            }

            return null;
        }

        // 重置層級構建器
        function resetHierarchy() {
            if (confirm('確定要重置層級構建器嗎？所有選擇將被清除。')) {
                initializeHierarchy();
                renderHierarchyLevels();
            }
        }

        // 獲取完整的層級路徑
        function getHierarchyPath(level = hierarchyLevels) {
            if (!level.selectedId) return [];

            const [type, id] = level.selectedId.split('-');
            let item;
            if (type === 'root') {
                item = storageData.roots.find(r => r.id === id);
            } else {
                item = storageData.nodes.find(n => n.id === id);
            }

            const path = [{
                type: type,
                id: id,
                name: item?.name || '未知',
                icon: type === 'root' ? '🏠' : '📦'
            }];

            if (level.children && level.children.length > 0) {
                level.children.forEach(child => {
                    path.push(...getHierarchyPath(child));
                });
            }

            return path;
        }

        // 保存層級結構
        function saveHierarchy() {
            const path = getHierarchyPath();

            if (path.length === 0) {
                alert('請至少選擇一個地點或容器！');
                return;
            }

            const pathDisplay = path.map(p => `${p.icon} ${p.name}`).join(' → ');
            showNotification(`已構建層級：${pathDisplay}`, 'success');
            console.log('完整層級路徑：', path);
            // 這裡可以加入更多邏輯，例如將新項目添加到此路徑下
            return path;
        }

        function toggleDetailCollapse(rootId) {
            const content = document.getElementById(`detail-content-${rootId}`);
            const icon = document.getElementById(`detail-toggle-${rootId}`);
            const panel = document.getElementById(`location-detail-${rootId}`);

            if (content.style.display === 'none') {
                content.style.display = 'block';
                icon.textContent = '▼';
                panel.classList.remove('collapsed');
            } else {
                content.style.display = 'none';
                icon.textContent = '▶';
                panel.classList.add('collapsed');
            }
        }
