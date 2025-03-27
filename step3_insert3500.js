// step3_insert3500.js
const Process = require('./Utils/Process');

(async () => {
  try {
    console.log("[STEP 3] Insertando 3,500 Libros (estrés) en 'Libro'...");
    const startTime = Date.now();

    const stressProc = new Process("mysql", { shell: true });
    stressProc.ProcessArguments.push("-uA");
    stressProc.ProcessArguments.push("-ppasswordA");
    stressProc.Execute(true);

    stressProc.Write("USE biblioteca;\n");

    for (let i = 0; i < 3500; i++) {
      const isbn = Math.round(Math.random() * 9999999999);
      const title = `LibroEstres${i}`;
      const pages = Math.floor(Math.random() * 1000);
      const year = 1950 + Math.floor(Math.random() * 75);
      const language = "ES";
      const query = `INSERT INTO Libro (ISBN, title, autor_license, pages, year, language)
                     VALUES ('${isbn}', '${title}', 'LICENSE123', ${pages}, ${year}, '${language}');\n`;
      stressProc.Write(query);
    }

    stressProc.End();
    await stressProc.Finish();

    const endTime = Date.now();
    console.log(`[STEP 3] Tiempo total: ${endTime - startTime} ms`);
    console.log("Inserción de 3,500 Libros de estrés completada.");
  } catch (err) {
    console.error("Error en step3_insert3500:", err);
  }
})();
