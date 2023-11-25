CREATE TABLE IF NOT EXISTS cd (
    id                      INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    version                 INT NOT NULL DEFAULT 0,
    isrc                    CHAR(17) UNIQUE NOT NULL,
    bewertung               INT NOT NULL CHECK (bewertung >= 0 AND bewertung <= 5),
    genre                   ENUM('POP', 'ROCK'),
    preis                   DECIMAL(8,2) NOT NULL,
    verfuegbar              BOOLEAN NOT NULL DEFAULT FALSE,
    erscheinungsdatum       DATE,
    interpret               VARCHAR(40),
    titel                   VARCHAR(40),
    erzeugt                 DATETIME NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    aktualisiert            DATETIME NOT NULL DEFAULT (CURRENT_TIMESTAMP)
) TABLESPACE cdspace ROW_FORMAT=COMPACT;
ALTER TABLE cd AUTO_INCREMENT=1000;

CREATE TABLE IF NOT EXISTS lied (
    id              INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    liedtitel       VARCHAR(32) NOT NULL,
    laenge          VARCHAR(16) NOT NULL,
    cd_id           CHAR(36) NOT NULL references cd(id),

    INDEX lied_cd_id_idx(cd_id)
) TABLESPACE cdspace ROW_FORMAT=COMPACT;
ALTER TABLE lied AUTO_INCREMENT=1000;
