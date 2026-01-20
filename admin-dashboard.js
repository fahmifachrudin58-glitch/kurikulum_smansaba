// Admin Dashboard JavaScript

// Global variables
let currentSection = 'overview';
let currentAnalyticsData = null;
let currentReportsData = null;
let currentDeepAnalysisData = null;
let teacherAnalysisData = [];
let classAnalysisData = [];
let detailedAnalysisData = [];
const API_BASE = 'http://localhost:3000/api';

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    initializeDashboard();
    setupEventListeners();
    loadStats();
    loadRecentReports();
    loadFilters();
});

// Authentication check
function checkAuth() {
    // Enhanced admin authentication
    const adminAuth = localStorage.getItem('adminAuth');
    const adminUser = localStorage.getItem('adminUser');
    
    if (!adminAuth || adminUser !== 'admin') {
        // Simple admin login
        const username = prompt('Admin Username:');
        const password = prompt('Admin Password:');
        
        if (username === 'admin' && password === 'admin123') {
            localStorage.setItem('adminAuth', 'true');
            localStorage.setItem('adminUser', 'admin');
            document.getElementById('adminName').textContent = 'Administrator';
        } else {
            alert('Invalid admin credentials. Access denied.');
            window.location.href = 'index.html';
            return;
        }
    } else {
        document.getElementById('adminName').textContent = 'Administrator';
    }
}

// Initialize dashboard
function initializeDashboard() {
    // Set current year in filter
    const currentYear = new Date().getFullYear();
    const yearSelect = document.getElementById('filterYear');
    if (yearSelect) {
        yearSelect.value = currentYear.toString();
    }
    
    // Set current month in analytics filter
    const currentMonth = new Date().getMonth() + 1;
    const analyticsMonth = document.getElementById('analyticsMonth');
    if (analyticsMonth) {
        analyticsMonth.value = currentMonth.toString();
    }
    
    // Set default date range for deep analysis (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    
    if (startDateInput) {
        startDateInput.value = thirtyDaysAgo.toISOString().split('T')[0];
    }
    
    if (endDateInput) {
        endDateInput.value = today.toISOString().split('T')[0];
    }
}

// Setup event listeners
function setupEventListeners() {
    // Filter listeners
    const filterMonth = document.getElementById('filterMonth');
    const filterYear = document.getElementById('filterYear');
    const filterClass = document.getElementById('filterClass');
    
    if (filterMonth) filterMonth.addEventListener('change', loadReports);
    if (filterYear) filterYear.addEventListener('change', loadReports);
    if (filterClass) filterClass.addEventListener('input', debounce(loadReports, 500));
    
    // Analytics filter listeners
    const analyticsTeacher = document.getElementById('analyticsTeacher');
    const analyticsClass = document.getElementById('analyticsClass');
    const analyticsMonth = document.getElementById('analyticsMonth');
    
    if (analyticsTeacher) analyticsTeacher.addEventListener('change', loadAnalytics);
    if (analyticsClass) analyticsClass.addEventListener('change', loadAnalytics);
    if (analyticsMonth) analyticsMonth.addEventListener('change', loadAnalytics);
    
    // Deep analysis filter listeners
    const deepAnalysisTeacher = document.getElementById('deepAnalysisTeacher');
    const deepAnalysisClass = document.getElementById('deepAnalysisClass');
    const startDate = document.getElementById('startDate');
    const endDate = document.getElementById('endDate');
    const searchDetailedData = document.getElementById('searchDetailedData');
    
    if (deepAnalysisTeacher) deepAnalysisTeacher.addEventListener('change', loadDeepAnalysis);
    if (deepAnalysisClass) deepAnalysisClass.addEventListener('change', loadDeepAnalysis);
    if (startDate) startDate.addEventListener('change', loadDeepAnalysis);
    if (endDate) endDate.addEventListener('change', loadDeepAnalysis);
    if (searchDetailedData) searchDetailedData.addEventListener('input', debounce(filterDetailedTable, 300));
}

// Debounce function for search input
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Navigation
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    document.getElementById(sectionId).classList.add('active');
    
    // Update navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    document.querySelector(`[onclick="showSection('${sectionId}')"]`).classList.add('active');
    
    currentSection = sectionId;
    
    // Load section-specific data
    switch (sectionId) {
        case 'reports':
            loadReports();
            break;
        case 'analytics':
            loadAnalytics();
            break;
        case 'files':
            loadTeacherFiles();
            break;
        case 'deep-analysis':
            loadDeepAnalysis();
            break;
    }
}

// Load filter options
async function loadFilters() {
    try {
        const response = await fetch(`${API_BASE}/filters`);
        const filters = await response.json();
        
        // Populate teacher filter
        const teacherSelect = document.getElementById('analyticsTeacher');
        if (teacherSelect && filters.teachers) {
            teacherSelect.innerHTML = '<option value="">Semua Guru</option>' +
                filters.teachers.map(teacher => `<option value="${teacher}">${teacher}</option>`).join('');
        }
        
        // Populate deep analysis teacher filter
        const deepTeacherSelect = document.getElementById('deepAnalysisTeacher');
        if (deepTeacherSelect && filters.teachers) {
            deepTeacherSelect.innerHTML = '<option value="">Semua Guru</option>' +
                filters.teachers.map(teacher => `<option value="${teacher}">${teacher}</option>`).join('');
        }
        
        // Populate deep analysis class filter
        const deepClassSelect = document.getElementById('deepAnalysisClass');
        if (deepClassSelect && filters.classes) {
            deepClassSelect.innerHTML = '<option value="">Semua Kelas</option>' +
                filters.classes.map(className => `<option value="${className}">${className}</option>`).join('');
        }
        
    } catch (error) {
        console.error('Error loading filters:', error);
    }
}

// Load statistics
async function loadStats() {
    try {
        const response = await fetch(`${API_BASE}/attendance-stats`);
        const stats = await response.json();
        
        document.getElementById('totalReports').textContent = stats.totalReports || 0;
        document.getElementById('weeklyReports').textContent = stats.thisWeek || 0;
        document.getElementById('monthlyReports').textContent = stats.thisMonth || 0;
        document.getElementById('activeClasses').textContent = stats.byClass?.length || 0;
        
    } catch (error) {
        console.error('Error loading stats:', error);
        // Show fallback data
        document.getElementById('totalReports').textContent = '0';
        document.getElementById('weeklyReports').textContent = '0';
        document.getElementById('monthlyReports').textContent = '0';
        document.getElementById('activeClasses').textContent = '0';
    }
}

// Load recent reports for overview
async function loadRecentReports() {
    try {
        const response = await fetch(`${API_BASE}/attendance-reports?limit=5`);
        const reports = await response.json();
        
        const container = document.getElementById('recentReportsPreview');
        
        if (reports.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-clipboard-list"></i>
                    <p>Belum ada laporan yang masuk</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = reports.slice(0, 5).map(report => `
            <div class="preview-report-item">
                <div class="preview-report-info">
                    <div class="preview-report-date">
                        ${new Date(report.date).toLocaleDateString('id-ID', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                        })}
                    </div>
                    <div class="preview-report-class">${report.className}</div>
                    <div class="preview-report-subjects">${report.subjects.length} mata pelajaran</div>
                </div>
                <div class="preview-report-by">
                    <small>oleh ${report.submittedBy}</small>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading recent reports:', error);
        document.getElementById('recentReportsPreview').innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Gagal memuat laporan terbaru</p>
            </div>
        `;
    }
}

// Load attendance reports
async function loadReports() {
    const container = document.getElementById('reportsList');
    const summaryContainer = document.getElementById('reportsSummary');
    
    container.innerHTML = '<div class="loading"><i class="fas fa-spinner"></i> Memuat laporan...</div>';
    
    try {
        const month = document.getElementById('filterMonth')?.value || '';
        const year = document.getElementById('filterYear')?.value || '';
        const className = document.getElementById('filterClass')?.value || '';
        
        const params = new URLSearchParams();
        if (month) params.append('month', month);
        if (year) params.append('year', year);
        if (className) params.append('className', className);
        
        const response = await fetch(`${API_BASE}/attendance-reports?${params}`);
        const reports = await response.json();
        
        currentReportsData = reports;
        
        // Generate summary
        generateReportsSummary(reports, summaryContainer);
        
        if (reports.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <p>Tidak ada laporan yang sesuai dengan filter</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = reports.map(report => `
            <div class="admin-report-item">
                <div class="report-header">
                    <div class="report-main-info">
                        <div class="report-date-badge">
                            ${new Date(report.date).toLocaleDateString('id-ID', { 
                                weekday: 'short', 
                                month: 'short', 
                                day: 'numeric' 
                            })}
                        </div>
                        <div class="report-class-info">
                            <div class="report-class-name">${report.className}</div>
                            <div class="report-submitted-by">oleh ${report.submittedBy}</div>
                        </div>
                    </div>
                    <div class="report-actions">
                        <button class="report-action-btn btn-view-detail" onclick="viewReportDetail(${report.id})">
                            <i class="fas fa-eye"></i> Detail
                        </button>
                        <button class="report-action-btn btn-export-single" onclick="exportSingleReport(${report.id})">
                            <i class="fas fa-download"></i> Export
                        </button>
                    </div>
                </div>
                <div class="report-content">
                    <div class="subjects-summary">
                        ${report.subjects.map(subject => `
                            <div class="subject-summary-item">
                                <div class="subject-info">
                                    <div class="subject-name">${subject.name}</div>
                                    <div class="subject-teacher">${subject.teacher}</div>
                                    <div class="subject-time">${subject.startTime} - ${subject.endTime}</div>
                                </div>
                                <div class="attendance-badge attendance-${subject.attendance}">
                                    ${getAttendanceLabel(subject.attendance)}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    ${report.notes ? `<p><strong>Catatan:</strong> ${report.notes}</p>` : ''}
                    <div class="report-meta">
                        <small>Dikirim: ${new Date(report.createdAt).toLocaleString('id-ID')}</small>
                    </div>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading reports:', error);
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Gagal memuat laporan. Pastikan server berjalan.</p>
            </div>
        `;
    }
}

// Generate reports summary
function generateReportsSummary(reports, container) {
    let totalSubjects = 0;
    let presentCount = 0;
    let lateCount = 0;
    let absentCount = 0;
    const uniqueClasses = new Set();
    
    reports.forEach(report => {
        uniqueClasses.add(report.className);
        report.subjects.forEach(subject => {
            totalSubjects++;
            switch (subject.attendance) {
                case 'present': presentCount++; break;
                case 'late': lateCount++; break;
                case 'absent': absentCount++; break;
            }
        });
    });
    
    const presentPercentage = totalSubjects > 0 ? Math.round((presentCount / totalSubjects) * 100) : 0;
    const latePercentage = totalSubjects > 0 ? Math.round((lateCount / totalSubjects) * 100) : 0;
    const absentPercentage = totalSubjects > 0 ? Math.round((absentCount / totalSubjects) * 100) : 0;
    
    container.innerHTML = `
        <div class="summary-stat-card">
            <div class="summary-stat-number">${reports.length}</div>
            <div class="summary-stat-label">Total Laporan</div>
        </div>
        <div class="summary-stat-card">
            <div class="summary-stat-number">${uniqueClasses.size}</div>
            <div class="summary-stat-label">Kelas Aktif</div>
        </div>
        <div class="summary-stat-card">
            <div class="summary-stat-number">${presentPercentage}%</div>
            <div class="summary-stat-label">Kehadiran</div>
        </div>
        <div class="summary-stat-card">
            <div class="summary-stat-number">${latePercentage}%</div>
            <div class="summary-stat-label">Keterlambatan</div>
        </div>
        <div class="summary-stat-card">
            <div class="summary-stat-number">${absentPercentage}%</div>
            <div class="summary-stat-label">Ketidakhadiran</div>
        </div>
    `;
}

// Load analytics data
async function loadAnalytics() {
    const classStatsContainer = document.getElementById('classStats');
    const teacherPerformanceContainer = document.getElementById('teacherPerformance');
    const attendanceSummaryContainer = document.getElementById('attendanceSummary');
    const detailedStatsBody = document.getElementById('detailedStatsBody');
    
    // Show loading
    [classStatsContainer, teacherPerformanceContainer, attendanceSummaryContainer, detailedStatsBody].forEach(container => {
        if (container) container.innerHTML = '<div class="loading"><i class="fas fa-spinner"></i> Memuat...</div>';
    });
    
    try {
        const teacher = document.getElementById('analyticsTeacher')?.value || '';
        const className = document.getElementById('analyticsClass')?.value || '';
        const month = document.getElementById('analyticsMonth')?.value || '';
        const year = new Date().getFullYear().toString();
        
        const params = new URLSearchParams();
        if (teacher) params.append('teacher', teacher);
        if (className) params.append('className', className);
        if (month) params.append('month', month);
        if (year) params.append('year', year);
        
        const response = await fetch(`${API_BASE}/analytics?${params}`);
        const analytics = await response.json();
        
        currentAnalyticsData = analytics;
        
        // Load class statistics
        if (analytics.classes && Object.keys(analytics.classes).length > 0) {
            classStatsContainer.innerHTML = Object.entries(analytics.classes).map(([className, stats]) => `
                <div class="class-stat-item">
                    <div class="class-name">${className}</div>
                    <div class="class-report-count">${stats.total} laporan</div>
                </div>
            `).join('');
        } else {
            classStatsContainer.innerHTML = '<p>Belum ada data kelas</p>';
        }
        
        // Load teacher performance
        if (analytics.teachers && analytics.teachers.length > 0) {
            teacherPerformanceContainer.innerHTML = analytics.teachers.map(teacher => `
                <div class="teacher-item">
                    <div class="teacher-header">
                        <div>
                            <div class="teacher-name">${teacher.teacher}</div>
                            <div class="teacher-subject">${teacher.subject} - ${teacher.className}</div>
                        </div>
                        <div class="attendance-percentage">${teacher.presentPercentage}%</div>
                    </div>
                    <div class="teacher-stats">
                        <span class="stat-present">${teacher.present} Hadir</span>
                        <span class="stat-late">${teacher.late} Terlambat</span>
                        <span class="stat-absent">${teacher.absent} Tidak Hadir</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill progress-present" style="width: ${teacher.presentPercentage}%"></div>
                    </div>
                </div>
            `).join('');
        } else {
            teacherPerformanceContainer.innerHTML = '<p>Belum ada data guru</p>';
        }
        
        // Load attendance summary
        if (analytics.overall) {
            const overall = analytics.overall;
            attendanceSummaryContainer.innerHTML = `
                <div class="summary-card">
                    <div class="summary-number">${overall.present}</div>
                    <div class="summary-label">Hadir</div>
                    <div class="summary-percentage percentage-present">${overall.presentPercentage}%</div>
                    <div class="progress-bar">
                        <div class="progress-fill progress-present" style="width: ${overall.presentPercentage}%"></div>
                    </div>
                </div>
                <div class="summary-card">
                    <div class="summary-number">${overall.late}</div>
                    <div class="summary-label">Terlambat</div>
                    <div class="summary-percentage percentage-late">${overall.latePercentage}%</div>
                    <div class="progress-bar">
                        <div class="progress-fill progress-late" style="width: ${overall.latePercentage}%"></div>
                    </div>
                </div>
                <div class="summary-card">
                    <div class="summary-number">${overall.absent}</div>
                    <div class="summary-label">Tidak Hadir</div>
                    <div class="summary-percentage percentage-absent">${overall.absentPercentage}%</div>
                    <div class="progress-bar">
                        <div class="progress-fill progress-absent" style="width: ${overall.absentPercentage}%"></div>
                    </div>
                </div>
                <div class="summary-card">
                    <div class="summary-number">${overall.total}</div>
                    <div class="summary-label">Total Laporan</div>
                    <div class="summary-percentage">100%</div>
                </div>
            `;
        }
        
        // Load detailed statistics table
        if (analytics.teachers && analytics.teachers.length > 0) {
            detailedStatsBody.innerHTML = analytics.teachers.map(teacher => `
                <tr>
                    <td>${teacher.teacher}</td>
                    <td>${teacher.subject}</td>
                    <td>${teacher.className}</td>
                    <td>${teacher.total}</td>
                    <td>${teacher.present}</td>
                    <td>${teacher.late}</td>
                    <td>${teacher.absent}</td>
                    <td class="percentage-cell ${getPercentageClass(teacher.presentPercentage)}">${teacher.presentPercentage}%</td>
                </tr>
            `).join('');
        } else {
            detailedStatsBody.innerHTML = '<tr><td colspan="8" style="text-align: center;">Belum ada data</td></tr>';
        }
        
    } catch (error) {
        console.error('Error loading analytics:', error);
        [classStatsContainer, teacherPerformanceContainer, attendanceSummaryContainer].forEach(container => {
            if (container) container.innerHTML = '<p>Gagal memuat data analitik</p>';
        });
    }
}

// Load teacher files
async function loadTeacherFiles() {
    try {
        const response = await fetch(`${API_BASE}/teacher-files`);
        const files = await response.json();
        
        // Update file statistics
        const totalFiles = files.length;
        const rppFiles = files.filter(f => f.file_type === 'rpp').length;
        const syllabusFiles = files.filter(f => f.file_type === 'silabus').length;
        
        document.getElementById('totalFiles').textContent = totalFiles;
        document.getElementById('rppFiles').textContent = rppFiles;
        document.getElementById('syllabusFiles').textContent = syllabusFiles;
        
        // Display files list
        const container = document.getElementById('teacherFilesList');
        if (files.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-folder-open"></i>
                    <p>Belum ada file yang diupload</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <div class="files-table">
                <table class="stats-table">
                    <thead>
                        <tr>
                            <th>Nama File</th>
                            <th>Jenis</th>
                            <th>Mata Pelajaran</th>
                            <th>Kelas</th>
                            <th>Guru</th>
                            <th>Tanggal Upload</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${files.map(file => `
                            <tr>
                                <td>${file.original_name}</td>
                                <td>${getDocTypeLabel(file.file_type)}</td>
                                <td>${file.subject}</td>
                                <td>Kelas ${file.grade}</td>
                                <td>${file.uploaded_by}</td>
                                <td>${new Date(file.created_at).toLocaleDateString('id-ID')}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        
    } catch (error) {
        console.error('Error loading teacher files:', error);
        document.getElementById('teacherFilesList').innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Gagal memuat data file</p>
            </div>
        `;
    }
}

// Helper functions
function getAttendanceLabel(status) {
    const labels = {
        'present': 'Hadir',
        'late': 'Terlambat',
        'absent': 'Tidak Hadir'
    };
    return labels[status] || status;
}

function getDocTypeLabel(type) {
    const labels = {
        'rpp': 'RPP',
        'silabus': 'Silabus',
        'materi': 'Materi',
        'evaluasi': 'Evaluasi'
    };
    return labels[type] || type;
}

function getPercentageClass(percentage) {
    if (percentage >= 80) return 'percentage-high';
    if (percentage >= 60) return 'percentage-medium';
    return 'percentage-low';
}

// Export functions
function exportReports() {
    if (!currentReportsData || currentReportsData.length === 0) {
        alert('Tidak ada data untuk diekspor');
        return;
    }
    
    const csvContent = generateReportsCSV(currentReportsData);
    downloadCSV(csvContent, 'laporan-kehadiran.csv');
}

function exportAnalytics() {
    if (!currentAnalyticsData || !currentAnalyticsData.teachers || currentAnalyticsData.teachers.length === 0) {
        alert('Tidak ada data analitik untuk diekspor');
        return;
    }
    
    const csvContent = generateAnalyticsCSV(currentAnalyticsData);
    downloadCSV(csvContent, 'analitik-kehadiran.csv');
}

function exportDetailedStats() {
    if (!currentAnalyticsData || !currentAnalyticsData.teachers || currentAnalyticsData.teachers.length === 0) {
        alert('Tidak ada data statistik untuk diekspor');
        return;
    }
    
    const csvContent = generateDetailedStatsCSV(currentAnalyticsData.teachers);
    downloadCSV(csvContent, 'statistik-detail.csv');
}

function generateReportsCSV(reports) {
    const headers = ['Tanggal', 'Kelas', 'Mata Pelajaran', 'Guru', 'Jam', 'Status Kehadiran', 'Catatan', 'Dikirim Oleh'];
    const rows = [];
    
    reports.forEach(report => {
        report.subjects.forEach(subject => {
            rows.push([
                report.date,
                report.className,
                subject.name,
                subject.teacher,
                `${subject.startTime} - ${subject.endTime}`,
                getAttendanceLabel(subject.attendance),
                subject.notes || '',
                report.submittedBy
            ]);
        });
    });
    
    return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
}

function generateAnalyticsCSV(analytics) {
    const headers = ['Guru', 'Mata Pelajaran', 'Kelas', 'Total Laporan', 'Hadir', 'Terlambat', 'Tidak Hadir', '% Kehadiran'];
    const rows = analytics.teachers.map(teacher => [
        teacher.teacher,
        teacher.subject,
        teacher.className,
        teacher.total,
        teacher.present,
        teacher.late,
        teacher.absent,
        `${teacher.presentPercentage}%`
    ]);
    
    return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
}

function generateDetailedStatsCSV(teachers) {
    const headers = ['Guru', 'Mata Pelajaran', 'Kelas', 'Total Laporan', 'Hadir', 'Terlambat', 'Tidak Hadir', '% Kehadiran'];
    const rows = teachers.map(teacher => [
        teacher.teacher,
        teacher.subject,
        teacher.className,
        teacher.total,
        teacher.present,
        teacher.late,
        teacher.absent,
        `${teacher.presentPercentage}%`
    ]);
    
    return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
}

function downloadCSV(csvContent, filename) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// Report actions
function viewReportDetail(reportId) {
    const report = currentReportsData?.find(r => r.id === reportId);
    if (report) {
        const detailWindow = window.open('', '_blank', 'width=800,height=600');
        detailWindow.document.write(`
            <html>
                <head>
                    <title>Detail Laporan - ${report.className}</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; }
                        .header { background: #1e3c72; color: white; padding: 20px; margin: -20px -20px 20px -20px; }
                        .subject { background: #f8f9fa; padding: 15px; margin: 10px 0; border-left: 4px solid #1e3c72; }
                        .status { padding: 5px 10px; border-radius: 15px; font-size: 12px; }
                        .present { background: #d4edda; color: #155724; }
                        .late { background: #fff3cd; color: #856404; }
                        .absent { background: #f8d7da; color: #721c24; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>Laporan Kehadiran</h1>
                        <p>Tanggal: ${new Date(report.date).toLocaleDateString('id-ID')}</p>
                        <p>Kelas: ${report.className}</p>
                        <p>Dikirim oleh: ${report.submittedBy}</p>
                    </div>
                    <h2>Mata Pelajaran</h2>
                    ${report.subjects.map(subject => `
                        <div class="subject">
                            <h3>${subject.name}</h3>
                            <p><strong>Guru:</strong> ${subject.teacher}</p>
                            <p><strong>Waktu:</strong> ${subject.startTime} - ${subject.endTime}</p>
                            <p><strong>Status:</strong> <span class="status ${subject.attendance}">${getAttendanceLabel(subject.attendance)}</span></p>
                            ${subject.notes ? `<p><strong>Catatan:</strong> ${subject.notes}</p>` : ''}
                        </div>
                    `).join('')}
                    ${report.notes ? `<h2>Catatan Umum</h2><p>${report.notes}</p>` : ''}
                </body>
            </html>
        `);
    }
}

function exportSingleReport(reportId) {
    const report = currentReportsData?.find(r => r.id === reportId);
    if (report) {
        const csvContent = generateReportsCSV([report]);
        downloadCSV(csvContent, `laporan-${report.className}-${report.date}.csv`);
    }
}

// Logout
function logout() {
    if (confirm('Apakah Anda yakin ingin logout?')) {
        localStorage.removeItem('adminAuth');
        localStorage.removeItem('adminUser');
        window.location.href = 'index.html';
    }
}

// Deep Analysis Functions

// Load deep analysis data
async function loadDeepAnalysis() {
    const startDate = document.getElementById('startDate')?.value || '';
    const endDate = document.getElementById('endDate')?.value || '';
    const teacher = document.getElementById('deepAnalysisTeacher')?.value || '';
    const className = document.getElementById('deepAnalysisClass')?.value || '';
    
    // Show loading states
    showAnalysisLoading();
    
    try {
        // Load teacher analysis
        const teacherParams = new URLSearchParams();
        if (startDate) teacherParams.append('startDate', startDate);
        if (endDate) teacherParams.append('endDate', endDate);
        if (teacher) teacherParams.append('teacher', teacher);
        if (className) teacherParams.append('className', className);
        
        const teacherResponse = await fetch(`${API_BASE}/deep-analysis/teachers?${teacherParams}`);
        teacherAnalysisData = await teacherResponse.json();
        
        // Load class analysis
        const classParams = new URLSearchParams();
        if (startDate) classParams.append('startDate', startDate);
        if (endDate) classParams.append('endDate', endDate);
        if (className) classParams.append('className', className);
        
        const classResponse = await fetch(`${API_BASE}/deep-analysis/classes?${classParams}`);
        classAnalysisData = await classResponse.json();
        
        // Load detailed data
        const detailedParams = new URLSearchParams();
        if (startDate) detailedParams.append('startDate', startDate);
        if (endDate) detailedParams.append('endDate', endDate);
        if (teacher) detailedParams.append('teacher', teacher);
        if (className) detailedParams.append('className', className);
        
        const detailedResponse = await fetch(`${API_BASE}/deep-analysis/detailed?${detailedParams}`);
        detailedAnalysisData = await detailedResponse.json();
        
        // Update displays
        updateAnalysisSummary();
        displayTeacherAnalysis();
        displayClassAnalysis();
        displayDetailedTable();
        
    } catch (error) {
        console.error('Error loading deep analysis:', error);
        showAnalysisError();
    }
}

// Show loading states
function showAnalysisLoading() {
    const containers = [
        'teacherAnalysisGrid',
        'classAnalysisGrid',
        'detailedAnalysisTableBody'
    ];
    
    containers.forEach(containerId => {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <div class="analysis-loading">
                    <i class="fas fa-spinner"></i>
                    Memuat data analisis...
                </div>
            `;
        }
    });
}

// Show error states
function showAnalysisError() {
    const containers = [
        'teacherAnalysisGrid',
        'classAnalysisGrid',
        'detailedAnalysisTableBody'
    ];
    
    containers.forEach(containerId => {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <div class="analysis-empty">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Gagal memuat data analisis</p>
                </div>
            `;
        }
    });
}

// Update analysis summary
function updateAnalysisSummary() {
    const totalTeachers = teacherAnalysisData.length;
    const totalClasses = classAnalysisData.length;
    const totalReports = detailedAnalysisData.length;
    
    // Calculate overall attendance rate
    let totalPresent = 0;
    let totalAll = 0;
    
    teacherAnalysisData.forEach(teacher => {
        totalPresent += teacher.present;
        totalAll += teacher.total;
    });
    
    const overallRate = totalAll > 0 ? Math.round((totalPresent / totalAll) * 100) : 0;
    
    document.getElementById('totalTeachersAnalyzed').textContent = totalTeachers;
    document.getElementById('totalClassesAnalyzed').textContent = totalClasses;
    document.getElementById('totalReportsAnalyzed').textContent = totalReports;
    document.getElementById('overallAttendanceRate').textContent = `${overallRate}%`;
}

// Display teacher analysis
function displayTeacherAnalysis() {
    const container = document.getElementById('teacherAnalysisGrid');
    
    if (teacherAnalysisData.length === 0) {
        container.innerHTML = `
            <div class="analysis-empty">
                <i class="fas fa-user-times"></i>
                <p>Tidak ada data guru untuk periode yang dipilih</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = teacherAnalysisData.map(teacher => `
        <div class="teacher-analysis-card">
            <div class="teacher-card-header">
                <div>
                    <div class="teacher-name">${teacher.teacher}</div>
                    <div class="teacher-subjects">${teacher.subjects.join(', ')}</div>
                </div>
                <div class="attendance-rate ${getAttendanceRateClass(teacher.presentPercentage)}">
                    ${teacher.presentPercentage}%
                </div>
            </div>
            <div class="attendance-breakdown">
                <div class="breakdown-item present">
                    <div class="breakdown-number present">${teacher.present}</div>
                    <div class="breakdown-label">Hadir</div>
                </div>
                <div class="breakdown-item late">
                    <div class="breakdown-number late">${teacher.late}</div>
                    <div class="breakdown-label">Terlambat</div>
                </div>
                <div class="breakdown-item absent">
                    <div class="breakdown-number absent">${teacher.absent}</div>
                    <div class="breakdown-label">Tidak Hadir</div>
                </div>
            </div>
            <div class="teacher-meta">
                <small>Kelas: ${teacher.classes.join(', ')}</small><br>
                <small>Periode: ${formatDate(teacher.firstReport)} - ${formatDate(teacher.lastReport)}</small>
            </div>
        </div>
    `).join('');
}

// Display class analysis
function displayClassAnalysis() {
    const container = document.getElementById('classAnalysisGrid');
    
    if (classAnalysisData.length === 0) {
        container.innerHTML = `
            <div class="analysis-empty">
                <i class="fas fa-school"></i>
                <p>Tidak ada data kelas untuk periode yang dipilih</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = classAnalysisData.map(classData => `
        <div class="class-analysis-card">
            <div class="class-card-header">
                <div>
                    <div class="class-name">${classData.className}</div>
                    <div class="class-representatives">Perwakilan: ${classData.representatives.join(', ')}</div>
                </div>
                <div class="compliance-rate ${getComplianceRateClass(classData.complianceRate)}">
                    ${classData.complianceRate}%
                </div>
            </div>
            <div class="class-stats">
                <div class="class-stat-item">
                    <div class="class-stat-number">${classData.totalReports}</div>
                    <div class="class-stat-label">Total Laporan</div>
                </div>
                <div class="class-stat-item">
                    <div class="class-stat-number">${classData.uniqueReportDates}</div>
                    <div class="class-stat-label">Hari Aktif</div>
                </div>
                <div class="class-stat-item">
                    <div class="class-stat-number">${classData.avgSubjectsPerReport}</div>
                    <div class="class-stat-label">Rata-rata Mapel</div>
                </div>
                <div class="class-stat-item">
                    <div class="class-stat-number">${classData.expectedReports}</div>
                    <div class="class-stat-label">Target Laporan</div>
                </div>
            </div>
            <div class="class-meta">
                <small>Periode: ${formatDate(classData.firstReport)} - ${formatDate(classData.lastReport)}</small>
            </div>
        </div>
    `).join('');
}

// Display detailed table
function displayDetailedTable() {
    const tbody = document.getElementById('detailedAnalysisTableBody');
    
    if (detailedAnalysisData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; padding: 2rem;">
                    <i class="fas fa-table" style="font-size: 2rem; color: #ccc; margin-bottom: 1rem;"></i><br>
                    Tidak ada data untuk periode yang dipilih
                </td>
            </tr>
        `;
        return;
    }
    
    // Group data by teacher and subject
    const groupedData = {};
    detailedAnalysisData.forEach(record => {
        const key = `${record.teacher_name}_${record.subject_name}_${record.class_name}`;
        if (!groupedData[key]) {
            groupedData[key] = {
                teacher: record.teacher_name,
                subject: record.subject_name,
                className: record.class_name,
                present: 0,
                late: 0,
                absent: 0,
                total: 0,
                lastReport: record.report_date
            };
        }
        
        groupedData[key][record.attendance_status]++;
        groupedData[key].total++;
        
        if (record.report_date > groupedData[key].lastReport) {
            groupedData[key].lastReport = record.report_date;
        }
    });
    
    const tableData = Object.values(groupedData).map(data => {
        data.presentPercentage = data.total > 0 ? Math.round((data.present / data.total) * 100) : 0;
        return data;
    });
    
    tbody.innerHTML = tableData.map(data => `
        <tr>
            <td>${data.teacher}</td>
            <td>${data.subject}</td>
            <td>${data.className}</td>
            <td>${data.total}</td>
            <td>${data.present}</td>
            <td>${data.late}</td>
            <td>${data.absent}</td>
            <td class="percentage-cell table-percentage-${getPercentageClass(data.presentPercentage)}">${data.presentPercentage}%</td>
            <td>${formatDate(data.lastReport)}</td>
        </tr>
    `).join('');
}

// Sort teacher analysis
function sortTeacherAnalysis(criteria) {
    if (criteria === 'attendance') {
        teacherAnalysisData.sort((a, b) => b.presentPercentage - a.presentPercentage);
    } else if (criteria === 'name') {
        teacherAnalysisData.sort((a, b) => a.teacher.localeCompare(b.teacher));
    }
    displayTeacherAnalysis();
}

// Sort class analysis
function sortClassAnalysis(criteria) {
    if (criteria === 'compliance') {
        classAnalysisData.sort((a, b) => b.complianceRate - a.complianceRate);
    } else if (criteria === 'reports') {
        classAnalysisData.sort((a, b) => b.totalReports - a.totalReports);
    }
    displayClassAnalysis();
}

// Filter detailed table
function filterDetailedTable() {
    const searchTerm = document.getElementById('searchDetailedData').value.toLowerCase();
    const rows = document.querySelectorAll('#detailedAnalysisTableBody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        if (text.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Sort table by column
function sortTable(columnIndex) {
    const table = document.getElementById('detailedAnalysisTable');
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    
    const isNumeric = columnIndex >= 3 && columnIndex <= 7;
    
    rows.sort((a, b) => {
        const aValue = a.cells[columnIndex].textContent.trim();
        const bValue = b.cells[columnIndex].textContent.trim();
        
        if (isNumeric) {
            return parseFloat(bValue) - parseFloat(aValue);
        } else {
            return aValue.localeCompare(bValue);
        }
    });
    
    rows.forEach(row => tbody.appendChild(row));
}

// Export functions
async function exportRekapitulasi() {
    try {
        const startDate = document.getElementById('startDate')?.value || '';
        const endDate = document.getElementById('endDate')?.value || '';
        const teacher = document.getElementById('deepAnalysisTeacher')?.value || '';
        const className = document.getElementById('deepAnalysisClass')?.value || '';
        
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        if (teacher) params.append('teacher', teacher);
        if (className) params.append('className', className);
        
        const response = await fetch(`${API_BASE}/deep-analysis/detailed?${params}`);
        const data = await response.json();
        
        if (data.length === 0) {
            alert('Tidak ada data untuk diekspor');
            return;
        }
        
        const csvContent = generateRekapitulasiCSV(data);
        downloadCSV(csvContent, `rekapitulasi-kehadiran-${new Date().toISOString().split('T')[0]}.csv`);
        
    } catch (error) {
        console.error('Error exporting rekapitulasi:', error);
        alert('Gagal mengekspor data');
    }
}

function exportDetailedReport() {
    if (detailedAnalysisData.length === 0) {
        alert('Tidak ada data untuk diekspor');
        return;
    }
    
    const csvContent = generateDetailedReportCSV(detailedAnalysisData);
    downloadCSV(csvContent, `laporan-detail-${new Date().toISOString().split('T')[0]}.csv`);
}

function exportCurrentTable() {
    const table = document.getElementById('detailedAnalysisTable');
    const rows = table.querySelectorAll('tbody tr:not([style*="display: none"])');
    
    if (rows.length === 0) {
        alert('Tidak ada data untuk diekspor');
        return;
    }
    
    const headers = ['Guru', 'Mata Pelajaran', 'Kelas', 'Total Laporan', 'Hadir', 'Terlambat', 'Tidak Hadir', '% Kehadiran', 'Periode Terakhir'];
    const csvRows = [headers];
    
    rows.forEach(row => {
        const cells = Array.from(row.cells).map(cell => cell.textContent.trim());
        csvRows.push(cells);
    });
    
    const csvContent = csvRows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    downloadCSV(csvContent, `tabel-kehadiran-${new Date().toISOString().split('T')[0]}.csv`);
}

function generateRekapitulasiCSV(data) {
    const headers = [
        'Tanggal',
        'Kelas',
        'Guru',
        'Mata Pelajaran',
        'Jam Mulai',
        'Jam Selesai',
        'Status Kehadiran',
        'Catatan Mata Pelajaran',
        'Catatan Laporan',
        'Dilaporkan Oleh'
    ];
    
    const rows = data.map(record => [
        record.report_date,
        record.class_name,
        record.teacher_name,
        record.subject_name,
        record.start_time,
        record.end_time,
        getAttendanceLabel(record.attendance_status),
        record.subject_notes || '',
        record.report_notes || '',
        record.submitted_by
    ]);
    
    return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
}

function generateDetailedReportCSV(data) {
    const headers = [
        'Tanggal',
        'Kelas',
        'Guru',
        'Mata Pelajaran',
        'Status Kehadiran',
        'Jam',
        'Dilaporkan Oleh'
    ];
    
    const rows = data.map(record => [
        record.report_date,
        record.class_name,
        record.teacher_name,
        record.subject_name,
        getAttendanceLabel(record.attendance_status),
        `${record.start_time} - ${record.end_time}`,
        record.submitted_by
    ]);
    
    return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
}

// Helper functions
function getAttendanceRateClass(percentage) {
    if (percentage >= 80) return 'high';
    if (percentage >= 60) return 'medium';
    return 'low';
}

function getComplianceRateClass(percentage) {
    if (percentage >= 80) return 'high';
    if (percentage >= 60) return 'medium';
    return 'low';
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('id-ID');
}