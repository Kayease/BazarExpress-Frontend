# Page snapshot

```yaml
- alert
- button "Open Next.js Dev Tools":
  - img
- button "Open issues overlay": 1 Issue
- navigation:
  - button "previous" [disabled]:
    - img "previous"
  - text: 1/1
  - button "next" [disabled]:
    - img "next"
- img
- link "Next.js 15.3.5 (stale) Turbopack":
  - /url: https://nextjs.org/docs/messages/version-staleness
  - img
  - text: Next.js 15.3.5 (stale) Turbopack
- img
- dialog "Build Error":
  - text: Build Error
  - button "Copy Stack Trace":
    - img
  - button "No related documentation found" [disabled]:
    - img
  - link "Learn more about enabling Node.js inspector for server code with Chrome DevTools":
    - /url: https://nextjs.org/docs/app/building-your-application/configuring/debugging#server-side-code
    - img
  - paragraph: Parsing ecmascript source code failed
  - img
  - text: ./app/admin/users/page.tsx (555:6)
  - button "Open in editor":
    - img
  - text: "Parsing ecmascript source code failed 553 | 554 | return ( > 555 | <AdminLayout> | ^^^^^^^^^^^ 556 | <div className=\"space-y-6\"> 557 | {/* Header */} 558 | <div className=\"flex items-center justify-between\"> Unexpected token `AdminLayout`. Expected jsx identifier"
- contentinfo:
  - paragraph: This error occurred during the build process and can only be dismissed by fixing the error.
```