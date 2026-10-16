import assert from 'node:assert/strict';
import test from 'node:test';
import { RoleManager } from '../utils/role-menu.js';
import { RoleMenuService } from './role-menu.service.js';

test('Knowledge Base defaults retain admin access and require grants for other internal roles', async()=>{
  for (const role of ['admin','employee','manager','worker']) {
    const menu=await RoleManager.getRoleMenuData(role);
    assert.equal(menu.master_knowledge_base.view,role==='admin');
    for (const action of ['view','add','edit','delete']) assert.equal(menu.knowledge_base[action],role==='admin');
    assert.equal(menu.knowledge_base.import,false);assert.equal(menu.knowledge_base.export,false);
  }
});
test('existing role menus acquire the new module while retaining explicit guide denials',async()=>{
  const saved=[];
  class TestService extends RoleMenuService {
    get RoleMenuModel(){return {findByIdAndUpdate:async(id,payload)=>{saved.push(payload);return {_id:id,...payload};}};}
  }
  const service=new TestService('production');
  const existing={_id:'role-id',roleName:'employee',roleMenu:await RoleManager.getRoleMenuData('employee')};
  delete existing.roleMenu.master_knowledge_base;delete existing.roleMenu.knowledge_base;
  const updated=await service.ensureDefaultRoleMenu(existing);
  assert.equal(updated.roleMenu.knowledge_base.view,false);assert.equal(saved.length,1);
  const adminMenu=await RoleManager.getRoleMenuData('admin');adminMenu.master_knowledge_base.view=false;adminMenu.knowledge_base.delete=false;
  const denied={_id:'admin-id',roleName:'admin',roleMenu:adminMenu};
  assert.equal(await service.ensureDefaultRoleMenu(denied),denied);assert.equal(saved.length,1);
});
