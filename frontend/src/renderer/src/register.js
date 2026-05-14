document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const messageBox = document.getElementById('messageBox');

  try {
    const response = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    messageBox.classList.remove('hidden', 'bg-red-50', 'text-red-600', 'bg-green-50', 'text-green-600');

    if (response.ok) {
      messageBox.textContent = 'Registrasi berhasil! Silakan login.';
      messageBox.classList.add('bg-green-50', 'text-green-600');
      
      // Kosongkan form
      document.getElementById('username').value = '';
      document.getElementById('password').value = '';

      // Redirect ke login setelah 2 detik
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 2000);
    } else {
      messageBox.textContent = data.message || 'Registrasi gagal';
      messageBox.classList.add('bg-red-50', 'text-red-600');
    }
  } catch (error) {
    messageBox.textContent = 'Terjadi kesalahan koneksi ke server';
    messageBox.classList.remove('hidden');
    messageBox.classList.add('bg-red-50', 'text-red-600');
  }
});
