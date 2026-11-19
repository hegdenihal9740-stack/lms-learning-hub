<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

- Use `vite build` alone for production output; the Lovable TanStack configuration owns the output layout, so post-build scripts must not assume `.output/public` or delete `dist`.
- Render the course-road student with RoadmapStudent's photo layers and the existing scroll-position controller; this preserves the uploaded likeness and works without WebGL.
- Resolve pointer media through `assetUrl` for local Vite, which lacks the hosted asset proxy; its local origin must be this project's own preview host, because asset pointers only resolve on the owning project's domains.
- Roadmap facing uses scroll direction, with front/rear photo views and reversible checkpoint motion; this avoids a front-facing image walking backward.
- Student accounts are login-only (public sign-up disabled); staff add students under Users, so there is no sign-up screen.
