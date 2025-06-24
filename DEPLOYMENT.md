# RentEasy Deployment Instructions

This document provides instructions for deploying the RentEasy application, specifically regarding environment variables.

## Environment Variables

For security, secret keys (like your Supabase URL and API key) are stored in a `.env.local` file on your development machine. This file is listed in `.gitignore` and is **never** committed to your repository.

When you deploy your application to a hosting provider like Google Cloud App Hosting, you must provide these variables to the hosting environment directly.

### Required Variables

Your application requires the following environment variables to be set in your hosting provider's settings:

1.  `NEXT_PUBLIC_SUPABASE_URL`
    *   **Value:** Your unique Supabase project URL.
    *   *You can find this in your Supabase project dashboard under Project Settings > API.*

2.  `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    *   **Value:** Your Supabase project "anon" (public) key.
    *   *You can find this in your Supabase project dashboard under Project Settings > API.*

### How to Add Variables in Google Cloud App Hosting

1.  Open the [Google Cloud Console](https://console.cloud.google.com/).
2.  Navigate to **App Hosting** from the menu.
3.  Select your backend service associated with this project.
4.  Look for an **"Edit"** or **"Configuration"** option for your backend.
5.  Find the section for **"Build and runtime settings"** or a similar name.
6.  Locate the **"Environment variables"** section.
7.  Click **"Add environment variable"** and add the two variables listed above, one by one.
8.  Save your changes.
9.  **Trigger a new deployment.** You can usually do this by pushing a new commit to your main branch on GitHub, or through a "Redeploy" button in the Google Cloud App Hosting UI.

Once these variables are set in your hosting environment, the build will succeed.