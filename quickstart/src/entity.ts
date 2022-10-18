import Nile, { CreateEntityRequest } from "@theniledev/js";
import { CreateEntityOperationRequest } from "@theniledev/js/dist/generated/openapi/src";

var emoji = require('node-emoji');

import * as dotenv from 'dotenv';

dotenv.config({ override: true })

let envParams = [
  "NILE_URL",
  "NILE_WORKSPACE",
  "NILE_DEVELOPER_EMAIL",
  "NILE_DEVELOPER_PASSWORD",
]
envParams.forEach( (key: string) => {
  if (!process.env[key]) {
    console.error(emoji.get('x'), `Error: missing environment variable ${ key }. See .env.defaults for more info and copy it to .env with your values`);
    process.exit(1);
  }
});

const NILE_URL = process.env.NILE_URL!;
const NILE_WORKSPACE = process.env.NILE_WORKSPACE!;
const NILE_DEVELOPER_EMAIL = process.env.NILE_DEVELOPER_EMAIL!;
const NILE_DEVELOPER_PASSWORD = process.env.NILE_DEVELOPER_PASSWORD!;
const NILE_ENTITY_NAME = "DB";

const fs = require('fs');
try {
  const EntityDefinition = JSON.parse(fs.readFileSync(`../usecases/${NILE_ENTITY_NAME}/entity_definition.json`))
} catch (err) {
  console.error(err);
  console.error(emoji.get('x'), `Did you check that ../usecases/${NILE_ENTITY_NAME}/entity_definition.json exists?`);
  process.exit(1);
}

const nile = Nile({
  basePath: NILE_URL,
  workspace: NILE_WORKSPACE,
});

// Schema for the entity that defines the service in the data plane
const entityDefinition: CreateEntityRequest = EntityDefinition;

// Workflow for the Nile developer
async function createEntity() {

  // Login developer
  await nile.developers.loginDeveloper({
    loginInfo: {
      email: NILE_DEVELOPER_EMAIL,
      password: NILE_DEVELOPER_PASSWORD,
    },
    }).catch((error:any) => {
      console.error(emoji.get('x'), `Error: Failed to login to Nile as developer ${NILE_DEVELOPER_EMAIL}: ` + error.message);
      process.exit(1);
    });
  nile.authToken = nile.developers.authToken;
  console.log("\n" + emoji.get('arrow_right'), ` Logged into Nile as developer ${NILE_DEVELOPER_EMAIL}`);
  console.log(`export NILE_ACCESS_TOKEN=${nile.authToken}`);

  // Check if entity exists, create if not
  var myEntities =  await nile.entities.listEntities()
  if (myEntities.find( ws => ws.name==entityDefinition.name)) { 
      console.log(emoji.get('dart'), "Entity " + entityDefinition.name + " exists");
  } else {
      await nile.entities.createEntity({
        createEntityRequest: entityDefinition
      }).then((data) => 
      {
        console.log(emoji.get('white_check_mark'), 'Created entity: ' + JSON.stringify(data, null, 2));
      }).catch((error:any) => console.error(error.message)); 
  }
}

createEntity();
