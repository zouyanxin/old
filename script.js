// =====================================================
// 学术研究展厅 - 图表与交互
// 风格：淡色2D平面 / 直接标注 / 微动效
// =====================================================

const COLORS = {
    primary: '#1E3A5F',
    primaryLight: '#3B5A80',
    primaryFade: '#6B7F99',
    secondary: '#2A9D8F',
    secondaryLight: '#7FBFB7',
    secondaryFade: '#A8D0CB',
    alert: '#E76F51',
    alertLight: '#F4A48F',
    text: '#1F2937',
    textMuted: '#6B7280',
    textLight: '#9CA3AF',
    border: '#E5E7EB',
    grid: '#F0F0EC',
    bg: '#FBFBF9'
};

const FONT = '-apple-system, BlinkMacSystemFont, "Source Han Sans CN", "PingFang SC", "Microsoft YaHei", sans-serif';

const baseAxisLine = { lineStyle: { color: COLORS.border, width: 1 } };
const baseAxisLabel = { color: COLORS.textMuted, fontSize: 12, fontFamily: FONT };
const baseSplitLine = { lineStyle: { color: COLORS.grid, type: 'solid' } };
const baseTooltip = {
    backgroundColor: '#FFFFFF',
    borderColor: COLORS.border,
    borderWidth: 1,
    textStyle: { color: COLORS.text, fontSize: 12, fontFamily: FONT },
    extraCssText: 'box-shadow: 0 2px 8px rgba(0,0,0,0.08);'
};

window._charts = {};

document.addEventListener('DOMContentLoaded', function() {
    initChinaMap();
    initForestChart();
    initKeyORChart();
    initBootstrapChart();
    initHeatmapChart();
    initFairlieChart();
    initTrendsChart();
    initMicrosimChart();
    initAUCChart();
    initCBRChart();
    initScrollCounter();
    initSmoothScroll();

    window.addEventListener('resize', () => {
        Object.values(window._charts).forEach(c => c && c.resize());
    });
});

function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener('click', function(e) {
            e.preventDefault();
            const t = document.querySelector(this.getAttribute('href'));
            if (t) {
                window.scrollTo({ top: t.getBoundingClientRect().top + window.pageYOffset - 70, behavior: 'smooth' });
            }
        });
    });
}

function initScrollCounter() {
    const els = document.querySelectorAll('.data-value[data-count]');
    if (!('IntersectionObserver' in window)) {
        els.forEach(el => el.textContent = formatNum(parseInt(el.getAttribute('data-count'))));
        return;
    }
    const obs = new IntersectionObserver((entries) => {
        entries.forEach(e => {
            if (e.isIntersecting) { animateCount(e.target); obs.unobserve(e.target); }
        });
    }, { threshold: 0.5 });
    els.forEach(el => { el.textContent = '0'; obs.observe(el); });
}

function animateCount(el) {
    const target = parseInt(el.getAttribute('data-count'));
    const dur = 1200, start = performance.now();
    function step(now) {
        const p = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = formatNum(Math.floor(target * eased));
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = formatNum(target);
    }
    requestAnimationFrame(step);
}

function formatNum(n) {
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
// =====================================================
// FIGURE 1: 风险因素森林图
// =====================================================
function initForestChart() {
    const el = document.getElementById('forestChart');
    if (!el) return;
    const chart = echarts.init(el, null, { renderer: 'svg' });
    window._charts.forest = chart;

    // 2018-2020 期数据（v2版本），按OR值排序
    const data = [
        { name: '抑郁', or: 1.638, lo: 1.435, hi: 1.869, sig: '***' },
        { name: '农村', or: 1.378, lo: 1.211, hi: 1.569, sig: '***' },
        { name: '慢性病数量', or: 1.245, lo: 1.203, hi: 1.289, sig: '***' },
        { name: '年龄', or: 1.029, lo: 1.014, hi: 1.044, sig: '***' },
        { name: '认知评分', or: 0.964, lo: 0.952, hi: 0.977, sig: '***' },
        { name: '家庭收入(对数)', or: 0.929, lo: 0.892, hi: 0.968, sig: '***' },
        { name: '女性', or: 0.550, lo: 0.455, hi: 0.664, sig: '***' }
    ];

    // 反转便于上方显示风险因素
    data.reverse();

    const labels = data.map(d => d.name + (d.sig ? ' ' + d.sig : ''));
    const orData = data.map(d => d.or);
    const errData = data.map(d => [d.lo, d.hi]);

    chart.setOption({
        textStyle: { fontFamily: FONT, color: COLORS.text },
        animation: false,
        grid: { left: 130, right: 80, top: 30, bottom: 50 },
        tooltip: {
            ...baseTooltip,
            trigger: 'item',
            formatter: function(p) {
                const d = data[p.dataIndex];
                if (!d) return '';
                return '<strong>' + d.name + '</strong><br/>OR = ' + d.or.toFixed(3) +
                       '<br/>95% CI: [' + d.lo.toFixed(3) + ', ' + d.hi.toFixed(3) + ']' +
                       (d.sig ? '<br/>显著性：' + d.sig : '');
            }
        },
        xAxis: {
            type: 'value',
            name: 'OR 值（对数刻度）',
            nameLocation: 'middle',
            nameGap: 30,
            nameTextStyle: { color: COLORS.textMuted, fontSize: 12 },
            min: 0.5,
            max: 2.5,
            axisLine: baseAxisLine,
            axisTick: { show: false },
            axisLabel: baseAxisLabel,
            splitLine: baseSplitLine
        },
        yAxis: {
            type: 'category',
            data: labels,
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { ...baseAxisLabel, fontSize: 12 }
        },
        series: [
            {
                type: 'custom',
                renderItem: function(params, api) {
                    const idx = api.value(0);
                    const d = data[idx];
                    const yCoord = api.coord([d.or, idx])[1];
                    const xLo = api.coord([d.lo, idx])[0];
                    const xHi = api.coord([d.hi, idx])[0];
                    const xMid = api.coord([d.or, idx])[0];
                    const isProtective = d.hi < 1;
                    const isRisk = d.lo > 1;
                    const color = isRisk ? COLORS.alert : (isProtective ? COLORS.secondary : COLORS.textMuted);
                    return {
                        type: 'group',
                        children: [
                            {
                                type: 'line',
                                shape: { x1: xLo, y1: yCoord, x2: xHi, y2: yCoord },
                                style: { stroke: color, lineWidth: 1.5 }
                            },
                            {
                                type: 'line',
                                shape: { x1: xLo, y1: yCoord - 4, x2: xLo, y2: yCoord + 4 },
                                style: { stroke: color, lineWidth: 1.5 }
                            },
                            {
                                type: 'line',
                                shape: { x1: xHi, y1: yCoord - 4, x2: xHi, y2: yCoord + 4 },
                                style: { stroke: color, lineWidth: 1.5 }
                            },
                            {
                                type: 'circle',
                                shape: { cx: xMid, cy: yCoord, r: 5 },
                                style: { fill: color, stroke: '#fff', lineWidth: 1.5 }
                            },
                            {
                                type: 'text',
                                style: {
                                    text: d.or.toFixed(2),
                                    x: api.coord([2.5, idx])[0] + 8,
                                    y: yCoord,
                                    fill: COLORS.text,
                                    fontSize: 11,
                                    textVerticalAlign: 'middle',
                                    fontFamily: FONT
                                }
                            }
                        ]
                    };
                },
                data: data.map((d, i) => [i, d.or])
            },
            {
                type: 'line',
                markLine: {
                    silent: true,
                    symbol: 'none',
                    data: [{ xAxis: 1, lineStyle: { color: COLORS.textMuted, type: 'dashed', width: 1 } }],
                    label: { show: false }
                },
                data: []
            }
        ]
    });
}

// =====================================================
// FIGURE 2: 关键OR三期对比（分组柱状图）
// =====================================================
function initKeyORChart() {
    const el = document.getElementById('keyORChart');
    if (!el) return;
    const chart = echarts.init(el, null, { renderer: 'svg' });
    window._charts.keyOR = chart;

    chart.setOption({
        textStyle: { fontFamily: FONT, color: COLORS.text },
        animation: false,
        legend: {
            data: ['抑郁', '慢性病数量', '农村'],
            top: 0,
            textStyle: { color: COLORS.textMuted, fontSize: 12 },
            itemWidth: 14, itemHeight: 8, itemGap: 18
        },
        grid: { left: 50, right: 30, top: 50, bottom: 40, containLabel: true },
        tooltip: { ...baseTooltip, trigger: 'axis' },
        xAxis: {
            type: 'category',
            data: ['2013-2015', '2015-2018', '2018-2020'],
            axisLine: baseAxisLine,
            axisTick: { show: false },
            axisLabel: baseAxisLabel
        },
        yAxis: {
            type: 'value',
            name: 'OR 值',
            nameTextStyle: { color: COLORS.textMuted, fontSize: 12, padding: [0, 0, 8, -25] },
            min: 0,
            max: 3.0,
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: baseAxisLabel,
            splitLine: baseSplitLine
        },
        series: [
            {
                name: '抑郁',
                type: 'bar',
                data: [
                    { value: 1.772, label: { formatter: '1.77***' } },
                    { value: 1.579, label: { formatter: '1.58***' } },
                    { value: 1.638, label: { formatter: '1.64***' } }
                ],
                itemStyle: { color: COLORS.primary },
                barWidth: 22,
                label: { show: true, position: 'top', color: COLORS.primary, fontSize: 11, fontWeight: 600 }
            },
            {
                name: '慢性病数量',
                type: 'bar',
                data: [
                    { value: 1.333, label: { formatter: '1.33***' } },
                    { value: 1.226, label: { formatter: '1.23***' } },
                    { value: 1.245, label: { formatter: '1.25***' } }
                ],
                itemStyle: { color: COLORS.secondary },
                barWidth: 22,
                label: { show: true, position: 'top', color: COLORS.secondary, fontSize: 11, fontWeight: 600 }
            },
            {
                name: '农村',
                type: 'bar',
                data: [
                    { value: 1.429, label: { formatter: '1.43***' } },
                    { value: 1.260, label: { formatter: '1.26**' } },
                    { value: 1.378, label: { formatter: '1.38***' } }
                ],
                itemStyle: { color: COLORS.alert },
                barWidth: 22,
                label: { show: true, position: 'top', color: COLORS.alert, fontSize: 11, fontWeight: 600 }
            }
        ]
    });
}

// =====================================================
// FIGURE 3: Bootstrap 不确定性区间
// =====================================================
function initBootstrapChart() {
    const el = document.getElementById('bootstrapChart');
    if (!el) return;
    const chart = echarts.init(el, null, { renderer: 'svg' });
    window._charts.bootstrap = chart;

    // 数据：变量 × 三期 [均值, 2.5%, 97.5%]
    const groups = ['抑郁', '慢性病数量', '农村'];
    const periods = ['2013-2015', '2015-2018', '2018-2020'];
    const data = {
        '抑郁': [
            { mean: 2.747, lo: 1.797, hi: 4.001 },
            { mean: 1.568, lo: 1.029, hi: 2.228 },
            { mean: 1.816, lo: 1.524, hi: 2.166 }
        ],
        '慢性病数量': [
            { mean: 1.380, lo: 1.195, hi: 1.589 },
            { mean: 1.310, lo: 1.187, hi: 1.449 },
            { mean: 1.311, lo: 1.252, hi: 1.368 }
        ],
        '农村': [
            { mean: 1.228, lo: 0.763, hi: 1.862 },
            { mean: 1.339, lo: 0.873, hi: 1.964 },
            { mean: 1.428, lo: 1.188, hi: 1.756 }
        ]
    };

    // 构建y类目：3变量 × 3期
    const labels = [];
    const series = [];
    groups.forEach(g => {
        periods.forEach(p => labels.push(g + ' · ' + p));
    });

    chart.setOption({
        textStyle: { fontFamily: FONT, color: COLORS.text },
        animation: false,
        grid: { left: 130, right: 30, top: 30, bottom: 50 },
        tooltip: {
            ...baseTooltip,
            trigger: 'item',
            formatter: function(p) {
                if (!p.data) return '';
                const [g, period] = p.name.split(' · ');
                const d = data[g][periods.indexOf(period)];
                return '<strong>' + p.name + '</strong><br/>均值：' + d.mean.toFixed(3) +
                       '<br/>95% CI: [' + d.lo.toFixed(3) + ', ' + d.hi.toFixed(3) + ']';
            }
        },
        xAxis: {
            type: 'value',
            name: 'OR 值',
            nameLocation: 'middle',
            nameGap: 30,
            nameTextStyle: { color: COLORS.textMuted, fontSize: 12 },
            min: 0.5,
            max: 4.5,
            axisLine: baseAxisLine,
            axisTick: { show: false },
            axisLabel: baseAxisLabel,
            splitLine: baseSplitLine
        },
        yAxis: {
            type: 'category',
            data: labels,
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { ...baseAxisLabel, fontSize: 11 }
        },
        series: [{
            type: 'custom',
            renderItem: function(params, api) {
                const idx = api.value(0);
                const label = labels[idx];
                const [g, period] = label.split(' · ');
                const d = data[g][periods.indexOf(period)];
                const yCoord = api.coord([d.mean, idx])[1];
                const xLo = api.coord([d.lo, idx])[0];
                const xHi = api.coord([d.hi, idx])[0];
                const xMid = api.coord([d.mean, idx])[0];
                const colorMap = { '抑郁': COLORS.primary, '慢性病数量': COLORS.secondary, '农村': COLORS.alert };
                const color = colorMap[g];
                return {
                    type: 'group',
                    children: [
                        {
                            type: 'rect',
                            shape: { x: xLo, y: yCoord - 6, width: xHi - xLo, height: 12 },
                            style: { fill: color, opacity: 0.18 }
                        },
                        {
                            type: 'line',
                            shape: { x1: xLo, y1: yCoord, x2: xHi, y2: yCoord },
                            style: { stroke: color, lineWidth: 1.5 }
                        },
                        {
                            type: 'circle',
                            shape: { cx: xMid, cy: yCoord, r: 5 },
                            style: { fill: color, stroke: '#fff', lineWidth: 1.5 }
                        }
                    ]
                };
            },
            data: labels.map((_, i) => [i, 1])
        }, {
            type: 'line',
            markLine: {
                silent: true,
                symbol: 'none',
                data: [{ xAxis: 1, lineStyle: { color: COLORS.textMuted, type: 'dashed', width: 1 } }],
                label: { show: false }
            },
            data: []
        }]
    });
}

// =====================================================
// FIGURE 4: 失能转移热力图（2018-2020期）
// =====================================================
function initHeatmapChart() {
    const el = document.getElementById('heatmapChart');
    if (!el) return;
    const chart = echarts.init(el, null, { renderer: 'svg' });
    window._charts.heatmap = chart;

    // 行：人群类型；列：年龄段；值：失能率%（v2数据，2018-2020期）
    const groups = ['城市·非抑郁', '城市·抑郁', '农村·非抑郁', '农村·抑郁'];
    const ages = ['60-69 岁', '70-79 岁', '80 岁+'];
    // 2018-2020 v2数据
    const heatData = [
        // [colIdx, rowIdx, value]
        [0, 0, 15.6],  [1, 0, 25.7], [2, 0, 44.9],
        [0, 1, 36.0], [1, 1, 43.0], [2, 1, 42.3],
        [0, 2, 22.9], [1, 2, 35.9], [2, 2, 51.4],
        [0, 3, 36.2], [1, 3, 46.9], [2, 3, 79.3]
    ];

    chart.setOption({
        textStyle: { fontFamily: FONT, color: COLORS.text },
        animation: false,
        tooltip: {
            ...baseTooltip,
            position: 'top',
            formatter: function(p) {
                return '<strong>' + groups[p.value[1]] + ' · ' + ages[p.value[0]] + '</strong>' +
                       '<br/>2年失能率：' + p.value[2] + '%';
            }
        },
        grid: { left: 110, right: 30, top: 30, bottom: 60 },
        xAxis: {
            type: 'category',
            data: ages,
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { ...baseAxisLabel, fontSize: 12 },
            splitArea: { show: false }
        },
        yAxis: {
            type: 'category',
            data: groups,
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { ...baseAxisLabel, fontSize: 12 }
        },
        visualMap: {
            min: 5,
            max: 55,
            show: true,
            orient: 'horizontal',
            left: 'center',
            bottom: 0,
            itemWidth: 14,
            itemHeight: 130,
            text: ['高', '低'],
            textStyle: { color: COLORS.textMuted, fontSize: 11 },
            inRange: {
                color: ['#EAF1F5', '#A8C0D0', '#5A7A95', '#2A4A6B', '#E76F51']
            },
            calculable: false
        },
        series: [{
            type: 'heatmap',
            data: heatData,
            label: {
                show: true,
                color: '#1F2937',
                fontSize: 13,
                fontWeight: 600,
                fontFamily: FONT,
                formatter: function(p) { return p.value[2] + '%'; }
            },
            itemStyle: {
                borderColor: '#FFFFFF',
                borderWidth: 2
            },
            emphasis: {
                itemStyle: { shadowBlur: 0, borderColor: COLORS.primary, borderWidth: 2 }
            }
        }]
    });
}

// =====================================================
// FIGURE 5: Fairlie 分解
// =====================================================
function initFairlieChart() {
    const el = document.getElementById('fairlieChart');
    if (!el) return;
    const chart = echarts.init(el, null, { renderer: 'svg' });
    window._charts.fairlie = chart;

    // 选取主要变量在三期的贡献度（%）（v2数据）
    const vars = ['家庭收入(对数)', '认知能力', '低教育', '抑郁', '慢性病数量'];
    const series2013 = [1.1, 18.1, 7.0, 9.2, -13.4];
    const series2015 = [3.2, 27.3, 11.0, 8.0, -12.9];
    const series2018 = [11.2, 13.7, 5.2, 7.2, -9.5];

    chart.setOption({
        textStyle: { fontFamily: FONT, color: COLORS.text },
        animation: false,
        legend: {
            data: ['2013-2015', '2015-2018', '2018-2020'],
            top: 0,
            textStyle: { color: COLORS.textMuted, fontSize: 12 },
            itemWidth: 14, itemHeight: 8, itemGap: 18
        },
        grid: { left: 110, right: 30, top: 50, bottom: 40, containLabel: true },
        tooltip: {
            ...baseTooltip,
            trigger: 'axis',
            axisPointer: { type: 'shadow' }
        },
        xAxis: {
            type: 'value',
            name: '贡献百分比 (%)',
            nameLocation: 'middle',
            nameGap: 30,
            nameTextStyle: { color: COLORS.textMuted, fontSize: 12 },
            axisLine: baseAxisLine,
            axisTick: { show: false },
            axisLabel: { ...baseAxisLabel, formatter: '{value}%' },
            splitLine: baseSplitLine
        },
        yAxis: {
            type: 'category',
            data: vars,
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { ...baseAxisLabel, fontSize: 12 }
        },
        series: [
            {
                name: '2013-2015',
                type: 'bar',
                data: series2013,
                itemStyle: { color: COLORS.primaryFade },
                barWidth: 8
            },
            {
                name: '2015-2018',
                type: 'bar',
                data: series2015,
                itemStyle: { color: COLORS.secondary },
                barWidth: 8
            },
            {
                name: '2018-2020',
                type: 'bar',
                data: series2018,
                itemStyle: { color: COLORS.primary },
                barWidth: 8
            }
        ]
    });
}

// =====================================================
// FIGURE 6: 跨期趋势综合图（双轴折线）
// =====================================================
function initTrendsChart() {
    const el = document.getElementById('trendsChart');
    if (!el) return;
    const chart = echarts.init(el, null, { renderer: 'svg' });
    window._charts.trends = chart;

    chart.setOption({
        textStyle: { fontFamily: FONT, color: COLORS.text },
        animation: false,
        legend: {
            data: ['抑郁 OR', '慢性病 OR', '农村 OR', '抑郁 Fairlie 贡献度'],
            top: 0,
            textStyle: { color: COLORS.textMuted, fontSize: 12 },
            itemWidth: 22, itemHeight: 2, itemGap: 24
        },
        grid: { left: 50, right: 60, top: 50, bottom: 40, containLabel: true },
        tooltip: { ...baseTooltip, trigger: 'axis' },
        xAxis: {
            type: 'category',
            data: ['2013-2015', '2015-2018', '2018-2020'],
            boundaryGap: false,
            axisLine: baseAxisLine,
            axisTick: { show: false },
            axisLabel: baseAxisLabel
        },
        yAxis: [
            {
                type: 'value', name: 'OR 值', min: 0.8, max: 3.0,
                nameTextStyle: { color: COLORS.textMuted, fontSize: 12, padding: [0, 0, 8, -25] },
                axisLine: { show: false }, axisTick: { show: false },
                axisLabel: baseAxisLabel, splitLine: baseSplitLine
            },
            {
                type: 'value', name: '贡献度 (%)', min: 0, max: 12, position: 'right',
                nameTextStyle: { color: COLORS.textMuted, fontSize: 12, padding: [0, -20, 8, 0] },
                axisLine: { show: false }, axisTick: { show: false },
                axisLabel: { ...baseAxisLabel, formatter: '{value}%' },
                splitLine: { show: false }
            }
        ],
        series: [
            {
                name: '抑郁 OR', type: 'line', data: [1.772, 1.579, 1.638],
                lineStyle: { color: COLORS.primary, width: 2.5 },
                itemStyle: { color: COLORS.primary },
                symbol: 'circle', symbolSize: 8,
                label: { show: true, position: 'top', formatter: '{c}', color: COLORS.primary, fontSize: 12, fontWeight: 600 }
            },
            {
                name: '慢性病 OR', type: 'line', data: [1.333, 1.226, 1.245],
                lineStyle: { color: COLORS.secondary, width: 2.5 },
                itemStyle: { color: COLORS.secondary },
                symbol: 'circle', symbolSize: 8,
                label: { show: true, position: 'bottom', formatter: '{c}', color: COLORS.secondary, fontSize: 12, fontWeight: 600 }
            },
            {
                name: '农村 OR', type: 'line', data: [1.429, 1.260, 1.378],
                lineStyle: { color: COLORS.alert, width: 2.5 },
                itemStyle: { color: COLORS.alert },
                symbol: 'circle', symbolSize: 8,
                label: { show: true, position: 'top', formatter: '{c}', color: COLORS.alert, fontSize: 12, fontWeight: 600 }
            },
            {
                name: '抑郁 Fairlie 贡献度', type: 'line', yAxisIndex: 1, data: [9.2, 8.0, 7.2],
                lineStyle: { color: COLORS.primaryLight, width: 2, type: 'dashed' },
                itemStyle: { color: COLORS.primaryLight },
                symbol: 'rect', symbolSize: 8,
                label: { show: true, position: 'top', formatter: '{c}%', color: COLORS.primaryLight, fontSize: 12, fontWeight: 600 }
            }
        ]
    });
}

// =====================================================
// FIGURE 7: 10年动态微观仿真
// =====================================================
function initMicrosimChart() {
    const el = document.getElementById('microsimChart');
    if (!el) return;
    const chart = echarts.init(el, null, { renderer: 'svg' });
    window._charts.microsim = chart;

    const years = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const d2013 = [19.7, 19.9, 21.0, 22.8, 23.0, 22.1, 24.6, 26.8, 27.8, 27.0];
    const d2015 = [15.1, 16.8, 18.5, 21.3, 22.1, 20.2, 21.9, 23.2, 25.7, 25.5];
    const d2018 = [18.5, 17.5, 18.4, 19.5, 23.0, 20.3, 21.9, 21.8, 23.6, 24.9];

    chart.setOption({
        textStyle: { fontFamily: FONT, color: COLORS.text },
        animation: false,
        legend: {
            data: ['2013-2015 参数', '2015-2018 参数', '2018-2020 参数'],
            top: 0,
            textStyle: { color: COLORS.textMuted, fontSize: 12 },
            itemWidth: 22, itemHeight: 2, itemGap: 24
        },
        grid: { left: 50, right: 30, top: 50, bottom: 50, containLabel: true },
        tooltip: { ...baseTooltip, trigger: 'axis' },
        xAxis: {
            type: 'category',
            data: years.map(y => '第' + y + '年'),
            boundaryGap: false,
            axisLine: baseAxisLine,
            axisTick: { show: false },
            axisLabel: baseAxisLabel
        },
        yAxis: {
            type: 'value',
            name: '累计失能率 (%)',
            nameTextStyle: { color: COLORS.textMuted, fontSize: 12, padding: [0, 0, 8, -25] },
            min: 10, max: 32,
            axisLine: { show: false }, axisTick: { show: false },
            axisLabel: { ...baseAxisLabel, formatter: '{value}%' },
            splitLine: baseSplitLine
        },
        series: [
            {
                name: '2013-2015 参数', type: 'line', data: d2013,
                lineStyle: { color: COLORS.alert, width: 2 },
                itemStyle: { color: COLORS.alert },
                symbol: 'circle', symbolSize: 5, smooth: 0.2
            },
            {
                name: '2015-2018 参数', type: 'line', data: d2015,
                lineStyle: { color: COLORS.secondary, width: 2 },
                itemStyle: { color: COLORS.secondary },
                symbol: 'circle', symbolSize: 5, smooth: 0.2
            },
            {
                name: '2018-2020 参数', type: 'line', data: d2018,
                lineStyle: { color: COLORS.primary, width: 2 },
                itemStyle: { color: COLORS.primary },
                symbol: 'circle', symbolSize: 5, smooth: 0.2
            }
        ]
    });
}

// =====================================================
// FIGURE 8: AUC 与 Brier Score
// =====================================================
function initAUCChart() {
    const el = document.getElementById('aucChart');
    if (!el) return;
    const chart = echarts.init(el, null, { renderer: 'svg' });
    window._charts.auc = chart;

    chart.setOption({
        textStyle: { fontFamily: FONT, color: COLORS.text },
        animation: false,
        legend: {
            data: ['AUC（判别力）', 'Brier×5（校准度，已缩放）'],
            top: 0,
            textStyle: { color: COLORS.textMuted, fontSize: 12 },
            itemWidth: 14, itemHeight: 8, itemGap: 18
        },
        grid: { left: 50, right: 50, top: 50, bottom: 40, containLabel: true },
        tooltip: { ...baseTooltip, trigger: 'axis' },
        xAxis: {
            type: 'category',
            data: ['2013-2015', '2015-2018', '2018-2020'],
            axisLine: baseAxisLine,
            axisTick: { show: false },
            axisLabel: baseAxisLabel
        },
        yAxis: [
            {
                type: 'value', name: '指标值', min: 0, max: 1.0,
                nameTextStyle: { color: COLORS.textMuted, fontSize: 12, padding: [0, 0, 8, -25] },
                axisLine: { show: false }, axisTick: { show: false },
                axisLabel: baseAxisLabel, splitLine: baseSplitLine
            }
        ],
        series: [
            {
                name: 'AUC（判别力）',
                type: 'bar',
                data: [0.754, 0.707, 0.714],
                itemStyle: { color: COLORS.primary },
                barWidth: 28,
                label: { show: true, position: 'top', formatter: function(p) { return p.value.toFixed(3); }, color: COLORS.primary, fontSize: 12, fontWeight: 600 }
            },
            {
                name: 'Brier×5（校准度，已缩放）',
                type: 'bar',
                data: [0.658, 0.656, 0.651],  // 0.131*5, 0.131*5, 0.130*5
                itemStyle: { color: COLORS.secondary },
                barWidth: 28,
                label: { show: true, position: 'top', formatter: function(p) { return (p.value/5).toFixed(3); }, color: COLORS.secondary, fontSize: 12, fontWeight: 600 }
            }
        ]
    });
}

// =====================================================
// FIGURE 9: 压力测试成本效益
// =====================================================
function initCBRChart() {
    const el = document.getElementById('cbrChart');
    if (!el) return;
    const chart = echarts.init(el, null, { renderer: 'svg' });
    window._charts.cbr = chart;

    chart.setOption({
        textStyle: { fontFamily: FONT, color: COLORS.text },
        animation: false,
        legend: {
            data: ['节省金额（亿元）', '干预成本（亿元）'],
            top: 0,
            textStyle: { color: COLORS.textMuted, fontSize: 12 },
            itemWidth: 14, itemHeight: 8, itemGap: 18
        },
        grid: { left: 50, right: 80, top: 50, bottom: 40, containLabel: true },
        tooltip: { ...baseTooltip, trigger: 'axis' },
        xAxis: {
            type: 'category',
            data: ['2013-2015', '2015-2018', '2018-2020'],
            axisLine: baseAxisLine,
            axisTick: { show: false },
            axisLabel: baseAxisLabel
        },
        yAxis: [
            {
                type: 'value',
                name: '金额（亿元）',
                nameTextStyle: { color: COLORS.textMuted, fontSize: 12, padding: [0, 0, 8, -25] },
                axisLine: { show: false }, axisTick: { show: false },
                axisLabel: baseAxisLabel, splitLine: baseSplitLine
            },
            {
                type: 'value',
                name: '成本效益比',
                position: 'right',
                min: 0, max: 8,
                nameTextStyle: { color: COLORS.textMuted, fontSize: 12, padding: [0, -20, 8, 0] },
                axisLine: { show: false }, axisTick: { show: false },
                axisLabel: { ...baseAxisLabel, formatter: '1:{value}' },
                splitLine: { show: false }
            }
        ],
        series: [
            {
                name: '节省金额（亿元）',
                type: 'bar',
                data: [889.5, 730.0, 862.4],
                itemStyle: { color: COLORS.primary },
                barWidth: 22,
                label: { show: true, position: 'top', formatter: function(p) { return p.value.toFixed(0); }, color: COLORS.primary, fontSize: 11, fontWeight: 600 }
            },
            {
                name: '干预成本（亿元）',
                type: 'bar',
                data: [150.3, 155.8, 170.6],
                itemStyle: { color: COLORS.secondaryLight },
                barWidth: 22,
                label: { show: true, position: 'top', formatter: function(p) { return p.value.toFixed(0); }, color: COLORS.secondary, fontSize: 11, fontWeight: 600 }
            },
            {
                name: '成本效益比',
                type: 'line',
                yAxisIndex: 1,
                data: [5.9, 4.7, 5.1],
                lineStyle: { color: COLORS.alert, width: 2 },
                itemStyle: { color: COLORS.alert },
                symbol: 'diamond',
                symbolSize: 10,
                label: { show: true, position: 'top', formatter: function(p) { return '1 : ' + p.value.toFixed(1); }, color: COLORS.alert, fontSize: 11, fontWeight: 600 }
            }
        ]
    });
}

// =====================================================
// CHARLS 样本覆盖 + 长护险试点城市地图
// 底图：DataV.GeoAtlas 中国省级行政区
// =====================================================
function initChinaMap() {
    const el = document.getElementById('chinaMap');
    if (!el) return;
    const chart = echarts.init(el, null, { renderer: 'canvas' });
    window._charts.chinaMap = chart;

    // CHARLS 覆盖 28 个省，按受访户数大致分3档（数据档位用于可视化分级，非精确人口数）
    // CHARLS 不覆盖：海南、宁夏、新疆、西藏、香港、澳门、台湾
    const provinceData = [
        { name: '北京市', value: 2 }, { name: '天津市', value: 2 }, { name: '河北省', value: 3 },
        { name: '山西省', value: 2 }, { name: '内蒙古自治区', value: 2 }, { name: '辽宁省', value: 3 },
        { name: '吉林省', value: 2 }, { name: '黑龙江省', value: 3 }, { name: '上海市', value: 2 },
        { name: '江苏省', value: 3 }, { name: '浙江省', value: 3 }, { name: '安徽省', value: 3 },
        { name: '福建省', value: 2 }, { name: '江西省', value: 2 }, { name: '山东省', value: 3 },
        { name: '河南省', value: 3 }, { name: '湖北省', value: 3 }, { name: '湖南省', value: 3 },
        { name: '广东省', value: 3 }, { name: '广西壮族自治区', value: 2 }, { name: '重庆市', value: 2 },
        { name: '四川省', value: 3 }, { name: '贵州省', value: 2 }, { name: '云南省', value: 2 },
        { name: '陕西省', value: 2 }, { name: '甘肃省', value: 2 }, { name: '青海省', value: 1 },
        // 未覆盖
        { name: '海南省', value: 0 }, { name: '宁夏回族自治区', value: 0 }, { name: '新疆维吾尔自治区', value: 0 },
        { name: '西藏自治区', value: 0 }, { name: '台湾省', value: 0 }, { name: '香港特别行政区', value: 0 },
        { name: '澳门特别行政区', value: 0 }
    ];

    // 长护险试点城市（2016首批15城 + 后续扩面代表性城市），坐标为城市中心经纬度
    const pilotCities = [
        { name: '上海',     value: [121.47, 31.23] },
        { name: '北京石景山', value: [116.20, 39.91] },
        { name: '天津',     value: [117.20, 39.13] },
        { name: '广州',     value: [113.27, 23.13] },
        { name: '苏州',     value: [120.62, 31.32] },
        { name: '南通',     value: [120.86, 32.01] },
        { name: '宁波',     value: [121.55, 29.87] },
        { name: '青岛',     value: [120.38, 36.07] },
        { name: '荆门',     value: [112.20, 31.04] },
        { name: '安庆',     value: [117.04, 30.51] },
        { name: '上饶',     value: [117.97, 28.45] },
        { name: '齐齐哈尔', value: [123.92, 47.34] },
        { name: '长春',     value: [125.32, 43.82] },
        { name: '承德',     value: [117.94, 40.95] },
        { name: '成都',     value: [104.07, 30.67] },
        { name: '重庆',     value: [106.55, 29.56] },
        { name: '昆明',     value: [102.71, 25.04] },
        { name: '福州',     value: [119.30, 26.08] },
        { name: '南宁',     value: [108.33, 22.84] },
        { name: '呼和浩特', value: [111.65, 40.81] },
        { name: '黔西南',   value: [104.90, 25.09] },
        { name: '开封',     value: [114.31, 34.80] },
        { name: '晋城',     value: [112.85, 35.50] },
        { name: '汉中',     value: [107.02, 33.07] }
    ];

    // 加载中国地图 GeoJSON：本地优先，失败则回退到 DataV CDN
    function loadGeoJson() {
        return fetch('data/china.json')
            .then(r => {
                if (!r.ok) throw new Error('local not found: ' + r.status);
                return r.json();
            })
            .catch(err => {
                console.warn('Local GeoJSON failed, falling back to DataV CDN:', err);
                return fetch('https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json')
                    .then(r => r.json());
            });
    }

    loadGeoJson()
        .then(geoJson => {
            echarts.registerMap('china', geoJson);

            chart.setOption({
                textStyle: { fontFamily: FONT, color: COLORS.text },
                animation: false,
                tooltip: {
                    ...baseTooltip,
                    trigger: 'item',
                    formatter: function(p) {
                        if (p.seriesType === 'effectScatter') {
                            return '<strong>' + p.name + '</strong><br/>长护险试点城市';
                        }
                        if (p.seriesType === 'map') {
                            const v = p.value;
                            const label = (isNaN(v) || v === 0) ? '本研究未覆盖' :
                                          (v === 1 ? 'CHARLS 样本量较少' :
                                          (v === 2 ? 'CHARLS 样本量中等' : 'CHARLS 样本量较多'));
                            return '<strong>' + p.name + '</strong><br/>' + label;
                        }
                        return p.name;
                    }
                },
                visualMap: {
                    show: false,
                    min: 0,
                    max: 3,
                    inRange: {
                        color: ['#F4F4F0', '#D5DEE5', '#91B5C9', '#1E3A5F']
                    }
                },
                geo: {
                    map: 'china',
                    roam: false,
                    zlevel: 0,
                    z: 1,
                    label: { show: false },
                    itemStyle: {
                        areaColor: '#F4F4F0',
                        borderColor: '#FFFFFF',
                        borderWidth: 1
                    },
                    emphasis: {
                        disabled: true
                    },
                    select: { disabled: true }
                },
                series: [
                    {
                        name: 'CHARLS 样本覆盖',
                        type: 'map',
                        map: 'china',
                        geoIndex: 0,
                        zlevel: 1,
                        z: 2,
                        data: provinceData,
                        label: { show: false },
                        itemStyle: {
                            borderColor: '#FFFFFF',
                            borderWidth: 0.8
                        },
                        emphasis: {
                            label: {
                                show: true,
                                color: COLORS.text,
                                fontSize: 11,
                                fontFamily: FONT
                            },
                            itemStyle: {
                                areaColor: null,
                                borderColor: COLORS.primary,
                                borderWidth: 1.5
                            }
                        },
                        select: { disabled: true }
                    },
                    {
                        name: '长护险试点城市',
                        type: 'effectScatter',
                        coordinateSystem: 'geo',
                        data: pilotCities,
                        symbol: 'circle',
                        symbolSize: 11,
                        showEffectOn: 'render',
                        rippleEffect: {
                            brushType: 'stroke',
                            scale: 4,
                            period: 3,
                            color: COLORS.alert
                        },
                        itemStyle: {
                            color: COLORS.alert,
                            borderColor: '#FFFFFF',
                            borderWidth: 2,
                            shadowBlur: 8,
                            shadowColor: 'rgba(231, 111, 81, 0.55)'
                        },
                        label: {
                            show: true,
                            position: 'right',
                            formatter: '{b}',
                            fontSize: 11,
                            fontWeight: 600,
                            color: COLORS.text,
                            fontFamily: FONT,
                            distance: 8,
                            backgroundColor: 'rgba(255, 255, 255, 0.85)',
                            padding: [2, 5],
                            borderRadius: 2
                        },
                        emphasis: {
                            scale: 1.4,
                            label: {
                                fontSize: 12,
                                fontWeight: 700,
                                backgroundColor: '#FFFFFF',
                                borderColor: COLORS.alert,
                                borderWidth: 1
                            }
                        },
                        zlevel: 5,
                        z: 10,
                        silent: false
                    }
                ]
            });
        })
        .catch(err => {
            el.innerHTML = '<div style="padding: 3rem; text-align: center; color: #6B7280; font-family: ' + FONT + ';">' +
                           '地图加载失败，请刷新页面重试。<br/><small style="color: #9CA3AF;">' + (err.message || err) + '</small></div>';
            console.error('Map load failed:', err);
        });
}

// =====================================================
// 风险评分卡 (Risk Scorecard) — 09 节
// 基于三期独立 Logistic 回归（2013-2015 / 2015-2018 / 2018-2020）
// 输入一次 → 同时输出三期概率 → 共识等级
// =====================================================
(function initScorecard() {
    const formEl = document.getElementById('scForm');
    if (!formEl) return;

    // ---------- 三期 OR 系数（来源: v2数据，multi_period_logistic_results.csv）----------
    const PERIODS = [
        {
            id: 'p1', name: '2013-2015',
            beta: {
                intercept: -2.559,
                age:        Math.log(1.0452),
                gender:     Math.log(0.632),
                rural:      Math.log(1.429),
                edu:        Math.log(1.260),
                depressed:  Math.log(1.772),
                chronic:    Math.log(1.333),
                smoke:      Math.log(1.048),
            },
            target_rate: 0.269,
        },
        {
            id: 'p2', name: '2015-2018',
            beta: {
                intercept: -2.357,
                age:        Math.log(1.0508),
                gender:     Math.log(0.627),
                rural:      Math.log(1.260),
                edu:        Math.log(1.259),
                depressed:  Math.log(1.579),
                chronic:    Math.log(1.226),
                smoke:      Math.log(1.167),
            },
            target_rate: 0.247,
        },
        {
            id: 'p3', name: '2018-2020',
            beta: {
                intercept: -2.281,
                age:        Math.log(1.0590),
                gender:     Math.log(0.550),
                rural:      Math.log(1.378),
                edu:        Math.log(1.259),
                depressed:  Math.log(1.638),
                chronic:    Math.log(1.245),
                smoke:      Math.log(1.111),
            },
            target_rate: 0.277,
        },
    ];

    // ---------- 单期预测 ----------
    function predictPeriod(beta, x) {
        const ageOff = x.age - 60;
        const logit = beta.intercept
            + beta.age * ageOff
            + beta.gender * x.gender
            + beta.rural * x.rural
            + beta.edu * x.edu
            + beta.depressed * x.depressed
            + beta.chronic * x.chronic
            + beta.smoke * x.smoke;
        return 1 / (1 + Math.exp(-logit));
    }

    // ---------- 概率 → 风险等级 ----------
    function tierOf(p) {
        if (p < 0.15) return { tier: 'L', name: '低风险', cls: 'low' };
        if (p < 0.30) return { tier: 'M', name: '中风险', cls: 'medium' };
        return { tier: 'H', name: '高风险', cls: 'high' };
    }

    // ---------- 三期共识等级（多数派 / 中位） ----------
    function consensusOf(probs) {
        const tiers = probs.map(tierOf);
        const counts = { L: 0, M: 0, H: 0 };
        tiers.forEach(t => counts[t.tier]++);
        // 多数派
        let majTier = null;
        if (counts.L >= 2) majTier = 'L';
        else if (counts.M >= 2) majTier = 'M';
        else if (counts.H >= 2) majTier = 'H';

        if (majTier) {
            const t = tiers.find(t => t.tier === majTier);
            return { ...t, mode: 'majority' };
        }
        // 三期都不同（L, M, H 各一）→ 取中位数（按概率排序）
        const sorted = [...probs].sort((a, b) => a - b);
        const median = sorted[1];
        return { ...tierOf(median), mode: 'median' };
    }

    // ---------- 干预建议 ----------
    const ACTIONS = {
        low: [
            '维持当前生活方式：定期参加社区活动、规律作息',
            '每年 1 次 CES-D-10 心理健康自评',
            '关注血压、血糖等基础慢病指标',
        ],
        medium: [
            '建议每 6 个月开展一次 ADL/IADL 与 CES-D 联合评估',
            '社区卫生服务中心建立"中风险"档案，接入家庭医生签约',
            '抑郁阳性者优先纳入心理咨询或团体活动',
            '指导慢病自我管理（高血压、糖尿病记录与服药提醒）',
        ],
        high: [
            '<strong>纳入长护险预防服务包</strong>，每 3 个月入户评估一次',
            '抑郁干预：转介心理科或推进 PHQ-9 二次筛查 + 认知行为干预',
            '强化慢病管理：药物依从性追踪、家庭血压计配置',
            '功能康复：建议接入物理治疗、平衡训练、力量训练',
            '社会支持：动员家庭、邻里或志愿者陪伴，避免社交退缩',
        ],
    };

    // ---------- 渲染结果 ----------
    function render(input) {
        const probs = PERIODS.map(p => predictPeriod(p.beta, input));
        const tiers = probs.map(tierOf);
        const consensus = consensusOf(probs);

        // 共识 banner
        const cBadge = document.getElementById('rConsensusBadge');
        cBadge.textContent = consensus.tier;
        cBadge.className = 'consensus-tier-badge ' + consensus.cls;
        document.getElementById('rConsensusName').textContent = consensus.name;
        const meanP = probs.reduce((s, x) => s + x, 0) / probs.length;
        document.getElementById('rConsensusProb').textContent =
            `三期平均概率 ${(meanP * 100).toFixed(1)}% · 三期均同等级` +
            (consensus.mode === 'majority' ? '（多数派一致）' : '（三期分歧，取中位）');
        // CV
        const sd = Math.sqrt(probs.reduce((s, x) => s + (x - meanP) ** 2, 0) / probs.length);
        const cv = (sd / meanP);
        document.getElementById('rConsensusCV').innerHTML =
            `<strong>CV ${cv.toFixed(2)}</strong>跨期变异`;

        // 三期面板
        PERIODS.forEach((p, i) => {
            const probEl = document.getElementById(`rProb_${p.id}`);
            const barEl = document.getElementById(`rBar_${p.id}`);
            const tierEl = document.getElementById(`rTier_${p.id}`);
            probEl.textContent = `${(probs[i] * 100).toFixed(1)}%`;
            // 进度条最大映射 60%
            const w = Math.min(probs[i] / 0.60, 1) * 100;
            barEl.style.width = w + '%';
            barEl.className = 'period-bar-fill ' + tiers[i].cls;
            tierEl.textContent = tiers[i].name;
            tierEl.className = 'period-tier ' + tiers[i].cls;
        });

        // 风险拆解（用三期平均 OR）
        const meanBeta = {
            intercept: PERIODS.reduce((s, p) => s + p.beta.intercept, 0) / 3,
            age:       PERIODS.reduce((s, p) => s + p.beta.age, 0) / 3,
            gender:    PERIODS.reduce((s, p) => s + p.beta.gender, 0) / 3,
            rural:     PERIODS.reduce((s, p) => s + p.beta.rural, 0) / 3,
            edu:       PERIODS.reduce((s, p) => s + p.beta.edu, 0) / 3,
            depressed: PERIODS.reduce((s, p) => s + p.beta.depressed, 0) / 3,
            chronic:   PERIODS.reduce((s, p) => s + p.beta.chronic, 0) / 3,
            smoke:     PERIODS.reduce((s, p) => s + p.beta.smoke, 0) / 3,
        };
        const ageOff = input.age - 60;
        const breakdown = [
            { label: '基线截距 (60岁参考)', pts: meanBeta.intercept },
            { label: `年龄 (${input.age} 岁)`, pts: meanBeta.age * ageOff },
            { label: input.gender === 1 ? '女性' : '男性', pts: input.gender === 1 ? meanBeta.gender : 0 },
            { label: input.rural === 1 ? '农村居住' : '城市居住', pts: input.rural === 1 ? meanBeta.rural : 0 },
            { label: input.edu === 1 ? '低教育水平' : '初中及以上', pts: input.edu === 1 ? meanBeta.edu : 0 },
            { label: input.depressed === 1 ? '抑郁 (CES-D ≥ 10)' : '无抑郁', pts: input.depressed === 1 ? meanBeta.depressed : 0 },
            { label: `慢性病 (${input.chronic} 种)`, pts: meanBeta.chronic * input.chronic },
            { label: input.smoke === 1 ? '当前吸烟' : '不吸烟', pts: input.smoke === 1 ? meanBeta.smoke : 0 },
        ];
        const ul = document.getElementById('rBreakdown');
        ul.innerHTML = '';
        breakdown.forEach(c => {
            if (Math.abs(c.pts) < 0.005) return;
            const sign = c.pts > 0 ? '+' : '−';
            const cls = c.pts > 0 ? 'positive' : 'negative';
            const li = document.createElement('li');
            li.className = 'breakdown-item';
            li.innerHTML = `<span class="breakdown-label">${c.label}</span><span class="breakdown-points ${cls}">${sign}${Math.abs(c.pts).toFixed(2)}</span>`;
            ul.appendChild(li);
        });

        // 干预建议
        const actBox = document.getElementById('rActions');
        actBox.className = 'result-actions ' + consensus.cls;
        const list = document.getElementById('rActionList');
        list.innerHTML = '';
        ACTIONS[consensus.cls].forEach(text => {
            const li = document.createElement('li');
            li.innerHTML = text;
            list.appendChild(li);
        });

        // 显示
        document.getElementById('scEmpty').style.display = 'none';
        document.getElementById('scResult').classList.add('show');
    }

    // ---------- 读取输入 ----------
    function getInput() {
        const age = parseInt(document.getElementById('sc_age').value, 10);
        const chronic = parseInt(document.getElementById('sc_chronic').value, 10);
        if (isNaN(age) || age < 60 || age > 100) {
            alert('请输入合理的年龄（60-100 岁）'); return null;
        }
        if (isNaN(chronic) || chronic < 0 || chronic > 14) {
            alert('请输入合理的慢性病数量（0-14 种）'); return null;
        }
        function getRadio(name) {
            const el = document.querySelector(`input[name="${name}"]:checked`);
            return el ? parseInt(el.value, 10) : 0;
        }
        return {
            age, chronic,
            gender:    getRadio('sc_gender'),
            rural:     getRadio('sc_rural'),
            edu:       getRadio('sc_edu'),
            depressed: getRadio('sc_depressed'),
            smoke:     getRadio('sc_smoke'),
        };
    }

    // ---------- 事件 ----------
    document.getElementById('scCalc').addEventListener('click', () => {
        const input = getInput();
        if (input === null) return;
        render(input);
        const resultEl = document.getElementById('scResult');
        const rect = resultEl.getBoundingClientRect();
        if (rect.top < 0 || rect.bottom > window.innerHeight) {
            resultEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    });

    document.getElementById('scReset').addEventListener('click', () => {
        formEl.reset();
        document.getElementById('scEmpty').style.display = 'flex';
        document.getElementById('scResult').classList.remove('show');
    });

    // 默认演示
    requestAnimationFrame(() => {
        const input = getInput();
        if (input) render(input);
    });
})();
