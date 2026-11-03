# Human Resource SupplyHub — model workspace

Put only the Sequelize models owned by this module here.

1. Add your model files with the agreed database fields.
2. Import the connection from `../db.js`.
3. Export the finished models in this folder's `index.js`.
4. Add relationships in `models/associations.js` after both models exist.
5. Run `npm run migrate` for new tables.

Suggested scope: Employee records, attendance, and work schedules.
The starter defines only the shared `users` table.
`sequelize.sync()` creates missing tables; it does not update existing columns.
