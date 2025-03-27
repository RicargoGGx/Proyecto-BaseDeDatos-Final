// step10_snapshotMySQL.js
const Process = require('./Utils/Process');
const fs = require('fs');

(async () => {
  try {
    console.log("[STEP 10] Generando snapshot (mysqldump) de la base de datos...");

    // 1) Dump (snapshot)
    const startDump = Date.now();
    const dumpProc = new Process("mysqldump", { shell: true });
    dumpProc.ProcessArguments.push("-uroot");
    dumpProc.ProcessArguments.push("-ppasswordRoot");
    dumpProc.ProcessArguments.push("biblioteca");
    dumpProc.ProcessArguments.push("--result-file=biblioteca_snapshot.sql"); // Nombre del snapshot
    dumpProc.Execute(true);
    await dumpProc.Finish();

    const endDump = Date.now();
    console.log(`[Snapshot] Dump completado en: ${endDump - startDump} ms`);

    // 2) Importar el snapshot (p. ej., en otra DB o la misma).
    // O, si quieres, primero drop la DB `biblioteca`. 
    // Para no romper tus datos, podrías crear una DB "biblioteca_test".
    console.log("[STEP 10] Importando snapshot...");
    const startImport = Date.now();

    const importProc = new Process("mysql", { shell: true });
    importProc.ProcessArguments.push("-uroot");
    importProc.ProcessArguments.push("-ppasswordRoot");
    // Importar en la misma base u otra (ej: biblioteca_test).
    importProc.ProcessArguments.push("biblioteca_test");  
    importProc.Execute(true);

    // Aquí inyectamos el contenido del archivo con un redireccionamiento:
    // Sin embargo, con Process.js no es tan trivial. 
    // Una forma: "mysql -uroot -p biblioteca_test < biblioteca_snapshot.sql" 
    // se hace en la consola normal. 
    // Con la clase Process, puedes simularlo:
    importProc.Write(`SOURCE biblioteca_snapshot.sql;\n`);
    importProc.End();
    await importProc.Finish();

    const endImport = Date.now();
    console.log(`[Snapshot] Import completado en: ${endImport - startImport} ms`);

    console.log("¡Snapshot (dump + import) completado!");
  } catch (err) {
    console.error("Error en step10_snapshotMySQL:", err);
  }
})();
