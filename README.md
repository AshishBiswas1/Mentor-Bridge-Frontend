## Mentor Bridge Frontend

A Next.js 14 landing and authentication experience for a 1-on-1 mentor–student coding platform. The UI uses Tailwind CSS with Framer Motion accents and a lightweight client-side auth state backed by localStorage.

### Getting started
- Install dependencies: `npm install`
- Run the development server: `npm run dev`
- Visit http://localhost:3000

### Key features
- Responsive landing page with animated hero, feature highlights, success stories, and a clear CTA.
- Auth flow with signup, login, dashboard, add-person, and logout screens using mock state management.
- Dashboard stores session data locally, keeping mentee lists per device.

### Project structure
- app/ – Next.js routes, including grouped auth pages and dashboard.
- components/ – Reusable UI and layout building blocks.
- lib/ – Shared utilities (auth provider currently lives in components for client context).

### Styling and animation
- Tailwind CSS handles styling; custom gradients and blur provide depth.
- Framer Motion adds entrance transitions and subtle hover effects.
