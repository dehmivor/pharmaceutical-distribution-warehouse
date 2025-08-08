const InventoryCheckInspection = require("../models/InventoryCheckInspection")
const InventoryCheckOrder = require("../models/InventoryCheckOrder")
const Package = require("../models/Package") // Import Package model
const Location = require("../models/Location") // Import Location model
const mongoose = require("mongoose") // Import mongoose for transactions
const { INVENTORY_CHECK_INSPECTION_STATUSES } = require("../utils/constants")
const PackageService = require("./packageService") // Declare PackageService variable

const getInspectionsByOrderId = async (orderId) => {
  const order = await InventoryCheckOrder.findById(orderId)
  if (!order) {
    const err = new Error("Inventory check order not found")
    err.statusCode = 404
    throw err
  }
  const inspections = await InventoryCheckInspection.find({ inventory_check_order_id: orderId })
    .select("-check_list")
    .populate({
      path: "location_id",
      select: "area_id bay row column",
      populate: {
        path: "area_id",
        model: "Area",
        select: "name",
      },
    })
    .lean()
  return inspections
}

const changeInspectionStatus = async (inspectionId, newStatus) => {
  const inspection = await InventoryCheckInspection.findById(inspectionId)
  if (!inspection) {
    const err = new Error("Inspection not found")
    err.statusCode = 404
    throw err
  }
  inspection.status = newStatus
  await inspection.save()
  return inspection
}

const addCheckBy = async (inspectionId, userId) => {
  const inspection = await InventoryCheckInspection.findById(inspectionId)
  if (!inspection) {
    const err = new Error("Inspection not found")
    err.statusCode = 404
    throw err
  }
  inspection.check_by = userId
  await inspection.save()
  return inspection
}

const createInitialCheckItem = async (inspectionId) => {
  const inspection = await InventoryCheckInspection.findById(inspectionId)
  if (!inspection) {
    const err = new Error("Inspection not found")
    err.statusCode = 404
    throw err
  }
  // Assuming PackageService.getPackagesByLocation is available and returns { success, packages, message }
  const { success, packages, message } = await PackageService.getPackagesByLocation(inspection.location_id)
  if (!success) {
    const err = new Error(message || "Failed to fetch packages")
    err.statusCode = 400
    throw err
  }
  let added = 0
  for (const pkg of packages) {
    const exists = inspection.check_list.some((item) => item.package_id.toString() === pkg._id.toString())
    if (!exists) {
      inspection.check_list.push({
        package_id: pkg._id,
        expected_quantity: pkg.quantity,
        actual_quantity: pkg.quantity,
        type: "valid",
      })
      added++
    }
  }
  if (added > 0) {
    await inspection.save()
  }
  return inspection
}

const getCheckItemsByInspectionId = async (inspectionId) => {
  const inspection = await InventoryCheckInspection.findById(inspectionId).populate({
    path: "check_list.package_id",
    select: "batch_id",
    populate: {
      path: "batch_id",
      select: "medicine_id batch_code",
      populate: {
        path: "medicine_id",
        select: "medicine_name license_code",
      },
    },
  })
  if (!inspection) {
    const err = new Error("Inspection not found")
    err.statusCode = 404
    throw err
  }
  return inspection.check_list
}

const upsertCheckItem = async (inspectionId, item) => {
  const inspection = await InventoryCheckInspection.findById(inspectionId)
  if (!inspection) {
    const err = new Error("Inspection not found")
    err.statusCode = 404
    throw err
  }
  const existing = inspection.check_list.find((ci) => ci.package_id.toString() === item.package_id)
  if (existing) {
    existing.expected_quantity = item.expected_quantity
    existing.actual_quantity = item.actual_quantity
    existing.type = item.type || existing.type
  } else {
    inspection.check_list.push({
      package_id: item.package_id,
      expected_quantity: item.expected_quantity,
      actual_quantity: item.actual_quantity,
      type: item.type || "valid",
    })
  }
  await inspection.save()
  return inspection
}

const clearInspectionsByOrderId = async (orderId) => {
  const inspections = await InventoryCheckInspection.find({ inventory_check_order_id: orderId })

  if (!inspections || inspections.length === 0) {
    return null
  }

  const updatedInspections = []
  for (const inspection of inspections) {
    const updatedCheckList = inspection.check_list.map((item) => ({
      ...item.toObject(),
      actual_quantity: 0
    }))

    inspection.status = INVENTORY_CHECK_INSPECTION_STATUSES.DRAFT
    inspection.check_list = updatedCheckList

    await inspection.save()
    updatedInspections.push(inspection)
  }

  return updatedInspections
}

const updateCheckOrderStatus = async (checkOrderId, status) => {
  console.log(`Attempting to update order status for ID: ${checkOrderId} to status: ${status}`)
  const updatedOrder = await InventoryCheckOrder.findByIdAndUpdate(
    checkOrderId,
    { status },
    { new: true, runValidators: true },
  )
  if (!updatedOrder) {
    console.log(`Order with ID ${checkOrderId} not found or update failed.`)
    const err = new Error("Check Order not found")
    err.statusCode = 404
    throw err
  }
  console.log(`Order ${checkOrderId} updated successfully. New status: ${updatedOrder.status}`)
  return updatedOrder
}

const applyInspectionResults = async (checkOrderId) => {
  const session = await mongoose.startSession() // Start a session for transaction
  session.startTransaction()

  try {
    const inspections = await InventoryCheckInspection.find({ inventory_check_order_id: checkOrderId })
      .populate({
        path: "check_list.package_id",
        model: "Package", // Ensure correct model reference
      })
      .populate("location_id") // Populate the inspection's location
      .session(session)

    if (!inspections || inspections.length === 0) {
      throw new Error("No inspections found for this order to apply results.")
    }

    for (const inspection of inspections) {
      const inspectionLocationId = inspection.location_id?._id // The location where the inspection happened

      for (const item of inspection.check_list) {
        const pkg = item.package_id // This is the populated Package document
        if (!pkg) {
          console.warn(`Package with ID ${item.package_id} not found for inspection item. Skipping.`)
          continue
        }

        // 1. Cập nhật quantity của Package theo actual_quantity từ inspection
        pkg.quantity = item.actual_quantity

        // 2. Handle location changes based on item type
        const currentPackageLocationId = pkg.location_id

        if (item.type === "over_expected") {
          // Package was found here but not expected. Move it to this inspection's location.
          if (!inspectionLocationId) {
            console.warn(
              `Inspection ${inspection._id} has no location_id. Cannot move over_expected package ${pkg._id}.`,
            )
            continue
          }

          // Update package's location
          pkg.location_id = inspectionLocationId

          // Mark new location as unavailable
          await Location.findByIdAndUpdate(inspectionLocationId, { available: false }, { session })

          // If package had a different old location, mark it as available
          if (currentPackageLocationId && !currentPackageLocationId.equals(inspectionLocationId)) {
            // Check if any other package is still in the old location before marking it available
            const otherPackagesInOldLocation = await Package.countDocuments({
              location_id: currentPackageLocationId,
              _id: { $ne: pkg._id }, // Exclude the current package
            }).session(session)

            if (otherPackagesInOldLocation === 0) {
              await Location.findByIdAndUpdate(currentPackageLocationId, { available: true }, { session })
            }
          }
        } else if (item.type === "under_expected") {
          // Package was expected here but not found. Clear its location.
          if (pkg.location_id) {
            const oldLocationId = pkg.location_id
            pkg.location_id = null // Clear location

            // Mark old location as available
            // Check if any other package is still in the old location before marking it available
            const otherPackagesInOldLocation = await Package.countDocuments({
              location_id: oldLocationId,
              _id: { $ne: pkg._id }, // Exclude the current package
            }).session(session)

            if (otherPackagesInOldLocation === 0) {
              await Location.findByIdAndUpdate(oldLocationId, { available: true }, { session })
            }
          }
        }
        // For 'valid' or other types, only quantity is updated, location remains as is.

        await pkg.save({ session }) // Save the updated package
      }
    }

    // Update the InventoryCheckOrder status to completed
    await InventoryCheckOrder.findByIdAndUpdate(
      checkOrderId,
      { status: INVENTORY_CHECK_INSPECTION_STATUSES.COMPLETED },
      { new: true, session },
    )

    await session.commitTransaction()
    return { success: true, message: "Inspection results applied and order completed." }
  } catch (error) {
    await session.abortTransaction()
    console.error("Error applying inspection results:", error)
    throw error // Re-throw to be caught by the controller
  } finally {
    session.endSession()
  }
}

const deleteCheckItem = async (inspectionId, packageId) => {
  const inspection = await InventoryCheckInspection.findById(inspectionId)
  if (!inspection) {
    const err = new Error("Inspection not found")
    err.statusCode = 404
    throw err
  }

  // Use $pull to remove the item from the check_list array
  inspection.check_list.pull({ package_id: packageId })
  await inspection.save()
  return inspection
}

module.exports = {
  getInspectionsByOrderId,
  changeInspectionStatus,
  addCheckBy,
  createInitialCheckItem,
  getCheckItemsByInspectionId,
  upsertCheckItem,
  clearInspectionsByOrderId,
  updateCheckOrderStatus,
  applyInspectionResults, // Export the new service function
  deleteCheckItem, // Export the deleteCheckItem service function
}
