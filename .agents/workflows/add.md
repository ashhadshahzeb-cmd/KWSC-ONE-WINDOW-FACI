---
description: Main entry point — choose between Frontend or Backend agent to add a feature
---

# 🚀 /add — Feature Add Karo

Jab USER `/add` type kare, **pehle yeh poochho:**

---

## Step 1 — Agent Choose Karo

```
Kaunsa kaam karna hai?

1️⃣  FRONTEND  — React, UI, Components, Pages, Charts, Forms, Design
2️⃣  BACKEND   — Supabase, Database, RLS, API, Hooks, Edge Functions

Reply karo: 1 ya 2
```

---

## Step 2A — Agar **1 (Frontend)** choose kiya

➡️ `.agents/FRONTEND_AGENT.md` ko pura padho
➡️ Wahan diye gaye rules, patterns aur workflow follow karo
➡️ Sirf `src/` folder ke andar kaam karo

**Frontend Agent kya karta hai:**
- React components banana
- Naye pages create karna
- Charts aur graphs (Recharts)
- Forms with Zod validation
- UI design (Tailwind + shadcn/ui)
- TanStack Query hooks ka frontend use

---

## Step 2B — Agar **2 (Backend)** choose kiya

➡️ `.agents/BACKEND_AGENT.md` ko pura padho
➡️ Wahan diye gaye rules, patterns aur workflow follow karo
➡️ `supabase/` aur `src/hooks/` + `src/integrations/` mein kaam karo

**Backend Agent kya karta hai:**
- Naye database tables banana
- SQL migrations likhna
- Row Level Security (RLS) policies
- TanStack Query hooks (useQuery / useMutation)
- Supabase Edge Functions
- API design

---

## ⚡ Shortcut Commands

Seedha agent call karna ho toh:

```
/frontend  ek naya Invoices page banana hai
/backend   invoices table banana hai Supabase mein
```

---

## ⚠️ Rules

- Ek kaam ek agent — frontend aur backend kaam mix mat karo ek response mein
- Dono agents ek doosre ke kaam se aware hain — coordinate karo agar zaroorat ho
- Har kaam ke baad USER ko clearly batao kya kiya, kahan kiya
