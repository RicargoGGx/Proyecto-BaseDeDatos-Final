const fs = require('fs');
const path = require('path');
const Process = require('./Utils/Process');
const { saveMetric } = require('./Utils/metrics');

// Función para generar números aleatorios
function random_number(min, max) {
  return Math.floor(Math.random() * (max - min) + min);
}

// Función para generar texto aleatorio
function random_text(characters_num) {
  let text = "";
  for (let i = 0; i < characters_num; i++) {
    const letra = String.fromCharCode(random_number(65, 90));
    text += letra;
  }
  return text;
}

// Genera un CSV con autores
function generate_authors_csv(size) {
  let csv = "";
  for (let i = 1; i <= size; i++) {
    const id = i;
    const license = "LIC" + (1000000 + i) + random_text(3);
    const name = "Autor" + random_text(3);
    const lastName = "Apellido" + random_text(2);
    const secondLastName = "Apellido2" + random_text(2);
    const year = random_number(1900, 2023);
    csv += `${id},${license},${name},${lastName},${secondLastName},${year}\n`;
  }
  return csv;
}

module.exports = async () => {
  try {
    console.log("[STEP 7] Iniciando generación e inserción de 150,000 autores...");
    
    // 1. Generación del CSV
    const genStartTime = Date.now();
    const authorsCSVDir = path.join(__dirname, 'csv');
    if (!fs.existsSync(authorsCSVDir)) {
      fs.mkdirSync(authorsCSVDir);
    }
    
    const csvData = generate_authors_csv(150000);
    const csvFilePath = path.join(authorsCSVDir, 'autores_150k.csv');
    fs.writeFileSync(csvFilePath, csvData);
    const genEndTime = Date.now();
    const genTime = genEndTime - genStartTime;
    
    console.log(`[STEP 7] CSV generado en: ${genTime} ms`);

    // 2. Inserción a la base de datos
    const insertStartTime = Date.now();
    const insertProc = new Process("mysql", { shell: true });
    insertProc.ProcessArguments.push("--local-infile=1");
    insertProc.ProcessArguments.push("-uB");
    insertProc.ProcessArguments.push("-ppasswordB");
    insertProc.Execute(true);
    
    insertProc.Write("USE biblioteca;\n");
    insertProc.Write(`
      LOAD DATA LOCAL INFILE '${csvFilePath.replace(/\\/g, '/')}'
      INTO TABLE Autor
      FIELDS TERMINATED BY ','
      LINES TERMINATED BY '\\n'
      (id, license, name, lastName, secondLastName, year);
    `);
    insertProc.End();
    await insertProc.Finish();
    const insertEndTime = Date.now();
    const insertTime = insertEndTime - insertStartTime;
    
    saveMetric('step7', 'total_time', genTime + insertTime);

    console.log(`[STEP 7] Autores insertados en: ${insertTime} ms`);
    console.log(`[STEP 7] Tiempo total: ${genTime + insertTime} ms`);
    
    return {
      generationTime: genTime,
      insertionTime: insertTime,
      totalTime: genTime + insertTime
    };
  } catch (err) {
    console.error("Error en step7_insert150kAuthors:", err);
    throw err;
  }
};