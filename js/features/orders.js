// ==========================================
    // 発注リスト機能
    // ==========================================
    async function addToOrderList(name, quantity, unit) {
        const q = query(collection(db, "orderList"), where("name", "==", name));
        const snap = await getDocs(q);

        if (!snap.empty) {
            const d = snap.docs[0];
            await updateDoc(doc(db, "orderList", d.id), {
                quantity: d.data().quantity + quantity,
                unit: unit
            });
        } else {
            await addDoc(collection(db, "orderList"), {
                name,
                quantity,
                unit: unit || '個',
                createdAt: new Date()
            });
        }
    }

    function loadOrderList() {
        onSnapshot(query(collection(db, "orderList"), orderBy("createdAt", "asc")), (snap) => {
            const listEl = document.getElementById('order-list');
            listEl.innerHTML = '';

            if (snap.empty) {
                // ▼ 修正：単なるテキストからエンプティステートへ
                listEl.innerHTML = `
                    <div class="empty-state" style="padding: 20px; margin: 0;">
                        <div class="empty-icon" style="font-size:32px; margin-bottom: 5px;">🛒</div>
                        <div class="empty-title">発注予定はありません</div>
                    </div>`;
                return;
            }

            snap.forEach(d => {
                const data = d.data();
                const li = document.createElement('li');
                li.className = 'order-list-item';
                const unitText = data.unit || '個';

                li.innerHTML = `
                    <div style="flex: 1; min-width: 0;">
                        <div style="font-weight: 800; font-size: 15px; margin-bottom: 4px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${data.name}</div>
                        <div style="font-size: 13px; color: var(--accent-color); font-weight: 700;">${data.quantity} <span style="font-size:11px;">${unitText}</span></div>
                    </div>
                    <button onclick="removeOrderItem('${d.id}')">削除</button>
                `;
                listEl.appendChild(li);
            });
        });
    }

    window.removeOrderItem = (id) => deleteDoc(doc(db, "orderList", id));

    document.getElementById('add-to-order-btn').addEventListener('click', async () => {
        const selectEl = document.getElementById('order-item-select');
        const name = selectEl.value;
        const selectedOption = selectEl.options[selectEl.selectedIndex];
        const unit = selectedOption ? (selectedOption.dataset.unit || '個') : '個';
        const qtyStr = document.getElementById('order-quantity').value;
        const qty = parseInt(qtyStr, 10);

        if (!name || isNaN(qty) || qty <= 0) {
            alert("アイテムと正しい個数を選択してください。");
            return;
        }

        const btn = document.getElementById('add-to-order-btn');
        btn.innerText = "⏳";
        btn.disabled = true;

        await addToOrderList(name, qty, unit);

        selectEl.value = '';
        document.getElementById('order-quantity').value = '';
        btn.innerText = "リストへ";
        btn.disabled = false;
    });

    document.getElementById('clear-order-btn').addEventListener('click', async () => {
        if (!confirm("発注リストをすべてクリアしますか？")) return;
        const snap = await getDocs(collection(db, "orderList"));
        snap.forEach(d => deleteDoc(doc(db, "orderList", d.id)));
    });

    document.getElementById('download-order-csv-btn').addEventListener('click', async () => {
        const snap = await getDocs(collection(db, "orderList"));
        if (snap.empty) {
            alert("発注リストが空です。");
            return;
        }

        let csvContent = "\uFEFF発注日,アイテム名,発注数,単位\n";
        const today = new Date().toLocaleDateString();

        snap.forEach(d => {
            csvContent += `${today},${d.data().name},${d.data().quantity},${d.data().unit || '個'}\n`;
        });

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.setAttribute("download", `OrderList_${today.replace(/\//g, '')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    document.getElementById('download-all-csv-btn').addEventListener('click', async () => {
        const q = query(collection(db, "inventoryItems"), orderBy("category", "asc"), orderBy("name", "asc"));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            alert("データがありません。");
            return;
        }

        let csvContent = "\uFEFFカテゴリ,アイテム名,数量,単位,保管場所,バーコード,記録日時\n";

        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            const dateStr = data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleString() : "不明";
            csvContent += `${data.category || "未分類"},${data.name},${data.quantity},${data.unit || '個'},${data.location || "場所未設定"},${data.barcode || ""},${dateStr}\n`;
        });

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.setAttribute("download", `All_Inventory_${new Date().toLocaleDateString().replace(/\//g, '')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
