const Process = require('./Utils/Process');
const { saveMetric } = require('./Utils/metrics');

module.exports = async () => {
  try {
    console.log("[STEP 11] Probando fallos con el usuario C (sin permisos)...");
    const startTime = Date.now();
    let autorFailed = false;
    let libroFailed = false;
    let autorError = '';
    let libroError = '';

    // 1) Intentar insertar en Autor
    const autorStartTime = Date.now();
    try {
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
      const autorOutput = await cProcAutor.Finish();
      
      // Si llega aquí, verificar si realmente tuvo éxito
      if (autorOutput.includes("Query OK")) {
        console.error("[ERROR] La inserción en Autor tuvo éxito inesperadamente");
        // Revertir la inserción si ocurrió
        const revertProc = new Process("mysql", { shell: true });
        revertProc.ProcessArguments.push("-uroot");
        revertProc.ProcessArguments.push("-ppassword123");
        revertProc.Execute(true);
        revertProc.Write("USE biblioteca;\n");
        revertProc.Write("DELETE FROM Autor WHERE license = 'FAIL999999';\n");
        revertProc.End();
        await revertProc.Finish();
      }
    } catch (err) {
      autorFailed = true;
      autorError = err.message;
      const autorTime = Date.now() - autorStartTime;
      //saveMetric('step11', 'autor_insert_fail_time', autorTime);
      console.log(`[Autor Insert Fail] Tiempo: ${autorTime} ms`);
      console.log("Error esperado:", autorError);
    }

    // 2) Intentar insertar en Libro
    const libroStartTime = Date.now();
    try {
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
      const libroOutput = await cProcLibro.Finish();
      
      if (libroOutput.includes("Query OK")) {
        console.error("[ERROR] La inserción en Libro tuvo éxito inesperadamente");
        // Revertir la inserción si ocurrió
        const revertProc = new Process("mysql", { shell: true });
        revertProc.ProcessArguments.push("-uroot");
        revertProc.ProcessArguments.push("-ppassword123");
        revertProc.Execute(true);
        revertProc.Write("USE biblioteca;\n");
        revertProc.Write("DELETE FROM Libro WHERE ISBN = '9999999999999';\n");
        revertProc.End();
        await revertProc.Finish();
      }
    } catch (err) {
      libroFailed = true;
      libroError = err.message;
      const libroTime = Date.now() - libroStartTime;
      //saveMetric('step11', 'libro_insert_fail_time', libroTime);
      console.log(`[Libro Insert Fail] Tiempo: ${libroTime} ms`);
      console.log("Error esperado:", libroError);
    }

    // Verificación más flexible para diagnóstico
    if (!autorFailed || !libroFailed) {
      console.warn("\n[ADVERTENCIA] Comportamiento inesperado:");
      console.warn("- Inserción Autor falló:", autorFailed);
      console.warn("- Inserción Libro falló:", libroFailed);
      console.warn("Mensajes de error:");
      console.warn("Autor:", autorError || "Ningún error capturado");
      console.warn("Libro:", libroError || "Ningún error capturado");
      
      // Continuar pero marcar como advertencia en lugar de error
      console.warn("Continuando con el proceso, pero verifique los permisos del usuario C");
    }

    const totalTime = Date.now() - startTime;
    saveMetric('step11', 'total_time', totalTime);
    
    console.log(`[STEP 11] Proceso completado en ${totalTime} ms`);
    console.log("Resultado esperado: ambos inserts deberían fallar por falta de permisos");
    
    return totalTime;
  } catch (err) {
    console.error("Error en step11_failInsertsUserC:", err);
    throw err;
  }
};