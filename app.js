// 1. 初始化 Supabase 連線
const SUPABASE_URL = 'https://yicwnztovhmbbomfroma.supabase.co';
const SUPABASE_KEY = 'sb_publishable_JrUdwQ0Iqs2NzxyMZmB-zw_kQrJhzeU'; 
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 2. 登入/登出功能
async function login() {
    const { error } = await _supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin }
    });
    if (error) alert('登入失敗：' + error.message);
}

async function logout() {
    await _supabase.auth.signOut();
    location.reload();
}

// 3. 儲存紀錄
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

async function deleteLog(id) {
    if (!confirm('確定刪除？')) return;
    await _supabase.from('work_logs').delete().eq('id', id);
    fetchLogs();
}

// 5. 監聽登入狀態切換 UI
_supabase.auth.onAuthStateChange((event, session) => {
    const authSection = document.getElementById('authSection');
    const userProfile = document.getElementById('userProfile');
    const mainApp = document.getElementById('mainApp');
    const userEmail = document.getElementById('userEmail');

    if (session) {
        authSection.style.display = 'none';
        userProfile.style.display = 'block';
        mainApp.style.display = 'block';
        userEmail.innerText = session.user.email;
        fetchLogs();
    } else {
        authSection.style.display = 'block';
        userProfile.style.display = 'none';
        mainApp.style.display = 'none';
    }
});