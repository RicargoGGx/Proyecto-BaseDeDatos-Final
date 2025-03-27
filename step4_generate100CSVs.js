// step4_generate100CSVs.js
const fs = require('fs');
const path = require('path');
const { generate_csv } = require('./Utils/generador_aleatorio');

(async () => {
  try {
    console.log("[STEP 4] Generando 100 CSV de 1,000 Libros cada uno...");

    // Asegurar la carpeta ./csv
    const csvDir = path.join(__dirname, 'csv');
    if (!fs.existsSync(csvDir)) {
      fs.mkdirSync(csvDir);
    }

    const startTime = Date.now();

    for (let i = 0; i < 100; i++) {
      const csvData = generate_csv(1000);
      const fileName = `libros_${i}.csv`;
      fs.writeFileSync(path.join(csvDir, fileName), csvData);
    }

    const endTime = Date.now();
    console.log(`[STEP 4] Tiempo total: ${endTime - startTime} ms`);
    console.log("Generados 100 archivos CSV en ./csv/: libros_0.csv ... libros_99.csv");
  } catch (err) {
    console.error("Error en step4_generate100CSVs:", err);
  }
})();
