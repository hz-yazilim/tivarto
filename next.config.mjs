/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Önizleme/uzak geliştirme ortamlarında (ör. *.e2b.app) server action
  // isteklerinin Next tarafından reddedilmemesi için.
  allowedDevOrigins: ["*.e2b.app"],
  // Sunucu tarafında bcrypt/prisma kullanıldığı için bu paketler bundle dışında kalır.
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
  images: {
    // Ürün görselleri kullanıcı tarafından URL olarak girilebildiği için
    // Next/Image yerine standart <img> kullanılıyor; burada kısıt gerekmiyor.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  eslint: {
    // CI'da tip kontrolü + build yeterli; lint ayrı çalıştırılabilir.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
