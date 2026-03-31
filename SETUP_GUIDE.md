# 👥 HR Portal — Complete Setup Guide

A full-featured HR & Attendance Management System built with Next.js + Supabase.

---

## ✅ What's Included

### Admin Features
- 📊 Dashboard with live stats & attendance chart
- 👥 Add / Edit / Deactivate employees
- ⏱ View all attendance records by date
- 🌿 Approve / Reject leave requests (with notes)
- ➕/➖ Adjust employee leave balance
- 📢 Post company news & announcements
- ✉ Send emails to all / individual employees
- 💼 Post to LinkedIn

### Employee Features
- ✅ Check In / Check Out with live clock
- 📋 Report missed attendance with regulation note
- 🌿 Apply for leaves (Annual, Sick, Casual, Emergency, Unpaid)
- 📊 View leave balance & history
- 📢 See company announcements

---

## 🚀 Step-by-Step Deployment Guide

### STEP 1 — Create Free Accounts (all free)

1. **GitHub** → https://github.com (to store your code)
2. **Supabase** → https://supabase.com (your database)
3. **Vercel** → https://vercel.com (to host your app)

---

### STEP 2 — Set Up Supabase Database

1. Go to https://supabase.com → click **New Project**
2. Give it a name like `hr-portal`, set a strong password, pick a region
3. Wait ~2 minutes for it to be ready
4. Click **SQL Editor** in the left sidebar
5. Copy the entire contents of `supabase/schema.sql` and paste it there
6. Click **Run** — this creates all your tables
7. Go to **Settings → API** and copy:
   - `Project URL` → this is your `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → this is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role secret` key → this is your `SUPABASE_SERVICE_ROLE_KEY`

---

### STEP 3 — Upload Code to GitHub

1. Go to https://github.com → click **New Repository**
2. Name it `hr-portal`, make it **Private**, click **Create**
3. On your computer, open a terminal/command prompt in the `hr-portal` folder
4. Run these commands one by one:
   ```
   git init
   git add .
   git commit -m "Initial HR Portal"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/hr-portal.git
   git push -u origin main
   ```
   (Replace YOUR_USERNAME with your GitHub username)

---

### STEP 4 — Deploy on Vercel

1. Go to https://vercel.com → Sign in with GitHub
2. Click **Add New Project** → Import your `hr-portal` repository
3. Click **Environment Variables** and add ALL of these:

```
NEXT_PUBLIC_SUPABASE_URL        = (from Supabase Step 2)
NEXT_PUBLIC_SUPABASE_ANON_KEY   = (from Supabase Step 2)
SUPABASE_SERVICE_ROLE_KEY       = (from Supabase Step 2)

# Email (Gmail)
SMTP_HOST     = smtp.gmail.com
SMTP_PORT     = 587
SMTP_USER     = your-gmail@gmail.com
SMTP_PASS     = your-gmail-app-password   (see Step 5)
SMTP_FROM     = your-gmail@gmail.com
```

4. Click **Deploy** — it will build and give you a live URL!

---

### STEP 5 — Gmail App Password (for Sending Emails)

Regular Gmail password won't work. You need an "App Password":

1. Go to your Google Account → Security
2. Enable **2-Step Verification** if not already on
3. Search for **App Passwords** in Google Account settings
4. Select App: **Mail**, Device: **Other** → type "HR Portal"
5. Click Generate → copy the 16-character password
6. Use this as your `SMTP_PASS` in Vercel

---

### STEP 6 — Create Your First Admin Account

1. Open your deployed app (e.g. https://hr-portal.vercel.app)
2. You'll see the login page — but first you need to create an admin
3. Go to your Supabase dashboard → **Authentication → Users**
4. Click **Invite User** → enter your email → Send invite
5. Check your email, click the link, set your password
6. Now go to **SQL Editor** in Supabase and run:
   ```sql
   UPDATE public.profiles SET role = 'admin' WHERE email = 'your-email@gmail.com';
   ```
7. Now log in at your app URL — you'll see the Admin dashboard!

---

### STEP 7 — LinkedIn Posting (Optional)

This requires a LinkedIn Developer App:
1. Go to https://www.linkedin.com/developers/apps
2. Create an app → request `w_member_social` permission
3. Get your access token
4. Add to Vercel environment variables:
   ```
   LINKEDIN_ACCESS_TOKEN    = your_token
   LINKEDIN_PERSON_ID       = your_linkedin_person_id
   ```

---

## 📁 Project Structure

```
hr-portal/
├── app/
│   ├── admin/
│   │   ├── dashboard/     ← Admin home with stats
│   │   ├── employees/     ← Manage all employees
│   │   ├── attendance/    ← View attendance records
│   │   ├── leaves/        ← Approve/reject leaves
│   │   ├── news/          ← Post announcements
│   │   ├── email/         ← Send emails
│   │   └── linkedin/      ← LinkedIn posts
│   ├── employee/
│   │   ├── dashboard/     ← Employee home + check in/out
│   │   ├── attendance/    ← My attendance history
│   │   └── leaves/        ← My leave requests
│   ├── auth/login/        ← Login page
│   └── api/admin/         ← Backend API routes
├── components/
│   └── Sidebar.tsx        ← Navigation sidebar
├── lib/
│   ├── supabase.ts        ← Database client
│   └── supabase-server.ts ← Server database client
├── supabase/
│   └── schema.sql         ← ALL database tables (run this first!)
└── .env.local.example     ← Copy this to .env.local and fill in values
```

---

## ❓ Common Questions

**Q: How do employees log in?**
Admin creates their account from the Employees page. They get a username + password to log in.

**Q: Can employees sign up themselves?**
No — by design, only Admin/HR can create accounts. This is a security feature for internal systems.

**Q: What if I want to run it locally first?**
1. Copy `.env.local.example` to `.env.local` and fill in your Supabase values
2. Run `npm install` then `npm run dev`
3. Open http://localhost:3000

**Q: How do I add more features?**
Just message me what you want to add and I'll build it for you!

---

## 🛠 Tech Stack

| Tool | Purpose | Cost |
|------|---------|------|
| Next.js 14 | Frontend + Backend | Free |
| Supabase | Database + Auth | Free tier |
| Vercel | Hosting | Free tier |
| Gmail SMTP | Email sending | Free |
| LinkedIn API | Social posting | Free |

---

Built with ❤️ — ready to deploy!
