/** Deno Deploy / Supabase Edge — satisfies the TS language service outside Deno. */
declare namespace Deno {
  namespace env {
    function get(key: string): string | undefined
  }

  function serve(
    handler: (request: Request) => Response | Promise<Response>,
  ): void
}

declare module 'https://esm.sh/@supabase/supabase-js@2.49.8' {
  export * from '@supabase/supabase-js'
}
