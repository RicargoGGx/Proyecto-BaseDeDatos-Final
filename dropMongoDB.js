// dropMongoDB.js
const Process = require('./Utils/Process');

(async () => {
  try {
    console.log("[INFO] Borrando la DB 'BiblioMongo' en Mongo...");
    const dropMongoDB = new Process("mongosh", { shell: true });
    dropMongoDB.Execute(true);
    // Conectarse a la DB y eliminarla
    dropMongoDB.Write("use BiblioMongo;\n");
    dropMongoDB.Write("db.dropDatabase();\n");
    dropMongoDB.End();

    await dropMongoDB.Finish();
    console.log("¡DB 'BiblioMongo' eliminada con éxito!");
  } catch (err) {
    console.error("Error al borrar la DB de Mongo:", err);
  }
})();
