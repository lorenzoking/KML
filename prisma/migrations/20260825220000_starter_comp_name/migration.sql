-- AlterTable
ALTER TABLE "PositionMarketComp" ADD COLUMN "starterCompName" TEXT;

UPDATE "PositionMarketComp" SET "starterCompName" = 'Baker Mayfield' WHERE "position" = 'QB';
UPDATE "PositionMarketComp" SET "starterCompName" = 'Tony Pollard' WHERE "position" = 'RB';
UPDATE "PositionMarketComp" SET "starterCompName" = 'Courtland Sutton' WHERE "position" = 'WR';
UPDATE "PositionMarketComp" SET "starterCompName" = 'Hunter Henry' WHERE "position" = 'TE';
UPDATE "PositionMarketComp" SET "starterCompName" = 'Landon Dickerson' WHERE "position" = 'OL';
UPDATE "PositionMarketComp" SET "starterCompName" = 'Rashan Gary' WHERE "position" = 'EDGE';
UPDATE "PositionMarketComp" SET "starterCompName" = 'Daron Payne' WHERE "position" = 'DL';
UPDATE "PositionMarketComp" SET "starterCompName" = 'Ernest Jones' WHERE "position" = 'LB';
UPDATE "PositionMarketComp" SET "starterCompName" = 'Jaycee Horn' WHERE "position" = 'CB';
UPDATE "PositionMarketComp" SET "starterCompName" = 'Grant Delpit' WHERE "position" = 'S';
UPDATE "PositionMarketComp" SET "starterCompName" = 'Jake Elliott' WHERE "position" = 'K';
UPDATE "PositionMarketComp" SET "starterCompName" = 'Jack Fox' WHERE "position" = 'P';
