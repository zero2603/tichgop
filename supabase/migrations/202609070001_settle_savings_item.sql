create or replace function settle_savings_item(
  savings_item_id uuid,
  final_amount numeric
)
returns void
language plpgsql
as $$
declare
  available_item_id uuid;
begin
  if final_amount < 0 then
    raise exception 'Final amount must not be negative';
  end if;

  perform 1
  from items
  where id = savings_item_id
    and type = 'savings'
  for update;

  if not found then
    raise exception 'Savings item not found';
  end if;

  select id
  into available_item_id
  from items
  where type = 'available'
  for update;

  if not found then
    raise exception 'Available balance is missing';
  end if;

  update items
  set amount = amount + final_amount,
      name = 'Số dư khả dụng'
  where id = available_item_id;

  delete from items
  where id = savings_item_id
    and type = 'savings';
end;
$$;
