const fs = require('fs');
const path = require('path');
const { generate_csv, setBookCounter } = require('./Utils/generador_aleatorio');
const { saveMetric } = require('./Utils/metrics'); // Importar el módulo de métricas

module.exports = async () => {
  try {
    console.log("[STEP 4] Generando 100 CSV de 1,000 libros cada uno...");
    
    // Crear directorio si no existe
    const csvDir = path.join(__dirname, 'csv');
    if (!fs.existsSync(csvDir)) {
      fs.mkdirSync(csvDir);
    }
    
    // Configura el contador para continuar desde 103501 (100,000 + 3,500 + 1)
    setBookCounter(103501);
    
    const startTime = Date.now();
    
    // Generar los 100 archivos CSV
    for (let i = 0; i < 100; i++) {
      const csvData = generate_csv(1000);
      const fileName = `libros_${i.toString().padStart(2, '0')}.csv`; // Formato libros_00.csv a libros_99.csv
      fs.writeFileSync(path.join(csvDir, fileName), csvData);
      
      // Opcional: Mostrar progreso cada 10 archivos
      if ((i + 1) % 10 === 0) {
        console.log(`[STEP 4] Generados ${i + 1}/100 archivos...`);
      }
    }
    
    const endTime = Date.now();
    const executionTime = endTime - startTime;
    
    // Guardar métrica
    saveMetric('step4', 'generate_100_csvs', executionTime);
    
    console.log(`[STEP 4] Tiempo total: ${executionTime} ms`);
    console.log("100 CSV generados en la carpeta 'csv': libros_00.csv ... libros_99.csv");
    
    return executionTime;
  } catch (err) {
    console.error("Error en step4_generate100CSVs:", err);
    throw err; // Propagar el error para manejo superior
  }
};