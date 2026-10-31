import test from 'node:test';import assert from 'node:assert/strict';
import {getAssetReliability} from './asset-reliability.service.js';
test('reads only the asset-owned account scope across collections',async()=>{
 const seen=[];
 const connection={collection:(name)=>({findOne:async(query)=>{seen.push({name,query});return name==='asset_kinematics'?{criticality:{grade:'A'},chain:{driver:{ratedRpm:1800}}}:{reviewStatus:'REVIEW_REQUIRED',updatedAt:'2026-10-01'};}})};
 const result=await getAssetReliability(connection,{_id:'asset-1',account_id:'tenant-1'});
 assert.equal(result.criticality,'A');assert.equal(result.lastVerificationStatus,'REVIEW_REQUIRED');
 assert.equal(result.healthScore,null);assert.equal(seen.length,2);
 for(const item of seen)assert.deepEqual(item.query,{account_id:'tenant-1',assetId:'asset-1'});
});
test('denies queries without account context',async()=>{
 await assert.rejects(getAssetReliability({collection:()=>{throw Error('must not run');}},{_id:'asset-1'}),error=>error.status===403);
});
test('reports absent data instead of inventing a healthy condition',async()=>{
 const result=await getAssetReliability({collection:()=>({findOne:async()=>null})},{_id:'asset',account_id:'tenant'});
 assert.equal(result.healthScore,null);assert.equal(result.criticality,null);assert.equal(result.lastVerificationStatus,null);
});
