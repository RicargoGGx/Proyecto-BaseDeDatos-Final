// step4_generate100CSVs.js
const fs = require('fs');
const path = require('path');
const { generate_csv, setBookCounter } = require('./Utils/generador_aleatorio');

(async () => {
  try {
    console.log("[STEP 4] Generando 100 CSV de 1,000 libros cada uno...");
    const csvDir = path.join(__dirname, 'csv');
    if (!fs.existsSync(csvDir)) fs.mkdirSync(csvDir);
    
    // Configura el contador para continuar desde 103501 (100,000 + 3,500 + 1)
    setBookCounter(103501);
    
    const startTime = Date.now();
    for (let i = 0; i < 100; i++) {
      const csvData = generate_csv(1000);
      const fileName = `libros_${i}.csv`;
      fs.writeFileSync(path.join(csvDir, fileName), csvData);
    }
    const endTime = Date.now();
    console.log(`[STEP 4] Tiempo total: ${endTime - startTime} ms`);
    console.log("100 CSV generados en la carpeta 'csv': libros_0.csv ... libros_99.csv");
  } catch (err) {
    console.error("Error en step4_generate100CSVs:", err);
  }
})();
