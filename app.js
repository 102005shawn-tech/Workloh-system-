// 1. 初始化 Supabase 連線
const SUPABASE_URL = 'https://yicwnztovhmbbomfroma.supabase.co';
const SUPABASE_KEY = 'sb_publishable_JrUdwQ0Iqs2NzxyMZmB-zw_kQrJhzeU'; 
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 2. Google 登入功能 (這裡直接寫死網址，徹底解決 404 問題)
async function login() {
    const { error } = await _supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            // ⚠️ 這裡直接綁定你的完整專案網址，後面最後一個斜線不可省略
            redirectTo: 'https://102005shawn-tech.github.io/Workloh-system-/'
        }
    });
    if (error) alert('登入失敗：' + error.message);
}

// 登出功能
async function logout() {
    await _supabase.auth.signOut();
    location.reload();
}

// 3. 儲存紀錄功能
async function saveLog() {
    const date = document.getElementById('workDate').value;
    const start = document.getElementById('startTime').value;
    const end = document.getElementById('endTime').value;

    if (!date || !start || !end) return alert('請填寫完整！');

    const { data: { user } } = await _supabase.auth.getUser();
    if (!user) return alert('請先登入！');

    const { error } = await _supabase.from('work_logs').insert([
        { work_date: date, start_time: start, end_time: end, user_id: user.id }
    ]);

    if (error) alert('儲存失敗：' + error.message);
    else {
        alert('儲存成功！');
        fetchLogs();
    }
}

// 4. 抓取紀錄 (會自動根據登入者過濾)
async function fetchLogs() {
    const { data, error } = await _supabase
        .from('work_logs')
        .select('*')
        .order('work_date', { ascending: false });

    if (error) return console.error(error);

    const list = document.getElementById('logList');
    list.innerHTML = data.map(log => `
        <div style="background:white; padding:15px; border-radius:8px; margin-bottom:10px; border-left:5px solid #4285F4; display:flex; justify-content:space-between;">
            <div>
                <strong>${log.work_date}</strong><br>
                <small>${log.start_time} - ${log.end_time}</small>
            </div>
            <button onclick="deleteLog('${log.id}')" style="background:none; color:red; border:none; width:auto; cursor:pointer;">刪除</button>
        </div>
    `).join('');
}

// 5. 刪除紀錄
async function deleteLog(id) {
    if (!confirm('確定刪除？')) return;
    await _supabase.from('work_logs').delete().eq('id', id);
    fetchLogs();
}

// 6. 監聽登入狀態切換 UI
_supabase.auth.onAuthStateChange((event, session) => {
    const authSection = document.getElementById('authSection');
    const userProfile = document.getElementById('userProfile');
    const mainApp = document.getElementById('mainApp');
    const userEmail = document.getElementById('userEmail');

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
});