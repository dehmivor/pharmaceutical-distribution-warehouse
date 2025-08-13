const InventoryCheckInspection = require("../models/InventoryCheckInspection")
const InventoryCheckOrder = require("../models/InventoryCheckOrder")
const Package = require("../models/Package") // Import Package model
const Location = require("../models/Location") // Import Location model
const LogLocationChange = require("../models/LogLocationChange") // Import LogLocationChange model for logging location changes
const mongoose = require("mongoose") // Import mongoose for transactions
const { INVENTORY_CHECK_ORDER_STATUSES, INVENTORY_CHECK_INSPECTION_STATUSES } = require("../utils/constants")
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
    const checkOrder = await InventoryCheckOrder.findById(checkOrderId).session(session)
    if (!checkOrder) {
      throw new Error("Inventory check order not found")
    }

    const inspections = await InventoryCheckInspection.find({ inventory_check_order_id: checkOrderId })
      .populate("location_id") // Populate the inspection's location
      .session(session)

    if (!inspections || inspections.length === 0) {
      throw new Error("No inspections found for this order to apply results.")
    }

    console.log(`Found ${inspections.length} inspections for order ${checkOrderId}`)

    // Map to store the final determined update for each package
    // Key: package_id (string), Value: { item: InspectionCheckItem, inspectionLocationId: ObjectId }
    const packageUpdatesMap = new Map()

    for (const inspection of inspections) {
      const inspectionLocationId = inspection.location_id?._id // The location where the inspection happened
      console.log(`Processing inspection ${inspection._id} with ${inspection.check_list.length} items`)

      for (const item of inspection.check_list) {
        const packageIdString = item.package_id.toString()
        const existingEntry = packageUpdatesMap.get(packageIdString)

        // Prioritization logic: 'over_expected' > 'valid' > 'under_expected'
        // If current item is 'over_expected', it always takes precedence.
        // If current item is 'valid' and existing is not 'over_expected', it takes precedence.
        // Otherwise, existing entry (if any) remains.
        if (!existingEntry) {
          packageUpdatesMap.set(packageIdString, { item: item, inspectionLocationId: inspectionLocationId })
        } else {
          const existingType = existingEntry.item.type
          const currentType = item.type

          if (currentType === "over_expected") {
            // Current is 'over_expected', it always takes precedence
            packageUpdatesMap.set(packageIdString, { item: item, inspectionLocationId: inspectionLocationId })
          } else if (currentType === "valid" && existingType !== "over_expected") {
            // Current is 'valid', and existing is not 'over_expected' (so it's 'under_expected' or 'valid')
            // 'valid' takes precedence over 'under_expected'. If existing is also 'valid', current 'valid' replaces it.
            packageUpdatesMap.set(packageIdString, { item: item, inspectionLocationId: inspectionLocationId })
          }
          // If current is 'under_expected', it will only be set if no existing entry (handled by !existingEntry).
          // It will not replace 'over_expected' or 'valid'.
        }
      }
    }

    // Now, iterate through the determined package updates and apply them
    for (const [packageIdString, { item, inspectionLocationId }] of packageUpdatesMap.entries()) {
      console.log(
        `Applying update for package: ${packageIdString}, actual_quantity = ${item.actual_quantity}, type = ${item.type}`,
      )

      const pkg = await Package.findById(packageIdString).populate("batch_id").session(session)
      if (!pkg) {
        console.warn(`Package with ID ${packageIdString} not found in database. Skipping update.`)
        continue
      }

      const currentPackageLocationId = pkg.location_id
      const originalQuantity = pkg.quantity

      if (item.actual_quantity === 0) {
        // Delete the package when quantity is 0
        await Package.findByIdAndDelete(packageIdString, { session })
        console.log(`Package ${packageIdString} deleted due to zero quantity`)

        if (pkg.batch_id && currentPackageLocationId && originalQuantity > 0) {
          await LogLocationChange.create(
            [
              {
                location_id: currentPackageLocationId,
                type: "remove",
                batch_id: pkg.batch_id._id,
                quantity: originalQuantity,
                inventory_check_order_id: checkOrderId,
                ware_house_id: checkOrder.warehouse_manager_id,
              },
            ],
            { session },
          )
          console.log(`Created removal log for deleted package ${packageIdString}`)
        }

        // Mark the package's current location as available if no other packages remain there
        if (currentPackageLocationId) {
          const otherPackagesInCurrentLocation = await Package.countDocuments({
            location_id: currentPackageLocationId,
            _id: { $ne: pkg._id }, // Exclude the current package (though it's being deleted)
          }).session(session)
          if (otherPackagesInCurrentLocation === 0) {
            await Location.findByIdAndUpdate(currentPackageLocationId, { available: true }, { session })
            console.log(`Location ${currentPackageLocationId} marked as available after package deletion`)
          }
        }
      } else {
        // Update package quantity and location if quantity > 0
        const updateData = { quantity: item.actual_quantity }

        if (item.type === "over_expected") {
          if (!inspectionLocationId) {
            console.warn(
              `Inspection for package ${packageIdString} has no location_id. Cannot move over_expected package.`,
            )
            continue
          }
          updateData.location_id = inspectionLocationId

          if (pkg.batch_id && currentPackageLocationId && !currentPackageLocationId.equals(inspectionLocationId)) {
            if (originalQuantity > 0) {
              await LogLocationChange.create(
                [
                  {
                    location_id: currentPackageLocationId,
                    type: "remove",
                    batch_id: pkg.batch_id._id,
                    quantity: originalQuantity,
                    inventory_check_order_id: checkOrderId,
                    ware_house_id: checkOrder.warehouse_manager_id,
                  },
                ],
                { session },
              )
            }

            if (item.actual_quantity > 0) {
              await LogLocationChange.create(
                [
                  {
                    location_id: inspectionLocationId,
                    type: "add",
                    batch_id: pkg.batch_id._id,
                    quantity: item.actual_quantity,
                    inventory_check_order_id: checkOrderId,
                    ware_house_id: checkOrder.warehouse_manager_id,
                  },
                ],
                { session },
              )
            }
            console.log(`Created location change logs for package ${packageIdString}`)
          }

          // Mark new location as unavailable
          await Location.findByIdAndUpdate(inspectionLocationId, { available: false }, { session })

          // If package had a different old location, mark it as available
          if (currentPackageLocationId && !currentPackageLocationId.equals(inspectionLocationId)) {
            const otherPackagesInOldLocation = await Package.countDocuments({
              location_id: currentPackageLocationId,
              _id: { $ne: pkg._id }, // Exclude the current package
            }).session(session)
            if (otherPackagesInOldLocation === 0) {
              await Location.findByIdAndUpdate(currentPackageLocationId, { available: true }, { session })
            }
          }
        } else if (originalQuantity !== item.actual_quantity && pkg.batch_id && currentPackageLocationId) {
          const quantityDifference = item.actual_quantity - originalQuantity
          if (quantityDifference > 0) {
            // Quantity increased - log as addition
            await LogLocationChange.create(
              [
                {
                  location_id: currentPackageLocationId,
                  type: "add",
                  batch_id: pkg.batch_id._id,
                  quantity: quantityDifference,
                  inventory_check_order_id: checkOrderId,
                  ware_house_id: checkOrder.warehouse_manager_id,
                },
              ],
              { session },
            )
          } else if (quantityDifference < 0) {
            // Quantity decreased - log as removal
            await LogLocationChange.create(
              [
                {
                  location_id: currentPackageLocationId,
                  type: "remove",
                  batch_id: pkg.batch_id._id,
                  quantity: Math.abs(quantityDifference),
                  inventory_check_order_id: checkOrderId,
                  ware_house_id: checkOrder.warehouse_manager_id,
                },
              ],
              { session },
            )
          }
          if (quantityDifference !== 0) {
            console.log(`Created quantity change log for package ${packageIdString}`)
          }
        }

        const updatedPackage = await Package.findByIdAndUpdate(pkg._id, updateData, { new: true, session })
        console.log(
          `Package ${pkg._id} updated - Type: ${item.type}, Quantity: ${updatedPackage.quantity}, Location: ${updatedPackage.location_id}`,
        )
      }
    }

    // Update the InventoryCheckOrder status to completed
    await InventoryCheckOrder.findByIdAndUpdate(
      checkOrderId,
      { status: INVENTORY_CHECK_ORDER_STATUSES.COMPLETED },
      { new: true, session },
    )

    await session.commitTransaction()
    console.log("Transaction committed successfully")
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
