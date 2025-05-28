const mongoose = require('mongoose');

const CycleCountFormModel = require('../models/CycleCountForm.model')


const getDetailForManager = async (req, res, next) => {
  try {
    const { id } = req.params;

    const form = await CycleCountFormModel.findById(id)
      .populate('team.manager', 'name')
      .populate('team.members', 'name')
      .populate({
        path: 'content.location',
        populate: { path: 'area', select: 'name row level bay' }
      })
      .exec();

    console.log('🔍 RAW FORM:', JSON.stringify(form, null, 2));

    if (!form) {
      return res.status(404).json({
        success: false,
        message: `CycleCountForm with id=${id} not found`
      });
    }

    const detailed = {
      id: form._id,
      team: {
        manager: form.team.manager?.name || null,
        members: form.team.members.map(m => m.name || null),
      },
      status: form.status,
      verified: form.verified,
      approved: form.approved,
      startTime: form.startTime,
      endTime: form.endTime,
      content: form.content.map(section => {
        const loc = section.location || {};
        const areaName = loc.area?.name || 'UnknownArea';
        const row = loc.row || 'UnknownRow';
        const level = loc.level || 'UnknownLevel';
        const bay = loc.bay || 'UnknownBay';

        return {
          location: `${areaName}-${row}-${level}-${bay}`,
          verified: section.verified,
          verifiedBy: section.verifiedBy || null,
          result: section.result.map(r => ({
            Package: r.Package,
            Status: r.Status
          }))
        };
      })
    };

    return res.status(200).json({
      success: true,
      data: detailed
    });

  } catch (error) {
    console.error('Error in getDetailForManager:', error);
    return next(error);
  }
};

const updateFormStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // 1. Validate incoming status
    const allowed = [
      'pending',
      'in_progress',
      'waiting_approval',
      'completed',
      'rejected'
    ];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status "${status}". Must be one of: ${allowed.join(', ')}.`
      });
    }

    // 2. Find-and-update
    const form = await CycleCountForm.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    )
      .populate('team.manager', 'name')
      .populate('team.members', 'name')
      .populate({
        path: 'content.location',
        select: 'row bay level area',
        populate: { path: 'area', select: 'name' }
      })
      .exec();

    // 3. Not found?
    if (!form) {
      return res.status(404).json({
        success: false,
        message: `CycleCountForm with id=${id} not found.`
      });
    }

    // 4. Respond with updated form (or just the new status—here we return the form)
    return res.status(200).json({
      success: true,
      data: form
    });
  } catch (err) {
    console.error('Error in updateFormStatus:', err);
    return next(err);
  }
};

module.exports = {
  getDetailForManager,
  updateFormStatus
}