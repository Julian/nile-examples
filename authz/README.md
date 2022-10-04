# Authorization

![image](../images/Nile-text-logo.png)

## Overview

This example uses the NILE JS SDK to demonstrate authorization features in Nile in the following workflow:

- List the `DB` instances allowed to be read by the user nora@demo.io in a given organization
- Create a new policy that denies the user access to instances of the type `DB` (organization is provided in the request)

  ```json
  {
    "actions": [ "deny" ],
    "resource": { "type": "DB" },
    "subject": { "email": "nora@demo.io" }
  }
  ```

- List the `DB` instances allowed to be read by the user in a given organization: should be none
- Delete the policy
- List the `DB` instances allowed to be read by the user in a given organization


## Install Dependencies

Run the following command:

```
yarn install
```

Your output should resemble:

```bash
yarn install v1.22.19
warning package.json: No license field
warning No license field
[1/4] 🔍  Resolving packages...
[2/4] 🚚  Fetching packages...
[3/4] 🔗  Linking dependencies...
[4/4] 🔨  Building fresh packages...
✨  Done in 2.26s.
```

## Setup

For all examples, you need a local file with your Nile configuration.
For that purpose, at the top-level of the examples, copy the `.env.defaults` file to `.env`:

```bash
# From the top level of the examples folder
$ examples> cp .env.defaults .env
```

Set the values in this `.env` file to match the values you want in your control plane.

## Execute

To execute the workflow, run the following command:

```
yarn start
```
