// 主题定义（与 22.html 一致的三套皮肤）
const themes = {
    gold: {
        '--primary-color':'#c3b092','--primary-dark':'#a67c52','--primary-light':'#e6dfd3','--light-bg':'#f9f7f4','--text-primary':'#5a4a3e','--text-secondary':'#8a7a6a','--border-color':'#e2d9cf',
        '--emphasis-positive':'#a5662b'
    },
    warm: {
        '--primary-color':'#d87a6e','--primary-dark':'#c45548','--primary-light':'#f3d4cf','--light-bg':'#fff7f6','--text-primary':'#5a3a36','--text-secondary':'#845c56','--border-color':'#f0d0cb',
        '--emphasis-positive':'#c45548'
    },
    indigo: {
        '--primary-color':'#6b83d8','--primary-dark':'#4b61c4','--primary-light':'#d9def6','--light-bg':'#f6f7ff','--text-primary':'#343a5a','--text-secondary':'#5a618a','--border-color':'#d0d4f0',
        '--emphasis-positive':'#4b61c4'
    }
};

function applyTheme(name){
    const theme = themes[name] || themes.gold;
    const root = document.documentElement;
    Object.entries(theme).forEach(([k,v])=> root.style.setProperty(k,v));
    localStorage.setItem('selectedTheme', name);
    // 主题切换后刷新图表配色
    try { updateChartColors(); } catch(e) {}
}

// 全局变量
let currentDataMode = 'mock'; // 'mock' 或 'real'
let currentSheet = null;
let currentYear = new Date().getFullYear();
let currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);
let currentMonth = new Date().getMonth() + 1;
let currentDay = new Date().getDate();

// 数据模式切换
function switchDataMode(mode) {
    currentDataMode = mode;
    const mockBtn = document.getElementById('mockDataBtn');
    const realBtn = document.getElementById('realDataBtn');
    if (mockBtn && realBtn){
        mockBtn.classList.toggle('active', mode === 'mock');
        realBtn.classList.toggle('active', mode === 'real');
        mockBtn.setAttribute('aria-pressed', mode === 'mock');
        realBtn.setAttribute('aria-pressed', mode === 'real');
    }
    if (mode === 'mock') {
        loadMockData();
    } else {
        if (currentSheet) {
            loadRealData();
        } else {
            alert('请先上传Excel文件');
            switchDataMode('mock');
        }
    }
}

// 文件上传处理
function handleFileUpload(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            currentSheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
            document.getElementById('uploadArea').innerHTML = `
                <i class="fas fa-check-circle fa-3x text-success mb-3"></i>
                <h5>文件上传成功</h5>
                <p class="text-muted">已加载 ${currentSheet.length} 行数据</p>
                <button class="btn btn-primary" onclick="document.getElementById('fileInput').click()">重新上传</button>
            `;
            switchDataMode('real');
        } catch (error) {
            alert('文件解析失败: ' + error.message);
        }
    };
    reader.readAsArrayBuffer(file);
}

// 加载真实数据
function loadRealData() {
    if (!currentSheet) return;
    updateMetricsFromRealData();
    updateTableFromRealData();
    updateChartsFromRealData();
}

// 从真实数据更新指标
function updateMetricsFromRealData() {
    if (!currentSheet) return;
    const yearGMV = currentSheet.reduce((sum, row) => sum + (row['年GMV'] || 0), 0);
    const quarterGMV = currentSheet.reduce((sum, row) => sum + (row['季GMV'] || 0), 0);
    const monthGMV = currentSheet.reduce((sum, row) => sum + (row['月GMV'] || 0), 0);
    const dayGMV = currentSheet.reduce((sum, row) => sum + (row['当日GMV'] || 0), 0);
    const metricCards = document.querySelectorAll('.metric-card .metric-value');
    if (metricCards[0]) metricCards[0].textContent = '¥' + formatNumber(dayGMV);
    if (metricCards[1]) metricCards[1].textContent = '¥' + formatNumber(monthGMV);
    if (metricCards[2]) metricCards[2].textContent = '¥' + formatNumber(yearGMV);
}

// 从真实数据更新表格
function updateTableFromRealData() {
    if (!currentSheet) return;
    const tbody = document.querySelector('#home-page .table tbody');
    if (tbody) {
        tbody.innerHTML = '';
        currentSheet.slice(0, 10).forEach((row) => {
            const tr = document.createElement('tr');
            tr.className = 'controller-card';
            tr.onclick = () => showControllerDetail(row['实控人'] || '未知');
            tr.innerHTML = `
                <td>${row['实控人'] || '-'}</td>
                <td><span class="tag tag-high-value">高价值客户</span></td>
                <td>${formatNumber(row['月目标'] || 0)}万</td>
                <td>${formatNumber(row['月GMV'] || 0)}万</td>
                <td class="${(row['月环比'] || 0) >= 0 ? 'positive' : 'negative'}">${(row['月环比'] || 0).toFixed(1)}%</td>
                <td>${formatNumber(row['年GMV'] || 0)}万</td>
                <td>${formatNumber(row['当日GMV'] || 0)}万</td>
                <td class="${(row['日环比'] || 0) >= 0 ? 'positive' : 'negative'}">${(row['日环比'] || 0).toFixed(1)}%</td>
                <td>${(row['达成率'] || 0).toFixed(1)}%</td>
            `;
            tbody.appendChild(tr);
        });
    }
}

// 从真实数据更新图表
function updateChartsFromRealData() {
    if (!currentSheet) return;
}

// 加载模拟数据
function loadMockData() {
    const metricCards = document.querySelectorAll('.metric-card .metric-value');
    if (metricCards[0]) metricCards[0].textContent = '¥1,245,680';
    if (metricCards[1]) metricCards[1].textContent = '¥28,567,320';
    if (metricCards[2]) metricCards[2].textContent = '¥312,458,790';
}

// 格式化数字
function formatNumber(num) {
    return (num || 0).toLocaleString();
}

// 日历相关
let calendarJustOpened = false;
function showYearCalendar() {
    const popup = document.getElementById('calendarPopup');
    const title = document.getElementById('calendarTitle');
    const content = document.getElementById('calendarContent');
    const trigger = document.getElementById('yearIcon');
    title.textContent = '选择年份';
    content.className = 'calendar-grid calendar-year-grid';
    let yearItems = '';
    for (let year = currentYear - 5; year <= currentYear + 5; year++) {
        const isSelected = year === currentYear ? 'selected' : '';
        yearItems += `<div class="calendar-item ${isSelected}" onclick="selectYear(${year})">${year}年</div>`;
    }
    content.innerHTML = yearItems;
    showCalendar(popup, trigger);
}

function showQuarterCalendar() {
    const popup = document.getElementById('calendarPopup');
    const title = document.getElementById('calendarTitle');
    const content = document.getElementById('calendarContent');
    const trigger = document.getElementById('quarterIcon');
    title.textContent = '选择季度';
    content.className = 'calendar-grid calendar-quarter-grid';
    let quarterItems = '';
    for (let q = 1; q <= 4; q++) {
        const isSelected = q === currentQuarter ? 'selected' : '';
        quarterItems += `<div class="calendar-item ${isSelected}" onclick="selectQuarter(${q})">Q${q}</div>`;
    }
    content.innerHTML = quarterItems;
    showCalendar(popup, trigger);
}

function showMonthCalendar() {
    const popup = document.getElementById('calendarPopup');
    const title = document.getElementById('calendarTitle');
    const content = document.getElementById('calendarContent');
    const trigger = document.getElementById('monthIcon');
    title.textContent = '选择月份';
    content.className = 'calendar-grid calendar-month-grid';
    let monthItems = '';
    for (let m = 1; m <= 12; m++) {
        const isSelected = m === currentMonth ? 'selected' : '';
        monthItems += `<div class="calendar-item ${isSelected}" onclick="selectMonth(${m})">${m}月</div>`;
    }
    content.innerHTML = monthItems;
    showCalendar(popup, trigger);
}

function showDayCalendar() {
    const popup = document.getElementById('calendarPopup');
    const title = document.getElementById('calendarTitle');
    const content = document.getElementById('calendarContent');
    const trigger = document.getElementById('dayIcon');
    title.textContent = '选择日期';
    content.className = 'calendar-grid calendar-day-grid';
    let dayItems = '';
    for (let d = 1; d <= 31; d++) {
        const isSelected = d === currentDay ? 'selected' : '';
        dayItems += `<div class="calendar-item ${isSelected}" onclick="selectDay(${d})">${d}日</div>`;
    }
    content.innerHTML = dayItems;
    showCalendar(popup, trigger);
}

function showCalendar(popup, trigger) {
    if (trigger) {
        const triggerRect = trigger.getBoundingClientRect();
        popup.style.display = 'block';
        popup.style.visibility = 'hidden';
        popup.classList.add('show');
        const popupWidth = popup.offsetWidth;
        const left = triggerRect.left + (triggerRect.width / 2) - (popupWidth / 2);
        const top = triggerRect.bottom + 8;
        popup.style.top = top + 'px';
        popup.style.left = left + 'px';
        popup.style.transform = 'none';
    }
    popup.style.visibility = 'visible';
    popup.onclick = function(e){ e.stopPropagation(); };
    calendarJustOpened = true;
    setTimeout(() => { calendarJustOpened = false; }, 50);
    document.removeEventListener('click', closeCalendarOnOutsideClick, true);
    document.addEventListener('click', closeCalendarOnOutsideClick, true);
}

function closeCalendar() {
    const popup = document.getElementById('calendarPopup');
    popup.style.display = 'none';
    popup.classList.remove('show');
    document.removeEventListener('click', closeCalendarOnOutsideClick);
}

function closeCalendarOnOutsideClick(e) {
    if (calendarJustOpened) return;
    const popup = document.getElementById('calendarPopup');
    if (!popup.contains(e.target)) {
        closeCalendar();
    }
}

function selectYear(year) {
    currentYear = year;
    closeCalendar();
    updateCurrentSelectionLabel();
}

function selectQuarter(quarter) {
    currentQuarter = quarter;
    closeCalendar();
    updateCurrentSelectionLabel();
}

function selectMonth(month) {
    currentMonth = month;
    closeCalendar();
    updateCurrentSelectionLabel();
}

function selectDay(day) {
    currentDay = day;
    closeCalendar();
    updateCurrentSelectionLabel();
}

function updateCurrentSelectionLabel(){
    const text = `${currentYear}年 Q${currentQuarter} ${currentMonth}月 ${currentDay}日`;
    const el = document.getElementById('currentSelection');
    if (el) el.textContent = `当前选择：${text}`;
}

// 完整日期输入绑定
document.addEventListener('change', function(e){
    if (e.target && e.target.id === 'fullDateInput'){
        const d = new Date(e.target.value);
        if (!isNaN(d)){
            currentYear = d.getFullYear();
            currentMonth = d.getMonth() + 1;
            currentDay = d.getDate();
            currentQuarter = Math.ceil(currentMonth/3);
            updateCurrentSelectionLabel();
        }
    }
});

// 导出全量底表（可重新导入）
function exportAllToExcel(){
    try{
        const wb = XLSX.utils.book_new();
        const table = document.querySelector('#home-page table');
        if (table){
            const wsDashboard = XLSX.utils.table_to_sheet(table);
            XLSX.utils.book_append_sheet(wb, wsDashboard, '实控人列表');
        }
        const snapshot = [];
        snapshot.push({ 指标: '年GMV', 数值: (document.getElementById('year-gmv')||{}).textContent||'' });
        snapshot.push({ 指标: '季GMV', 数值: (document.getElementById('quarter-gmv')||{}).textContent||'' });
        snapshot.push({ 指标: '月GMV', 数值: (document.getElementById('month-gmv')||{}).textContent||'' });
        snapshot.push({ 指标: '日GMV', 数值: (document.getElementById('day-gmv')||{}).textContent||'' });
        const wsKPI = XLSX.utils.json_to_sheet(snapshot);
        XLSX.utils.book_append_sheet(wb, wsKPI, '指标快照');
        const top5 = [];
        document.querySelectorAll('#top5Ranking .ranking-item').forEach((item, idx)=>{
            const name = item.querySelector('.ranking-name')?.textContent||'';
            const value = item.querySelector('.ranking-value')?.textContent||'';
            top5.push({ 排名: idx+1, 实控人: name, GMV: value });
        });
        if (top5.length){
            const wsTop5 = XLSX.utils.json_to_sheet(top5);
            XLSX.utils.book_append_sheet(wb, wsTop5, 'Top5排行');
        }
        if (typeof controllers !== 'undefined'){
            const controllersArr = Object.entries(controllers).map(([k,v])=>({
                key: k,
                name: v.name, tag: v.tag, tagText: v.tagText,
                dailyGMV: v.dailyGMV, monthlyGMV: v.monthlyGMV, yearlyGMV: v.yearlyGMV,
                yoy: v.yoy, mom: v.mom, targetRate: v.targetRate,
                registerDate: v.registerDate, lastActive: v.lastActive
            }));
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(controllersArr), 'controllers');
        }
        if (typeof shops !== 'undefined'){
            const shopsArr = [];
            Object.entries(shops).forEach(([owner, arr])=>{
                arr.forEach(s=> shopsArr.push({ owner, ...s }));
            });
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(shopsArr), 'shops');
        }
        if (typeof products !== 'undefined'){
            const productsArr = [];
            Object.entries(products).forEach(([shopId, arr])=>{
                arr.forEach(p=> productsArr.push({ shopId, ...p }));
            });
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(productsArr), 'products');
        }
        if (typeof contractData !== 'undefined'){
            Object.entries(contractData).forEach(([type, arr])=>{
                XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(arr), `contract_${type}`);
            });
        }
        if (Array.isArray(currentSheet) && currentSheet.length){
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(currentSheet), '导入底表');
        }
        const meta = [{ year: currentYear, quarter: currentQuarter, month: currentMonth, day: currentDay }];
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(meta), 'meta');
        const filename = `全量导出_${currentYear}Q${currentQuarter}_${currentMonth}月${currentDay}日.xlsx`;
        XLSX.writeFile(wb, filename);
    }catch(err){
        alert('导出失败：' + err.message);
    }
}

// 模拟数据
const controllers = {
    '张明轩': { name: '张明轩', tag: 'tag-high-value', tagText: '高价值客户', dailyGMV: '¥568,920', monthlyGMV: '¥12,458,760', yearlyGMV: '¥145,678,920', yoy: '+15.2%', mom: '+8.7%', targetRate: '92.5%', registerDate: '2019-03-15', lastActive: '2023-10-26' },
    '李思雨': { name: '李思雨', tag: 'tag-vip', tagText: 'VIP客户', dailyGMV: '¥452,310', monthlyGMV: '¥10,245,890', yearlyGMV: '¥124,567,890', yoy: '+12.8%', mom: '+6.3%', targetRate: '88.7%', registerDate: '2020-05-20', lastActive: '2023-10-26' },
    '王建国': { name: '王建国', tag: 'tag-high-value', tagText: '高价值客户', dailyGMV: '¥398,760', monthlyGMV: '¥9,876,540', yearlyGMV: '¥112,345,670', yoy: '+10.5%', mom: '+5.2%', targetRate: '85.3%', registerDate: '2018-11-12', lastActive: '2023-10-25' },
    '赵晓雯': { name: '赵晓雯', tag: 'tag-new', tagText: '新客户', dailyGMV: '¥356,890', monthlyGMV: '¥8,765,430', yearlyGMV: '¥98,765,430', yoy: '+8.7%', mom: '+4.1%', targetRate: '82.1%', registerDate: '2022-02-18', lastActive: '2023-10-26' },
    '刘浩然': { name: '刘浩然', tag: 'tag-vip', tagText: 'VIP客户', dailyGMV: '¥321,450', monthlyGMV: '¥7,654,320', yearlyGMV: '¥87,654,320', yoy: '+7.3%', mom: '+3.5%', targetRate: '79.8%', registerDate: '2019-07-25', lastActive: '2023-10-24' }
};

const shops = {
    '张明轩': [
        { name: '张明轩旗舰店', id: 'ZMX001', channel: '天猫', openTime: '2019-06-10', dailyGMV: '¥245,680', monthlyGMV: '¥5,678,920', yearlyGMV: '¥67,890,450', yoy: '+18.2%', mom: '+9.5%', targetRate: '94.2%' },
        { name: '张明轩京东店', id: 'ZMX002', channel: '京东', openTime: '2019-08-15', dailyGMV: '¥156,790', monthlyGMV: '¥3,456,780', yearlyGMV: '¥42,345,670', yoy: '+12.5%', mom: '+6.8%', targetRate: '88.7%' },
        { name: '张明轩拼多多店', id: 'ZMX003', channel: '拼多多', openTime: '2020-03-20', dailyGMV: '¥98,450', monthlyGMV: '¥2,345,670', yearlyGMV: '¥28,765,430', yoy: '+22.3%', mom: '+12.7%', targetRate: '96.5%' },
        { name: '张明轩抖音店', id: 'ZMX004', channel: '抖音', openTime: '2021-05-12', dailyGMV: '¥68,000', monthlyGMV: '¥1,567,890', yearlyGMV: '¥18,765,430', yoy: '+45.2%', mom: '+28.9%', targetRate: '102.3%' }
    ],
    '李思雨': [
        { name: '李思雨旗舰店', id: 'LSY001', channel: '天猫', openTime: '2020-07-10', dailyGMV: '¥198,760', monthlyGMV: '¥4,567,890', yearlyGMV: '¥54,678,900', yoy: '+15.7%', mom: '+8.3%', targetRate: '91.2%' },
        { name: '李思雨京东店', id: 'LSY002', channel: '京东', openTime: '2020-09-18', dailyGMV: '¥134,560', monthlyGMV: '¥3,098,760', yearlyGMV: '¥37,654,320', yoy: '+10.8%', mom: '+5.4%', targetRate: '86.5%' },
        { name: '李思雨拼多多店', id: 'LSY003', channel: '拼多多', openTime: '2021-02-14', dailyGMV: '¥76,540', monthlyGMV: '¥1,876,540', yearlyGMV: '¥22,345,670', yoy: '+18.9%', mom: '+10.2%', targetRate: '89.7%' },
        { name: '李思雨快手店', id: 'LSY004', channel: '快手', openTime: '2022-01-08', dailyGMV: '¥42,310', monthlyGMV: '¥987,650', yearlyGMV: '¥11,876,540', yoy: '+32.5%', mom: '+18.7%', targetRate: '95.8%' }
    ]
};

const products = {
    'ZMX001': [
        { name: '男士休闲夹克', id: 'MXJ001', listTime: '2023-03-15', dailySales: 156, dailyGMV: '¥45,680', monthlySales: 3456, monthlyGMV: '¥1,023,450', stock: 2345, status: '在售' },
        { name: '男士商务衬衫', id: 'MSC002', listTime: '2023-02-10', dailySales: 203, dailyGMV: '¥38,760', monthlySales: 4567, monthlyGMV: '¥876,540', stock: 1876, status: '在售' },
        { name: '男士休闲裤', id: 'MXK003', listTime: '2023-04-22', dailySales: 178, dailyGMV: '¥32,450', monthlySales: 3987, monthlyGMV: '¥723,450', stock: 2156, status: '在售' },
        { name: '男士运动鞋', id: 'MXS004', listTime: '2023-01-05', dailySales: 134, dailyGMV: '¥56,780', monthlySales: 2876, monthlyGMV: '¥1,234,560', stock: 1567, status: '在售' },
        { name: '男士羽绒服', id: 'MYR005', listTime: '2022-11-20', dailySales: 89, dailyGMV: '¥71,230', monthlySales: 1876, monthlyGMV: '¥1,567,890', stock: 987, status: '在售' }
    ],
    'ZMX002': [
        { name: '男士POLO衫', id: 'MPS001', listTime: '2023-05-10', dailySales: 145, dailyGMV: '¥23,450', monthlySales: 3123, monthlyGMV: '¥498,760', stock: 1876, status: '在售' },
        { name: '男士牛仔裤', id: 'MNZ002', listTime: '2023-03-28', dailySales: 167, dailyGMV: '¥34,560', monthlySales: 3567, monthlyGMV: '¥723,450', stock: 2345, status: '在售' },
        { name: '男士皮鞋', id: 'MPX003', listTime: '2023-02-15', dailySales: 98, dailyGMV: '¥45,670', monthlySales: 2134, monthlyGMV: '¥987,650', stock: 1234, status: '在售' },
        { name: '男士卫衣', id: 'MWY004', listTime: '2023-04-05', dailySales: 156, dailyGMV: '¥28,760', monthlySales: 3345, monthlyGMV: '¥612,340', stock: 1876, status: '在售' }
    ]
};

const contractData = {
    'dealer': [
        { name: '张明轩旗舰店', id: 'ZMX001', channel: '天猫', openTime: '2019-06-10', dailyGMV: '¥245,680', yoy: '+18.2%', mom: '+9.5%', targetRate: '94.2%' },
        { name: '张明轩京东店', id: 'ZMX002', channel: '京东', openTime: '2019-08-15', dailyGMV: '¥156,790', yoy: '+12.5%', mom: '+6.8%', targetRate: '88.7%' },
        { name: '张明轩拼多多店', id: 'ZMX003', channel: '拼多多', openTime: '2020-03-20', dailyGMV: '¥98,450', yoy: '+22.3%', mom: '+12.7%', targetRate: '96.5%' }
    ],
    'supplier': [
        { name: '杭州服装供应商', id: 'GYS001', channel: '直供', openTime: '2018-12-05', dailyGMV: '¥0', yoy: '+0%', mom: '+0%', targetRate: '100%' },
        { name: '浙江面料合作商', id: 'GYS002', channel: '合作', openTime: '2019-03-18', dailyGMV: '¥0', yoy: '+0%', mom: '+0%', targetRate: '100%' }
    ],
    'other': [
        { name: '张明轩抖音店', id: 'ZMX004', channel: '抖音', openTime: '2021-05-12', dailyGMV: '¥68,000', yoy: '+45.2%', mom: '+28.9%', targetRate: '102.3%' },
        { name: '张明轩快手店', id: 'ZMX005', channel: '快手', openTime: '2022-02-28', dailyGMV: '¥32,450', yoy: '+38.7%', mom: '+22.5%', targetRate: '98.7%' },
        { name: '张明轩小红书店', id: 'ZMX006', channel: '小红书', openTime: '2022-08-15', dailyGMV: '¥18,760', yoy: '+52.3%', mom: '+34.8%', targetRate: '105.6%' },
        { name: '张明轩微博店', id: 'ZMX007', channel: '微博', openTime: '2023-01-10', dailyGMV: '¥12,340', yoy: '+67.8%', mom: '+45.2%', targetRate: '112.3%' },
        { name: '张明轩B站店', id: 'ZMX008', channel: 'B站', openTime: '2023-04-20', dailyGMV: '¥8,760', yoy: '+78.9%', mom: '+56.7%', targetRate: '118.9%' }
    ]
};

// 页面切换
function showPage(page) {
    document.getElementById('home-page').style.display = page === 'home' ? 'block' : 'none';
    document.getElementById('controller-page').style.display = page === 'controller' ? 'block' : 'none';
    document.getElementById('shop-page').style.display = page === 'shop' ? 'block' : 'none';
}

// 实控人详情
let currentController = '张明轩';
function showControllerDetail(controllerName) {
    currentController = controllerName;
    const controller = controllers[controllerName];
    document.getElementById('controller-name').innerHTML = `${controller.name} <span class="tag ${controller.tag}">${controller.tagText}</span>`;
    document.getElementById('controller-breadcrumb').textContent = `${controller.name} - 实控人详情`;
    const backCtrlIcon = document.querySelector('#controller-page .breadcrumb .back-link');
    if (backCtrlIcon) backCtrlIcon.setAttribute('onclick', `showPage('home')`);
    document.getElementById('basic-name').textContent = controller.name;
    document.querySelectorAll('#controller-page .metric-card .metric-value')[0].textContent = controller.dailyGMV;
    document.querySelectorAll('#controller-page .metric-card .metric-value')[1].textContent = controller.monthlyGMV;
    document.querySelectorAll('#controller-page .metric-card .metric-value')[2].textContent = controller.yearlyGMV;
    document.querySelectorAll('#controller-page .metric-card .metric-value')[3].textContent = controller.targetRate;
    document.querySelector('#controller-page .progress-bar').style.width = controller.targetRate;
    loadGMVData(controllerName);
    showContract('dealer');
    showPage('controller');
}

function loadGMVData(controllerName) {
    const tableBody = document.getElementById('gmv-table-body');
    tableBody.innerHTML = '';
    if (shops[controllerName]) {
        shops[controllerName].forEach(shop => {
            const row = document.createElement('tr');
            row.className = 'shop-card';
            row.onclick = () => showShopDetail(shop.id, controllerName);
            row.innerHTML = `
                <td>${shop.name}</td>
                <td>${shop.id}</td>
                <td>${shop.channel}</td>
                <td>${shop.openTime}</td>
                <td>${shop.dailyGMV}</td>
                <td>${shop.monthlyGMV}</td>
                <td>${shop.yearlyGMV}</td>
                <td class="positive">${shop.yoy}</td>
                <td class="positive">${shop.mom}</td>
                <td>
                    <div>${shop.targetRate}</div>
                    <div class="progress">
                        <div class="progress-bar bg-success" role="progressbar" style="width: ${shop.targetRate}" aria-valuenow="${parseFloat(shop.targetRate)}" aria-valuemin="0" aria-valuemax="100"></div>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }
}

function showContract(type) {
    const contractTitle = document.getElementById('contract-title');
    const tableBody = document.getElementById('contract-table-body');
    tableBody.innerHTML = '';
    let title = '';
    let data = [];
    switch(type) {
        case 'dealer':
            title = '经销商合同详情';
            data = contractData.dealer; break;
        case 'supplier':
            title = '供应商合同详情';
            data = contractData.supplier; break;
        case 'other':
            title = '其他合同详情';
            data = contractData.other; break;
    }
    contractTitle.textContent = title;
    data.forEach(shop => {
        const row = document.createElement('tr');
        row.className = 'shop-card';
        row.onclick = () => showShopDetail(shop.id, currentController);
        row.innerHTML = `
            <td>${shop.name}</td>
            <td>${shop.id}</td>
            <td>${shop.channel}</td>
            <td>${shop.openTime}</td>
            <td>${shop.dailyGMV}</td>
            <td class="positive">${shop.yoy}</td>
            <td class="positive">${shop.mom}</td>
            <td>
                <div>${shop.targetRate}</div>
                <div class="progress">
                    <div class="progress-bar bg-success" role="progressbar" style="width: ${shop.targetRate}" aria-valuenow="${parseFloat(shop.targetRate)}" aria-valuemin="0" aria-valuemax="100"></div>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function showShopDetail(shopId, controllerName) {
    let shopInfo = null;
    if (shops[controllerName]) {
        shopInfo = shops[controllerName].find(shop => shop.id === shopId);
    }
    if (shopInfo) {
        document.getElementById('shop-name').textContent = shopInfo.name;
        document.getElementById('shop-id').textContent = shopInfo.id;
        document.getElementById('shop-open-time').textContent = shopInfo.openTime;
        document.getElementById('shop-channel').textContent = shopInfo.channel;
        document.getElementById('shop-breadcrumb').textContent = `${shopInfo.name} - 店铺详情`;
        document.getElementById('back-to-controller').setAttribute('onclick', `showControllerDetail('${controllerName}')`);
        const backIcon = document.getElementById('back-to-controller-icon');
        if (backIcon) backIcon.setAttribute('onclick', `showControllerDetail('${controllerName}')`);
        document.querySelectorAll('#shop-page .metric-card .metric-value')[0].textContent = shopInfo.dailyGMV;
        document.querySelectorAll('#shop-page .metric-card .metric-value')[1].textContent = shopInfo.monthlyGMV;
        document.querySelectorAll('#shop-page .metric-card .metric-value')[2].textContent = shopInfo.yearlyGMV;
        document.querySelectorAll('#shop-page .metric-card .metric-value')[3].textContent = shopInfo.targetRate;
        document.querySelector('#shop-page .progress-bar').style.width = shopInfo.targetRate;
        loadProductData(shopId);
        showPage('shop');
    }
}

function loadProductData(shopId) {
    const tableBody = document.getElementById('product-table-body');
    tableBody.innerHTML = '';
    if (products[shopId]) {
        products[shopId].forEach(product => {
            const row = document.createElement('tr');
            row.className = 'product-card';
            row.innerHTML = `
                <td>${product.name}</td>
                <td>${product.id}</td>
                <td>${product.listTime}</td>
                <td>${product.dailySales}</td>
                <td>${product.dailyGMV}</td>
                <td>${product.monthlySales}</td>
                <td>${product.monthlyGMV}</td>
                <td>${product.stock}</td>
                <td><span class="tag tag-high-value">${product.status}</span></td>
            `;
            tableBody.appendChild(row);
        });
    }
}

// 图表
let channelChartInstance = null;
let industryChartInstance = null;

function hexToRgb(hex){
    const h = hex.replace('#','');
    const bigint = parseInt(h.length===3 ? h.split('').map(c=>c+c).join('') : h, 16);
    return { r: (bigint>>16)&255, g: (bigint>>8)&255, b: bigint&255 };
}
function rgbToHsl(r,g,b){
    r/=255; g/=255; b/=255;
    const max=Math.max(r,g,b), min=Math.min(r,g,b);
    let h,s; const l=(max+min)/2;
    if(max===min){ h=s=0; } else {
        const d=max-min;
        s=l>0.5? d/(2-max-min): d/(max+min);
        switch(max){
            case r: h=(g-b)/d+(g<b?6:0); break;
            case g: h=(b-r)/d+2; break;
            case b: h=(r-g)/d+4; break;
        }
        h/=6;
    }
    return { h: h*360, s: s*100, l: l*100 };
}
function hslToHex(h,s,l){
    h/=360; s/=100; l/=100;
    const hue2rgb=(p,q,t)=>{ if(t<0)t+=1; if(t>1)t-=1; if(t<1/6)return p+(q-p)*6*t; if(t<1/2)return q; if(t<2/3)return p+(q-p)*(2/3-t)*6; return p; };
    const q=l<0.5? l*(1+s): l+s-l*s; const p=2*l-q;
    const r=hue2rgb(p,q,h+1/3), g=hue2rgb(p,q,h), b=hue2rgb(p,q,h-1/3);
    const toHex=x=>{ const v=Math.round(x*255).toString(16).padStart(2,'0'); return v; };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
function clamp(v,min,max){ return Math.max(min, Math.min(max, v)); }

function getThemePalette(){
    const pc = getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim();
    const pd = getComputedStyle(document.documentElement).getPropertyValue('--primary-dark').trim();
    const {h,s,l} = rgbToHsl(...Object.values(hexToRgb(pc)));
    const h1 = (h+360-18)%360, h2 = (h+18)%360;
    const palette = [
        hslToHex(h, clamp(s,30,85), clamp(l-10,25,60)),
        hslToHex(h, clamp(s,30,85), clamp(l,30,70)),
        hslToHex(h, clamp(s-10,20,75), clamp(l+12,35,80)),
        hslToHex(h1, clamp(s,30,85), clamp(l-2,28,65)),
        hslToHex(h2, clamp(s,30,85), clamp(l+4,32,72)),
        hslToHex(h2, clamp(s-5,25,70), clamp(l-14,25,60))
    ];
    const contrastA = pd;
    const contrastB = '#8e9aa3';
    return { palette, contrastA, contrastB };
}

function initCharts() {
    const { palette, contrastA, contrastB } = getThemePalette();
    const channelCtx = document.getElementById('channelChart').getContext('2d');
    channelChartInstance = new Chart(channelCtx, {
        type: 'doughnut',
        data: { labels: ['天猫', '京东', '拼多多', '抖音', '快手', '其他'], datasets: [{ data: [35,25,15,12,8,5], backgroundColor: palette, borderWidth: 1 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }
    });
    const industryCtx = document.getElementById('industryChart').getContext('2d');
    industryChartInstance = new Chart(industryCtx, {
        type: 'bar',
        data: {
            labels: ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月'],
            datasets: [
                { label: '实控人GMV', data: [10500000,11200000,10800000,12500000,13200000,12800000,14200000,13800000,14500000,15600000], backgroundColor: contrastA, borderColor: contrastA, borderWidth: 1 },
                { label: '行业平均GMV', data: [9800000,10100000,9950000,10800000,11200000,11000000,11800000,11500000,12200000,12800000], backgroundColor: contrastB, borderColor: contrastB, borderWidth: 1 }
            ]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { callback: (value)=> '¥' + (value/10000) + '万' } } } }
    });
    const productTrendCtx = document.getElementById('productTrendChart').getContext('2d');
    new Chart(productTrendCtx, {
        type: 'line',
        data: {
            labels: ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月'],
            datasets: [
                { label: '男士休闲夹克', data: [45000,52000,48000,61000,65000,58000,72000,68000,75000,82000], borderColor: '#3498db', backgroundColor: 'rgba(52, 152, 219, 0.1)', borderWidth: 2, tension: 0.3 },
                { label: '男士商务衬衫', data: [38000,42000,39000,48000,52000,45000,56000,53000,59000,64000], borderColor: '#2ecc71', backgroundColor: 'rgba(46, 204, 113, 0.1)', borderWidth: 2, tension: 0.3 },
                { label: '男士休闲裤', data: [32000,35000,33000,41000,44000,38000,47000,45000,49000,53000], borderColor: '#e74c3c', backgroundColor: 'rgba(231, 76, 60, 0.1)', borderWidth: 2, tension: 0.3 }
            ]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { callback: (value)=> '¥' + (value/1000) + '千' } } } }
    });
}

function updateChartColors(){
    const { palette, contrastA, contrastB } = getThemePalette();
    if (channelChartInstance){
        channelChartInstance.data.datasets[0].backgroundColor = palette;
        channelChartInstance.update();
    }
    if (industryChartInstance){
        industryChartInstance.data.datasets[0].backgroundColor = contrastA;
        industryChartInstance.data.datasets[0].borderColor = contrastA;
        industryChartInstance.data.datasets[1].backgroundColor = contrastB;
        industryChartInstance.data.datasets[1].borderColor = contrastB;
        industryChartInstance.update();
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    applyTheme(localStorage.getItem('selectedTheme') || 'gold');
    (window.requestIdleCallback || window.requestAnimationFrame)(function(){
        try { initCharts(); } catch(e) { console.warn(e); }
    });
    updateCurrentSelectionLabel();
    const fileInput = document.getElementById('fileInput');
    if (fileInput){
        fileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) handleFileUpload(file);
        });
    }
    const uploadArea = document.getElementById('uploadArea');
    if (uploadArea){
        uploadArea.addEventListener('dragover', function(e) { e.preventDefault(); uploadArea.classList.add('dragover'); });
        uploadArea.addEventListener('dragleave', function(e) { e.preventDefault(); uploadArea.classList.remove('dragover'); });
        uploadArea.addEventListener('drop', function(e) {
            e.preventDefault(); uploadArea.classList.remove('dragover');
            const file = e.dataTransfer.files[0];
            if (file) handleFileUpload(file);
        });
    }
    showContract('dealer');
    const backLink = document.getElementById('back-to-controller');
    if (backLink){
        backLink.addEventListener('click', function() { showControllerDetail(currentController); });
    }
    const channelFilter = document.getElementById('channel-filter');
    if (channelFilter){
        channelFilter.addEventListener('change', function() { console.log('渠道筛选:', this.value); });
    }
});


