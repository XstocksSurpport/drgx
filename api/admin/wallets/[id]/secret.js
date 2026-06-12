import { handleApi } from '../../../lib/handler.mjs';

export default function handler(req, res) {
  const id = req.query.id;
  return handleApi(req, res, `/api/admin/wallets/${id}/secret`);
}
