const express = require('express');
const router = express.Router();
const { Barang, Riwayat, sequelize } = require('../models');
const { authenticateToken } = require('../middleware/auth');

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
      return res.status(400).json({ message: `Stok tidak mencukupi. Stok saat ini: ${barang.stok}, jumlah yang diminta: ${qty}` });
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

module.exports = router;
