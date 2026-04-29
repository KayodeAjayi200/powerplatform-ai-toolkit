# API Integrations — Connecting External Services

This file is read by the AI agent during Phase 2D when the user's app needs to call external APIs
or connect to services that are not covered by the built-in data sources.

---

## Decision guide — which connection type to use?

| If the user needs to... | Use this |
|---|---|
| Connect to Microsoft 365, SharePoint, Dataverse, SQL, OneDrive, Teams | **Built-in Power Apps connector** — no setup needed, just add from Data panel |
| Call a REST API that has a Swagger / OpenAPI definition | **Custom connector** — set up once, reused across apps in the same environment |
| Make a one-off HTTP call inside a formula (no reuse needed) | **HTTP connector** or the built-in `Office365` HTTP action |
| Connect to an API that requires OAuth (sign-in) | **Custom connector with OAuth** — requires an Azure AD app registration |
| Automate background tasks (email, approvals, notifications) | **Power Automate flow** — not a connector, but often the right tool for side effects |
| Connect to a legacy on-premises system | **On-premises data gateway** — see Microsoft docs |

**Default recommendation:** Always check the built-in connectors first (there are 900+). Only set up a custom connector if no built-in connector covers the service.

Built-in connector list: https://learn.microsoft.com/en-us/connectors/connector-reference/

---

## Ask the user — external API check

During Phase 2 (understanding what to build), ask:

> "Does your app need to connect to any external services or APIs? For example:
> - A company system (ERP, CRM, HR platform)
> - A third-party service (payment gateway, mapping service, weather data, etc.)
> - An internal API your team has built
>
> If yes, tell me the name of the service, its URL if you know it, and whether it requires a login."

If the answer is no, skip this file entirely.

---

## Option 1 — Built-in connector

No setup needed. In Power Apps Studio:

1. Data panel → **Add data** → search for the service name
2. Sign in if prompted
3. Select the table or action to use

Official connector reference: https://learn.microsoft.com/en-us/connectors/connector-reference/

---

## Option 2 — Custom connector (REST API with OpenAPI/Swagger)

Use when a built-in connector doesn't exist for the API.

### Step 1 — Collect API details from the user

Ask:
- What is the base URL of the API? (e.g. `https://api.mycompany.com/v1`)
- Does the API have a Swagger / OpenAPI spec file? (`.json` or `.yaml`)
- How does it authenticate? (API key, OAuth, Basic auth, none)

### Step 2 — Create the custom connector

In Power Apps Studio or Power Automate:

1. Go to **Custom connectors** → **+ New custom connector** → **Import an OpenAPI file** (if they have a spec) or **Create from blank**
2. Fill in the base URL, authentication type, and operations
3. **Test** the connector with a real API call before using it in the app
4. **Share** the connector with users who need it (it lives inside the Power Platform environment)

Official guide: https://learn.microsoft.com/en-us/connectors/custom-connectors/define-openapi-definition

### Step 3 — Use the custom connector in the app

In Power Apps Studio: Data → Add data → Custom connectors → select yours

---

## Option 3 — OAuth custom connector (API requires sign-in)

Use when the API authenticates users individually (OAuth 2.0), e.g. Salesforce, Spotify, Google APIs.

### You will need an Azure AD app registration

```powershell
# Sign in to Azure CLI first (see setup/cli-auth.md)
az login

# Create an app registration in Azure Active Directory for this API connection
# Replace APP_NAME with something descriptive (e.g. "MyApp-Salesforce-Connector")
az ad app create --display-name "APP_NAME"

# Note the appId from the output — this is your Client ID
# You will also need to create a client secret:
$appId = "PASTE_APP_ID_FROM_ABOVE"
az ad app credential reset --id $appId --display-name "connector-secret"
# Note the 'password' value from the output — this is your Client Secret
```

Then in the custom connector setup, select **OAuth 2.0** as the authentication type and enter:
- **Client ID** — the `appId` from above
- **Client Secret** — the `password` from above
- **Authorization URL** — from the API's OAuth docs
- **Token URL** — from the API's OAuth docs
- **Scopes** — from the API's OAuth docs

Official guide: https://learn.microsoft.com/en-us/connectors/custom-connectors/define-auth-oauth

Azure AD app registration: https://learn.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app

---

## Option 4 — Power Automate flow (background tasks and notifications)

Use when the app needs to **do something** rather than just read or write data. For example:
- Send an email when a record is submitted
- Start an approval process
- Post a Teams message
- Run a scheduled data sync

### Create a flow from Power Apps

In Power Apps Studio: Insert → **Power Automate** → Create new flow

This creates a flow with a "PowerApps" trigger. The app calls it using:

```powerfx
// Call a Power Automate flow from a button's OnSelect formula
MyFlowName.Run(recordId, userName)
```

Official guide: https://learn.microsoft.com/en-us/power-apps/maker/canvas-apps/using-logic-flows

---

## When an API is needed for the build phase

If a custom connector or flow needs to be set up before the app can be built, do it in Phase 2 (before Phase 3 design). The app cannot reference a connector that doesn't exist yet.

Tell the user:
> "Before I build this screen, I need to set up [connector name]. This will take a few minutes — I'll guide you through it."

Then come back to Phase 4 once the connector is ready.