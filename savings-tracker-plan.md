# PLAN: Savings Tracker App (Supabase + Next.js + Vercel)

## 0. Mục tiêu

Web app cá nhân, không login, để theo dõi tổng tài sản mà không cần log thu-chi chi tiết. Người dùng chỉ cập nhật số dư ("chốt sổ") khi muốn, cho từng khoản. Có 2 loại khoản: **thường** (sửa trực tiếp) và **tiết kiệm** (chỉ tạo mới qua 1 action riêng, không sửa được).

Không cần: login/logout, trang quản lý khoản riêng, category, currency, lịch sử chi tiết từng khoản.

---

## 1. Tech stack

- Next.js 14+ (App Router), TypeScript, Tailwind CSS.
- Supabase (Postgres) — free tier, không dùng Auth, không cần RLS (app chỉ 1 người dùng).
- Vercel — free tier để deploy.
- Chart (tuỳ chọn): recharts, cho biểu đồ tổng tài sản theo thời gian ở View 1.

---

## 2. Database schema

```sql
create table items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  amount numeric not null default 0,
  type text not null default 'regular' check (type in ('regular', 'savings'))
);

create table balances (
  id uuid primary key default gen_random_uuid(),
  total numeric not null,
  snapshot_at timestamptz not null default now()
);
```

Ghi chú:
- `items.amount` = số dư hiện tại, được **update trực tiếp** (không giữ lịch sử riêng từng khoản).
- `balances` chỉ log **tổng tài sản** tại mỗi lần có thay đổi thật (chốt sổ 1 khoản `regular`), dùng để vẽ chart lịch sử tổng. Không giới hạn số lần ghi/tháng.
- Khoản `type = 'savings'`: chỉ được **tạo mới** qua action "Tiết kiệm", sau đó **không sửa được nữa** (không có nút chốt sổ cho loại này).
- Khoản `type = 'regular'`: sửa trực tiếp qua nút "Chốt sổ" riêng từng dòng.

---

## 3. Ba hành động (actions) cần code

### 3.1. Chốt sổ
Transaction:
1. Tính lại tổng: `select sum(amount) from items`
2. `insert into balances (total, snapshot_at) values (<tổng mới>, now())`

### 3.2. Action "Tiết kiệm" (tạo khoản tiết kiệm mới)
Input: `source_item_id` (phải là `regular`), `amount`, `new_savings_name`.
Transaction:
1. `update items set amount = amount - amount_input where id = source_item_id`
2. `insert into items (name, amount, type) values (new_savings_name, amount_input, 'savings')`
3. Tổng không đổi → **không cần** insert vào `balances` (hoặc nếu muốn giữ timeline liền mạch, insert 1 dòng với `total` = giá trị y hệt lần gần nhất — optional, có thể bỏ qua ở v1).

### 3.3. Thêm khoản `regular` mới
Input: `name`, `initial_amount` (mặc định 0).
1. `insert into items (name, amount, type) values (name, initial_amount, 'regular')`

### 3.4. Update khoản `regular`
- Có thể update name, amount. Type không thể update.

---

## 4. Hai view

### View 1 — `/` (Tổng quan)
- Query: `select sum(amount) as total from items` → hiển thị to, nổi bật.
- Breakdown: `select name, amount, type from items order by type, name` → list hoặc bar chart, có thể tách nhóm "Khoản thường" và "Khoản tiết kiệm".
- (Tuỳ chọn) Chart lịch sử: `select total, snapshot_at from balances order by snapshot_at` → line chart.

### View 2 — `/entry` (Chốt sổ)
- Lấy toàn bộ `items`, chia 2 nhóm hiển thị:
  - **Khoản thường**: mỗi dòng = tên + input (default = amount hiện tại).
  - **Khoản tiết kiệm**: mỗi dòng chỉ hiển thị tên + số dư, **không có input/nút sửa**.
- Nút **"+ Chốt sổ"** → → gọi action 3.1.
- Nút **"+ Tiết kiệm"** → mở form 3 trường: chọn khoản nguồn (dropdown, chỉ liệt kê `type=regular`), số tiền, tên khoản tiết kiệm mới → gọi action 3.2.
- Nút **"+ Thêm khoản mới"** → form: tên + số dư ban đầu → gọi action 3.3 (mặc định tạo `type=regular`).

---

## 5. Cấu trúc file

```
app/
  page.tsx            -> View 1
  entry/page.tsx      -> View 2
lib/
  supabase.ts         -> supabase client
  actions.ts          -> commitRegularItem(), createSavings(), addNewItem(), getItemsGrouped(), getTotal(), getBalanceHistory()
components/
  ItemRow.tsx          -> dòng khoản thường (input + nút chốt sổ)
  SavingsRow.tsx       -> dòng khoản tiết kiệm (chỉ hiển thị)
  SavingsForm.tsx      -> form action "Tiết kiệm"
  AddItemForm.tsx      -> form thêm khoản mới
  TotalCard.tsx        -> hiển thị tổng ở View 1
```

---

## 6. Deploy steps

1. Tạo Supabase project, chạy SQL ở mục 2, tạo các RPC function ở mục 5.
2. `npx create-next-app@latest savings-tracker --typescript --tailwind --app`
3. Cài `@supabase/supabase-js`.
4. Set env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
5. Code theo cấu trúc mục 5, thứ tự: `lib/supabase.ts` + `lib/actions.ts` → View 2 (`/entry`) → View 1 (`/`).
6. Deploy: push GitHub → import Vercel → set env vars → deploy.

---

## 7. Checklist chấp nhận

- [ ] Chốt sổ → View 1 cập nhật đúng tổng ngay lập tức.
- [ ] Action "Tiết kiệm" trừ đúng khoản nguồn, tạo khoản tiết kiệm mới, tổng không đổi.
- [ ] Khoản tiết kiệm không có nút sửa ở View 2.
- [ ] Thêm khoản mới hoạt động, mặc định type = regular.
- [ ] `balances` log đúng lịch sử tổng theo thời gian (không bị log sai khi tạo khoản tiết kiệm).
- [ ] Deploy thành công trên Vercel, kết nối đúng Supabase project.
