import { Request, Response } from "express";

export class OptionsController {
  getDropdownOptions(_req: Request, res: Response) {
    return res.status(200).json({
      success: true,
      data: {
        batteryTypes: [
          { value: "LITHIUM_IRON", label: "Lithium Iron" },
          { value: "LITHIUM_IRON_PHOSPHATE", label: "Lithium Iron Phosphate" },
          { value: "NICKEL_METAL_HYDRIDE", label: "Nickel Metal Hydride" },
          { value: "LEAD_ACID_BATTERIES", label: "Lead Acid Batteries" },
        ],
        deviceStatuses: [
          { value: "ONLINE", label: "Online" },
          { value: "OFFLINE", label: "Offline" },
          { value: "WARNING", label: "Warning" },
          { value: "CRITICAL", label: "Critical" },
          { value: "MAINTENANCE", label: "Maintenance" },
        ],
        alertSeverities: [
          { value: "CRITICAL", label: "Critical" },
          { value: "WARNING", label: "Warning" },
          { value: "INFO", label: "Info" },
        ],
        alertStatuses: [
          { value: "ACTIVE", label: "Active" },
          { value: "ACKNOWLEDGED", label: "Acknowledged" },
          { value: "RESOLVED", label: "Resolved" },
        ],
        userRoles: [
          { value: "ADMIN", label: "Admin" },
          { value: "USER", label: "User" },
        ],
        userStatuses: [
          { value: "Active", label: "Active" },
          { value: "Inactive", label: "Inactive" },
        ],
        assignmentStatuses: [
          { value: "ASSIGNED", label: "Assigned" },
          { value: "UNASSIGNED", label: "Unassigned" },
        ],
      },
    });
  }
}
