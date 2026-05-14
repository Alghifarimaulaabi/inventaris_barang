'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Barang extends Model {
    static associate(models) {
      // define association here
    }
  }
  Barang.init({
    nama: DataTypes.STRING,
    stok: DataTypes.INTEGER,
    harga: DataTypes.INTEGER,
    kategori: DataTypes.STRING,
    foto: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Barang',
  });
  return Barang;
};
