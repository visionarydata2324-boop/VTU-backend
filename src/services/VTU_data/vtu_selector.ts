import { GsubzService } from "./gsubz";
import { GladTidingsService } from "./gladtidings";
import { ISetting, Setting } from "../../models/current_vtu_service";
import { HydratedDocument } from "mongoose";

// type DryIsettings = HydratedDocument<ISetting>

class VtuSelector {
  private gsubzService: GsubzService;
  private gladTidingsService: GladTidingsService;

  constructor() {
    this.gsubzService = new GsubzService();
    this.gladTidingsService = new GladTidingsService();
    this.initSettingsTable();
  }
  private initSettingsTable = async () => {
    const settings = await Setting.findOne({
      key: { $in: ["gSubz", "gladTidings"] },
    });
    // Check if settings exist for the given networkService
    if (!settings) {
      const newSettings = new Setting({
        key: "vtu_service_selector",
        value: "gladTidings", // Default to gladTidings
        updated_at: new Date(),
      });
    }
  };
  public async getActiveService(): Promise<
    GsubzService | GladTidingsService | undefined
  > {
    let activeService;
    try {
      const currentService = await Setting.findOne({
        key: "vtu_service_selector",
      });
      if (!currentService) {
        throw new Error("Current VTU service not found");
      }

      if (currentService.value === "gSubz") {
        activeService = this.gsubzService;
      } else if (currentService.value === "gladTidings") {
        activeService = this.gladTidingsService;
      }
      return activeService;
    } catch (error: any) {
      return error.message;
    }
  }
}
