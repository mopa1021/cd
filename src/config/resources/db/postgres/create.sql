CREATE SCHEMA IF NOT EXISTS AUTHORIZATION cd;

ALTER ROLE cd SET search_path = 'cd';

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cdgenre') THEN
    CREATE TYPE cdgenre AS ENUM ('POP', 'ROCK');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS cd (
  
    id                  integer GENERATED ALWAYS AS IDENTITY(START WITH 1000) PRIMARY KEY USING INDEX TABLESPACE cdspace,
    version             integer NOT NULL DEFAULT 0,
    isrc                varchar(17) NOT NULL UNIQUE USING INDEX TABLESPACE cdspace,
    bewertung           integer NOT NULL CHECK (bewertung >= 0 AND bewertung <= 5),
    genre               cdgenre,
    preis               decimal(8,2) NOT NULL,
    verfuegbar          boolean NOT NULL DEFAULT FALSE,
    erscheinungsdatum   date,
    interpret           varchar(40),
    titel               varchar(40),
    erzeugt             timestamp NOT NULL DEFAULT NOW(),
    aktualisiert        timestamp NOT NULL DEFAULT NOW()
) TABLESPACE cdspace;

CREATE TABLE IF NOT EXISTS lied (
    id            integer GENERATED ALWAYS AS IDENTITY(START WITH 1000) PRIMARY KEY USING INDEX TABLESPACE cdspace,
    liedtitel     varchar(40) NOT NULL,
    laenge        varchar(40) NOT NULL,
    cd_id         integer NOT NULL REFERENCES cd
) TABLESPACE cdspace;

CREATE INDEX IF NOT EXISTS lied_cd_id_idx ON lied(cd_id) TABLESPACE cdspace;
