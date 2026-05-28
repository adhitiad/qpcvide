import { prisma } from "./app/lib/db.server";

async function test() {
  console.log("process.env.DATABASE_URL:", process.env.DATABASE_URL);
  try {
    const cats = await prisma.category.findMany();
    console.log(cats);
  } catch (err) {
    console.error(err);
  }
}
test();
