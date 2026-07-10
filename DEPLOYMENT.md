# Deployment

This app is a static site. There is no build step and no package install.

## GitHub

1. Create an empty GitHub repository named `srs` or `supplier-risk-sensing`.
2. Copy the repository URL.
3. From this folder, run:

```bash
git remote add origin https://github.com/<your-user-or-org>/<repo>.git
git push -u origin main
```

## Vercel

1. In Vercel, import the GitHub repository.
2. Use these project settings:
   - Framework preset: Other
   - Root directory: `.`
   - Build command: leave empty
   - Output directory: leave empty
   - Install command: leave empty
3. Deploy.

Vercel will serve `index.html` and the static assets directly.