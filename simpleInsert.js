const Process = require('./Utils/Process');

(async () => {
  try {
    console.log("Insertando un registro simple en Autor...");
    const proc = new Process("mysql", { shell: true });
    proc.ProcessArguments.push("-uroot");
    proc.ProcessArguments.push("-pR4bb1t");
    proc.Execute(true);
    proc.Write("USE biblioteca;\n");
    proc.Write("INSERT INTO Autor (id, license, name, lastName, secondLastName, year) VALUES (999, 'TEST999', 'Test', 'TestLast', 'Test2', 2000);\n");
    proc.End();
    await proc.Finish();
    console.log("Inserción simple completada. Verifica en MySQL.");
  } catch (error) {
    console.error("Error en inserción simple:", error);
  }
})();
