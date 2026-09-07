import { initDbConnections, production_website_db_conn } from '../src/_db/index.js';
import { InternalUserRoleMenuModel } from '../src/schemas/role-menu.model.js';

const permissionValue = (roleName) => {
  const enabled = roleName === 'admin';
  return {
    parent: { level: 0, view: enabled },
    child: {
      level: 1,
      parent: 'master_sales_lead_tracker',
      view: enabled,
      add: enabled,
      edit: enabled,
      delete: enabled,
      import: enabled,
      export: enabled
    }
  };
};

const run = async () => {
  await initDbConnections();
  const RoleMenu = InternalUserRoleMenuModel(production_website_db_conn());
  const roles = await RoleMenu.find({ visible: true }).select('_id roleName').lean();

  if (!roles.length) {
    console.log('No active internal role-menu records found.');
    process.exit(0);
  }

  const operations = roles.map(role => {
    const permissions = permissionValue(role.roleName);
    return {
      updateOne: {
        filter: { _id: role._id },
        update: {
          $set: {
            'roleMenu.master_sales_lead_tracker': permissions.parent,
            'roleMenu.sales_lead_tracker': permissions.child
          }
        }
      }
    };
  });

  const result = await RoleMenu.bulkWrite(operations);
  const adminCount = roles.filter(role => role.roleName === 'admin').length;
  console.log(`Sales Lead permissions initialized for ${roles.length} users (${adminCount} admins enabled).`);
  console.log(`Modified records: ${result.modifiedCount}`);
  process.exit(0);
};

run().catch(error => {
  console.error('Sales Lead permission migration failed:', error);
  process.exit(1);
});
