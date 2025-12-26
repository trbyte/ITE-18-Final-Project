// auth.js - Fixed version
let isRegisterMode = false;

function toggleForm() {
  isRegisterMode = !isRegisterMode;
  const formTitle = document.getElementById('formTitle');
  const loginBtn = document.querySelector('.play');
  const registerBtn = document.querySelector('.register');

  if (isRegisterMode) {
    formTitle.textContent = 'REGISTER NEW DRIVER';
    loginBtn.textContent = '▶ Create Account';
    registerBtn.textContent = '← Back to Login';
  } else {
    formTitle.textContent = 'LOGIN';
    loginBtn.textContent = '▶ Start Game';
    registerBtn.textContent = '➕ New Driver';
  }
}

function goToRegister() {
  toggleForm();
}

async function handleLogin() {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const messageEl = document.getElementById('message');

  messageEl.textContent = '';
  messageEl.style.color = '#ffeb3b';

  if (!username || !password) {
    messageEl.textContent = 'Please enter username and password';
    messageEl.style.color = '#ff5252';
    return;
  }

  const endpoint = isRegisterMode ? '/register' : '/login';
  
  // IMPORTANT: Use full backend URL
  const backendUrl = 'http://localhost:5000';
  const fullUrl = `${backendUrl}${endpoint}`;
  
  messageEl.textContent = isRegisterMode ? 'Creating account...' : 'Logging in...';

  try {
    console.log(`🌐 Sending request to: ${fullUrl}`);
    
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    console.log(`📡 Response status: ${response.status}`);
    
    // First get response as text to see what's happening
    const responseText = await response.text();
    console.log('📦 Raw response:', responseText);
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ Failed to parse JSON:', parseError);
      messageEl.textContent = 'Server returned invalid response';
      messageEl.style.color = '#ff5252';
      return;
    }

    console.log('✅ Parsed data:', data);

    if (response.ok) {
      if (isRegisterMode) {
        // Registration successful
        messageEl.textContent = 'Account created! Please login.';
        messageEl.style.color = '#4CAF50';
        toggleForm();
        document.getElementById('password').value = '';
      } else {
        // Login successful - Save tokens
        if (data.token && data.user && data.user.username) {
          localStorage.setItem('gameToken', data.token);
          localStorage.setItem('gameUsername', data.user.username);
          
          console.log('🔑 Token saved to localStorage');
          console.log('👤 Username:', data.user.username);
          
          messageEl.textContent = 'Login successful! Redirecting...';
          messageEl.style.color = '#4CAF50';

          // Redirect after 1 second
          setTimeout(() => {
            window.location.href = 'menu.html';
          }, 1000);
        } else {
          console.error('❌ Missing token or username in response:', data);
          messageEl.textContent = 'Server response missing required data';
          messageEl.style.color = '#ff5252';
        }
      }
    } else {
      // Error from server
      messageEl.textContent = data.error || (isRegisterMode ? 'Registration failed' : 'Login failed');
      messageEl.style.color = '#ff5252';
    }
  } catch (error) {
    console.error('❌ Network error:', error);
    messageEl.textContent = `Cannot connect to server. Make sure backend is running at ${backendUrl}`;
    messageEl.style.color = '#ff5252';
    
    // Try to test connection
    testServerConnection();
  }
}

// Test server connection
async function testServerConnection() {
  try {
    const testResponse = await fetch('http://localhost:5000');
    console.log('🧪 Server test response:', testResponse.status);
    if (testResponse.ok) {
      const text = await testResponse.text();
      console.log('🧪 Server says:', text);
    }
  } catch (testError) {
    console.error('🧪 Server test failed:', testError);
  }
}

// Allow Enter key to submit
document.addEventListener('keydown', function (event) {
  if (event.key === 'Enter') {
    handleLogin();
  }
});

// Check if already logged in
window.addEventListener('load', function () {
  const token = localStorage.getItem('gameToken');
  const username = localStorage.getItem('gameUsername');
  
  console.log('Page loaded. Auth check:');
  console.log('   Token exists:', !!token);
  console.log('   Username exists:', username);
  
  if (token && username) {
    console.log('Already logged in as', username);
    console.log('   Redirecting to menu...');
    window.location.href = 'game.html';
  }
});

// Debug functions
window.debugAuth = function() {
  console.log('🔧 DEBUG AUTH');
  console.log('LocalStorage:');
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    console.log(`   ${key}: ${localStorage.getItem(key)}`);
  }
  
  console.log('Testing server connection...');
  testServerConnection();
};