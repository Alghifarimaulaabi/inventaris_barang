const express = require('express');
const router = express.Router();
const { Barang, Riwayat, sequelize } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { Op } = require('sequelize');

// GET all riwayat
router.get('/', authenticateToken, async (req, res) => {
  try {
    const riwayat = await Riwayat.findAll({
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: Barang,
          as: 'barang',
          attributes: ['id', 'nama', 'kategori', 'foto', 'barcode']
        }
      ]
    });
    res.json(riwayat);
  } catch (error) {
    console.error('Error GET /riwayat:', error);
    res.status(500).json({ message: error.message });
  }
});

// POST record barang keluar
router.post('/keluar', authenticateToken, async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { barangId, jumlah, keterangan } = req.body;

    // Validation
    if (!barangId) {
      return res.status(400).json({ message: 'ID Barang wajib ditentukan.' });
    }
    
    const qty = parseInt(jumlah, 10);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ message: 'Jumlah barang keluar harus lebih besar dari 0.' });
    }

    if (!keterangan || keterangan.trim().length < 3) {
      return res.status(400).json({ message: 'Keterangan wajib diisi minimal 3 karakter.' });
    }

    // Find barang
    const barang = await Barang.findByPk(barangId, { transaction });
    if (!barang) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Barang tidak ditemukan.' });
    }

    // Check stock
    if (barang.stok < qty) {
      await transaction.rollback();
      return res.status(400).json({ 
        message: `Stok tidak mencukupi. Stok saat ini: ${barang.stok}, jumlah yang diminta: ${qty}` 
      });
    }

    // Update stock
    await barang.update({ stok: barang.stok - qty }, { transaction });

    // Create riwayat log
    const newRiwayat = await Riwayat.create({
      barangId: barang.id,
      namaBarang: barang.nama,
      jumlah: qty,
      tipe: 'keluar',
      keterangan: keterangan.trim(),
      username: req.user.username
    }, { transaction });

    await transaction.commit();
    res.status(201).json({
      message: 'Transaksi barang keluar berhasil dicatat.',
      riwayat: newRiwayat,
      stokBaru: barang.stok
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error barang keluar:', error);
    res.status(500).json({ message: error.message || 'Terjadi kesalahan pada server.' });
  }
});

// GET total barang keluar
router.get('/stats/total-keluar', authenticateToken, async (req, res) => {
  try {
    const totalKeluar = await Riwayat.sum('jumlah', {
      where: { tipe: 'keluar' }
    });
    
    res.json({ totalKeluar: totalKeluar || 0 });
  } catch (error) {
    console.error('Error GET /stats/total-keluar:', error);
    res.status(500).json({ message: error.message });
  }
});

// GET statistik chart (masuk vs keluar)
router.get('/stats/chart', authenticateToken, async (req, res) => {
  try {
    const { range = '7' } = req.query;
    
    // Cek apakah ada data riwayat
    const count = await Riwayat.count();
    
    // Jika tidak ada data, kirim array kosong
    if (count === 0) {
      return res.json([]);
    }
    
    // Gunakan query yang lebih sederhana dan kompatibel
    const riwayat = await Riwayat.findAll({
      attributes: [
        [sequelize.literal("DATE(createdAt)"), 'tanggal'],
        'tipe',
        [sequelize.fn('SUM', sequelize.col('jumlah')), 'totalJumlah']
      ],
      where: sequelize.literal(`createdAt >= DATE('now', '-${range} days')`),
      group: ['tanggal', 'tipe'],
      order: [[sequelize.literal("DATE(createdAt)"), 'ASC']],
      raw: true
    });
    
    console.log('Chart data:', riwayat); // Debug
    res.json(riwayat);
  } catch (error) {
    console.error('Error GET /stats/chart:', error);
    // Kirim array kosong jika error
    res.json([]);
  }
});

// GET barang paling sering keluar
router.get('/stats/top-keluar', authenticateToken, async (req, res) => {
  try {
    const topKeluar = await Riwayat.findAll({
      attributes: [
        'namaBarang',
        'barangId',
        [sequelize.fn('SUM', sequelize.col('jumlah')), 'totalKeluar']
      ],
      where: { tipe: 'keluar' },
      group: ['namaBarang', 'barangId'],
      order: [[sequelize.literal('totalKeluar'), 'DESC']],
      limit: 10,
      include: [{
        model: Barang,
        as: 'barang',
        attributes: ['id', 'foto', 'kategori']
      }],
      raw: false
    });
    
    res.json(topKeluar);
  } catch (error) {
    console.error('Error GET /stats/top-keluar:', error);
    res.json([]);
  }
});

// GET barang stok menipis
router.get('/stats/stok-tipis', authenticateToken, async (req, res) => {
  try {
    const stokTipis = await Barang.findAll({
      where: {
        stok: {
          [Op.lte]: 10
        }
      },
      order: [['stok', 'ASC']],
      limit: 10
    });
    
    res.json(stokTipis);
  } catch (error) {
    console.error('Error GET /stats/stok-tipis:', error);
    res.json([]);
  }
});

// GET riwayat user hari ini
router.get('/user-today/:userId', authenticateToken, async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const riwayat = await Riwayat.findAll({
      where: {
        username: req.params.userId,
        createdAt: {
          [Op.gte]: todayStart
        }
      },
      order: [['createdAt', 'DESC']],
      include: [{
        model: Barang,
        as: 'barang',
        attributes: ['id', 'nama', 'foto', 'kategori']
      }]
    });
    
    res.json(riwayat);
  } catch (error) {
    console.error('Error GET /user-today:', error);
    res.json([]);
  }
});

module.exports = router;