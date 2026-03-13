-- Create the table for wardrobe items
create table public.wardrobe_items (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  user_id uuid not null default auth.uid (),
  image_uri text not null,
  category text null,
  
  constraint wardrobe_items_pkey primary key (id),
  constraint wardrobe_items_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
);

-- Enable Row Level Security (RLS)
alter table public.wardrobe_items enable row level security;

-- Create Policy: Users can only see their own items
create policy "Users can select their own items" on public.wardrobe_items for
select
  using (auth.uid () = user_id);

-- Create Policy: Users can insert their own items
create policy "Users can insert their own items" on public.wardrobe_items for insert with check (auth.uid () = user_id);

-- Create Policy: Users can deleting their own items
create policy "Users can delete their own items" on public.wardrobe_items for delete using (auth.uid () = user_id);
