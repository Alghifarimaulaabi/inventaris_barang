const express = require('express');
const router = express.Router();
const { Barang } = require('../models');

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
router.post('/', async (req, res) => {
  try {
    const barang = await Barang.create(req.body);
    res.status(201).json(barang);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT update barang
router.put('/:id', async (req, res) => {
  try {
    const barang = await Barang.findByPk(req.params.id);
    if (!barang) return res.status(404).json({ message: 'Barang tidak ditemukan' });
    
    await barang.update(req.body);
    res.json(barang);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE barang
router.delete('/:id', async (req, res) => {
  try {
    const barang = await Barang.findByPk(req.params.id);
    if (!barang) return res.status(404).json({ message: 'Barang tidak ditemukan' });
    
    await barang.destroy();
    res.json({ message: 'Barang berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
