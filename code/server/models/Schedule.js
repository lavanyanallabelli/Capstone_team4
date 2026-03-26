const { Sequelize, DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Schedule = sequelize.define(
  "Schedule",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    employeeId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "employees",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    ownerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "owners",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    weekStartDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: "Monday of the week (YYYY-MM-DD)",
    },
    schedule: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
      comment:
        'Schedule data for the week: { "monday": { "start": "09:00", "end": "17:00" }, ... }',
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Additional notes about the schedule",
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    lastSentAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Timestamp when schedule was last emailed to employee",
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "schedules",
    timestamps: true,
    indexes: [
      {
        fields: ["employeeId"],
      },
      {
        fields: ["ownerId"],
      },
      {
        fields: ["weekStartDate"],
      },
      {
        unique: true,
        fields: ["employeeId", "weekStartDate"],
        name: "unique_employee_week",
      },
    ],
  }
);

module.exports = Schedule;
