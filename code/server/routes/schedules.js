const express = require("express");
const Joi = require("joi");
const { Schedule, Employee, Owner } = require("../models");
const { sendScheduleEmail } = require("../services/emailService");

// Helper to get ownerId from request
const getOwnerId = (req) => {
  if (req.user?.ownerId) {
    return req.user.ownerId;
  }
  console.warn("⚠️ ownerId not set - cognitoSync middleware may have failed");
  return null;
};

const router = express.Router();

// Helper to normalize to DATEONLY (yyyy-mm-dd) without shifting to Monday
const toDateOnly = (date) => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().split("T")[0];
};

// Validation schema for schedule
const scheduleSchema = Joi.object({
  employeeId: Joi.string().uuid().required(),
  weekStartDate: Joi.date().required(),
  schedule: Joi.object()
    .pattern(
      Joi.string(),
      Joi.object({
        start: Joi.string()
          .pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
          .optional()
          .allow(null),
        end: Joi.string()
          .pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
          .optional()
          .allow(null),
        isWorking: Joi.boolean().default(false),
      }).optional()
    )
    .required(),
  notes: Joi.string().optional().allow("", null),
  sendEmail: Joi.boolean().default(true),
});

// Get all schedules for owner's employees
router.get("/", async (req, res) => {
  try {
    const ownerId = getOwnerId(req);
    if (!ownerId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
        message: "Owner ID is required",
      });
    }

    const { employeeId, weekStartDate } = req.query;
    const where = { ownerId };

    if (employeeId) {
      where.employeeId = employeeId;
    }

    if (weekStartDate) {
      const dateOnly = toDateOnly(weekStartDate);
      if (dateOnly) where.weekStartDate = dateOnly;
    }

    const schedules = await Schedule.findAll({
      where,
      include: [
        {
          model: Employee,
          as: "employee",
          attributes: ["id", "firstName", "lastName", "email", "employeeId"],
        },
      ],
      order: [
        ["weekStartDate", "DESC"],
        ["createdAt", "DESC"],
      ],
    });

    res.json({
      success: true,
      data: schedules,
      count: schedules.length,
    });
  } catch (error) {
    console.error("Error fetching schedules:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch schedules",
      message: error.message,
    });
  }
});

// Get schedule by ID
router.get("/:scheduleId", async (req, res) => {
  try {
    const ownerId = getOwnerId(req);
    if (!ownerId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
        message: "Owner ID is required",
      });
    }

    const { scheduleId } = req.params;

    const schedule = await Schedule.findOne({
      where: {
        id: scheduleId,
        ownerId: ownerId,
      },
      include: [
        {
          model: Employee,
          as: "employee",
          attributes: ["id", "firstName", "lastName", "email", "employeeId"],
        },
      ],
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        error: "Schedule not found",
      });
    }

    res.json({
      success: true,
      data: schedule,
    });
  } catch (error) {
    console.error("Error fetching schedule:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch schedule",
      message: error.message,
    });
  }
});

// Create or update schedule
router.post("/", async (req, res) => {
  try {
    const ownerId = getOwnerId(req);
    if (!ownerId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
        message: "Owner ID is required",
      });
    }

    // Validate input
    const { error, value } = scheduleSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: "Validation error",
        details: error.details,
      });
    }

    // Ensure employee belongs to owner
    const employee = await Employee.findOne({
      where: {
        id: value.employeeId,
        ownerId: ownerId,
      },
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        error: "Employee not found",
        message:
          "Employee does not exist or you do not have permission to manage their schedule",
      });
    }

    // Use provided week start as-is (DATEONLY)
    const weekStartDateStr = toDateOnly(value.weekStartDate);

    // Check if schedule already exists
    let schedule = await Schedule.findOne({
      where: {
        employeeId: value.employeeId,
        weekStartDate: weekStartDateStr,
        ownerId: ownerId,
      },
    });

    const isUpdate = !!schedule;

    if (schedule) {
      // Update existing schedule
      await schedule.update({
        schedule: value.schedule,
        notes: value.notes || null,
        isActive: true,
      });
      await schedule.reload();
    } else {
      // Create new schedule
      schedule = await Schedule.create({
        employeeId: value.employeeId,
        ownerId: ownerId,
        weekStartDate: weekStartDateStr,
        schedule: value.schedule,
        notes: value.notes || null,
        isActive: true,
      });
    }

    // Send email if requested
    let emailSent = false;
    if (value.sendEmail !== false) {
      try {
        // Get owner info for email
        const owner = await Owner.findByPk(ownerId);
        const businessName = owner?.businessName || "Your Restaurant";

        const sent = await sendScheduleEmail(
          employee.email,
          `${employee.firstName} ${employee.lastName}`,
          schedule.schedule,
          weekStartDateStr,
          businessName,
          isUpdate,
          value.notes || null
        );
        emailSent = !!sent;

        // Update lastSentAt
        await schedule.update({ lastSentAt: new Date() });
        await schedule.reload();
      } catch (emailError) {
        console.error("Error sending schedule email:", emailError);
        // Don't fail the request if email fails
      }
    }

    // Reload with employee data
    await schedule.reload({
      include: [
        {
          model: Employee,
          as: "employee",
          attributes: ["id", "firstName", "lastName", "email", "employeeId"],
        },
      ],
    });

    res.json({
      success: true,
      data: schedule,
      message: isUpdate
        ? "Schedule updated successfully"
        : "Schedule created successfully",
      emailSent,
    });
  } catch (error) {
    console.error("Error creating/updating schedule:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create/update schedule",
      message: error.message,
    });
  }
});

// Update schedule
router.put("/:scheduleId", async (req, res) => {
  try {
    const ownerId = getOwnerId(req);
    if (!ownerId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
        message: "Owner ID is required",
      });
    }

    const { scheduleId } = req.params;

    // Validate input (same schema but employeeId optional for updates)
    const updateSchema = scheduleSchema.fork(["employeeId"], (schema) =>
      schema.optional()
    );
    const { error, value } = updateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: "Validation error",
        details: error.details,
      });
    }

    const schedule = await Schedule.findOne({
      where: {
        id: scheduleId,
        ownerId: ownerId,
      },
      include: [
        {
          model: Employee,
          as: "employee",
          attributes: ["id", "firstName", "lastName", "email", "employeeId"],
        },
      ],
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        error: "Schedule not found",
      });
    }

    // Update schedule
    const updateData = {};
    if (value.schedule !== undefined) updateData.schedule = value.schedule;
    if (value.notes !== undefined) updateData.notes = value.notes || null;
    if (value.weekStartDate !== undefined) {
      const dateOnly = toDateOnly(value.weekStartDate);
      if (dateOnly) updateData.weekStartDate = dateOnly;
    }

    await schedule.update(updateData);
    await schedule.reload();

    // Send email if requested
    let emailSent = false;
    if (value.sendEmail !== false) {
      try {
        const owner = await Owner.findByPk(ownerId);
        const businessName = owner?.businessName || "Your Restaurant";

        const sent = await sendScheduleEmail(
          schedule.employee.email,
          `${schedule.employee.firstName} ${schedule.employee.lastName}`,
          schedule.schedule,
          schedule.weekStartDate,
          businessName,
          true, // This is an update
          schedule.notes || null
        );
        emailSent = !!sent;
        await schedule.update({ lastSentAt: new Date() });
        await schedule.reload();
      } catch (emailError) {
        console.error("Error sending schedule email:", emailError);
      }
    }

    res.json({
      success: true,
      data: schedule,
      message: "Schedule updated successfully",
      emailSent,
    });
  } catch (error) {
    console.error("Error updating schedule:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update schedule",
      message: error.message,
    });
  }
});

// Send schedule email manually
router.post("/:scheduleId/send-email", async (req, res) => {
  try {
    const ownerId = getOwnerId(req);
    if (!ownerId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
        message: "Owner ID is required",
      });
    }

    const { scheduleId } = req.params;

    const schedule = await Schedule.findOne({
      where: {
        id: scheduleId,
        ownerId: ownerId,
      },
      include: [
        {
          model: Employee,
          as: "employee",
          attributes: ["id", "firstName", "lastName", "email", "employeeId"],
        },
      ],
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        error: "Schedule not found",
      });
    }

    // Check if employee exists and has email
    if (!schedule.employee) {
      return res.status(404).json({
        success: false,
        error: "Employee not found",
        message: "The employee associated with this schedule was not found",
      });
    }

    if (!schedule.employee.email) {
      return res.status(400).json({
        success: false,
        error: "Employee email missing",
        message: "The employee does not have an email address configured",
      });
    }

    const owner = await Owner.findByPk(ownerId);
    const businessName = owner?.businessName || "Your Restaurant";

    console.log('📧 Sending schedule email:', {
      to: schedule.employee.email,
      employeeName: `${schedule.employee.firstName} ${schedule.employee.lastName}`,
      weekStartDate: schedule.weekStartDate,
      businessName: businessName
    });

    try {
      await sendScheduleEmail(
        schedule.employee.email,
        `${schedule.employee.firstName} ${schedule.employee.lastName}`,
        schedule.schedule,
        schedule.weekStartDate,
        businessName,
        true, // Assume update if manually sending
        schedule.notes || null
      );

      await schedule.update({ lastSentAt: new Date() });
      await schedule.reload();

      console.log('✅ Schedule email sent successfully to:', schedule.employee.email);

      res.json({
        success: true,
        message: "Schedule email sent successfully",
      });
    } catch (emailError) {
      console.error('❌ Email sending failed:', emailError.message);
      // Update lastSentAt even if email fails (for tracking)
      // But don't mark as success
      res.status(500).json({
        success: false,
        error: "Failed to send schedule email",
        message: emailError.message || "Email service configuration error. Please check SMTP settings.",
      });
    }
  } catch (error) {
    console.error("Error sending schedule email:", error);
    res.status(500).json({
      success: false,
      error: "Failed to send schedule email",
      message: error.message,
    });
  }
});

// Delete schedule
router.delete("/:scheduleId", async (req, res) => {
  try {
    const ownerId = getOwnerId(req);
    if (!ownerId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
        message: "Owner ID is required",
      });
    }

    const { scheduleId } = req.params;

    const schedule = await Schedule.findOne({
      where: {
        id: scheduleId,
        ownerId: ownerId,
      },
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        error: "Schedule not found",
      });
    }

    await schedule.destroy();

    res.json({
      success: true,
      message: "Schedule deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting schedule:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete schedule",
      message: error.message,
    });
  }
});

module.exports = router;
