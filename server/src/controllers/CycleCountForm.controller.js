const mongoose = require('mongoose');
const CycleCountForm = require('../models/CycleCountForm.model');
const Employee = require('../models/Employee.model');
const Package = require('../models/Package.model');
const Location = require('../models/location.model');

/**
 * Validation middleware for cycle count operations
 */
const validateCycleCountInput = (req, res, next) => {
  const { area, startTime, endTime } = req.body;

  if (!area || !startTime || !endTime) {
    return res.status(400).json({
      status: 'error',
      message: 'Thiếu thông tin bắt buộc: area, startTime, endTime',
    });
  }

  if (new Date(endTime) <= new Date(startTime)) {
    return res.status(400).json({
      status: 'error',
      message: 'Thời gian kết thúc phải sau thời gian bắt đầu',
    });
  }

  next();
};

/**
 * Authorization middleware
 */
const authorizeRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: `Không có quyền truy cập. Yêu cầu vai trò: ${roles.join(', ')}`,
      });
    }
    next();
  };
};

/**
 * Lấy chi tiết đợt kiểm kê cho trưởng nhóm
 */
const getDetailForManager = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'ID không hợp lệ',
      });
    }

    const cycleCount = await CycleCountForm.findById(id)
      .populate('team.manager', 'name email')
      .populate('team.members', 'name email')
      .populate('approvedBy', 'name email')
      .populate({
        path: 'content.location',
        select: 'row bay level area',
        populate: { path: 'area', select: 'name' },
      })
      .populate({
        path: 'content.verifiedBy',
        select: 'name email',
      })
      .populate({
        path: 'content.result.Package',
        select: 'name code barcode',
      })
      .lean();

    if (!cycleCount) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy đợt kiểm kê',
      });
    }

    // Kiểm tra quyền truy cập
    const isManager = cycleCount.team.manager._id.toString() === req.user._id.toString();
    const isMember = cycleCount.team.members.some(
      (member) => member._id.toString() === req.user._id.toString(),
    );
    const isSupervisor = req.user.role === 'supervisor';

    if (!isManager && !isMember && !isSupervisor) {
      return res.status(403).json({
        status: 'error',
        message: 'Bạn không có quyền xem đợt kiểm kê này',
      });
    }

    // Format response data
    const formattedData = {
      id: cycleCount._id,
      team: {
        manager: cycleCount.team.manager,
        members: cycleCount.team.members,
      },
      status: cycleCount.status,
      verified: cycleCount.verified,
      approved: cycleCount.approved,
      startTime: cycleCount.startTime,
      endTime: cycleCount.endTime,
      approvedBy: cycleCount.approvedBy,
      content: cycleCount.content.map((section) => ({
        location: {
          id: section.location._id,
          name: `${section.location.area?.name || 'N/A'}-${section.location.row}-${section.location.level}-${section.location.bay}`,
          details: section.location,
        },
        verified: section.verified,
        verifiedBy: section.verifiedBy,
        result: section.result,
      })),
      progress: {
        total: cycleCount.content.length,
        completed: cycleCount.content.filter((c) => c.verified).length,
        percentage: Math.round(
          (cycleCount.content.filter((c) => c.verified).length / cycleCount.content.length) * 100,
        ),
      },
      createdAt: cycleCount.createdAt,
      updatedAt: cycleCount.updatedAt,
    };

    res.status(200).json({
      status: 'success',
      data: { cycleCount: formattedData },
    });
  } catch (error) {
    console.error('Error in getDetailForManager:', error);
    res.status(500).json({
      status: 'error',
      message: 'Lỗi hệ thống',
      ...(process.env.NODE_ENV === 'development' && { details: error.message }),
    });
  }
};

/**
 * Tạo đợt kiểm kê mới
 */
const createCycleCount = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { area, startTime, endTime, description } = req.body;

    // Lấy danh sách nhân viên kho
    const warehouseEmployees = await Employee.find({
      role: 'warehouse',
      status: 'active',
    }).session(session);

    if (warehouseEmployees.length < 3) {
      await session.abortTransaction();
      return res.status(400).json({
        status: 'error',
        message: 'Cần ít nhất 3 nhân viên kho hoạt động để tạo đợt kiểm kê',
      });
    }

    // Kiểm tra xung đột thời gian
    const conflictingCounts = await CycleCountForm.find({
      area,
      status: { $in: ['pending', 'in_progress'] },
      $or: [{ startTime: { $lte: new Date(endTime) }, endTime: { $gte: new Date(startTime) } }],
    }).session(session);

    if (conflictingCounts.length > 0) {
      await session.abortTransaction();
      return res.status(400).json({
        status: 'error',
        message: 'Đã có đợt kiểm kê khác trong khoảng thời gian này',
      });
    }

    // Chọn ngẫu nhiên nhân viên (tối đa 5)
    const teamSize = Math.min(5, warehouseEmployees.length);
    const selectedEmployees = warehouseEmployees.sort(() => 0.5 - Math.random()).slice(0, teamSize);

    // Chọn trưởng nhóm
    const managerIndex = Math.floor(Math.random() * selectedEmployees.length);
    const manager = selectedEmployees[managerIndex];
    const members = selectedEmployees.filter((_, index) => index !== managerIndex);

    // Lấy danh sách vị trí
    const locations = await Location.find({ area }).session(session);
    if (!locations || locations.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({
        status: 'error',
        message: 'Không tìm thấy vị trí nào trong khu vực này',
      });
    }

    // Lấy packages trong các vị trí
    const packages = await Package.find({
      location: { $in: locations.map((loc) => loc._id) },
      status: 'active',
    }).session(session);

    // Tạo content
    const content = locations.map((location) => {
      const locationPackages = packages.filter(
        (pkg) => pkg.location.toString() === location._id.toString(),
      );

      return {
        location: location._id,
        verified: false,
        result: locationPackages.map((pkg) => ({
          Package: pkg._id,
          Status: 'pending',
          expectedQuantity: pkg.quantity || 0,
          actualQuantity: null,
          notes: '',
        })),
      };
    });

    // Tạo đợt kiểm kê
    const cycleCountData = {
      area,
      team: {
        manager: manager._id,
        members: members.map((emp) => emp._id),
      },
      status: 'pending',
      verified: false,
      approved: false,
      approvedBy: req.user._id,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      description: description || '',
      content,
    };

    const [cycleCount] = await CycleCountForm.create([cycleCountData], { session });

    // Populate dữ liệu cho response
    const populatedCycleCount = await CycleCountForm.findById(cycleCount._id)
      .populate('team.manager', 'name email')
      .populate('team.members', 'name email')
      .populate('approvedBy', 'name email')
      .populate({
        path: 'content.location',
        select: 'row bay level area',
        populate: { path: 'area', select: 'name' },
      })
      .populate({
        path: 'content.result.Package',
        select: 'name code barcode quantity',
      })
      .session(session);

    await session.commitTransaction();

    res.status(201).json({
      status: 'success',
      message: 'Tạo đợt kiểm kê thành công',
      data: { cycleCount: populatedCycleCount },
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Error in createCycleCount:', error);
    res.status(500).json({
      status: 'error',
      message: 'Lỗi hệ thống khi tạo đợt kiểm kê',
      ...(process.env.NODE_ENV === 'development' && { details: error.message }),
    });
  } finally {
    session.endSession();
  }
};

/**
 * Lấy danh sách đợt kiểm kê với phân trang và filter
 */
const getCycleCounts = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, area, startDate, endDate, search } = req.query;

    // Build filter query
    const filter = {};

    if (status) filter.status = status;
    if (area) filter.area = area;
    if (startDate || endDate) {
      filter.startTime = {};
      if (startDate) filter.startTime.$gte = new Date(startDate);
      if (endDate) filter.startTime.$lte = new Date(endDate);
    }

    // Role-based filtering
    if (req.user.role === 'warehouse') {
      filter.$or = [{ 'team.manager': req.user._id }, { 'team.members': req.user._id }];
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      populate: [
        { path: 'team.manager', select: 'name email' },
        { path: 'team.members', select: 'name email' },
        { path: 'approvedBy', select: 'name email' },
        { path: 'area', select: 'name description' },
      ],
    };

    const result = await CycleCountForm.paginate(filter, options);

    res.status(200).json({
      status: 'success',
      data: {
        cycleCounts: result.docs,
        pagination: {
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
          totalDocs: result.totalDocs,
          hasNextPage: result.hasNextPage,
          hasPrevPage: result.hasPrevPage,
        },
      },
    });
  } catch (error) {
    console.error('Error in getCycleCounts:', error);
    res.status(500).json({
      status: 'error',
      message: 'Lỗi hệ thống khi lấy danh sách đợt kiểm kê',
    });
  }
};

/**
 * Cập nhật trạng thái vị trí
 */
const updateLocationStatus = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { locationId, packageResults, notes } = req.body;

    if (!packageResults || !Array.isArray(packageResults)) {
      return res.status(400).json({
        status: 'error',
        message: 'Dữ liệu kết quả package không hợp lệ',
      });
    }

    const cycleCount = await CycleCountForm.findById(id).session(session);
    if (!cycleCount) {
      await session.abortTransaction();
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy đợt kiểm kê',
      });
    }

    // Kiểm tra quyền
    const isAuthorized =
      cycleCount.team.members.includes(req.user._id) ||
      cycleCount.team.manager.toString() === req.user._id.toString() ||
      req.user.role === 'supervisor';

    if (!isAuthorized) {
      await session.abortTransaction();
      return res.status(403).json({
        status: 'error',
        message: 'Bạn không có quyền cập nhật trạng thái',
      });
    }

    // Kiểm tra thời gian
    const now = new Date();
    if (now < cycleCount.startTime || now > cycleCount.endTime) {
      await session.abortTransaction();
      return res.status(400).json({
        status: 'error',
        message: 'Đợt kiểm kê chưa bắt đầu hoặc đã kết thúc',
      });
    }

    // Tìm và cập nhật location content
    const locationContent = cycleCount.content.find(
      (content) => content.location.toString() === locationId,
    );

    if (!locationContent) {
      await session.abortTransaction();
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy vị trí trong đợt kiểm kê',
      });
    }

    if (locationContent.verified) {
      await session.abortTransaction();
      return res.status(400).json({
        status: 'error',
        message: 'Vị trí này đã được kiểm tra',
      });
    }

    // Cập nhật dữ liệu
    locationContent.verified = true;
    locationContent.verifiedBy = req.user._id;
    locationContent.verifiedAt = new Date();
    locationContent.result = packageResults.map((result) => ({
      Package: result.Package,
      Status: result.Status || 'checked',
      expectedQuantity: result.expectedQuantity || 0,
      actualQuantity: result.actualQuantity || 0,
      variance: (result.actualQuantity || 0) - (result.expectedQuantity || 0),
      notes: result.notes || '',
    }));
    locationContent.notes = notes || '';

    // Cập nhật trạng thái tổng thể
    const allVerified = cycleCount.content.every((content) => content.verified);
    if (allVerified && cycleCount.status === 'pending') {
      cycleCount.status = 'waiting_approval';
    } else if (cycleCount.status === 'pending') {
      cycleCount.status = 'in_progress';
    }

    await cycleCount.save({ session });
    await session.commitTransaction();

    // Populate và trả về dữ liệu
    const updatedCycleCount = await CycleCountForm.findById(id)
      .populate('team.manager', 'name email')
      .populate('team.members', 'name email')
      .populate({
        path: 'content.location',
        select: 'row bay level area',
        populate: { path: 'area', select: 'name' },
      })
      .populate({
        path: 'content.verifiedBy',
        select: 'name email',
      });

    res.status(200).json({
      status: 'success',
      message: 'Cập nhật trạng thái vị trí thành công',
      data: { cycleCount: updatedCycleCount },
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Error in updateLocationStatus:', error);
    res.status(500).json({
      status: 'error',
      message: 'Lỗi hệ thống khi cập nhật trạng thái vị trí',
    });
  } finally {
    session.endSession();
  }
};

/**
 * Phê duyệt đợt kiểm kê
 */
const approveCycleCount = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { approved, comments } = req.body;

    const cycleCount = await CycleCountForm.findById(id).session(session);
    if (!cycleCount) {
      await session.abortTransaction();
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy đợt kiểm kê',
      });
    }

    // Kiểm tra trạng thái
    if (cycleCount.status !== 'waiting_approval') {
      await session.abortTransaction();
      return res.status(400).json({
        status: 'error',
        message: 'Đợt kiểm kê không ở trạng thái chờ phê duyệt',
      });
    }

    // Cập nhật trạng thái
    cycleCount.status = approved ? 'completed' : 'rejected';
    cycleCount.approved = approved;
    cycleCount.approvedBy = req.user._id;
    cycleCount.approvedAt = new Date();
    cycleCount.approvalComments = comments || '';

    // Nếu được phê duyệt, cập nhật inventory
    if (approved) {
      // TODO: Implement inventory update logic here
      // await updateInventoryFromCycleCount(cycleCount, session);
    }

    await cycleCount.save({ session });
    await session.commitTransaction();

    res.status(200).json({
      status: 'success',
      message: `Đợt kiểm kê đã được ${approved ? 'phê duyệt' : 'từ chối'}`,
      data: { cycleCount },
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Error in approveCycleCount:', error);
    res.status(500).json({
      status: 'error',
      message: 'Lỗi hệ thống khi phê duyệt đợt kiểm kê',
    });
  } finally {
    session.endSession();
  }
};

/**
 * Cập nhật trạng thái đợt kiểm kê
 */
const updateCycleCountStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    const validStatuses = [
      'pending',
      'in_progress',
      'waiting_approval',
      'completed',
      'rejected',
      'cancelled',
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: `Trạng thái không hợp lệ. Chỉ chấp nhận: ${validStatuses.join(', ')}`,
      });
    }

    const cycleCount = await CycleCountForm.findById(id);
    if (!cycleCount) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy đợt kiểm kê',
      });
    }

    // Validate status transition
    const validTransitions = {
      pending: ['in_progress', 'cancelled'],
      in_progress: ['waiting_approval', 'cancelled'],
      waiting_approval: ['completed', 'rejected'],
      completed: [],
      rejected: ['pending'],
      cancelled: [],
    };

    if (!validTransitions[cycleCount.status].includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: `Không thể chuyển từ trạng thái "${cycleCount.status}" sang "${status}"`,
      });
    }

    // Cập nhật
    cycleCount.status = status;
    cycleCount.statusUpdatedBy = req.user._id;
    cycleCount.statusUpdatedAt = new Date();
    if (reason) cycleCount.statusReason = reason;

    await cycleCount.save();

    const updatedCycleCount = await CycleCountForm.findById(id)
      .populate('team.manager', 'name email')
      .populate('team.members', 'name email')
      .populate('approvedBy', 'name email')
      .populate('statusUpdatedBy', 'name email');

    res.status(200).json({
      status: 'success',
      message: 'Cập nhật trạng thái thành công',
      data: { cycleCount: updatedCycleCount },
    });
  } catch (error) {
    console.error('Error in updateCycleCountStatus:', error);
    res.status(500).json({
      status: 'error',
      message: 'Lỗi hệ thống khi cập nhật trạng thái',
    });
  }
};

module.exports = {
  validateCycleCountInput,
  authorizeRole,
  getDetailForManager,
  createCycleCount,
  getCycleCounts,
  updateLocationStatus,
  approveCycleCount,
  updateCycleCountStatus,
};
