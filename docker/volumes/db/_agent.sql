\set pguser `echo "$POSTGRES_USER"`

CREATE DATABASE agent WITH OWNER :pguser;
