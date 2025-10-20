const mongoose = require("mongoose");

const plataformaSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
  },
  activa: {
    type: Boolean,
    required: true,
  },
});

const Platafoma = mongoose.model("Plataforma", plataformaSchema);

module.exports = Platafoma;
