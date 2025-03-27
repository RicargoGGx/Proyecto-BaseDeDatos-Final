// step7_insert150kAuthors.js
const fs = require('fs');
const path = require('path');
const Process = require('./Utils/Process');

function random_number(min, max) {
  return Math.floor(Math.random() * (max - min) + min);
}

function random_text(characters_num) {
  let text = "";
  for (let i = 0; i < characters_num; i++) {
    // 65 - 90 => A-Z. Ajusta si quieres minúsculas también
    const letra = String.fromCharCode(random_number(65, 90));
    text += letra;
  }
  return text;
}

// Genera un CSV con 150,000 autores:
// Columnas: id, license, name, lastName, secondLastName, year
function generate_authors_csv(size) {
  let csv = "";
  for (let i = 1; i <= size; i++) {
    const id = i;
    // Por ejemplo: "LIC" + un número + random chars
    const license = "LIC" + (1000000 + i) + random_text(3);
    const name = "Autor" + random_text(3);
    const lastName = "Apellido" + random_text(2);
    const secondLastName = "Apellido2" + random_text(2);
    const year = random_number(1900, 2023);

    // Generamos la línea CSV
    csv += `${id},${license},${name},${lastName},${secondLastName},${year}\n`;
  }
  return csv;
}

(async () => {
  try {
    // 1) Generar CSV
    console.log("[STEP 7] Generando CSV para 150,000 Autores...");
    const authorsCSVDir = path.join(__dirname, 'csv');
    if (!fs.existsSync(authorsCSVDir)) {
      fs.mkdirSync(authorsCSVDir);
    }

    const startTime = Date.now();
    const csvData = generate_authors_csv(150000);

    const csvFilePath = path.join(authorsCSVDir, 'autores_150k.csv');
    fs.writeFileSync(csvFilePath, csvData);

    let endTime = Date.now();
    console.log(`[STEP 7 - Generación CSV] Tiempo: ${endTime - startTime} ms`);
    console.log(`Archivo generado: ${csvFilePath}`);

    // 2) Insertar en la tabla Autor usando LOAD DATA LOCAL INFILE
    // (Asegúrate de tener la estructura: 
    //   CREATE TABLE Autor(
    //       id INT,
    //       license VARCHAR(12) NOT NULL PRIMARY KEY,  -- o UNIQUE
    //       name TINYTEXT NOT NULL,
    //       lastName TINYTEXT,
    //       secondLastName TINYTEXT,
    //       year SMALLINT
    //   );
    //  )

    console.log("[STEP 7] Insertando 150,000 Autores...");
    const insertProc = new Process("mysql", { shell: true });
    insertProc.ProcessArguments.push("-uB");         // Podría ser usuario B (tiene INSERT en Autor)
    insertProc.ProcessArguments.push("-ppasswordB"); // Ajusta la contraseña
    insertProc.Execute(true); // Marca tiempo inicial

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

    endTime = Date.now();
    console.log(`[STEP 7 - Inserción] Tiempo: ${endTime - insertProc.StartTime} ms`);
    console.log("¡Autores insertados correctamente!");
  } catch (err) {
    console.error("Error en step7_insert150kAuthors:", err);
  }
})();
