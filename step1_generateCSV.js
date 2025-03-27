// step1_generateCSV.js
const fs = require('fs');
const path = require('path');
const { generate_csv } = require('./Utils/generador_aleatorio');

(async () => {
  try {
    console.log("[STEP 1] Generando CSV de 100,000 Libros...");

    // Asegurar que exista la carpeta ./csv
    const csvDir = path.join(__dirname, 'csv');
    if (!fs.existsSync(csvDir)) {
      fs.mkdirSync(csvDir);
    }

    const startTime = Date.now();
    const csvData = generate_csv(100000);
    
    // Guardar en carpeta csv
    const outputFile = path.join(csvDir, 'libros_100k.csv');
    fs.writeFileSync(outputFile, csvData);

    const endTime = Date.now();
    console.log(`[STEP 1] Tiempo total: ${endTime - startTime} ms`);
    console.log(`CSV generado correctamente en: ${outputFile}`);
  } catch (err) {
    console.error("Error en step1_generateCSV:", err);
  }
})();
