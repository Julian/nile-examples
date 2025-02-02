import Nile from '@theniledev/js';

var exampleUtils = require('../../utils-module-js/').exampleUtils;

var emoji = require('node-emoji');

import * as dotenv from 'dotenv';

dotenv.config({ override: true });

let envParams = [
  "NILE_URL",
  "NILE_WORKSPACE",
  "NILE_DEVELOPER_EMAIL",
  "NILE_DEVELOPER_PASSWORD",
  "NILE_ENTITY_NAME",
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
const NILE_ENTITY_NAME = process.env.NILE_ENTITY_NAME!;

const fs = require('fs');
const EntityDefinition = JSON.parse(fs.readFileSync(`../usecases/${NILE_ENTITY_NAME}/entity_definition.json`));

const users = require(`../../usecases/${NILE_ENTITY_NAME}/init/users.json`);
// Load first user only
const index=0
const NILE_TENANT1_EMAIL = users[index].email;
const NILE_TENANT_PASSWORD = users[index].password;
const NILE_ORGANIZATION_NAME = users[index].org;

const nile = Nile({
  basePath: NILE_URL,
  workspace: NILE_WORKSPACE,
});

console.log(`export NILE_URL=${NILE_URL}`);
console.log(`export NILE_WORKSPACE=${NILE_WORKSPACE}`);


async function testTenant(orgID : string, expectEmpty : boolean = false) {

  await exampleUtils.loginAsUser(nile, NILE_TENANT1_EMAIL, NILE_TENANT_PASSWORD);

  // List instances of the service
  await nile.entities.listInstances({
    org: orgID,
    type: NILE_ENTITY_NAME,
  }).then((instances) => {
    console.log(`\n--> TENANT: list of allowed instances (expectEmpty is ${expectEmpty}):`, instances);
    if (expectEmpty && instances.length != 0) {
      console.error(emoji.get('x'), `Error: Tenant should not see ${NILE_ENTITY_NAME} instances`);
      process.exit(1);
    }
  }).catch((error: any) => {
      console.error(emoji.get('x'), `Error while calling listInstances for orgID ${orgID} as tenant ${NILE_TENANT1_EMAIL}:\n`, error);
      process.exit(1);
    });

}

async function listPolicies(orgID : string) {

  console.log(`\nLogging into Nile at ${NILE_URL}, workspace ${NILE_WORKSPACE}, as developer ${NILE_DEVELOPER_EMAIL} in order to listPolicies for ${orgID}`);

  await exampleUtils.loginAsDev(nile, NILE_DEVELOPER_EMAIL, NILE_DEVELOPER_PASSWORD);

  // List policies
  const body = {
    org: orgID,
  };
  await nile.access
    .listPolicies(body)
    .then((data) => {
      console.log(`\nListed policies for orgID ${orgID}: `, data);
    })
    .catch((error: any) => {
      console.error(emoji.get('x'), `Error while calling listPolicies for orgID ${orgID}:\n`, error);
      process.exit(1);
    });
}



async function run() {

  console.log(`\nLogging into Nile at ${NILE_URL}, workspace ${NILE_WORKSPACE}, as developer ${NILE_DEVELOPER_EMAIL}`);

  await exampleUtils.loginAsDev(nile, NILE_DEVELOPER_EMAIL, NILE_DEVELOPER_PASSWORD);

  console.log(`NILE_ORGANIZATION_NAME is ${NILE_ORGANIZATION_NAME}`);

  let createIfNot = false;
  let orgID = await exampleUtils.maybeCreateOrg (nile, NILE_ORGANIZATION_NAME, false);
  if (!orgID) {
    console.error ("Error: cannot determine the ID of the organization from the provided name: " + NILE_ORGANIZATION_NAME)
    process.exit(1);
  }

  // List policies
  listPolicies(orgID);

  // List instances of the service
  await nile.entities.listInstances({
    org: orgID,
    type: NILE_ENTITY_NAME,
    }).then((instances) => {
      console.log('DEVELOPER: list of allowed instances:', instances);
    })
    .catch((error: any) => console.error(error));

  console.log('Test tenant before');
  await testTenant(orgID, false);

  await exampleUtils.loginAsDev(nile, NILE_DEVELOPER_EMAIL, NILE_DEVELOPER_PASSWORD);

  // Create policy
  var policyID;
  const body = {
    org: orgID,
    createPolicyRequest: {
      actions: ["deny"],
      resource: {
        type: NILE_ENTITY_NAME,
        //id: <instance id>,
      },
      subject: { email : NILE_TENANT1_EMAIL },
    },
  };
  console.log("Creating policy with body: " + JSON.stringify(body, null, 2));
  await nile.access
    .createPolicy(body)
    .then((data) => {
      policyID = JSON.stringify(data.id, null, 2).replace(/['"]+/g, '');
      console.log(emoji.get('white_check_mark'), `Created policy with id ${policyID} to deny ${NILE_TENANT1_EMAIL} from entity ${NILE_ENTITY_NAME}.`);
      //console.log(JSON.stringify(data, (key, value) => value instanceof Set ? Array.from(value) : value));
    })
    .catch((error: any) => console.error(error));

  // List policies
  listPolicies(orgID);

  console.log('Test tenant after');
  await testTenant(orgID, true);

  await exampleUtils.loginAsDev(nile, NILE_DEVELOPER_EMAIL, NILE_DEVELOPER_PASSWORD);

  // Delete policy
  const body = {
    org: orgID,
    policyId: policyID,
  };
  console.log("\nDeleting policy with body: " + JSON.stringify(body, null, 2));
  await nile.access
    .deletePolicy(body)
    .then((data) => {
      console.log(emoji.get('white_check_mark'), `Deleted policy with id ${policyID}`);
    })
    .catch((error: any) => console.error(error));

  // List policies
  listPolicies(orgID);

  console.log('Test tenant after');
  await testTenant(orgID, false);
}

run();
