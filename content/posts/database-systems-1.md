---
title: "Intro to Database Systems"
date: 2024-05-07
categories:
  - Databases
tags: ["learn", "database", "databases", "sql"]
---

I am currently studying database systems. This blog summarises lectures 1 and 2, as well as the SQL homework from the **[Database Systems](https://15445.courses.cs.cmu.edu/fall2021/)** CMU 15-445/645 course.

It's fascinating to realize the extent to which we interact with database systems in our daily lives. They're not just confined to large-scale applications but are also embedded in our browsers and mobile devices. Before the advent of database management systems, data management was complex, with a strong coupling between the data and its management. This required constant re-implementation for different applications.

To address this issue, Edgar F. Codd introduced the concept of the relational model, one of many data models including graph, network, document, and arrays/matrices.

> A data model is a collection of concepts for describing the data in a database. The relational model is an example of a data model.

The most widely used database system is the relational database, which was developed based on Edgar F. Codd's proposals. In this system, data is stored in a relation (or table), and each record (row) or tuple contains the data. A relation consists of attributes (columns).

So, how do we communicate with a DBMS?

We use Data Manipulation Languages (DMLs) which can be procedural or non-procedural (declarative). Procedural languages specify both what we want and how we want the data, while non-procedural languages only specify what we want, leaving the retrieval method up to the DBMS.

Relational algebra, is like a math of databases and uses special symbols to represent specific operations on relations. Each operation takes one or more relations as input and produces a new relation as output.

There are several types of operations in relational algebra:

- **Select**: This operation takes a relation and outputs a subset of tuples that satisfy a certain condition or predicate.
- **Projection**: It outputs a relation with tuples containing only specified attributes.
- **Union**: This operation outputs a relation containing all tuples appearing in at least one of the input relations.
- **Intersection**: It outputs a relation containing all tuples appearing in both input relations.
- **Difference**: This operation outputs a relation containing all tuples appearing in the first relation but not the second.
- **Product**: It outputs a relation containing all possible combinations of tuples from the input relations.
- **Join**: This operation outputs a relation where two relations are joined on a specific attribute.

SQL is a non-procedural language, that is we only say what we want, and how? is managed by the database, there are many SQL database systems such as postgreSQL, MySQL, sqlite, all the SQL database are mostly similar but there is a difference in the methods offered and how the database system manages different types, a database system is said to support SQL if it implements SQL 92,

here are my answers for the assignment along with some expiation

Q1

```sql
SELECT CategoryName
FROM Category
ORDER BY CategoryName;
-- this command just selects the CategoryName attribute from Category Relation
-- and they tuples are ordered by the category name in ascending order
```

Q2

```sql
SELECT DISTINCT ShipName,
    SUBSTR(ShipName, 0, INSTR(ShipName, '-'))
FROM "Order" AS o
WHERE o.ShipName LIKE "%-%"
ORDER BY o.ShipName;
-- this command selects shipName attribute and
-- all the characters preceding hypen '-', this is achived
-- by using the INSTR string function, which can be used to
-- get the position of a character in a string,
-- and SUBSTR function is used to get a substring of a string
-- LIKE is used for wild card matching of string, where '%' any characters
-- including an empty string ''
-- the retreived tuples are ordred by the shipName
```

Q3

```sql
SELECT Id,
    ShipCountry,
    CASE
        WHEN (ShipCountry LIKE 'USA')
        OR (ShipCountry LIKE 'Mexico')
        OR (ShipCountry LIKE 'Canada') THEN 'NorthAmerica'
        ELSE 'OtherPlace'
    END
FROM "Order"
WHERE Id >= 15445
ORDER BY Id
LIMIT 20
-- this command selects the Id and ShipCountry attribute from "Order" relation
-- CASE is similar to if else in general progrmming, it is used to check if the
-- ShipCountry is 'USA' or 'Mexico' or 'Cannada', if it is then the value 'NorthAmerica'
-- is stored in tuple else 'OtherPlace' is stored in the tuple
-- again ORDER BY is used to order the typle according to their Id
-- WHERE Id >= 15445 is used to select only the tuples having Id more then 15445
-- LIMIT is used to limit the output to only 20 tuples(rows)
```

Q4

```sql
WITH orderDelay (ShipId, delay) AS (
    SELECT ShipVia,
        CASE
            WHEN ShippedDate > RequiredDate THEN 'late'
            ELSE 'ontime'
        END AS delay
    FROM "Order"
)
SELECT CompanyName,
    ROUND(
        100.0 * COUNT(
            CASE
                WHEN od.delay = 'late' THEN 1
                ELSE NULL
            END
        ) / COUNT(*),
        2
    ) AS delayPercentage
FROM orderDelay AS od,
    Shipper
WHERE od.ShipId = Shipper.Id
GROUP BY ShipId
-- WITH AS statement is used to create an temprovary table
-- which has ShipVia attribute stored as ShipId and it is calcuated if the
-- order was late using ShippedDate and RequiredDate attributes and stored
-- as delay attribute in orderDelay table
-- were are SELECTing CompanyName and calculating the percentage of late orders
-- and rounding them to 2 decimal places using ROUND function and storing it as
-- delayPercentage attribute, we are using both the Shipper, and the newly created
-- orderDelay Relation to calculate the delayPercentage
```

Q5

```sql
SELECT CategoryName,
    COUNT(*) AS numberOfProducts,
    ROUND(AVG(UnitPrice), 2),
    MIN(UnitPrice),
    MAX(UnitPrice),
    SUM(UnitsOnOrder)
FROM "Product" AS p
    JOIN "Category" AS c ON p.CategoryId = c.Id
GROUP BY c.Id
-- here we are joining two relations "Product" and "Category" based on the CategoryId
-- and calculating umberOfProducts using COUNT, average UnitPrice using AVG, minimum
-- UnitPrice using MIN and maximum UnitPrice using MAX and total orders using SUM
-- aggrigate functions,
-- here the GROUP BY is used to group the tuples having same CategoryId, hence the
-- aggrigate function performs operations on the gorups of tuples having same
-- CategoryId
```

Q6

```sql
WITH discounted (orderId, productId) AS (
    SELECT OrderId,
        ProductId
    FROM OrderDetail as od,
        Product as p
    WHERE od.ProductId = p.Id
        AND p.Discontinued = 1
)
SELECT ProductName,
    CompanyName,
    ContactName
FROM (
        SELECT *,
            RANK() OVER(
                PARTITION BY d.ProductId
                ORDER BY o.OrderDate
            ) as rank
        FROM "Order" as o,
            discounted as d
        WHERE o.id = d.orderId
    )
    JOIN Customer ON CustomerId = Customer.Id
    JOIN Product ON Product.id = ProductId
WHERE rank = 1
ORDER BY ProductName
-- here we are getting a relation of all the products, which are discounted
-- and storing the obtained tuples in discounted relation
-- we use inner Query to add a new attribute of rank based on
-- when the companies have ordered the product, this is acheived
-- using the RANK window function and PARTITION BY and ORDER BY
-- so tuple having RANK 1 ordered the product first
-- finally in the outer query we only select the companies which
-- brough the product first
```

Q7

```sql
SELECT o.Id,
    OrderDate,
    LAG(OrderDate, 1, 0) OVER(
        ORDER BY OrderDate
    ) AS PreviousOrderDate,
    ROUND(
        julianday(OrderDate) - julianday(
            LAG(OrderDate, 1, 0) OVER(
                ORDER BY OrderDate
            )
        ),
        2
    ) AS 'Lag'
FROM "Order" AS o,
    Customer AS c
WHERE o.CustomerId = c.Id
    AND o.CustomerId = 'BLONP'
ORDER BY OrderDate
LIMIT 10
-- here we mainly use the LAG function to get the value of the
-- preceding tuple, LAG should almost always be used with ORDER BY
-- becuase if we didn't use the ORDER BY the ouput can be randomized
-- we are caclucating the time difference between two orders using
-- the LAG aggrigate function and julianday function as ouputing it as
-- 'LAG' attribute
-- we are limiting the output to 10 tuples using LIMIT
```

Q8

```sql
WITH expendeture(Id, expen) AS (
    SELECT CustomerId as Id,
        SUM(UnitPrice * Quantity) AS expen
    FROM "Order" AS o
        JOIN OrderDetail AS od ON o.Id = od.OrderId
    GROUP BY CustomerId
)
SELECT CASE
        WHEN (
            e.Id NOT IN (
                SELECT Id
                FROM Customer
            )
        ) THEN 'MISSING_NAME'
        ELSE (
            SELECT CompanyName
            FROM Customer
            WHERE e.Id = Id
        )
    END AS 'CompanyName',
    e.Id AS 'CustomerId',
    ROUND(e.expen, 2) AS 'Expences'
FROM expendeture AS e
ORDER BY e.expen
-- here we create a new table which contains the customerId and
-- customer expences as attributes then in the outer query
-- we are using case to check if the customer in present in the customer table
-- if present we use the CompanyName else we use 'MISSING_NAME'
-- we round the expences of company to
-- two decimal places using ROUND function
```

Q9

```sql
select RegionDescription,
    FirstName,
    LastName,
    BirthDate
FROM (
        select *,
            RANK() OVER(
                PARTITION BY r.id
                ORDER BY BirthDate DESC
            ) AS rank
        from Employee as e
            JOIN EmployeeTerritory as et ON e.id = et.EmployeeId
            JOIN Territory as t ON et.TerritoryId = t.Id
            JOIN Region as r ON t.RegionId = r.Id
    )
WHERE rank = 1
GROUP BY Id
ORDER BY RegionId
-- here we are using the inner query, to rank the employee
-- according to their birthdate
-- and in the outer query we are selecting the employee whose rank is 1
-- and ordering the output by RegionId
```

Q10

```sql
WITH productNames(pname, id) AS (
    SELECT ProductName,
        ROW_NUMBER() OVER(
            ORDER BY ProductId
        )
    FROM "Order" as o
        JOIN OrderDetail as od ON o.id = od.OrderId
        JOIN Product as p ON od.ProductId = p.Id
        JOIN Customer as c ON c.id = o.CustomerId
    WHERE julianday(substr(OrderDate, 0, instr(OrderDate, " ")))
     = julianday('2014-12-25')
        AND CompanyName = 'Queen Cozinha'
    ORDER BY ProductId
)
SELECT *
FROM productNames
-- here we are using julianday to get the day
-- order which are made on the required day
-- and were are selecting only the required companyName
-- and ordering the orders according to their productId
```

i am still trying to wrap my head around the recursion in SQL, so my 10th answer is incomplete,

here are some sources that help me complete this assignment

[https://www.sqlitetutorial.net/](https://www.sqlitetutorial.net/)

[https://www.youtube.com/@AlexTheAnalyst](https://www.youtube.com/@AlexTheAnalyst)
