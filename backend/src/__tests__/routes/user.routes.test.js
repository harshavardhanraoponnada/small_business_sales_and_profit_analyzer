const request = require("supertest");
const express = require("express");

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

jest.mock("../../services/prisma.service", () => mockPrisma);

let testUserRole = "USER";
let testUserId = 1;

const testAuthMiddleware = (req, res, next) => {
  req.user = { id: testUserId, role: testUserRole };
  next();
};

jest.mock("../../middleware/authMiddleware", () => testAuthMiddleware);

const userRouter = require("../../routes/user.routes");

describe("User Routes - Preferences", () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    testUserRole = "USER";
    testUserId = 1;

    app = express();
    app.use(express.json());
    app.use("/api/users", userRouter);
  });

  describe("GET /profile", () => {
    it("should return user profile", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 1,
        username: "testuser",
        email: "test@example.com",
        role: "USER",
      });

      const res = await request(app)
        .get("/api/users/profile")
        .expect(200);

      expect(res.body).toHaveProperty("username");
    });

    it("should handle user not found", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await request(app)
        .get("/api/users/profile")
        .expect(404);
    });

    it("should handle database error", async () => {
      mockPrisma.user.findUnique.mockRejectedValue(new Error("DB error"));

      await request(app)
        .get("/api/users/profile")
        .expect(500);
    });
  });

  describe("PUT /preferences/reports", () => {
    it("OWNER can update own preferences", async () => {
      testUserRole = "OWNER";
      mockPrisma.user.update.mockResolvedValue({
        reportFrequency: "daily",
        reportFormat: "xlsx",
        reportScheduleTime: "08:30",
        reportScheduleWeekday: "monday",
        receiveScheduledReports: true,
      });

      const res = await request(app)
        .put("/api/users/preferences/reports")
        .send({ reportFrequency: "daily", reportFormat: "xlsx", reportScheduleTime: "08:30" })
        .expect(200);

      expect(res.body).toHaveProperty("message");
    });

    it("should reject invalid frequency", async () => {
      testUserRole = "OWNER";
      await request(app)
        .put("/api/users/preferences/reports")
        .send({ reportFrequency: "invalid" })
        .expect(400);
    });

    it("should reject invalid format", async () => {
      testUserRole = "OWNER";
      await request(app)
        .put("/api/users/preferences/reports")
        .send({ reportFormat: "docx" })
        .expect(400);
    });

    it("should reject invalid schedule time", async () => {
      testUserRole = "OWNER";
      await request(app)
        .put("/api/users/preferences/reports")
        .send({ reportScheduleTime: "24:99" })
        .expect(400);
    });

    it("should reject invalid schedule weekday", async () => {
      testUserRole = "OWNER";
      await request(app)
        .put("/api/users/preferences/reports")
        .send({ reportScheduleWeekday: "funday" })
        .expect(400);
    });

    it("USER cannot update own preferences", async () => {
      testUserRole = "USER";

      await request(app)
        .put("/api/users/preferences/reports")
        .send({ reportFrequency: "daily" })
        .expect(403);
    });

    it("should handle user not found", async () => {
      testUserRole = "OWNER";
      mockPrisma.user.update.mockRejectedValue({ code: "P2025" });

      await request(app)
        .put("/api/users/preferences/reports")
        .send({ reportFrequency: "daily" })
        .expect(404);
    });

    it("should handle database error", async () => {
      testUserRole = "OWNER";
      mockPrisma.user.update.mockRejectedValue(new Error("DB error"));

      await request(app)
        .put("/api/users/preferences/reports")
        .send({ reportFrequency: "daily" })
        .expect(500);
    });
  });

  describe("GET /preferences/reports", () => {
    it("should get preferences", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        reportFrequency: "weekly",
        reportFormat: "pdf",
        reportScheduleTime: "10:15",
        reportScheduleWeekday: "friday",
        receiveScheduledReports: true,
      });

      const res = await request(app)
        .get("/api/users/preferences/reports")
        .expect(200);

      expect(res.body).toHaveProperty("reportFrequency");
    });

    it("should return defaults for null values", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        reportFrequency: null,
        reportFormat: null,
        reportScheduleTime: null,
        reportScheduleWeekday: null,
        receiveScheduledReports: null,
      });

      const res = await request(app)
        .get("/api/users/preferences/reports")
        .expect(200);

      expect(res.body).toMatchObject({
        reportFrequency: "none",
        reportFormat: "pdf",
        reportScheduleTime: "09:00",
        reportScheduleWeekday: "monday",
      });
    });

    it("should handle user not found", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await request(app)
        .get("/api/users/preferences/reports")
        .expect(404);
    });

    it("should handle database error", async () => {
      mockPrisma.user.findUnique.mockRejectedValue(new Error("DB error"));

      await request(app)
        .get("/api/users/preferences/reports")
        .expect(500);
    });
  });

  describe("GET /:userId/preferences/reports (Admin)", () => {
    it("OWNER can retrieve user preferences", async () => {
      testUserRole = "OWNER";
      mockPrisma.user.findUnique.mockResolvedValue({
        reportFrequency: "daily",
        reportFormat: "pdf",
        reportScheduleTime: "07:45",
        reportScheduleWeekday: "monday",
        receiveScheduledReports: true,
      });

      await request(app)
        .get("/api/users/2/preferences/reports")
        .expect(200);
    });

    it("ACCOUNTANT cannot retrieve user preferences", async () => {
      testUserRole = "ACCOUNTANT";
      await request(app)
        .get("/api/users/2/preferences/reports")
        .expect(403);
    });

    it("USER cannot retrieve other user preferences", async () => {
      testUserRole = "USER";

      await request(app)
        .get("/api/users/2/preferences/reports")
        .expect(403);
    });

    it("should handle target user not found", async () => {
      testUserRole = "OWNER";
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await request(app)
        .get("/api/users/999/preferences/reports")
        .expect(404);
    });

    it("should handle database error", async () => {
      testUserRole = "OWNER";
      mockPrisma.user.findUnique.mockRejectedValue(new Error("DB error"));

      await request(app)
        .get("/api/users/2/preferences/reports")
        .expect(500);
    });
  });

  describe("PUT /:userId/preferences/reports (Admin)", () => {
    it("OWNER can update user preferences", async () => {
      testUserRole = "OWNER";
      mockPrisma.user.update.mockResolvedValue({
        reportFrequency: "monthly",
        reportFormat: "pdf",
        reportScheduleTime: "09:00",
        reportScheduleWeekday: "monday",
        receiveScheduledReports: true,
      });

      const res = await request(app)
        .put("/api/users/2/preferences/reports")
        .send({ reportFrequency: "monthly" })
        .expect(200);

      expect(res.body).toHaveProperty("message");
    });

    it("ACCOUNTANT cannot update user preferences", async () => {
      testUserRole = "ACCOUNTANT";
      await request(app)
        .put("/api/users/2/preferences/reports")
        .send({ reportFrequency: "weekly" })
        .expect(403);
    });

    it("USER cannot update other user preferences", async () => {
      testUserRole = "USER";

      await request(app)
        .put("/api/users/2/preferences/reports")
        .send({ reportFrequency: "daily" })
        .expect(403);
    });

    it("should reject invalid frequency", async () => {
      testUserRole = "OWNER";

      await request(app)
        .put("/api/users/2/preferences/reports")
        .send({ reportFrequency: "invalid" })
        .expect(400);
    });

    it("should reject invalid format", async () => {
      testUserRole = "OWNER";

      await request(app)
        .put("/api/users/2/preferences/reports")
        .send({ reportFormat: "csv" })
        .expect(400);
    });

    it("should reject invalid schedule time", async () => {
      testUserRole = "OWNER";

      await request(app)
        .put("/api/users/2/preferences/reports")
        .send({ reportScheduleTime: "25:00" })
        .expect(400);
    });

    it("should reject invalid schedule weekday", async () => {
      testUserRole = "OWNER";

      await request(app)
        .put("/api/users/2/preferences/reports")
        .send({ reportScheduleWeekday: "holiday" })
        .expect(400);
    });

    it("should handle target user not found", async () => {
      testUserRole = "OWNER";
      mockPrisma.user.update.mockRejectedValue({ code: "P2025" });

      await request(app)
        .put("/api/users/999/preferences/reports")
        .send({ reportFrequency: "daily" })
        .expect(404);
    });

    it("should handle database error", async () => {
      testUserRole = "OWNER";
      mockPrisma.user.update.mockRejectedValue(new Error("DB error"));

      await request(app)
        .put("/api/users/2/preferences/reports")
        .send({ reportFrequency: "daily" })
        .expect(500);
    });

    it("should handle partial updates", async () => {
      testUserRole = "OWNER";
      mockPrisma.user.update.mockResolvedValue({
        reportFrequency: "daily",
        reportFormat: "pdf",
        reportScheduleTime: "09:00",
        reportScheduleWeekday: "monday",
        receiveScheduledReports: true,
      });

      await request(app)
        .put("/api/users/2/preferences/reports")
        .send({ reportFrequency: "daily" })
        .expect(200);
    });
  });
});
