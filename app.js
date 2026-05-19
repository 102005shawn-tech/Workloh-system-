// 1. 初始化 Supabase 連線
const SUPABASE_URL = 'https://yicwnztovhmbbomfroma.supabase.co';
const SUPABASE_KEY = 'sb_publishable_JrUdwQ0Iqs2NzxyMZmB-zw_kQrJhzeU'; 
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 2. Google 登入功能
async function login() {
    const { error } = await _supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            // 直接寫死你的完整專案網址，徹底解決 404 問題
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

// 3. 儲存紀錄功能 (包含自動抓取 HTML 鑰匙狀態與帳號隔離保護)
async function saveLog() {
    const date = document.getElementById('workDate').value;
    const start = document.getElementById('startTime').value;
    const end = document.getElementById('endTime').value;
    // 讀取 index.html 裡面選單選取的值，並轉換為布林值 (true / false)
    const keyStatus = document.getElementById('keyStatus').value === 'true';

    if (!date || !start || !end) return alert('請填寫完整！');

    const { data: { user } } = await _supabase.auth.getUser();
    if (!user) return alert('請先登入！');

    const { error } = await _supabase.from('work_logs').insert([
        { 
            work_date: date, 
            start_time: start, 
            end_time: end, 
            user_id: user.id,
            is_returned: keyStatus // 寫入使用者在下拉選單選取的鑰匙狀態
        }
    ]);

    if (error) alert('儲存失敗：' + error.message);
    else {
        alert('儲存成功！');
        fetchLogs(); // 重新整理列表
    }
}

// 4. 抓取紀錄 (包含帳號自動過濾與「鑰匙狀態」開關顯示)
async function fetchLogs() {
    const { data, error } = await _supabase
        .from('work_logs')
        .select('*')
        .order('work_date', { ascending: false });

    if (error) return console.error(error);

    const list = document.getElementById('logList');
    list.innerHTML = data.map(log => {
        // 根據資料庫狀態，決定清單按鈕要顯示「未還 ❌」還是「已還 🔑」
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

// 5. 線上直接切換鑰匙狀態功能
async function toggleKeyStatus(id, currentStatus) {
    const { error } = await _supabase
        .from('work_logs')
        .update({ is_returned: !currentStatus }) // 狀態反轉：true 變 false，false 變 true
        .eq('id', id);

    if (error) alert('更新鑰匙狀態失敗：' + error.message);
    else fetchLogs(); // 重新整理列表
}

// 6. 刪除紀錄功能
async function deleteLog(id) {
    if (!confirm('確定刪除這筆紀錄嗎？')) return;
    await _supabase.from('work_logs').delete().eq('id', id);
    fetchLogs();
}

// 7. 監聽