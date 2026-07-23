# Deploy to Cloudflare Pages — Step by Step

Aapka app Cloudflare Pages ke liye ready hai (edge runtime + config sab ho chuka).
Windows pe local build reliably nahi chalta, isliye **GitHub connect karke Cloudflare
pe hi build karwana** sabse aasaan aur reliable hai. Neeche poora tareeka:

---

## Part A — Code GitHub pe daalo (ek baar)

1. **github.com** pe account banao (agar nahi hai) aur login karo.
2. **New repository** banao — naam kuch bhi (jaise `ai-diagram-studio`),
   **Private** ya Public dono chalega. "Create repository" dabao.
3. Apne project folder mein terminal kholo aur ye commands chalao
   (`YOUR-USERNAME` aur `REPO-NAME` badal dena):

   ```bash
   cd "d:/FlowChart App"
   git init
   git add .
   git commit -m "AI Diagram Studio"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/REPO-NAME.git
   git push -u origin main
   ```

   > `.env.local` khud-ba-khud skip ho jayegi (`.gitignore` mein hai) — aapki
   > secret key GitHub pe nahi jayegi. Ye sahi hai.

---

## Part B — Cloudflare Pages pe deploy karo

1. **dash.cloudflare.com** pe jao → free account banao/login karo.
2. Left menu → **Workers & Pages** → **Create** → **Pages** tab →
   **Connect to Git**.
3. GitHub authorize karo → apni repository select karo → **Begin setup**.
4. **Build settings** mein ye daalo:

   | Field | Value |
   |-------|-------|
   | Framework preset | **Next.js** |
   | Build command | `npx @cloudflare/next-on-pages@1` |
   | Build output directory | `.vercel/output/static` |

5. **Environment variables** section (bahut zaroori — warna AI kaam nahi karega):

   | Variable name | Value |
   |---------------|-------|
   | `GEMINI_API_KEY` | *(aapki Gemini key)* |
   | `GEMINI_MODEL` | `gemini-2.5-flash` |
   | `NODE_VERSION` | `20` |

6. **Save and Deploy** dabao. 2-4 minute mein build hoga.

7. Ho gaya! Aapko ek live link milega jaise:
   `https://ai-diagram-studio.pages.dev`

---

## Part C — "nodejs_compat" flag (agar zaroorat pade)

Kabhi-kabhi Cloudflare edge ko ye flag chahiye hota hai. Agar deploy ke baad
site error de:

1. **Workers & Pages** → apna project → **Settings** → **Functions**
2. **Compatibility flags** mein `nodejs_compat` add karo (Production + Preview dono)
3. **Compatibility date** ko `2024-09-23` ya usse naya set karo
4. **Retry deployment** karo (Deployments tab se)

(Ye `wrangler.toml` mein already set hai, par dashboard override lagta hai to
yaha se bhi kar sakte ho.)

---

## Aage koi bhi change karoge to

Bas GitHub pe push karo — Cloudflare khud auto-deploy kar dega:

```bash
git add .
git commit -m "update"
git push
```

---

## Zaroori reminders 🔐

- **Gemini key rotate kar lena** agar wo kahin share hui hai — aistudio.google.com
  se nayi banao aur Cloudflare ke Environment Variables mein update kar do.
- Free tier ki daily limit hoti hai; normal use ke liye kaafi hai.
- Agar aage Claude use karna ho: env vars mein `GEMINI_API_KEY` hata ke
  `ANTHROPIC_API_KEY` + `ANTHROPIC_MODEL=claude-opus-4-8` daal do — code apne aap
  switch ho jayega.
