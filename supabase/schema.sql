create table if not exists items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  amount numeric not null default 0,
  type text not null default 'regular'
);

alter table items drop constraint if exists items_type_check;
alter table items add constraint items_type_check check (type in ('available', 'regular', 'savings'));

create table if not exists balances (
  id uuid primary key default gen_random_uuid(),
  total numeric not null,
  snapshot_at timestamptz not null default now()
);

create or replace function commit_regular_item(
  item_id uuid,
  new_name text,
  new_amount numeric
)
returns table (total numeric)
language plpgsql
as $$
begin
  update items
  set
    name = nullif(trim(new_name), ''),
    amount = new_amount
  where id = item_id
    and type = 'regular';

  if not found then
    raise exception 'Regular item not found';
  end if;

  select coalesce(sum(amount), 0)
  from items
  into total;

  return next;
end;
$$;

create or replace function create_savings(
  source_item_id uuid,
  savings_amount numeric,
  new_savings_name text
)
returns void
language plpgsql
as $$
begin
  if savings_amount <= 0 then
    raise exception 'Savings amount must be greater than zero';
  end if;

  update items
  set amount = amount - savings_amount
  where type = 'available'
    and amount >= savings_amount;

  if not found then
    raise exception 'Available balance is missing or not enough';
  end if;

  insert into items (name, amount, type)
  values (nullif(trim(new_savings_name), ''), savings_amount, 'savings');
end;
$$;

create index if not exists balances_snapshot_at_idx on balances (snapshot_at);
create index if not exists items_type_name_idx on items (type, name);
create unique index if not exists items_single_available_idx on items (type) where type = 'available';
