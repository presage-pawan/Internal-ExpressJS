const ACCOUNT_ACTIONS = ['view', 'add', 'edit', 'delete', 'import', 'export'];

export const ACCOUNT_ROLE_MENU_SCHEMA_VERSION = 2;

const PARENT_MODULES = [
  'master_asset',
  'master_location',
  'master_dashboard',
  'master_report',
  'master_alarm',
  'master_work_order',
  'master_work_request',
  'master_preventive',
  'master_posts',
  'master_inventory',
  'master_devices',
  'master_admin_panel',
  'master_form',
  'master_inspections',
  'master_library'
];

const CHILD_MODULES = {
  asset: 'master_asset',
  child_asset: 'master_asset',
  report_asset: 'master_asset',
  asset_sensors: 'master_asset',
  endpoint: 'master_asset',
  observation: 'master_asset',
  config: 'master_asset',
  config_alarm: 'master_asset',
  attach_sensor: 'master_asset',
  asset_alarms: 'master_asset',
  ai_chatbot: 'master_asset',
  pump_asset_health: 'master_asset',
  location: 'master_location',
  child_location: 'master_location',
  location_report: 'master_location',
  location_floor_map: 'master_location',
  work_order: 'master_work_order',
  comment_work_order: 'master_work_order',
  parts_work_order: 'master_work_order',
  work_order_status: 'master_work_order',
  inspections: 'master_inspections',
  floor_map: 'master_dashboard',
  pdm: 'master_dashboard',
  cmms: 'master_dashboard',
  pdm_location_filter: 'master_dashboard',
  reports_monitoring: 'master_report',
  reports_health_monitoring: 'master_report',
  reports_sensor_data_tracking: 'master_report',
  oem_report: 'master_report',
  alarm_overview: 'master_alarm',
  alarm_configuration: 'master_alarm',
  preventive: 'master_preventive',
  form: 'master_form',
  form_category: 'master_form',
  work_request: 'master_work_request',
  work_request_status: 'master_work_request',
  posts: 'master_posts',
  inventory: 'master_inventory',
  peripheral_sensors: 'master_devices',
  gateways: 'master_devices',
  users: 'master_admin_panel',
  permission: 'master_admin_panel',
  asset_mail: 'master_admin_panel',
  work_order_templates: 'master_library',
  procedures: 'master_library'
};

const clone = (value) => JSON.parse(JSON.stringify(value || {}));

const isRecord = (value) => Boolean(value && typeof value === 'object' && !Array.isArray(value));

const childPermission = (parent, mutationEnabled) => ({
  level: 1,
  parent,
  view: true,
  add: mutationEnabled,
  edit: mutationEnabled,
  delete: mutationEnabled,
  import: mutationEnabled,
  export: mutationEnabled
});

export const getAccountRoleMenuTemplate = (experienceProfile = 'standard_account') => {
  const isOem = experienceProfile === 'oem' || experienceProfile === 'oem_account';
  const menu = {};

  for (const parentKey of PARENT_MODULES) {
    menu[parentKey] = {
      level: 0,
      view: !(isOem && parentKey === 'master_admin_panel')
    };
  }

  for (const [childKey, parentKey] of Object.entries(CHILD_MODULES)) {
    if (childKey === 'oem_report' || childKey === 'pump_asset_health') {
        menu[childKey] = childPermission(parentKey, false);
        menu[childKey].view = isOem;
    } else if (childKey === 'pdm_location_filter') {
        menu[childKey] = childPermission(parentKey, !isOem);
        menu[childKey].view = !isOem;
    } else {
        menu[childKey] = childPermission(parentKey, !isOem);
    }
  }

  return menu;
};

export const mergeWithAccountRoleMenuTemplate = (roleMenu = {}, experienceProfile = 'standard_account') => {
  const merged = getAccountRoleMenuTemplate(experienceProfile);
  if (!isRecord(roleMenu)) {
    return merged;
  }

  for (const [key, value] of Object.entries(roleMenu)) {
    if (!isRecord(value)) {
      continue;
    }
    merged[key] = {
      ...(merged[key] || {}),
      ...clone(value)
    };
  }

  return merged;
};

export const validateAccountRoleMenu = (roleMenu, experienceProfile = 'standard_account') => {
  const errors = [];
  if (!isRecord(roleMenu)) {
    return ['account_role_menu must be an object'];
  }

  const template = getAccountRoleMenuTemplate(experienceProfile);
  for (const [key, permission] of Object.entries(roleMenu)) {
    if (!template[key]) {
      errors.push(`Unknown permission module: ${key}`);
      continue;
    }

    if (!isRecord(permission)) {
      errors.push(`${key} must be an object`);
      continue;
    }

    if (typeof permission.level !== 'number') {
      errors.push(`${key}.level must be a number`);
    }

    if (permission.parent && !template[permission.parent]) {
      errors.push(`${key}.parent is invalid`);
    }

    for (const [field, value] of Object.entries(permission)) {
      if (field === 'level' || field === 'parent') {
        continue;
      }
      if (!ACCOUNT_ACTIONS.includes(field)) {
        errors.push(`${key}.${field} is not a valid permission action`);
        continue;
      }
      if (typeof value !== 'boolean') {
        errors.push(`${key}.${field} must be boolean`);
      }
    }
  }

  return errors;
};
