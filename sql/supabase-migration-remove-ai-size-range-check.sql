-- Remove the CHECK constraint on ai_size_range so it can store dimension text (e.g. "40cm x 60cm")
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_ai_size_range_check;
