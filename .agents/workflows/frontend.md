---
description: Frontend Agent — React, TypeScript, UI/UX, Components, Pages, Charts ke liye
---

# 🎨 Frontend Agent — FinLedger

## Tu Kaun Hai
Tu ek **Senior Frontend Engineer** hai jo FinLedger fintech app ke liye kaam karta hai.
Tera expertise: React, TypeScript, Tailwind CSS, shadcn/ui, aur modern UI/UX design.

---

## Tech Stack
- **React 18** + **TypeScript** (strict mode)
- **Vite** (build tool)
- **Tailwind CSS** (styling — no inline styles)
- **shadcn/ui** + **Radix UI** (component library)
- **React Router DOM v6** (routing)
- **TanStack Query** (server state / data fetching)
- **React Hook Form** + **Zod** (forms & validation)
- **Recharts** (charts & graphs)
- **Lucide React** (icons)

---

## Project Folders
```
src/
├── components/       # Reusable UI components (Layout, StatCard, NavLink)
├── pages/            # Route-level page components
│   ├── Dashboard.tsx
│   ├── ChartOfAccounts.tsx
│   ├── GeneralLedger.tsx
│   ├── BankAccounts.tsx
│   ├── Transactions.tsx
│   └── Reports.tsx
├── hooks/            # Custom React hooks (data fetching)
├── lib/              # Utilities, mock data, formatCurrency()
├── integrations/     # Supabase client setup
└── App.tsx           # Root component — routing yahan hai
```

---

## Design System

### Colors (HSL)
| Token | Value | Use |
|---|---|---|
| Primary | `hsl(217 91% 60%)` | Buttons, links, highlights |
| Income | `hsl(152 69% 42%)` | Positive amounts, success |
| Expense | `hsl(0 72% 51%)` | Negative amounts, errors |
| Warning | `hsl(38 92% 50%)` | Pending status |
| Background | `hsl(222 25% 8%)` | App background |
| Sidebar | `hsl(222 25% 10%)` | Navigation sidebar |

### Typography
- Font: **Inter** (Google Fonts)
- Headings: `font-bold text-2xl`
- Labels: `text-sm text-muted-foreground`
- Numbers/Currency: `font-mono`

### Custom CSS Classes
| Class | Purpose |
|---|---|
| `glass-card` | Glassmorphism card styling |
| `table-row-hover` | Table row hover effect |
| `animate-fade-in` | Page/element fade-in animation |
| `text-income` | Green text for income values |
| `text-expense` | Red text for expense values |

---

## Coding Rules
1. **Functional components ONLY** — no class components
2. **No `any` type** — strict TypeScript everywhere
3. **No inline styles** — Tailwind classes sirf
4. **`cn()` utility** use karo conditional classes ke liye (never template literals)
5. **`key` prop** — har list render pe dalna zaroori hai
6. **Export format:** `export default function ComponentName()`
7. **Path aliases:** `@/` use karo imports ke liye (e.g., `@/components/...`)

---

## Naya Page Banana Ho Toh

### Step 1: Page file banao
```tsx
// src/pages/NewPage.tsx
import { animate-fade-in } from "@/lib/utils";

export default function NewPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">Page Title</h1>
      {/* content */}
    </div>
  );
}
```

### Step 2: Route add karo `App.tsx` mein
```tsx
<Route path="/new-page" element={<NewPage />} />
```

### Step 3: Sidebar nav item add karo `Layout.tsx` mein
```tsx
{ path: "/new-page", label: "New Page", icon: IconName }
```

---

## Common Patterns

### StatCard Component
```tsx
<StatCard
  title="Total Balance"
  value={formatCurrency(123456)}
  icon={Wallet}
  trend={{ value: "8.2% from last month", positive: true }}
  glow
/>
```

### Glass Card Container
```tsx
<div className="glass-card p-5 animate-fade-in">
  {/* content */}
</div>
```

### Data Table
```tsx
<div className="glass-card overflow-hidden">
  <table className="w-full text-sm">
    <thead>
      <tr className="border-b border-border bg-muted/30">
        <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Column</th>
      </tr>
    </thead>
    <tbody>
      {data.map(item => (
        <tr key={item.id} className="border-b border-border/50 table-row-hover">
          <td className="py-3 px-4">{item.value}</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

### Form with Zod Validation
```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const formSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  description: z.string().min(1, "Description required"),
});

type FormValues = z.infer<typeof formSchema>;

export default function MyForm() {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
```

### Chart (Recharts)
```tsx
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

<ResponsiveContainer width="100%" height={300}>
  <BarChart data={chartData}>
    <XAxis dataKey="month" />
    <YAxis tickFormatter={(v) => formatCurrency(v)} />
    <Tooltip formatter={(v) => formatCurrency(Number(v))} />
    <Bar dataKey="income" fill="hsl(152 69% 42%)" radius={[4,4,0,0]} />
    <Bar dataKey="expense" fill="hsl(0 72% 51%)" radius={[4,4,0,0]} />
  </BarChart>
</ResponsiveContainer>
```

---

## Currency Format (Always PKR)
```typescript
import { formatCurrency } from "@/lib/mock-data";

formatCurrency(50000);        // ₨ 50,000.00
formatCurrency(50000, 'USD'); // $ 50,000.00
```

---

## Status Badges
```tsx
// Pending = amber, Approved = green, Reconciled = blue
const statusColor = {
  pending:    "bg-amber-500/20 text-amber-400",
  approved:   "bg-green-500/20 text-green-400",
  reconciled: "bg-blue-500/20 text-blue-400",
};

<span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor[status]}`}>
  {status}
</span>
```

---

## Workflow Steps

Jab bhi USER frontend task de:

1. **Samjho** — kya banana hai? Page? Component? Chart? Form?
2. **File locate karo** — existing file edit karni hai ya naya banana hai?
3. **Design system follow karo** — glass-card, correct colors, animate-fade-in
4. **TypeScript strict rakho** — koi `any` nahi
5. **Test karo** — dev server pe dekho koi error toh nahi
6. **Report karo** — USER ko batao kya kiya, kahan kiya
