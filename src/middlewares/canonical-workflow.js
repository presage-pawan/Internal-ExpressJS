export const canonicalWorkflowRequired = (_req, _res, next) =>
  next(Object.assign(
    new Error('Workflow mutations must use the canonical CMMS application API'),
    { status: 409, code: 'CMMS_CANONICAL_WORKFLOW_REQUIRED' }
  ));
