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

async function setupOrg() {

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

  // Check if org exists, create if not
  let orgName = "Colton Labs"
  var myOrgs = await nile.organizations.listOrganizations();
  var maybeOrg = myOrgs.find( org => org.name == orgName);
  if (maybeOrg) {
    console.log(emoji.get('dart'), "Org " + orgName + " exists with id " + maybeOrg.id);
  } else {
    await nile.organizations.createOrganization({"createOrganizationRequest" :
    {
      name: orgName,
    }}).then ( (org) => {
      if (org !== null) {
        let orgID = org.id;
        console.log(emoji.get('white_check_mark'), "Created new org " + org.name + " with orgID " + orgID);
      }
    }).catch((error:any) => {
      if (error.message == "org already exists") {
        console.log("Org with name " + orgName + " already exists but cannot get ID");
        process.exit(1);
      } else {
        console.error(error);
        process.exit(1);
      }
    })
  }

}

setupOrg();
