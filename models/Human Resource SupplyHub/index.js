
import { DataTypes } from "sequelize";
import { sequelize } from "../db.js";

// ============================================
// DEPARTMENT MODEL
// ============================================

export const Department = sequelize.define("Department", {
  id: {
  type: DataTypes.INTEGER.UNSIGNED,
  autoIncrement: true,
  primaryKey: true
},
  departmentName: {
    type: DataTypes.STRING(120),
    allowNull: false,
    unique: true
  },

  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },

  status: {
    type: DataTypes.ENUM("active", "inactive"),
    allowNull: false,
    defaultValue: "active"
  }
}, {
  tableName: "departments",
  timestamps: true
});

// ============================================
// EMPLOYEE MODEL
// ============================================

export const Employee = sequelize.define("Employee", {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  employeeCode: {
    type: DataTypes.STRING(30),
    allowNull: false,
    unique: true
  },

  firstName: {
    type: DataTypes.STRING(100),
    allowNull: false
  },

  middleName: {
    type: DataTypes.STRING(100),
    allowNull: true
  },

  lastName: {
    type: DataTypes.STRING(100),
    allowNull: false
  },

  email: {
    type: DataTypes.STRING(191),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },

  phone: {
    type: DataTypes.STRING(30),
    allowNull: true
  },

  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },

  position: {
    type: DataTypes.STRING(100),
    allowNull: false
  },

  hireDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },

  salary: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },

  employmentStatus: {
    type: DataTypes.ENUM(
      "active",
      "inactive",
      "resigned",
      "terminated"
    ),
    allowNull: false,
    defaultValue: "active"
  },

  departmentId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  }
}, {
  tableName: "employees",
  timestamps: true
});

// ============================================
// MODEL ASSOCIATIONS
// ============================================

Department.hasMany(Employee, {
  foreignKey: "departmentId",
  as: "employees"
});

Employee.belongsTo(Department, {
  foreignKey: "departmentId",
  as: "department"
});

// ============================================
// ATTENDANCE MODEL
// ============================================

export const Attendance = sequelize.define("Attendance", {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },

  attendanceDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },

  timeIn: {
    type: DataTypes.TIME,
    allowNull: true
  },

  timeOut: {
    type: DataTypes.TIME,
    allowNull: true
  },

  status: {
    type: DataTypes.ENUM("present", "late", "absent"),
    allowNull: false,
    defaultValue: "present"
  },

  employeeId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: {
      model: "employees",
      key: "id"
    }
  }
}, {
  tableName: "attendances",
  timestamps: true
});

// ============================================
// ATTENDANCE ASSOCIATIONS
// ============================================

Employee.hasMany(Attendance, {
  foreignKey: "employeeId",
  as: "attendances"
});

Attendance.belongsTo(Employee, {
  foreignKey: "employeeId",
  as: "employee"
});
// ============================================
// LEAVE REQUEST MODEL
// ============================================

export const LeaveRequest = sequelize.define("LeaveRequest", {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },

  leaveType: {
    type: DataTypes.ENUM(
      "vacation",
      "sick",
      "emergency",
      "personal"
    ),
    allowNull: false
  },

  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },

  endDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },

  reason: {
    type: DataTypes.TEXT,
    allowNull: false
  },

  status: {
    type: DataTypes.ENUM(
      "pending",
      "approved",
      "rejected"
    ),
    allowNull: false,
    defaultValue: "pending"
  },

  employeeId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: {
      model: "employees",
      key: "id"
    }
  }

}, {
  tableName: "leave_requests",
  timestamps: true
});

// ============================================
// LEAVE REQUEST ASSOCIATIONS
// ============================================

Employee.hasMany(LeaveRequest, {
  foreignKey: "employeeId",
  as: "leaveRequests"
});

LeaveRequest.belongsTo(Employee, {
  foreignKey: "employeeId",
  as: "employee"
});

// ============================================
// WORK SCHEDULE MODEL
// ============================================

export const WorkSchedule = sequelize.define("WorkSchedule", {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },

  scheduleName: {
    type: DataTypes.STRING(100),
    allowNull: true
  },

  dayOfWeek: {
    type: DataTypes.ENUM(
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday"
    ),
    allowNull: false
  },

  startTime: {
    type: DataTypes.TIME,
    allowNull: false
  },

  endTime: {
    type: DataTypes.TIME,
    allowNull: false
  },

  breakStart: {
    type: DataTypes.TIME,
    allowNull: true
  },

  breakEnd: {
    type: DataTypes.TIME,
    allowNull: true
  },

  status: {
    type: DataTypes.ENUM("active", "inactive"),
    allowNull: false,
    defaultValue: "active"
  },

  employeeId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: {
      model: "employees",
      key: "id"
    }
  }

}, {
  tableName: "work_schedules",
  timestamps: true
});

// ============================================
// WORK SCHEDULE ASSOCIATIONS
// ============================================

Employee.hasMany(WorkSchedule, {
  foreignKey: "employeeId",
  as: "workSchedules"
});

WorkSchedule.belongsTo(Employee, {
  foreignKey: "employeeId",
  as: "employee"
});

// ============================================
// SHIFT TEMPLATE MODEL
// ============================================

export const ShiftTemplate = sequelize.define("ShiftTemplate", {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },

  templateName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },

  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },

  startTime: {
    type: DataTypes.TIME,
    allowNull: false
  },

  endTime: {
    type: DataTypes.TIME,
    allowNull: false
  },

  breakStart: {
    type: DataTypes.TIME,
    allowNull: true
  },

  breakEnd: {
    type: DataTypes.TIME,
    allowNull: true
  },

  status: {
    type: DataTypes.ENUM("active", "inactive"),
    allowNull: false,
    defaultValue: "active"
  }

}, {
  tableName: "shift_templates",
  timestamps: true
});

// ============================================
// SALARY HISTORY MODEL
// ============================================

export const SalaryHistory = sequelize.define("SalaryHistory", {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },

  previousSalary: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },

  newSalary: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },

  effectiveDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },

  reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },

  updatedBy: {
    type: DataTypes.STRING(150),
    allowNull: true
  },

  employeeId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: {
      model: "employees",
      key: "id"
    }
  }
}, {
  tableName: "salary_histories",
  timestamps: true
});

// ============================================
// EMPLOYMENT STATUS HISTORY MODEL
// ============================================

export const EmploymentStatusHistory = sequelize.define(
  "EmploymentStatusHistory",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },

    previousStatus: {
      type: DataTypes.ENUM(
        "active",
        "inactive",
        "resigned",
        "terminated"
      ),
      allowNull: true
    },

    newStatus: {
      type: DataTypes.ENUM(
        "active",
        "inactive",
        "resigned",
        "terminated"
      ),
      allowNull: false
    },

    effectiveDate: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },

    reason: {
      type: DataTypes.TEXT,
      allowNull: true
    },

    updatedBy: {
      type: DataTypes.STRING(150),
      allowNull: true
    },

    employeeId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: "employees",
        key: "id"
      }
    }
  },
  {
    tableName: "employment_status_histories",
    timestamps: true
  }
);

// ============================================
// HISTORY MODEL ASSOCIATIONS
// ============================================

Employee.hasMany(SalaryHistory, {
  foreignKey: "employeeId",
  as: "salaryHistories"
});

SalaryHistory.belongsTo(Employee, {
  foreignKey: "employeeId",
  as: "employee"
});

Employee.hasMany(EmploymentStatusHistory, {
  foreignKey: "employeeId",
  as: "employmentStatusHistories"
});

EmploymentStatusHistory.belongsTo(Employee, {
  foreignKey: "employeeId",
  as: "employee"
});
