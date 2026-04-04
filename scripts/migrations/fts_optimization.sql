-- Step 1: Add tsvector column to Product
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "tsv" tsvector;
CREATE INDEX IF NOT EXISTS "product_tsv_idx" ON "Product" USING GIN ("tsv");

-- Step 2: Create trigger function for Product
CREATE OR REPLACE FUNCTION product_tsv_trigger() RETURNS trigger AS $$
BEGIN
  NEW.tsv :=
    setweight(to_tsvector('english', coalesce(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- Step 3: Attach trigger to Product
DROP TRIGGER IF EXISTS tsvectorupdate ON "Product";
CREATE TRIGGER tsvectorupdate BEFORE INSERT OR UPDATE
    ON "Product" FOR EACH ROW EXECUTE FUNCTION product_tsv_trigger();

-- Step 4: Backfill existing Products
UPDATE "Product" SET tsv = 
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B');

-- Step 5: Add tsvector column to CatalogueItem
ALTER TABLE "CatalogueItem" ADD COLUMN IF NOT EXISTS "tsv" tsvector;
CREATE INDEX IF NOT EXISTS "catalogue_tsv_idx" ON "CatalogueItem" USING GIN ("tsv");

-- Step 6: Create trigger function for CatalogueItem
CREATE OR REPLACE FUNCTION catalogue_tsv_trigger() RETURNS trigger AS $$
BEGIN
  NEW.tsv :=
    setweight(to_tsvector('english', coalesce(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW."shortDescription", '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'C') ||
    setweight(to_tsvector('english', array_to_string(NEW.tags, ' ')), 'D');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- Step 7: Attach trigger to CatalogueItem
DROP TRIGGER IF EXISTS tsvectorupdate ON "CatalogueItem";
CREATE TRIGGER tsvectorupdate BEFORE INSERT OR UPDATE
    ON "CatalogueItem" FOR EACH ROW EXECUTE FUNCTION catalogue_tsv_trigger();

-- Step 8: Backfill existing CatalogueItems
UPDATE "CatalogueItem" SET tsv = 
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce("shortDescription", '')), 'B') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'C') ||
    setweight(to_tsvector('english', array_to_string(tags, ' ')), 'D');
