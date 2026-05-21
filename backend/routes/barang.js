const express = require('express');
const router = express.Router();
const { Barang } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Setup multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  }
});
const upload = multer({ storage: storage });

// GET all barang
router.get('/', async (req, res) => {
  try {
    const barang = await Barang.findAll();
    res.json(barang);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET barang by id
router.get('/:id', async (req, res) => {
  try {
    const barang = await Barang.findByPk(req.params.id);
    if (!barang) return res.status(404).json({ message: 'Barang tidak ditemukan' });
    res.json(barang);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST new barang
router.post('/', authenticateToken, upload.single('foto'), async (req, res) => {
  try {
    const { nama, stok, harga, kategori, barcode } = req.body;
    let foto = req.body.foto || null;
    if (req.file) {
      foto = '/uploads/' + req.file.filename;
    }
    
    const qty = parseInt(stok, 10) || 0;
    const price = parseInt(harga, 10) || 0;

    const barang = await Barang.create({
      nama,
      stok: qty,
      harga: price,
      kategori,
      barcode,
      foto
    });

    if (qty > 0) {
      const { Riwayat } = require('../models');
      await Riwayat.create({
        barangId: barang.id,
        namaBarang: barang.nama,
        jumlah: qty,
        tipe: 'masuk',
        keterangan: 'Stok awal barang baru',
        username: req.user.username
      });
    }

    res.status(201).json(barang);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT update barang
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const barang = await Barang.findByPk(req.params.id);
    if (!barang) return res.status(404).json({ message: 'Barang tidak ditemukan' });
    
    const oldStok = barang.stok;
    const newStok = req.body.stok !== undefined ? parseInt(req.body.stok, 10) : oldStok;

    await barang.update(req.body);

    if (newStok !== oldStok) {
      const diff = newStok - oldStok;
      const { Riwayat } = require('../models');
      await Riwayat.create({
        barangId: barang.id,
        namaBarang: barang.nama,
        jumlah: Math.abs(diff),
        tipe: diff > 0 ? 'masuk' : 'keluar',
        keterangan: req.body.keterangan || (diff > 0 ? 'Penambahan stok via edit' : 'Pengurangan stok via edit'),
        username: req.user.username
      });
    }

    res.json(barang);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE barang
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const barang = await Barang.findByPk(req.params.id);
    if (!barang) return res.status(404).json({ message: 'Barang tidak ditemukan' });
    
    await barang.destroy();
    res.json({ message: 'Barang berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/barang/dashboard/stats
router.get('/dashboard/stats', async (req, res) => {
  try {
    const totalBarang = await Barang.count();
    const totalStok = await Barang.sum('stok');
    const barangPerKategori = await Barang.findAll({
      attributes: [
        'kategori',
        [sequelize.fn('COUNT', sequelize.col('id')), 'jumlah'],
        [sequelize.fn('SUM', sequelize.col('stok')), 'totalStok']
      ],
      group: ['kategori']
    });
    
    res.json({
      totalBarang,
      totalStok,
      barangPerKategori
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
