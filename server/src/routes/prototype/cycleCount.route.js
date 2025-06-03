// const mongoose = require('mongoose');
// const CycleCountForm = require('../models/CycleCountForm.model');
// const Employee = require('../models/Employee.model');
// const Location = require('../models/Location.model');
// const Package = require('../models/Package.model');

// // Lấy chi tiết đợt kiểm kê cho trưởng nhóm (danh sách tất cả)
// const getDetailForManager = async (req, res) => {
//   try {
//     const cycleCounts = await CycleCountForm.find({
//       'team.manager': req.user._id,
//     })
//       .populate('area')
//       .populate('team.members.employee', 'name email')
//       .populate('locations.location')
//       .populate('locations.checkedBy', 'name email');

//     res.status(200).json({
//       status: 'success',
//       data: {
//         cycleCounts,
//       },
//     });
//   } catch (error) {
//     res.status(500).json({
//       status: 'error',
//       message: error.message,
//     });
//   }
// };

// // Lấy chi tiết form kiểm kê theo ID
// const getFormDetailById = async (req, res, next) => {
//   try {
//     const { id } = req.params;

//     const form = await CycleCountForm.findById(id)
//       .populate('team.manager', 'name')
//       .populate('team.members', 'name')
//       .populate({
//         path: 'content.location',
//         populate: { path: 'area', select: 'name row level bay' },
//       })
//       .exec();

//     console.log('🔍 RAW FORM:', JSON.stringify(form, null, 2));

//     if (!form) {
//       return res.status(404).json({
//         success: false,
//         message: `CycleCountForm with id=${id} not found`,
//       });
//     }

//     const detailed = {
//       id: form._id,
//       team: {
//         manager: form.team.manager?.name || null,
//         members: form.team.members.map((m) => m.name || null),
//       },
//       status: form.status,
//       verified: form.verified,
//       approved: form.approved,
//       startTime: form.startTime,
//       endTime: form.endTime,
//       content: form.content.map((section) => {
//         const loc = section.location || {};
//         const areaName = loc.area?.name || 'UnknownArea';
//         const row = loc.row || 'UnknownRow';
//         const level = loc.level || 'UnknownLevel';
//         const bay = loc.bay || 'UnknownBay';

//         return {
//           location: `${areaName}-${row}-${level}-${bay}`,
//           verified: section.verified,
//           verifiedBy: section.verifiedBy || null,
//           result: section.result.map((r) => ({
//             Package: r.Package,
//             Status: r.Status,
//           })),
//         };
//       }),
//     };

//     return res.status(200).json({
//       success: true,
//       data: detailed,
//     });
//   } catch (error) {
//     console.error('Error in getFormDetailById:', error);
//     return next(error);
//   }
// };

// // Tạo đợt kiểm kê mới
// const createCycleCount = async (req, res) => {
//   try {
//     const { area, startTime, endTime } = req.body;

//     // Kiểm tra quyền
//     if (req.user.role !== 'supervisor') {
//       return res.status(403).json({
//         status: 'error',
//         message: 'Chỉ giám sát mới có quyền tạo đợt kiểm kê',
//       });
//     }

//     // Kiểm tra thời gian
//     if (new Date(endTime) <= new Date(startTime)) {
//       return res.status(400).json({
//         status: 'error',
//         message: 'Thời gian kết thúc phải sau thời gian bắt đầu',
//       });
//     }

//     // Lấy danh sách nhân viên kho
//     const warehouseEmployees = await Employee.find({ role: 'warehouse' });

//     if (warehouseEmployees.length < 3) {
//       return res.status(400).json({
//         status: 'error',
//         message: 'Cần ít nhất 3 nhân viên kho để tạo đợt kiểm kê',
//       });
//     }

//     // Chọn ngẫu nhiên 5 nhân viên
//     const selectedEmployees = warehouseEmployees.sort(() => 0.5 - Math.random()).slice(0, 5);

//     // Chọn ngẫu nhiên 1 trưởng nhóm
//     const managerIndex = Math.floor(Math.random() * selectedEmployees.length);
//     const manager = selectedEmployees[managerIndex];
//     const members = selectedEmployees.filter((_, index) => index !== managerIndex);

//     // Lấy danh sách vị trí từ khu vực
//     const locations = await Location.find({ area });
//     if (!locations || locations.length === 0) {
//       return res.status(400).json({
//         status: 'error',
//         message: 'Không tìm thấy vị trí nào trong khu vực này',
//       });
//     }

//     // Lấy danh sách package trong các vị trí
//     const packages = await Package.find({ location: { $in: locations.map((loc) => loc._id) } });

//     // Tạo content cho từng vị trí
//     const content = locations.map((location) => {
//       const locationPackages = packages.filter(
//         (pkg) => pkg.location.toString() === location._id.toString(),
//       );
//       return {
//         location: location._id,
//         verified: false,
//         result: locationPackages.map((pkg) => ({
//           package: pkg._id, // ✅ Sửa: 'package' (chữ p thường)
//           status: 'pending', // ✅ Sửa: 'status' (chữ s thường)
//         })),
//       };
//     });

//     // Tạo đợt kiểm kê mới
//     const cycleCount = await CycleCountForm.create({
//       team: {
//         manager: manager._id,
//         members: members.map((emp) => emp._id),
//       },
//       status: 'pending',
//       verified: false,
//       approvedBy: req.user._id,
//       startTime,
//       endTime,
//       content,
//     });

//     const populatedCycleCount = await CycleCountForm.findById(cycleCount._id)
//       .populate('team.manager', 'name email')
//       .populate('team.members', 'name email')
//       .populate('approvedBy', 'name email')
//       .populate({
//         path: 'content.location',
//         select: 'row bay level area',
//       })
//       .populate({
//         path: 'content.verifiedBy',
//         select: 'name email',
//       })
//       .populate({
//         path: 'content.result.package', // ✅ Sửa: 'package' (chữ p thường)
//         select: 'name code',
//       });

//     res.status(201).json({
//       status: 'success',
//       data: {
//         cycleCount: populatedCycleCount,
//       },
//     });
//   } catch (error) {
//     res.status(500).json({
//       status: 'error',
//       message: error.message,
//     });
//   }
// };

// // Lấy danh sách đợt kiểm kê
// const getCycleCounts = async (req, res) => {
//   try {
//     const cycleCounts = await CycleCountForm.find()
//       .populate('team.manager', 'name email')
//       .populate('team.members', 'name email')
//       .populate('approvedBy', 'name email')
//       .populate({
//         path: 'content.location',
//         select: 'row bay level area',
//       })
//       .populate({
//         path: 'content.verifiedBy',
//         select: 'name email',
//       })
//       .populate({
//         path: 'content.result.package',
//         select: 'name code',
//       });

//     res.status(200).json({
//       status: 'success',
//       data: {
//         cycleCounts,
//       },
//     });
//   } catch (error) {
//     res.status(500).json({
//       status: 'error',
//       message: error.message,
//     });
//   }
// };

// // Lấy chi tiết đợt kiểm kê
// const getCycleCountDetail = async (req, res) => {
//   try {
//     const cycleCount = await CycleCountForm.findById(req.params.id)
//       .populate('team.manager', 'name email')
//       .populate('team.members', 'name email')
//       .populate('approvedBy', 'name email')
//       .populate({
//         path: 'content.location',
//         select: 'row bay level area',
//       })
//       .populate({
//         path: 'content.verifiedBy',
//         select: 'name email',
//       })
//       .populate({
//         path: 'content.result.Package',
//         select: 'name code',
//       });

//     if (!cycleCount) {
//       return res.status(404).json({
//         status: 'error',
//         message: 'Không tìm thấy đợt kiểm kê',
//       });
//     }

//     res.status(200).json({
//       status: 'success',
//       data: {
//         cycleCount,
//       },
//     });
//   } catch (error) {
//     res.status(500).json({
//       status: 'error',
//       message: error.message,
//     });
//   }
// };

// // Cập nhật trạng thái vị trí
// const updateLocationStatus = async (req, res) => {
//   try {
//     const { locationId, status, notes, packageResults } = req.body;

//     const cycleCount = await CycleCountForm.findById(req.params.id);
//     if (!cycleCount) {
//       return res.status(404).json({
//         status: 'error',
//         message: 'Không tìm thấy đợt kiểm kê',
//       });
//     }

//     // Kiểm tra quyền
//     const isTeamMember = cycleCount.team.members.includes(req.user._id);
//     if (!isTeamMember && cycleCount.team.manager.toString() !== req.user._id.toString()) {
//       return res.status(403).json({
//         status: 'error',
//         message: 'Bạn không có quyền cập nhật trạng thái',
//       });
//     }

//     // Cập nhật trạng thái
//     const locationContent = cycleCount.content.find(
//       (content) => content.location.toString() === locationId,
//     );
//     if (!locationContent) {
//       return res.status(404).json({
//         status: 'error',
//         message: 'Không tìm thấy vị trí',
//       });
//     }

//     locationContent.verified = true;
//     locationContent.verifiedBy = req.user._id;
//     locationContent.result = packageResults;

//     // Kiểm tra nếu tất cả vị trí đã được kiểm tra
//     const allVerified = cycleCount.content.every((content) => content.verified);
//     if (allVerified) {
//       cycleCount.status = 'waiting_approval';
//     }

//     await cycleCount.save();

//     res.status(200).json({
//       status: 'success',
//       data: {
//         cycleCount,
//       },
//     });
//   } catch (error) {
//     res.status(500).json({
//       status: 'error',
//       message: error.message,
//     });
//   }
// };

// // Phê duyệt đợt kiểm kê
// const approveCycleCount = async (req, res) => {
//   try {
//     const cycleCount = await CycleCountForm.findById(req.params.id);
//     if (!cycleCount) {
//       return res.status(404).json({
//         status: 'error',
//         message: 'Không tìm thấy đợt kiểm kê',
//       });
//     }

//     // Kiểm tra quyền
//     if (req.user.role !== 'supervisor') {
//       return res.status(403).json({
//         status: 'error',
//         message: 'Chỉ giám sát mới có quyền phê duyệt',
//       });
//     }

//     // Kiểm tra trạng thái
//     if (cycleCount.status !== 'waiting_approval') {
//       return res.status(400).json({
//         status: 'error',
//         message: 'Đợt kiểm kê chưa sẵn sàng để phê duyệt',
//       });
//     }

//     // Cập nhật trạng thái
//     cycleCount.status = 'completed';
//     cycleCount.verified = true;
//     cycleCount.approvedBy = req.user._id;

//     await cycleCount.save();

//     res.status(200).json({
//       status: 'success',
//       data: {
//         cycleCount,
//       },
//     });
//   } catch (error) {
//     res.status(500).json({
//       status: 'error',
//       message: error.message,
//     });
//   }
// };

// const updateFormStatus = async (req, res, next) => {
//   try {
//     const { id } = req.params;
//     const { status } = req.body;

//     // 1. Validate incoming status
//     const allowed = ['pending', 'in_progress', 'waiting_approval', 'completed', 'rejected'];
//     if (!allowed.includes(status)) {
//       return res.status(400).json({
//         success: false,
//         message: `Invalid status "${status}". Must be one of: ${allowed.join(', ')}.`,
//       });
//     }

//     // 2. Find-and-update
//     const form = await CycleCountForm.findByIdAndUpdate(
//       id,
//       { status },
//       { new: true, runValidators: true },
//     )
//       .populate('team.manager', 'name')
//       .populate('team.members', 'name')
//       .populate({
//         path: 'content.location',
//         select: 'row bay level area',
//         populate: { path: 'area', select: 'name' },
//       })
//       .exec();

//     // 3. Not found?
//     if (!form) {
//       return res.status(404).json({
//         success: false,
//         message: `CycleCountForm with id=${id} not found.`,
//       });
//     }

//     // 4. Respond with updated form (or just the new status—here we return the form)
//     return res.status(200).json({
//       success: true,
//       data: form,
//     });
//   } catch (err) {
//     console.error('Error in updateFormStatus:', err);
//     return next(err);
//   }
// };

// // Cập nhật trạng thái đợt kiểm kê (phiên bản mở rộng)
// const updateCycleCountStatus = async (req, res) => {
//   try {
//     const { status } = req.body;
//     const cycleCount = await CycleCountForm.findById(req.params.id);

//     if (!cycleCount) {
//       return res.status(404).json({
//         status: 'error',
//         message: 'Không tìm thấy đợt kiểm kê',
//       });
//     }

//     // Kiểm tra quyền
//     if (req.user.role !== 'supervisor') {
//       return res.status(403).json({
//         status: 'error',
//         message: 'Chỉ giám sát mới có quyền cập nhật trạng thái',
//       });
//     }

//     // Kiểm tra trạng thái hợp lệ
//     const validStatuses = ['pending', 'in_progress', 'waiting_approval', 'completed', 'rejected'];
//     if (!validStatuses.includes(status)) {
//       return res.status(400).json({
//         status: 'error',
//         message: 'Trạng thái không hợp lệ',
//       });
//     }

//     // Cập nhật trạng thái
//     cycleCount.status = status;
//     await cycleCount.save();

//     // Populate thông tin chi tiết
//     const populatedCycleCount = await CycleCountForm.findById(cycleCount._id)
//       .populate('team.manager', 'name email')
//       .populate('team.members', 'name email')
//       .populate('approvedBy', 'name email')
//       .populate({
//         path: 'content.location',
//         select: 'row bay level area',
//       })
//       .populate({
//         path: 'content.verifiedBy',
//         select: 'name email',
//       })
//       .populate({
//         path: 'content.result.package', // ✅ Sửa: 'package' (chữ p thường)
//         select: 'name code',
//       });

//     res.status(200).json({
//       status: 'success',
//       data: {
//         cycleCount: populatedCycleCount,
//       },
//     });
//   } catch (error) {
//     res.status(500).json({
//       status: 'error',
//       message: error.message,
//     });
//   }
// };

// module.exports = {
//   getDetailForManager,
//   getFormDetailById,
//   createCycleCount,
//   getCycleCounts,
//   getCycleCountDetail,
//   updateLocationStatus,
//   approveCycleCount,
//   updateFormStatus,
//   updateCycleCountStatus,
// };

// const express = require('express');
// const router = express.Router();

// const cycleCountFormController = require('../controllers/CycleCountForm.controller');

// router.get('/cyclecountform/:id', cycleCountFormController.getDetailForManager);
// router.patch('/cyclecountform/:id/status', cycleCountFormController.updateFormStatus);

// module.exports = router;
