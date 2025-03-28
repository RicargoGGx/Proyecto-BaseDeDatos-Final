// step3_insert3500.js
const Process = require('./Utils/Process');
const { generateBookRow, setBookCounter } = require('./Utils/generador_aleatorio');

(async () => {
  try {
    console.log("[STEP 3] Insertando 3,500 libros (estrés) en 'Libro'...");
    // Configura el contador para continuar desde 100001.
    setBookCounter(100001);
    
    const startTime = Date.now();
    const stressProc = new Process("mysql", { shell: true });
    stressProc.ProcessArguments.push("-uA");
    stressProc.ProcessArguments.push("-ppasswordA");
    stressProc.Execute(true);
    
    stressProc.Write("USE biblioteca;\n");
    for (let i = 0; i < 3500; i++) {
      const row = generateBookRow().trim();
      const values = row.split(',');
      const query = `INSERT INTO Libro (id, ISBN, title, autor_license, editorial, pages, year, genre, language, format, sinopsis, content)
VALUES (${values[0]}, '${values[1]}', '${values[2]}', '${values[3]}', '${values[4]}', ${values[5]}, ${values[6]}, '${values[7]}', '${values[8]}', '${values[9]}', '${values[10]}', '${values[11]}');\n`;
      stressProc.Write(query);
    }
    
    stressProc.End();
    await stressProc.Finish();
    const endTime = Date.now();
    console.log("[STEP 3] Inserción de 3,500 libros completada.");
    console.log(`[STEP 3] Tiempo total: ${endTime - startTime} ms`);
  } catch (err) {
    console.error("Error en step3_insert3500:", err);
  }
})();
