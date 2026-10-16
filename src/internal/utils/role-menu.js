export class RoleManager {
  static ADMIN_ROLES = {
    master_alarm: { level: 0, view: true },
    master_blog: { level: 0, view: true },
    master_schedule: { level: 0, view: true },
    master_data_look: { level: 0, view: true },
    master_data_lookup: { level: 0, view: true },
    master_gateway: { level: 0, view: true },
    master_devices: { level: 0, view: true },
    master_register: { level: 0, view: true },
    master_rms_counter: { level: 0, view: true },
    master_rsm_data: { level: 0, view: true },
    master_invoice_tracker: { level: 0, view: true },
    master_sales_lead_tracker: { level: 0, view: true },
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
    devices: { level: 1, parent: "master_devices", view: true, add: true, edit: true, delete: true, import: true, export: true },
    register: { level: 1, parent: "master_register", view: true, add: true, edit: true, delete: true, import: true, export: true },
    rms_counter: { level: 1, parent: "master_rms_counter", view: true, add: true, edit: true, delete: true, import: true, export: true },
    rsm_data: { level: 1, parent: "master_rsm_data", view: true, add: true, edit: true, delete: true, import: true, export: true },
    invoice_tracker: { level: 1, parent: "master_invoice_tracker", view: true, add: true, edit: true, delete: true, import: true, export: true },
    sales_lead_tracker: { level: 1, parent: "master_sales_lead_tracker", view: true, add: true, edit: true, delete: true, import: true, export: true },
    location_report: { level: 1, parent: "master_location_report", view: true, add: true, edit: true, delete: true, import: true, export: true },
    user_management: { level: 1, parent: "master_user_management", view: true, add: true, edit: true, delete: true, import: true, export: true },
    account_management: { level: 1, parent: "master_account_management", view: true, add: true, edit: true, delete: true, import: true, export: true },
    admin_panel: { level: 1, parent: "master_admin_panel", view: true, add: true, edit: true, delete: true, import: true, export: true },
  };

  static EMPLOYEE_ROLES = {
    master_alarm: { level: 0, view: true },
    master_blog: { level: 0, view: true },
    master_schedule: { level: 0, view: true },
    master_data_look: { level: 0, view: true },
    master_data_lookup: { level: 0, view: true },
    master_gateway: { level: 0, view: true },
    master_devices: { level: 0, view: true },
    master_register: { level: 0, view: true },
    master_rms_counter: { level: 0, view: true },
    master_rsm_data: { level: 0, view: true },
    master_invoice_tracker: { level: 0, view: true },
    master_sales_lead_tracker: { level: 0, view: false },
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
    devices: { level: 1, parent: "master_devices", view: true, add: true, edit: true, delete: true, import: true, export: true },
    register: { level: 1, parent: "master_register", view: true, add: true, edit: true, delete: true, import: true, export: true },
    rms_counter: { level: 1, parent: "master_rms_counter", view: true, add: false, edit: false, delete: false, import: false, export: false },
    rsm_data: { level: 1, parent: "master_rsm_data", view: true, add: true, edit: true, delete: true, import: true, export: true },
    invoice_tracker: { level: 1, parent: "master_invoice_tracker", view: true, add: true, edit: true, delete: true, import: true, export: true },
    sales_lead_tracker: { level: 1, parent: "master_sales_lead_tracker", view: false, add: false, edit: false, delete: false, import: false, export: false },
    location_report: { level: 1, parent: "master_location_report", view: true, add: false, edit: false, delete: false, import: false, export: false },
    user_management: { level: 1, parent: "master_user_management", view: true, add: false, edit: false, delete: false, import: false, export: false },
    account_management: { level: 1, parent: "master_account_management", view: false, add: false, edit: false, delete: false, import: false, export: false },
    admin_panel: { level: 1, parent: "master_admin_panel", view: true, add: false, edit: false, delete: false, import: false, export: false },
  };

  static MANAGER_ROLES = {
    master_alarm: { level: 0, view: true },
    master_blog: { level: 0, view: true },
    master_schedule: { level: 0, view: true },
    master_data_look: { level: 0, view: true },
    master_data_lookup: { level: 0, view: true },
    master_gateway: { level: 0, view: true },
    master_devices: { level: 0, view: true },
    master_register: { level: 0, view: true },
    master_rms_counter: { level: 0, view: true },
    master_rsm_data: { level: 0, view: true },
    master_invoice_tracker: { level: 0, view: true },
    master_sales_lead_tracker: { level: 0, view: false },
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
    devices: { level: 1, parent: "master_devices", view: true, add: true, edit: true, delete: true, import: true, export: true },
    register: { level: 1, parent: "master_register", view: true, add: true, edit: true, delete: true, import: true, export: true },
    rms_counter: { level: 1, parent: "master_rms_counter", view: true, add: false, edit: false, delete: false, import: false, export: false },
    rsm_data: { level: 1, parent: "master_rsm_data", view: true, add: true, edit: true, delete: true, import: true, export: true },
    invoice_tracker: { level: 1, parent: "master_invoice_tracker", view: true, add: true, edit: true, delete: true, import: true, export: true },
    sales_lead_tracker: { level: 1, parent: "master_sales_lead_tracker", view: false, add: false, edit: false, delete: false, import: false, export: false },
    location_report: { level: 1, parent: "master_location_report", view: true, add: false, edit: false, delete: false, import: false, export: false },
    user_management: { level: 1, parent: "master_user_management", view: true, add: false, edit: false, delete: false, import: false, export: false },
    account_management: { level: 1, parent: "master_account_management", view: false, add: false, edit: false, delete: false, import: false, export: false },
    admin_panel: { level: 1, parent: "master_admin_panel", view: true, add: false, edit: false, delete: false, import: false, export: false },
  };

  static async getRoleMenuData(role) {
    const enabled = role === 'admin';
    const knowledgeBase = { master_knowledge_base: { level: 0, view: enabled },
      knowledge_base: { level: 1, parent: 'master_knowledge_base', view: enabled,
        add: enabled, edit: enabled, delete: enabled, import: false, export: false } };
    switch (role) {
      case "admin": {
        return { ...this.ADMIN_ROLES, ...knowledgeBase };
      }
      case "employee": {
        return { ...this.EMPLOYEE_ROLES, ...knowledgeBase };
      }
      case "worker": {
        return { ...this.EMPLOYEE_ROLES, ...knowledgeBase };
      }
      case "manager": {
        return { ...this.MANAGER_ROLES, ...knowledgeBase };
      }
      default: {
        return { ...this.EMPLOYEE_ROLES, ...knowledgeBase };
      }
    }
  }
}
