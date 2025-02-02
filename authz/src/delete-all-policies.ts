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

const nile = Nile({
  basePath: NILE_URL,
  workspace: NILE_WORKSPACE,
});

async function deletePoliciesFromOrg (orgName: string) {

  // Get orgID
  let createIfNot = false;
  let orgID = await exampleUtils.maybeCreateOrg (nile, orgName, false);
  if (!orgID) {
    console.error ("Error: cannot determine the ID of the organization from the provided name :" + orgName)
    process.exit(1);
  } 

  // List policies
  const body = {
    org: orgID,
  };
  await nile.access
    .listPolicies(body)
    .then((data) => {
      console.log('Listed policies: ', data);
      for (let i=0; i < data.length; i++) {
        let policyID = data[i].id;
        // Delete policy
        const delBody = {
          org: orgID,
          policyId: policyID,
        };
        nile.access
          .deletePolicy(delBody)
          .then((res) => {
            console.log(emoji.get('ghost'), `Deleted policy: ${policyID}`);
          })
          .catch((error: any) => console.error(error));
      }
    }).catch((error: any) => console.error(error));

}

async function run() {
  await exampleUtils.loginAsDev(nile, NILE_DEVELOPER_EMAIL, NILE_DEVELOPER_PASSWORD);

  var actions;
  const entities = require(`../../usecases/${NILE_ENTITY_NAME}/init/entities.json`);
  const users = require(`../../usecases/${NILE_ENTITY_NAME}/init/users.json`);
  for (let index = 0 ; index < entities.length ; index++) {
    let pageOrg = entities[index].org;
    await deletePoliciesFromOrg(pageOrg);
  }
}

run();
