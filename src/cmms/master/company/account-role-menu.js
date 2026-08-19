export const ACCOUNT_ROLE_MENU_SCHEMA_VERSION = 2;

export const PARENT_MODULES = [
  'master_admin_panel',
  'master_alarm',
  'master_asset',
  'master_dashboard',
  'master_devices',
  'master_form',
  'master_inspections',
  'master_inventory',
  'master_library',
  'master_location',
  'master_posts',
  'master_preventive',
  'master_report',
  'master_work_order',
  'master_work_request'
];

export const getAccountRoleMenuTemplate = (experienceProfile = 'standard_account') => {
  const isOem = experienceProfile === 'oem' || experienceProfile === 'oem_account';
  const menu = {};

  for (const parentKey of PARENT_MODULES) {
    menu[parentKey] = !(isOem && parentKey === 'master_admin_panel');
  }

  return menu;
};

export const mergeWithAccountRoleMenuTemplate = (roleMenu = {}, experienceProfile = 'standard_account') => {
  const merged = getAccountRoleMenuTemplate(experienceProfile);
  if (!roleMenu || typeof roleMenu !== 'object' || Array.isArray(roleMenu)) {
    return merged;
  }

  for (const [key, value] of Object.entries(roleMenu)) {
    if (!PARENT_MODULES.includes(key)) {
      continue;
    }

    if (typeof value === 'boolean') {
      merged[key] = value;
    } else if (value && typeof value === 'object' && typeof value.view === 'boolean') {
      merged[key] = value.view;
    }
  }

  return merged;
};

export const validateAccountRoleMenu = (roleMenu, experienceProfile = 'standard_account') => {
  const errors = [];
  if (!roleMenu || typeof roleMenu !== 'object' || Array.isArray(roleMenu)) {
    return ['account_role_menu must be an object'];
  }

  for (const [key, value] of Object.entries(roleMenu)) {
    if (!PARENT_MODULES.includes(key)) {
      errors.push(`Unknown permission module: ${key}`);
      continue;
    }

    if (typeof value === 'boolean') {
      continue;
    }

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      if (value.view !== undefined && typeof value.view !== 'boolean') {
        errors.push(`${key}.view must be boolean`);
      }
      for (const [field, val] of Object.entries(value)) {
        if (field === 'level' || field === 'parent') {
          continue;
        }
        if (field !== 'view') {
          errors.push(`${key}.${field} is not a valid permission action`);
        } else if (typeof val !== 'boolean') {
          errors.push(`${key}.${field} must be boolean`);
        }
      }
      continue;
    }

    errors.push(`${key} must be boolean`);
  }

  return errors;
};

