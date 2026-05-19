// 1. 初始化 Supabase 連線
const SUPABASE_URL = 'https://yicwnztovhmbbomfroma.supabase.co';
const SUPABASE_KEY = 'sb_publishable_JrUdwQ0Iqs2NzxyMZmB-zw_kQrJhzeU'; 
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 2. Google 登入功能
async function login() {
    const { error } = await _supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
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

// 3. 儲存紀錄功能 (有包含 user_id 隔離)
async function saveLog() {
    const date = document.getElementById('workDate').value;
    const start = document.getElementById('startTime').value;
    const end = document.getElementById('endTime').value;

    if (!date || !start || !end) return alert('請填寫完整！');

    const { data: { user } } = await _supabase.auth.getUser();
    if (!user) return alert('請先登入！');

    // 預設新增時為「未還」狀態 (false)
    const { error } = await _supabase.from('work_logs').insert([
        { 
            work_date: date, 
            start_time: start, 
            end_time: end, 
            user_id: user.id,
            is_returned: false 
        }
    ]);

    if (error) alert('儲存失敗：' + error.message);
    else {
        alert('儲存成功！');
        fetchLogs();
    }
}

// 4. 抓取紀錄 (包含「還鑰匙」開關轉換與過濾)
async function fetchLogs() {
    const { data, error } = await _supabase
        .from('work_logs')
        .select('*')
        .order('work_date', { ascending: false });

    if (error) return console.error(error);

    const list = document.getElementById('logList');
    list.innerHTML = data.map(log => {
        // 根據資料庫狀態，決定按鈕要顯示「未還 ❌」還是「已還 🔑」
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

// 5. 切換鑰匙歸還狀態功能
async function toggleKeyStatus(id, currentStatus) {
    const { error } = await _supabase
        .from('work_logs')
        .update({ is_returned: !currentStatus }) // 把狀態反轉 (true 變 false，false 變 true)
        .eq('id', id);

    if (error) alert('更新鑰匙狀態失敗：' + error.message);
    else fetchLogs(); // 重新整理列表
}

// 6. 刪除紀錄
async function deleteLog(id) {
    if (!confirm('確定刪除？')) return;
    await _supabase.from('work_logs').delete().eq('id', id);
    fetchLogs();
}

// 7. 監聽登入狀態切換 UI
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