// 1. 初始化 Supabase 連線
const SUPABASE_URL = 'https://yicwnztovhmbbomfroma.supabase.co';
const SUPABASE_KEY = 'sb_publishable_JrUdwQ0Iqs2NzxyMZmB-zw_kQrJhzeU'; 
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 2. Google 登入/登出功能
async function login() {
    const { error } = await _supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            // 綁定完整專案網址，防止 404 錯誤
            redirectTo: 'https://102005shawn-tech.github.io/Workloh-system-/'
        }
    });
    if (error) alert('登入失敗：' + error.message);
}

async function logout() {
    await _supabase.auth.signOut();
    location.reload();
}

// 3. 儲存紀錄功能
async function saveLog() {
    const date = document.getElementById('workDate').value;
    const start = document.getElementById('startTime').value;
    const end = document.getElementById('endTime').value;
    const keyStatus = document.getElementById('keyStatus').value === 'true'; // 讀取 HTML 的鑰匙狀態

    if (!date || !start || !end) return alert('請填寫完整！');

    const { data: { user } } = await _supabase.auth.getUser();
    if (!user) return alert('請先登入！');

    const { error } = await _supabase.from('work_logs').insert([
        { 
            work_date: date, 
            start_time: start, 
            end_time: end, 
            user_id: user.id, // 自動與登入的 Google 帳號綁定
            is_returned: keyStatus 
        }
    ]);

    if (error) alert('儲存失敗：' + error.message);
    else {
        alert('儲存成功！');
        fetchLogs(); 
    }
}

// 4. 抓取紀錄並呈現在清單中 (含鑰匙歸還狀態顯示)
async function fetchLogs() {
    const { data, error } = await _supabase
        .from('work_logs')
        .select('*')
        .order('work_date', { ascending: false });

    if (error) return console.error(error);

    const list = document.getElementById('logList');
    list.innerHTML = data.map(log => {
        // 歷史紀錄區：自動判斷鑰匙狀態顯示對應文字與顏色
        const keyStatusText = log.is_returned ? '已還 🔑' : '未還 ❌';
        const keyStatusColor = log.is_returned ? '#48bb78' : '#e53e3e';

        return `
            <div style="background:white; padding:15px; border-radius:8px; margin-bottom:10px; border-left:5px solid #4285F4; display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <strong>${log.work_date}</strong><br>
                    <small>${log.start_time} - ${log.end_time}</small>
                </div>
                <div style="display: flex; flex-direction: column; gap: 5px; align-items: flex-end;">
                    <button onclick="toggleKeyStatus('${log.id}', ${log.is_returned})" style="background:${keyStatusColor}; color:white; border:none; padding:4px 8px; border-radius:4px; font-size:0.75rem; width:auto; cursor:pointer;">
                        鑰匙：${keyStatusText}
                    </button>
                    <button onclick="deleteLog('${log.id}')" style="background:none; color:#a0aec0; border:none; width:auto; cursor:pointer; font-size:0.75rem; padding:0;">[ 🗑️刪除 ]</button>
                </div>
            </div>
        `;
    }).join('');
}

// 5. 點擊紀錄按紐直接切換鑰匙狀態
async function toggleKeyStatus(id, currentStatus) {
    const { error } = await _supabase
        .from('work_logs')
        .update({ is_returned: !currentStatus }) // 反轉狀態
        .eq('id', id);

    if (error) alert('更新鑰匙狀態失敗：' + error.message);
    else fetchLogs(); 
}

// 6. 刪除紀錄
async function deleteLog(id) {
    if (!confirm('確定刪除這筆紀錄嗎？')) return;
    await _supabase.from('work_logs').delete().eq('id', id);
    fetchLogs();
}

// 7. 監聽登入狀態切換 UI (升級版：主動檢查 session)
async function checkUserSession() {
    const authSection = document.getElementById('authSection');
    const userProfile = document.getElementById('userProfile');
    const mainApp = document.getElementById('mainApp');
    const userEmail = document.getElementById('userEmail');

    // 主動向 Supabase 獲取當前登入的 session
    const { data: { session } } = await _supabase.auth.getSession();

    if (session) {
        if (authSection) authSection.style.display = 'none';
        if (userProfile) userProfile.style.display = 'block';
        if (mainApp) mainApp.style.display = 'block';
        if (userEmail) userEmail.innerText = session.user.email;
        fetchLogs(); 
    } else {
        if (authSection) authSection.style.display = 'block';
        if (userProfile) userProfile.style.display = 'none';
        if (mainApp) mainApp.style.display = 'none';
    }
}

// 網頁一打開，立刻執行檢查
checkUserSession();

// 當登入狀態改變時（例如點擊登入成功回來），再次觸發檢查
_supabase.auth.onAuthStateChange((event, session) => {
    checkUserSession();
});