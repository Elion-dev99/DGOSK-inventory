// Firebaseの設定
    const firebaseConfig = {
        apiKey: "AIzaSyCEYYR6xav5DEH3_R9zKXi6sWQted2tUG8",
        authDomain: "dgosk-44e71.firebaseapp.com",
        projectId: "dgosk-44e71",
        storageBucket: "dgosk-44e71.firebasestorage.app",
        messagingSenderId: "867582224758",
        appId: "1:867582224758:web:6537415c035b69e4b5b257"
    };

    // 初期化
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);
    const storage = getStorage(app);

    const adminApp = initializeApp(firebaseConfig, "AdminApp");
    const adminAuth = getAuth(adminApp);

    // DOM要素の取得
    const loginScreen = document.getElementById('login-screen');
    const registerScreen = document.getElementById('register-screen');
    const appScreen = document.getElementById('app-screen');
    const loginMessage = document.getElementById('login-message');
    const registerMessage = document.getElementById('register-message');
    const appTitle = document.getElementById('app-title');

    // グローバル変数
    let currentUserRole = "member";
    let currentUsernameCache = "名無し";
    let currentUserPhotoCache = "";
    const DUMMY_DOMAIN = "@inventory.local";
    let validatedRegEmpCode = "";

    document.getElementById('reg-emp-code').addEventListener('input', () => {
        validatedRegEmpCode = "";
    });

    window.onload = function() {
        setTimeout(function() { window.scrollTo(0, 0); }, 100);
    };
