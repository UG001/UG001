// Mobile Menu Toggle
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileMenu = document.getElementById('mobileMenu');

mobileMenuBtn.addEventListener('click', () => {
    mobileMenu.classList.toggle('hidden');
});

// Smooth Scrolling for Navigation Links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
            // Close mobile menu if open
            mobileMenu.classList.add('hidden');
        }
    });
});

// Navbar Background on Scroll
window.addEventListener('scroll', () => {
    const nav = document.querySelector('nav');
    if (window.scrollY > 50) {
        nav.classList.add('bg-white', 'shadow-lg');
        nav.classList.remove('bg-transparent');
    } else {
        nav.classList.remove('bg-white', 'shadow-lg');
        nav.classList.add('bg-transparent');
    }
});

// Book Now Button Action
document.getElementById('bookNowBtn').addEventListener('click', () => {
    // Check if user is logged in
    const username = localStorage.getItem('username');
    if (username) {
        // User is logged in, redirect to dashboard
        window.location.href = 'dashboard.html';
    } else {
        // User not logged in, redirect to login
        if (confirm('Please login to book a ride. Redirect to login page?')) {
            window.location.href = 'login.html';
        }
    }
});

// Show Booking Modal
function showBookingModal() {
    const modalHtml = `
        <div id="bookingModal" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div class="bg-white rounded-2xl max-w-md w-full p-6 relative">
                <button onclick="closeBookingModal()" class="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
                    <i class="fas fa-times text-xl"></i>
                </button>
                <h3 class="text-2xl font-bold text-gray-800 mb-6">Book Your Shuttle</h3>
                <form id="bookingForm">
                    <div class="mb-4">
                        <label class="block text-gray-700 text-sm font-bold mb-2" for="pickup">
                            Pickup Location
                        </label>
                        <select class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500" id="pickup" required>
                            <option value="">Select pickup location</option>
                            <option value="hostel">Student Hostel</option>
                            <option value="library">University Library</option>
                            <option value="faculty">Faculty Building</option>
                            <option value="gate">Main Gate</option>
                        </select>
                    </div>
                    <div class="mb-4">
                        <label class="block text-gray-700 text-sm font-bold mb-2" for="dropoff">
                            Drop-off Location
                        </label>
                        <select class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500" id="dropoff" required>
                            <option value="">Select drop-off location</option>
                            <option value="hostel">Student Hostel</option>
                            <option value="library">University Library</option>
                            <option value="faculty">Faculty Building</option>
                            <option value="gate">Main Gate</option>
                        </select>
                    </div>
                    <div class="mb-4">
                        <label class="block text-gray-700 text-sm font-bold mb-2" for="time">
                            Preferred Time
                        </label>
                        <input type="time" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500" id="time" required>
                    </div>
                    <div class="mb-6">
                        <label class="block text-gray-700 text-sm font-bold mb-2" for="passengers">
                            Number of Passengers
                        </label>
                        <input type="number" min="1" max="8" value="1" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500" id="passengers" required>
                    </div>
                    <button type="submit" class="w-full btn-primary text-white py-3 rounded-lg font-bold">
                        Confirm Booking
                    </button>
                </form>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Add form submit handler
    document.getElementById('bookingForm').addEventListener('submit', handleBookingSubmit);
}

// Close Booking Modal
function closeBookingModal() {
    const modal = document.getElementById('bookingModal');
    if (modal) {
        modal.remove();
    }
}

// Handle Booking Form Submit
function handleBookingSubmit(e) {
    e.preventDefault();
    
    const formData = {
        pickup: document.getElementById('pickup').value,
        dropoff: document.getElementById('dropoff').value,
        time: document.getElementById('time').value,
        passengers: document.getElementById('passengers').value
    };
    
    // Show success message
    showNotification('Booking confirmed! Your shuttle will arrive at the scheduled time.', 'success');
    closeBookingModal();
    
    console.log('Booking data:', formData);
}

// Show Notification
function showNotification(message, type = 'info') {
    const notificationHtml = `
        <div id="notification" class="fixed top-20 right-4 z-50 px-6 py-4 rounded-lg shadow-lg transform transition-all duration-300 translate-x-full">
            <div class="flex items-center">
                <i class="fas ${type === 'success' ? 'fa-check-circle text-green-500' : 'fa-info-circle text-blue-500'} mr-3"></i>
                <span class="text-gray-800">${message}</span>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', notificationHtml);
    
    // Animate in
    setTimeout(() => {
        const notification = document.getElementById('notification');
        notification.classList.remove('translate-x-full');
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        const notification = document.getElementById('notification');
        if (notification) {
            notification.classList.add('translate-x-full');
            setTimeout(() => notification.remove(), 300);
        }
    }, 3000);
}

// Animate Elements on Scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe feature cards
document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.card-hover');
    cards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });
});

// Counter Animation
function animateCounter(element, target, duration = 2000) {
    let start = 0;
    const increment = target / (duration / 16);
    
    const timer = setInterval(() => {
        start += increment;
        if (start >= target) {
            element.textContent = target + (element.textContent.includes('+') ? '+' : '') + (element.textContent.includes('★') ? '★' : '');
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(start) + (element.textContent.includes('+') ? '+' : '') + (element.textContent.includes('★') ? '★' : '');
        }
    }, 16);
}

// Trigger counter animation when stats section is visible
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.classList.contains('animated')) {
            const counters = entry.target.querySelectorAll('.text-3xl');
            counters.forEach(counter => {
                const text = counter.textContent;
                const number = parseInt(text.replace(/\D/g, ''));
                if (!isNaN(number)) {
                    animateCounter(counter, number);
                    entry.target.classList.add('animated');
                }
            });
        }
    });
}, { threshold: 0.5 });

// Observe hero stats
document.addEventListener('DOMContentLoaded', () => {
    const statsSection = document.querySelector('#home .flex.items-center.space-x-8');
    if (statsSection) {
        statsObserver.observe(statsSection);
    }
});

// Add ripple effect to buttons
document.querySelectorAll('button').forEach(button => {
    button.addEventListener('click', function(e) {
        const ripple = document.createElement('span');
        ripple.classList.add('ripple');
        this.appendChild(ripple);
        
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        
        setTimeout(() => ripple.remove(), 600);
    });
});

// Login form submission
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    // Simple validation
    if (!email || !password) {
        showNotification('Please fill in all fields', 'error');
        return;
    }
    
    // Simulate login success
    showNotification('Login successful! Welcome back.', 'success');
    
    // Clear form
    this.reset();
    
    // Simulate redirect after 2 seconds
    setTimeout(() => {
        showNotification('Redirecting to dashboard...', 'info');
    }, 2000);
});

// Signup form submission
document.getElementById('signupForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validation
    if (!name || !email || !password || !confirmPassword) {
        showNotification('Please fill in all fields', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showNotification('Passwords do not match', 'error');
        return;
    }
    
    if (password.length < 6) {
        showNotification('Password must be at least 6 characters', 'error');
        return;
    }
    
    // Simulate signup success
    showNotification('Account created successfully! Welcome to UNN Shuttle.', 'success');
    
    // Clear form
    this.reset();
    
    // Simulate redirect after 2 seconds
    setTimeout(() => {
        showNotification('Redirecting to dashboard...', 'info');
    }, 2000);
});

// Add ripple styles
const rippleStyles = `
    <style>
        button {
            position: relative;
            overflow: hidden;
        }
        .ripple {
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.5);
            transform: scale(0);
            animation: ripple-animation 0.6s ease-out;
            pointer-events: none;
        }
        @keyframes ripple-animation {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
    </style>
`;
document.head.insertAdjacentHTML('beforeend', rippleStyles);
