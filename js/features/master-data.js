let masterCategories = [];
    let masterLocations = [];
    let currentInventoryCategories = []; // 追加：既存のカテゴリ一覧
    let currentInventoryLocations = [];  // 追加：既存の保管場所一覧

    function loadMasterData() {
        onSnapshot(doc(db, "settings", "masterData"), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                masterCategories = data.categories || [];
                masterLocations = data.locations || [];
            } else {
                masterCategories = [];
                masterLocations = [];
            }
            updateSelectOptions();
            if (currentUserRole === 'admin' || currentUserRole === 'owner') {
                renderMasterDataLists();
            }
        });
    }

    function updateSelectOptions() {
        const catSelects = [document.getElementById('item-category'), document.getElementById('edit-category')];
        const locSelects = [document.getElementById('item-location'), document.getElementById('edit-location')];

        // マスターデータと現在登録されている既存データの両方を結合
        const allCats = Array.from(new Set([...masterCategories, ...currentInventoryCategories])).sort();
        const allLocs = Array.from(new Set([...masterLocations, ...currentInventoryLocations])).sort();

        const currentCatVals = catSelects.map(el => el ? el.value : '');
        const currentLocVals = locSelects.map(el => el ? el.value : '');

        catSelects.forEach((select, index) => {
            if (!select) return;
            select.innerHTML = '<option value="">未分類</option>';
            allCats.forEach(cat => {
                if (cat !== '未分類') {
                    const opt = document.createElement('option');
                    opt.value = cat; opt.textContent = cat;
                    select.appendChild(opt);
                }
            });
            if (currentCatVals[index] && allCats.includes(currentCatVals[index])) {
                select.value = currentCatVals[index];
            }
        });

        locSelects.forEach((select, index) => {
            if (!select) return;
            select.innerHTML = '<option value="">場所未設定</option>';
            allLocs.forEach(loc => {
                if (loc !== '場所未設定') {
                    const opt = document.createElement('option');
                    opt.value = loc; opt.textContent = loc;
                    select.appendChild(opt);
                }
            });
            if (currentLocVals[index] && allLocs.includes(currentLocVals[index])) {
                select.value = currentLocVals[index];
            }
        });
    }

    function renderMasterDataLists() {
        const catListEl = document.getElementById('settings-category-list');
        const locListEl = document.getElementById('settings-location-list');
        if (!catListEl || !locListEl) return;

        // ▼ マスターデータと既存アイテムのデータを合体させて表示 ▼
        const allCats = Array.from(new Set([...masterCategories, ...currentInventoryCategories])).sort();
        const allLocs = Array.from(new Set([...masterLocations, ...currentInventoryLocations])).sort();

        catListEl.innerHTML = '';
        allCats.forEach(cat => {
            if (cat === '未分類') return;
            const li = document.createElement('li');
            li.style.cssText = "display:flex; justify-content:space-between; padding: 12px 15px; border-bottom: 1px solid rgba(0,0,0,0.05); align-items:center;";

            const badge = masterCategories.includes(cat) ? '' : '<div style="font-size:10px; color:var(--text-sub); background:rgba(0,0,0,0.05); padding:2px 6px; border-radius:6px; display:inline-block;">アイテムから抽出</div>';

            li.innerHTML = `
                <div style="flex: 1; min-width: 0; padding-right: 10px; display: flex; flex-direction: column; align-items: flex-start; gap: 4px;">
                    <div style="font-weight:700; width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text-main);">${cat}</div>
                    ${badge}
                </div>
                <div style="display:flex; gap:6px; flex-shrink: 0;">
                    <button class="btn-sub" style="width:auto; padding:6px 12px; margin:0; font-size:12px; color:var(--accent-color); font-weight:700;" onclick="editMasterData('category', '${cat}')">編集</button>
                    <button class="btn-sub" style="width:auto; padding:6px 12px; margin:0; font-size:12px; color:var(--danger-color); font-weight:700;" onclick="deleteMasterData('category', '${cat}')">削除</button>
                </div>`;
            catListEl.appendChild(li);
        });

        locListEl.innerHTML = '';
        allLocs.forEach(loc => {
            if (loc === '場所未設定') return;
            const li = document.createElement('li');
            li.style.cssText = "display:flex; justify-content:space-between; padding: 12px 15px; border-bottom: 1px solid rgba(0,0,0,0.05); align-items:center;";

            const badge = masterLocations.includes(loc) ? '' : '<div style="font-size:10px; color:var(--text-sub); background:rgba(0,0,0,0.05); padding:2px 6px; border-radius:6px; display:inline-block;">アイテムから抽出</div>';

            li.innerHTML = `
                <div style="flex: 1; min-width: 0; padding-right: 10px; display: flex; flex-direction: column; align-items: flex-start; gap: 4px;">
                    <div style="font-weight:700; width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text-main);">${loc}</div>
                    ${badge}
                </div>
                <div style="display:flex; gap:6px; flex-shrink: 0;">
                    <button class="btn-sub" style="width:auto; padding:6px 12px; margin:0; font-size:12px; color:var(--accent-color); font-weight:700;" onclick="editMasterData('location', '${loc}')">編集</button>
                    <button class="btn-sub" style="width:auto; padding:6px 12px; margin:0; font-size:12px; color:var(--danger-color); font-weight:700;" onclick="deleteMasterData('location', '${loc}')">削除</button>
                </div>`;
            locListEl.appendChild(li);
        });
    }

    // ボタンアクション
    document.getElementById('add-category-btn')?.addEventListener('click', async () => {
        const val = document.getElementById('new-category-input').value.trim();
        if (!val) return;
        if (masterCategories.includes(val)) return alert("既に存在します");
        const newCats = [...masterCategories, val];
        await setDoc(doc(db, "settings", "masterData"), { categories: newCats }, { merge: true });
        document.getElementById('new-category-input').value = '';
    });

    document.getElementById('add-location-btn')?.addEventListener('click', async () => {
        const val = document.getElementById('new-location-input').value.trim();
        if (!val) return;
        if (masterLocations.includes(val)) return alert("既に存在します");
        const newLocs = [...masterLocations, val];
        await setDoc(doc(db, "settings", "masterData"), { locations: newLocs }, { merge: true });
        document.getElementById('new-location-input').value = '';
    });

    window.deleteMasterData = (type, val) => {
        const typeLabel = type === 'category' ? 'カテゴリ' : '保管場所';

        openActionSheet(`
            <h3 style="margin-top: 0; font-size: 24px; font-weight: 800; margin-bottom: 20px; color: var(--danger-color);">${typeLabel}の削除</h3>
            <div class="input-group-card" style="border-color: rgba(255,59,48,0.3); background: rgba(255,59,48,0.05);">
                <label class="input-label" style="color: var(--danger-color);">対象の${typeLabel}</label>
                <div style="font-size: 16px; font-weight: bold; margin-bottom: 15px; padding-left: 5px; color: var(--text-main); word-break: break-all;">${val}</div>
                <label class="input-label" style="color: var(--danger-color);">⚠️ 警告</label>
                <div style="font-size: 13px; font-weight: 700; color: var(--danger-color); padding-left: 5px;">マスターデータから削除します。<br>※既にこの値が設定されている既存アイテムのデータは変更されません。</div>
            </div>
            <div class="flex-row" style="margin-top: 25px; gap: 15px;">
                <button class="btn-main" id="confirm-sheet-delete-master" style="flex: 2; margin-bottom: 0; background: linear-gradient(135deg, #ff3b30, #d70015); box-shadow: 0 4px 15px rgba(255, 59, 48, 0.3);">削除する</button>
                <button class="btn-sub" id="cancel-sheet-btn" style="flex: 1; margin-bottom: 0;">キャンセル</button>
            </div>
        `);

        document.getElementById('cancel-sheet-btn').onclick = closeActionSheet;
        document.getElementById('confirm-sheet-delete-master').onclick = async () => {
            const btn = document.getElementById('confirm-sheet-delete-master');
            btn.innerText = "削除中...";
            btn.disabled = true;

            try {
                if (type === 'category') {
                    const newCats = masterCategories.filter(c => c !== val);
                    await setDoc(doc(db, "settings", "masterData"), { categories: newCats }, { merge: true });
                } else {
                    const newLocs = masterLocations.filter(l => l !== val);
                    await setDoc(doc(db, "settings", "masterData"), { locations: newLocs }, { merge: true });
                }
                closeActionSheet();
            } catch (e) {
                alert("エラーが発生しました: " + e.message);
                btn.innerText = "削除する";
                btn.disabled = false;
            }
        };
    };
    window.editMasterData = (type, oldVal) => {
        const typeLabel = type === 'category' ? 'カテゴリ' : '保管場所';

        openActionSheet(`
            <h3 style="margin-top: 0; font-size: 24px; font-weight: 800; margin-bottom: 20px; color: var(--text-main);">${typeLabel}の編集</h3>
            <div class="input-group-card" style="background: rgba(255, 255, 255, 0.8);">
                <label class="input-label">現在の名前</label>
                <div style="font-size: 16px; font-weight: bold; margin-bottom: 15px; padding-left: 5px; color: var(--text-sub);">${oldVal}</div>

                <label class="input-label">新しい名前</label>
                <input type="text" id="edit-master-input" value="${oldVal}" style="margin-bottom: 0;">
            </div>
            <div style="font-size: 12px; color: var(--warning-color); font-weight: 700; margin-bottom: 15px; text-align: center;">
                ※この名前を使用している既存の在庫アイテムも<br>すべて自動的に新しい名前に更新されます。
            </div>
            <div class="flex-row" style="margin-top: 25px; gap: 15px;">
                <button class="btn-main" id="confirm-sheet-edit-master" style="flex: 2; margin-bottom: 0;">更新する</button>
                <button class="btn-sub" id="cancel-sheet-btn" style="flex: 1; margin-bottom: 0;">キャンセル</button>
            </div>
        `);

        document.getElementById('cancel-sheet-btn').onclick = closeActionSheet;
        document.getElementById('confirm-sheet-edit-master').onclick = async () => {
            const newVal = document.getElementById('edit-master-input').value.trim();
            if (!newVal || newVal === oldVal) {
                closeActionSheet();
                return;
            }

            const btn = document.getElementById('confirm-sheet-edit-master');
            btn.innerText = "更新中...";
            btn.disabled = true;

            try {
                // 1. マスターデータのリストを更新
                if (type === 'category') {
                    let newCats = masterCategories.filter(c => c !== oldVal); // 古いものを消す
                    if (!newCats.includes(newVal)) newCats.push(newVal);      // 新しいものを追加
                    await setDoc(doc(db, "settings", "masterData"), { categories: newCats }, { merge: true });
                } else {
                    let newLocs = masterLocations.filter(l => l !== oldVal);
                    if (!newLocs.includes(newVal)) newLocs.push(newVal);
                    await setDoc(doc(db, "settings", "masterData"), { locations: newLocs }, { merge: true });
                }

                // 2. 既存の在庫アイテム（inventoryItems）を一括更新する
                const fieldName = type === 'category' ? 'category' : 'location';
                const q = query(collection(db, "inventoryItems"), where(fieldName, "==", oldVal));
                const snapshot = await getDocs(q);

                const updatePromises = [];
                snapshot.forEach(docSnap => {
                    updatePromises.push(updateDoc(doc(db, "inventoryItems", docSnap.id), { [fieldName]: newVal }));
                });

                await Promise.all(updatePromises); // 全ての更新が完了するまで待つ

                closeActionSheet();
                alert(`「${oldVal}」を「${newVal}」に更新し、関連するアイテムもすべて変更しました！`);
            } catch (e) {
                alert("エラーが発生しました: " + e.message);
                btn.innerText = "更新する";
                btn.disabled = false;
            }
        };
    };
    // ▲ 追加ここまで ▲
