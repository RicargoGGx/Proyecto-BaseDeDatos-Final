// step6_queryAggregate.js
const Process = require('./Utils/Process');

(async () => {
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
    console.log(`[STEP 6] Tiempo total: ${endTime - startTime} ms`);
    console.log("Resultado del query:\n", aggProc.Logs);
  } catch (err) {
    console.error("Error en step6_queryAggregate:", err);
  }
})();
