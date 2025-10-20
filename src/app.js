const express = require("express");
const connectToDatabase = require("./db");
const Series = require("./serieSchema");
const Plataforma = require("./plataformaSchema");

const app = express();

app.use(express.json());

app.get("/plataforma", async (req, res) => {
  const plataformas = await Plataforma.find({});
  res.status(200).json(plataformas);
});

app.post("/plataforma", async (req, res) => {
  const plataforma = await Plataforma.create(req.body);
  res.status(201).json(plataforma);
});

app.get("/series", async (req, res) => {
  const series = await Series.find({}).populate({
    path: "plataforma",
    select: "nombre",
  });
  res.status(200).json(series);
});

app.post("/series", async (req, res) => {
  const serie = await Series.create(req.body);
  res.status(201).json(serie);
});

app.post("/series/:plataforma", async (req, res) => {
  const id = req.params.plataforma;
  const plataforma = await Plataforma.findById(id);
  const serie = await Series.create({
    plataforma: plataforma._id,
    ...req.body,
  });
  res.status(201).json(serie);
});

app.post("/series/:serieId/capitulo", async (req, res) => {
  const serieId = req.params.serieId;
  try {
    const serie = await Series.findByIdAndUpdate(
      serieId,
      { $push: { capitulos: req.body } }, // Agrega el nuevo capítulo al array de capítulos
      { new: true } // Para devolver el documento actualizado
    );
    console.log("Capítulo agregado con éxito");
    res.status(201).json(serie.capitulos[serie.capitulos.length - 1]);
  } catch (err) {
    console.error("Error al agregar el capítulo", err);
    res.status(500).json({ error: "Ups!! Algo salío mal." });
  }
});

async function startServer() {
  await connectToDatabase(); // ← Conexión global establecida aquí
  app.listen(3000, () => {
    console.log("App iniciada");
  });
}

startServer();
