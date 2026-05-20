'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Riwayat extends Model {
    static associate(models) {
      Riwayat.belongsTo(models.Barang, { foreignKey: 'barangId', as: 'barang', onDelete: 'SET NULL', onUpdate: 'CASCADE' });
    }
  }
  Riwayat.init({
    barangId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    namaBarang: {
      type: DataTypes.STRING,
      allowNull: false
    },
    jumlah: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    tipe: {
      type: DataTypes.STRING,
      defaultValue: 'keluar',
      allowNull: false
    },
    keterangan: {
      type: DataTypes.STRING,
      allowNull: true
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Riwayat',
  });
  return Riwayat;
};
