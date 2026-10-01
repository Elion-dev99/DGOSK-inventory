// ==========================================
    // 認証機能
    // ==========================================
    document.getElementById('register-btn').addEventListener('click', async () => {
        const empCode = document.getElementById('reg-emp-code').value;
        const username = document.getElementById('reg-username').value;
        const pass = document.getElementById('reg-password').value;
        const role = document.querySelector('#register-screen input[name="role"]:checked').value;

        if (!empCode || pass.length < 6) return registerMessage.textContent = "従業員コードと6文字以上のパスワードを入力してください。";
        if (empCode !== validatedRegEmpCode) return registerMessage.textContent = "先に「情報を取得」を押して、大阪店の在籍確認を行ってください。";
        if (role === 'admin' && document.getElementById('admin-secret').value !== '7777') return registerMessage.textContent = "管理者用パスコードが間違っています。";

        toggleBtnLoading('register-btn', true);
        const secretEmail = empCode + DUMMY_DOMAIN;
        const fetchedImgSrc = document.getElementById('reg-profile-img').src;
        const profileImageUrl = fetchedImgSrc.includes('dgdgdg.com') ? fetchedImgSrc : "";

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, secretEmail, pass);
            await setDoc(doc(db, "users", userCredential.user.uid), {
                empCode: empCode,
                username: username || `ユーザー${empCode}`,
                email: secretEmail,
                role: role,
                profileImageUrl: profileImageUrl,
                isActive: true,
                createdAt: new Date()
            });
        } catch (err) {
            registerMessage.textContent = err.code === 'auth/email-already-in-use' ? "この従業員コードは既に使われています。" : "エラー: " + err.message;
        } finally {
            toggleBtnLoading('register-btn', false);
        }
    });

    document.getElementById('login-btn').addEventListener('click', () => {
        const inputVal = document.getElementById('login-emp-code').value;
        const pass = document.getElementById('login-password').value;
        if (!inputVal || !pass) return loginMessage.textContent = "入力が不足しています。";

        toggleBtnLoading('login-btn', true);

        const loginEmail = inputVal.includes('@') ? inputVal : inputVal + DUMMY_DOMAIN;

        signInWithEmailAndPassword(auth, loginEmail, pass).catch(err => {
            loginMessage.textContent = "サインイン失敗: ID/メールかパスワードが違います。";
            toggleBtnLoading('login-btn', false);
        });
    });

    document.getElementById('logout-btn').addEventListener('click', () => signOut(auth));

    const adminAddBtn = document.getElementById('admin-add-user-btn');
    if (adminAddBtn) {
        adminAddBtn.addEventListener('click', async () => {
            const role = document.querySelector('input[name="add-role"]:checked').value;
            const username = document.getElementById('add-username').value;
            const pass = document.getElementById('add-password').value;

            if (!username || pass.length < 6) return alert("ユーザー名と6文字以上のパスワードを入力してください。");

            let secretEmail = "";
            let dbEmpCode = "";
            let profileImageUrl = "";

            if (role === 'owner') {
                const email = document.getElementById('add-email').value;
                if (!email || !email.includes('@')) return alert("正しいメールアドレスを入力してください。");
                secretEmail = email;
                dbEmpCode = "owner";
            } else {
                const empCodeInput = document.getElementById('add-emp-code').value;
                const empCode = empCodeInput || `manual_${Math.floor(Math.random() * 100000)}`;
                secretEmail = empCode + DUMMY_DOMAIN;
                dbEmpCode = empCode.startsWith('manual_') ? '' : empCode;

                const addProfilePreview = document.getElementById('add-profile-preview');
                if (addProfilePreview.style.display !== 'none') {
                    const fetchedImgSrc = document.getElementById('add-profile-img').src;
                    profileImageUrl = fetchedImgSrc.includes('dgdgdg.com') ? fetchedImgSrc : "";
                }
            }

            toggleBtnLoading('admin-add-user-btn', true);

            try {
                const userCredential = await createUserWithEmailAndPassword(adminAuth, secretEmail, pass);
                await setDoc(doc(db, "users", userCredential.user.uid), {
                    empCode: dbEmpCode,
                    username: username,
                    email: secretEmail,
                    role: role,
                    profileImageUrl: profileImageUrl,
                    isActive: true,
                    createdAt: new Date()
                });
                await signOut(adminAuth);

                const roleLabels = { 'member': '一般メンバー', 'admin': '管理者', 'owner': 'オーナー' };
                alert(`${username}さんを${roleLabels[role]}として追加しました！`);

                document.getElementById('add-emp-code').value = '';
                document.getElementById('add-email').value = '';
                document.getElementById('add-username').value = '';
                document.getElementById('add-password').value = '';
                document.getElementById('add-profile-preview').style.display = 'none';
            } catch (err) {
                alert(err.code === 'auth/email-already-in-use' ? "エラー: このID/メールアドレスは既に登録されています。" : "エラー: " + err.message);
            } finally {
                toggleBtnLoading('admin-add-user-btn', false);
            }
        });
    }

    document.getElementById('update-profile-btn').addEventListener('click', async () => {
        const user = auth.currentUser;
        if (!user) return;

        const newName = document.getElementById('profile-username').value;
        const newPass = document.getElementById('profile-password').value;
        toggleBtnLoading('update-profile-btn', true);

        try {
            let updated = false;
            if (newName) {
                await setDoc(doc(db, "users", user.uid), { username: newName }, { merge: true });
                updated = true;
                currentUsernameCache = newName;
                document.getElementById('account-info').querySelector('h2').innerText = newName;
            }
            if (newPass) {
                await updatePassword(user, newPass);
                document.getElementById('profile-password').value = '';
                updated = true;
            }
            if (updated) alert("プロフィールを更新しました！");
        } catch (e) {
            alert(e.code === 'auth/requires-recent-login' ? "【重要】パスワードを変更するには一度サインアウトし、再度サインインし直す必要があります。" : "エラー: " + e.message);
        } finally {
            toggleBtnLoading('update-profile-btn', false);
        }
    });
