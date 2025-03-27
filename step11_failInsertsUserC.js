// step11_failInsertsUserC.js
const Process = require('./Utils/Process');

(async () => {
  try {
    console.log("[STEP 11] Probando fallos con el usuario C (sin permisos)...");

    // 1) Intentar insertar en Autor
    const startTimeAutor = Date.now();
    const cProcAutor = new Process("mysql", { shell: true });
    cProcAutor.ProcessArguments.push("-uC");
    cProcAutor.ProcessArguments.push("-ppasswordC"); 
    cProcAutor.Execute(true);

    cProcAutor.Write("USE biblioteca;\n");
    cProcAutor.Write(`
      INSERT INTO Autor (id, license, name, lastName, secondLastName, year)
      VALUES (999999, 'FAIL999999', 'NoPermisos', 'Apellido', 'Apellido2', 2000);
    `);
    cProcAutor.End();
    await cProcAutor.Finish();

    const endTimeAutor = Date.now();
    console.log(`[Autor Insert Fail] Tiempo: ${endTimeAutor - startTimeAutor} ms`);
    console.log("Logs:\n", cProcAutor.Logs);

    // 2) Intentar insertar en Libro
    const startTimeLibro = Date.now();
    const cProcLibro = new Process("mysql", { shell: true });
    cProcLibro.ProcessArguments.push("-uC");
    cProcLibro.ProcessArguments.push("-ppasswordC");
    cProcLibro.Execute(true);

    cProcLibro.Write("USE biblioteca;\n");
    cProcLibro.Write(`
      INSERT INTO Libro (id, ISBN, title, autor_license, pages, year, language)
      VALUES (999999, '9999999999999', 'Fallo', 'LICENSE123', 300, 2023, 'ES');
    `);
    cProcLibro.End();
    await cProcLibro.Finish();

    const endTimeLibro = Date.now();
    console.log(`[Libro Insert Fail] Tiempo: ${endTimeLibro - startTimeLibro} ms`);
    console.log("Logs:\n", cProcLibro.Logs);

    console.log("Ambos intentos deberían fallar por falta de permisos.");
  } catch (err) {
    console.error("Error en step11_failInsertsUserC:", err);
  }
})();
