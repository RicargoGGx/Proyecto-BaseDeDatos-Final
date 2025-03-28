const Process = require('./Utils/Process');
const { generateBookRow, setBookCounter } = require('./Utils/generador_aleatorio');
const { saveMetric } = require('./Utils/metrics'); // Importar el módulo de métricas

module.exports = async () => {
  try {
    console.log("[STEP 3] Insertando 3,500 libros (estrés) en 'Libro'...");
    
    // Configura el contador para continuar desde 100001
    setBookCounter(100001);
    
    const startTime = Date.now();
    const stressProc = new Process("mysql", { shell: true });
    stressProc.ProcessArguments.push("-uA");
    stressProc.ProcessArguments.push("-ppasswordA");
    stressProc.Execute(true);
    
    stressProc.Write("USE biblioteca;\n");
    
    // Prepara y ejecuta las inserciones
    for (let i = 0; i < 3500; i++) {
      const row = generateBookRow().trim();
      const values = row.split(',');
      
      // Escapar comillas simples para evitar errores SQL
      const escapedValues = values.map(v => v.replace(/'/g, "''"));
      
      const query = `INSERT INTO Libro (id, ISBN, title, autor_license, editorial, pages, year, genre, language, format, sinopsis, content)
      VALUES (${escapedValues[0]}, '${escapedValues[1]}', '${escapedValues[2]}', '${escapedValues[3]}', '${escapedValues[4]}', 
      ${escapedValues[5]}, ${escapedValues[6]}, '${escapedValues[7]}', '${escapedValues[8]}', '${escapedValues[9]}', 
      '${escapedValues[10]}', '${escapedValues[11]}');\n`;
      
      stressProc.Write(query);
    }
    
    stressProc.End();
    await stressProc.Finish();
    const endTime = Date.now();
    const executionTime = endTime - startTime;
    
    // Guardar métrica
    saveMetric('step3', 'insert_stress', executionTime);
    
    console.log("[STEP 3] Inserción de 3,500 libros completada.");
    console.log(`[STEP 3] Tiempo total: ${executionTime} ms`);
    
    return executionTime;
  } catch (err) {
    console.error("Error en step3_insert3500:", err);
    throw err; // Propagar el error para manejo superior
  }
};