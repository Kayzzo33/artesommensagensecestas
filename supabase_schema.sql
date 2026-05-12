-- CATEGORIAS
create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  color text default '#e91e8c',
  is_promo boolean default false,       -- categoria de promoção destacada
  display_order int default 0,
  active boolean default true,
  created_at timestamptz default now()
);

-- PRODUTOS
create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric(10,2) not null,
  original_price numeric(10,2),         -- para exibir desconto
  category_id uuid references categories(id),
  images text[] default '{}',           -- array de URLs (upload ou link externo)
  allows_message boolean default false, -- se aceita cartão/mensagem personalizada
  message_fee numeric(10,2) default 0,  -- 0 = grátis
  featured boolean default false,
  active boolean default true,
  stock_qty int default 0,             -- controle básico de estoque
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- BANNERS COMERCIAIS
create table banners (
  id uuid primary key default gen_random_uuid(),
  title text,
  subtitle text,
  image_url text not null,
  link_url text,
  display_order int default 0,
  active boolean default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz default now()
);

-- BAIRROS E FRETE
create table neighborhoods (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  shipping_fee numeric(10,2) not null default 0,
  active boolean default true
);

-- PEDIDOS
create table orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  neighborhood_id uuid references neighborhoods(id),
  address_street text,
  address_number text,
  address_complement text,
  items jsonb not null,                 -- snapshot dos produtos no momento do pedido
  subtotal numeric(10,2) not null,
  shipping_fee numeric(10,2) default 0,
  total numeric(10,2) not null,
  personal_message text,               -- mensagem personalizada do cliente
  notes text,                          -- observações gerais
  status text default 'pendente' check (status in ('pendente','confirmado','em_preparo','enviado','entregue','cancelado')),
  whatsapp_sent boolean default false,
  created_at timestamptz default now()
);

-- ORÇAMENTO DE MERCADORIAS (controle de insumos)
create table inventory_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  unit text default 'un',              -- kg, un, caixa, dúzia...
  cost_price numeric(10,2) not null,
  quantity numeric(10,3) default 0,
  minimum_qty numeric(10,3) default 0, -- alerta de estoque baixo
  category text,                       -- ex: embalagem, alimento, decoração
  supplier text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- MOVIMENTAÇÃO FINANCEIRA MANUAL
create table financial_records (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('receita','despesa')),
  amount numeric(10,2) not null,
  description text not null,
  category text,                       -- ex: venda, insumo, frete, taxa
  reference_date date not null default current_date,
  order_id uuid references orders(id), -- opcional: ligar a um pedido
  created_at timestamptz default now()
);

-- CONFIGURAÇÕES DA LOJA
create table store_settings (
  id int primary key default 1,        -- sempre 1 registro
  whatsapp_number text not null,
  whatsapp_message_template text,
  store_name text default 'Arte Som',
  store_logo_url text,
  instagram_url text,
  facebook_url text,
  address text,
  opening_hours text,
  constraint single_row check (id = 1)
);


-- Habilitar RLS em todas as tabelas
alter table categories enable row level security;
alter table products enable row level security;
alter table banners enable row level security;
alter table neighborhoods enable row level security;
alter table orders enable row level security;
alter table inventory_items enable row level security;
alter table financial_records enable row level security;
alter table store_settings enable row level security;

-- ══════════════════════════════════════════════
-- TABELAS PÚBLICAS (leitura sem autenticação)
-- ══════════════════════════════════════════════

create policy "public_read_categories"
  on categories for select using (active = true);

create policy "public_read_products"
  on products for select using (active = true);

create policy "public_read_banners"
  on banners for select
  using (
    active = true
    and (starts_at is null or starts_at <= now())
    and (ends_at is null or ends_at >= now())
  );

create policy "public_read_neighborhoods"
  on neighborhoods for select using (active = true);

create policy "public_read_settings"
  on store_settings for select using (true);

-- Clientes podem INSERIR pedidos (sem autenticação)
create policy "public_insert_orders"
  on orders for insert with check (true);

-- ══════════════════════════════════════════════
-- TABELAS ADMIN (apenas usuários autenticados)
-- ══════════════════════════════════════════════

-- Categorias - admin full control
create policy "admin_all_categories"
  on categories for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Produtos - admin full control
create policy "admin_all_products"
  on products for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Banners - admin full control
create policy "admin_all_banners"
  on banners for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Bairros - admin full control
create policy "admin_all_neighborhoods"
  on neighborhoods for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Pedidos - admin pode ler e atualizar, cliente só insere
create policy "admin_manage_orders"
  on orders for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Insumos - somente admin
create policy "admin_all_inventory"
  on inventory_items for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Financeiro - somente admin
create policy "admin_all_financial"
  on financial_records for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Configurações - somente admin
create policy "admin_all_settings"
  on store_settings for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Bucket público de imagens de produtos
insert into storage.buckets (id, name, public)
values ('products', 'products', true);

-- Qualquer um pode ler (imagens públicas)
create policy "public_read_product_images"
  on storage.objects for select
  using (bucket_id = 'products');

-- Só admin pode fazer upload/delete
create policy "admin_upload_product_images"
  on storage.objects for insert
  with check (bucket_id = 'products' and auth.role() = 'authenticated');

create policy "admin_delete_product_images"
  on storage.objects for delete
  using (bucket_id = 'products' and auth.role() = 'authenticated');
