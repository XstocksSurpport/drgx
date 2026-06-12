import { handleApi } from '../../lib/handler.mjs';

export default function handler(req, res) {
  return handleApi(req, res, '/api/admin/login');
}
