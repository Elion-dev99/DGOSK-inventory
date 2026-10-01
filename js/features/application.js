onAuthStateChanged(auth, async (user) => {
        if (user) {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            let userData = {};

            if (userDoc.exists()) {
                userData = userDoc.data();
                if (userData.isActive === false) {
                    await signOut(auth);
                    loginMessage.textContent = "このアカウントは停止されています。";
                    loginScreen.style.display = 'block';
                    setTimeout(() => loginScreen.classList.add('active'), 10);
                    appScreen.classList.remove('active');
                    registerScreen.classList.remove('active');
                    setTimeout(() => {
                        appScreen.style.display = 'none';
                        registerScreen.style.display = 'none';
                    }, 500);
                    return;
                }
                currentUserRole = userData.role || "member";
            } else {
                currentUserRole = "admin";
                setDoc(doc(db, "users", user.uid), {
                    email: user.email,
                    role: currentUserRole,
                    isActive: true,
                    createdAt: new Date()
                });
            }

            const roleName = currentUserRole === 'owner' ? "👑 オーナー (Owner)" : currentUserRole === 'admin' ? "🏢 管理者 (Admin)" : "👤 一般 (Member)";
            const currentUsername = userData.username || "名無し";
            currentUsernameCache = currentUsername;

            const profileImgUrl = userData.profileImageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUsername)}&background=0071e3&color=fff&rounded=true&size=80`;
            currentUserPhotoCache = profileImgUrl;

            document.getElementById('account-info').innerHTML = `
                <img src="${profileImgUrl}" style="width: 80px; height: 80px; margin-bottom: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border-radius: 50%; object-fit: cover;">
                <h2 style="margin: 0; font-size: 24px; letter-spacing: -0.5px;">${currentUsername}</h2>
                <p style="margin: 5px 0 0; color: var(--accent-color); font-weight: 700; font-size: 14px; background: rgba(0,113,227,0.1); padding: 6px 14px; border-radius: 20px;">${roleName}</p>
            `;
            document.getElementById('profile-username').value = currentUsername;

            appScreen.style.display = 'block';
            setTimeout(() => appScreen.classList.add('active'), 10);

            loginScreen.classList.remove('active');
            registerScreen.classList.remove('active');
            setTimeout(() => {
                loginScreen.style.display = 'none';
                registerScreen.style.display = 'none';
            }, 500);

            loadOrderList();
            loadInventory();
            loadUsers();
            loadMessages();

            document.getElementById('admin-section').style.display = (currentUserRole === 'admin' || currentUserRole === 'owner') ? 'block' : 'none';

            document.getElementById('nav-home').style.display = (currentUserRole === 'admin' || currentUserRole === 'owner') ? 'flex' : 'none';
            switchTab('list');
        } else {
            loginScreen.style.display = 'block';
            setTimeout(() => loginScreen.classList.add('active'), 10);

            appScreen.classList.remove('active');
            registerScreen.classList.remove('active');

            setTimeout(() => {
                appScreen.style.display = 'none';
                registerScreen.style.display = 'none';
            }, 500);

            currentUserRole = "member";
            toggleBtnLoading('login-btn', false);
        }
    });

    const sheetOverlay = document.getElementById('action-sheet-overlay');
    const sheet = document.getElementById('action-sheet');
    const sheetContent = document.getElementById('action-sheet-content');

    function openActionSheet(html) {
        sheetContent.innerHTML = html;
        sheetOverlay.style.display = 'block';
        setTimeout(() => {
            sheetOverlay.style.opacity = '1';
            sheet.classList.add('active');
        }, 10);
    }

    function closeActionSheet() {
        sheet.classList.remove('active');
        sheetOverlay.style.opacity = '0';
        setTimeout(() => {
            sheetOverlay.style.display = 'none';
            sheetContent.innerHTML = '';
        }, 400);
    }

    document.getElementById('close-sheet').onclick = closeActionSheet;
    sheetOverlay.onclick = closeActionSheet;

    const messageInput = document.getElementById('message-input');
    if (messageInput) {
        messageInput.addEventListener('blur', () => {
            let count = 0;
            const resetScroll = setInterval(() => {
                window.scrollTo(0, 0);
                document.body.scrollTop = 0;
                count++;
                if (count > 10) clearInterval(resetScroll);
            }, 50);
        });

        messageInput.addEventListener('focus', () => {
            setTimeout(() => {
                const container = document.getElementById('chat-messages');
                if (container) {
                    container.scrollTop = container.scrollHeight;
                }
            }, 300);
        });
    }
