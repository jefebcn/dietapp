/**
 * middleware.ts  –  Next.js Edge Runtime entry point
 *
 * Next.js requires `middleware` and `config` to be defined (or re-exported)
 * directly from this file — it cannot statically analyse re-exports from
 * other modules. The `config` matcher is therefore inlined here, while the
 * full proxy logic lives in proxy.ts for independent testability.
 */

export { proxy as middleware } from './proxy';

/**
 * Route matcher – inlined here because Next.js static analysis cannot follow
 * re-exports from other files for the `config` field.
 *
 * Matches everything EXCEPT:
 *   _next/static|image  – internal Next.js assets
 *   favicon.ico         – browser favicon
 *   manifest.json       – PWA manifest
 *   *.png|jpg|svg|webp  – static image files
 */
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|manifest\\.json|icons/|images/|.*\\.(?:png|jpg|jpeg|svg|webp|ico)).*)',
  ],
};
