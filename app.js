// 1. 初始化 Supabase 連線 (請確保這兩組資訊正確)
const SUPABASE_URL = 'https://yicwnztovhmbbomfroma.supabase.co';
const SUPABASE_KEY = 'sb_publishable_JrUdwQ0Iqs2NzxyMZmB-zw_kQrJhzeU'; // 👈 記得換成你那串 eyJ... 開頭的長字串

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 2. 儲存紀錄功能
async function saveLog() {
    const date = document.getElementById('workDate').value;
    const start = document.getElementById('startTime').value;
    const end = document.getElementById('endTime').value;

    if (!date || !start || !end) return alert('請完整填寫日期與時間！');

    const { error } = await _supabase.from('work_logs').insert([
        { work_date: date, start_time: start, end_time: end }
    ]);

    if (error) {
        alert('儲存失敗：' + error.message);
    } else {
        alert('紀錄儲存成功！');
        fetchLogs(); 
    }
}

// 3. 讀取並顯示列表
async function fetchLogs() {
    const { data, error } = await _supabase
        .from('work_logs')
        .select('*')
        .order('work_date', { ascending: false });

    if (error) {
        console.error('讀取失敗:', error.message);
        return;
    }

    const list = document.getElementById('logList');
    list.innerHTML = data.map(log => `
        <div class="log-item" style="border-left: 5px solid #3182ce; background: #f8fafc; padding: 15px; margin-bottom: 10px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
            <div>
                <strong style="font-size: 1.1rem; color: #2d3748;">${log.work_date}</strong><br>
                <small style="color: #718096;">${log.start_time} - ${log.end_time}</small>
            </div>
            <div style="text-align: right;">
                <span style="background: #ebf8ff; color: #2b6cb0; padding: 2px 8px; border-radius: 4px; font-weight: bold;">
                    ${Math.floor(log.duration_min/60)}h ${log.duration_min%60}m
                </span><br>
                
                <div style="margin: 5px 0;">
                    <label style="cursor: pointer; font-size: 0.9rem;">
                        <input type="checkbox" ${log.is_key_returned ? 'checked' : ''} 
                               onchange="updateKeyStatus('${log.id}', this.checked)"> 🔑鑰匙
                    </label>
                    <button onclick="deleteLog('${log.id}')" style="background: none; border: none; color: #e53e3e; cursor: pointer; font-size: 0.8rem; margin-left: 8px; padding: 0;">
                        [ 🗑️刪除 ]
                    </button>
                </div>
                
                <div style="font-size: 10px; color: #a0aec0;">
                    ${log.key_returned_at ? '歸還於: ' + new Date(log.key_returned_at).toLocaleTimeString() : '尚未歸還'}
                </div>
            </div>
        </div>
    `).join('');

    // 計算總累計時數
    const totalMin = data.reduce((sum, log) => sum + (log.duration_min || 0), 0);
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    document.getElementById('totalDisplay').innerText = `${h} 小時 ${m} 分`;
}

// 4. 更新鑰匙歸還狀態
async function updateKeyStatus(id, isChecked) {
    const { error } = await _supabase
        .from('work_logs')
        .update({ is_key_returned: isChecked })
        .eq('id', id);

    if (error) {
        alert('更新失敗: ' + error.message);
    } else {
        fetchLogs();
    }
}

// 5. 刪除紀錄功能
async function deleteLog(id) {
    if (!confirm('確定要刪除這筆紀錄嗎？')) return;

    const { error } = await _supabase
        .from('work_logs')
        .delete()
        .eq('id', id);

    if (error) {
        alert('刪除失敗：' + error.message);
    } else {
        alert('紀錄已刪除');
        fetchLogs();
    }
}

// 初始讀取資料
fetchLogs();