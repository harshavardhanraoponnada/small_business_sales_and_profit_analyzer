const prisma = require("./prisma.service");
const auditService = require("./audit.service");
const { sendScheduledReportEmail } = require("./mail.service");

const DEFAULT_SCHEDULE_TIME = "09:00";
const DEFAULT_SCHEDULE_WEEKDAY = "monday";
const DEFAULT_SCHEDULER_TIMEZONE = "Asia/Kolkata";
const VALID_FREQUENCIES = new Set(["daily", "weekly", "monthly"]);

let schedulerInterval = null;
let tickInProgress = false;
let mailConfigWarningShown = false;
const sentPeriodCache = new Map();

const WEEKDAY_NAMES = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

const getSchedulerInstanceConfig = () => {
  const currentInstanceId = String(process.env.INSTANCE_ID || "").trim();
  const schedulerInstanceId = String(process.env.REPORT_SCHEDULER_INSTANCE || "backend_1").trim();
  const isActiveInstance =
    !currentInstanceId || !schedulerInstanceId || currentInstanceId === schedulerInstanceId;

  return {
    currentInstanceId: currentInstanceId || "unknown",
    schedulerInstanceId,
    isActiveInstance,
  };
};

const getSchedulerTimeZone = () => {
  const configured = String(
    process.env.REPORT_SCHEDULER_TIMEZONE || process.env.TZ || DEFAULT_SCHEDULER_TIMEZONE
  ).trim();

  const candidate = configured || DEFAULT_SCHEDULER_TIMEZONE;

  try {
    new Intl.DateTimeFormat("en-US", { timeZone: candidate }).format(new Date());
    return candidate;
  } catch (error) {
    console.warn(
      `[report-scheduler] Invalid timezone \"${candidate}\". Falling back to ${DEFAULT_SCHEDULER_TIMEZONE}.`
    );
    return DEFAULT_SCHEDULER_TIMEZONE;
  }
};

const SCHEDULER_TIMEZONE = getSchedulerTimeZone();

const ZONED_DATE_TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: SCHEDULER_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  weekday: "long",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
  hourCycle: "h23",
});

const ZONED_OFFSET_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: SCHEDULER_TIMEZONE,
  timeZoneName: "shortOffset",
  hour: "2-digit",
  hour12: false,
});

const getPollIntervalMs = () => {
  const value = Number(process.env.REPORT_SCHEDULER_POLL_MS || 60_000);
  if (!Number.isFinite(value) || value < 15_000) {
    return 60_000;
  }
  return value;
};

const normalizeFrequency = (value) => String(value || "").trim().toLowerCase();

const normalizeTime = (value) => {
  const parsed = String(value || "").trim();
  if (/^([01]\d|2[0-3]):([0-5]\d)$/.test(parsed)) {
    return parsed;
  }
  return DEFAULT_SCHEDULE_TIME;
};

const normalizeWeekday = (value) => {
  const parsed = String(value || "").trim().toLowerCase();
  if (WEEKDAY_NAMES.includes(parsed)) {
    return parsed;
  }
  return DEFAULT_SCHEDULE_WEEKDAY;
};

const getZonedDateParts = (date) => {
  const rawParts = ZONED_DATE_TIME_FORMATTER.formatToParts(date);
  const parts = {};

  for (const part of rawParts) {
    if (part.type === "literal") {
      continue;
    }
    parts[part.type] = part.value;
  }

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: parts.hour,
    minute: parts.minute,
    second: parts.second,
    weekday: String(parts.weekday || "").toLowerCase(),
  };
};

const getTimeZoneOffsetMs = (date) => {
  const raw =
    ZONED_OFFSET_FORMATTER
      .formatToParts(date)
      .find((part) => part.type === "timeZoneName")?.value || "GMT";

  const normalized = raw.toUpperCase().replace("UTC", "GMT");

  if (normalized === "GMT") {
    return 0;
  }

  const match = normalized.match(/^GMT([+-])(\d{1,2})(?::?(\d{2}))?$/);
  if (!match) {
    return 0;
  }

  const sign = match[1] === "-" ? -1 : 1;
  const hours = Number(match[2] || 0);
  const minutes = Number(match[3] || 0);

  return sign * ((hours * 60 + minutes) * 60 * 1000);
};

const zonedDateTimeToUtc = ({ year, month, day, hour = 0, minute = 0, second = 0 }) => {
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, second, 0));

  // A second pass handles DST transition boundaries safely.
  const firstOffset = getTimeZoneOffsetMs(utcGuess);
  const firstCandidate = new Date(utcGuess.getTime() - firstOffset);
  const secondOffset = getTimeZoneOffsetMs(firstCandidate);

  if (firstOffset === secondOffset) {
    return firstCandidate;
  }

  return new Date(utcGuess.getTime() - secondOffset);
};

const shiftDatePartsByDays = ({ year, month, day }, deltaDays) => {
  const shifted = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  shifted.setUTCDate(shifted.getUTCDate() + deltaDays);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  };
};

const formatNowTime = (date) => {
  const parts = getZonedDateParts(date);
  return `${parts.hour}:${parts.minute}`;
};

const startOfDay = (date) => {
  const parts = getZonedDateParts(date);
  return zonedDateTimeToUtc({
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: 0,
    minute: 0,
    second: 0,
  });
};

const startOfWeek = (date) => {
  const parts = getZonedDateParts(date);
  const weekday = WEEKDAY_NAMES.includes(parts.weekday)
    ? parts.weekday
    : DEFAULT_SCHEDULE_WEEKDAY;
  const dayIndex = WEEKDAY_NAMES.indexOf(weekday);
  const mondayOffset = (dayIndex + 6) % 7;
  const mondayDate = shiftDatePartsByDays(parts, -mondayOffset);

  return zonedDateTimeToUtc({
    year: mondayDate.year,
    month: mondayDate.month,
    day: mondayDate.day,
    hour: 0,
    minute: 0,
    second: 0,
  });
};

const startOfMonth = (date) => {
  const parts = getZonedDateParts(date);
  return zonedDateTimeToUtc({
    year: parts.year,
    month: parts.month,
    day: 1,
    hour: 0,
    minute: 0,
    second: 0,
  });
};

const endOfWindow = (date) => {
  return new Date(date.getTime());
};

const round2 = (value) => {
  const asNumber = Number(value || 0);
  return Math.round((asNumber + Number.EPSILON) * 100) / 100;
};

const dateKey = (date) => {
  const parts = getZonedDateParts(date);
  const month = String(parts.month).padStart(2, "0");
  const day = String(parts.day).padStart(2, "0");
  return `${parts.year}-${month}-${day}`;
};

const monthKey = (date) => {
  const parts = getZonedDateParts(date);
  const month = String(parts.month).padStart(2, "0");
  return `${parts.year}-${month}`;
};

const getPeriodMeta = (frequency, now) => {
  if (frequency === "daily") {
    return {
      start: startOfDay(now),
      end: endOfWindow(now),
      key: `daily:${dateKey(now)}`,
      label: "Daily",
    };
  }

  if (frequency === "weekly") {
    const weekStart = startOfWeek(now);
    return {
      start: weekStart,
      end: endOfWindow(now),
      key: `weekly:${dateKey(weekStart)}`,
      label: "Weekly",
    };
  }

  const monthStart = startOfMonth(now);
  return {
    start: monthStart,
    end: endOfWindow(now),
    key: `monthly:${monthKey(now)}`,
    label: "Monthly",
  };
};

const getCacheKey = (userId, periodKey) => `${userId}:${periodKey}`;

const pruneCache = () => {
  if (sentPeriodCache.size <= 2000) {
    return;
  }

  const entries = [...sentPeriodCache.entries()];
  entries.sort((a, b) => b[1] - a[1]);
  const keep = entries.slice(0, 1200);
  sentPeriodCache.clear();
  for (const [key, value] of keep) {
    sentPeriodCache.set(key, value);
  }
};

const hasMailConfig = () => {
  const user = process.env.MAIL_USER;
  const pass = process.env.MAIL_PASS;
  if (!user || !pass) {
    return false;
  }

  if (user === "your_gmail@gmail.com" || pass === "your_app_password_here") {
    return false;
  }

  return true;
};

const evaluateScheduleReadiness = (user, now) => {
  if (!user.receiveScheduledReports) {
    return {
      dueNow: false,
      reason: "disabled",
      frequency: normalizeFrequency(user.reportFrequency),
      expectedTime: normalizeTime(user.reportScheduleTime),
      currentTime: formatNowTime(now),
      expectedWeekday: normalizeWeekday(user.reportScheduleWeekday),
      currentWeekday: getZonedDateParts(now).weekday,
    };
  }

  if (!user.email) {
    return {
      dueNow: false,
      reason: "missing_email",
      frequency: normalizeFrequency(user.reportFrequency),
      expectedTime: normalizeTime(user.reportScheduleTime),
      currentTime: formatNowTime(now),
      expectedWeekday: normalizeWeekday(user.reportScheduleWeekday),
      currentWeekday: getZonedDateParts(now).weekday,
    };
  }

  const frequency = normalizeFrequency(user.reportFrequency);
  const expectedTime = normalizeTime(user.reportScheduleTime);
  const currentTime = formatNowTime(now);
  const nowParts = getZonedDateParts(now);
  const currentWeekday = WEEKDAY_NAMES.includes(nowParts.weekday)
    ? nowParts.weekday
    : DEFAULT_SCHEDULE_WEEKDAY;
  const expectedWeekday = normalizeWeekday(user.reportScheduleWeekday);

  if (!VALID_FREQUENCIES.has(frequency)) {
    return {
      dueNow: false,
      reason: "invalid_frequency",
      frequency,
      expectedTime,
      currentTime,
      expectedWeekday,
      currentWeekday,
    };
  }

  if (currentTime !== expectedTime) {
    return {
      dueNow: false,
      reason: "time_mismatch",
      frequency,
      expectedTime,
      currentTime,
      expectedWeekday,
      currentWeekday,
    };
  }

  if (frequency === "weekly" && currentWeekday !== expectedWeekday) {
    return {
      dueNow: false,
      reason: "weekday_mismatch",
      frequency,
      expectedTime,
      currentTime,
      expectedWeekday,
      currentWeekday,
    };
  }

  if (frequency === "monthly" && nowParts.day !== 1) {
    return {
      dueNow: false,
      reason: "day_of_month_mismatch",
      frequency,
      expectedTime,
      currentTime,
      expectedWeekday,
      currentWeekday,
    };
  }

  return {
    dueNow: true,
    reason: null,
    frequency,
    expectedTime,
    currentTime,
    expectedWeekday,
    currentWeekday,
  };
};

const shouldRunNow = (user, now) => {
  return evaluateScheduleReadiness(user, now).dueNow;
};

const wasAlreadySentThisPeriod = async (userId, periodKey) => {
  const cacheKey = getCacheKey(userId, periodKey);
  if (sentPeriodCache.has(cacheKey)) {
    return true;
  }

  const existing = await prisma.auditLog.findFirst({
    where: {
      action: "AUTO_REPORT_EMAIL_SENT",
      created_by: userId,
      details: {
        contains: `\"periodKey\":\"${periodKey}\"`,
      },
    },
    select: { id: true },
  });

  if (existing) {
    sentPeriodCache.set(cacheKey, Date.now());
    return true;
  }

  return false;
};

const markSentThisPeriod = (userId, periodKey) => {
  const cacheKey = getCacheKey(userId, periodKey);
  sentPeriodCache.set(cacheKey, Date.now());
  pruneCache();
};

const getSummary = async (start, end) => {
  const [sales, expenses] = await Promise.all([
    prisma.sale.aggregate({
      where: {
        is_deleted: false,
        date: { gte: start, lte: end },
      },
      _sum: { total: true },
      _count: { _all: true },
    }),
    prisma.expense.aggregate({
      where: {
        is_deleted: false,
        date: { gte: start, lte: end },
      },
      _sum: { amount: true },
      _count: { _all: true },
    }),
  ]);

  const salesTotal = round2(sales?._sum?.total);
  const expenseTotal = round2(expenses?._sum?.amount);

  return {
    salesTotal,
    expenseTotal,
    profit: round2(salesTotal - expenseTotal),
    salesCount: Number(sales?._count?._all || 0),
    expenseCount: Number(expenses?._count?._all || 0),
  };
};

const sendReportToUser = async (user, now) => {
  const frequency = normalizeFrequency(user.reportFrequency);
  const period = getPeriodMeta(frequency, now);

  const alreadySent = await wasAlreadySentThisPeriod(user.id, period.key);
  if (alreadySent) {
    return;
  }

  const summary = await getSummary(period.start, period.end);

  await sendScheduledReportEmail({
    to: user.email,
    username: user.username,
    frequency,
    reportFormat: user.reportFormat || "pdf",
    scheduleTime: normalizeTime(user.reportScheduleTime),
    scheduleWeekday: normalizeWeekday(user.reportScheduleWeekday),
    periodStart: period.start,
    periodEnd: period.end,
    summary,
  });

  console.log(`[report-scheduler] Sent scheduled ${frequency} report email to ${user.email}`);

  const details = JSON.stringify({
    type: "scheduled_report_email",
    periodLabel: period.label,
    periodKey: period.key,
    summary,
    scheduleTime: normalizeTime(user.reportScheduleTime),
    scheduleWeekday: normalizeWeekday(user.reportScheduleWeekday),
    format: user.reportFormat || "pdf",
    recipient: user.email,
  });

  await auditService.logAction({
    user: {
      id: user.id,
      username: user.username,
      role: user.role || "STAFF",
    },
    action: "AUTO_REPORT_EMAIL_SENT",
    details,
  });

  markSentThisPeriod(user.id, period.key);
};

const runReportSchedulerTick = async (now = new Date()) => {
  if (tickInProgress) {
    return;
  }

  tickInProgress = true;

  try {
    if (!hasMailConfig()) {
      if (!mailConfigWarningShown) {
        console.warn("[report-scheduler] MAIL_USER/MAIL_PASS not configured. Scheduled report emails are disabled.");
        mailConfigWarningShown = true;
      }
      return;
    }

    mailConfigWarningShown = false;

    const users = await prisma.user.findMany({
      where: {
        receiveScheduledReports: true,
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        reportFrequency: true,
        reportFormat: true,
        reportScheduleTime: true,
        reportScheduleWeekday: true,
        receiveScheduledReports: true,
      },
    });

    for (const user of users) {
      if (!shouldRunNow(user, now)) {
        continue;
      }

      try {
        await sendReportToUser(user, now);
      } catch (error) {
        console.error(`[report-scheduler] Failed sending report to ${user.email}:`, error.message);

        await auditService.logAction({
          user: {
            id: user.id,
            username: user.username,
            role: user.role || "STAFF",
          },
          action: "AUTO_REPORT_EMAIL_FAILED",
          details: JSON.stringify({
            message: error.message,
            frequency: normalizeFrequency(user.reportFrequency),
            scheduleTime: normalizeTime(user.reportScheduleTime),
            scheduleWeekday: normalizeWeekday(user.reportScheduleWeekday),
            recipient: user.email,
          }),
        });
      }
    }
  } catch (error) {
    console.error("[report-scheduler] Tick failed:", error.message);
  } finally {
    tickInProgress = false;
  }
};

const parsePreviewLimit = (limit) => {
  const parsed = Number(limit || 25);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 25;
  }

  return Math.min(Math.trunc(parsed), 200);
};

const getReportSchedulerStatus = async ({ now = new Date(), previewLimit = 25 } = {}) => {
  const limit = parsePreviewLimit(previewLimit);
  const instanceConfig = getSchedulerInstanceConfig();

  const users = await prisma.user.findMany({
    where: {
      receiveScheduledReports: true,
    },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      reportFrequency: true,
      reportFormat: true,
      reportScheduleTime: true,
      reportScheduleWeekday: true,
      receiveScheduledReports: true,
    },
    orderBy: { username: "asc" },
  });

  const evaluatedUsers = users.map((user) => {
    const readiness = evaluateScheduleReadiness(user, now);
    return {
      user,
      ...readiness,
    };
  });

  const dueUsers = evaluatedUsers.filter((entry) => entry.dueNow);

  const dueUsersWithAuditState = [];
  for (const entry of dueUsers) {
    const period = getPeriodMeta(entry.frequency, now);
    const alreadySentThisPeriod = await wasAlreadySentThisPeriod(entry.user.id, period.key);

    dueUsersWithAuditState.push({
      ...entry,
      periodKey: period.key,
      periodLabel: period.label,
      alreadySentThisPeriod,
    });
  }

  const dueAlreadySentCount = dueUsersWithAuditState.filter(
    (entry) => entry.alreadySentThisPeriod
  ).length;
  const dueToSendCount = dueUsersWithAuditState.length - dueAlreadySentCount;

  return {
    now: now.toISOString(),
    timezone: SCHEDULER_TIMEZONE,
    pollIntervalMs: getPollIntervalMs(),
    schedulerEnabled:
      String(process.env.ENABLE_REPORT_SCHEDULER || "true").toLowerCase() !== "false",
    schedulerRunning: Boolean(schedulerInterval),
    tickInProgress,
    mailConfigured: hasMailConfig(),
    cacheSize: sentPeriodCache.size,
    instance: instanceConfig,
    users: {
      receiveScheduledReportsEnabled: users.length,
      dueNowCount: dueUsers.length,
      dueAlreadySentCount,
      dueToSendCount,
      notDueCount: evaluatedUsers.length - dueUsers.length,
    },
    duePreview: dueUsersWithAuditState.slice(0, limit).map((entry) => ({
      id: entry.user.id,
      username: entry.user.username,
      email: entry.user.email,
      role: entry.user.role || "STAFF",
      frequency: entry.frequency,
      reportFormat: entry.user.reportFormat || "pdf",
      scheduleTime: entry.expectedTime,
      scheduleWeekday: entry.expectedWeekday,
      periodKey: entry.periodKey,
      periodLabel: entry.periodLabel,
      alreadySentThisPeriod: entry.alreadySentThisPeriod,
    })),
    notDuePreview: evaluatedUsers
      .filter((entry) => !entry.dueNow)
      .slice(0, limit)
      .map((entry) => ({
        id: entry.user.id,
        username: entry.user.username,
        email: entry.user.email,
        role: entry.user.role || "STAFF",
        frequency: entry.frequency,
        reportFormat: entry.user.reportFormat || "pdf",
        scheduleTime: entry.expectedTime,
        currentTime: entry.currentTime,
        scheduleWeekday: entry.expectedWeekday,
        currentWeekday: entry.currentWeekday,
        reason: entry.reason,
      })),
  };
};

const startReportScheduler = () => {
  const schedulerEnabled = String(process.env.ENABLE_REPORT_SCHEDULER || "true").toLowerCase() !== "false";
  if (!schedulerEnabled) {
    console.log("[report-scheduler] Disabled by ENABLE_REPORT_SCHEDULER=false");
    return;
  }

  const instanceConfig = getSchedulerInstanceConfig();
  if (!instanceConfig.isActiveInstance) {
    console.log(
      `[report-scheduler] Skipped on instance ${instanceConfig.currentInstanceId}. Active scheduler instance: ${instanceConfig.schedulerInstanceId}`
    );
    return;
  }

  if (schedulerInterval) {
    return;
  }

  const intervalMs = getPollIntervalMs();
  schedulerInterval = setInterval(() => {
    runReportSchedulerTick().catch(() => undefined);
  }, intervalMs);

  if (typeof schedulerInterval.unref === "function") {
    schedulerInterval.unref();
  }

  console.log(
    `[report-scheduler] Started (poll: ${intervalMs}ms, timezone: ${SCHEDULER_TIMEZONE})`
  );
};

const stopReportScheduler = () => {
  if (!schedulerInterval) {
    return;
  }

  clearInterval(schedulerInterval);
  schedulerInterval = null;
  console.log("[report-scheduler] Stopped");
};

module.exports = {
  startReportScheduler,
  stopReportScheduler,
  runReportSchedulerTick,
  getReportSchedulerStatus,
};
