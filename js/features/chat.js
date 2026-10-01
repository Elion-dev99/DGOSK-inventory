// ==========================================
    // チャット機能
    // ==========================================
    function getChatRoomId(uid1, uid2) {
        return uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
    }

    let currentChatTarget = "all";
    let unsubscribeMessages = null;
    let globalUsersCache = [];
    let isChatTabActive = false;

    function setupUnreadListener() {
        onSnapshot(query(collection(db, "messages"), orderBy("createdAt", "desc")), (snap) => {
            snap.docChanges().forEach(change => {
                if (change.type === "added" && !isChatTabActive && change.doc.data().senderId !== auth.currentUser?.uid) {
                    document.getElementById('nav-chat').classList.add('has-unread');
                }
            });
        });

        onSnapshot(query(collection(db, "directMessages"), orderBy("createdAt", "desc")), (snap) => {
            snap.docChanges().forEach(change => {
                const data = change.doc.data();
                if (change.type === "added" && !isChatTabActive && data.receiverId === auth.currentUser?.uid) {
                    document.getElementById('nav-chat').classList.add('has-unread');
                }
            });
        });
    }

    const originalSwitchTab = switchTab;
    switchTab = function(tabId) {
        originalSwitchTab(tabId);
        isChatTabActive = (tabId === 'chat');

        const appHeader = document.querySelector('#app-screen .app-header');
        if (appHeader) appHeader.style.display = isChatTabActive ? 'none' : 'block';

        if (isChatTabActive) {
            document.body.style.overflow = 'hidden';
            document.documentElement.style.overflow = 'hidden';
            document.getElementById('nav-chat').classList.remove('has-unread');
            renderChatList();
        } else {
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
            const chatListView = document.getElementById('chat-list-view');
            const chatRoomView = document.getElementById('chat-room-view');
            if(chatListView) chatListView.style.transform = 'translateX(0)';
            if(chatRoomView) chatRoomView.style.transform = 'translateX(100%)';
        }
    };

    function renderChatList() {
        const listContainer = document.getElementById('chat-list-container');
        if (!listContainer) return;
        listContainer.innerHTML = '';

        const allItem = document.createElement('div');
        allItem.className = 'chat-list-item';
        allItem.innerHTML = `
            <img src="https://ui-avatars.com/api/?name=ALL&background=0071e3&color=fff" class="chat-list-avatar">
            <div class="chat-list-info">
                <div class="chat-list-name">📢 全体チャット <span class="chat-list-time">常時</span></div>
                <div class="chat-list-preview">全メンバーに送信されます</div>
            </div>
            <div style="color: #c7c7cc; font-weight: 800; font-size: 20px; margin-left: 10px;">›</div>
        `;
        allItem.onclick = () => showChatRoom("all", "📢 全体チャット");
        listContainer.appendChild(allItem);

        globalUsersCache.forEach(userObj => {
            if (userObj.id === auth.currentUser?.uid || userObj.data.isActive === false) return;
            const name = userObj.data.username || "名無し";
            const img = userObj.data.profileImageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=86868b&color=fff`;

            const dmItem = document.createElement('div');
            dmItem.className = 'chat-list-item';
            dmItem.innerHTML = `
                <img src="${img}" class="chat-list-avatar">
                <div class="chat-list-info">
                    <div class="chat-list-name">👤 ${name} <span class="chat-list-time">DM</span></div>
                    <div class="chat-list-preview">個別メッセージを送る</div>
                </div>
                <div style="color: #c7c7cc; font-weight: 800; font-size: 20px; margin-left: 10px;">›</div>
            `;
            dmItem.onclick = () => showChatRoom(userObj.id, `👤 ${name}`);
            listContainer.appendChild(dmItem);
        });
    }

    function showChatRoom(targetId, titleName) {
        currentChatTarget = targetId;
        document.getElementById('chat-room-title').innerText = titleName;
        document.getElementById('chat-list-view').style.transform = 'translateX(-100%)';
        document.getElementById('chat-room-view').style.transform = 'translateX(0)';
        loadMessages();
    }

    document.getElementById('chat-back-btn').addEventListener('click', () => {
        document.getElementById('chat-list-view').style.transform = 'translateX(0)';
        document.getElementById('chat-room-view').style.transform = 'translateX(100%)';
        if (unsubscribeMessages) {
            unsubscribeMessages();
            unsubscribeMessages = null;
        }
    });

    document.getElementById('send-message-btn').addEventListener('click', async () => {
        const txtInput = document.getElementById('message-input');
        const txt = txtInput.value;
        if (!txt.trim()) return;

        toggleBtnLoading('send-message-btn', true);

        try {
            const baseData = {
                text: txt,
                senderName: currentUsernameCache || "名無し",
                senderPhoto: currentUserPhotoCache || "",
                senderId: auth.currentUser.uid,
                role: currentUserRole || "member",
                createdAt: new Date(),
                isDeleted: false
            };

            if (currentChatTarget === "all") {
                await addDoc(collection(db, "messages"), baseData);
            } else {
                baseData.roomId = getChatRoomId(auth.currentUser.uid, currentChatTarget);
                baseData.receiverId = currentChatTarget;
                await addDoc(collection(db, "directMessages"), baseData);
            }
            txtInput.value = '';
        } catch(e) {
            alert("送信エラー: " + e.message);
            console.error(e);
        } finally {
            toggleBtnLoading('send-message-btn', false);
        }
    });

    function loadMessages() {
        if (unsubscribeMessages) {
            unsubscribeMessages();
            unsubscribeMessages = null;
        }

        const container = document.getElementById('chat-messages');
        container.innerHTML = '<div style="text-align:center; color:#888; font-size:13px; margin-top:20px;">読み込み中...</div>';

        let q;
        if (currentChatTarget === "all") {
            q = query(collection(db, "messages"), orderBy("createdAt", "asc"));
        } else {
            const roomId = getChatRoomId(auth.currentUser.uid, currentChatTarget);
            q = query(collection(db, "directMessages"), where("roomId", "==", roomId));
        }

        unsubscribeMessages = onSnapshot(q, (snap) => {
            container.innerHTML = '';
            if (snap.empty) {
                // ▼ 修正：単なるテキストからエンプティステートへ
                container.innerHTML = `
                    <div class="empty-state" style="margin-top: 40px; border: none; background: transparent;">
                        <div class="empty-icon">💬</div>
                        <div class="empty-title">メッセージがありません</div>
                        <div class="empty-desc">最初のメッセージを送ってみましょう！</div>
                    </div>`;
                return;
            }

            let docsData = [];
            snap.forEach(d => docsData.push({ id: d.id, data: d.data() }));

            docsData.sort((a, b) => {
                const tA = a.data.createdAt ? a.data.createdAt.seconds : 0;
                const tB = b.data.createdAt ? b.data.createdAt.seconds : 0;
                return tA - tB;
            });

            docsData.forEach(dObj => {
                const data = dObj.data;
                const docId = dObj.id;
                const isMe = data.senderId === auth.currentUser?.uid;
                const safeName = data.senderName || "名無し";

                let timeDisplay = '';
                if (data.createdAt) {
                    const dateObj = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
                    const now = new Date();
                    const isToday = dateObj.getFullYear() === now.getFullYear() &&
                        dateObj.getMonth() === now.getMonth() &&
                        dateObj.getDate() === now.getDate();

                    timeDisplay = isToday
                        ? `今日 ${dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`
                        : `${dateObj.getMonth() + 1}/${dateObj.getDate()} ${dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
                }

                const div = document.createElement('div');

                if (data.isDeleted) {
                    div.style.width = "100%";
                    div.style.textAlign = "center";
                    div.style.margin = "10px 0";
                    div.innerHTML = `
                        <div style="display:inline-block; color:var(--text-sub); font-size:11px; background: rgba(0,0,0,0.03); padding: 4px 12px; border-radius: 12px;">
                            ${safeName}が送信を取り消しました
                        </div>`;
                    container.appendChild(div);
                    return;
                }

                div.className = `chat-message-row ${isMe ? 'chat-me' : 'chat-other'}`;
                const avatarImg = data.senderPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(safeName)}&background=0071e3&color=fff&rounded=true`;
                const avatarHtml = isMe ? '' : `<img src="${avatarImg}" class="chat-avatar">`;
                const roleIcon = data.role === 'owner' ? '👑' : data.role === 'admin' ? '🏢' : '';

                if (isMe) {
                    div.innerHTML = `
                        <div class="chat-time-wrap">
                            <button class="chat-delete-btn" data-id="${docId}">取消</button>
                            <span class="chat-time">${timeDisplay}</span>
                        </div>
                        <div class="chat-bubble-col">
                            <div class="chat-bubble">${(data.text || "").replace(/\n/g, '<br>')}</div>
                        </div>
                    `;
                } else {
                    div.innerHTML = `
                        ${avatarHtml}
                        <div class="chat-bubble-col">
                            <div class="chat-meta"><span>${safeName} ${roleIcon}</span></div>
                            <div class="chat-bubble">${(data.text || "").replace(/\n/g, '<br>')}</div>
                        </div>
                        <div class="chat-time-wrap">
                            <span class="chat-time">${timeDisplay}</span>
                        </div>
                    `;
                }
                container.appendChild(div);

                if (isMe) {
                    div.querySelector('.chat-delete-btn').onclick = () => {
                        openActionSheet(`
                            <h3 style="margin-top: 0; font-size: 24px; font-weight: 800; margin-bottom: 20px; color: var(--danger-color);">送信の取消</h3>
                            <div class="input-group-card" style="border-color: rgba(255,59,48,0.3); background: rgba(255,59,48,0.05);">
                                <label class="input-label" style="color: var(--danger-color);">⚠️ 確認</label>
                                <div style="font-size: 13px; font-weight: 700; color: var(--danger-color); padding-left: 5px;">このメッセージを取り消しますか？<br>（履歴は残ります）</div>
                            </div>
                            <div class="flex-row" style="margin-top: 25px; gap: 15px;">
                                <button class="btn-main" id="confirm-sheet-msg-delete" style="flex: 2; margin-bottom: 0; background: linear-gradient(135deg, #ff3b30, #d70015); box-shadow: 0 4px 15px rgba(255, 59, 48, 0.3);">取り消す</button>
                                <button class="btn-sub" id="cancel-sheet-btn" style="flex: 1; margin-bottom: 0;">キャンセル</button>
                            </div>
                        `);

                        document.getElementById('cancel-sheet-btn').onclick = closeActionSheet;
                        document.getElementById('confirm-sheet-msg-delete').onclick = async () => {
                            const collName = currentChatTarget === "all" ? "messages" : "directMessages";
                            await updateDoc(doc(db, collName, docId), { isDeleted: true });
                            closeActionSheet();
                        };
                    };
                }
            });
            setTimeout(() => {
                container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
            }, 100);
        });
    }
