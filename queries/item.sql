SELECT *,
       (SELECT Count(*)+1
        FROM   (SELECT *
                FROM   items T
                WHERE  T.paintwear < S.paintwear
                  AND T.defindex = S.defindex
                  AND T.paintindex = S.paintindex
                  AND T.stattrak = S.stattrak
                  AND T.souvenir = S.souvenir
                ORDER  BY T.paintwear
                LIMIT  1000) as a) AS low_rank,
       (SELECT Count(*)+1
        FROM   (SELECT *
                FROM   items J
                WHERE  J.paintwear > S.paintwear
                  AND J.defindex = S.defindex
                  AND J.paintindex = S.paintindex
                  AND J.stattrak = S.stattrak
                  AND J.souvenir = S.souvenir
                ORDER  BY J.paintwear DESC
                LIMIT  1000) as b) AS high_rank
FROM   items S
WHERE  a=$1
