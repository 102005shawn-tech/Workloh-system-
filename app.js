// 1. 初始化 Supabase 連線
const SUPABASE_URL = 'https://yicwnztovhmbbomfroma.supabase.co';
const SUPABASE_KEY = 'sb_publishable_JrUdwQ0Iqs2NzxyMZmB-zw_kQrJhzeU'; // 請填入你那串長長的 Key
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 2. 儲存時數紀錄
async function saveLog() {
    const date = document.getElementById('workDate').value;
    const start = document.getElementById('startTime').value;
    const end = document.getElementById('endTime').value;

    // 檢查欄位是否為空
    if (!date || !start || !end) return alert('請完整填寫日期與時間！');

    // 呼叫 Supabase 的 insert 功能
    const { error } = await _supabase.from('work_logs').insert([
        { work_date: date, start_time: start, end_time: end }
    ]);

    if (error) {
        alert('儲存失敗：' + error.message);
    } else {
        alert('紀錄儲存成功！');
        fetchLogs(); // 成功後立即刷新列表
    }
}

// 3. 從資料庫讀取並渲染列表
async function fetchLogs() {
    const { data, error } = await _supabase
        .from('work_logs')
        .select('*')
        .order('work_date', { ascending: false }); // 依照日期由新到舊排序

    if (error) {
        console.error('讀取失敗:', error.message);
        return;
    }

    const list = document.getElementById('logList');
    list.innerHTML = data.map(log => `
        <div class="log-item">
            <div class="log-info">
                <strong>${log.work_date}</strong><br>
                <small>${log.start_time} - ${log.end_time}</small>
            </div>
            <div class="log-status">
                <span class="badge">${Math.floor(log.duration_min/60)}h ${log.duration_min%60}m</span><br>
                
                <label>
                    <input type="checkbox" ${log.is_key_returned ? 'checked' : ''} 
                           onchange="updateKeyStatus('${log.id}', this.checked)"> 鑰匙
                </label>
                
                <div class="key-time" id="key-time-${log.id}">
                    ${log.key_returned_at ? new Date(log.key_returned_at).toLocaleTimeString() : ''}
                </div>
            </div>
        </div>
    `).join('');

    // 計算總累計時數
    const totalMin = data.reduce((sum, log) => sum + log.duration_min, 0);
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    document.getElementById('totalDisplay').innerText = `${h} 小時 ${m} 分`;
}

// 4. 更新鑰匙歸還狀態
async function updateKeyStatus(id, isChecked) {
    const { data, error } = await _supabase
        .from('work_logs')
        .update({ is_key_returned: isChecked })
        .eq('id', id)
        .select(); // 更新後重新選取，才能拿到資料庫自動產生的時間戳

    if (error) {
        alert('更新失敗: ' + error.message);
    } else {
        // 重新讀取，讓歸還時間顯示出來
        fetchLogs();
    }
}

// 5. 初始執行 (網頁一打開就抓取一次資料)
fetchLogs();