alter table items drop constraint if exists items_type_check;

alter table items
  add constraint items_type_check
  check (type in ('available', 'regular', 'savings'));

create unique index if not exists items_single_available_idx
  on items (type)
  where type = 'available';

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
