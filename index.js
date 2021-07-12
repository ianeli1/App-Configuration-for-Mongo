const appConfig = require("@azure/app-configuration");
const express = require('express')
const dotenv = require('dotenv');
let MongoClient = require('mongodb').MongoClient
dotenv.config();
const app = express()
const port = process.env.PORT || 3000

const client = new appConfig.AppConfigurationClient(process.env.AppConfigurationConnectionString);
let currentLabel;

async function getCurrLabel() {
  const newVal = await client.getConfigurationSetting({ key: "current-label" })
  if(currentLabel !== newVal.value){
    console.log(`[AppConfig] current-label changed: '${currentLabel}' => '${newVal.value}'`)
  }
  return newVal
}

setInterval(async () => {
  currentLabel = (await getCurrLabel()).value;
}, 30000)

getCurrLabel().then(v => {
  currentLabel = v.value
  app.get('/', (req, res) => {
    client.getConfigurationSetting({ key: "mongo-endpoint", label: currentLabel }).then(
      mongoUrl => {
        MongoClient.connect(mongoUrl.value, { useNewUrlParser: true }, (err, db) => {
          if (err) {
            res.status(500).send('💥 Error con la conexion a la base de datos. ¿Es el App Config Secret correcto? 💥: ' + err);
          } else {
            res.send('Me conecté a la DB mongo del Label: "' + currentLabel + '"  del App Configuration ! 😎');
            db.close();
          }
        });
      }
    );

  });
})



app.listen(port, () => console.log(`Server listening on port ${port}!`))

