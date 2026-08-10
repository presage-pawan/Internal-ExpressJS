export class RoleManager {
  static ADMIN_ROLES = {
    master_alarm: { level: 0, view: true },
    master_blog: { level: 0, view: true },
    master_schedule: { level: 0, view: true },
    master_data_look: { level: 0, view: true },
    master_data_lookup: { level: 0, view: true },
    master_gateway: { level: 0, view: true },
    master_map_sensor: { level: 0, view: true },
    master_rms_counter: { level: 0, view: true },
    master_location_report: { level: 0, view: true },
    master_user_management: { level: 0, view: true },
    master_account_management: { level: 0, view: true },
    master_admin_panel: { level: 0, view: true },
    alarm: { level: 1, parent: "master_alarm", view: true, add: true, edit: true, delete: true, import: true, export: true },
    blog: { level: 1, parent: "master_blog", view: true, add: true, edit: true, delete: true, import: true, export: true },
    schedule: { level: 1, parent: "master_schedule", view: true, add: true, edit: true, delete: true, import: true, export: true },
    data_look: { level: 1, parent: "master_data_look", view: true, add: true, edit: true, delete: true, import: true, export: true },
    data_lookup: { level: 1, parent: "master_data_lookup", view: true, add: true, edit: true, delete: true, import: true, export: true },
    gateway: { level: 1, parent: "master_gateway", view: true, add: true, edit: true, delete: true, import: true, export: true },
    map_sensor: { level: 1, parent: "master_map_sensor", view: true, add: true, edit: true, delete: true, import: true, export: true },
    rms_counter: { level: 1, parent: "master_rms_counter", view: true, add: true, edit: true, delete: true, import: true, export: true },
    location_report: { level: 1, parent: "master_location_report", view: true, add: true, edit: true, delete: true, import: true, export: true },
    user_management: { level: 1, parent: "master_user_management", view: true, add: true, edit: true, delete: true, import: true, export: true },
    account_management: { level: 1, parent: "master_account_management", view: true, add: true, edit: true, delete: true, import: true, export: true },
    account_permissions: { level: 1, parent: "master_account_management", view: true, add: true, edit: true, delete: true, import: true, export: true },
    admin_panel: { level: 1, parent: "master_admin_panel", view: true, add: true, edit: true, delete: true, import: true, export: true },
  };

  static EMPLOYEE_ROLES = {
    master_alarm: { level: 0, view: true },
    master_blog: { level: 0, view: true },
    master_schedule: { level: 0, view: true },
    master_data_look: { level: 0, view: true },
    master_data_lookup: { level: 0, view: true },
    master_gateway: { level: 0, view: true },
    master_map_sensor: { level: 0, view: true },
    master_rms_counter: { level: 0, view: true },
    master_location_report: { level: 0, view: false },
    master_user_management: { level: 0, view: true },
    master_account_management: { level: 0, view: false },
    master_admin_panel: { level: 0, view: true },
    alarm: { level: 1, parent: "master_alarm", view: true, add: false, edit: false, delete: false, import: false, export: false },
    blog: { level: 1, parent: "master_blog", view: true, add: false, edit: false, delete: false, import: false, export: false },
    schedule: { level: 1, parent: "master_schedule", view: true, add: false, edit: false, delete: false, import: false, export: false },
    data_look: { level: 1, parent: "master_data_look", view: true, add: false, edit: false, delete: false, import: false, export: false },
    data_lookup: { level: 1, parent: "master_data_lookup", view: true, add: false, edit: false, delete: false, import: false, export: false },
    gateway: { level: 1, parent: "master_gateway", view: true, add: false, edit: false, delete: false, import: false, export: false },
    map_sensor: { level: 1, parent: "master_map_sensor", view: true, add: false, edit: false, delete: false, import: false, export: false },
    rms_counter: { level: 1, parent: "master_rms_counter", view: true, add: false, edit: false, delete: false, import: false, export: false },
    location_report: { level: 1, parent: "master_location_report", view: true, add: false, edit: false, delete: false, import: false, export: false },
    user_management: { level: 1, parent: "master_user_management", view: true, add: false, edit: false, delete: false, import: false, export: false },
    account_management: { level: 1, parent: "master_account_management", view: false, add: false, edit: false, delete: false, import: false, export: false },
    account_permissions: { level: 1, parent: "master_account_management", view: false, add: false, edit: false, delete: false, import: false, export: false },
    admin_panel: { level: 1, parent: "master_admin_panel", view: true, add: false, edit: false, delete: false, import: false, export: false },
  };

  static MANAGER_ROLES = {
    master_alarm: { level: 0, view: true },
    master_blog: { level: 0, view: true },
    master_schedule: { level: 0, view: true },
    master_data_look: { level: 0, view: true },
    master_data_lookup: { level: 0, view: true },
    master_gateway: { level: 0, view: true },
    master_map_sensor: { level: 0, view: true },
    master_rms_counter: { level: 0, view: true },
    master_location_report: { level: 0, view: true },
    master_user_management: { level: 0, view: true },
    master_account_management: { level: 0, view: false },
    master_admin_panel: { level: 0, view: true },
    alarm: { level: 1, parent: "master_alarm", view: true, add: false, edit: false, delete: false, import: false, export: false },
    blog: { level: 1, parent: "master_blog", view: true, add: false, edit: false, delete: false, import: false, export: false },
    schedule: { level: 1, parent: "master_schedule", view: true, add: false, edit: false, delete: false, import: false, export: false },
    data_look: { level: 1, parent: "master_data_look", view: true, add: false, edit: false, delete: false, import: false, export: false },
    data_lookup: { level: 1, parent: "master_data_lookup", view: true, add: false, edit: false, delete: false, import: false, export: false },
    gateway: { level: 1, parent: "master_gateway", view: true, add: false, edit: false, delete: false, import: false, export: false },
    map_sensor: { level: 1, parent: "master_map_sensor", view: true, add: false, edit: false, delete: false, import: false, export: false },
    rms_counter: { level: 1, parent: "master_rms_counter", view: true, add: false, edit: false, delete: false, import: false, export: false },
    location_report: { level: 1, parent: "master_location_report", view: true, add: false, edit: false, delete: false, import: false, export: false },
    user_management: { level: 1, parent: "master_user_management", view: true, add: false, edit: false, delete: false, import: false, export: false },
    account_management: { level: 1, parent: "master_account_management", view: false, add: false, edit: false, delete: false, import: false, export: false },
    account_permissions: { level: 1, parent: "master_account_management", view: false, add: false, edit: false, delete: false, import: false, export: false },
    admin_panel: { level: 1, parent: "master_admin_panel", view: true, add: false, edit: false, delete: false, import: false, export: false },
  };

  static async getRoleMenuData(role) {
    switch (role) {
      case "admin": {
        return this.ADMIN_ROLES;
      }
      case "employee": {
        return this.EMPLOYEE_ROLES;
      }
      case "worker": {
        return this.EMPLOYEE_ROLES;
      }
      case "manager": {
        return this.MANAGER_ROLES;
      }
      default: {
        return this.EMPLOYEE_ROLES;
      }
    }
  }
}
