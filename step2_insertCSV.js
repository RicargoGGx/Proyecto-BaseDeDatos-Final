const fs = require('fs');
const path = require('path');
const Process = require('./Utils/Process');
const { saveMetric } = require('./Utils/metrics'); // Importa el módulo de métricas

module.exports = async () => {
  try {
    console.log("[STEP 2] Iniciando inserción del CSV en la tabla 'Libro'...");

    // Ruta del CSV
    const csvFolder = path.join(__dirname, 'csv');
    const csvFile = path.join(csvFolder, "libros_100k.csv");
    if (!fs.existsSync(csvFile)) {
      throw new Error(`No se encontró el archivo: ${csvFile}`);
    }
    console.log("[STEP 2] Archivo CSV encontrado:", csvFile);

    // Inicia el proceso MySQL
    const loadProc = new Process("mysql", { shell: true });
    loadProc.ProcessArguments.push("--local-infile=1");
    loadProc.ProcessArguments.push("-uA");
    loadProc.ProcessArguments.push("-ppasswordA");
    loadProc.Execute(true);

    // Mide el tiempo de inserción
    const startTime = Date.now();
    loadProc.Write("USE biblioteca;\n");
    loadProc.Write(`
      LOAD DATA LOCAL INFILE '${csvFile.replace(/\\/g, '/')}'
      INTO TABLE Libro
      FIELDS TERMINATED BY ','
      LINES TERMINATED BY '\\n'
      (id, ISBN, title, autor_license, editorial, pages, year, genre, language, format, sinopsis, content);
    `);
    loadProc.End();

    await loadProc.Finish();
    const endTime = Date.now();
    const executionTime = endTime - startTime;

    // Guardar métrica
    saveMetric('step2', 'insert_csv', executionTime);

    console.log("[STEP 2] CSV insertado correctamente en 'Libro'.");
    console.log(`[STEP 2] Tiempo total: ${executionTime} ms`);
    
    return executionTime;
  } catch (error) {
    console.error("Error en step2_insertCSV:", error);
    throw error;
  }
};