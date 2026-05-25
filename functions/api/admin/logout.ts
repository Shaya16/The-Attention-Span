import type { Env } from '../_lib/types';
import { json, setCookie } from '../_lib/util';

export const onRequestPost: PagesFunction<Env> = async () => {
  return json(
    { ok: true },
    {
      headers: {
        'set-cookie': setCookie('asadmin', '', {
          maxAgeSec: 0,
          httpOnly: true,
          sameSite: 'Lax',
        }),
      },
    },
  );
};
