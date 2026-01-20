// Global variables
let currentRole = 'teacher';

// Navigation functions
function scrollToSection(sectionId) {
    document.getElementById(sectionId).scrollIntoView({
        behavior: 'smooth'
    });
}

// Modal functions
function openLoginModal() {
    document.getElementById('loginModal').style.display = 'block';
}

function closeLoginModal() {
    document.getElementById('loginModal').style.display = 'none';
}

// Password toggle functionality
function togglePasswordVisibility() {
    const passwordInput = document.getElementById('password');
    const toggleIcon = document.getElementById('passwordToggleIcon');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.classList.remove('fa-eye');
        toggleIcon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        toggleIcon.classList.remove('fa-eye-slash');
        toggleIcon.classList.add('fa-eye');
    }
}

// Role selection
function selectRole(role) {
    currentRole = role;
    const roleButtons = document.querySelectorAll('.role-btn');
    roleButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.role === role) {
            btn.classList.add('active');
        }
    });
}

// Check if username is a class name (representative)
function isClassUsername(username) {
    // Pattern for class names: X.1-X.12, XI.1-XI.12, XII.GBIM.1-5, XII.EBIM.1-3, XII.SBIM.1-5
    const classPatterns = [
        /^X\.\d{1,2}$/,           // X.1 to X.12
        /^XI\.\d{1,2}$/,          // XI.1 to XI.12
        /^XII\.GBIM\.[1-5]$/,     // XII.GBIM.1 to XII.GBIM.5
        /^XII\.EBIM\.[1-3]$/,     // XII.EBIM.1 to XII.EBIM.3
        /^XII\.SBIM\.[1-5]$/      // XII.SBIM.1 to XII.SBIM.5
    ];
    
    return classPatterns.some(pattern => pattern.test(username));
}

// Login handling
async function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    // Validate input
    if (!username || !password) {
        alert('Mohon isi semua field yang diperlukan');
        return;
    }
    
    // Check if password is correct
    if (password !== 'berhias') {
        alert('Password Salah!');
        return;
    }
    
    // Determine redirect based on username
    let redirectUrl = '';
    let userRole = '';
    let className = null;
    
    if (username === 'admin') {
        redirectUrl = 'admin-dashboard.html';
        userRole = 'admin';
    } else if (username === 'guru1') {
        redirectUrl = 'teacher-dashboard.html';
        userRole = 'teacher';
    } else if (isClassUsername(username)) {
        redirectUrl = 'representative-dashboard.html';
        userRole = 'representative';
        className = username; // Class name is the same as username
    } else {
        alert('Username tidak dikenali!');
        return;
    }
    
    // Try server authentication first
    try {
        const response = await fetch('http://localhost:3000/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                password: password,
                role: userRole
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Store user session from server response
            localStorage.setItem('userRole', result.user.role);
            localStorage.setItem('username', result.user.username);
            localStorage.setItem('isLoggedIn', 'true');
            
            // Store class name for representatives
            if (result.user.className) {
                localStorage.setItem('className', result.user.className);
            }
            
            // Store admin flag for admin users
            if (result.user.role === 'admin') {
                localStorage.setItem('adminAuth', 'true');
                localStorage.setItem('adminUser', result.user.username);
            }
            
            // Redirect to appropriate dashboard
            window.location.href = redirectUrl;
        } else {
            alert('Login gagal. Silakan coba lagi.');
        }
    } catch (error) {
        console.error('Server login error:', error);
        
        // Fallback to client-side authentication
        // Store user session
        localStorage.setItem('userRole', userRole);
        localStorage.setItem('username', username);
        localStorage.setItem('isLoggedIn', 'true');
        
        if (className) {
            localStorage.setItem('className', className);
        }
        
        if (userRole === 'admin') {
            localStorage.setItem('adminAuth', 'true');
            localStorage.setItem('adminUser', username);
        }
        
        // Redirect to appropriate dashboard
        window.location.href = redirectUrl;
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('loginModal');
    if (event.target === modal) {
        closeLoginModal();
    }
}

// Smooth scrolling for navigation links
document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            scrollToSection(targetId);
        });
    });
});

// Check if user is already logged in
function checkLoginStatus() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const userRole = localStorage.getItem('userRole');
    const username = localStorage.getItem('username');
    
    if (isLoggedIn === 'true' && userRole && username) {
        // Update login button to show user status
        const loginBtn = document.querySelector('.login-btn');
        loginBtn.innerHTML = `<i class="fas fa-user"></i> ${username}`;
        loginBtn.onclick = function() {
            // Redirect based on user role
            if (userRole === 'admin') {
                window.location.href = 'admin-dashboard.html';
            } else if (userRole === 'teacher') {
                window.location.href = 'teacher-dashboard.html';
            } else if (userRole === 'representative') {
                window.location.href = 'representative-dashboard.html';
            }
        };
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    checkLoginStatus();
});