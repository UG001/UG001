/**
 * Dashboard JavaScript
 * Handles all dashboard functionality
 */

let currentUser = null;
let userStats = null;

/**
 * Initialize dashboard
 */
async function initializeDashboard() {
  if (!api.isLoggedIn()) {
    alert('Please login to access your dashboard');
    window.location.href = 'login.html';
    return;
  }

  try {
    const profileData = await api.getUserProfile();
    currentUser = profileData.user;
    userStats = profileData.stats;

    updateDashboardUI(profileData);
  } catch (error) {
    console.error('Failed to load user data:', error);
    handleDashboardError(error);
  }
}

/**
 * Handle dashboard errors
 */
function handleDashboardError(error) {
  const errorMessages = {
    '401': 'Your session has expired. Please login again.',
    'No token provided': 'Authentication required. Please login again.',
    'Invalid token': 'Invalid session. Please login again.'
  };

  const message = Object.keys(errorMessages).find(key =>
    error.message?.includes(key)
  );

  alert(errorMessages[message] || 'Failed to load your data. Please login again.');
  api.logout();
}

/**
 * Update dashboard UI with user data
 */
function updateDashboardUI(profileData) {
  updateWelcomeMessage();
  updateBalanceCard();
  updateLastFundedTime(profileData.recentTransactions);
  updateRecentBookings(profileData.recentBookings);
  updateAccountStats();
}

/**
 * Update welcome message
 */
function updateWelcomeMessage() {
  const usernameEl = document.getElementById('username');
  if (usernameEl) {
    usernameEl.textContent = currentUser.fullName || 'Student';
  }
}

/**
 * Update balance card
 */
function updateBalanceCard() {
  const balanceEl = document.getElementById('balance');
  if (balanceEl) {
    balanceEl.textContent = api.formatCurrency(currentUser.balance);
  }
}

/**
 * Update last funded time
 */
function updateLastFundedTime(transactions) {
  const lastFundedEl = document.getElementById('lastFunded');
  if (!lastFundedEl) return;

  const fundingTransactions = transactions.filter(t => t.type === 'funding');
  if (fundingTransactions.length > 0) {
    const lastFunding = fundingTransactions[0];
    lastFundedEl.textContent = api.formatDate(lastFunding.created_at);
  } else {
    lastFundedEl.textContent = 'Never';
  }
}

/**
 * Update recent bookings section
 */
function updateRecentBookings(bookings) {
  const container = document.querySelector('.space-y-3');
  if (!container) return;

  if (!bookings || bookings.length === 0) {
    container.innerHTML = `
      <div class="text-center py-8 text-gray-500">
        <i class="fas fa-bus text-4xl mb-4"></i>
        <p>No bookings yet. Book your first ride!</p>
        <a href="book.html" class="text-green-600 hover:underline mt-2 inline-block">Book Now</a>
      </div>
    `;
    return;
  }

  container.innerHTML = bookings.map(booking => createBookingCard(booking)).join('');
}

/**
 * Create booking card HTML
 */
function createBookingCard(booking) {
  const routeName = booking.routes?.name || 'Unknown Route';
  const timeStr = api.formatDate(booking.created_at);
  const statusColor = getStatusColor(booking.status);

  return `
    <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
      <div class="flex items-center">
        <div class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
          <i class="fas fa-bus text-green-600"></i>
        </div>
        <div>
          <div class="font-semibold text-gray-800">${routeName}</div>
          <div class="text-sm text-gray-600">${timeStr}</div>
        </div>
      </div>
      <div class="text-right">
        <div class="${statusColor} font-bold">${api.formatCurrency(booking.total_price || 0)}</div>
        <div class="text-xs ${statusColor}">${booking.status}</div>
      </div>
    </div>
  `;
}

/**
 * Get status color class
 */
function getStatusColor(status) {
  const colors = {
    pending: 'text-yellow-600',
    confirmed: 'text-blue-600',
    completed: 'text-green-600',
    cancelled: 'text-red-600'
  };
  return colors[status] || 'text-gray-600';
}

/**
 * Update account statistics
 */
function updateAccountStats() {
  const container = document.querySelector('.space-y-4');
  if (!container) return;

  container.innerHTML = `
    <div class="flex justify-between items-center">
      <div class="flex items-center">
        <i class="fas fa-chart-line text-green-600 mr-3"></i>
        <span class="text-gray-700">Total Rides</span>
      </div>
      <span class="text-2xl font-bold text-gray-800">${currentUser.totalRides || 0}</span>
    </div>
    <div class="flex justify-between items-center">
      <div class="flex items-center">
        <i class="fas fa-money-bill text-blue-600 mr-3"></i>
        <span class="text-gray-700">Total Spent</span>
      </div>
      <span class="text-2xl font-bold text-gray-800">${api.formatCurrency(currentUser.totalSpent || 0)}</span>
    </div>
    <div class="flex justify-between items-center">
      <div class="flex items-center">
        <i class="fas fa-star text-yellow-500 mr-3"></i>
        <span class="text-gray-700">Member Since</span>
      </div>
      <span class="text-lg font-bold text-gray-800">${userStats ? formatMemberSince(userStats.memberSince) : 'N/A'}</span>
    </div>
  `;
}

/**
 * Format member since date
 */
function formatMemberSince(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

/**
 * Show fund modal
 */
function showFundModal() {
  const modal = document.getElementById('fundModal');
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }
}

/**
 * Close fund modal
 */
function closeFundModal() {
  const modal = document.getElementById('fundModal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    document.getElementById('fundForm')?.reset();
  }
}

/**
 * Set amount in fund modal
 */
function setAmount(amount) {
  const input = document.getElementById('fundAmount');
  if (input) {
    input.value = amount;
  }

  document.querySelectorAll('.amount-btn').forEach(btn => {
    btn.classList.remove('border-green-500', 'bg-green-50');
  });
  event.target.classList.add('border-green-500', 'bg-green-50');
}

/**
 * Set custom amount
 */
function setCustomAmount() {
  const input = document.getElementById('fundAmount');
  if (input) {
    input.value = '';
    input.focus();
  }
}

/**
 * Handle fund form submission
 */
async function handleFundSubmit(e) {
  e.preventDefault();

  const amountInput = document.getElementById('fundAmount');
  const amount = parseFloat(amountInput.value);

  if (!amount || amount < 100) {
    alert('Please enter a valid amount (minimum ₦100)');
    return;
  }

  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.innerHTML;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Processing...';
  submitBtn.disabled = true;

  try {
    const result = await api.fundAccount(amount, 'card');

    currentUser.balance = result.newBalance;
    document.getElementById('balance').textContent = api.formatCurrency(result.newBalance);
    document.getElementById('lastFunded').textContent = api.formatDate(new Date().toISOString());

    alert(`Account funded successfully! ${api.formatCurrency(amount)} has been added to your account.`);
    closeFundModal();
  } catch (error) {
    alert(error.message || 'Failed to fund account. Please try again.');
  } finally {
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
  }
}

/**
 * Handle logout
 */
async function handleLogout() {
  if (confirm('Are you sure you want to logout?')) {
    try {
      api.logout();
    } catch (error) {
      console.error('Logout error:', error);
      window.location.href = 'index.html';
    }
  }
}

/**
 * Initialize event listeners
 */
function initializeEventListeners() {
  const fundForm = document.getElementById('fundForm');
  if (fundForm) {
    fundForm.addEventListener('submit', handleFundSubmit);
  }

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initializeEventListeners();
  initializeDashboard();
});
