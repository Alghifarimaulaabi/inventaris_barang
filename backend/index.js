const express = require('express');
const cors = require('cors');
const path = require('path'); // ✅ tambah ini
const app = express();
const { sequelize } = require('./models');

app.use(cors());

// middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// router
const barangRouter = require('./routes/barang');
const authRouter = require('./routes/auth'); // Tambahkan rute auth
const riwayatRouter = require('./routes/riwayat');

app.use('/api/barang', barangRouter);
app.use('/api/auth', authRouter); // Gunakan rute auth
app.use('/api/riwayat', riwayatRouter);
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // ✅ path sudah defined
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // ✅ path sudah defined

// route utama
app.get('/', (req, res) => {
  res.send('Server Express jalan 🚀');
});

// server
const PORT = 3000;

// ✅ hanya satu app.listen, di dalam sync
sequelize.sync({ alter: true }).then(() => {
  console.log('Database synced ✅');
  app.listen(PORT, () => {
    console.log(`Server running di http://localhost:${PORT}`);
  });
});