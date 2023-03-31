-- create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA public;

-- create tables
CREATE TABLE public."Recipe" (
    "RECIPE_PK" uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "NAME" VARCHAR NOT NULL,
    "DESCRIPTION" VARCHAR NOT NULL,
    "IMAGE" bytea
);

CREATE TABLE public."Rating" (
    "RATING_PK" uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "N1STARS" integer DEFAULT 0 NOT NULL,
    "N2STARS" integer DEFAULT 0 NOT NULL,
    "N3STARS" integer DEFAULT 0 NOT NULL,
    "N4STARS" integer DEFAULT 0 NOT NULL,
    "N5STARS" integer DEFAULT 0 NOT NULL,
    "RECIPE_FK" uuid NOT NULL
);

CREATE TABLE public."Comment" (
    "COMMENT_PK" uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "COMMENT" VARCHAR NOT NULL,
    "RECIPE_FK" uuid NOT NULL
);

-- set foreign key relations
ALTER TABLE ONLY public."Comment"
    ADD CONSTRAINT "COMMENT_pkey" PRIMARY KEY ("COMMENT_PK");
ALTER TABLE ONLY public."Rating"
    ADD CONSTRAINT "RATING_pkey" PRIMARY KEY ("RATING_PK");
ALTER TABLE ONLY public."Recipe"
    ADD CONSTRAINT "RECIPE_pkey" PRIMARY KEY ("RECIPE_PK");

ALTER TABLE ONLY public."Comment"
    ADD CONSTRAINT "Unique Comment" UNIQUE ("COMMENT") INCLUDE ("COMMENT");

ALTER TABLE ONLY public."Comment"
    ADD CONSTRAINT "Unique PK" UNIQUE ("COMMENT_PK") INCLUDE ("COMMENT_PK");

ALTER TABLE ONLY public."Recipe"
    ADD CONSTRAINT "Unique Recipe Name" UNIQUE ("NAME") INCLUDE ("NAME");

ALTER TABLE ONLY public."Rating"
    ADD CONSTRAINT "Unique Ref to Recipe" UNIQUE ("RECIPE_FK") INCLUDE ("RECIPE_FK");

CREATE UNIQUE INDEX "UUID" ON public."Recipe" USING btree ("RECIPE_PK") INCLUDE ("RECIPE_PK");

ALTER TABLE ONLY public."Comment"
    ADD CONSTRAINT "RECIPE_PKEY" FOREIGN KEY ("RECIPE_FK") REFERENCES public."Recipe"("RECIPE_PK");
ALTER TABLE ONLY public."Rating"
    ADD CONSTRAINT "Recipe_pkey" FOREIGN KEY ("RECIPE_FK") REFERENCES public."Recipe"("RECIPE_PK") NOT VALID;

--- insert dummy rows
INSERT INTO public."Recipe"
("RECIPE_PK", "NAME", "DESCRIPTION", "IMAGE")
VALUES('20f41b1e-da20-4ac7-98d7-296d5cb780bf', 'Chilli Con Carne', 'I love this food', 'picture1');
INSERT INTO public."Recipe"
("RECIPE_PK", "NAME", "DESCRIPTION", "IMAGE")
VALUES('a1feab95-812b-4253-a151-b7de3b32fe61', 'Spaghetti Bolognese', 'My kids love this food', 'picture2');
INSERT INTO public."Recipe"
("RECIPE_PK", "NAME", "DESCRIPTION", "IMAGE")
VALUES('99dcbca3-a72d-401e-acd2-bdec9a19710a', 'Quiche Lorraine', 'My GF loves this food', 'picture3');

INSERT INTO public."Rating"
("RATING_PK", "N1STARS", "N2STARS", "N3STARS", "N4STARS", "N5STARS", "RECIPE_FK")
VALUES('c8c1b161-84a5-4faf-8e6e-25bebaa897d3', 0, 0, 3, 1, 1, '20f41b1e-da20-4ac7-98d7-296d5cb780bf');
INSERT INTO public."Rating"
("RATING_PK", "N1STARS", "N2STARS", "N3STARS", "N4STARS", "N5STARS", "RECIPE_FK")
VALUES('c5e900ae-d5f4-47b6-a065-97bf3d8f2b71', 0, 0, 1, 1, 3, 'a1feab95-812b-4253-a151-b7de3b32fe61');
INSERT INTO public."Rating"
("RATING_PK", "N1STARS", "N2STARS", "N3STARS", "N4STARS", "N5STARS", "RECIPE_FK")
VALUES('47784082-fb3a-4cc2-8aa0-9b4a30aeb8a0', 0, 3, 0, 0, 2, '99dcbca3-a72d-401e-acd2-bdec9a19710a');

INSERT INTO public."Comment"
("COMMENT_PK", "COMMENT", "RECIPE_FK")
VALUES('0e2381ac-e637-4eeb-9831-f5e639c15bd0', 'I love it', '20f41b1e-da20-4ac7-98d7-296d5cb780bf');
INSERT INTO public."Comment"
("COMMENT_PK", "COMMENT", "RECIPE_FK")
VALUES('eb269400-b635-416c-b515-9de2f6ebf2e9', 'I hate it', '20f41b1e-da20-4ac7-98d7-296d5cb780bf');