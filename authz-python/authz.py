#! /usr/bin/env python

from pathlib import Path
import os
import json
import sys

from dotenv import load_dotenv
from emoji import emojize

from nile_api import AuthenticatedClient, Client
from nile_api.api.access import (
    create_policy,
    delete_policy,
    list_policies,
)
from nile_api.api.developers import login_developer
from nile_api.api.organizations import list_organizations
from nile_api.models.login_info import LoginInfo
from nile_api.models.create_policy_request import CreatePolicyRequest
from nile_api.models.action import Action
from nile_api.models.resource import Resource
from nile_api.models.subject import Subject

GOOD = emojize(":check_mark_button:")
BAD = emojize(":red_circle:")

load_dotenv(override=True)
params = {
    param: os.environ.get(param)
    for param in [
        "NILE_URL",
        "NILE_WORKSPACE",
        "NILE_DEVELOPER_EMAIL",
        "NILE_DEVELOPER_PASSWORD",
        "NILE_ORGANIZATION_NAME",
        "NILE_ENTITY_NAME",
    ]
}

for name, value in params.items():
    if not value:
        print(
            f"{BAD} Error: missing environment variable {name}. See .env.defaults for more info and copy it to .env with your values"  # noqa: E501
        )
        sys.exit(1)

users_path = Path(__file__).absolute().parent.parent.joinpath(
    "usecases",
    params["NILE_ENTITY_NAME"],
    "init",
    "users.json",
)
try:
    contents = users_path.read_text()
except FileNotFoundError:
    print(f"{BAD} could not find {users_path}")
    sys.exit(1)
else:
    # Load first user only
    user, *_ = json.loads(contents)

NILE_TENANT1_EMAIL = user["email"]
NILE_TENANT_PASSWORD = user["password"]

token = login_developer.sync(
    client=Client(base_url=params["NILE_URL"]),
    info=LoginInfo(
        email=params["NILE_DEVELOPER_EMAIL"],
        password=params["NILE_DEVELOPER_PASSWORD"],
    ),
)

client = AuthenticatedClient(base_url=params["NILE_URL"], token=token.token)

organizations = list_organizations.sync(
    workspace=params["NILE_WORKSPACE"],
    client=client,
)
matching = (
    organization
    for organization in organizations
    if organization.name == params["NILE_ORGANIZATION_NAME"]
)
org = next(matching, None)
if org is not None:
    print(f"{GOOD} Mapped organization name {org.name} to ID {org.id}")
else:
    print(
        f"{BAD} Could not map organization name {params['NILE_ORGANIZATION_NAME']} to an ID"  # noqa: E501
    )
    sys.exit(1)

print("\nPolicies at start:")
policies_start = list_policies.sync(
    client=client,
    workspace=params["NILE_WORKSPACE"],
    org=org.id,
)
print([each.name for each in policies_start])

# Create a new policy
data = CreatePolicyRequest(
    actions=[Action.DENY],
    resource=Resource(type=params["NILE_ENTITY_NAME"]),
    subject=Subject(email=NILE_TENANT1_EMAIL),
)
print(f"\nCreating new policy {data}.")
policy = create_policy.sync(
    client=client,
    workspace=params["NILE_WORKSPACE"],
    org=org.id,
    json_body=data,
)
print(f"{GOOD} policy id is {policy.id}")
print(
    "\nPolicies post-create:",
    list_policies.sync(
        client=client,
        workspace=params["NILE_WORKSPACE"],
        org=org.id,
    ),
)

# Delete the policy just created
response = delete_policy.sync_detailed(
    client=client,
    workspace=params["NILE_WORKSPACE"],
    org=org.id,
    policy_id=policy.id,
)
print("policy id {} is deleted".format(policy.id))

print("\nPolicies post-delete:")
policies_end = list_policies.sync(
    client=client,
    workspace=params["NILE_WORKSPACE"],
    org=org.id,
)
print([each.name for each in policies_end])

if policies_start != policies_end:
    print(
        f"{BAD} Something is wrong, policies at start should equal policies at end"  # noqa: E501
    )
    sys.exit(1)

sys.exit(0)
