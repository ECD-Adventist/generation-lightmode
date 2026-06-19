// Deprecated placeholder. The Keep It 100 dataset now lives inside the
// self-contained seedKeepIt100Codes function (backend functions cannot share
// local imports). This file remains only as a valid no-op handler.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.32';

Deno.serve(async (req) => {
  try {
    createClientFromRequest(req);
    return Response.json({ success: true, deprecated: true, use: 'seedKeepIt100Codes' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});