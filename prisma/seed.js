import prisma from "../lib/prisma.js";
import bcrypt from "bcrypt";

async function main() {
  const hashedPassword = await bcrypt.hash("Admin123!", 10);

  await prisma.user.upsert({
    where: {
      email: "admin@trendyshop.com",
    },
    update: {
      isAdmin: true,
    },
    create: {
      email: "admin@trendyshop.com",
      password: hashedPassword,
      name: "Admin TrendyShop",
      isAdmin: true,
    },
  });

  console.log("✅ Admin prêt");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
