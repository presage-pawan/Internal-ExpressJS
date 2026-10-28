const valueId = (value) => String(value?._id || value || '');

export const extractEquipmentLocationIds = (equipmentSet = {}) => {
  const rows = Array.isArray(equipmentSet?.Equipment?.value) ? equipmentSet.Equipment.value : [];
  return [...new Set(rows.map(row => valueId(row?.location_id)).filter(Boolean))];
};

export const equipmentBelongsToAllowedLocations = (equipmentSet, allowedLocationIds = []) => {
  const allowed = new Set(allowedLocationIds.map(valueId).filter(Boolean));
  const referenced = extractEquipmentLocationIds(equipmentSet);
  return referenced.length > 0 && referenced.every(id => allowed.has(id));
};
