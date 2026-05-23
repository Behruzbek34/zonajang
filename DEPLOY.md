# ZonaJang — Deploy Qo'llanmasi (100% Bepul)

## Arxitektura
```
Frontend  → Vercel     (bepul, cheksiz)
Database  → Supabase   (bepul: 500MB, cheksiz foydalanuvchi)
Realtime  → Supabase   (bepul: 2M xabar/oy)
Auth      → Supabase   (bepul, JWT)
```
Backend server KERAK EMAS — Supabase hamma narsani bajaradi.

---

## 1-QADAM: Supabase (5 daqiqa)

### 1.1 Loyiha yaratish
1. **https://supabase.com** ga o'ting → "Start your project"
2. GitHub yoki email bilan ro'yxatdan o'ting (bepul)
3. **"New project"** → Nom bering (masalan: `zonajang`)
4. Parol o'ylab toping, region: **Frankfurt (EU)** → **Create project**
5. 2 daqiqa kuting (DB yaratilmoqda)

### 1.2 SQL schemani ishga tushirish
1. Chap menyu → **SQL Editor** → **New query**
2. `supabase/schema.sql` faylidagi BARCHA matni ko'chiring va yapishtirig
3. **Run** (▶) tugmasi → "Success" ko'rinishi kerak

### 1.3 Realtime yoqish
1. Chap menyu → **Database** → **Replication**
2. **territories** jadvalini "Source" ga qo'shing (toggle ON)
3. **notifications** jadvalini ham toggle ON

### 1.4 Email tasdiqlashni o'chirish (MVP uchun)
1. Chap menyu → **Authentication** → **Settings**
2. **"Confirm email"** → O'chirib qo'ying (toggle OFF)
3. Save

### 1.5 Kalitlarni olish
1. Chap menyu → **Settings** → **API**
2. **Project URL** → Nusxalang
3. **anon public** kalit → Nusxalang

---

## 2-QADAM: GitHub (3 daqiqa)

```bash
# Loyiha papkasida:
git init
git add .
git commit -m "ZonaJang MVP"

# GitHub.com da yangi repository yarating (public yoki private)
# Keyin:
git remote add origin https://github.com/SIZNING_USERNAME/zonajang.git
git push -u origin main
```

---

## 3-QADAM: Vercel (3 daqiqa)

1. **https://vercel.com** ga o'ting → GitHub bilan kiring
2. **"Add New Project"** → GitHub reponi tanlang
3. **Framework Preset**: Vite (avtomatik aniqlanishi kerak)
4. **Environment Variables** bo'limida qo'shing:

| Name | Value |
|------|-------|
| `VITE_SUPABASE_URL` | `https://xxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGci...` |

5. **Deploy** → 1-2 daqiqa → tayyor!

Vercel sizga bepul domen beradi: `zonajang.vercel.app`

---

## 4-QADAM: Tekshirish

1. `https://sizning-loyiha.vercel.app` ga o'ting
2. Ro'yxatdan o'ting (yangi hisob)
3. Xaritada "Yozishni Boshlash" tugmasi bilan GPS yozib ko'ring
4. Supabase → **Table Editor** → `territories` — yangi qator ko'rinishi kerak

---

## Xususiy domen qo'shish (ixtiyoriy, bepul)

Vercel bepul subdomain beradi. Agar o'zingizning domeningiz bo'lsa:
1. Vercel → Project → **Settings** → **Domains**
2. Domeningizni qo'shing → DNS yozuvini yangilang

---

## Keyingi qadamlar (ixtiyoriy)

- **Custom email** uchun: Supabase → Auth → SMTP sozlamalari
- **Analitika** uchun: Vercel Analytics (bepul tier mavjud)
- **Monitoring** uchun: Supabase Dashboard → API stats

---

## Foydali havolalar

- Supabase docs: https://supabase.com/docs
- Vercel docs: https://vercel.com/docs
- Supabase Realtime: https://supabase.com/docs/guides/realtime
