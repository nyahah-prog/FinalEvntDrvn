# SupplyHub: School and Office Supplies Store Management System

Editable **XianFire 2.0.10-based** Node.js / Express / Sequelize / MySQL starter.
The folder arrangement follows your screenshots with four SupplyHub modules.

Extract this ZIP into **`C:\laragon\www`** so the project root is
**`C:\laragon\www\supplyhub`**. Open that exact folder in VS Code.

The server startup message follows your reference:

```text
🔥 XianFire running at http://localhost:3000
```

## Module folders

These exact names appear in **controllers, models, routes, and views**:

| Folder | Browser URL | Account role |
| --- | --- | --- |
| `Finance SupplyHub` | `/finance` | `finance` |
| `POS SupplyHub` | `/pos` | `pos` |
| `Inventory SupplyHub` | `/inventory` | `inventory` |
| `Human Resource SupplyHub` | `/human-resource` | `human-resource` |

An `admin` can open all modules. A `viewer` can sign in to the shared dashboard
while waiting for a department assignment.

All source files are editable. This is a folder structure and starter project:
module business features and business tables are for your team to implement.
Shared registration, login, role checks, and one starter page per module are included.

## Windows / Laragon setup

1. Extract the ZIP and move `supplyhub` to `C:\laragon\www\supplyhub`.
2. Open the `supplyhub` folder in VS Code.
3. Use Node.js 20 or newer. Start MySQL in Laragon.
4. Open a terminal inside the project.

```powershell
cd C:\laragon\www\supplyhub
npm.cmd install
```

`node_modules` is recreated by npm. The dependency versions are in
`package.json` and `package-lock.json`.

Edit the included `.env` to match your own MySQL account:

```dotenv
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=supplyhub_system
DB_USER=root
DB_PASSWORD=
```

Put your actual MySQL password after `DB_PASSWORD=` if you have one.
`.env.example` is a clean template; `.env` is ignored by Git.
Set `SESSION_SECRET` to a stable random value when needed. You can generate one:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

## Database and administrator

```powershell
npm.cmd run migrate
npm.cmd run db:test
npm.cmd run create:admin
npm.cmd run xian
```

The administrator command asks for your chosen name, email, and password.
Open **http://localhost:3000** and sign in. No preset login password is included.

`migrate` creates the database if permitted and creates the shared `users` table.
Existing records are preserved. It does not change existing columns.
Business tables have not been invented; agree on them with your team.

The public homepage can open without MySQL. Account actions and protected
module pages require MySQL and the setup above.

## Assign a member's module

Have the member register at `/register`, then use the appropriate command
in a second terminal. Replace the email below with their registered email.

```powershell
npm.cmd run assign:role -- member@example.com finance
npm.cmd run assign:role -- member@example.com pos
npm.cmd run assign:role -- member@example.com inventory
npm.cmd run assign:role -- member@example.com human-resource
```

Use only the correct command for each member. Each account has one role.
Registration starts with `viewer`; it cannot grant admin access.
`npm.cmd run roles:list` displays the current roles.

## Where to edit

| Purpose | Path |
| --- | --- |
| Module controller logic | `controllers/<Module Folder>/` |
| Module database models | `models/<Module Folder>/` |
| Module endpoints | `routes/<Module Folder>/index.js` |
| Module pages | `views/<Module Folder>/dashboard.xian` |
| Module browser behavior | `public/js/<Module Folder>/ui.js` |
| Shared header and footer | `views/partials/` |
| Shared styles | `public/css/app.css` |
| Shared authentication | `controllers/authController.js` and `middleware/authMiddleware.js` |
| System title and department names | `config/app.js` |

Folder names contain spaces as requested. Preserve them inside quoted imports.
URLs use lowercase hyphens. Templates use Handlebars syntax such as
`{{currentUser.name}}` and `{{#each modules}}...{{/each}}`.

Example controller import:
```javascript
import { dashboard } from "../../controllers/Inventory SupplyHub/inventoryController.js";
```

For a new model inside a module, import the shared connection from `../db.js`.
Export the finished model from that module's `models/<Module Folder>/index.js`.
Add relationships in `models/associations.js`. Run `npm run migrate` for new
tables; use explicit migrations to modify existing columns.

## Framework utilities

| Command | Purpose |
| --- | --- |
| `npm run xian` or `npm run dev` | Start with nodemon |
| `npm start` | Start once |
| `npm run route:list` | List shared and module endpoints |
| `npm run create:model -- Product` | Generate a shared root-level model |
| `npm run create:controller -- productController` | Generate a shared controller |
| `npm run create:add-middleware -- auth` | Generate a new auth guard file |
| `npm run create:upload-middleware -- upload` | Generate an image upload starter |

The customized generator can also target a module directly:

```powershell
npm.cmd run create:model -- Product --module inventory
npm.cmd run create:controller -- productController --module inventory
```

Use `finance`, `pos`, `inventory`, or `human-resource` for `--module`.
Edit generated model fields before migrating; they are examples.
Generators refuse to overwrite existing files.

The optional framework route-cache utility is retained. Review it before enabling
any generated endpoints, and do not share user-specific pages through a public cache.

## Continuing development

- Work only in your assigned module folders; shared files belong to the whole team.
- Do not put another nested `supplyhub` folder inside the project.
- Module pages are starter placeholders, not completed business functions.
- Email password reset and production session storage are future work.
- Sessions currently use the development memory store.
- Before deployment, configure persistent sessions, rate limiting, HTTPS,
  a stable session secret, and application-specific validation.
- See `FOLDER-STRUCTURE.md` for the included paths.
- See `docs/FRAMEWORK-SOURCE.md` for the source version and customizations.
