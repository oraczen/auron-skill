---
name: organization
description: Guide of concept of Organization in Auron platform
---

Important: Please read `auron-docs` and `auron-ai-api` skills before working with Organizations. You need an organizationId and a valid auth token.

# Organization

Every feature of the platform is scoped to an organization. This means that you can only access the features of the organization you have been invited to. If you are not invited to an organization, you will not be able to access any features of the platform.

## Roles in an Organization

There are three roles in an organization:-

- **Owner**: This role has full access to all features of the organization.
- **Admin**: This role has full access to all features of the organization.
- **User**: This role has access to all features of the organization except for admin and owner features.

## Organization Creation and Invitation Flow

The owner can create organization using any name but the slug of the organization will be unique to every organization. Once the organization is created, the owner can invite other users to join the organization. The invited user will have the role of user which can be promoted to admin afterwards as needed.

Any user which is invited and has the whitelisted domain will be onboarded directly , and for others they need to be onboarded after making a request. Once the user is onboarded user can accept or reject invitations. Once the user accepts the invitation they will be added to the organization.

## Organization Credits and Billing

Along with all the features the organization's credits and billing is also scoped to a particular organization. This means that the organization's credits and billing will be based on the usage of the features of platform by every member of the organization.

## Organization Variables

For organization variables refer to the `organization-variables` skill.

## Organization ownership transfer 

Owner can transfer the ownership of an organization to another user. And owner and other admins of organization has the right to 
change the role of user in the organization.

## Organization Configuration

- **name**: The name of the organization.
- **slug**: The slug of the organization.
- **allowed Domains**: The list of domains that are allowed to be onboarded directly to the organization.

You can set or update the Avatar of the Organization too.

## Teams 

You can create different teams with different users in them from the oranizations to divide the scoping of features further in the organization. You can attach detach features to different teams.

## API Endpoints

All Agent endpoints are under the base path `/organizations`. Refer to the OpenAPI spec for full request/response schemas. 

# Rules

Always get user approval before executing any mutation (create, update etc).

Always list the organizations and check for duplicates. Warn the user if an organization with the same name already exists.

Always fetch the OpenAPI spec for full request/response schema details when constructing API calls.

Always ask for approval before transfering ownership of an organization or changing the role of any user in the organization.

Before transfering ownership , changing role , creating team or any feeature of organization including invitations , fetch the users in org to check whether the user is already in the organization or not and warn accordingly.