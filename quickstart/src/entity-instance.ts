import Nile from "@theniledev/js";

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

const nile = Nile({
  basePath: NILE_URL,
  workspace: NILE_WORKSPACE,
});

async function createInstance() {

  // login as user
  let email = "shaun@colton.demo"
  let password = "password"
  await nile.users.loginUser({
    loginInfo: {
      email: email,
      password: password,
    },
    }).catch((error:any) => {
      console.error(emoji.get('x'), `Error: Failed to login to Nile as user ${email}: ` + error.message);
      process.exit(1);
    });
  nile.authToken = nile.users.authToken;
  console.log("\n" + emoji.get('arrow_right'), ` Logged into Nile as user ${email}`);
  console.log(`export NILE_ACCESS_TOKEN=${nile.authToken}`);

  // Get orgID
  let orgName = "Colton Labs"
  var orgID;
  var myOrgs = await nile.organizations.listOrganizations();
  var maybeOrg = myOrgs.find( org => org.name == orgName);
  if (maybeOrg) {
    orgID = maybeOrg.id
    console.log(emoji.get('dart'), "Org " + orgName + " exists with id " + orgID);
  } else {
    console.error(emoji.get('x'), `Cannot get orgID from ${orgName}`);
    process.exit(1);
  }

  // Check if entity instance already exists, create if not
  let dbName = "myDB-products";
  let cloud = "gcp";
  let environment = "prod";
  let size = 100;
  let org = "customer-org-1";
  let myInstances = await nile.entities.listInstances({
    org: orgID,
    type: NILE_ENTITY_NAME,
  });
  let maybeInstance = myInstances.find( instance => instance.type == NILE_ENTITY_NAME && instance.properties["dbName"] == dbName );
  if (maybeInstance) {
    console.log("Entity instance " + NILE_ENTITY_NAME + ` exists where dbName is ${dbName} (id: ${maybeInstance.id})`);
  } else {
    console.log(myInstances);
    await nile.entities.createInstance({
      org: orgID,
      type: NILE_ENTITY_NAME,
      body: {
        dbName : dbName,
        cloud : cloud,
        environment : environment,
        size : size,
        connection : "server-" + dbName + ":3306",
        status : "Up"
      }
    }).then((entity_instance) => console.log ("Created entity instance: " + JSON.stringify(entity_instance, null, 2)))
  }

}

createInstance();
