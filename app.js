// EduBridge Application JavaScript

// Global variables
let currentUser = null;
let users = [
  { email: 'shubhamkulkarni2317@gmail.com', password: 'ssk23', role: 'student', name: 'Shubham Kulkarni' },
  { email: 'srdeshmukh@gmail.com', password: 'srd@123', role: 'tutor', name: 'Dr.S R.Deshmukh'}
];

// Modal functions
function showLogin() {
  document.getElementById('login-section').classList.remove('hidden');
  document.getElementById('signup-section').classList.add('hidden');
}

function hideLogin() {
  document.getElementById('login-section').classList.add('hidden');
}

function showSignup() {
  document.getElementById('signup-section').classList.remove('hidden');
  document.getElementById('login-section').classList.add('hidden');
}

function hideSignup() {
  document.getElementById('signup-section').classList.add('hidden');
}

// Login function
// Simplified backend-connected login and signup

async function login() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const role = document.getElementById('role').value;

  if (!email || !password) {
    alert('Please fill in all fields');
    return;
  }

  try {
    const res = await fetch('http://localhost:3000/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role })
    });

    const data = await res.json();

    if (res.ok) {
      alert(`Welcome back, ${data.name}!`);
      // Redirect based on role
      if (role === 'student') {
        window.location.href = 'student.html';
      } else if (role === 'tutor') {
        window.location.href = 'tutor.html';
      }
    } else {
      alert(data.message || 'Invalid credentials');
    }

  } catch (error) {
    console.error('Error:', error);
    alert('Error connecting to server');
  }
}


async function signup() {
  const name = document.getElementById('signup-name').value;
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;
  const role = document.getElementById('signup-role').value;

  if (!name || !email || !password || !role) {
    alert('Please fill all fields');
    return;
  }

  try {
    const res = await fetch('http://localhost:3000/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role })
    });
    const data = await res.json();
    alert(data.message);
  } catch (err) {
    alert('Error connecting to server');
  }
}

// Close modals when clicking outside
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('modal')) {
    hideLogin();
    hideSignup();
  }
});

// Close modals with Escape key
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    hideLogin();
    hideSignup();
  }
});

// Form submission handling
document.addEventListener('DOMContentLoaded', function() {
  // Prevent form submission on Enter
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
    });
  });
  
  // Enter key handling for login
  const loginInputs = document.querySelectorAll('#login-section input');
  loginInputs.forEach(input => {
    input.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        login();
      }
    });
  });
  
  // Enter key handling for signup
  const signupInputs = document.querySelectorAll('#signup-section input');
  signupInputs.forEach(input => {
    input.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        signup();
      }
    });
  });
});

// Utility functions for other pages
function getCurrentUser() {
  return currentUser;
}

function logout() {
  currentUser = null;
  window.location.href = 'index.html';
}

function isLoggedIn() {
  return currentUser !== null;
}

// Animation utilities
function animateCounter(element, start, end, duration) {
  const startTime = performance.now();
  const difference = end - start;
  
  function updateCounter(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const current = Math.floor(start + (difference * progress));
    
    element.textContent = current;
    
    if (progress < 1) {
      requestAnimationFrame(updateCounter);
    }
  }
  
  requestAnimationFrame(updateCounter);
}

// Intersection Observer for animations
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
      
      // Animate counters if they're stat numbers
      if (entry.target.classList.contains('stat')) {
        const counter = entry.target.querySelector('h4');
        const finalValue = parseInt(counter.textContent.replace(/\D/g, ''));
        animateCounter(counter, 0, finalValue, 2000);
      }
    }
  });
}, observerOptions);

// Observe elements when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  const animateElements = document.querySelectorAll('.feature-card, .stat');
  animateElements.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
  });
});

// Smooth scrolling for navigation links
document.addEventListener('DOMContentLoaded', function() {
  const links = document.querySelectorAll('a[href^="#"]');
  links.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
});

// Dynamic loading state for buttons
function showLoading(button) {
  const originalText = button.textContent;
  button.textContent = 'Loading...';
  button.disabled = true;
  
  setTimeout(() => {
    button.textContent = originalText;
    button.disabled = false;
  }, 1000);
}

// Form validation utilities
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function validatePassword(password) {
  return password.length >= 6;
}

// Enhanced login with validation
function enhancedLogin() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const role = document.getElementById('role').value;
  
  // Validation
  if (!email || !password) {
    showNotification('Please fill in all fields', 'error');
    return;
  }
  
  if (!validateEmail(email)) {
    showNotification('Please enter a valid email address', 'error');
    return;
  }
  
  // Show loading state
  const button = event.target;
  showLoading(button);
  
  // Simulate API call
  setTimeout(() => {
    const user = users.find(u => u.email === email && u.password === password && u.role === role);
    
    if (user) {
      currentUser = user;
      showNotification(`Welcome back, ${user.name}!`, 'success');
      hideLogin();
      
      // Redirect based on role
      setTimeout(() => {
        if (role === 'student') {
          window.location.href = 'student.html';
        } else if (role === 'tutor') {
          window.location.href = 'tutor.html';
        }
      }, 1500);
    } else {
      showNotification('Invalid credentials. Try again.', 'error');
    }
  }, 1000);
}

// Notification system
function showNotification(message, type = 'info') {
  // Remove existing notifications
  const existing = document.querySelector('.notification');
  if (existing) {
    existing.remove();
  }
  
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <span>${message}</span>
    <button onclick="this.parentElement.remove()">&times;</button>
  `;
  
  document.body.appendChild(notification);
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 5000);
}

// Add notification styles
const notificationStyles = `
  .notification {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    color: white;
    z-index: 10000;
    display: flex;
    align-items: center;
    gap: 1rem;
    animation: slideInRight 0.3s ease;
    max-width: 400px;
    word-wrap: break-word;
  }
  
  .notification.success {
    background: #28a745;
  }
  
  .notification.error {
    background: #dc3545;
  }
  
  .notification.info {
    background: #17a2b8;
  }
  
  .notification button {
    background: none;
    border: none;
    color: white;
    font-size: 1.2rem;
    cursor: pointer;
    padding: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: background 0.3s ease;
  }
  
  .notification button:hover {
    background: rgba(255,255,255,0.2);
  }
  
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;

// Inject notification styles
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);