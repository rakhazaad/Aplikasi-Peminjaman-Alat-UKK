--
-- PostgreSQL database dump
--

-- Dumped from database version 16.3
-- Dumped by pg_dump version 16.3

-- Started on 2026-01-29 10:12:39

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 220 (class 1259 OID 51256)
-- Name: alat; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.alat (
    id integer NOT NULL,
    nama character varying(255) NOT NULL,
    kategori_id integer,
    deskripsi text,
    jumlah integer DEFAULT 0 NOT NULL,
    status character varying(20) DEFAULT 'tersedia'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT alat_status_check CHECK (((status)::text = ANY ((ARRAY['tersedia'::character varying, 'dipinjam'::character varying, 'rusak'::character varying])::text[])))
);


ALTER TABLE public.alat OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 51255)
-- Name: alat_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.alat_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.alat_id_seq OWNER TO postgres;

--
-- TOC entry 4920 (class 0 OID 0)
-- Dependencies: 219
-- Name: alat_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.alat_id_seq OWNED BY public.alat.id;


--
-- TOC entry 218 (class 1259 OID 51245)
-- Name: kategori; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.kategori (
    id integer NOT NULL,
    nama character varying(255) NOT NULL,
    deskripsi text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.kategori OWNER TO postgres;

--
-- TOC entry 217 (class 1259 OID 51244)
-- Name: kategori_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.kategori_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.kategori_id_seq OWNER TO postgres;

--
-- TOC entry 4921 (class 0 OID 0)
-- Dependencies: 217
-- Name: kategori_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.kategori_id_seq OWNED BY public.kategori.id;


--
-- TOC entry 226 (class 1259 OID 51327)
-- Name: log_aktifitas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.log_aktifitas (
    id integer NOT NULL,
    user_id integer,
    aksi character varying(255) NOT NULL,
    tabel character varying(100),
    record_id integer,
    detail text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.log_aktifitas OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 51326)
-- Name: log_aktifitas_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.log_aktifitas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.log_aktifitas_id_seq OWNER TO postgres;

--
-- TOC entry 4922 (class 0 OID 0)
-- Dependencies: 225
-- Name: log_aktifitas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.log_aktifitas_id_seq OWNED BY public.log_aktifitas.id;


--
-- TOC entry 228 (class 1259 OID 51363)
-- Name: notifikasi; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifikasi (
    id integer NOT NULL,
    user_id integer,
    tipe character varying(50) NOT NULL,
    judul character varying(255) NOT NULL,
    pesan text NOT NULL,
    dibaca boolean DEFAULT false,
    link character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.notifikasi OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 51361)
-- Name: notifikasi_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notifikasi_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifikasi_id_seq OWNER TO postgres;

--
-- TOC entry 4923 (class 0 OID 0)
-- Dependencies: 227
-- Name: notifikasi_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notifikasi_id_seq OWNED BY public.notifikasi.id;


--
-- TOC entry 222 (class 1259 OID 51275)
-- Name: peminjaman; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.peminjaman (
    id integer NOT NULL,
    peminjam_id integer,
    alat_id integer,
    jumlah integer DEFAULT 1 NOT NULL,
    tanggal_pinjam date NOT NULL,
    tanggal_kembali date NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying,
    keterangan text,
    petugas_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT peminjaman_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'disetujui'::character varying, 'ditolak'::character varying, 'dipinjam'::character varying, 'menunggu_konfirmasi'::character varying, 'dikembalikan'::character varying])::text[])))
);


ALTER TABLE public.peminjaman OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 51274)
-- Name: peminjaman_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.peminjaman_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.peminjaman_id_seq OWNER TO postgres;

--
-- TOC entry 4924 (class 0 OID 0)
-- Dependencies: 221
-- Name: peminjaman_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.peminjaman_id_seq OWNED BY public.peminjaman.id;


--
-- TOC entry 224 (class 1259 OID 51304)
-- Name: pengembalian; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pengembalian (
    id integer NOT NULL,
    peminjaman_id integer,
    tanggal_kembali_aktual date NOT NULL,
    kondisi character varying(20) DEFAULT 'baik'::character varying,
    keterangan text,
    petugas_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    denda numeric(12,2) DEFAULT 0,
    CONSTRAINT pengembalian_kondisi_check CHECK (((kondisi)::text = ANY ((ARRAY['baik'::character varying, 'rusak'::character varying, 'hilang'::character varying])::text[])))
);


ALTER TABLE public.pengembalian OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 51303)
-- Name: pengembalian_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pengembalian_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pengembalian_id_seq OWNER TO postgres;

--
-- TOC entry 4925 (class 0 OID 0)
-- Dependencies: 223
-- Name: pengembalian_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pengembalian_id_seq OWNED BY public.pengembalian.id;


--
-- TOC entry 216 (class 1259 OID 51231)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(100) NOT NULL,
    password character varying(255) NOT NULL,
    nama character varying(255) NOT NULL,
    role character varying(20) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['admin'::character varying, 'petugas'::character varying, 'peminjam'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 215 (class 1259 OID 51230)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- TOC entry 4926 (class 0 OID 0)
-- Dependencies: 215
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 4724 (class 2604 OID 51259)
-- Name: alat id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alat ALTER COLUMN id SET DEFAULT nextval('public.alat_id_seq'::regclass);


--
-- TOC entry 4721 (class 2604 OID 51248)
-- Name: kategori id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kategori ALTER COLUMN id SET DEFAULT nextval('public.kategori_id_seq'::regclass);


--
-- TOC entry 4739 (class 2604 OID 51330)
-- Name: log_aktifitas id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.log_aktifitas ALTER COLUMN id SET DEFAULT nextval('public.log_aktifitas_id_seq'::regclass);


--
-- TOC entry 4741 (class 2604 OID 51366)
-- Name: notifikasi id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifikasi ALTER COLUMN id SET DEFAULT nextval('public.notifikasi_id_seq'::regclass);


--
-- TOC entry 4729 (class 2604 OID 51278)
-- Name: peminjaman id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.peminjaman ALTER COLUMN id SET DEFAULT nextval('public.peminjaman_id_seq'::regclass);


--
-- TOC entry 4734 (class 2604 OID 51307)
-- Name: pengembalian id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pengembalian ALTER COLUMN id SET DEFAULT nextval('public.pengembalian_id_seq'::regclass);


--
-- TOC entry 4718 (class 2604 OID 51234)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 4755 (class 2606 OID 51268)
-- Name: alat alat_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alat
    ADD CONSTRAINT alat_pkey PRIMARY KEY (id);


--
-- TOC entry 4753 (class 2606 OID 51254)
-- Name: kategori kategori_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kategori
    ADD CONSTRAINT kategori_pkey PRIMARY KEY (id);


--
-- TOC entry 4761 (class 2606 OID 51335)
-- Name: log_aktifitas log_aktifitas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.log_aktifitas
    ADD CONSTRAINT log_aktifitas_pkey PRIMARY KEY (id);


--
-- TOC entry 4763 (class 2606 OID 51372)
-- Name: notifikasi notifikasi_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifikasi
    ADD CONSTRAINT notifikasi_pkey PRIMARY KEY (id);


--
-- TOC entry 4757 (class 2606 OID 51287)
-- Name: peminjaman peminjaman_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.peminjaman
    ADD CONSTRAINT peminjaman_pkey PRIMARY KEY (id);


--
-- TOC entry 4759 (class 2606 OID 51315)
-- Name: pengembalian pengembalian_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pengembalian
    ADD CONSTRAINT pengembalian_pkey PRIMARY KEY (id);


--
-- TOC entry 4749 (class 2606 OID 51241)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4751 (class 2606 OID 51243)
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- TOC entry 4764 (class 2606 OID 51269)
-- Name: alat alat_kategori_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alat
    ADD CONSTRAINT alat_kategori_id_fkey FOREIGN KEY (kategori_id) REFERENCES public.kategori(id) ON DELETE SET NULL;


--
-- TOC entry 4770 (class 2606 OID 51336)
-- Name: log_aktifitas log_aktifitas_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.log_aktifitas
    ADD CONSTRAINT log_aktifitas_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 4771 (class 2606 OID 51373)
-- Name: notifikasi notifikasi_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifikasi
    ADD CONSTRAINT notifikasi_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4765 (class 2606 OID 51293)
-- Name: peminjaman peminjaman_alat_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.peminjaman
    ADD CONSTRAINT peminjaman_alat_id_fkey FOREIGN KEY (alat_id) REFERENCES public.alat(id) ON DELETE CASCADE;


--
-- TOC entry 4766 (class 2606 OID 51288)
-- Name: peminjaman peminjaman_peminjam_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.peminjaman
    ADD CONSTRAINT peminjaman_peminjam_id_fkey FOREIGN KEY (peminjam_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4767 (class 2606 OID 51298)
-- Name: peminjaman peminjaman_petugas_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.peminjaman
    ADD CONSTRAINT peminjaman_petugas_id_fkey FOREIGN KEY (petugas_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 4768 (class 2606 OID 51316)
-- Name: pengembalian pengembalian_peminjaman_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pengembalian
    ADD CONSTRAINT pengembalian_peminjaman_id_fkey FOREIGN KEY (peminjaman_id) REFERENCES public.peminjaman(id) ON DELETE CASCADE;


--
-- TOC entry 4769 (class 2606 OID 51321)
-- Name: pengembalian pengembalian_petugas_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pengembalian
    ADD CONSTRAINT pengembalian_petugas_id_fkey FOREIGN KEY (petugas_id) REFERENCES public.users(id) ON DELETE SET NULL;


-- Completed on 2026-01-29 10:12:39

--
-- PostgreSQL database dump complete
--

