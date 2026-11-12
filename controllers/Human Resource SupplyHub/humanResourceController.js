
import {
  Employee,
  Department,
  Attendance,
  LeaveRequest,
  WorkSchedule,
  ShiftTemplate,
  SalaryHistory,
  EmploymentStatusHistory
} from "../../models/Human Resource SupplyHub/index.js";
import { sequelize } from "../../models/db.js";
import { Op } from "sequelize";

// ============================================
// EMPLOYEE VALIDATION HELPER
// ============================================

const validateEmployeeInput = async (body, employeeId = null) => {
  const errors = [];

  const employeeCode = String(body.employeeCode || "").trim();
  const firstName = String(body.firstName || "").trim();
  const middleName = String(body.middleName || "").trim();
  const lastName = String(body.lastName || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const phone = String(body.phone || "").trim();
  const address = String(body.address || "").trim();
  const position = String(body.position || "").trim();
  const hireDate = String(body.hireDate || "").trim();
  const salaryInput = String(body.salary ?? "").trim();
  const employmentStatus = String(
    body.employmentStatus || "active"
  ).trim();

  const departmentId = Number(body.departmentId);

  // Required fields
  if (!employeeCode) errors.push("Employee Code is required.");
  if (!firstName) errors.push("First Name is required.");
  if (!lastName) errors.push("Last Name is required.");
  if (!email) errors.push("Email is required.");
  if (!position) errors.push("Position is required.");
  if (!hireDate) errors.push("Hire Date is required.");
  if (!body.departmentId) errors.push("Department is required.");

  // Field lengths
  if (employeeCode.length > 30) {
    errors.push("Employee Code must not exceed 30 characters.");
  }

  if (firstName.length > 100 || lastName.length > 100) {
    errors.push("First Name and Last Name must not exceed 100 characters.");
  }

  if (middleName.length > 100) {
    errors.push("Middle Name must not exceed 100 characters.");
  }

  if (email.length > 191) {
    errors.push("Email must not exceed 191 characters.");
  }

  if (position.length > 100) {
    errors.push("Position must not exceed 100 characters.");
  }

  if (phone.length > 30) {
    errors.push("Phone must not exceed 30 characters.");
  }

  // Email validation
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (email && !emailPattern.test(email)) {
    errors.push("Please enter a valid email address.");
  }

  // Hire date validation
  if (hireDate) {
    const validDatePattern = /^\d{4}-\d{2}-\d{2}$/;
    const parsedDate = new Date(`${hireDate}T00:00:00Z`);

    if (
      !validDatePattern.test(hireDate) ||
      Number.isNaN(parsedDate.getTime()) ||
      parsedDate.toISOString().slice(0, 10) !== hireDate
    ) {
      errors.push("Please enter a valid Hire Date.");
    }
  }

  // Salary validation
  let salary = null;

  if (salaryInput !== "") {
    salary = Number(salaryInput);

    if (
      !Number.isFinite(salary) ||
      salary < 0 ||
      salary > 99999999.99 ||
      !/^\d+(\.\d{1,2})?$/.test(salaryInput)
    ) {
      errors.push("Salary must be a valid non-negative amount with up to 2 decimal places.");
    }
  }

  // Employment status validation
  const allowedStatuses = [
    "active",
    "inactive",
    "resigned",
    "terminated"
  ];

  if (!allowedStatuses.includes(employmentStatus)) {
    errors.push("Invalid employment status.");
  }

  // Department validation
  if (
    body.departmentId &&
    (!Number.isInteger(departmentId) || departmentId <= 0)
  ) {
    errors.push("Please select a valid department.");
  } else if (body.departmentId) {
    const department = await Department.findByPk(departmentId);

    if (!department) {
      errors.push("Selected department does not exist.");
    }
  }

  // Duplicate employee code
  if (employeeCode) {
    const existingCode = await Employee.findOne({
      where: {
        employeeCode,
        ...(employeeId
          ? { id: { [Op.ne]: employeeId } }
          : {})
      }
    });

    if (existingCode) {
      errors.push("Employee Code already exists.");
    }
  }

  // Duplicate email
  if (email) {
    const existingEmail = await Employee.findOne({
      where: {
        email,
        ...(employeeId
          ? { id: { [Op.ne]: employeeId } }
          : {})
      }
    });

    if (existingEmail) {
      errors.push("Email already exists.");
    }
  }

  return {
    errors,
    values: {
      employeeCode,
      firstName,
      middleName: middleName || null,
      lastName,
      email,
      phone: phone || null,
      address: address || null,
      position,
      hireDate,
      salary,
      employmentStatus,
      departmentId
    }
  };
};
// ============================================
// HR DASHBOARD
// ============================================

export const dashboard = async (req, res, next) => {
  try {
    const [
      employeeCount,
      activeEmployeeCount,
      departmentCount,
      recentEmployees
    ] = await Promise.all([
      Employee.count(),
      Employee.count({
        where: { employmentStatus: "active" }
      }),
      Department.count(),
      Employee.findAll({
        include: [{
          model: Department,
          as: "department",
          attributes: ["departmentName"],
          required: false
        }],
        order: [["createdAt", "DESC"]],
        limit: 5
      })
    ]);

    res.render("Human Resource SupplyHub/dashboard", {
      title: "Human Resource SupplyHub",
      moduleName: "Human Resource SupplyHub",
      moduleDescription: "Employee records, attendance, and work schedules.",
      employeeCount,
      activeEmployeeCount,
      departmentCount,
      recentEmployees: recentEmployees.map(employee =>
        employee.get({ plain: true })
      )
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// VIEW ALL EMPLOYEES
// ============================================

export const employees = async (req, res, next) => {
  try {
    const employeeList = await Employee.findAll({
      include: [{
        model: Department,
        as: "department",
        attributes: ["departmentName"],
        required: false
      }],
      order: [["createdAt", "DESC"]]
    });

    res.render("Human Resource SupplyHub/employees", {
      title: "Employee Management",
      moduleName: "Employee Management",
      moduleDescription: "Manage employee information and records.",
      employees: employeeList.map(employee =>
        employee.get({ plain: true })
      )
    });
  } catch (error) {
    next(error);
  }
};
// ============================================
// VIEW EMPLOYEE PROFILE
// ============================================


export const showEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findByPk(req.params.id, {
      include: [{
        model: Department,
        as: "department",
        attributes: ["departmentName"],
        required: false
      }]
    });

    if (!employee) {
      return res.status(404).send("Employee not found.");
    }

    // Retrieve salary history
    const salaryHistories = await SalaryHistory.findAll({
      where: {
        employeeId: employee.id
      },
      order: [["effectiveDate", "DESC"]]
    });

    // Retrieve employment status history
    const employmentStatusHistories =
      await EmploymentStatusHistory.findAll({
        where: {
          employeeId: employee.id
        },
        order: [["effectiveDate", "DESC"]]
      });

    return res.render("Human Resource SupplyHub/employeeProfile", {
      title: "Employee Profile",
      moduleName: "Employee Management",
      moduleDescription: "Complete employee information.",

      employee: employee.get({ plain: true }),

      salaryHistories: salaryHistories.map(item =>
        item.get({ plain: true })
      ),

      employmentStatusHistories: employmentStatusHistories.map(item =>
        item.get({ plain: true })
      )
    });

  } catch (error) {
    next(error);
  }
};

// ============================================
// SHOW ADD EMPLOYEE FORM
// ============================================

export const addEmployee = async (req, res, next) => {
  try {
    const departments = await Department.findAll({
      where: { status: "active" },
      order: [["departmentName", "ASC"]]
    });

    res.render("Human Resource SupplyHub/addEmployee", {
      title: "Add Employee",
      moduleName: "Employee Management",
      moduleDescription: "Register a new employee.",
      departments: departments.map(department =>
        department.get({ plain: true })
      )
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// SAVE NEW EMPLOYEE
// ============================================

export const storeEmployee = async (req, res, next) => {
  try {
    const { errors, values } = await validateEmployeeInput(req.body);

    if (errors.length > 0) {
      return res.status(400).send(
        "Employee Validation Failed:\n\n" + errors.join("\n")
      );
    }

    // Create a new employee
    await Employee.create(values);

    return res.redirect("/human-resource/employees");

  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).send(
        "Employee Code or Email already exists."
      );
    }
  }
};

// ============================================
// EDIT EMPLOYEE
// ============================================

export const editEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findByPk(req.params.id);

    if (!employee) {
      return res.status(404).send("Employee not found.");
    }

    const departments = await Department.findAll({
      order: [["departmentName", "ASC"]]
    });

    const employeeData = employee.get({ plain: true });

    // Identify the current department
    const departmentList = departments.map(department => {
      const item = department.get({ plain: true });

      return {
        ...item,
        selected: Number(item.id) === Number(employeeData.departmentId)
      };
    });

    // Identify the current employment status
    employeeData.statusActive =
      employeeData.employmentStatus === "active";

    employeeData.statusInactive =
      employeeData.employmentStatus === "inactive";

    employeeData.statusResigned =
      employeeData.employmentStatus === "resigned";

    employeeData.statusTerminated =
      employeeData.employmentStatus === "terminated";

    return res.render("Human Resource SupplyHub/editEmployee", {
      title: "Edit Employee",
      moduleName: "Employee Management",
      moduleDescription: "Update employee information.",
      employee: employeeData,
      departments: departmentList
    });

  } catch (error) {
    next(error);
  }
};


// ============================================
// SHOW EDIT EMPLOYEE FORM
// ============================================


// ============================================
// UPDATE EMPLOYEE
// ============================================


export const updateEmployee = async (req, res, next) => {
  let transaction;

  try {
    transaction = await sequelize.transaction();

    const employee = await Employee.findByPk(req.params.id, {
      transaction
    });

    if (!employee) {
      await transaction.rollback();
      return res.status(404).send("Employee not found.");
    }

    // Validate submitted employee information
    const { errors, values } = await validateEmployeeInput(
      req.body,
      employee.id
    );

    if (errors.length > 0) {
      await transaction.rollback();

      return res.status(400).send(
        "Employee Validation Failed:\n\n" + errors.join("\n")
      );
    }

    // Compare previous and new salary
    const oldSalary =
      employee.salary == null ? null : Number(employee.salary);

    const newSalary =
      values.salary == null || values.salary === ""
        ? null
        : Number(values.salary);

    const salaryChanged = oldSalary !== newSalary;

    // Compare previous and new employment status
    const oldStatus = employee.employmentStatus;
    const newStatus = values.employmentStatus;

    const statusChanged = oldStatus !== newStatus;

    // Validate date format when a history record is needed
    const isValidDateOnly = (value) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) {
        return false;
      }

      const date = new Date(`${value}T00:00:00Z`);

      return (
        !Number.isNaN(date.getTime()) &&
        date.toISOString().slice(0, 10) === value
      );
    };

    if (
      salaryChanged &&
      !isValidDateOnly(req.body.salaryEffectiveDate)
    ) {
      await transaction.rollback();

      return res.status(400).send(
        "Please provide a valid Salary Effective Date."
      );
    }

    if (
      statusChanged &&
      !isValidDateOnly(req.body.statusEffectiveDate)
    ) {
      await transaction.rollback();

      return res.status(400).send(
        "Please provide a valid Status Effective Date."
      );
    }

    // Identify the logged-in user
    const updatedBy =
      req.currentUser?.name ||
      req.currentUser?.email ||
      null;

    // Update employee information
    await employee.update(values, { transaction });

    // Save salary history only when salary changes
    if (salaryChanged) {
      await SalaryHistory.create(
        {
          previousSalary: oldSalary,
          newSalary: newSalary,
          effectiveDate: req.body.salaryEffectiveDate,
          reason: String(req.body.salaryReason || "").trim() || null,
          updatedBy,
          employeeId: employee.id
        },
        { transaction }
      );
    }

    // Save employment status history only when status changes
    if (statusChanged) {
      await EmploymentStatusHistory.create(
        {
          previousStatus: oldStatus,
          newStatus: newStatus,
          effectiveDate: req.body.statusEffectiveDate,
          reason: String(req.body.statusReason || "").trim() || null,
          updatedBy,
          employeeId: employee.id
        },
        { transaction }
      );
    }

    // Commit all changes
    await transaction.commit();

    return res.redirect("/human-resource/employees");

  } catch (error) {
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }

    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).send(
        "Employee Code or Email already exists."
      );
    }

    if (error.name === "SequelizeValidationError") {
      return res.status(400).send(
        "Invalid employee information: " +
        error.errors.map(item => item.message).join(", ")
      );
    }

    next(error);
  }
};

// ============================================
// DELETE EMPLOYEE
// ============================================

export const deleteEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findByPk(req.params.id);

    if (!employee) {
      return res.status(404).send("Employee not found.");
    }

    await employee.destroy();

    return res.redirect("/human-resource/employees");
  } catch (error) {
    next(error);
  }
};

// ============================================
// OTHER HR MODULE PAGES
// ============================================


// ============================================
// DEPARTMENT MANAGEMENT
// ============================================

// VIEW ALL DEPARTMENTS
export const departments = async (req, res, next) => {
  try {
    const departmentList = await Department.findAll({
      order: [["departmentName", "ASC"]]
    });

    res.render("Human Resource SupplyHub/departments", {
      title: "Department Management",
      moduleName: "Department Management",
      moduleDescription: "Manage company departments and assignments.",
      departments: departmentList.map(department =>
        department.get({ plain: true })
      )
    });
  } catch (error) {
    next(error);
  }
};

// SHOW ADD DEPARTMENT FORM
export const addDepartment = (req, res) => {
  res.render("Human Resource SupplyHub/addDepartment", {
    title: "Add Department",
    moduleName: "Department Management",
    moduleDescription: "Create a new department."
  });
};

    // STORE DEPARTMENT
export const storeDepartment = async (req, res, next) => {
  try {
    const { departmentName, description, status } = req.body;

    // Check if department name is empty
    if (!departmentName || !departmentName.trim()) {
      return res.status(400).send("Department name is required.");
    }

    const cleanName = departmentName.trim();

    // Check if department already exists
    const existingDepartment = await Department.findOne({
      where: { departmentName: cleanName }
    });

    if (existingDepartment) {
      return res.status(409).send(
        "This department name already exists."
      );
    }

    // Create department
    await Department.create({
      departmentName: cleanName,
      description: description?.trim() || null,
      status: status || "active"
    });

    console.log("Department successfully saved:", cleanName);

    return res.redirect("/human-resource/departments");

  } catch (error) {
    console.error("========== DEPARTMENT SAVE ERROR ==========");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error fields:", error.fields);
    console.error("Original error:", error.original);
    console.error("Validation errors:", error.errors);
    console.error("============================================");

    return res.status(500).send(
      "Failed to save department. Please check the terminal for the exact error."
    );
  }
};

// EDIT DEPARTMENT
export const editDepartment = async (req, res, next) => {
  try {
    const department = await Department.findByPk(req.params.id);

    if (!department) {
      return res.status(404).send("Department not found.");
    }

    return res.render(
      "Human Resource SupplyHub/editDepartment",
      {
        title: "Edit Department",
        department
      }
    );

  } catch (error) {
    console.error("Edit department error:", error);
    next(error);
  }
};

// UPDATE DEPARTMENT
export const updateDepartment = async (req, res, next) => {
  try {
    const department = await Department.findByPk(req.params.id);

    if (!department) {
      return res.status(404).send("Department not found.");
    }

    const { departmentName, description, status } = req.body;

    if (!departmentName || !departmentName.trim()) {
      return res.status(400).send("Department name is required.");
    }

    await department.update({
      departmentName: departmentName.trim(),
      description: description?.trim() || null,
      status
    });

    return res.redirect("/human-resource/departments");

  } catch (error) {
    next(error);
  }
};

// DELETE DEPARTMENT
export const deleteDepartment = async (req, res, next) => {
  try {
    const department = await Department.findByPk(req.params.id);

    if (!department) {
      return res.status(404).send("Department not found.");
    }

    const assignedEmployees = await Employee.count({
      where: { departmentId: department.id }
    });

    if (assignedEmployees > 0) {
      return res.status(400).send(
        "Cannot delete this department because employees are assigned to it. Reassign those employees first."
      );
    }

    await department.destroy();

    return res.redirect("/human-resource/departments");
  } catch (error) {
    next(error);
  }
};


// ============================================
// ATTENDANCE MONITORING
// ============================================

// VIEW ALL ATTENDANCE RECORDS
export const attendance = async (req, res, next) => {
  try {
    const records = await Attendance.findAll({
      include: [{
        model: Employee,
        as: "employee",
        attributes: [
          "employeeCode",
          "firstName",
          "middleName",
          "lastName"
        ],
        required: false
      }],
      order: [
        ["attendanceDate", "DESC"],
        ["createdAt", "DESC"]
      ]
    });

    const [presentCount, lateCount, absentCount] = await Promise.all([
      Attendance.count({ where: { status: "present" } }),
      Attendance.count({ where: { status: "late" } }),
      Attendance.count({ where: { status: "absent" } })
    ]);

    return res.render("Human Resource SupplyHub/attendance", {
      title: "Attendance Monitoring",
      moduleName: "Attendance Monitoring",
      moduleDescription: "Monitor employee attendance and working hours.",
      records: records.map(record => record.get({ plain: true })),
      presentCount,
      lateCount,
      absentCount
    });
  } catch (error) {
    next(error);
  }
};

// SHOW ADD ATTENDANCE FORM
export const addAttendance = async (req, res, next) => {
  try {
    const employees = await Employee.findAll({
      where: { employmentStatus: "active" },
      order: [["lastName", "ASC"], ["firstName", "ASC"]]
    });

    return res.render("Human Resource SupplyHub/addAttendance", {
      title: "Add Attendance",
      moduleName: "Attendance Monitoring",
      moduleDescription: "Record employee attendance.",
      employees: employees.map(employee => ({
        ...employee.get({ plain: true }),
        selected: false
      }))
    });
  } catch (error) {
    next(error);
  }
};

// SAVE NEW ATTENDANCE
export const storeAttendance = async (req, res, next) => {
  try {
    const {
      employeeId,
      attendanceDate,
      timeIn,
      timeOut,
      status
    } = req.body;

    if (!employeeId || !attendanceDate) {
      return res.status(400).send(
        "Employee and attendance date are required."
      );
    }

    const validStatuses = ["present", "late", "absent"];

    if (!validStatuses.includes(status)) {
      return res.status(400).send("Invalid attendance status.");
    }

    const employee = await Employee.findByPk(employeeId);

    if (!employee) {
      return res.status(404).send("Employee not found.");
    }

    const existingRecord = await Attendance.findOne({
      where: { employeeId, attendanceDate }
    });

    if (existingRecord) {
      return res.status(409).send(
        "Attendance for this employee on this date already exists."
      );
    }

    await Attendance.create({
      employeeId,
      attendanceDate,
      timeIn: status === "absent" ? null : (timeIn || null),
      timeOut: status === "absent" ? null : (timeOut || null),
      status
    });

    return res.redirect("/human-resource/attendance");
  } catch (error) {
    next(error);
  }
};

// SHOW EDIT ATTENDANCE FORM
export const editAttendance = async (req, res, next) => {
  try {
    const record = await Attendance.findByPk(req.params.id);

    if (!record) {
      return res.status(404).send("Attendance record not found.");
    }

    const employees = await Employee.findAll({
      order: [["lastName", "ASC"], ["firstName", "ASC"]]
    });

    return res.render("Human Resource SupplyHub/editAttendance", {
      title: "Edit Attendance",
      moduleName: "Attendance Monitoring",
      moduleDescription: "Update an attendance record.",
      attendance: record.get({ plain: true }),
      employees: employees.map(employee => ({
        ...employee.get({ plain: true }),
        selected: employee.id === record.employeeId
      }))
    });
  } catch (error) {
    next(error);
  }
};

// UPDATE ATTENDANCE
export const updateAttendance = async (req, res, next) => {
  try {
    const record = await Attendance.findByPk(req.params.id);

    if (!record) {
      return res.status(404).send("Attendance record not found.");
    }

    const {
      employeeId,
      attendanceDate,
      timeIn,
      timeOut,
      status
    } = req.body;

    if (!employeeId || !attendanceDate) {
      return res.status(400).send(
        "Employee and attendance date are required."
      );
    }

    const validStatuses = ["present", "late", "absent"];

    if (!validStatuses.includes(status)) {
      return res.status(400).send("Invalid attendance status.");
    }

    const employee = await Employee.findByPk(employeeId);

    if (!employee) {
      return res.status(404).send("Employee not found.");
    }

    const duplicateRecord = await Attendance.findOne({
      where: { employeeId, attendanceDate }
    });

    if (duplicateRecord && duplicateRecord.id !== record.id) {
      return res.status(409).send(
        "Attendance for this employee on this date already exists."
      );
    }

    await record.update({
      employeeId,
      attendanceDate,
      timeIn: status === "absent" ? null : (timeIn || null),
      timeOut: status === "absent" ? null : (timeOut || null),
      status
    });

    return res.redirect("/human-resource/attendance");
  } catch (error) {
    next(error);
  }
};

// DELETE ATTENDANCE
export const deleteAttendance = async (req, res, next) => {
  try {
    const record = await Attendance.findByPk(req.params.id);

    if (!record) {
      return res.status(404).send("Attendance record not found.");
    }

    await record.destroy();

    return res.redirect("/human-resource/attendance");
  } catch (error) {
    next(error);
  }
};


// ============================================
// WORK SCHEDULE MANAGEMENT
// ============================================

// VIEW ALL WORK SCHEDULES
export const schedules = async (req, res, next) => {
  try {
    const records = await WorkSchedule.findAll({
      include: [{
        model: Employee,
        as: "employee",
        attributes: [
          "id",
          "employeeCode",
          "firstName",
          "middleName",
          "lastName"
        ]
      }],
      order: [
        ["dayOfWeek", "ASC"],
        ["startTime", "ASC"]
      ]
    });

    return res.render("Human Resource SupplyHub/schedules", {
      title: "Work Schedules",
      moduleName: "Work Schedules",
      moduleDescription: "Manage employee shifts and working schedules.",
      schedules: records.map(record => record.get({ plain: true }))
    });

  } catch (error) {
    next(error);
  }
};

// SHOW ADD WORK SCHEDULE FORM
export const addWorkSchedule = async (req, res, next) => {
  try {
    const employees = await Employee.findAll({
      where: {
        employmentStatus: "active"
      },
      order: [
        ["lastName", "ASC"],
        ["firstName", "ASC"]
      ]
    });

    return res.render("Human Resource SupplyHub/addWorkSchedule", {
      title: "Add Work Schedule",
      moduleName: "Work Schedules",
      moduleDescription: "Assign a working schedule to an employee.",
      employees: employees.map(employee => ({
        ...employee.get({ plain: true }),
        selected: false
      }))
    });

  } catch (error) {
    next(error);
  }
};

// SAVE NEW WORK SCHEDULE
export const storeWorkSchedule = async (req, res, next) => {
  try {
    const {
      scheduleName,
      employeeId,
      dayOfWeek,
      startTime,
      endTime,
      breakStart,
      breakEnd,
      status
    } = req.body;

    const validDays = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday"
    ];

    const validStatuses = ["active", "inactive"];

    // Required fields
    if (
      !employeeId ||
      !dayOfWeek ||
      !startTime ||
      !endTime
    ) {
      return res.status(400).send(
        "Employee, day, start time, and end time are required."
      );
    }

    // Validate day
    if (!validDays.includes(dayOfWeek)) {
      return res.status(400).send("Invalid day of week.");
    }

    // Validate status
    const scheduleStatus = status || "active";

    if (!validStatuses.includes(scheduleStatus)) {
      return res.status(400).send("Invalid schedule status.");
    }

    // Validate time range
    if (startTime >= endTime) {
      return res.status(400).send(
        "End time must be later than start time."
      );
    }

    // Break validation
    if (Boolean(breakStart) !== Boolean(breakEnd)) {
      return res.status(400).send(
        "Please provide both break start and break end."
      );
    }

    if (breakStart && breakEnd) {
      if (
        breakStart <= startTime ||
        breakEnd >= endTime ||
        breakStart >= breakEnd
      ) {
        return res.status(400).send(
          "Break time must be within the working hours."
        );
      }
    }

    // Check employee
    const employee = await Employee.findByPk(employeeId);

    if (!employee) {
      return res.status(404).send("Employee not found.");
    }

    if (employee.employmentStatus !== "active") {
      return res.status(400).send(
        "Only active employees can be assigned a work schedule."
      );
    }

    // Check overlapping active schedules
    if (scheduleStatus === "active") {
      const overlappingSchedule = await WorkSchedule.findOne({
        where: {
          employeeId: employee.id,
          dayOfWeek,
          status: "active",
          startTime: {
            [Op.lt]: endTime
          },
          endTime: {
            [Op.gt]: startTime
          }
        }
      });

      if (overlappingSchedule) {
        return res.status(409).send(
          "This employee already has an overlapping active schedule on this day."
        );
      }
    }

    // Create schedule
    await WorkSchedule.create({
      scheduleName: String(scheduleName || "").trim() || null,
      employeeId: employee.id,
      dayOfWeek,
      startTime,
      endTime,
      breakStart: breakStart || null,
      breakEnd: breakEnd || null,
      status: scheduleStatus
    });

    return res.redirect("/human-resource/schedules");

  } catch (error) {
    next(error);
  }
};

// ============================================
// LEAVE MANAGEMENT
// ============================================

// VIEW ALL LEAVE REQUESTS
export const leaveRequests = async (req, res, next) => {
  try {
    const requests = await LeaveRequest.findAll({
      include: [{
        model: Employee,
        as: "employee",
        attributes: [
          "employeeCode",
          "firstName",
          "middleName",
          "lastName"
        ],
        required: false
      }],
      order: [["createdAt", "DESC"]]
    });

    const [pendingCount, approvedCount, rejectedCount] =
      await Promise.all([
        LeaveRequest.count({ where: { status: "pending" } }),
        LeaveRequest.count({ where: { status: "approved" } }),
        LeaveRequest.count({ where: { status: "rejected" } })
      ]);

    return res.render("Human Resource SupplyHub/leaveRequests", {
      title: "Leave Management",
      moduleName: "Leave Management",
      moduleDescription: "Manage employee leave requests.",
      requests: requests.map(request => {
        const plain = request.get({ plain: true });

        return {
          ...plain,
          isPending: plain.status === "pending"
        };
      }),
      pendingCount,
      approvedCount,
      rejectedCount
    });

  } catch (error) {
    next(error);
  }
};


// SHOW ADD LEAVE REQUEST FORM
export const addLeaveRequest = async (req, res, next) => {
  try {
    const employees = await Employee.findAll({
      where: { employmentStatus: "active" },
      order: [["lastName", "ASC"], ["firstName", "ASC"]]
    });

    return res.render("Human Resource SupplyHub/addLeaveRequest", {
      title: "Add Leave Request",
      moduleName: "Leave Management",
      moduleDescription: "Create an employee leave request.",
      employees: employees.map(employee =>
        employee.get({ plain: true })
      )
    });

  } catch (error) {
    next(error);
  }
};


// SAVE NEW LEAVE REQUEST

// SAVE NEW LEAVE REQUEST
export const storeLeaveRequest = async (req, res, next) => {
  try {
    const {
      employeeId,
      leaveType,
      startDate,
      endDate,
      reason
    } = req.body;

    const validLeaveTypes = [
      "vacation",
      "sick",
      "emergency",
      "personal"
    ];

    // Check required fields
    if (
      !employeeId ||
      !leaveType ||
      !startDate ||
      !endDate ||
      !reason?.trim()
    ) {
      return res.status(400).send("Please complete all required fields.");
    }

    // Validate leave type
    if (!validLeaveTypes.includes(leaveType)) {
      return res.status(400).send("Invalid leave type.");
    }

    // Validate date order
    
    // Validate date order
    if (startDate > endDate) {
      return res.status(400).send(
        "End date cannot be earlier than start date."
      );
    }

    // Validate that leave dates are within one calendar year
    const startYear = new Date(`${startDate}T00:00:00Z`).getUTCFullYear();
    const endYear = new Date(`${endDate}T00:00:00Z`).getUTCFullYear();

    if (startYear !== endYear) {
      return res.status(400).send(
        "Leave request must be within one calendar year."
      );
    }

    // Check if employee exists
    const employee = await Employee.findByPk(employeeId);

    if (!employee) {
      return res.status(404).send("Employee not found.");
    }

    // Save leave request
    await LeaveRequest.create({
      employeeId,
      leaveType,
      startDate,
      endDate,
      reason: reason.trim(),
      status: "pending"
    });

    return res.redirect("/human-resource/leave-requests");

  } catch (error) {
    next(error);
  }
};


// SHOW EDIT LEAVE REQUEST FORM
export const editLeaveRequest = async (req, res, next) => {
  try {
    const request = await LeaveRequest.findByPk(req.params.id);

    if (!request) {
      return res.status(404).send("Leave request not found.");
    }

    const employees = await Employee.findAll({
      order: [["lastName", "ASC"], ["firstName", "ASC"]]
    });

    const plainRequest = request.get({ plain: true });

    return res.render("Human Resource SupplyHub/editLeaveRequest", {
      title: "Edit Leave Request",
      moduleName: "Leave Management",
      moduleDescription: "Update an employee leave request.",

      leaveRequest: {
        ...plainRequest,
        isVacation: plainRequest.leaveType === "vacation",
        isSick: plainRequest.leaveType === "sick",
        isEmergency: plainRequest.leaveType === "emergency",
        isPersonal: plainRequest.leaveType === "personal"
      },

      employees: employees.map(employee => ({
        ...employee.get({ plain: true }),
        selected: employee.id === request.employeeId
      }))
    });

  } catch (error) {
    next(error);
  }
};
// UPDATE EXISTING LEAVE REQUEST
export const updateLeaveRequest = async (req, res, next) => {
  try {
    const {
      employeeId,
      leaveType,
      startDate,
      endDate,
      reason
    } = req.body;

    // Find existing leave request
    const request = await LeaveRequest.findByPk(req.params.id);

    if (!request) {
      return res.status(404).send("Leave request not found.");
    }

    const validLeaveTypes = [
      "vacation",
      "sick",
      "emergency",
      "personal"
    ];

    // Validate required fields
    if (
      !employeeId ||
      !leaveType ||
      !startDate ||
      !endDate ||
      !reason?.trim()
    ) {
      return res.status(400).send(
        "Please complete all required fields."
      );
    }

    // Validate leave type
    if (!validLeaveTypes.includes(leaveType)) {
      return res.status(400).send("Invalid leave type.");
    }

    // Validate date order
    if (startDate > endDate) {
      return res.status(400).send(
        "End date cannot be earlier than start date."
      );
    }

    // Validate that leave dates are within one calendar year
    const startYear = new Date(
      `${startDate}T00:00:00Z`
    ).getUTCFullYear();

    const endYear = new Date(
      `${endDate}T00:00:00Z`
    ).getUTCFullYear();

    if (startYear !== endYear) {
      return res.status(400).send(
        "Leave request must be within one calendar year."
      );
    }

    // Check if employee exists
    const employee = await Employee.findByPk(employeeId);

    if (!employee) {
      return res.status(404).send("Employee not found.");
    }

    // Update existing leave request
    await request.update({
      employeeId,
      leaveType,
      startDate,
      endDate,
      reason: reason.trim(),
      status: "pending"
    });

    return res.redirect("/human-resource/leave-requests");

  } catch (error) {
    next(error);
  }
};

// ============================================
// APPROVE OR REJECT LEAVE REQUEST
// ============================================

export const updateLeaveStatus = async (req, res, next) => {
  try {
    const request = await LeaveRequest.findByPk(req.params.id);

    if (!request) {
      return res.status(404).send("Leave request not found.");
    }

    const { status } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).send("Invalid leave decision.");
    }

    // Only pending requests can receive a decision.
    if (request.status !== "pending") {
      return res.status(400).send(
        "This leave request has already been processed."
      );
    }

    if (status === "approved") {
      const currentYear = new Date().getFullYear();
      const startYear = new Date(
        `${request.startDate}T00:00:00Z`
      ).getUTCFullYear();
      const endYear = new Date(
        `${request.endDate}T00:00:00Z`
      ).getUTCFullYear();
      
      if (startYear !== endYear || startYear !== currentYear) {
        return res.status(400).send(
          `Only leave requests within ${currentYear} can be approved.`
        );
      }

      // Vacation and sick leave have annual credits.
      if (["vacation", "sick"].includes(request.leaveType)) {
        const approvedRequests = await LeaveRequest.findAll({
          where: {
            employeeId: request.employeeId,
            leaveType: request.leaveType,
            status: "approved",
            id: { [Op.ne]: request.id },
            startDate: { [Op.gte]: `${currentYear}-01-01` },
            endDate: { [Op.lte]: `${currentYear}-12-31` }
          }
        });

        const usedDays = approvedRequests.reduce(
          (total, item) =>
            total + countLeaveDays(item.startDate, item.endDate),
          0
        );

        const requestedDays = countLeaveDays(
          request.startDate,
          request.endDate
        );

        const remainingDays = 15 - usedDays;

        if (requestedDays > remainingDays) {
          return res.status(400).send(
            `Cannot approve. Employee has only ${Math.max(0, remainingDays)} ${request.leaveType} leave day(s) remaining.`
          );
        }
      }
    }

    await request.update({ status });

    return res.redirect("/human-resource/leave-requests");

  } catch (error) {
    next(error);
  }
};
// DELETE LEAVE REQUEST
export const deleteLeaveRequest = async (req, res, next) => {
  try {
    const request = await LeaveRequest.findByPk(req.params.id);

    if (!request) {
      return res.status(404).send("Leave request not found.");
    }

    await request.destroy();

    return res.redirect("/human-resource/leave-requests");

  } catch (error) {
    next(error);
  }
};

// ============================================
// HR REPORTS DASHBOARD
// ============================================

export const reports = async (req, res, next) => {
  try {
    const startDate = String(req.query.startDate || "").trim();
    const endDate = String(req.query.endDate || "").trim();
    const departmentId = String(req.query.departmentId || "").trim();
    const exportType = String(req.query.export || "").trim();

    const validDate = (value) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
      const date = new Date(`${value}T00:00:00Z`);
      return !Number.isNaN(date.getTime()) &&
        date.toISOString().slice(0, 10) === value;
    };

    if (startDate && !validDate(startDate)) {
      return res.status(400).send("Invalid start date.");
    }

    if (endDate && !validDate(endDate)) {
      return res.status(400).send("Invalid end date.");
    }

    if (startDate && endDate && startDate > endDate) {
      return res.status(400).send("Start date cannot be later than end date.");
    }

    const selectedDepartment =
      departmentId && /^\d+$/.test(departmentId)
        ? Number(departmentId)
        : null;

    const employeeWhere = selectedDepartment
      ? { departmentId: selectedDepartment }
      : {};

    const attendanceWhere = {};
    const leaveWhere = {};

    if (startDate || endDate) {
      attendanceWhere.attendanceDate = {};
      leaveWhere[Op.and] = [];

      if (startDate) {
        attendanceWhere.attendanceDate[Op.gte] = startDate;
        leaveWhere[Op.and].push({
          endDate: { [Op.gte]: startDate }
        });
      }

      if (endDate) {
        attendanceWhere.attendanceDate[Op.lte] = endDate;
        leaveWhere[Op.and].push({
          startDate: { [Op.lte]: endDate }
        });
      }
    }

    const [
      employees,
      departments,
      attendanceRecords,
      leaveRecords,
      scheduleRecords
    ] = await Promise.all([
      Employee.findAll({
        where: employeeWhere,
        include: [{
          model: Department,
          as: "department",
          attributes: ["id", "departmentName"]
        }],
        order: [["lastName", "ASC"]]
      }),

      Department.findAll({
        order: [["departmentName", "ASC"]]
      }),

      Attendance.findAll({
        where: attendanceWhere,
        include: [{
          model: Employee,
          as: "employee",
          where: employeeWhere,
          attributes: [
            "id", "employeeCode", "firstName", "lastName", "departmentId"
          ]
        }],
        order: [["attendanceDate", "DESC"]]
      }),

      LeaveRequest.findAll({
        where: leaveWhere,
        include: [{
          model: Employee,
          as: "employee",
          where: employeeWhere,
          attributes: [
            "id", "employeeCode", "firstName", "lastName", "departmentId"
          ]
        }],
        order: [["startDate", "DESC"]]
      }),

      WorkSchedule.findAll({
        include: [{
          model: Employee,
          as: "employee",
          where: employeeWhere,
          attributes: [
            "id", "employeeCode", "firstName", "lastName", "departmentId"
          ]
        }],
        order: [["dayOfWeek", "ASC"]]
      })
    ]);

    const employeeRows = employees.map((item) => item.toJSON());
    const attendanceRows = attendanceRecords.map((item) => item.toJSON());
    const leaveRows = leaveRecords.map((item) => item.toJSON());
    const scheduleRows = scheduleRecords.map((item) => item.toJSON());
    const departmentRows = departments.map((item) => item.toJSON({
       ...item.toJSON(),
  isSelected: selectedDepartment
    ? Number(item.id) === selectedDepartment
    : false
}));


    const countStatus = (records, status) =>
      records.filter(
        (item) => String(item.status || "").toLowerCase() === status
      ).length;

    const activeEmployees = countStatus(employeeRows.map((item) => ({
      status: item.employmentStatus
    })), "active");

    const inactiveEmployees = countStatus(employeeRows.map((item) => ({
      status: item.employmentStatus
    })), "inactive");

    const resignedEmployees = countStatus(employeeRows.map((item) => ({
      status: item.employmentStatus
    })), "resigned");

    const terminatedEmployees = countStatus(employeeRows.map((item) => ({
      status: item.employmentStatus
    })), "terminated");

    const presentCount = countStatus(attendanceRows, "present");
    const lateCount = countStatus(attendanceRows, "late");
    const absentCount = countStatus(attendanceRows, "absent");

    const pendingLeaves = countStatus(leaveRows, "pending");
    const approvedLeaves = countStatus(leaveRows, "approved");
    const rejectedLeaves = countStatus(leaveRows, "rejected");

    const totalSalary = employeeRows.reduce(
      (total, employee) => total + Number(employee.salary || 0),
      0
    );

    const departmentStats = departmentRows.map((department) => {
      const departmentEmployees = employeeRows.filter(
        (employee) => Number(employee.departmentId) === Number(department.id)
      );

      return {
        departmentName: department.departmentName,
        employeeCount: departmentEmployees.length,
        salaryTotal: departmentEmployees.reduce(
          (total, employee) => total + Number(employee.salary || 0),
          0
        )
      };
    });

    const totalAttendance = attendanceRows.length;
    const attendancePercentage = totalAttendance
      ? Math.round((presentCount / totalAttendance) * 100)
      : 0;

    const csvCell = (value) => {
      const safeValue = String(value ?? "");
      return `"${safeValue.replace(/"/g, '""')}"`;
    };

    // CSV EXPORT
    const exportData = {
      employees: {
        headers: [
          "Employee Code", "First Name", "Last Name",
          "Position", "Department", "Employment Status", "Salary"
        ],
        rows: employeeRows.map((employee) => [
          employee.employeeCode,
          employee.firstName,
          employee.lastName,
          employee.position,
          employee.department?.departmentName,
          employee.employmentStatus,
          employee.salary
        ])
      },

      attendance: {
        headers: [
          "Date", "Employee Code", "Employee Name", "Time In",
          "Time Out", "Status"
        ],
        rows: attendanceRows.map((record) => [
          record.attendanceDate,
          record.employee?.employeeCode,
          `${record.employee?.firstName || ""} ${record.employee?.lastName || ""}`,
          record.timeIn,
          record.timeOut,
          record.status
        ])
      },

      leaves: {
        headers: [
          "Employee Code", "Employee Name", "Leave Type",
          "Start Date", "End Date", "Status"
        ],
        rows: leaveRows.map((record) => [
          record.employee?.employeeCode,
          `${record.employee?.firstName || ""} ${record.employee?.lastName || ""}`,
          record.leaveType,
          record.startDate,
          record.endDate,
          record.status
        ])
      },

      schedules: {
        headers: [
          "Employee Code", "Employee Name", "Schedule",
          "Day", "Start Time", "End Time", "Status"
        ],
        rows: scheduleRows.map((record) => [
          record.employee?.employeeCode,
          `${record.employee?.firstName || ""} ${record.employee?.lastName || ""}`,
          record.scheduleName,
          record.dayOfWeek,
          record.startTime,
          record.endTime,
          record.status
        ])
      },

      salary: {
        headers: [
          "Employee Code", "Employee Name", "Position",
          "Department", "Salary"
        ],
        rows: employeeRows.map((employee) => [
          employee.employeeCode,
          `${employee.firstName} ${employee.lastName}`,
          employee.position,
          employee.department?.departmentName,
          employee.salary
        ])
      }
    };

    if (exportType) {
      const selectedExport = exportData[exportType];

      if (!selectedExport) {
        return res.status(400).send("Invalid report export type.");
      }

      const csv = [
        selectedExport.headers,
        ...selectedExport.rows
      ]
        .map((row) => row.map(csvCell).join(","))
        .join("\r\n");

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="hr-${exportType}-report.csv"`
      );

      return res.send("\uFEFF" + csv);
    }

    const filterQuery = new URLSearchParams();

    if (startDate) filterQuery.set("startDate", startDate);
    if (endDate) filterQuery.set("endDate", endDate);
    if (selectedDepartment) {
      filterQuery.set("departmentId", String(selectedDepartment));
    }

    const filterString = filterQuery.toString();
    const exportLink = (type) =>
      `/human-resource/reports?${filterString ? filterString + "&" : ""}export=${type}`;

    const reports = {
      totalEmployees: employeeRows.length,
      activeEmployees,
      inactiveEmployees,
      resignedEmployees,
      terminatedEmployees,

      totalAttendance,
      presentCount,
      lateCount,
      absentCount,
      attendancePercentage,

      totalLeaves: leaveRows.length,
      pendingLeaves,
      approvedLeaves,
      rejectedLeaves,

      totalSchedules: scheduleRows.length,
      activeSchedules: scheduleRows.filter(
        (item) => item.status === "active"
      ).length,

      totalSalary,
      departmentStats,

      employees: employeeRows,
      attendanceRecords: attendanceRows.slice(0, 10),
      leaveRecords: leaveRows.slice(0, 10),
      scheduleRecords: scheduleRows.slice(0, 10),

      departments: departmentRows,
      filters: {
        startDate,
        endDate,
        departmentId: selectedDepartment
          ? String(selectedDepartment)
          : ""
      },

      exportLinks: {
        employees: exportLink("employees"),
        attendance: exportLink("attendance"),
        leaves: exportLink("leaves"),
        schedules: exportLink("schedules"),
        salary: exportLink("salary")
      }
    };

    return res.render("Human Resource SupplyHub/reports", {
      title: "HR Reports",
      moduleName: "HR Reports",
      moduleDescription: "View and export Human Resource reports.",
      reports
    });

  } catch (error) {
    next(error);
  }
};
// ============================================
// LEAVE BALANCE HELPER
// Counts weekdays (Monday to Friday), inclusive.
// ============================================

const countLeaveDays = (startDate, endDate) => {
  let count = 0;

  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);

  for (
    let date = new Date(start);
    date <= end;
    date.setUTCDate(date.getUTCDate() + 1)
  ) {
    const day = date.getUTCDay();

    if (day !== 0 && day !== 6) {
      count++;
    }
  }

  return count;
};


// ============================================
// LEAVE HISTORY
// ============================================

export const leaveHistory = async (req, res, next) => {
  try {
    const requests = await LeaveRequest.findAll({
      include: [{
        model: Employee,
        as: "employee",
        attributes: [
          "employeeCode",
          "firstName",
          "middleName",
          "lastName"
        ],
        required: false
      }],
      order: [["createdAt", "DESC"]]
    });

    return res.render("Human Resource SupplyHub/leaveHistory", {
      title: "Leave History",
      moduleName: "Leave Management",
      moduleDescription: "View all employee leave applications and decisions.",
      requests: requests.map(request => request.get({ plain: true }))
    });

  } catch (error) {
    next(error);
  }
};


// ============================================
// LEAVE BALANCE
// ============================================

export const leaveBalance = async (req, res, next) => {
  try {
    const currentYear = new Date().getFullYear();

    const employees = await Employee.findAll({
      order: [["lastName", "ASC"], ["firstName", "ASC"]]
    });

    const approvedRequests = await LeaveRequest.findAll({
      where: {
        status: "approved",
        startDate: {
          [Op.gte]: `${currentYear}-01-01`
        },
        endDate: {
          [Op.lte]: `${currentYear}-12-31`
        }
      }
    });

    const balances = employees.map(employee => {
      const employeeRequests = approvedRequests.filter(
        request => Number(request.employeeId) === Number(employee.id)
      );

      let vacationUsed = 0;
      let sickUsed = 0;

      employeeRequests.forEach(request => {
        const days = countLeaveDays(request.startDate, request.endDate);

        if (request.leaveType === "vacation") {
          vacationUsed += days;
        }

        if (request.leaveType === "sick") {
          sickUsed += days;
        }
      });

      return {
        employeeCode: employee.employeeCode,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        vacationTotal: 15,
        vacationUsed,
        vacationRemaining: Math.max(0, 15 - vacationUsed),
        sickTotal: 15,
        sickUsed,
        sickRemaining: Math.max(0, 15 - sickUsed)
      };
    });

    return res.render("Human Resource SupplyHub/leaveBalance", {
      title: "Leave Balance",
      moduleName: "Leave Management",
      moduleDescription: `Annual leave credits for ${currentYear}.`,
      currentYear,
      balances
    });

  } catch (error) {
    next(error);
  }
};

// ============================================
// SHIFT TEMPLATE MANAGEMENT
// ============================================

// Validate shift template information
const validateShiftTemplate = (body) => {
  const errors = [];

  const templateName = String(body.templateName || "").trim();
  const description = String(body.description || "").trim();
  const startTime = String(body.startTime || "").trim();
  const endTime = String(body.endTime || "").trim();
  const breakStart = String(body.breakStart || "").trim();
  const breakEnd = String(body.breakEnd || "").trim();
  const status = String(body.status || "active").trim();

  const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

  if (!templateName) {
    errors.push("Template name is required.");
  }

  if (templateName.length > 100) {
    errors.push("Template name must not exceed 100 characters.");
  }

  if (!timePattern.test(startTime) || !timePattern.test(endTime)) {
    errors.push("Please provide valid start and end times.");
  } else if (startTime >= endTime) {
    errors.push("End time must be later than start time.");
  }

  if (Boolean(breakStart) !== Boolean(breakEnd)) {
    errors.push("Please provide both break start and break end.");
  }

  if (breakStart && breakEnd) {
    if (!timePattern.test(breakStart) || !timePattern.test(breakEnd)) {
      errors.push("Please provide valid break times.");
    } else if (
      breakStart <= startTime ||
      breakEnd >= endTime ||
      breakStart >= breakEnd
    ) {
      errors.push("Break time must be within the working hours.");
    }
  }

  if (!["active", "inactive"].includes(status)) {
    errors.push("Invalid template status.");
  }

  return {
    errors,
    data: {
      templateName,
      description: description || null,
      startTime,
      endTime,
      breakStart: breakStart || null,
      breakEnd: breakEnd || null,
      status
    }
  };
};


// ============================================
// VIEW ALL SHIFT TEMPLATES
// ============================================

export const shiftTemplates = async (req, res, next) => {
  try {
    const templates = await ShiftTemplate.findAll({
      order: [["templateName", "ASC"]]
    });

    return res.render("Human Resource SupplyHub/shiftTemplates", {
      title: "Shift Templates",
      moduleName: "Shift Templates",
      moduleDescription: "Manage reusable work shift templates.",
      templates: templates.map(item => item.get({ plain: true }))
    });

  } catch (error) {
    next(error);
  }
};
// ============================================
// SHOW ADD SHIFT TEMPLATE FORM
// ============================================

export const addShiftTemplate = (req, res) => {
  return res.render("Human Resource SupplyHub/addShiftTemplate", {
    title: "Add Shift Template",
    moduleName: "Shift Templates",
    moduleDescription: "Create a reusable work shift template."
  });
};


// ============================================
// SAVE NEW SHIFT TEMPLATE
// ============================================

export const storeShiftTemplate = async (req, res, next) => {
  try {
    const { errors, data } = validateShiftTemplate(req.body);

    if (errors.length) {
      return res.status(400).send(errors.join("\n"));
    }

    await ShiftTemplate.create(data);

    return res.redirect("/human-resource/shift-templates");

  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).send("A shift template with this name already exists.");
    }

    next(error);
  }
};


// ============================================
// SHOW EDIT SHIFT TEMPLATE FORM
// ============================================

export const editShiftTemplate = async (req, res, next) => {
  try {
    const template = await ShiftTemplate.findByPk(req.params.id);

    if (!template) {
      return res.status(404).send("Shift template not found.");
    }

    return res.render("Human Resource SupplyHub/editShiftTemplate", {
      title: "Edit Shift Template",
      moduleName: "Shift Templates",
      moduleDescription: "Update an existing work shift template.",
      template: template.get({ plain: true })
    });

  } catch (error) {
    next(error);
  }
};


// ============================================
// UPDATE SHIFT TEMPLATE
// ============================================

export const updateShiftTemplate = async (req, res, next) => {
  try {
    const template = await ShiftTemplate.findByPk(req.params.id);

    if (!template) {
      return res.status(404).send("Shift template not found.");
    }

    const { errors, data } = validateShiftTemplate(req.body);

    if (errors.length) {
      return res.status(400).send(errors.join("\n"));
    }

    await template.update(data);

    return res.redirect("/human-resource/shift-templates");

  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).send("A shift template with this name already exists.");
    }

    next(error);
  }
};


// ============================================
// DELETE SHIFT TEMPLATE
// ============================================

export const deleteShiftTemplate = async (req, res, next) => {
  try {
    const template = await ShiftTemplate.findByPk(req.params.id);

    if (!template) {
      return res.status(404).send("Shift template not found.");
    }

    await template.destroy();

    return res.redirect("/human-resource/shift-templates");

  } catch (error) {
    next(error);
  }
};
