// ==========================================
    // 画面切り替えの処理
    // ==========================================
    document.getElementById('show-register-btn').addEventListener('click', () => {
        loginScreen.classList.remove('active');
        setTimeout(() => {
            loginScreen.style.display = 'none';
            registerScreen.style.display = 'block';
            setTimeout(() => registerScreen.classList.add('active'), 50);
        }, 500);
    });

    document.getElementById('show-login-btn').addEventListener('click', () => {
        registerScreen.classList.remove('active');
        setTimeout(() => {
            registerScreen.style.display = 'none';
            loginScreen.style.display = 'block';
            setTimeout(() => loginScreen.classList.add('active'), 50);
        }, 500);
    });

    document.querySelectorAll('#register-screen input[name="role"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            document.getElementById('admin-secret-area').style.display = e.target.value === 'admin' ? 'block' : 'none';
        });
    });

    document.querySelectorAll('input[name="add-role"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const isOwner = e.target.value === 'owner';
            document.getElementById('add-emp-code-area').style.display = isOwner ? 'none' : 'block';
            document.getElementById('add-email-area').style.display = isOwner ? 'block' : 'none';
        });
    });

    function loadOrganizationSettings() {
        onSnapshot(doc(db, "settings", "general"), (docSnap) => {
            let orgName = "Future Inventory";
            if (docSnap.exists() && docSnap.data().organizationName) {
                orgName = docSnap.data().organizationName;
            }
            document.querySelectorAll('.auth-org-title').forEach(el => el.innerText = orgName);
            const orgInput = document.getElementById('org-name-input');
            if (orgInput && document.activeElement !== orgInput) {
                orgInput.value = orgName;
            }
        });
    }
    loadOrganizationSettings();
    loadMasterData();

    document.getElementById('save-org-btn').addEventListener('click', async () => {
        const newOrgName = document.getElementById('org-name-input').value;
        if (!newOrgName) return;

        const saveBtn = document.getElementById('save-org-btn');
        saveBtn.innerText = "⏳";
        saveBtn.disabled = true;

        try {
            await setDoc(doc(db, "settings", "general"), { organizationName: newOrgName }, { merge: true });
            alert("組織名を更新しました！");
        } catch (e) {
            alert("エラー: " + e.message);
        } finally {
            saveBtn.innerText = "更新";
            saveBtn.disabled = false;
        }
    });

    function switchTab(tabId) {
        const currentActiveContent = document.querySelector('.tab-content.active');
        if(currentActiveContent && (currentActiveContent.id === 'login-screen' || currentActiveContent.id === 'register-screen')) return;

        const nextContent = document.getElementById('tab-' + tabId);
        const titles = {
            'home': 'Add Item',
            'list': 'Stock (Category)',
            'location': 'Stock (Location)',
            'order': 'Order List',
            'chat': 'Messages',
            'settings': 'Settings'
        };
        if(appTitle) appTitle.innerText = titles[tabId];

        if (currentActiveContent) {
            currentActiveContent.style.opacity = '0';
            currentActiveContent.style.transform = 'translateY(15px) scale(0.98)';
            setTimeout(() => {
                currentActiveContent.classList.remove('active');
                nextContent.classList.add('active');
                setTimeout(() => {
                    nextContent.style.opacity = '1';
                    nextContent.style.transform = 'translateY(0) scale(1)';
                    window.scrollTo(0, 0);
                }, 50);
            }, 300);
        } else {
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            document.getElementById('nav-' + tabId).classList.add('active');
            window.scrollTo(0, 0);
        }

        document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
        document.getElementById('nav-' + tabId).classList.add('active');

        if (tabId === 'chat') {
            setTimeout(() => {
                const chatContainer = document.getElementById('chat-messages');
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }, 350);
        }
    }

    ['home', 'list', 'location', 'order', 'chat', 'settings'].forEach(id => {
        document.getElementById('nav-' + id).addEventListener('click', () => switchTab(id));
    });

    function toggleBtnLoading(btnId, isLoading) {
        const btn = document.getElementById(btnId);
        if (!btn) return;

        let spinner = btn.querySelector('.loading-spinner') || btn.querySelector('.btn-small-spinner');
        const text = btn.querySelector('.btn-text');

        if (spinner && text) {
            if (isLoading) {
                spinner.style.display = 'block';
                text.style.opacity = '0';
                btn.disabled = true;
            } else {
                spinner.style.display = 'none';
                text.style.opacity = '1';
                btn.disabled = false;
            }
        }
    }
