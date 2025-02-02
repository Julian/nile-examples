#! python

# pylint: disable=consider-using-f-string

import os
import json
import sys
import requests
import emoji
from dotenv import load_dotenv

load_dotenv(override=True)
required_params = [
  "NILE_URL",
  "NILE_WORKSPACE",
  "NILE_DEVELOPER_EMAIL",
  "NILE_DEVELOPER_PASSWORD",
  "NILE_ORGANIZATION_NAME",
  "NILE_ENTITY_NAME"
]
for param in required_params:
  if not os.environ.get(param):
    print(emoji.emojize(':red_circle:') + " Error: missing environment variable {}. See .env.defaults for more info and copy it to .env with your values".format(param))
    sys.exit(1)

NILE_URL                = os.environ.get('NILE_URL')
NILE_WORKSPACE          = os.environ.get('NILE_WORKSPACE')
NILE_DEVELOPER_EMAIL    = os.environ.get('NILE_DEVELOPER_EMAIL')
NILE_DEVELOPER_PASSWORD = os.environ.get('NILE_DEVELOPER_PASSWORD')
NILE_ORGANIZATION_NAME  = os.environ.get('NILE_ORGANIZATION_NAME')
NILE_ENTITY_NAME        = os.environ.get('NILE_ENTITY_NAME')

f = '../usecases/'+NILE_ENTITY_NAME+'/init/users.json'
try:
  users = json.load(open(f))
except:
  print(emoji.emojize(':red_circle:') + " could not load {}".format(f))
  sys.exit(1)
# Load first user only
index=0
NILE_TENANT1_EMAIL = users[0]['email']
NILE_TENANT_PASSWORD = users[0]['password']


def list_policies():
    """List all authorization policies in an organization"""

    global org_id

    # List
    path = "/workspaces/{}/orgs/{}/access/policies".format(NILE_WORKSPACE, org_id)
    #print(headers, NILE_URL, path)
    response = requests.get(NILE_URL+path, headers=headers, timeout=30)
    if response.status_code == 200:
        print(json.dumps(response.json(), indent=2))
        return response.json()
    else:
        print(emoji.emojize(':red_circle:') + " response status code is {}".format(response.status_code))
        sys.exit(1)

def get_org_id_from_org_name(org_name):
    """Get an organization ID from an organization name"""

    path = "/workspaces/{}/orgs".format(NILE_WORKSPACE)
    #print(headers, NILE_URL, path)
    response = requests.get(NILE_URL+path, headers=headers, timeout=30)
    if response.status_code == 200:
        for org in response.json():
            if org.get('name') == org_name:
                org_id = org.get('id')
                break
        if 'org_id' not in locals():
            print(emoji.emojize(":red_circle:") + " Could not map organization name {} to an ID".format(org_name))
            sys.exit(1)
        print(emoji.emojize(':check_mark_button:') + " Mapped organization name {} to ID {}".format(org_name, org_id))
        return org_id
    else:
        print(emoji.emojize(':red_circle:') + " response status code is {}".format(response.status_code))
        sys.exit(1)



# Get Nile access token
data = {
    "email"    : NILE_DEVELOPER_EMAIL,
    "password" : NILE_DEVELOPER_PASSWORD
}
path = "/auth/login"
response = requests.post(NILE_URL+path, json=data, timeout=30)
if response.status_code == 200:
    NILE_ACCESS_TOKEN=response.json()['token']
    print(emoji.emojize(':check_mark_button:') + " --> Logged into Nile as developer {}\nToken: {}\n".format(NILE_DEVELOPER_EMAIL,NILE_ACCESS_TOKEN))
else:
    print(emoji.emojize(":red_circle:") + " Could not get Nile access token for developer {}".format(NILE_DEVELOPER_EMAIL))
    sys.exit(1)

headers = {
  "Authorization": "Bearer "+NILE_ACCESS_TOKEN
}

org_id = get_org_id_from_org_name(NILE_ORGANIZATION_NAME)

print("\nPolicies at start:")
policies_start = list_policies()

# Create a new policy
data = {
    "actions"  : ["deny"],
    "resource" : {"type" : NILE_ENTITY_NAME},
    "subject"  : {"email": NILE_TENANT1_EMAIL}
}
json_string = json.dumps(data)
print("\nCreating new policy {}".format(json_string))
path = "/workspaces/{}/orgs/{}/access/policies".format(NILE_WORKSPACE, org_id)
#print(headers, NILE_URL, path)
response = requests.post(NILE_URL+path, headers=headers, json=data, timeout=30)
if response.status_code == 201:
    policy_id=response.json()['id']
    print(emoji.emojize(':check_mark_button:') + " policy id is {}".format(policy_id))
else:
    print("response status code is {}".format(response.status_code))
    sys.exit(1)

print("\nPolicies post-create:")
list_policies()

# Delete the policy just created
path = "/workspaces/{}/orgs/{}/access/policies/{}".format(NILE_WORKSPACE, org_id, policy_id)
#print(headers, NILE_URL, path)
response = requests.delete(NILE_URL+path, headers=headers, timeout=30)
if response.status_code == 204:
    print(emoji.emojize(':check_mark_button:') + " policy id {} is deleted".format(policy_id))
else:
    print(emoji.emojize(':red_circle:') + "response status code is {}".format(response.status_code))
    sys.exit(1)

print("\nPolicies post-delete:")
policies_end = list_policies()

if policies_start != policies_end:
    print(emoji.emojize(':red_circle:') + "Something is wrong, policies at start should equal policies at end")
    sys.exit(1)

sys.exit(0)
