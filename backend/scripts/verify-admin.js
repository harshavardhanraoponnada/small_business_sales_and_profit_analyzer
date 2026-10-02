const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const readline = require("readline");

const prisma = new PrismaClient();

async function ask(question, hidden = false) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  });

  if (hidden) {
    rl.stdoutMuted = true;
    rl._writeToOutput = function () {
      rl.output.write("*");
    };
  }

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function main() {
  const username = await ask("Admin username: ");
  const password = await ask("Admin password: ", true);

  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user) {
    console.log("\nUser not found. Check the exact username.");
    return;
  }

  console.log("\nUser found.");
  console.log("Role:", user.role);

  const matches = await bcrypt.compare(
    password,
    user.password_hash
  );

  console.log(
    matches
      ? "Password matches the stored hash."
      : "Password does NOT match the stored hash."
  );
}

main()
  .catch((error) => {
    console.error("Verification failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });