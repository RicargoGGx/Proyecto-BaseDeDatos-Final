// step1_generateCSV.js
const fs = require('fs');
const path = require('path');
const { generate_csv, setBookCounter } = require('./Utils/generador_aleatorio');

// Reinicia el contador a 1.
setBookCounter(1);

(async () => {
  try {
    console.log("[STEP 1] Generando CSV de 100,000 libros...");
    const csvFolder = path.join(__dirname, 'csv');
    if (!fs.existsSync(csvFolder)) fs.mkdirSync(csvFolder);

    const startTime = Date.now();
    const csvData = generate_csv(100000);
    const filePath = path.join(csvFolder, "libros_100k.csv");
    fs.writeFileSync(filePath, csvData);
    const endTime = Date.now();

    console.log(`[STEP 1] CSV generado en: ${filePath}`);
    console.log(`[STEP 1] Tiempo total: ${endTime - startTime} ms`);
  } catch (error) {
    console.error("Error en step1_generateCSV:", error);
  }
})();
