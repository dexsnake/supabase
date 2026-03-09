# DEPR-324 OAuth Banner Mocking + Data Granularity

This marker file documents how to test the `ProjectOAuthIntegrationsBanner` before PR.

## Placement

- Mounted inside project content (under the project header context) via `ProjectLayout`, not in global `AppBannerWrapper`.
- This keeps the signal scoped to project surfaces.

## 1) Mock controls (non-prod only)

Mocking is enabled when `NEXT_PUBLIC_ENVIRONMENT !== "prod"`.

- URL query param: `oauthBannerMock`
- Local storage key: `supabase-oauth-integrations-banner-mock`

### A. Fast one-off mock via URL

Open any project route with:

```text
/project/<ref>/editor?oauthBannerMock=Lovable,Bolt,Figma
```

Optional icon per app:

```text
/project/<ref>/editor?oauthBannerMock=Figma|https://cdn.example.com/figma.png,Lovable
```

### B. Persistent mock via localStorage

In browser devtools console:

```js
localStorage.setItem(
  'supabase-oauth-integrations-banner-mock',
  JSON.stringify('Lovable,Bolt,Figma')
)
location.reload()
```

### C. Force real data (ignore local mock)

```text
?oauthBannerMock=off
```

`off`, `none`, `false`, and `0` disable mocking.

## 2) How to clear mock state

```js
localStorage.removeItem('supabase-oauth-integrations-banner-mock')
location.reload()
```

## 3) How to extract real authorized app payload (before PR)

### A. Network tab

- Open org OAuth apps page: `/org/<slug>/apps`
- Find request:
  - `GET /platform/organizations/<slug>/oauth/apps?type=authorized`
- Inspect response JSON.

### B. Console fetch (same browser session)

```js
const slug = '<org-slug>'
fetch(`/platform/organizations/${slug}/oauth/apps?type=authorized`, {
  credentials: 'include',
})
  .then((res) => res.json())
  .then((payload) => {
    console.table(
      payload.map((app) => ({
        id: app.id,
        app_id: app.app_id,
        name: app.name,
        icon: app.icon,
        website: app.website,
        created_by: app.created_by,
        authorized_at: app.authorized_at,
      }))
    )
    return payload
  })
```

## 4) Data granularity we currently have

From `authorized-apps-query`, each authorized app includes:

- `id`
- `app_id`
- `name`
- `icon` (nullable URL)
- `website`
- `created_by`
- `authorized_at`

Important constraints:

- We do **not** have a normalized provider enum (for example, no explicit `provider: "figma"`).
- We can still show a logo if `icon` is present.
- If `icon` is null, fallback options are name-based initials or an internal name-to-logo mapping.
