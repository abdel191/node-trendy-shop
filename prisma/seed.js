import prisma from "../lib/prisma.js";
import bcrypt from "bcrypt";

async function main() {
  const hashedPassword = await bcrypt.hash("Admin123!", 10);

  await prisma.user.create({
    data: {
      email: "admin@trendyshop.com",
      password: hashedPassword,
      name: "Admin TrendyShop",
      isAdmin: true,
    },
  });

  console.log("✅ Admin créé");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
