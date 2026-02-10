-- Multi-tenant database initialization
-- Creates tenant databases alongside the catalog database

CREATE DATABASE lqdty_t1;
CREATE DATABASE lqdty_t2;
CREATE DATABASE lqdty_t3;

-- Grant privileges to the default user
GRANT ALL PRIVILEGES ON DATABASE catalog TO liquidity;
GRANT ALL PRIVILEGES ON DATABASE lqdty_t1 TO liquidity;
GRANT ALL PRIVILEGES ON DATABASE lqdty_t2 TO liquidity;
GRANT ALL PRIVILEGES ON DATABASE lqdty_t3 TO liquidity;
