-- (1) PowerShell:
--     cd .extras\compose\db\mysql
--     docker compose up
-- (1) 2. PowerShell:
--     docker compose exec db bash
--         mysql --user=root --password=p < /sql/create-db-cd.sql
--         exit
--     docker compose down

--   mysqlsh ist *NICHT* im Docker-Image enthalten
CREATE USER IF NOT EXISTS cd IDENTIFIED BY 'p';
GRANT USAGE ON *.* TO cd;

CREATE DATABASE IF NOT EXISTS cd CHARACTER SET utf8;

GRANT ALL PRIVILEGES ON cd.* to cd;

CREATE TABLESPACE `cdspace` ADD DATAFILE 'cdspace.ibd' ENGINE=INNODB;
