import {
    InstanceBase,
    runEntrypoint,
    SomeCompanionConfigField,
} from "@companion-module/base";
import { configFields, Config } from "./config";
import { getActions } from "./actions";
import { getFeedbacks, FeedbackId } from "./feedback";
import { getPresetList } from "./presets";
import { Variables } from "./variables";
import { Osc } from "./osc";

export class Instance extends InstanceBase<Config> {
    config: Config = {
        label: "",
        host: "",
        port: 0,
    };

    /**
     * A record of OSC values ([OSC address]: [value]) sent by the server.
     */
    oscValues: Record<string, string | number | undefined> = {};

    variables: Variables;
    osc?: Osc;

    constructor(internal: unknown) {
        super(internal);
        this.variables = new Variables(this);
        this.instanceOptions.disableVariableValidation = true;
    }

    async init(config: Config): Promise<void> {
        this.log("info", `Optimal Audio Zone module is being initialized`);

        await this.configUpdated(config);
    }

    async configUpdated(config: Config): Promise<void> {
        this.config = config;
        this.saveConfig(config);
        this.log("info", "Changing Optimal Audio Zone config");

        this.oscValues = {};
        this.osc?.destroy();
        this.osc = new Osc(this);
        this.updateInstance();
    }

    getConfigFields(): SomeCompanionConfigField[] {
        return configFields;
    }

    async destroy() {
        this.log("debug", `Instance destroyed: ${this.id}`);
        this.osc?.destroy();
    }

    updateInstance(): void {
        this.setVariableDefinitions(this.variables.variableDefinitions);
        this.setVariableValues(this.variables.variableValues);
        this.setActionDefinitions(getActions(this));
        this.setFeedbackDefinitions(getFeedbacks(this));
        this.setPresetDefinitions(getPresetList(this));

        this.checkFeedbacks(FeedbackId.selectedSource);
    }
}

runEntrypoint(Instance, []);
