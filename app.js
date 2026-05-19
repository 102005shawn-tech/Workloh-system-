// 修正後的儲存功能：會去抓 HTML 裡面選單的鑰匙狀態
async function saveLog() {
    const date = document.getElementById('workDate').value;
    const start = document.getElementById('startTime').value;
    const end = document.getElementById('endTime').value;
    // 抓取下拉選單的值 (轉成 true 或 false)
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
            is_returned: keyStatus // 寫入使用者選的狀態
        }
    ]);

    if (error) alert('儲存失敗：' + error.message);
    else {
        alert('儲存成功！');
        fetchLogs();
    }
}