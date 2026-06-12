insert into public.categories (name, sort_order) values
  ('Burgers', 1),
  ('Snacks', 2),
  ('Drinks 16oz', 3),
  ('Add-Ons', 4),
  ('Rice Meals', 5),
  ('Rice Meal Add-Ons', 6)
on conflict do nothing;

insert into public.products (category_id, name, price, is_sold_out, sort_order)
select c.id, v.name, v.price, v.is_sold_out, v.sort_order
from public.categories c
join (
  values
    ('Burgers', 'Solo Chicken Burger', 99, false, 1),
    ('Burgers', 'Chicken Burger w/ Fries', 159, false, 2),
    ('Burgers', 'Chicken Burger w/ Beefwarma & Fries', 199, false, 3),
    ('Burgers', 'Double Chicken Burger', 220, false, 4),
    ('Snacks', 'Chick n'' Fries', 159, false, 1),
    ('Snacks', 'Beefwarma & Fries', 199, false, 2),
    ('Snacks', 'Creamy Buldak', 159, false, 3),
    ('Snacks', 'Taco Quesadilla', 179, false, 4),
    ('Drinks 16oz', 'Iced Latte', 59, false, 1),
    ('Drinks 16oz', 'Strawberry', 59, false, 2),
    ('Drinks 16oz', 'Matcha', 59, false, 3),
    ('Drinks 16oz', 'Mocha Latte', 59, false, 4),
    ('Add-Ons', 'Nori Seaweed', 30, false, 1),
    ('Add-Ons', 'Sriracha Sauce', 20, false, 2),
    ('Add-Ons', 'Cheese Sauce', 10, false, 3),
    ('Add-Ons', 'Garlic Sauce', 20, false, 4),
    ('Rice Meals', 'Chick n'' Rice', 89, false, 1),
    ('Rice Meals', 'Porkchop Silog', 130, true, 2),
    ('Rice Meals', 'Chick Silog', 120, false, 3),
    ('Rice Meals', 'Tap Silog', 130, true, 4),
    ('Rice Meals', 'Humba Silog', 120, false, 5),
    ('Rice Meal Add-Ons', 'Rice', 15, false, 1),
    ('Rice Meal Add-Ons', 'Egg', 15, false, 2)
) as v(category_name, name, price, is_sold_out, sort_order)
  on c.name = v.category_name
on conflict do nothing;

insert into public.product_variants (product_id, name, price_modifier, sort_order)
select p.id, v.name, v.price_modifier, v.sort_order
from public.products p
join (
  values
    ('Creamy Buldak', 'Black Spicy Ramen', 0, 1),
    ('Creamy Buldak', 'Buldak Carbonara Ramen', 0, 2),
    ('Strawberry', 'Coffee Variant', 0, 1),
    ('Strawberry', 'Non-Coffee Variant', 0, 2),
    ('Matcha', 'Coffee Variant', 0, 1),
    ('Matcha', 'Non-Coffee Variant', 0, 2)
) as v(product_name, name, price_modifier, sort_order)
  on p.name = v.product_name
on conflict do nothing;

