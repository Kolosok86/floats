CREATE TABLE IF NOT EXISTS items (
    ms          bigint  NOT NULL,
    a           bigint  NOT NULL,
    d           bigint  NOT NULL,
    paintseed   smallint NOT NULL,
    paintwear   integer NOT NULL,
    defindex    smallint NOT NULL,
    paintindex  smallint NOT NULL,
    stattrak    boolean NOT NULL,
    souvenir    boolean NOT NULL,
    props       integer NOT NULL,
    stickers    jsonb,
    updated     timestamp NOT NULL,
    rarity      smallint NOT NULL,
    floatid     bigint  NOT NULL,
    price       integer,
    PRIMARY KEY (a)
);

CREATE TABLE IF NOT EXISTS history (
    floatid     bigint  NOT NULL,
    a           bigint  NOT NULL,
    steamid     bigint  NOT NULL,
    created_at  timestamp NOT NULL,
    price       integer,
    PRIMARY KEY (floatid, a)
);

-- Float ID is defined as the first asset id we've seen for an item

CREATE OR REPLACE FUNCTION is_steamid(IN val bigint)
    RETURNS boolean
    LANGUAGE 'plpgsql'
    IMMUTABLE
    PARALLEL SAFE
AS $BODY$BEGIN
    IF val < 76561197960265728 THEN
        RETURN FALSE;
    ELSIF (val >> 56) > 5 THEN
        RETURN FALSE;
    ELSIF ((val >> 32) & ((1 << 20) - 1)) > 32 THEN
        RETURN FALSE;
    END IF;

    RETURN TRUE;
END;$BODY$;

CREATE OR REPLACE FUNCTION extend_history()
    RETURNS TRIGGER
AS $$
BEGIN
    -- Handle cases where the floatid isn't there
    IF NEW.floatid IS NULL THEN
        NEW.floatid = OLD.a;
    END IF;

    IF NEW.a = OLD.a THEN
        -- Ignore handling, no new item details, updating existing
        RETURN NEW;
    END IF;

    IF NEW.a < OLD.a THEN
        -- If we find an older asset id than the current, still want to add it to history if not there
        INSERT INTO history VALUES (NEW.floatid, NEW.a, NEW.ms, NEW.updated, NULL) ON CONFLICT DO NOTHING;

        -- Prevent update to this row
        RETURN NULL;
    END IF;

    IF (is_steamid(OLD.ms) AND OLD.ms != NEW.ms) OR OLD.price IS NOT NULL THEN
        -- We care about history for inventory changes or market listings that had price data
        INSERT INTO history VALUES (NEW.floatid, OLD.a, OLD.ms, OLD.updated, OLD.price);
    END IF;

    -- Reset the price if it is the same, it is possible that the item was sold for the exact same amount in a row
    -- and we clear it here, but that isn't too much of a concern for the application of the data
    -- This ensures that outdated instances contributing to the same db don't conflict state
    IF NEW.price = OLD.price OR is_steamid(NEW.ms) THEN
        NEW.price = NULL;
    END IF;

    RETURN NEW;
END;
$$
LANGUAGE 'plpgsql';

DROP TRIGGER IF EXISTS extend_history_trigger
    ON items;

CREATE TRIGGER extend_history_trigger
    BEFORE UPDATE ON items
    FOR EACH ROW
EXECUTE PROCEDURE extend_history();

CREATE OR REPLACE FUNCTION ensure_floatid()
    RETURNS TRIGGER
AS $$
BEGIN
    IF NEW.floatid IS NULL THEN
        NEW.floatid = NEW.a;
    END IF;

    RETURN NEW;
END;
$$
LANGUAGE 'plpgsql';

DROP TRIGGER IF EXISTS ensure_floatid_trigger
    ON items;

CREATE TRIGGER ensure_floatid_trigger
    BEFORE INSERT ON items
    FOR EACH ROW
EXECUTE PROCEDURE ensure_floatid();

CREATE INDEX IF NOT EXISTS i_stickers ON items USING gin (stickers jsonb_path_ops)
    WHERE stickers IS NOT NULL;

CREATE INDEX IF NOT EXISTS i_paintwear ON items (paintwear);

CREATE UNIQUE INDEX IF NOT EXISTS i_unique_item ON
    items (defindex, paintindex, paintwear, paintseed);

CREATE UNIQUE INDEX IF NOT EXISTS i_unique_fid ON items (floatid);
