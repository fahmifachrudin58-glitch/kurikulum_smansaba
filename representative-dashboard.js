// Representative Dashboard JavaScript

// Global variables
let attendanceReports = JSON.parse(localStorage.getItem('attendanceReports')) || [];
let currentSection = 'overview';
let subjectCounter = 0;
let manualSubjectCounter = 0;
let currentDay = 1; // Monday
let classSchedule = {};
let todaySchedule = [];
const API_BASE = 'http://localhost:3000/api';

// Real school data
const SCHOOL_SUBJECTS = [
    { code: 'SEJ', name: 'Sejarah' },
    { code: 'SOS', name: 'Sosiologi' },
    { code: 'FIS', name: 'Fisika' },
    { code: 'MAT TL', name: 'Matematika Tingkat Lanjut' },
    { code: 'MAT', name: 'Matematika Umum' },
    { code: 'KIM', name: 'Kimia' },
    { code: 'PP', name: 'Pancasila' },
    { code: 'PAIBP', name: 'Agama' },
    { code: 'GEO', name: 'Geografi' },
    { code: 'INF', name: 'Informatika' },
    { code: 'IND', name: 'Bahasa Indonesia' },
    { code: 'SB', name: 'Seni Budaya' },
    { code: 'PJOK', name: 'Olahraga' },
    { code: 'BIO', name: 'Biologi' },
    { code: 'BK', name: 'Bimbingan Konseling' },
    { code: 'SUN', name: 'Bahasa Sunda' }
];

const SCHOOL_TEACHERS = [
    'Deni Kusumawardani, S.Pd.',
    'Gilang Cahya Gumilar, S.E.',
    'Aam Amilasari, S.Pd.',
    'Tuti Ella Maryati, S.Pd.',
    'Yeti Sumiati, S.Pd.',
    'Pepen Supendi, S.Pd., M.M.',
    'Drs. M. Cucu Ansorulloh, M.Pd.',
    'Eneng Hesti, S.Pd.',
    'Fahmi Alizar Nur Fachrudin, S.Pd.',
    'Idvan Aprizal Bintara, S.Pd., M.Pd.',
    'Leli Septiani, S.Pd.',
    'Mamat Rahmat, S.Pd.',
    'Nisha Hanifatul Fauziah, S.Pd.',
    'Novi Kartiani, S.Pd.',
    'Riska Meylia Eriani, S.Pd.',
    'Yakinthan Bathin R, S.Pd.',
    'Silmi Faris, S.Pd.',
    'Kartika Andriani, S.Pd.',
    'Napiin Nurohman, S.Pd.',
    'Muhammad Heru Haerudin, S.Pd.',
    'Susilawati, S.Pd.',
    'Fuji Novia, S.Pd.',
    'Deny Rahman Samsyu, S.Pd.',
    'Nuryani, S.Pd.I',
    'Virda Ayu Purwanti, S.Pd.',
    'Dadan Darsono, S.Pd.',
    'Fery Insan Firdaus, S.Pd.',
    'Rudi, S.Si.'
];

const CLASS_PERIODS = [
    { period: 1, time: '06:30-07:15', label: 'Jam 1 (06:30-07:15)' },
    { period: 2, time: '07:15-08:00', label: 'Jam 2 (07:15-08:00)' },
    { period: 3, time: '08:00-08:45', label: 'Jam 3 (08:00-08:45)' },
    { period: 4, time: '08:45-09:30', label: 'Jam 4 (08:45-09:30)' },
    { period: 5, time: '09:45-10:30', label: 'Jam 5 (09:45-10:30)' },
    { period: 6, time: '10:30-11:15', label: 'Jam 6 (10:30-11:15)' },
    { period: 7, time: '11:15-12:00', label: 'Jam 7 (11:15-12:00)' },
    { period: 8, time: '12:45-13:30', label: 'Jam 8 (12:45-13:30)' },
    { period: 9, time: '13:30-14:15', label: 'Jam 9 (13:30-14:15)' },
    { period: 10, time: '14:15-15:00', label: 'Jam 10 (14:15-15:00)' }
];

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    initializeDashboard();
    setupEventListeners();
    updateStats();
    loadReports();
    loadClassSchedule();
});

// Authentication check
function checkAuth() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const userRole = localStorage.getItem('userRole');
    
    if (isLoggedIn !== 'true' || userRole !== 'representative') {
        window.location.href = 'index.html';
        return;
    }
    
    // Set representative name
    const username = localStorage.getItem('username');
    document.getElementById('repName').textContent = username || 'Perwakilan Kelas';
}

// Initialize dashboard
function initializeDashboard() {
    // Set current date for report
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('reportDate');
    if (dateInput) {
        dateInput.value = today;
    }
    
    // Set class name from user data
    const className = localStorage.getItem('className') || 'XII IPA 1';
    document.getElementById('className').textContent = className;
    
    // Set class info in form
    const classInfoInput = document.getElementById('classInfo');
    if (classInfoInput) {
        classInfoInput.value = className;
    }
    
    // Load today's schedule for attendance form
    loadTodaySchedule();
}

// Setup event listeners
function setupEventListeners() {
    // Attendance form
    const attendanceForm = document.getElementById('attendanceForm');
    if (attendanceForm) {
        attendanceForm.addEventListener('submit', handleAttendanceSubmit);
    }
    
    // Schedule form
    const scheduleForm = document.getElementById('scheduleForm');
    if (scheduleForm) {
        scheduleForm.addEventListener('submit', handleScheduleSubmit);
    }
    
    // Filter listeners
    const filterMonth = document.getElementById('filterMonth');
    const filterYear = document.getElementById('filterYear');
    
    if (filterMonth) {
        filterMonth.addEventListener('change', filterReports);
    }
    
    if (filterYear) {
        filterYear.addEventListener('change', filterReports);
    }
    
    // Date change listener for attendance form
    const reportDateInput = document.getElementById('reportDate');
    if (reportDateInput) {
        reportDateInput.addEventListener('change', loadScheduleForDate);
    }
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
    if (sectionId === 'schedule') {
        loadSchedule();
    } else if (sectionId === 'report') {
        loadTodaySchedule();
    }
}

// Schedule Management Functions

// Switch between days in schedule form
function switchDay(dayOfWeek) {
    currentDay = dayOfWeek;
    
    // Update active tab
    document.querySelectorAll('.day-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-day="${dayOfWeek}"]`).classList.add('active');
    
    // Update day name
    const dayNames = ['', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
    document.getElementById('currentDayName').textContent = dayNames[dayOfWeek];
    
    // Load subjects for this day
    loadDaySubjects(dayOfWeek);
}

// Load subjects for a specific day
function loadDaySubjects(dayOfWeek) {
    const subjectsList = document.getElementById('subjectsList');
    const daySchedule = classSchedule[dayOfWeek] || [];
    
    if (daySchedule.length === 0) {
        subjectsList.innerHTML = `
            <div class="empty-schedule">
                <i class="fas fa-calendar-plus"></i>
                <p>Belum ada mata pelajaran untuk hari ini</p>
                <p>Klik "Tambah Mata Pelajaran" untuk menambah jadwal</p>
            </div>
        `;
        return;
    }
    
    subjectsList.innerHTML = daySchedule.map((subject, index) => `
        <div class="schedule-subject-item" data-index="${index}">
            <div class="schedule-subject-header">
                <div class="subject-inputs">
                    <select class="subject-dropdown" onchange="updateScheduleSubject(${dayOfWeek}, ${index}, 'subjectName', this.value)" required>
                        <option value="">Pilih Mata Pelajaran</option>
                        ${SCHOOL_SUBJECTS.map(subj => `
                            <option value="${subj.code}" ${subject.subjectName === subj.code ? 'selected' : ''}>
                                ${subj.code} - ${subj.name}
                            </option>
                        `).join('')}
                    </select>
                    <select class="teacher-dropdown" onchange="updateScheduleSubject(${dayOfWeek}, ${index}, 'teacherName', this.value)" required>
                        <option value="">Pilih Guru</option>
                        ${SCHOOL_TEACHERS.map(teacher => `
                            <option value="${teacher}" ${subject.teacherName === teacher ? 'selected' : ''}>
                                ${teacher}
                            </option>
                        `).join('')}
                    </select>
                    <select class="period-dropdown" onchange="updateScheduleSubjectPeriod(${dayOfWeek}, ${index}, this.value)" required>
                        <option value="">Pilih Jam</option>
                        ${CLASS_PERIODS.map(period => `
                            <option value="${period.period}" ${subject.period == period.period ? 'selected' : ''}>
                                ${period.label}
                            </option>
                        `).join('')}
                    </select>
                </div>
                <button type="button" class="remove-schedule-subject" onclick="removeScheduleSubject(${dayOfWeek}, ${index})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// Add new subject to schedule
function addScheduleSubject() {
    if (!classSchedule[currentDay]) {
        classSchedule[currentDay] = [];
    }
    
    classSchedule[currentDay].push({
        subjectName: '',
        teacherName: '',
        period: '',
        startTime: '',
        endTime: ''
    });
    
    loadDaySubjects(currentDay);
}

// Update schedule subject data
function updateScheduleSubject(dayOfWeek, index, field, value) {
    if (classSchedule[dayOfWeek] && classSchedule[dayOfWeek][index]) {
        classSchedule[dayOfWeek][index][field] = value;
    }
}

// Update schedule subject period and auto-fill times
function updateScheduleSubjectPeriod(dayOfWeek, index, periodValue) {
    if (classSchedule[dayOfWeek] && classSchedule[dayOfWeek][index]) {
        const period = CLASS_PERIODS.find(p => p.period == periodValue);
        if (period) {
            const [startTime, endTime] = period.time.split('-');
            classSchedule[dayOfWeek][index].period = periodValue;
            classSchedule[dayOfWeek][index].startTime = startTime;
            classSchedule[dayOfWeek][index].endTime = endTime;
        }
    }
}

// Remove schedule subject
function removeScheduleSubject(dayOfWeek, index) {
    if (classSchedule[dayOfWeek]) {
        classSchedule[dayOfWeek].splice(index, 1);
        loadDaySubjects(dayOfWeek);
    }
}

// Load class schedule from server
async function loadClassSchedule() {
    const className = localStorage.getItem('className') || 'XII IPA 1';
    
    try {
        const response = await fetch(`${API_BASE}/class-schedules/${encodeURIComponent(className)}`);
        const schedules = await response.json();
        
        // Organize schedules by day
        classSchedule = {};
        schedules.forEach(schedule => {
            if (!classSchedule[schedule.day_of_week]) {
                classSchedule[schedule.day_of_week] = [];
            }
            
            // Find the period based on start time
            const period = CLASS_PERIODS.find(p => p.time.startsWith(schedule.start_time));
            
            classSchedule[schedule.day_of_week].push({
                subjectName: schedule.subject_name,
                teacherName: schedule.teacher_name,
                startTime: schedule.start_time,
                endTime: schedule.end_time,
                period: period ? period.period : ''
            });
        });
        
        // Sort subjects by period within each day
        Object.keys(classSchedule).forEach(day => {
            classSchedule[day].sort((a, b) => (a.period || 999) - (b.period || 999));
        });
        
        // Update overview schedule display
        updateOverviewSchedule();
        
    } catch (error) {
        console.error('Error loading class schedule:', error);
        classSchedule = {};
    }
}

// Load schedule for current section
function loadSchedule() {
    // Load current day subjects
    loadDaySubjects(currentDay);
    
    // Update weekly schedule display
    updateWeeklyScheduleDisplay();
}

// Update weekly schedule display
function updateWeeklyScheduleDisplay() {
    const scheduleWeek = document.getElementById('scheduleWeek');
    const dayNames = ['', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
    
    scheduleWeek.innerHTML = dayNames.slice(1).map((dayName, index) => {
        const dayOfWeek = index + 1;
        const daySchedule = classSchedule[dayOfWeek] || [];
        
        return `
            <div class="schedule-day-card">
                <div class="schedule-day-name">${dayName}</div>
                <div class="schedule-day-subjects">
                    ${daySchedule.length > 0 ? 
                        daySchedule.map(subject => {
                            const subjectData = SCHOOL_SUBJECTS.find(s => s.code === subject.subjectName);
                            const subjectDisplayName = subjectData ? `${subjectData.code} - ${subjectData.name}` : subject.subjectName;
                            
                            return `
                                <div class="schedule-subject">
                                    <div class="schedule-subject-name">${subjectDisplayName}</div>
                                    <div class="schedule-subject-teacher">${subject.teacherName}</div>
                                    <div class="schedule-subject-time">${subject.startTime} - ${subject.endTime}</div>
                                </div>
                            `;
                        }).join('') :
                        '<div style="color: #999; font-style: italic;">Belum ada jadwal</div>'
                    }
                </div>
            </div>
        `;
    }).join('');
}

// Handle schedule form submission
async function handleAttendanceSubmit(e) {
    e.preventDefault();
    
    // Ambil data dasar
    const className = localStorage.getItem('username'); // Misal: X.1
    const subjectItems = document.querySelectorAll('.today-subject-item, .subject-item');
    
    if (subjectItems.length === 0) {
        alert('Tidak ada data untuk disimpan.');
        return;
    }

    let successCount = 0;

    // Proses kirim data per mata pelajaran
    for (let item of subjectItems) {
        const isManual = item.classList.contains('subject-item');
        
        // Ambil status (Hadir/Terlambat/Absen)
        const statusRadio = item.querySelector('input[type="radio"]:checked');
        if (!statusRadio) continue; // Lewati jika belum dipilih

        const data = {
            class_name: className,
            teacher_name: isManual ? item.querySelector('.subject-teacher').value : item.querySelector('.today-subject-teacher').textContent,
            subject: isManual ? item.querySelector('.subject-name').value : item.querySelector('.today-subject-name').textContent,
            period: isManual ? item.querySelector('.subject-period').value : item.querySelector('.today-subject-time').textContent,
            status: statusRadio.value
        };

        try {
            const response = await fetch(`${API_BASE}/save-attendance`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            if (result.success) successCount++;
        } catch (error) {
            console.error('Koneksi ke server gagal:', error);
        }
    }

    if (successCount > 0) {
        alert(`Berhasil! ${successCount} data kehadiran tersimpan.`);
        window.location.reload(); // Segarkan halaman
    } else {
        alert('Gagal menyimpan. Pastikan semua status kehadiran sudah dipilih.');
    }
}

// Load today's schedule for attendance form
async function loadTodaySchedule() {
    const className = localStorage.getItem('className') || 'XII IPA 1';
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    try {
        const response = await fetch(`${API_BASE}/class-schedules/${encodeURIComponent(className)}/today`);
        const schedule = await response.json();
        
        todaySchedule = schedule;
        displayTodaySchedule(schedule);
        
    } catch (error) {
        console.error('Error loading today schedule:', error);
        displayTodaySchedule([]);
    }
}

// Load schedule for specific date
async function loadScheduleForDate() {
    const selectedDate = document.getElementById('reportDate').value;
    const className = localStorage.getItem('className') || 'XII IPA 1';
    
    if (!selectedDate) return;
    
    const date = new Date(selectedDate);
    const dayOfWeek = date.getDay();
    
    try {
        const response = await fetch(`${API_BASE}/class-schedules/${encodeURIComponent(className)}/day/${dayOfWeek}`);
        const schedule = await response.json();
        
        todaySchedule = schedule;
        displayTodaySchedule(schedule);
        
    } catch (error) {
        console.error('Error loading schedule for date:', error);
        displayTodaySchedule([]);
    }
}

// Display today's schedule in attendance form
function displayTodaySchedule(schedule) {
    const scheduleStatus = document.getElementById('scheduleStatus');
    const todaySubjectsGrid = document.getElementById('todaySubjectsGrid');
    
    if (schedule.length === 0) {
        scheduleStatus.className = 'schedule-status no-schedule';
        scheduleStatus.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <span>Tidak ada jadwal untuk hari ini. <a href="#" onclick="showSection('schedule')">Atur jadwal terlebih dahulu</a></span>
        `;
        
        todaySubjectsGrid.innerHTML = `
            <div class="empty-schedule">
                <i class="fas fa-calendar-times"></i>
                <p>Tidak ada mata pelajaran terjadwal untuk hari ini</p>
                <button class="setup-schedule-btn" onclick="showSection('schedule')">
                    <i class="fas fa-calendar-plus"></i>
                    Atur Jadwal Kelas
                </button>
            </div>
        `;
        return;
    }
    
    scheduleStatus.className = 'schedule-status';
    scheduleStatus.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>Ditemukan ${schedule.length} mata pelajaran untuk hari ini</span>
    `;
    
    todaySubjectsGrid.innerHTML = schedule.map((subject, index) => {
        // Get full subject name
        const subjectData = SCHOOL_SUBJECTS.find(s => s.code === subject.subject_name);
        const subjectDisplayName = subjectData ? `${subjectData.code} - ${subjectData.name}` : subject.subject_name;
        
        return `
            <div class="today-subject-item" data-schedule-id="${subject.id}">
                <div class="today-subject-header">
                    <div class="today-subject-info">
                        <div class="today-subject-name">${subjectDisplayName}</div>
                        <div class="today-subject-teacher">${subject.teacher_name}</div>
                        <div class="today-subject-time">${subject.start_time} - ${subject.end_time}</div>
                    </div>
                </div>
                <div class="today-attendance-options">
                    <div class="today-attendance-option present">
                        <input type="radio" id="today-present-${index}" name="today-attendance-${index}" value="present" required>
                        <label for="today-present-${index}">
                            <i class="fas fa-check"></i>
                            Hadir
                        </label>
                    </div>
                    <div class="today-attendance-option late">
                        <input type="radio" id="today-late-${index}" name="today-attendance-${index}" value="late" required>
                        <label for="today-late-${index}">
                            <i class="fas fa-clock"></i>
                            Terlambat
                        </label>
                    </div>
                    <div class="today-attendance-option absent">
                        <input type="radio" id="today-absent-${index}" name="today-attendance-${index}" value="absent" required>
                        <label for="today-absent-${index}">
                            <i class="fas fa-times"></i>
                            Tidak Hadir
                        </label>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Toggle manual entry section
function toggleManualEntry() {
    const manualSection = document.getElementById('manualSubjectsGrid');
    const addManualBtn = document.getElementById('addManualBtn');
    const toggleBtn = document.querySelector('.toggle-manual-btn');
    
    if (manualSection.style.display === 'none') {
        manualSection.style.display = 'block';
        addManualBtn.style.display = 'block';
        toggleBtn.innerHTML = '<i class="fas fa-minus"></i> Sembunyikan Entry Manual';
        
        // Add first manual subject if none exists
        if (manualSection.children.length === 0) {
            addManualSubject();
        }
    } else {
        manualSection.style.display = 'none';
        addManualBtn.style.display = 'none';
        toggleBtn.innerHTML = '<i class="fas fa-plus"></i> Tambah Mata Pelajaran Manual';
    }
}

// Add manual subject
function addManualSubject() {
    manualSubjectCounter++;
    const manualSubjectsGrid = document.getElementById('manualSubjectsGrid');
    
    const subjectHtml = `
        <div class="subject-item" id="manual-subject-${manualSubjectCounter}">
            <div class="subject-header">
                <div class="subject-info">
                    <select class="subject-name" required>
                        <option value="">Pilih Mata Pelajaran</option>
                        ${SCHOOL_SUBJECTS.map(subj => `
                            <option value="${subj.code}">${subj.code} - ${subj.name}</option>
                        `).join('')}
                    </select>
                    <select class="subject-teacher" required>
                        <option value="">Pilih Guru</option>
                        ${SCHOOL_TEACHERS.map(teacher => `
                            <option value="${teacher}">${teacher}</option>
                        `).join('')}
                    </select>
                    <div class="time-inputs">
                        <select class="subject-period" onchange="updateManualSubjectTime(${manualSubjectCounter}, this.value)" required>
                            <option value="">Pilih Jam</option>
                            ${CLASS_PERIODS.map(period => `
                                <option value="${period.period}">${period.label}</option>
                            `).join('')}
                        </select>
                        <input type="hidden" class="subject-start">
                        <input type="hidden" class="subject-end">
                    </div>
                </div>
                <button type="button" class="remove-subject" onclick="removeManualSubject(${manualSubjectCounter})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="attendance-options">
                <div class="attendance-option">
                    <input type="radio" id="manual-present-${manualSubjectCounter}" name="manual-attendance-${manualSubjectCounter}" value="present" required>
                    <label for="manual-present-${manualSubjectCounter}">
                        <i class="fas fa-check-circle" style="color: #28a745;"></i>
                        Hadir
                    </label>
                </div>
                <div class="attendance-option">
                    <input type="radio" id="manual-late-${manualSubjectCounter}" name="manual-attendance-${manualSubjectCounter}" value="late" required>
                    <label for="manual-late-${manualSubjectCounter}">
                        <i class="fas fa-clock" style="color: #ffc107;"></i>
                        Terlambat
                    </label>
                </div>
                <div class="attendance-option">
                    <input type="radio" id="manual-absent-${manualSubjectCounter}" name="manual-attendance-${manualSubjectCounter}" value="absent" required>
                    <label for="manual-absent-${manualSubjectCounter}">
                        <i class="fas fa-times-circle" style="color: #dc3545;"></i>
                        Tidak Hadir
                    </label>
                </div>
            </div>
            <div class="subject-notes">
                <textarea placeholder="Catatan khusus untuk mata pelajaran ini..." rows="2"></textarea>
            </div>
        </div>
    `;
    
    manualSubjectsGrid.insertAdjacentHTML('beforeend', subjectHtml);
}

// Update manual subject time based on period selection
function updateManualSubjectTime(subjectId, periodValue) {
    const period = CLASS_PERIODS.find(p => p.period == periodValue);
    if (period) {
        const [startTime, endTime] = period.time.split('-');
        const subjectElement = document.getElementById(`manual-subject-${subjectId}`);
        if (subjectElement) {
            subjectElement.querySelector('.subject-start').value = startTime;
            subjectElement.querySelector('.subject-end').value = endTime;
        }
    }
}

// Remove manual subject
function removeManualSubject(id) {
    const subjectElement = document.getElementById(`manual-subject-${id}`);
    if (subjectElement) {
        subjectElement.remove();
    }
}

// Handle attendance form submission
async function handleAttendanceSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const reportDate = formData.get('reportDate');
    const classInfo = formData.get('classInfo');
    const notes = formData.get('notes');
    
    // Collect subjects from today's schedule
    const subjects = [];
    
    // Get scheduled subjects
    const todaySubjectItems = document.querySelectorAll('.today-subject-item');
    todaySubjectItems.forEach((item, index) => {
        const scheduleId = item.dataset.scheduleId;
        const attendance = document.querySelector(`input[name="today-attendance-${index}"]:checked`)?.value;
        
        if (attendance && todaySchedule[index]) {
            // Get full subject name for storage
            const subjectData = SCHOOL_SUBJECTS.find(s => s.code === todaySchedule[index].subject_name);
            const subjectDisplayName = subjectData ? `${subjectData.code} - ${subjectData.name}` : todaySchedule[index].subject_name;
            
            subjects.push({
                name: subjectDisplayName,
                teacher: todaySchedule[index].teacher_name,
                startTime: todaySchedule[index].start_time,
                endTime: todaySchedule[index].end_time,
                attendance: attendance,
                notes: ''
            });
        }
    });
    
    // Get manual subjects
    const manualSubjectItems = document.querySelectorAll('#manualSubjectsGrid .subject-item');
    manualSubjectItems.forEach((item, index) => {
        const subjectCode = item.querySelector('.subject-name').value;
        const teacherName = item.querySelector('.subject-teacher').value;
        const startTime = item.querySelector('.subject-start').value;
        const endTime = item.querySelector('.subject-end').value;
        const attendance = item.querySelector('input[type="radio"]:checked')?.value;
        const subjectNotes = item.querySelector('textarea').value;
        
        if (subjectCode && teacherName && startTime && endTime && attendance) {
            // Get full subject name
            const subjectData = SCHOOL_SUBJECTS.find(s => s.code === subjectCode);
            const subjectDisplayName = subjectData ? `${subjectData.code} - ${subjectData.name}` : subjectCode;
            
            subjects.push({
                name: subjectDisplayName,
                teacher: teacherName,
                startTime: startTime,
                endTime: endTime,
                attendance: attendance,
                notes: subjectNotes
            });
        }
    });
    
    if (subjects.length === 0) {
        alert('Mohon pilih status kehadiran untuk minimal satu mata pelajaran.');
        return;
    }
    
    // Submit to server
    try {
        const response = await fetch(`${API_BASE}/attendance-reports`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                date: reportDate,
                className: classInfo,
                subjects: subjects,
                notes: notes,
                submittedBy: localStorage.getItem('username')
            })
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            console.log('Report submitted successfully:', result);
            
            // Store report locally
            const reportData = {
                id: result.reportId,
                date: reportDate,
                class: classInfo,
                subjects: subjects.map(s => ({
                    name: s.name,
                    teacher: s.teacher,
                    attendance: s.attendance,
                    notes: s.notes || ''
                })),
                notes: notes,
                submittedAt: new Date().toISOString()
            };
            
            attendanceReports.push(reportData);
            localStorage.setItem('attendanceReports', JSON.stringify(attendanceReports));
            
            // Reset form
            e.target.reset();
            
            // Reset manual subjects
            document.getElementById('manualSubjectsGrid').innerHTML = '';
            document.getElementById('manualSubjectsGrid').style.display = 'none';
            document.getElementById('addManualBtn').style.display = 'none';
            document.querySelector('.toggle-manual-btn').innerHTML = '<i class="fas fa-plus"></i> Tambah Mata Pelajaran Manual';
            manualSubjectCounter = 0;
            
            // Reload today's schedule
            loadTodaySchedule();
            
            // Update stats and reports
            updateStats();
            loadReports();
            
            // Show success message
            alert(result.message || 'Berhasil Disimpan!');
            
            // Switch to history section
            showSection('history');
        } else {
            console.error('Server error:', result);
            const errorMessage = result.error || 'Terjadi kesalahan saat menyimpan';
            const errorDetails = result.details ? ` (${result.details})` : '';
            alert(`Gagal Menyimpan: ${errorMessage}${errorDetails}`);
        }
    } catch (error) {
        console.error('Error submitting report:', error);
        alert('Gagal Menyimpan: Terjadi kesalahan jaringan. Periksa koneksi internet Anda.');
    }
}

// Update overview schedule display
function updateOverviewSchedule() {
    const scheduleGrid = document.getElementById('scheduleGrid');
    if (!scheduleGrid) return;
    
    const dayNames = ['', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
    
    scheduleGrid.innerHTML = dayNames.slice(1).map((dayName, index) => {
        const dayOfWeek = index + 1;
        const daySchedule = classSchedule[dayOfWeek] || [];
        
        return `
            <div class="schedule-day">
                <div class="day-name">${dayName}</div>
                <div class="day-subjects">
                    ${daySchedule.length > 0 ? 
                        daySchedule.map(subject => {
                            const subjectData = SCHOOL_SUBJECTS.find(s => s.code === subject.subjectName);
                            return subjectData ? subjectData.code : subject.subjectName;
                        }).join('<br>') :
                        '<em>Belum ada jadwal</em>'
                    }
                </div>
            </div>
        `;
    }).join('');
}

// Update statistics
function updateStats() {
    const today = new Date();
    const currentWeek = getWeekNumber(today);
    const currentYear = today.getFullYear();
    
    // Count weekly reports
    const weeklyReports = attendanceReports.filter(report => {
        const reportDate = new Date(report.date);
        return getWeekNumber(reportDate) === currentWeek && reportDate.getFullYear() === currentYear;
    }).length;
    
    document.getElementById('weeklyReports').textContent = weeklyReports;
    document.getElementById('totalReports').textContent = attendanceReports.length;
}

function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

// Load and display reports
function loadReports() {
    const reportsList = document.getElementById('reportsList');
    
    if (attendanceReports.length === 0) {
        reportsList.innerHTML = `
            <div class="no-reports">
                <i class="fas fa-clipboard-list" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
                <p>Belum ada laporan yang dikirim</p>
                <button class="action-btn" onclick="showSection('report')">
                    <i class="fas fa-plus"></i>
                    Buat Laporan Pertama
                </button>
            </div>
        `;
        return;
    }
    
    // Sort reports by date (newest first)
    const sortedReports = [...attendanceReports].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    reportsList.innerHTML = sortedReports.map(report => `
        <div class="report-item" data-month="${new Date(report.date).getMonth() + 1}" data-year="${new Date(report.date).getFullYear()}">
            <div class="report-header">
                <div class="report-date">
                    ${new Date(report.date).toLocaleDateString('id-ID', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                    })}
                </div>
                <div class="report-status status-sent">Terkirim</div>
            </div>
            <div class="report-content">
                <p><strong>Kelas:</strong> ${report.class}</p>
                <p><strong>Jumlah Mata Pelajaran:</strong> ${report.subjects.length}</p>
                <div class="subjects-summary">
                    ${report.subjects.map(subject => `
                        <div class="subject-summary">
                            <span class="subject-name">${subject.name}</span>
                            <span class="subject-teacher">${subject.teacher}</span>
                            <span class="attendance-status status-${subject.attendance}">
                                ${getAttendanceLabel(subject.attendance)}
                            </span>
                        </div>
                    `).join('')}
                </div>
                ${report.notes ? `<p><strong>Catatan:</strong> ${report.notes}</p>` : ''}
                <div class="report-meta">
                    <small>Dikirim: ${new Date(report.submittedAt).toLocaleString('id-ID')}</small>
                </div>
            </div>
        </div>
    `).join('');
}

function getAttendanceLabel(status) {
    const labels = {
        'present': 'Hadir',
        'late': 'Terlambat',
        'absent': 'Tidak Hadir'
    };
    return labels[status] || status;
}

// Filter reports
function filterReports() {
    const filterMonth = document.getElementById('filterMonth').value;
    const filterYear = document.getElementById('filterYear').value;
    
    const reportItems = document.querySelectorAll('.report-item');
    
    reportItems.forEach(item => {
        const itemMonth = item.dataset.month;
        const itemYear = item.dataset.year;
        
        const matchesMonth = !filterMonth || itemMonth === filterMonth;
        const matchesYear = !filterYear || itemYear === filterYear;
        
        if (matchesMonth && matchesYear) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

// Logout
function logout() {
    if (confirm('Apakah Anda yakin ingin logout?')) {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userRole');
        localStorage.removeItem('username');
        localStorage.removeItem('className');
        localStorage.removeItem('adminAuth');
        localStorage.removeItem('adminUser');
        window.location.href = 'index.html';
    }
}