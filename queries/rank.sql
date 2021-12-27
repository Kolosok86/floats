SELECT (SELECT Count(*)+1
    FROM   (SELECT *
        FROM items T
        WHERE T.paintwear < $1
          AND T.defindex = $2
          AND T.paintindex = $3
          AND T.stattrak = $4
          AND T.souvenir = $5
        ORDER  BY T.paintwear
        LIMIT  1000) as a) AS low_rank,
    (SELECT Count(*)+1
    FROM   (SELECT *
        FROM items J
        WHERE J.paintwear > $1
          AND J.defindex = $2
          AND J.paintindex = $3
          AND J.stattrak = $4
          AND J.souvenir = $5
        ORDER  BY J.paintwear DESC
        LIMIT  1000) as b) AS high_rank