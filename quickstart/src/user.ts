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

async function setupUser() {

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

  // Check if user exists, create if not
  let email = "shaun@colton.demo"
  let password = "password"
  var myUsers = await nile.users.listUsers()
  if (myUsers.find( usr => usr.email==email)) {
      console.log(emoji.get('dart'), "User " + email + " exists");
  } else {
    await nile.users.createUser({
      createUserRequest : {
        email : email,
        password : password,
      }
    }).then ( (usr) => {
      if (usr != null)
        console.log(emoji.get('white_check_mark'), "Created User: " + usr.email);
    }).catch((error:any) => {
      if (error.message == "user already exists") {
        console.log("User with email " + email + " already exists");
      } else {
        console.error(error);
        process.exit(1);
      }
    })
  }

}

setupUser();
