// ==========================================
    // スクレイピング処理
    // ==========================================
    async function fetchEmployeeData(empCode, targetNameInputId, previewContainerId, previewImgId, previewNameId) {
        if (!empCode) {
            alert("従業員コードを入力してください。");
            return false;
        }

        try {
            const detailUrl = `https://www.dgdgdg.com/boy/detail.php?shop_id=4&boy_id=${empCode}`;
            const listUrl = `https://www.dgdgdg.com/boy/list.php?shop_id=4`;

            const fetchWithProxy = async (url) => {
                const encodedUrl = encodeURIComponent(url);
                const proxies = [
                    `https://corsproxy.io/?${encodedUrl}`,
                    `https://api.codetabs.com/v1/proxy?quest=${encodedUrl}`
                ];
                for (let proxy of proxies) {
                    try {
                        const res = await fetch(proxy);
                        if (res.ok) return await res.text();
                    } catch (e) {}
                }
                throw new Error("プロキシサーバーがブロックされました。");
            };

            const detailHtml = await fetchWithProxy(detailUrl);
            const parser = new DOMParser();
            const detailDoc = parser.parseFromString(detailHtml, "text/html");
            const belongShopDiv = detailDoc.querySelector('#Belongshop');

            if (!belongShopDiv || !belongShopDiv.innerText.trim().includes("大阪店")) {
                throw new Error("この従業員は大阪店の在籍ではありません。");
            }

            let name = "";
            const titleTag = detailDoc.querySelector('title');
            if (titleTag && titleTag.innerText) {
                name = titleTag.innerText.split(/[\s\|｜\-]/)[0].trim();
            }
            if (!name || name.length > 15) {
                const h1 = detailDoc.querySelector('h1');
                if (h1) name = h1.innerText.trim();
            }
            if (!name) {
                throw new Error("ページから名前を読み取れませんでした。");
            }

            let imgUrl = "";
            try {
                const listHtml = await fetchWithProxy(listUrl);
                const listDoc = parser.parseFromString(listHtml, "text/html");
                const imgs = listDoc.querySelectorAll('img.boy_img');
                for (let img of imgs) {
                    if ((img.getAttribute('alt') || '').trim() === name) {
                        const src = img.getAttribute('src');
                        if (src) {
                            imgUrl = src.startsWith('http') ? src : `https://www.dgdgdg.com${src.startsWith('/') ? '' : '/'}${src}`;
                            break;
                        }
                    }
                }
            } catch (e) {}

            document.getElementById(targetNameInputId).value = name;

            if (previewContainerId) {
                document.getElementById(previewNameId).innerText = name;
                document.getElementById(previewImgId).src = imgUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0071e3&color=fff`;
                document.getElementById(previewContainerId).style.display = 'flex';
            }
            return true;
        } catch (e) {
            alert("データの取得に失敗しました。\n(エラー詳細: " + e.message + ")");
            return false;
        }
    }

    document.getElementById('fetch-reg-btn').addEventListener('click', async () => {
        toggleBtnLoading('fetch-reg-btn', true);
        const code = document.getElementById('reg-emp-code').value;
        const success = await fetchEmployeeData(code, 'reg-username', 'reg-profile-preview', 'reg-profile-img', 'reg-profile-name');

        if (success) {
            validatedRegEmpCode = code;
            registerMessage.textContent = "";
        } else {
            validatedRegEmpCode = "";
        }
        toggleBtnLoading('fetch-reg-btn', false);
    });

    document.getElementById('fetch-add-btn').addEventListener('click', async () => {
        toggleBtnLoading('fetch-add-btn', true);
        await fetchEmployeeData(document.getElementById('add-emp-code').value, 'add-username', 'add-profile-preview', 'add-profile-img', 'add-profile-name');
        toggleBtnLoading('fetch-add-btn', false);
    });
