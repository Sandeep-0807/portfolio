# Student Portfolio Website

A modern, responsive portfolio website built with React, TypeScript, and Tailwind CSS showcasing an AIML student's projects, skills, and experience.

## Features

- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Fixed Sidebar Navigation**: Easy navigation between sections (About, Skills, Projects, Resume, Contact)
- **Interactive Project Gallery**: View detailed project information with modals
- **Skill Visualization**: Visual progress indicators for different skills
- **Contact Form**: Integrated mailto functionality for easy communication
- **Resume Download**: Download resume directly from the website
- **Accessible**: Built with semantic HTML and ARIA attributes

## Sections

1. **About Me**: Personal introduction and key achievements
2. **Skills**: Visual representation of technical proficiencies
3. **Projects**: Showcase of 7+ AI/ML projects with detailed descriptions
4. **Resume**: Professional resume with download option
5. **Contact Me**: Contact form with social media links

## Customization Guide

### Replacing Assets

1. **Profile Image**: Replace `src/assets/profile.jpg` with your own photo (recommended: 512x512px, square format)
2. **Resume PDF**: Replace `public/assets/resume.pdf` with your actual resume
3. **Project Reports**: Add your project PDFs to `public/assets/` folder (name them project1-report.pdf, project2-report.pdf, etc.)

### Updating Content

#### Personal Information (src/components/Sidebar.tsx)

- Update name, title, email, phone, DOB, and location
- Update social media links (LinkedIn, Instagram, Facebook)

#### About Me Section (src/components/sections/AboutMe.tsx)

- Edit the personal introduction paragraphs
- Update the highlights/achievements cards

#### Skills Section (src/components/sections/Skills.tsx)

- Modify the `proficientSkills` and `learningSkills` arrays
- Adjust proficiency percentages
- Update skill descriptions

#### Projects Section (src/components/sections/Projects.tsx)

- Edit the `projects` array with your own projects
- Update titles, summaries, tools, and highlights
- Add/remove projects as needed

#### Resume Section (src/components/sections/Resume.tsx)

- Update resume metadata (date, size)
- Modify the overview text

#### Contact Section (src/components/sections/ContactMe.tsx)

- Update email address in multiple places
- Update phone number and location
- Modify social media links

### Color Scheme

The color scheme is defined in `src/index.css`:

- Primary color: Blue (HSL: 217, 91%, 60%)
- Accent color: Purple (HSL: 262, 83%, 58%)

To change colors, modify the CSS variables in the `:root` section.

## Local Development

```bash
# Install dependencies
npm install

# Start frontend development server
npm run dev

# (In a second terminal) Start the local API server (MySQL-backed)
npm run dev:api

# Build for production
npm run build
```

## Backend (MySQL + API)

This project uses a local Node/Express API to talk to MySQL (the browser cannot connect to MySQL directly).

### 1) Create the database + tables

- Create a MySQL database named `portfolio`
- Run the schema in [server/schema.sql](server/schema.sql)

### 2) Configure environment variables (API)

The API reads these environment variables (defaults shown). Easiest: copy `.env.example` to `.env` and fill in your MySQL password.

- `MYSQL_HOST` (default `127.0.0.1`)
- `MYSQL_PORT` (default `3306`)
- `MYSQL_USER` (default `root`)
- `MYSQL_PASSWORD` (default empty)
- `MYSQL_DATABASE` (default `portfolio`)
- `API_PORT` (default `5050`)

MySQL Workbench tip: use the same host/port/user/password in Workbench and in `.env`.

### 3) Create an admin user

The admin seeding script uses env vars:

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

PowerShell example:

```powershell
$env:ADMIN_EMAIL = "admin@example.com"
$env:ADMIN_PASSWORD = "change-me"
npm run create-admin
```

### 4) Run

- `npm run dev:api` starts the API on `http://localhost:5050`
- `npm run dev` starts the Vite app on `http://localhost:8080`

Dev proxy is configured so frontend calls to `/api/*` go to the API.

## Offline Admin (no DB/server)

If you only want Admin editing on your own laptop (no cloud persistence), you can run the app without MySQL and without the API.

- Set `VITE_OFFLINE_ADMIN=1` in your `.env`
- (Optional) Set `VITE_LOCAL_ADMIN_PASSWORD` to require a password on the Admin Login screen
- Run only the frontend: `npm run dev`

In this mode, all Admin/public data is stored in your browser localStorage (same device/browser only). It is not secure and should not be enabled for public deployments.

## Supabase (recommended)

To make the deployed site editable (Admin saves data for everyone) without running the MySQL API server, you can switch to Supabase (Postgres + Auth + Storage).

1) Create a Supabase project
2) Run the SQL migrations in [supabase/migrations](supabase/migrations) (via Supabase SQL editor or Supabase CLI)
3) Create an admin user in Supabase Auth (email/password)
4) Grant admin role by inserting into `public.user_roles` (SQL editor):

```sql
insert into public.user_roles (user_id, role)
values ('<AUTH_USER_UUID_HERE>', 'admin');
```

5) Create a Storage bucket named `uploads` (or set `VITE_SUPABASE_STORAGE_BUCKET`)
6) Set these env vars in Vercel and redeploy:
	- `VITE_SUPABASE_URL`
	- `VITE_SUPABASE_ANON_KEY`

When Supabase env vars are set, the frontend uses Supabase directly for `/api/public/*`, `/api/admin/*`, and `/api/auth/*`.

### Migrating Offline Admin data to Supabase

If you previously added Certificates/Projects in **Offline Admin** mode, that data is stored only in your browser (localStorage). To make it appear on the deployed (Supabase-backed) site, import it into Supabase once.

#### 1) Export from the browser (where you entered the data)

1. Open your site on the same browser/profile where you entered Admin data.
2. Open DevTools → **Console**.
3. Run:

```js
copy(localStorage.getItem("portfolio_local_db_v1"))
```

4. Paste into a new file named `offline-export.json` in your project root.

#### 2) Import into Supabase (run locally)

PowerShell example (from the project root):

```powershell
$env:VITE_SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co"
$env:VITE_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
$env:SUPABASE_ADMIN_EMAIL="your-admin-email"
$env:SUPABASE_ADMIN_PASSWORD="your-admin-password"
node scripts/import-offline-to-supabase.mjs offline-export.json
```

If the command prints `Import complete.`, refresh your deployed site.

## Deployment

This site can be deployed to any static hosting service:

- **GitHub Pages**: Push to a GitHub repo and enable Pages
- **Netlify**: Connect your repo or drag-and-drop the `dist` folder
- **Vercel**: Import your GitHub repo
- **Lovable**: Click the Publish button in the Lovable editor

## Technologies Used

- React 18
- TypeScript
- Tailwind CSS
- Vite
- shadcn/ui components
- Lucide React icons

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

This project is open source and available for personal and commercial use.

## Contact

For questions or feedback, use the contact form on the website or reach out via the provided social media links.
