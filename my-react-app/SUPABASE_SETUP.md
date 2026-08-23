# 🚀 Supabase Real-Time Multiplayer Setup Guide

This Tic-Tac-Toe web application includes serverless cross-device multiplayer powered by **Supabase**.

---

## 1. Create a Free Supabase Project
1. Go to [https://supabase.com](https://supabase.com) and click **Start your project**.
2. Sign in with GitHub / Email and click **New project**.
3. Choose a Project Name (e.g. `tic-tac-toe`) and Database Password.

---

## 2. Create the Database Table & Enable Realtime
1. In your Supabase Dashboard, click on the **SQL Editor** tab on the left sidebar.
2. Click **New Query**, paste the following SQL script, and click **Run**:

```sql
-- 1. Create the games table
create table public.games (
  id uuid primary key default gen_random_uuid(),
  room_code text unique not null,
  player_x_name text not null,
  player_x_id text not null,
  player_o_name text,
  player_o_id text,
  squares jsonb not null default '["", "", "", "", "", "", "", "", ""]'::jsonb,
  current_turn text not null default 'X',
  winner text,
  winning_line jsonb,
  history jsonb not null default '[]'::jsonb,
  scores jsonb not null default '{"X": 0, "O": 0, "draws": 0}'::jsonb,
  status text not null default 'waiting',
  created_at timestamptz default now()
);

-- 2. Enable Realtime broadcast on the games table
alter publication supabase_realtime add table public.games;

-- 3. Enable Row Level Security (RLS) with public access policy
alter table public.games enable row level security;

create policy "Allow all public operations"
  on public.games
  for all
  using (true)
  with check (true);
```

---

## 3. Connect Credentials to the App
You can connect in either of two ways:

### Option A: Via the Web UI (No restart required)
1. Open the game in your browser at `http://localhost:5173`.
2. Click the **⚡ Supabase Setup** button at the top right.
3. Paste your **Project URL** and **Anon Public Key** (from *Supabase Dashboard > Project Settings > API*).
4. Click **Save Credentials**.

### Option B: Via `.env` file
Add your credentials to `.env`:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

---

## 4. How to Play with Friends
1. Select **Play Online (Multiplayer)**.
2. Enter your name and click **Create Online Match**.
3. Copy the **Room Code** (e.g. `TAC-481`) or the **Invite Link** (`http://localhost:5173?room=TAC-481`).
4. Send the link to your friend on another device (phone, laptop, tablet).
5. As soon as your friend enters their name and joins, the board will start and synchronize moves in real-time!
