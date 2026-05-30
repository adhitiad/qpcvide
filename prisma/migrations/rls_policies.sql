-- Aktifkan RLS untuk tabel-tabel yang relevan
ALTER TABLE "Video" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Comment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Like" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Bookmark" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WatchHistory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AdSlot" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AdPurchase" ENABLE ROW LEVEL SECURITY;

-- 1. Kebijakan untuk tabel "Video"
-- Publik bisa melihat video
CREATE POLICY "Public can view videos"
ON "Video" FOR SELECT
TO public
USING (true);

-- Hanya admin yang bisa Insert/Update/Delete Video
CREATE POLICY "Admin can manage videos"
ON "Video" FOR ALL
USING (
  (SELECT role FROM "User" WHERE id = auth.uid()::text) = 'admin'
);

-- 2. Kebijakan untuk tabel "Comment"
-- Publik bisa melihat komentar
CREATE POLICY "Public can view comments"
ON "Comment" FOR SELECT
TO public
USING (true);

-- User yang login bisa insert komentar (asalkan userId sama dengan UID mereka)
CREATE POLICY "Logged in users can create comments"
ON "Comment" FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND "userId" = auth.uid()::text
);

-- Pemilik komentar atau admin bisa delete komentar
CREATE POLICY "Owners and admins can delete comments"
ON "Comment" FOR DELETE
USING (
  "userId" = auth.uid()::text OR
  (SELECT role FROM "User" WHERE id = auth.uid()::text) = 'admin'
);

-- 3. Kebijakan untuk tabel "User" (profiles)
-- Pemilik (auth.uid()) bisa select profil mereka sendiri
CREATE POLICY "Users can view own profile"
ON "User" FOR SELECT
USING (id = auth.uid()::text);

-- Pemilik (auth.uid()) bisa update profil mereka sendiri
CREATE POLICY "Users can update own profile"
ON "User" FOR UPDATE
USING (id = auth.uid()::text);

-- 4. Kebijakan untuk tabel "Like", "Bookmark", "WatchHistory"
-- Hanya pemilik yang bisa Select/Insert/Delete interaksi mereka sendiri

-- Like
CREATE POLICY "Users can view own likes"
ON "Like" FOR SELECT
USING ("userId" = auth.uid()::text);

CREATE POLICY "Users can manage own likes"
ON "Like" FOR INSERT
WITH CHECK ("userId" = auth.uid()::text);

CREATE POLICY "Users can delete own likes"
ON "Like" FOR DELETE
USING ("userId" = auth.uid()::text);

-- Bookmark
CREATE POLICY "Users can view own bookmarks"
ON "Bookmark" FOR SELECT
USING ("userId" = auth.uid()::text);

CREATE POLICY "Users can manage own bookmarks"
ON "Bookmark" FOR INSERT
WITH CHECK ("userId" = auth.uid()::text);

CREATE POLICY "Users can delete own bookmarks"
ON "Bookmark" FOR DELETE
USING ("userId" = auth.uid()::text);

-- WatchHistory
CREATE POLICY "Users can view own watch history"
ON "WatchHistory" FOR SELECT
USING ("userId" = auth.uid()::text);

CREATE POLICY "Users can manage own watch history"
ON "WatchHistory" FOR INSERT
WITH CHECK ("userId" = auth.uid()::text);

CREATE POLICY "Users can delete own watch history"
ON "WatchHistory" FOR DELETE
USING ("userId" = auth.uid()::text);

-- 5. Kebijakan untuk tabel Ad (AdSlot, AdPurchase)
-- Hanya admin yang bisa mengakses data Ads
CREATE POLICY "Admins only can access AdSlot"
ON "AdSlot" FOR ALL
USING (
  (SELECT role FROM "User" WHERE id = auth.uid()::text) = 'admin'
);

CREATE POLICY "Admins only can access AdPurchase"
ON "AdPurchase" FOR ALL
USING (
  (SELECT role FROM "User" WHERE id = auth.uid()::text) = 'admin'
);
