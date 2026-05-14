document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const errorMessage = document.getElementById('errorMessage');

  try {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (response.ok) {
      // Simpan token dan info user di localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Redirect berdasarkan role
      if (data.user.role === 'admin') {
        window.location.href = 'admin/dashboard-admin.html';
      } else {
        window.location.href = 'user/dashboard-user.html';
      }
    } else {
      errorMessage.textContent = data.message || 'Login gagal';
      errorMessage.classList.remove('hidden');
    }
  } catch (error) {
    errorMessage.textContent = 'Terjadi kesalahan koneksi ke server';
    errorMessage.classList.remove('hidden');
  }
});
