/** Admin read-only reliability projection. The selected asset's stored tenant is the sole scope. */
export async function getAssetReliability(connection, asset) {
  const account_id=asset.account_id;
  const assetId=asset._id;
  if(!account_id||!assetId)throw Object.assign(new Error('Asset account context is required'),{status:403});
  const query={account_id,assetId};
  const [kinematics,verification]=await Promise.all([
    connection.collection('asset_kinematics').findOne(query,{projection:{chain:1,criticality:1,updatedAt:1}}),
    connection.collection('action_verifications').findOne(
      {account_id,assetId},{projection:{reviewStatus:1,evaluation:1,updatedAt:1}})
  ]);
  return {
    assetId:String(assetId),criticality:kinematics?.criticality?.grade||null,
    kinematicChain:kinematics?.chain||null,
    lastVerificationStatus:verification?.reviewStatus||null,
    lastVerificationAt:verification?.updatedAt||null,
    healthScore:null,
    note:'No live composite health score is available from this read-only view.'
  };
}
