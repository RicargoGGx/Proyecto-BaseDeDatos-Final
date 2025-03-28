const Process = require('./Utils/Process');
const { saveMetric } = require('./Utils/metrics');

module.exports = async () => {
  try {
    console.log("[STEP 6] Ejecutando query agregado en 'Libro'...");

    const startTime = Date.now();
    const aggProc = new Process("mysql", { shell: true });
    aggProc.ProcessArguments.push("-uA");
    aggProc.ProcessArguments.push("-ppasswordA");
    aggProc.Execute(true);

    aggProc.Write("USE biblioteca;\n");
    aggProc.Write(`
      SELECT 
        MAX(pages) AS max_pages,
        MIN(pages) AS min_pages,
        AVG(pages) AS avg_pages,
        MAX(year) AS latest_year,
        MIN(year) AS oldest_year,
        COUNT(*) AS total_books
      FROM Libro;
    `);
    aggProc.End();

    await aggProc.Finish();

    const endTime = Date.now();
    const executionTime = endTime - startTime;
    
    // Guardar métrica del tiempo de ejecución
    saveMetric('step6', 'aggregate_query', executionTime);

    console.log(`[STEP 6] Tiempo total: ${executionTime} ms`);
    console.log("Resultado del query:\n", aggProc.Logs);
    
    return {
      executionTime,
      queryResults: aggProc.Logs // Opcional: para uso futuro si necesitas los resultados
    };
  } catch (err) {
    console.error("Error en step6_queryAggregate:", err);
    throw err;
  }
};