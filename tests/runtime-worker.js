// Test-only router: bundles the real Pages handlers and middleware into workerd.
import * as login from '../functions/api/tenants/lookup.js';
import * as users from '../functions/api/users/index.js';
import * as tenants from '../functions/api/tenants/index.js';
import * as push from '../functions/api/sync/push.js';
import * as pull from '../functions/api/sync/pull.js';
import * as branches from '../functions/api/branches/index.js';
import * as backup from '../functions/api/backup.js';
import * as trials from '../functions/api/trial-requests/index.js';
import * as releases from '../functions/api/releases/index.js';
import * as logout from '../functions/api/auth/logout.js';
import * as password from '../functions/api/auth/password.js';
import * as me from '../functions/api/auth/me.js';
import * as reset from '../functions/api/auth/reset.js';
import * as recovery from '../functions/api/auth/recovery-token.js';
import { onRequest } from '../functions/api/_middleware.js';
const routes = { '/api/auth/me': me, '/api/auth/reset': reset, '/api/auth/recovery-token': recovery, '/api/tenants/lookup': login, '/api/users': users, '/api/tenants': tenants,
  '/api/sync/push': push, '/api/sync/pull': pull, '/api/branches': branches, '/api/backup': backup,
  '/api/trial-requests': trials, '/api/releases': releases, '/api/auth/logout': logout, '/api/auth/password': password };
export default {
  async fetch(request, env) {
    const handler = routes[new URL(request.url).pathname]?.['onRequest' + request.method[0] + request.method.slice(1).toLowerCase()];
    const context = { request, env, data: {}, next: () => handler ? handler(context) : new Response('Not found', { status: 404 }) };
    return onRequest(context);
  }
};
