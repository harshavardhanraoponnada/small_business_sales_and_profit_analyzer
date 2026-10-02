
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const readline = require("readline");

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

// Read the password without displaying it in the terminal.
function askPassword(question) {
  return new Promise((resolve, reject) => {
    if (!process.stdin.isTTY || !process.stdin.setRawMode) {
      reject(new Error("Run this script in an interactive terminal."));
      return;
    }

    process.stdout.write(question);
    let password = "";

    const onData = (buffer) => {
      for (const char of buffer.toString()) {
        if (char === "\u0003") {
          cleanup();
          reject(new Error("Cancelled."));
          return;
        }

        if (char === "\r" || char === "\n") {
          cleanup();
          process.stdout.write("\n");
          resolve(password);
          return;
        }

        if (char === "\u007f" || char === "\b") {
          password = password.slice(0, -1);
        } else if (char >= " ") {
          password += char;
        }
      }
    };

    function cleanup() {
      process.stdin.removeListener("data", onData);
      process.stdin.setRawMode(false);
      process.stdin.pause();
    }

    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on("data", onData);
  });
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is missing. Configure it for the intended database."
    );
  }

  const count = await prisma.user.count();

  if (count !== 0) {
    throw new Error(
      `Admin initialization stopped: ${count} user(s) already exist.`
    );
  }

  const username = (await ask("Admin username: ")).trim();
  const email = (await ask("Admin email: ")).trim().toLowerCase();

  if (!username || !email || !email.includes("@")) {
    throw new Error("Enter a valid username and email.");
  }

  const password = await askPassword("Admin password (input hidden): ");

  if (password.length < 12) {
    throw new Error("Use a password of at least 12 characters.");
  }

  const confirm = await askPassword("Confirm password: ");

  if (password !== confirm) {
    throw new Error("Passwords do not match.");
  }

  // Recheck before creating the first account.
  const existingCount = await prisma.user.count();

  if (existingCount !== 0) {
    throw new Error("A user was created meanwhile. Stopping.");
  }

  const password_hash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      username,
      email,
      password_hash,
      role: "OWNER",
    },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
    },
  });

  console.log("\nInitial admin created successfully:");
  console.log(user);
}

main()
  .catch((error) => {
    console.error("\nAdmin creation failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    rl.close();
    await prisma.$disconnect();
  });
