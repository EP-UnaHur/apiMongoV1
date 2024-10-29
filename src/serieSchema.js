const mongoose = require('./db').mongoose; 

const seriesSchema = new mongoose.Schema({
    titulo: {
        type: String,
        required: true,
    },
    temporada: {
        type: Number,
        required: true,
    },
    genero: {
        type: String,
    },
    capitulos: [{
        titulo: { type: String, required: true },  // Título del capítulo
        duracion: { type: Number },  // Duración en minutos
        numero: { type: Number },  // Número de capítulo en la temporada
        descripcion: { type: String }  // Breve descripción del capítulo
    }]
});

const Series = mongoose.model('Series', seriesSchema);

module.exports = Series;