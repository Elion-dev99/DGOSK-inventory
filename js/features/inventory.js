// ==========================================
    // 在庫管理機能
    // ==========================================

    document.getElementById('add-btn').addEventListener('click', async () => {
        // ▼▼▼ 追加：権限チェックによるブロック ▼▼▼
        if (currentUserRole === 'member') {
            return alert("権限がありません。新規在庫の追加は管理者またはオーナーのみ可能です。");
        }
        const name = document.getElementById('item-name').value;
        const quantity = document.getElementById('item-quantity').value;
        const unit = document.getElementById('item-unit').value || '個';

        if (!name || !quantity) return alert("名前と数量は必須です！");

        toggleBtnLoading('add-btn', true);
        try {
            let imageUrl = "";
            const imageFile = document.getElementById('item-image')?.files?.[0] ?? null;

            if (imageFile) {
                const storageRef = ref(storage, 'images/' + Date.now() + '_' + imageFile.name);
                await uploadBytes(storageRef, imageFile);
                imageUrl = await getDownloadURL(storageRef);
            }

            const minQtyVal = document.getElementById('item-min-quantity').value;
            const minQuantity = minQtyVal !== "" ? Number(minQtyVal) : null;

            await addDoc(collection(db, "inventoryItems"), {
                name,
                quantity: Number(quantity),
                unit: unit,
                category: document.getElementById('item-category').value || '未分類',
                location: document.getElementById('item-location').value || '場所未設定',
                barcode: document.getElementById('item-barcode').value,
                imageUrl,
                minQuantity: minQuantity,
                createdAt: new Date()
            });

            document.getElementById('item-name').value = '';
            document.getElementById('item-quantity').value = '';
            document.getElementById('item-unit').value = '個';
            document.getElementById('item-category').value = '';
            document.getElementById('item-location').value = '';
            document.getElementById('item-barcode').value = '';
            const itemImageInput = document.getElementById('item-image');
            if (itemImageInput) itemImageInput.value = '';

            if(document.getElementById('item-min-quantity')) {
                document.getElementById('item-min-quantity').value = '';
            }

            alert("追加しました！");
            switchTab('list');
        } catch (e) {
            alert("エラー: " + e.message);
        } finally {
            toggleBtnLoading('add-btn', false);
        }
    });

    let currentEditId = "";
    const editModal = document.getElementById('edit-modal');

    document.getElementById('cancel-edit-btn').addEventListener('click', () => {
        editModal.classList.remove('active');
        setTimeout(() => editModal.style.display = 'none', 400);
        document.body.style.overflow = '';
    });

    document.getElementById('save-edit-btn').addEventListener('click', async () => {
        if (!currentEditId) return;

        const minQtyValue = document.getElementById('edit-min-quantity').value;
        const minQuantity = minQtyValue !== "" ? Number(minQtyValue) : null;

        const updatedData = {
            name: document.getElementById('edit-name').value,
            quantity: Number(document.getElementById('edit-quantity').value),
            unit: document.getElementById('edit-unit').value || '個',
            category: document.getElementById('edit-category').value || '未分類',
            location: document.getElementById('edit-location').value || '場所未設定',
            barcode: document.getElementById('edit-barcode').value,
            minQuantity: minQuantity
        };

        try {
            await updateDoc(doc(db, "inventoryItems", currentEditId), updatedData);
            document.getElementById('cancel-edit-btn').click();
        } catch(e) {
            alert("エラー: " + e.message);
        }
    });

    function renderItems(container, items, groupBy, locArray, isEditable = false) {
        container.innerHTML = '';

        // ▼ 追加：空状態の判定 ▼
        if (items.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📦</div>
                    <div class="empty-title">アイテムが見つかりません</div>
                    <div class="empty-desc">条件に一致するアイテムがないか、<br>まだ登録されていません。</div>
                </div>
            `;
            return;
        }

        const grouped = {};

        items.forEach(itemObj => {
            const key = itemObj.data[groupBy] || (groupBy === 'category' ? '未分類' : '場所未設定');
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(itemObj);
        });

        const canEditDetails = currentUserRole === 'admin' || currentUserRole === 'owner';

        Object.keys(grouped).sort().forEach(groupKey => {
            const header = document.createElement('h3');
            header.className = 'category-header';
            const icon = groupBy === 'category' ? '🏷️ ' : '📍 ';
            header.innerHTML = `${icon}${groupKey} <span>${grouped[groupKey].length}件</span>`;
            container.appendChild(header);

            const ul = document.createElement('ul');
            ul.className = 'inventory-list';

            grouped[groupKey].forEach(itemObj => {
                const data = itemObj.data;
                const id = itemObj.id;
                const li = document.createElement('li');
                li.className = 'modern-item-card liquid-panel';

                const imageHtml = data.imageUrl ? `<img src="${data.imageUrl}" alt="備品">` : `<span style="color: #888; font-size: 11px; font-weight:600;">NO IMAGE</span>`;
                const locationText = data.location || '場所未設定';
                const unitText = data.unit || '個';

                // ▼ 空文字("")ではないかも確認し、確実に数値(Number)にしてから比較するように修正
                const hasMinQty = data.minQuantity !== undefined && data.minQuantity !== null && data.minQuantity !== "";
                const minQtyText = hasMinQty ? `最低在庫: ${data.minQuantity} ${unitText}` : '最低在庫: 未設定';
                const isLowStock = hasMinQty && (Number(data.quantity) <= Number(data.minQuantity));
                const qtyColor = isLowStock ? 'var(--danger-color)' : 'var(--accent-color)';
                const inputQtyColor = isLowStock ? 'var(--danger-color)' : 'var(--text-main)';

                if (isEditable) {
                    let locOptionsHtml = `<div class="modern-location-badge">📍 ${locationText}</div>`;

                    if (canEditDetails) {
                        let options = `<option value="場所未設定">場所未設定</option>`;
                        locArray.forEach(loc => {
                            if(loc && loc !== '場所未設定') {
                                options += `<option value="${loc}" ${data.location === loc ? 'selected' : ''}>${loc}</option>`;
                            }
                        });
                        locOptionsHtml = `<select class="modern-location-select quick-location-change">${options}</select>`;
                    }

                    const editBtnHtml = canEditDetails ? `<button class="modern-action-btn edit btn-edit small">編集</button>` : '';
                    const deleteBtnHtml = canEditDetails ? `<button class="modern-action-btn delete btn-delete small">削除</button>` : '';

                    li.innerHTML = `
                        <div class="modern-item-top">
                            <div class="item-image-box" style="height: 70px;">${imageHtml}</div>
                            <div class="modern-item-header">
                                <div class="modern-item-title">${data.name}</div>
                                ${locOptionsHtml}
                                <div style="font-size: 10px; font-weight: 700; color: ${isLowStock ? 'var(--danger-color)' : 'var(--text-sub)'}; margin-top: 2px;">${minQtyText}</div>
                            </div>
                        </div>

                        <div class="glass-stepper">
                            <button class="stepper-btn minus btn-qty-minus" style="position: relative; top: 4px;">-</button>
                            <div class="stepper-center">
                                <input type="number" class="stepper-input input-qty" value="${data.quantity}" style="color: ${inputQtyColor} !important;">
                                <span class="stepper-unit">${unitText}</span>
                            </div>
                            <button class="stepper-btn plus btn-qty-plus" style="position: relative; top: 6px;">+</button>
                        </div>

                        <div class="modern-item-actions">
                            ${editBtnHtml}
                            <button class="modern-action-btn order btn-order small">発注</button>
                            ${deleteBtnHtml}
                        </div>
                    `;

                    li.querySelector('.btn-qty-plus').addEventListener('click', async () => {
                        await updateDoc(doc(db, "inventoryItems", id), { quantity: Number(data.quantity) + 1 });
                    });

                    li.querySelector('.btn-qty-minus').addEventListener('click', async () => {
                        if (data.quantity > 0) {
                            await updateDoc(doc(db, "inventoryItems", id), { quantity: Number(data.quantity) - 1 });
                        }
                    });

                    const inputQty = li.querySelector('.input-qty');
                    inputQty.addEventListener('change', async (e) => {
                        let newQty = parseInt(e.target.value, 10);
                        if(isNaN(newQty) || newQty < 0) newQty = 0;
                        await updateDoc(doc(db, "inventoryItems", id), { quantity: newQty });
                    });

                    li.querySelector('.btn-order').addEventListener('click', () => {
                        openActionSheet(`
                            <h3 style="margin-top: 0; font-size: 24px; font-weight: 800; margin-bottom: 20px; color: var(--text-main);">アイテム発注</h3>
                            <div class="input-group-card" style="background: rgba(255, 255, 255, 0.8);">
                                <label class="input-label">🏷️ アイテム名</label>
                                <div style="font-size: 16px; font-weight: bold; margin-bottom: 15px; padding-left: 5px; color: var(--text-main);">${data.name}</div>

                                <label class="input-label">📦 発注数量 / 単位</label>
                                <div class="glass-stepper" style="margin-bottom: 0; padding: 4px; border-radius: 20px; background: rgba(255,255,255,0.6); border: 1px solid rgba(0,0,0,0.05);">
                                    <button class="stepper-btn minus" id="sheet-btn-minus" style="width: 40px; height: 40px; font-size: 24px; position: relative; top: 0;">-</button>
                                    <div class="stepper-center">
                                        <input type="number" id="sheet-qty" class="stepper-input" value="1" min="1" style="font-size: 24px; max-width: 80px; box-shadow: none !important; background: transparent !important; margin: 0 !important;">
                                        <span class="stepper-unit" style="font-size: 14px; position: relative; top: 0;">${unitText}</span>
                                    </div>
                                    <button class="stepper-btn plus" id="sheet-btn-plus" style="width: 40px; height: 40px; font-size: 24px; position: relative; top: 0;">+</button>
                                </div>
                            </div>
                            <div class="flex-row" style="margin-top: 25px; gap: 15px;">
                                <button class="btn-main" id="confirm-sheet-order" style="flex: 2; margin-bottom: 0;">発注する</button>
                                <button class="btn-sub" id="cancel-sheet-btn" style="flex: 1; margin-bottom: 0;">キャンセル</button>
                            </div>
                        `);

                        document.getElementById('cancel-sheet-btn').onclick = closeActionSheet;
                        const qtyInput = document.getElementById('sheet-qty');

                        document.getElementById('sheet-btn-minus').onclick = () => {
                            let val = parseInt(qtyInput.value, 10) || 1;
                            if (val > 1) qtyInput.value = val - 1;
                        };

                        document.getElementById('sheet-btn-plus').onclick = () => {
                            let val = parseInt(qtyInput.value, 10) || 0;
                            qtyInput.value = val + 1;
                        };

                        document.getElementById('confirm-sheet-order').onclick = async () => {
                            const qty = parseInt(qtyInput.value, 10);
                            if (qty > 0) {
                                await addToOrderList(data.name, qty, unitText);
                                alert("発注リストに追加しました！");
                                closeActionSheet();
                            } else {
                                alert("正しい数値を入力してください。");
                            }
                        };
                    });

                    if (canEditDetails) {
                        li.querySelector('.quick-location-change').addEventListener('change', async (e) => {
                            await updateDoc(doc(db, "inventoryItems", id), { location: e.target.value });
                        });

                        li.querySelector('.btn-delete').addEventListener('click', () => {
                            openActionSheet(`
                                <h3 style="margin-top: 0; font-size: 24px; font-weight: 800; margin-bottom: 20px; color: var(--danger-color);">アイテムの削除</h3>
                                <div class="input-group-card" style="border-color: rgba(255,59,48,0.3); background: rgba(255,59,48,0.05);">
                                    <label class="input-label" style="color: var(--danger-color);">🏷️ 対象アイテム</label>
                                    <div style="font-size: 16px; font-weight: bold; margin-bottom: 15px; padding-left: 5px; color: var(--text-main);">${data.name}</div>
                                    <label class="input-label" style="color: var(--danger-color);">⚠️ 警告</label>
                                    <div style="font-size: 13px; font-weight: 700; color: var(--danger-color); padding-left: 5px;">リストから完全に削除します。<br>この操作は取り消せません。</div>
                                </div>
                                <div class="flex-row" style="margin-top: 25px; gap: 15px;">
                                    <button class="btn-main" id="confirm-sheet-delete" style="flex: 2; margin-bottom: 0; background: linear-gradient(135deg, #ff3b30, #d70015); box-shadow: 0 4px 15px rgba(255, 59, 48, 0.3);">削除する</button>
                                    <button class="btn-sub" id="cancel-sheet-btn" style="flex: 1; margin-bottom: 0;">キャンセル</button>
                                </div>
                            `);

                            document.getElementById('cancel-sheet-btn').onclick = closeActionSheet;
                            document.getElementById('confirm-sheet-delete').onclick = async () => {
                                await deleteDoc(doc(db, "inventoryItems", id));
                                closeActionSheet();
                            };
                        });

                        li.querySelector('.btn-edit').addEventListener('click', () => {
                            currentEditId = id;
                            document.getElementById('edit-name').value = data.name;
                            document.getElementById('edit-quantity').value = data.quantity;
                            document.getElementById('edit-unit').value = unitText;
                            document.getElementById('edit-category').value = data.category || '';
                            document.getElementById('edit-location').value = data.location || '';
                            document.getElementById('edit-barcode').value = data.barcode || '';
                            document.getElementById('edit-min-quantity').value = (data.minQuantity !== undefined && data.minQuantity !== null) ? data.minQuantity : '';

                            document.body.style.overflow = 'hidden';
                            editModal.style.display = 'flex';
                            setTimeout(() => editModal.classList.add('active'), 10);
                        });
                    }

                } else {
                    li.innerHTML = `
                        <div class="modern-item-top">
                            <div class="item-image-box">${imageHtml}</div>
                            <div class="modern-item-header">
                                <div class="modern-item-title">${data.name}</div>
                                <div class="modern-location-badge" style="margin-bottom: 4px;">📍 ${locationText}</div>
                                <div style="font-size: 11px; font-weight: 700; color: var(--text-sub); background: rgba(0,0,0,0.03); padding: 2px 6px; border-radius: 6px; display: inline-block;">${minQtyText}</div>
                            </div>
                        </div>
                        <div class="modern-item-controls" style="background: transparent; border: none; box-shadow: none; padding: 0; display: flex; align-items: center; justify-content: space-between;">
                            <div style="font-size: 12px; color: var(--text-sub); font-weight: 700; margin-right: 8px;">在庫数</div>
                            <div style="font-size: 20px; font-weight: 800; color: ${qtyColor};">${data.quantity} <span style="font-size:14px; margin-left:4px; color: ${qtyColor};">${unitText}</span></div>
                        </div>
                    `;
                }

                ul.appendChild(li);
            });
            container.appendChild(ul);
        });
    }

    function updateLowStockDashboard(items, targetId) {
        const dashboard = document.getElementById(targetId);
        if (!dashboard) return;

        const lowStockItems = items.filter(itemObj => {
            const data = itemObj.data;
            // ▼ ここでも空文字を除外し、確実に数値として比較するよう修正
            const hasMinQty = data.minQuantity !== undefined && data.minQuantity !== null && data.minQuantity !== "";
            return hasMinQty && (Number(data.quantity) <= Number(data.minQuantity));
        });

        if (lowStockItems.length === 0) {
            dashboard.style.display = 'none';
            return;
        }

        dashboard.style.display = 'block';
        let html = `
            <div class="liquid-panel" style="padding: 20px; border-color: rgba(255,59,48,0.3); background: rgba(255,59,48,0.05); box-shadow: 0 8px 32px rgba(255,59,48,0.05);">
                <h3 style="margin-top: 0; font-size: 16px; color: var(--danger-color); margin-bottom: 15px; display: flex; align-items: center; gap: 8px; font-weight: 800;">
                    <span style="font-size: 20px;">⚠️</span> 要発注アイテム (${lowStockItems.length}件)
                </h3>
                <div style="display: flex; flex-direction: column; gap: 8px;">
        `;

        lowStockItems.forEach(itemObj => {
            const data = itemObj.data;
            const unitText = data.unit || '個';
            html += `
                <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.7); backdrop-filter: blur(10px); padding: 12px 16px; border-radius: 16px; border: 1px solid rgba(255,59,48,0.15);">
                    <div style="font-weight: 700; font-size: 15px; color: var(--text-main);">${data.name}</div>
                    <div style="text-align: right;">
                        <div style="font-size: 18px; font-weight: 800; color: var(--danger-color);">${data.quantity} <span style="font-size:12px;">${unitText}</span></div>
                        <div style="font-size: 10px; color: var(--text-sub);">最低: ${data.minQuantity}</div>
                    </div>
                </div>
            `;
        });

        html += `</div></div>`;
        dashboard.innerHTML = html;
    }

    function renderQuickFilters(containerId, itemsArray, isLocation = false) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = '';

        const allBtn = document.createElement('div');
        allBtn.className = 'filter-chip active';
        allBtn.innerText = 'すべて';
        container.appendChild(allBtn);

        itemsArray.forEach(item => {
            if (item === '未分類' || item === '場所未設定') return;
            const btn = document.createElement('div');
            btn.className = 'filter-chip';
            btn.innerText = item;
            container.appendChild(btn);
        });

        const defaultItem = isLocation ? '場所未設定' : '未分類';
        if (itemsArray.includes(defaultItem)) {
            const btn = document.createElement('div');
            btn.className = 'filter-chip';
            btn.innerText = defaultItem;
            container.appendChild(btn);
        }

        const chips = container.querySelectorAll('.filter-chip');
        chips.forEach(chip => {
            chip.addEventListener('click', () => {
                chips.forEach(c => c.classList.remove('active'));
                chip.classList.add('active');

                const targetName = chip.innerText;
                const listContainerId = containerId === 'location-filter-container' ? 'location-container' : 'inventory-container';
                const listContainer = document.getElementById(listContainerId);
                if (!listContainer) return;

                const headers = listContainer.querySelectorAll('.category-header');
                const lists = listContainer.querySelectorAll('.inventory-list');

                for (let i = 0; i < headers.length; i++) {
                    let headerText = headers[i].childNodes[0].textContent;
                    headerText = headerText.replace('🏷️', '').replace('📍', '').trim();

                    if (targetName === 'すべて' || headerText === targetName) {
                        headers[i].style.display = 'flex';
                        lists[i].style.display = 'grid';
                    } else {
                        headers[i].style.display = 'none';
                        lists[i].style.display = 'none';
                    }
                }
            });
        });
    }
    let currentInventoryViewMode = 'category';
    let cachedAllItems = [];
    let cachedMergedLocations = [];
    let cachedMergedCategories = [];

    // ▼ 追加：Toast通知機能 ▼
    window.showToast = function(message, type = 'success') {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerText = message;
        container.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    };

    // ▼ 追加：リアルタイム検索機能 ▼
    let currentSearchQuery = '';
    document.getElementById('inventory-search')?.addEventListener('input', (e) => {
        currentSearchQuery = e.target.value.toLowerCase().trim();
        updateInventoryView();
    });

    document.getElementById('view-mode-category')?.addEventListener('click', () => {
        currentInventoryViewMode = 'category';
        document.getElementById('view-mode-category').classList.add('active');
        document.getElementById('view-mode-location').classList.remove('active');
        updateInventoryView();
    });

    document.getElementById('view-mode-location')?.addEventListener('click', () => {
        currentInventoryViewMode = 'location';
        document.getElementById('view-mode-location').classList.add('active');
        document.getElementById('view-mode-category').classList.remove('active');
        updateInventoryView();
    });

    function updateInventoryView() {
        const inventoryContainer = document.getElementById('inventory-container');
        if (!inventoryContainer) return;

        // ▼ 追加：キャッシュから検索文字でフィルタリング
        const filteredItems = cachedAllItems.filter(itemObj => {
            const data = itemObj.data;
            const matchName = data.name && data.name.toLowerCase().includes(currentSearchQuery);
            const matchCat = data.category && data.category.toLowerCase().includes(currentSearchQuery);
            const matchLoc = data.location && data.location.toLowerCase().includes(currentSearchQuery);
            return matchName || matchCat || matchLoc;
        });

        if (currentInventoryViewMode === 'category') {
            renderItems(inventoryContainer, filteredItems, 'category', cachedMergedLocations, true);
            renderQuickFilters('category-filter-container', cachedMergedCategories, false);
        } else {
            renderItems(inventoryContainer, filteredItems, 'location', cachedMergedLocations, true);
            renderQuickFilters('category-filter-container', cachedMergedLocations, true);
        }
    }
    // ▲▲▲ 追加ここまで ▲▲▲

    function loadInventory() {
        const inventoryContainer = document.getElementById('inventory-container');
        if (inventoryContainer && cachedAllItems.length === 0) {
            let skeletonHtml = '<div class="inventory-list">';
            for(let i=0; i<4; i++) skeletonHtml += '<div class="sk-card"><div class="skeleton-box sk-img"></div><div class="skeleton-box sk-text"></div><div class="skeleton-box sk-text short"></div></div>';
            skeletonHtml += '</div>';
            inventoryContainer.innerHTML = skeletonHtml;
        }

        const q = query(collection(db, "inventoryItems"), orderBy("createdAt", "desc"));

        onSnapshot(q, (snapshot) => {
            const inventoryContainer = document.getElementById('inventory-container');
            const locationContainer = document.getElementById('location-container');
            const selectBox = document.getElementById('order-item-select');
            const catList = document.getElementById('global-category-list');
            const locList = document.getElementById('global-location-list');

            if (catList) catList.innerHTML = '';
            if (locList) locList.innerHTML = '';
            selectBox.innerHTML = '<option value="">アイテムを選択してください...</option>';

            let allItems = [];
            let uniqueLocations = new Set();
            let uniqueCategories = new Set();

            snapshot.forEach((docSnap) => {
                const data = docSnap.data();
                allItems.push({ id: docSnap.id, data: data });

                const loc = data.location || '場所未設定';
                const cat = data.category || '未分類';
                uniqueLocations.add(loc);
                uniqueCategories.add(cat);

                const unitText = data.unit || '個';
                const option = document.createElement('option');
                option.value = data.name;
                option.dataset.unit = unitText;
                option.textContent = `[${cat}] ${data.name} (現在: ${data.quantity} ${unitText})`;
                selectBox.appendChild(option);
            });

            // ▼ マスターデータと既存アイテムのデータを合体させてフィルタを作る ▼
            const mergedLocations = Array.from(new Set([...masterLocations, ...Array.from(uniqueLocations)])).sort();
            const mergedCategories = Array.from(new Set([...masterCategories, ...Array.from(uniqueCategories)])).sort();
            currentInventoryCategories = Array.from(uniqueCategories);
            currentInventoryLocations = Array.from(uniqueLocations);
            updateSelectOptions();

            if (currentUserRole === 'admin' || currentUserRole === 'owner') {
                renderMasterDataLists();
            }

            updateLowStockDashboard(allItems, 'low-stock-dashboard-list');
            updateLowStockDashboard(allItems, 'low-stock-dashboard-location');

            cachedAllItems = allItems;
            cachedMergedLocations = mergedLocations;
            cachedMergedCategories = mergedCategories;

            updateInventoryView(); // ⬅️ 在庫管理タブ（tab-list）の描画をここで一括処理

            if (locationContainer) renderItems(locationContainer, allItems, 'location', mergedLocations, false);
            renderQuickFilters('location-filter-container', mergedLocations, true);
        });
    }

    function loadUsers() {
        const q = query(collection(db, "users"));

        onSnapshot(q, (snapshot) => {
            const userList = document.getElementById('user-list');
            userList.innerHTML = '';

            let usersData = [];
            snapshot.forEach((docSnap) => {
                usersData.push({ id: docSnap.id, data: docSnap.data() });
            });
            globalUsersCache = usersData;

            usersData.sort((a, b) => {
                const wA = a.data.role === 'owner' ? 3 : a.data.role === 'admin' ? 2 : 1;
                const wB = b.data.role === 'owner' ? 3 : b.data.role === 'admin' ? 2 : 1;
                if (wA !== wB) return wB - wA;

                const hasTimeA = !!a.data.createdAt;
                const hasTimeB = !!b.data.createdAt;
                if (hasTimeA && !hasTimeB) return -1;
                if (!hasTimeA && hasTimeB) return 1;
                if (hasTimeA && hasTimeB) return a.data.createdAt.seconds - b.data.createdAt.seconds;
                return 0;
            });

            usersData.forEach((userObj) => {
                const userData = userObj.data;
                const docId = userObj.id;
                const li = document.createElement('li');
                const isActive = userData.isActive !== false;
                li.className = `user-list-item liquid-panel ${isActive ? '' : 'item-inactive'}`;

                const roleText = userData.role === 'owner' ? '<span style="color: #ff9f0a; font-weight: bold;">👑 オーナー</span>' :
                    userData.role === 'admin' ? '<span style="color: var(--accent-color); font-weight: bold;">🏢 管理者</span>' : '👤 一般';

                let empCodeDisplay = "ID未設定";
                if ((userData.role === 'admin' || userData.role === 'owner') && currentUserRole !== 'admin' && currentUserRole !== 'owner') {
                    empCodeDisplay = "ID: *** (非公開)";
                } else if (userData.role === 'owner' && userData.email) {
                    empCodeDisplay = `✉️ ${userData.email}`;
                } else if (userData.empCode) {
                    empCodeDisplay = `ID: ${userData.empCode}`;
                }

                const displayName = userData.username || "名無し";
                const profileImgUrl = userData.profileImageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0071e3&color=fff&rounded=true`;
                const statusBadge = isActive ? '' : '<span class="status-badge-inactive">停止中</span>';

                let actionHtml = '';
                if (currentUserRole === 'admin' || currentUserRole === 'owner') {
                    const isSelf = docId === auth.currentUser?.uid;
                    const targetRole = userData.role || 'member';

                    if (isSelf) {
                        actionHtml = `<div style="margin-top: 15px; text-align: center; padding: 10px; background: rgba(0, 113, 227, 0.1); border-radius: 15px; font-size: 13px; font-weight: 700; color: var(--accent-color);">あなたのアカウント（操作不可）</div>`;
                    } else if (currentUserRole === 'admin' && (targetRole === 'admin' || targetRole === 'owner')) {
                        actionHtml = `<div style="margin-top: 15px; text-align: center; padding: 10px; background: rgba(134, 134, 139, 0.1); border-radius: 15px; font-size: 13px; font-weight: 700; color: var(--text-sub);">上位または同等権限（操作不可）</div>`;
                    } else {
                        const toggleStatusBtn = isActive ? `<button class="btn-sub btn-toggle-status" style="color: var(--warning-color);">停止</button>` : `<button class="btn-sub btn-toggle-status" style="color: var(--success-color);">復旧</button>`;
                        actionHtml = `<div class="user-list-actions" style="margin-top: 15px;"><button class="btn-sub btn-change-role" ${!isActive ? 'disabled style="opacity: 0.5;"' : ''}>権限</button>${toggleStatusBtn}<button class="btn-sub btn-delete-user" style="color: var(--danger-color);">削除</button></div>`;
                    }
                }

                li.innerHTML = `
                    <div class="user-list-info">
                        <img src="${profileImgUrl}" style="width: 44px; height: 44px; border-radius: 50%; object-fit: cover; margin-right: 12px; border: 1px solid rgba(0,0,0,0.1);">
                        <div>
                            <div style="font-weight: 700; font-size: 16px; margin-bottom: 4px;">${displayName} ${statusBadge}</div>
                            <div style="font-size: 12px; color: var(--text-sub); font-weight: 500;">${empCodeDisplay} | 権限: ${roleText}</div>
                        </div>
                    </div>
                    ${actionHtml}
                `;

                if (actionHtml && actionHtml.includes('btn-change-role')) {
                    li.querySelector('.btn-change-role').onclick = () => {
                        if (!isActive) return;

                        let nextRole = 'member';
                        if (userData.role === 'member') nextRole = 'admin';
                        else if (userData.role === 'admin') nextRole = 'owner';
                        else if (userData.role === 'owner') nextRole = 'member';

                        const roleNames = { 'member': '一般メンバー', 'admin': '管理者', 'owner': 'オーナー' };

                        openActionSheet(`
                            <h3 style="margin-top: 0; font-size: 24px; font-weight: 800; margin-bottom: 20px; color: var(--text-main);">権限の変更</h3>
                            <div class="input-group-card" style="background: rgba(255, 255, 255, 0.8);">
                                <label class="input-label">👤 対象メンバー</label>
                                <div style="font-size: 16px; font-weight: bold; margin-bottom: 15px; padding-left: 5px; color: var(--text-main);">${displayName}</div>
                                <label class="input-label">🔑 新しい権限</label>
                                <div style="font-size: 18px; font-weight: 800; color: var(--accent-color); padding-left: 5px;">${roleNames[nextRole]}</div>
                            </div>
                            <div class="flex-row" style="margin-top: 25px; gap: 15px;">
                                <button class="btn-main" id="confirm-sheet-role" style="flex: 2; margin-bottom: 0;">更新する</button>
                                <button class="btn-sub" id="cancel-sheet-btn" style="flex: 1; margin-bottom: 0;">キャンセル</button>
                            </div>
                        `);

                        document.getElementById('cancel-sheet-btn').onclick = closeActionSheet;
                        document.getElementById('confirm-sheet-role').onclick = async () => {
                            await updateDoc(doc(db, "users", docId), { role: nextRole });
                            closeActionSheet();
                        };
                    };

                    li.querySelector('.btn-toggle-status').onclick = () => {
                        const newStatus = !isActive;
                        const actionText = newStatus ? "復旧（ログイン許可）" : "停止（ログイン禁止）";
                        const themeColor = newStatus ? 'var(--success-color)' : 'var(--danger-color)';

                        openActionSheet(`
                            <h3 style="margin-top: 0; font-size: 24px; font-weight: 800; margin-bottom: 20px; color: var(--text-main);">状態の変更</h3>
                            <div class="input-group-card" style="background: rgba(255, 255, 255, 0.8);">
                                <label class="input-label">👤 対象メンバー</label>
                                <div style="font-size: 16px; font-weight: bold; margin-bottom: 15px; padding-left: 5px; color: var(--text-main);">${displayName}</div>
                                <label class="input-label">⚙️ 新しい状態</label>
                                <div style="font-size: 18px; font-weight: 800; color: ${themeColor}; padding-left: 5px;">${actionText}</div>
                            </div>
                            <div class="flex-row" style="margin-top: 25px; gap: 15px;">
                                <button class="btn-main" id="confirm-sheet-status" style="flex: 2; margin-bottom: 0; ${newStatus ? '' : 'background: linear-gradient(135deg, #ff3b30, #d70015); box-shadow: 0 4px 15px rgba(255, 59, 48, 0.3);'}">${newStatus ? '復旧させる' : '停止する'}</button>
                                <button class="btn-sub" id="cancel-sheet-btn" style="flex: 1; margin-bottom: 0;">キャンセル</button>
                            </div>
                        `);

                        document.getElementById('cancel-sheet-btn').onclick = closeActionSheet;
                        document.getElementById('confirm-sheet-status').onclick = async () => {
                            await updateDoc(doc(db, "users", docId), { isActive: newStatus });
                            closeActionSheet();
                        };
                    };

                    li.querySelector('.btn-delete-user').onclick = () => {
                        openActionSheet(`
                            <h3 style="margin-top: 0; font-size: 24px; font-weight: 800; margin-bottom: 20px; color: var(--danger-color);">メンバーの削除</h3>
                            <div class="input-group-card" style="border-color: rgba(255,59,48,0.3); background: rgba(255,59,48,0.05);">
                                <label class="input-label" style="color: var(--danger-color);">👤 対象メンバー</label>
                                <div style="font-size: 16px; font-weight: bold; margin-bottom: 15px; padding-left: 5px; color: var(--text-main);">${displayName}</div>
                                <label class="input-label" style="color: var(--danger-color);">⚠️ 警告</label>
                                <div style="font-size: 13px; font-weight: 700; color: var(--danger-color); padding-left: 5px;">リストから完全に削除します。<br>この操作は取り消せません。</div>
                            </div>
                            <div class="flex-row" style="margin-top: 25px; gap: 15px;">
                                <button class="btn-main" id="confirm-sheet-user-delete" style="flex: 2; margin-bottom: 0; background: linear-gradient(135deg, #ff3b30, #d70015); box-shadow: 0 4px 15px rgba(255, 59, 48, 0.3);">削除する</button>
                                <button class="btn-sub" id="cancel-sheet-btn" style="flex: 1; margin-bottom: 0;">キャンセル</button>
                            </div>
                        `);

                        document.getElementById('cancel-sheet-btn').onclick = closeActionSheet;
                        document.getElementById('confirm-sheet-user-delete').onclick = async () => {
                            await deleteDoc(doc(db, "users", docId));
                            closeActionSheet();
                        };
                    };
                }
                userList.appendChild(li);
            });
        });
    }
